#!/usr/bin/env node

/**
 * Pasteport CLI — Cross-device sharing + Developer Toolkit
 * https://pasteport.zain-imran.com/cli
 *
 * Zero-dependency Node.js CLI tool with interactive menu,
 * Secret Share (600MB) support, URL parsing, and file downloads.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const VERSION = '1.0.2';
const DEFAULT_SERVER = process.env.PASTEPORT_API_URL || 'https://pasteport.zain-imran.com';
const STANDARD_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const SECURE_MAX_FILE_SIZE = 600 * 1024 * 1024; // 600 MB

// ANSI color helpers
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
};

function log(msg) {
    console.log(msg);
}

function logError(title, details = '', suggestion = '') {
    log('');
    log(`${colors.red}${colors.bold}✖ ERROR: ${title}${colors.reset}`);
    if (details) {
        log(`  ${colors.dim}${details}${colors.reset}`);
    }
    if (suggestion) {
        log(`  ${colors.yellow}💡 Tip: ${suggestion}${colors.reset}`);
    }
    log('');
}

function printBanner() {
    log(`
${colors.blue}${colors.bold}  ██████╗  █████╗ ███████╗████████╗███████╗██████╗  ██████╗ ██████╗ ████████╗
  ██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
  ██████╔╝███████║███████╗   ██║   █████╗  ██████╔╝██║   ██║██████╔╝   ██║   
  ██╔═══╝ ██╔══██║╚════██║   ██║   ██╔══╝  ██╔═══╝ ██║   ██║██╔══██╗   ██║   
  ██║     ██║  ██║███████║   ██║   ███████╗██║     ╚██████╔╝██║  ██║   ██║   
  ╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ${colors.reset}
  ${colors.dim}Cross-device sharing + Developer Toolkit | v${VERSION}${colors.reset}
`);
}

function printHelp() {
    printBanner();
    log(`${colors.bold}USAGE:${colors.reset}
  pasteport <command> [arguments] [options]
  pasteport               (launches interactive menu with options 1, 2, 3, 4)

${colors.bold}COMMANDS:${colors.reset}
  ${colors.green}send${colors.reset} <text|filepath>     Send text or a file (up to 10MB) to Pasteport
  ${colors.green}secret${colors.reset} <code|file>       Send a large file (up to 600MB) using an 8-digit Secret Code
  ${colors.green}get${colors.reset}  <code|url>          Retrieve clip text or download file (accepts code or web URL)
  ${colors.green}delete${colors.reset} <code|url>       Permanently wipe / destroy a clip with optional PIN
  ${colors.green}version${colors.reset}, -v              Display current CLI version
  ${colors.green}help${colors.reset}, -h                 Display this reference

${colors.bold}OPTIONS FOR SEND:${colors.reset}
  ${colors.cyan}-p, --pin${colors.reset} <4-char>       Lock clip behind a 4-character PIN
  ${colors.cyan}-e, --expiry${colors.reset} <hours>     Expiration horizon in hours (1-72, default: 24)
  ${colors.cyan}-d, --self-destruct${colors.reset} [pin] Set self-destruct PIN
  ${colors.cyan}-n, --note${colors.reset} <text>        Accompanying text note for file upload
  ${colors.cyan}--json${colors.reset}                   Output results strictly as machine-readable JSON
  ${colors.cyan}--server${colors.reset} <url>           Override backend server endpoint (default: ${DEFAULT_SERVER})

${colors.bold}OPTIONS FOR GET:${colors.reset}
  ${colors.cyan}-p, --pin${colors.reset} <4-char>       Access PIN for protected clips
  ${colors.cyan}-o, --output${colors.reset} <filepath>   Save retrieved text or downloaded file to destination path
  ${colors.cyan}--raw${colors.reset}                    Print raw content directly to stdout (ideal for Unix pipes)
  ${colors.cyan}--json${colors.reset}                   Output clip metadata and content as JSON
  ${colors.cyan}--server${colors.reset} <url>           Override backend server endpoint

${colors.bold}INSTALLATION & EXECUTION (npm, pnpm, bun, pip):${colors.reset}
  ${colors.dim}# Global Install (Node.js & Python):${colors.reset}
  npm install -g pasteport-zisphere
  pnpm add -g pasteport-zisphere
  bun add -g pasteport-zisphere
  pip install pasteport-zisphere

  ${colors.dim}# Run immediately without installing:${colors.reset}
  npx pasteport-zisphere send "hello world"
  pnpm dlx pasteport-zisphere send "hello world"
  bunx pasteport-zisphere send "hello world"

  ${colors.dim}# Install from local source:${colors.reset}
  npm install -g ./cli
  pip install ./python

  ${colors.dim}# Uninstall from system:${colors.reset}
  npm uninstall -g pasteport-zisphere
  pnpm remove -g pasteport-zisphere
  bun remove -g pasteport-zisphere
  pip uninstall pasteport-zisphere

${colors.bold}EXAMPLES:${colors.reset}
  ${colors.dim}# Send inline text snippet:${colors.reset}
  pasteport send "hello world"

  ${colors.dim}# Pipe terminal output or git diff:${colors.reset}
  git diff | pasteport send

  ${colors.dim}# Share a file (up to 10 MB):${colors.reset}
  pasteport send ./document.pdf --pin 1234

  ${colors.dim}# Share a large file (up to 600 MB) with Secret Access Code:${colors.reset}
  pasteport secret 88392014 ./release.zip

  ${colors.dim}# Retrieve clip using a 6-digit code or web URL:${colors.reset}
  pasteport get 482193
  pasteport get https://pasteport.zain-imran.com/view/482193 -o ./downloaded.pdf
  pasteport get https://pasteport.zain-imran.com/secure?code=88392014 -o ./release.zip

  ${colors.dim}# Delete a clip immediately:${colors.reset}
  pasteport delete 482193 --pin 1234
`);
}

// Read stdin when piped
async function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => (data += chunk));
        process.stdin.on('end', () => resolve(data));
        process.stdin.on('error', reject);
    });
}

// Prompt terminal user for single-line input
function createRl() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

async function promptInput(query, existingRl = null) {
    const rl = existingRl || createRl();
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            if (!existingRl) rl.close();
            resolve(ans);
        });
    });
}

// Extract clean 6 or 8-digit code from string or full URL
function extractCode(input) {
    if (!input || typeof input !== 'string') return '';
    const clean = input.trim();

    // Check if input is a URL
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
        try {
            const parsed = new URL(clean);
            // Case 1: /secure?code=88392014 or ?code=482193
            const paramCode = parsed.searchParams.get('code');
            if (paramCode) return paramCode.trim();

            // Case 2: /view/482193
            const segments = parsed.pathname.split('/').filter(Boolean);
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && lastSegment !== 'view' && lastSegment !== 'secure') {
                return lastSegment.trim();
            }
        } catch {
            // fallback to regex matching
        }
    }

    // Match code pattern (6 to 8 alphanumeric characters)
    const match = clean.match(/[A-Za-z0-9]{6,8}/);
    return match ? match[0] : clean;
}

// Parse CLI command-line arguments
function parseArgs(args) {
    const parsed = {
        command: '',
        target: '',
        extraTarget: '',
        options: {
            pin: '',
            expiry: 24,
            selfDestruct: '',
            textNote: '',
            output: '',
            raw: false,
            json: false,
            server: DEFAULT_SERVER,
        },
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        if (!parsed.command && !arg.startsWith('-')) {
            parsed.command = arg;
        } else if (!parsed.target && !arg.startsWith('-')) {
            parsed.target = arg;
        } else if (!parsed.extraTarget && !arg.startsWith('-')) {
            parsed.extraTarget = arg;
        } else if (arg === '-p' || arg === '--pin') {
            parsed.options.pin = args[++i] || '';
        } else if (arg === '-e' || arg === '--expiry') {
            parsed.options.expiry = Number(args[++i]) || 24;
        } else if (arg === '-d' || arg === '--self-destruct') {
            parsed.options.selfDestruct = args[++i] || 'auto';
        } else if (arg === '-n' || arg === '--note') {
            parsed.options.textNote = args[++i] || '';
        } else if (arg === '-o' || arg === '--output') {
            parsed.options.output = args[++i] || '';
        } else if (arg === '--raw') {
            parsed.options.raw = true;
        } else if (arg === '--json') {
            parsed.options.json = true;
        } else if (arg === '--server') {
            parsed.options.server = args[++i] || DEFAULT_SERVER;
        } else if (arg === '-v' || arg === '--version' || arg === 'version') {
            parsed.command = 'version';
        } else if (arg === '-h' || arg === '--help' || arg === 'help') {
            parsed.command = 'help';
        }
        i++;
    }

    return parsed;
}

// Handler for Option 1 / `pasteport send`
async function handleSend(target, options, existingRl = null) {
    const server = options.server.replace(/\/$/, '');
    const sendUrl = `${server}/api/cli/send`;

    let contentToSend = target;
    let isFile = false;
    let filePath = '';

    // Check if target is a local file
    if (target && typeof target === 'string') {
        const clean = target.trim().replace(/^["']|["']$/g, '');
        if (fs.existsSync(clean)) {
            const stat = fs.statSync(clean);
            if (stat.isFile()) {
                isFile = true;
                filePath = path.resolve(clean);
            }
        }
    } else if (!target && !process.stdin.isTTY) {
        // Read piped stdin only when no target argument was supplied
        contentToSend = await readStdin();
    } else if (!contentToSend) {
        contentToSend = await promptInput(`${colors.cyan}Enter text to send to Pasteport:${colors.reset} `, existingRl);
    }

    if (!contentToSend && !isFile) {
        logError('No content or file provided', 'You must provide text or a valid file path to send.', 'Example: pasteport send "hello world" or pasteport send ./archive.zip');
        process.exit(1);
    }

    try {
        let response;

        if (isFile) {
            const fileName = path.basename(filePath);
            const stat = fs.statSync(filePath);

            if (stat.size > STANDARD_MAX_FILE_SIZE) {
                logError(
                    `File exceeds standard 10 MB limit (${(stat.size / (1024 * 1024)).toFixed(1)} MB)`,
                    'Standard shares support files up to 10 MB.',
                    'For files up to 600 MB, use Secret Share: pasteport secret <8-digit-code> ' + filePath
                );
                process.exit(1);
            }

            const fileBytes = fs.readFileSync(filePath);
            const form = new FormData();
            const blob = new Blob([fileBytes]);
            form.append('file', blob, fileName);
            form.append('expiryHours', String(options.expiry));
            if (options.textNote) form.append('text', options.textNote);
            if (options.pin) form.append('accessPin', options.pin);
            if (options.selfDestruct) form.append('deletePin', options.selfDestruct);

            if (!options.json) {
                log(`${colors.dim}Uploading file ${fileName} (${(fileBytes.length / 1024).toFixed(1)} KB)...${colors.reset}`);
            }

            response = await fetch(sendUrl, {
                method: 'POST',
                body: form,
            });
        } else {
            const payload = {
                text: contentToSend,
                expiryHours: options.expiry,
                accessPin: options.pin || null,
                deletePin: options.selfDestruct || null,
            };

            response = await fetch(sendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        const data = await response.json();

        if (!response.ok) {
            if (options.json) {
                console.error(JSON.stringify({ error: data.error || 'Failed to create clip' }));
            } else {
                logError(data.error || 'Failed to create clip', 'Backend rejected the upload request.');
            }
            process.exit(1);
        }

        if (options.json) {
            log(JSON.stringify(data, null, 2));
            return;
        }

        // Pretty Output
        log('');
        log(`${colors.green}${colors.bold}✔ Clip Created Successfully!${colors.reset}`);
        log(`──────────────────────────────────────────────`);
        log(`  ${colors.bold}Share Code:${colors.reset}  ${colors.blue}${colors.bold}${data.code}${colors.reset}`);
        log(`  ${colors.bold}Direct Link:${colors.reset} ${colors.cyan}${data.url}${colors.reset}`);
        log(`  ${colors.bold}Type:${colors.reset}        ${data.type === 'files' ? `File (${data.file?.name || 'attachment'})` : 'Text snippet'}`);
        log(`  ${colors.bold}Expires:${colors.reset}     ${data.expiresInHours} hours (${new Date(data.expiresAt).toLocaleTimeString()})`);
        if (data.hasAccessPin) {
            log(`  ${colors.bold}Access PIN:${colors.reset}  ${colors.yellow}Locked with 4-character PIN${colors.reset}`);
        }
        log(`──────────────────────────────────────────────`);
        log(`${colors.dim}Retrieve anytime with:${colors.reset} pasteport get ${data.code}`);
        log(`${colors.dim}Or paste direct link into CLI:${colors.reset} pasteport get ${data.url}\n`);
    } catch (err) {
        logError('Network / Connection Failure', err.message, 'Verify internet connectivity and server availability.');
        process.exit(1);
    }
}

// Handler for Option 2 / `pasteport secret`
async function handleSecretShare(arg1, arg2, options, existingRl = null) {
    const server = options.server.replace(/\/$/, '');

    let accessCode = '';
    let filePath = '';

    // If first arg looks like 8-digit code and second arg is file
    if (arg1 && arg1.length === 8 && !fs.existsSync(arg1) && arg2 && fs.existsSync(arg2)) {
        accessCode = arg1;
        filePath = path.resolve(arg2);
    } else if (arg1 && fs.existsSync(arg1)) {
        filePath = path.resolve(arg1);
        accessCode = arg2;
    } else {
        accessCode = arg1;
        filePath = arg2;
    }

    if (!accessCode) {
        log(`\n${colors.magenta}${colors.bold}🔒 Pasteport Secret Share (Gated 600 MB Storage)${colors.reset}`);
        log(`${colors.dim}To protect against abuse, Secret Share uploads (>10 MB up to 600 MB) require a one-time 8-digit access code.`);
        log(`You can generate an access code on the web at: ${server}/secure${colors.reset}\n`);

        const hasCode = await promptInput(`${colors.cyan}Do you have an 8-digit Secret Access Code? [y/N]:${colors.reset} `, existingRl);
        if (!hasCode.toLowerCase().startsWith('y')) {
            log(`\n${colors.yellow}No problem! You can use Option 1 (Standard Share) for files up to 10 MB with zero code required.${colors.reset}`);
            log(`If you need to send up to 600 MB, open ${colors.cyan}${server}/secure${colors.reset} to mint an 8-digit access code.\n`);
            return;
        }

        accessCode = await promptInput(`${colors.cyan}Enter your 8-digit Secret Access Code:${colors.reset} `, existingRl);
    }

    accessCode = accessCode.trim();
    if (accessCode.length !== 8) {
        logError('Invalid Access Code', `Secret access codes must be exactly 8 digits (received "${accessCode}").`, `Generate an access code on ${server}/secure.`);
        process.exit(1);
    }

    if (!filePath) {
        filePath = await promptInput(`${colors.cyan}Enter path to the file to upload (up to 600 MB):${colors.reset} `, existingRl);
    }

    if (!filePath || !fs.existsSync(filePath)) {
        logError('File Not Found', `The file at "${filePath}" could not be located.`, 'Ensure you provide a valid path to an existing file.');
        process.exit(1);
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
        logError('Not A File', `"${filePath}" is a directory, not a file.`, 'Please specify a file or archive (e.g. .zip).');
        process.exit(1);
    }

    if (stat.size > SECURE_MAX_FILE_SIZE) {
        logError(`File Exceeds 600 MB Limit (${(stat.size / (1024 * 1024)).toFixed(1)} MB)`, 'Maximum allowed file size for Secret Share is 600 MB.');
        process.exit(1);
    }

    const fileName = path.basename(filePath);
    const fileSize = stat.size;
    const contentType = 'application/octet-stream';

    if (!options.json) {
        log(`\n${colors.dim}Step 1/3: Authorizing secret access code ${accessCode}...${colors.reset}`);
    }

    try {
        // 1. Authorize
        const authRes = await fetch(`${server}/api/secure/authorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accessCode,
                fileName,
                fileType: contentType,
                fileSize,
            }),
        });

        const authData = await authRes.json();
        if (!authRes.ok) {
            logError('Authorization Failed', authData.error || 'Access code is invalid or has already been used.', `Generate a fresh access code at ${server}/secure`);
            process.exit(1);
        }

        const { storageKey, uploadUrl } = authData;

        // 2. Direct upload to R2
        if (!options.json) {
            log(`${colors.dim}Step 2/3: Streaming ${fileName} (${(fileSize / (1024 * 1024)).toFixed(1)} MB) directly to Cloudflare R2...${colors.reset}`);
        }

        const fileBytes = fs.readFileSync(filePath);
        const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
            },
            body: fileBytes,
        });

        if (!putRes.ok) {
            logError('R2 Direct Upload Failed', `Cloudflare R2 returned HTTP ${putRes.status}`);
            process.exit(1);
        }

        // 3. Finalize
        if (!options.json) {
            log(`${colors.dim}Step 3/3: Finalizing upload and generating Send Code...${colors.reset}`);
        }

        const finalizeRes = await fetch(`${server}/api/secure/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accessCode,
                storageKey,
                fileName,
                fileType: contentType,
                fileSize,
            }),
        });

        const finalizeData = await finalizeRes.json();
        if (!finalizeRes.ok) {
            logError('Finalization Failed', finalizeData.error || 'Could not mint send code.');
            process.exit(1);
        }

        const sendCode = finalizeData.sendCode;
        const secretUrl = `${server}/secure?code=${sendCode}`;

        if (options.json) {
            log(JSON.stringify({ success: true, sendCode, url: secretUrl, fileName, fileSize }, null, 2));
            return;
        }

        // Pretty Output
        log('');
        log(`${colors.green}${colors.bold}✔ Secret Share Upload Complete!${colors.reset}`);
        log(`──────────────────────────────────────────────`);
        log(`  ${colors.bold}Secret Send Code:${colors.reset} ${colors.magenta}${colors.bold}${sendCode}${colors.reset}`);
        log(`  ${colors.bold}Direct Link:${colors.reset}      ${colors.cyan}${secretUrl}${colors.reset}`);
        log(`  ${colors.bold}File Uploaded:${colors.reset}    ${fileName} (${(fileSize / (1024 * 1024)).toFixed(1)} MB)`);
        log(`  ${colors.bold}Lifespan:${colors.reset}         6 hours (auto-purged from R2 afterwards)`);
        log(`──────────────────────────────────────────────`);
        log(`${colors.dim}The recipient can download via browser or terminal:${colors.reset}`);
        log(`  pasteport get ${sendCode} -o ./${fileName}`);
        log(`  pasteport get ${secretUrl} -o ./${fileName}\n`);
    } catch (err) {
        logError('Secret Share Failed', err.message, 'Check your connection and ensure the access code is valid.');
        process.exit(1);
    }
}

// Handler for Option 3 / `pasteport get`
async function handleGet(targetInput, options, existingRl = null) {
    let input = targetInput;
    if (!input) {
        input = await promptInput(`${colors.cyan}Enter 6-digit Code or Pasteport URL:${colors.reset} `, existingRl);
    }

    if (!input || input.trim().length === 0) {
        logError('Code or URL Required', 'You must supply a 6-digit code or a Pasteport web link.', 'Example: pasteport get 482193 or pasteport get https://pasteport.zain-imran.com/view/482193');
        process.exit(1);
    }

    const code = extractCode(input);
    const server = options.server.replace(/\/$/, '');

    // Check if input was specifically a /secure link or an 8-digit code (Secret Share)
    const isSecureShareHint = input.includes('/secure') || code.length === 8;

    if (!options.json && !options.raw) {
        log(`${colors.dim}Looking up clip "${code}" on ${server}...${colors.reset}`);
    }

    // Try Standard Share endpoint first (or Secret Share if hint present)
    try {
        if (isSecureShareHint) {
            // Attempt Secret Share download first
            const secRes = await fetch(`${server}/api/secure/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sendCode: code }),
            });

            if (secRes.ok) {
                const secData = await secRes.json();
                return await handleFileDownloadResult(secData, options);
            }
        }

        // Standard Clip Fetch
        const queryParams = new URLSearchParams({
            code,
            ...(options.pin ? { pin: options.pin } : {}),
            ...(options.raw ? { raw: '1' } : {}),
        });

        const response = await fetch(`${server}/api/cli/get?${queryParams.toString()}`);

        if (options.raw && response.ok) {
            const rawText = await response.text();
            process.stdout.write(rawText);
            return;
        }

        const data = await response.json();

        // Check if PIN required
        if (response.status === 401 && data.pinRequired && !options.pin) {
            const enteredPin = await promptInput(`${colors.yellow}🔒 This clip is protected by a 4-character PIN:${colors.reset} `, existingRl);
            return handleGet(code, { ...options, pin: enteredPin.trim() }, existingRl);
        }

        // If not found in standard clips, try secret share download as fallback
        if (response.status === 404 && !isSecureShareHint) {
            const secRes = await fetch(`${server}/api/secure/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sendCode: code }),
            });

            if (secRes.ok) {
                const secData = await secRes.json();
                return await handleFileDownloadResult(secData, options);
            }
        }

        if (!response.ok) {
            if (options.json) {
                console.error(JSON.stringify({ error: data.error || 'Failed to retrieve clip' }));
            } else {
                logError(data.error || 'Clip Not Found', `Code "${code}" could not be resolved.`, 'Verify that the code is correct and has not expired.');
            }
            process.exit(1);
        }

        if (options.json) {
            log(JSON.stringify(data, null, 2));
            return;
        }

        // Text Clip
        if (data.type === 'text') {
            if (options.output) {
                const outPath = path.resolve(options.output);
                fs.writeFileSync(outPath, data.content || '', 'utf-8');
                log(`${colors.green}✔ Saved text clip to ${outPath}${colors.reset}`);
            } else {
                log(`\n${colors.bold}── Text Clip [Code: ${data.code}] ───────────────────${colors.reset}`);
                log(data.content);
                log(`${colors.bold}──────────────────────────────────────────────${colors.reset}\n`);
            }
            return;
        }

        // File Clip
        if (data.type === 'files' && data.files && data.files.length > 0) {
            const file = data.files[0];
            return await handleFileDownloadResult({
                code: data.code,
                fileName: file.name,
                fileSize: file.size,
                url: file.url,
            }, options);
        }
    } catch (err) {
        logError('Retrieval Failed', err.message, 'Check your connection to ' + server);
        process.exit(1);
    }
}

// Download file helper
async function handleFileDownloadResult(data, options) {
    const fileName = data.fileName || 'downloaded_file';
    const fileSize = data.fileSize || 0;
    const downloadUrl = data.url;

    log(`\n${colors.bold}── File Clip [Code: ${data.code || data.sendCode || 'Active'}] ───────────────────${colors.reset}`);
    log(`  ${colors.bold}Filename:${colors.reset} ${fileName}`);
    log(`  ${colors.bold}Size:${colors.reset}     ${(fileSize / 1024).toFixed(1)} KB (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
    log(`  ${colors.bold}Storage:${colors.reset}  Cloudflare R2 Object`);
    log(`  ${colors.bold}Direct:${colors.reset}   ${colors.cyan}${downloadUrl}${colors.reset}`);
    log(`${colors.bold}──────────────────────────────────────────────${colors.reset}`);

    const destination = options.output || `./${fileName}`;
    const outPath = path.resolve(destination);

    log(`${colors.dim}Downloading ${fileName} to ${outPath}...${colors.reset}`);
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) {
        throw new Error(`Failed to download binary stream from storage (HTTP ${fileRes.status})`);
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    log(`${colors.green}${colors.bold}✔ Download complete: ${outPath}${colors.reset}\n`);
}

// Handler for Option 4 / `pasteport delete`
async function handleDelete(targetInput, options, existingRl = null) {
    let input = targetInput;
    if (!input) {
        input = await promptInput(`${colors.cyan}Enter 6-digit Code or Pasteport URL to delete:${colors.reset} `, existingRl);
    }

    if (!input || input.trim().length === 0) {
        logError('Code or URL Required', 'Please supply a code or share link to delete.');
        process.exit(1);
    }

    const code = extractCode(input);
    let pin = options.pin;

    if (!pin) {
        pin = await promptInput(`${colors.cyan}Enter Self-Destruct PIN (press Enter if none set):${colors.reset} `, existingRl);
    }

    const server = options.server.replace(/\/$/, '');
    const deleteUrl = `${server}/api/clips/delete`;

    try {
        log(`${colors.dim}Requesting permanent deletion for clip "${code}"...${colors.reset}`);
        const response = await fetch(deleteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                pin: pin ? pin.trim() : undefined,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            logError(data.error || 'Deletion Failed', `Server refused deletion for clip "${code}".`, 'Verify your Self-Destruct PIN or check if clip was already deleted.');
            process.exit(1);
        }

        log('');
        log(`${colors.green}${colors.bold}✔ Clip "${code}" Permanently Destroyed!${colors.reset}`);
        log(`${colors.dim}Metadata in Firestore and associated Cloudflare R2 objects wiped instantly.${colors.reset}\n`);
    } catch (err) {
        logError('Deletion Failed', err.message);
        process.exit(1);
    }
}

// Interactive Mode (Options 1, 2, 3, 4, 5)
async function runInteractiveMenu(options) {
    printBanner();
    const rl = createRl();

    log(`${colors.bold}Select an action by typing 1, 2, 3, or 4:${colors.reset}\n`);
    log(`  ${colors.green}[1]${colors.reset} ${colors.bold}Standard Share${colors.reset}  — Send text snippet or file (${colors.dim}up to 10 MB${colors.reset})`);
    log(`  ${colors.magenta}[2]${colors.reset} ${colors.bold}Secret Share${colors.reset}    — Send large file (${colors.dim}up to 600 MB via 8-digit Code${colors.reset})`);
    log(`  ${colors.cyan}[3]${colors.reset} ${colors.bold}Retrieve / Get${colors.reset}  — View text or download file (${colors.dim}Code or Web URL${colors.reset})`);
    log(`  ${colors.red}[4]${colors.reset} ${colors.bold}Delete / Wipe${colors.reset}   — Permanently destroy a clip with Self-Destruct PIN`);
    log(`  ${colors.dim}[5] Exit${colors.reset}\n`);

    const choice = (await promptInput(`${colors.blue}Choose option [1-5]:${colors.reset} `, rl)).trim();

    switch (choice) {
        case '1':
            log(`\n${colors.bold}── [Option 1] Standard Share (up to 10 MB) ──${colors.reset}`);
            log(`  ${colors.green}[1]${colors.reset} Send a File (from your computer)`);
            log(`  ${colors.cyan}[2]${colors.reset} Send Text Snippet`);
            const subChoice = (await promptInput(`${colors.blue}Choose [1/2, default: 1]:${colors.reset} `, rl)).trim() || '1';

            if (subChoice === '1' || subChoice.toLowerCase() === 'f' || subChoice.toLowerCase() === 'file') {
                const filePathInput = await promptInput(`${colors.cyan}Enter path to local file:${colors.reset} `, rl);
                const cleanPath = filePathInput.trim().replace(/^["']|["']$/g, '');

                if (!cleanPath || !fs.existsSync(cleanPath)) {
                    logError('File Not Found', `No file found at: "${cleanPath}". Please check the path and try again.`);
                    break;
                }
                const stat = fs.statSync(cleanPath);
                if (!stat.isFile()) {
                    logError('Not a File', `"${cleanPath}" is a directory. Please provide a path to a file.`);
                    break;
                }
                const sizeStr = stat.size >= 1024 * 1024 ? `${(stat.size / (1024 * 1024)).toFixed(2)} MB` : `${(stat.size / 1024).toFixed(1)} KB`;
                log(`${colors.green}✔ Found local file:${colors.reset} ${colors.bold}${path.basename(cleanPath)}${colors.reset} (Size: ${sizeStr})`);

                const note = await promptInput(`${colors.cyan}Optional accompanying note/description (press Enter to skip):${colors.reset} `, rl);
                const pin = await promptInput(`${colors.cyan}Optional 4-character PIN lock (press Enter to skip):${colors.reset} `, rl);
                const exp = await promptInput(`${colors.cyan}Lifespan in hours [default: 24]:${colors.reset} `, rl);
                await handleSend(cleanPath, {
                    ...options,
                    textNote: note.trim(),
                    pin: pin.trim(),
                    expiry: Number(exp) || 24,
                }, rl);
            } else {
                const text = await promptInput(`${colors.cyan}Enter text to send to Pasteport:${colors.reset} `, rl);
                const pin = await promptInput(`${colors.cyan}Optional 4-character PIN lock (press Enter to skip):${colors.reset} `, rl);
                const exp = await promptInput(`${colors.cyan}Lifespan in hours [default: 24]:${colors.reset} `, rl);
                await handleSend(text, {
                    ...options,
                    pin: pin.trim(),
                    expiry: Number(exp) || 24,
                }, rl);
            }
            break;
        case '2':
            await handleSecretShare('', '', options, rl);
            break;
        case '3':
            log(`\n${colors.bold}── [Option 3] Retrieve / Download File ──${colors.reset}`);
            await handleGet('', options, rl);
            break;
        case '4':
            log(`\n${colors.bold}── [Option 4] Delete / Wipe Clip ──${colors.reset}`);
            await handleDelete('', options, rl);
            break;
        case '5':
        case 'q':
        case 'exit':
            log(`${colors.dim}Exiting Pasteport CLI. Goodbye!${colors.reset}`);
            break;
        default:
            logError('Invalid Selection', `"${choice}" is not a recognized option. Please choose 1, 2, 3, 4, or 5.`);
            break;
    }

    rl.close();
}

// Main CLI Entry
async function main() {
    const args = process.argv.slice(2);

    // If no arguments provided and terminal is interactive: show Options 1 2 3 4
    if (args.length === 0) {
        if (process.stdin.isTTY) {
            await runInteractiveMenu({ server: DEFAULT_SERVER });
        } else {
            // Piped data: default to send
            const pipedContent = await readStdin();
            await handleSend(pipedContent, { server: DEFAULT_SERVER, expiry: 24 });
        }
        return;
    }

    const { command, target, extraTarget, options } = parseArgs(args);

    switch (command.toLowerCase()) {
        case 'interactive':
        case 'menu':
            await runInteractiveMenu(options);
            break;
        case 'send':
            await handleSend(target, options);
            break;
        case 'secret':
        case 'secure':
            await handleSecretShare(target, extraTarget, options);
            break;
        case 'get':
        case 'read':
        case 'download':
            await handleGet(target, options);
            break;
        case 'delete':
        case 'destroy':
        case 'wipe':
            await handleDelete(target, options);
            break;
        case 'version':
            log(`Pasteport CLI v${VERSION}`);
            break;
        case 'help':
        default:
            printHelp();
            break;
    }
}

main().catch((err) => {
    logError('Unexpected Fatal CLI Error', err.message);
    process.exit(1);
});
