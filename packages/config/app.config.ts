// Centralized app configuration
export const appConfig = {
  // Production domain
  domain: 'safeping.app',
  
  // App URLs
  urls: {
    production: {
      web: 'https://safeping.app',
      pwa: 'https://my.safeping.app',
      api: 'https://api.safeping.app',
      landing: 'https://safeping.app'
    },
    development: {
      web: 'http://localhost:5173',
      pwa: 'http://localhost:5174',
      api: 'http://localhost:54321',
      landing: 'http://localhost:5175'
    }
  },
  
  // Email configuration
  email: {
    from: 'SafePing <noreply@safeping.app>',
    replyTo: 'support@safeping.app',
    support: 'support@safeping.app'
  },
  
  // App metadata
  metadata: {
    name: 'SafePing',
    description: 'Lone worker safety monitoring system',
    keywords: 'safety, monitoring, lone worker, check-in, emergency',
    author: 'SafePing Inc.'
  },
  
  // Social links
  social: {
    twitter: '@safepingapp',
    linkedin: 'safeping',
    github: 'safeping'
  }
}

// Helper to get current environment URLs
export function getAppUrls() {
  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  
  return isDevelopment ? appConfig.urls.development : appConfig.urls.production
}

// Helper to get base URL for current app
export function getBaseUrl(app: 'web' | 'pwa' | 'api' | 'landing' = 'web') {
  const urls = getAppUrls()
  return urls[app]
}
