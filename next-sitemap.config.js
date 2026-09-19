/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://pasteport.zain-imran.com",
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.8,
  sitemapSize: 5000,
  exclude: ["/api/*", "/view/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/api/", "/view/"],
      },
    ],
    additionalSitemaps: [
      "https://pasteport.zain-imran.com/sitemap.xml",
    ],
  },
  transform: async (config, path) => {
    let priority = 0.7;
    let changefreq = 'daily';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path === '/send' || path === '/read') {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path === '/tools') {
      priority = 0.85;
      changefreq = 'daily';
    } else if ([
      '/markdown', '/json', '/diff', '/jwt', '/encode',
      '/regex', '/uuid', '/timestamp', '/url', '/http-status',
      '/color', '/sql', '/html', '/yaml', '/hash',
      '/cron', '/jwt-gen', '/lorem'
    ].includes(path)) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path === '/secure') {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (['/privacy', '/terms'].includes(path)) {
      priority = 0.5;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
