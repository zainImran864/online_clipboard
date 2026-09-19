#!/usr/bin/env node

/**
 * Pasteport CLI — Cross-device sharing + Developer Toolkit
 * https://pasteport.zain-imran.com/cli
 *
 * Zero-dependency Node.js CLI tool.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const VERSION = '1.0.0';
const DEFAULT_SERVER = process.env.PASTEPORT_API_URL || 'https://pasteport.zain-imran.com';

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

${colors.bold}COMMANDS:${colors.reset}
  ${colors.green}send${colors.reset} <text|filepath>     Send text or a file to Pasteport and receive a share code
  ${colors.green}get${colors.reset}  <code>              Retrieve shared content or download a file by code
  ${colors.green}version${colors.reset}, -v              Display current CLI version
  ${colors.green}help${colors.reset}, -h                 Display this help reference

${colors.bold}OPTIONS FOR SEND:${colors.reset}
  ${colors.cyan}-p, --pin${colors.reset} <4-char>       Lock clip behind a 4-character PIN
  ${colors.cyan}-e, --expiry${colors.reset} <hours>     Expiration horizon in hours (1-72, default: 24)
  ${colors.cyan}-d, --self-destruct${colors.reset} [pin] Set self-destruct PIN
  ${colors.cyan}--json${colors.reset}                   Output results strictly as machine-readable JSON
  ${colors.cyan}--server${colors.reset} <url>           Override backend server endpoint (default: ${DEFAULT_SERVER})

${colors.bold}OPTIONS FOR GET:${colors.reset}
  ${colors.cyan}-p, --pin${colors.reset} <4-char>       Access PIN for protected clips
  ${colors.cyan}-o, --output${colors.reset} <filepath>   Write retrieved text or downloaded file to destination
  ${colors.cyan}--raw${colors.reset}                    Print raw content directly (ideal for piping)
  ${colors.cyan}--json${colors.reset}                   Output clip metadata and content as JSON
  ${colors.cyan}--server${colors.reset} <url>           Override backend server endpoint

${colors.bold}EXAMPLES:${colors.reset}
  ${colors.dim}# Send inline text snippet:${colors.reset}
  pasteport send "hello world"

  ${colors.dim}# Pipe terminal output:${colors.reset}
  git diff | pasteport send

  ${colors.dim}# Share a file or archive:${colors.reset}
  pasteport send ./build.zip --pin pass

  ${colors.dim}# Retrieve clip content:${colors.reset}
  pasteport get 482193

  ${colors.dim}# Download file / pipe directly:${colors.reset}
  pasteport get 482193 -o ./received.zip
  pasteport get 482193 --raw > config.json
`);
}

// Read all bytes from stdin when piped
async function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => (data += chunk));
        process.stdin.on('end', () => resolve(data));
        process.stdin.on('error', reject);
    });
}

// Prompt terminal user for input
async function promptInput(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        });
    });
}

// Parse command-line args
function parseArgs(args) {
    const parsed = {
        command: '',
        target: '',
        options: {
            pin: '',
            expiry: 24,
            selfDestruct: '',
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
        } else if (arg === '-p' || arg === '--pin') {
            parsed.options.pin = args[++i] || '';
        } else if (arg === '-e' || arg === '--expiry') {
            parsed.options.expiry = Number(args[++i]) || 24;
        } else if (arg === '-d' || arg === '--self-destruct') {
            parsed.options.selfDestruct = args[++i] || 'auto';
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

// Handler for `pasteport send`
async function handleSend(target, options) {
    const server = options.server.replace(/\/$/, '');
    const sendUrl = `${server}/api/cli/send`;

    let contentToSend = target;
    let isFile = false;
    let filePath = '';

    // Check if piped stdin exists
    if (!process.stdin.isTTY) {
        contentToSend = await readStdin();
    } else if (target && fs.existsSync(target)) {
        const stat = fs.statSync(target);
        if (stat.isFile()) {
            isFile = true;
            filePath = path.resolve(target);
        }
    } else if (!contentToSend) {
        contentToSend = await promptInput(`${colors.cyan}Enter text to send to Pasteport:${colors.reset} `);
    }

    if (!contentToSend && !isFile) {
        console.error(`${colors.red}Error: No content or file provided to send.${colors.reset}`);
        process.exit(1);
    }

    try {
        let response;

        if (isFile) {
            const fileName = path.basename(filePath);
            const fileBytes = fs.readFileSync(filePath);
            const form = new FormData();
            const blob = new Blob([fileBytes]);
            form.append('file', blob, fileName);
            form.append('expiryHours', String(options.expiry));
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
                console.error(JSON.stringify({ error: data.error || 'Failed to send' }));
            } else {
                console.error(`${colors.red}Error: ${data.error || 'Failed to create clip'}${colors.reset}`);
            }
            process.exit(1);
        }

        if (options.json) {
            log(JSON.stringify(data, null, 2));
            return;
        }

        // Pretty Human Output
        log('');
        log(`${colors.green}${colors.bold}✔ Clip Created Successfully!${colors.reset}`);
        log(`──────────────────────────────────────────────`);
        log(`  ${colors.bold}Share Code:${colors.reset}  ${colors.blue}${colors.bold}${data.code}${colors.reset}`);
        log(`  ${colors.bold}Direct Link:${colors.reset} ${colors.cyan}${data.url}${colors.reset}`);
        log(`  ${colors.bold}Type:${colors.reset}        ${data.type === 'files' ? `File (${data.file?.name || 'attachment'})` : 'Text snippet'}`);
        log(`  ${colors.bold}Expires:${colors.reset}     ${data.expiresInHours} hours (${new Date(data.expiresAt).toLocaleTimeString()})`);
        if (data.hasAccessPin) {
            log(`  ${colors.bold}Access PIN:${colors.reset}  ${colors.yellow}Locked with 4-char PIN${colors.reset}`);
        }
        log(`──────────────────────────────────────────────`);
        log(`${colors.dim}Retrieve anytime with:${colors.reset} pasteport get ${data.code}\n`);
    } catch (err) {
        console.error(`${colors.red}Network / Connection Error: ${err.message}${colors.reset}`);
        process.exit(1);
    }
}

// Handler for `pasteport get`
async function handleGet(targetCode, options) {
    let code = targetCode;
    if (!code) {
        code = await promptInput(`${colors.cyan}Enter 6-digit Pasteport Code:${colors.reset} `);
    }

    if (!code || code.trim().length === 0) {
        console.error(`${colors.red}Error: A valid 6-digit code is required.${colors.reset}`);
        process.exit(1);
    }

    code = code.trim();
    const server = options.server.replace(/\/$/, '');
    const queryParams = new URLSearchParams({
        code,
        ...(options.pin ? { pin: options.pin } : {}),
        ...(options.raw ? { raw: '1' } : {}),
    });

    const getUrl = `${server}/api/cli/get?${queryParams.toString()}`;

    try {
        const response = await fetch(getUrl);

        // If raw text requested
        if (options.raw) {
            if (response.ok) {
                const rawText = await response.text();
                process.stdout.write(rawText);
                return;
            }
        }

        const data = await response.json();

        // Handle PIN required prompt
        if (response.status === 401 && data.pinRequired && !options.pin) {
            const enteredPin = await promptInput(`${colors.yellow}🔒 This clip requires a 4-character PIN:${colors.reset} `);
            return handleGet(code, { ...options, pin: enteredPin.trim() });
        }

        if (!response.ok) {
            if (options.json) {
                console.error(JSON.stringify({ error: data.error || 'Failed to retrieve clip' }));
            } else {
                console.error(`${colors.red}Error: ${data.error || 'Failed to retrieve clip'}${colors.reset}`);
            }
            process.exit(1);
        }

        if (options.json) {
            log(JSON.stringify(data, null, 2));
            return;
        }

        // Handle Text Clip
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

        // Handle File Clip
        if (data.type === 'files' && data.files && data.files.length > 0) {
            const file = data.files[0];
            log(`\n${colors.bold}── File Clip [Code: ${data.code}] ───────────────────${colors.reset}`);
            log(`  ${colors.bold}Filename:${colors.reset} ${file.name}`);
            log(`  ${colors.bold}Size:${colors.reset}     ${(file.size / 1024).toFixed(1)} KB`);
            log(`  ${colors.bold}Download:${colors.reset} ${colors.cyan}${file.url}${colors.reset}`);
            log(`${colors.bold}──────────────────────────────────────────────${colors.reset}`);

            if (options.output) {
                const outPath = path.resolve(options.output);
                log(`${colors.dim}Downloading ${file.name} to ${outPath}...${colors.reset}`);
                const fileRes = await fetch(file.url);
                if (!fileRes.ok) {
                    throw new Error(`Failed to download file from storage (${fileRes.status})`);
                }
                const buffer = Buffer.from(await fileRes.arrayBuffer());
                fs.writeFileSync(outPath, buffer);
                log(`${colors.green}✔ Download complete: ${outPath}${colors.reset}\n`);
            } else {
                log(`${colors.dim}Tip: Use -o <filename> to download this file directly.${colors.reset}\n`);
            }
            return;
        }

        log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`${colors.red}Network / Retrieval Error: ${err.message}${colors.reset}`);
        process.exit(1);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        printHelp();
        process.exit(0);
    }

    const { command, target, options } = parseArgs(args);

    switch (command.toLowerCase()) {
        case 'send':
            await handleSend(target, options);
            break;
        case 'get':
        case 'read':
        case 'view':
            await handleGet(target, options);
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
    console.error(`${colors.red}Unexpected fatal error: ${err.message}${colors.reset}`);
    process.exit(1);
});
