/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://online-clipboard-beta.vercel.app",
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/api/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  },
};
