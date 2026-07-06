// Mints a one-time 8-digit secret access code for the "Secret Share" feature.
//
// This is intentionally a LOCAL-ONLY tool: there is no web endpoint that
// generates codes, so end users cannot mint their own. You run it, then share
// the printed code with a trusted user out-of-band.
//
// Usage (Node 20.6+, from the project root):
//   node --env-file=.env scripts/gen-code.mjs
//   node --env-file=.env scripts/gen-code.mjs "note about who this is for"
//
// Or via npm:  npm run gen-code -- "note"

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
        '\nMissing Firebase env vars. Run with:\n  node --env-file=.env scripts/gen-code.mjs\n'
    );
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateCode() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function isTaken(code) {
    const snapshot = await getDocs(query(collection(db, 'accessCodes'), where('code', '==', code)));
    return !snapshot.empty;
}

async function main() {
    let code = generateCode();
    while (await isTaken(code)) {
        code = generateCode();
    }

    const note = process.argv.slice(2).join(' ').trim();

    await addDoc(collection(db, 'accessCodes'), {
        code,
        used: false,
        createdAt: serverTimestamp(),
        ...(note ? { note } : {}),
    });

    console.log('\n  Secret access code:  ' + code);
    console.log('  One-time use · unlocks a single upload up to 600MB' + (note ? '\n  Note: ' + note : ''));
    console.log('  Share this code with the intended uploader out-of-band.\n');

    process.exit(0);
}

main().catch((err) => {
    console.error('Failed to generate code:', err);
    process.exit(1);
});
