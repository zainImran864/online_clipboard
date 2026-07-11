declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    sw?: string;
    scope?: string;
    reloadOnOnline?: boolean;
    swSrc?: string;
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    cacheOnFrontEndNav?: boolean;
    subdomainPrefix?: string;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    publicExcludes?: string[];
    buildExcludes?: string[] | ((excludes: string[]) => string[]);
    runtimeCaching?: unknown[];
    cacheStartUrl?: boolean;
    cleanupOutdatedCaches?: boolean;
    clientsClaim?: boolean;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
