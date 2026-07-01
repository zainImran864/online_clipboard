import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { doc, increment, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createR2StorageKey, getR2PublicUrl, uploadToR2 } from '@/lib/r2Storage';

export const runtime = 'nodejs';

const INLINE_FIRESTORE_LIMIT = 800 * 1024;
const DAILY_UPLOAD_LIMIT = 10 * 1024 * 1024;
const QUOTA_COLLECTION = 'clips';

const ALLOWED_TYPES = [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/xml',
    'text/csv',
    'text/markdown',
    'application/pdf',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-javascript',
    'application/x-python-code',
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];

const ALLOWED_EXTENSIONS = [
    '.txt', '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx',
    '.json', '.xml', '.md', '.py', '.java', '.c', '.cpp', '.h',
    '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sql',
    '.sh', '.bash', '.yml', '.yaml', '.env', '.gitignore', '.conf',
    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.zip',
    '.rar', '.csv', '.cvs', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
];

function getClientIp(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return (
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-real-ip') ||
        forwardedFor ||
        'unknown'
    );
}

/**
 * Identifier the daily quota is scoped to.
 *
 * Derived purely server-side from the request (IP + User-Agent), never from
 * anything stored in the browser. This means clearing site data / localStorage
 * / cookies cannot reset the quota, while still giving different devices or
 * browsers behind the same shared IP their own 10MB allowance (different
 * User-Agent → different bucket).
 */
function getQuotaSubject(request: Request) {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent')?.trim() || 'unknown-agent';
    return `ip:${ip}|ua:${userAgent}`;
}

function getQuotaHash(subject: string) {
    const secret =
        process.env.QUOTA_HASH_SECRET ||
        process.env.CRON_SECRET ||
        process.env.R2_SECRET_ACCESS_KEY ||
        'local-dev-quota-secret';

    return createHash('sha256').update(`${secret}:${subject}`).digest('hex');
}

function getUtcDay() {
    return new Date().toISOString().slice(0, 10);
}

function validateFile(file: File) {
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isAllowedType = ALLOWED_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);
    const isEmptyMimeType = !file.type || file.type === '';

    return isAllowedType || isAllowedExt || isEmptyMimeType;
}

async function reserveDailyQuota(request: Request, fileSize: number) {
    const day = getUtcDay();
    const ipHash = getQuotaHash(getQuotaSubject(request));
    const quotaRef = doc(db, QUOTA_COLLECTION, `_quota_${day}_${ipHash}`);
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    return runTransaction(db, async (transaction) => {
        const quotaDoc = await transaction.get(quotaRef);
        const usedBytes = quotaDoc.exists() ? Number(quotaDoc.data()?.usedBytes || 0) : 0;
        const remainingBytes = Math.max(0, DAILY_UPLOAD_LIMIT - usedBytes);

        if (fileSize > DAILY_UPLOAD_LIMIT) {
            return { allowed: false, usedBytes, remainingBytes };
        }

        if (usedBytes + fileSize > DAILY_UPLOAD_LIMIT) {
            return { allowed: false, usedBytes, remainingBytes };
        }

        const nextUsedBytes = usedBytes + fileSize;

        if (quotaDoc.exists()) {
            transaction.update(quotaRef, {
                usedBytes: increment(fileSize),
                updatedAt: serverTimestamp(),
            });
        } else {
            transaction.set(quotaRef, {
                type: 'quota',
                ipHash,
                day,
                usedBytes: nextUsedBytes,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                expiresAt,
            });
        }

        return {
            allowed: true,
            usedBytes: nextUsedBytes,
            remainingBytes: DAILY_UPLOAD_LIMIT - nextUsedBytes,
        };
    });
}

async function refundDailyQuota(request: Request, fileSize: number) {
    const day = getUtcDay();
    const ipHash = getQuotaHash(getQuotaSubject(request));
    const quotaRef = doc(db, QUOTA_COLLECTION, `_quota_${day}_${ipHash}`);

    await runTransaction(db, async (transaction) => {
        const quotaDoc = await transaction.get(quotaRef);
        if (!quotaDoc.exists()) return;

        const usedBytes = Number(quotaDoc.data()?.usedBytes || 0);
        transaction.update(quotaRef, {
            usedBytes: Math.max(0, usedBytes - fileSize),
            updatedAt: serverTimestamp(),
        });
    });
}

function arrayBufferToDataUrl(arrayBuffer: ArrayBuffer, contentType: string) {
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!validateFile(file)) {
            return NextResponse.json(
                { error: 'File type not supported. Please upload text, code, archives, Office, PDF, or image files.' },
                { status: 400 }
            );
        }

        if (file.size > DAILY_UPLOAD_LIMIT) {
            return NextResponse.json({ error: 'File size must be 10MB or less' }, { status: 400 });
        }

        const quota = await reserveDailyQuota(request, file.size);

        if (!quota.allowed) {
            return NextResponse.json(
                {
                    error: 'Daily upload limit exceeded. You can upload up to 10MB per day.',
                    remainingBytes: quota.remainingBytes,
                },
                { status: 429 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const fileType = file.type || 'application/octet-stream';

        if (file.size <= INLINE_FIRESTORE_LIMIT) {
            return NextResponse.json({
                url: arrayBufferToDataUrl(arrayBuffer, fileType),
                fileName: file.name,
                fileType,
                fileSize: file.size,
                storageProvider: 'firebase-inline',
                remainingBytes: quota.remainingBytes,
            });
        }

        const storageKey = createR2StorageKey(file.name);

        try {
            await uploadToR2({
                storageKey,
                body: Buffer.from(arrayBuffer),
                contentType: fileType,
            });
        } catch (error) {
            await refundDailyQuota(request, file.size);
            throw error;
        }

        return NextResponse.json({
            url: getR2PublicUrl(storageKey),
            fileName: file.name,
            fileType,
            fileSize: file.size,
            storageProvider: 'r2',
            storageKey,
            remainingBytes: quota.remainingBytes,
        });
    } catch (error) {
        console.error('File upload failed:', error);
        const message = error instanceof Error ? error.message : 'Failed to upload file';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
