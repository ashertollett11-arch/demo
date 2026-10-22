import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: 'https://simplyapply.app', lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: 'https://simplyapply.app/pricing', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://simplyapply.app/about', lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://simplyapply.app/contact', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://simplyapply.app/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://simplyapply.app/terms', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
