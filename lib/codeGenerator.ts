import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Generates a unique 6-digit numeric code
 * @returns Promise<string> - A unique 6-digit code
 */
export async function generateUniqueCode(): Promise<string> {
    const generateCode = (): string => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    let code = generateCode();
    let isUnique = false;

    // Keep generating until we find a unique code
    while (!isUnique) {
        const clipsRef = collection(db, 'clips');
        const q = query(clipsRef, where('code', '==', code));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            isUnique = true;
        } else {
            code = generateCode();
        }
    }

    return code;
}

/**
 * Generates a unique 8-digit numeric code, checking `field` in `collectionName`
 * for collisions. Used for secret-share send codes (and by the local
 * access-code minting script).
 */
export async function generateUnique8DigitCode(
    collectionName: string,
    field: string
): Promise<string> {
    const generateCode = (): string => {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    };

    let code = generateCode();

    // Keep generating until we find a code not already present.
    while (true) {
        const ref = collection(db, collectionName);
        const q = query(ref, where(field, '==', code));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return code;
        }

        code = generateCode();
    }
}
