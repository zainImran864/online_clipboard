export default function JsonLd() {
    const siteUrl = 'https://pasteport.zain-imran.com';

    const webApplicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Pasteport — Cross-Device Sharing + Developer Toolkit',
        url: siteUrl,
        applicationCategory: 'DeveloperApplication, UtilityApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires a modern web browser with JavaScript enabled',
        description:
            'Free cross-device sharing platform and developer toolkit. Transfer text, code, files, and screenshots across devices with 6-digit codes and QR scans. Features 18 client-side developer utilities including JSON Formatter, YAML Converter, SQL Formatter, Regex Tester, UUID Generator, JWT Signer, Hash Generator, and more.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'Instant cross-device clipboard sharing without login',
            'Pair devices with 6-digit codes or QR camera scanning',
            'Offline viewing and downloading with IndexedDB caching',
            '4-character PIN protection with real-time screen locking',
            'Self-destruct PIN with instant permanent wipe',
            'Custom lifespan from 1 to 24 hours with auto-expiry purge',
            'Global Ctrl+V clipboard paste for screenshots and text',
            'Cloudflare R2 sandboxed object storage up to 600MB',
            'Real-time live updates as the creator types',
            'Developer Utilities: JSON Formatter & Tree, YAML ↔ JSON Converter, SQL Formatter, HTML Formatter, Markdown Live Preview with PDF export',
            'Security & Crypto Tools: JWT Debugger, JWT Generator (HMAC Web Crypto), Hash Generator (MD5, SHA-256, SHA-512, HMAC), UUID Generator (v4, v7)',
            'Web & Time Utilities: Regex Tester & Matcher, Unix Timestamp Converter, Cron Schedule Explainer, URL Parser & Query Editor, HTTP Status Code Reference, Color Converter with WCAG Contrast, Lorem Ipsum & Dummy JSON Generator',
        ],
        author: {
            '@type': 'Person',
            name: 'Zain Imran',
            url: 'https://zain-imran.com',
        },
    };

    const webSiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Pasteport',
        alternateName: 'Pasteport — Cross-Device Sharing + Developer Toolkit',
        url: siteUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/view/{search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Pasteport',
        url: siteUrl,
        logo: `${siteUrl}/icon.svg`,
        sameAs: ['https://github.com/zainImran864/online_clipboard'],
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is Pasteport and how does this online clipboard work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Pasteport is a free online clipboard tool that lets you transfer text, code snippets, files, images, and PDFs across devices instantly. You enter text or upload files on the Send page, receive a 6-digit share code or link, and open it on any other phone, tablet, or computer without logging in or installing software.',
                },
            },
            {
                '@type': 'Question',
                name: 'How do I share my clipboard between phone and PC without logging in?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Open Pasteport (https://pasteport.zain-imran.com) on your first device, paste or type your content, and click "Generate Share Code". Open the site on your second device, enter the 6-digit code or scan the QR code, and your content appears instantly.',
                },
            },
            {
                '@type': 'Question',
                name: 'How does the 4-character PIN password protection work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can enable a 4-character PIN switch when composing your share or toggle it at runtime from the generated share card. Anyone opening the share will be required to enter the 4-character PIN to unlock the content. If you enable the PIN at runtime, active reader screens lock in real time.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is the Self-Destruct PIN feature?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'When generating a share, you can set an optional Self-Destruct PIN. When the self-destruct action is confirmed with this PIN (by you or an authorized recipient), the content and all associated files are permanently and immediately wiped from server storage, disappearing instantly from all connected screens.',
                },
            },
            {
                '@type': 'Question',
                name: 'How long is shared content stored on Pasteport?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can customize your share lifespan from 1 to 24 hours (1h, 3h, 6h, 12h, or 24h). Once the timer expires, all text and uploaded files are purged permanently from Firestore and Cloudflare R2 storage.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I paste screenshots directly from my clipboard?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! You can press Ctrl + V anywhere on the Pasteport website to immediately paste clipboard text or captured screenshots without having to manually browse or save them first.',
                },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </>
    );
}
