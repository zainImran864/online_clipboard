// Central allow-list for uploadable files, shared by the client validator
// (fileHandler), the upload API route, and the file picker's `accept` filter.
// A file is accepted if its MIME type OR its extension OR its exact (extension-
// less) filename is allowed, or if the browser reports no MIME type at all.
//
// SECURITY — uploaded files are NEVER executed by the app. Scripts (.bat, .ps1,
// .cmd, .sh, …) and other potentially harmful files are only ever (a) shown as
// escaped plain text in the read-only preview, or (b) offered as a download.
// The app has no code path that runs, evals, or interprets uploaded content,
// and untrusted markup (HTML/SVG) is rendered via <img>/text, not injected into
// the DOM — so an attacker cannot get a shared file to run in a viewer's browser.

export const ALLOWED_MIME_TYPES = [
    // text / code
    'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/xml',
    'text/csv', 'text/markdown',
    'application/json', 'application/javascript', 'application/xml',
    'application/x-javascript', 'application/x-python-code',
    // documents
    'application/pdf', 'application/rtf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/epub+zip',
    // archives
    'application/zip', 'application/x-zip-compressed', 'multipart/x-zip',
    'application/vnd.rar', 'application/x-rar-compressed',
    'application/gzip', 'application/x-gzip', 'application/x-tar',
    'application/x-gtar', 'application/x-compressed-tar', 'application/x-tgz',
    'application/x-7z-compressed', 'application/x-xz', 'application/x-bzip2',
    // images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon',
    'image/bmp', 'image/tiff', 'image/avif', 'image/heic', 'image/heif',
    // fonts
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
    'application/font-woff', 'application/vnd.ms-fontobject',
    // audio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
    'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/flac',
    'audio/x-flac', 'audio/opus', 'audio/midi', 'audio/x-midi',
    'audio/aiff', 'audio/x-aiff', 'audio/amr', 'audio/ac3', 'audio/x-ms-wma',
    // video
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska', 'video/mpeg', 'video/3gpp',
    'video/x-flv', 'video/x-ms-wmv', 'video/mp2t',
    // data
    'application/x-sqlite3', 'application/vnd.sqlite3',
    'application/x-ndjson', 'application/geo+json',
];

export const ALLOWED_EXTENSIONS = [
    // --- existing: text / code / config ---
    '.txt', '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx',
    '.json', '.xml', '.md', '.py', '.java', '.c', '.cpp', '.h',
    '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sql',
    '.sh', '.bash', '.yml', '.yaml', '.env', '.gitignore', '.conf',
    // --- more languages ---
    '.vue', '.svelte', '.astro', '.dart', '.mm', '.m', '.scala', '.r',
    '.lua', '.pl', '.pm', '.tcl', '.groovy', '.fs', '.fsx', '.f90', '.f95',
    '.asm', '.s', '.v', '.vh', '.sol', '.clj', '.cljs', '.ex', '.exs',
    '.erl', '.hrl', '.nim', '.zig', '.cr', '.ml', '.mli', '.cob', '.cobol',
    '.abap', '.mjs', '.cjs',
    // --- stylesheets / templates / query ---
    '.scss', '.sass', '.less', '.styl', '.pcss',
    '.graphql', '.gql', '.ejs', '.hbs', '.handlebars', '.pug', '.jade',
    '.njk', '.liquid',
    // --- shell / scripts (shown as TEXT only — never executed, see note below) ---
    '.ps1', '.bat', '.cmd', '.zsh', '.fish',
    // --- IDE / build project files ---
    '.sln', '.csproj', '.vbproj', '.vcxproj', '.props', '.targets',
    '.http', '.rest', '.code-workspace',
    // --- config / infra / dotfiles ---
    '.toml', '.ini', '.cfg', '.config', '.properties', '.gradle', '.lock',
    '.lockb', '.mod', '.sum', '.json5', '.editorconfig', '.eslintrc',
    '.prettierrc', '.stylelintrc', '.npmrc', '.yarnrc', '.babelrc',
    '.dockerfile', '.dockerignore', '.gitmodules', '.gitattributes', '.ignore',
    '.tf', '.tfvars', '.hcl', '.nomad', '.kubeconfig', '.helm',
    '.vagrantfile', '.ansible',
    // --- data ---
    '.csv', '.cvs', '.tsv', '.ndjson', '.geojson', '.avro', '.parquet',
    '.feather', '.sqlite', '.sqlite3', '.db', '.db3', '.dump', '.bak',
    '.log', '.out', '.err', '.trace', '.ipynb',
    // --- documents ---
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.rtf', '.odt', '.ods', '.odp', '.pages', '.numbers', '.key',
    '.epub', '.mobi', '.azw', '.azw3', '.fb2',
    // --- images ---
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.bmp', '.tiff', '.heic', '.heif', '.avif', '.raw', '.cr2', '.nef',
    // --- design ---
    '.figma', '.fig', '.psd', '.ai', '.xd', '.sketch', '.eps', '.indd',
    '.afdesign',
    // --- fonts ---
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    // --- archives ---
    '.zip', '.rar', '.tar', '.gz', '.tgz', '.7z', '.xz', '.bz2',
    // --- audio ---
    '.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus',
    '.weba', '.mid', '.midi', '.aiff', '.aif', '.amr', '.ac3', '.wma',
    // --- video ---
    '.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.mpeg', '.mpg',
    '.3gp', '.flv', '.wmv', '.m4v', '.mts', '.m2ts', '.vob', '.rm',
    '.rmvb', '.f4v',
    // --- mobile / native / game / ml ---
    '.storyboard', '.xib', '.aab', '.apk', '.ipa',
    '.unity', '.prefab', '.asset', '.gd', '.tscn',
    '.onnx', '.pb', '.ckpt', '.pt', '.pth',
    // --- security / certs ---
    '.pem', '.crt', '.csr', '.p12', '.pfx',
];

// Extension-less / special filenames (matched against the full lowercased name).
export const ALLOWED_FILENAMES = [
    'dockerfile', 'gemfile', 'pipfile', 'vagrantfile', 'makefile', 'procfile',
    'rakefile', 'brewfile', 'jenkinsfile',
];

/**
 * True when a file may be uploaded. Accepts by MIME type, extension, exact
 * filename, `.env*` dotfiles, or an absent MIME type (browsers often report
 * none for source/config files).
 */
export function isAllowedFile(name: string, type?: string): boolean {
    const lower = name.toLowerCase();
    const ext = `.${lower.split('.').pop()}`;

    if (type && ALLOWED_MIME_TYPES.includes(type)) return true;
    if (ALLOWED_EXTENSIONS.includes(ext)) return true;
    if (ALLOWED_FILENAMES.includes(lower)) return true;
    if (lower.startsWith('.env')) return true; // .env, .env.local, .env.production, …
    if (!type || type === '') return true;
    return false;
}

/** Value for an `<input type="file" accept="...">` filter. */
export const FILE_ACCEPT_ATTR = ALLOWED_EXTENSIONS.join(',');
