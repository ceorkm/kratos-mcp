// Sitemap generator for all pages including programmatic SEO pages
import { generateAllProgrammaticPages } from './programmatic-seo'

export function generateSitemapXML(): string {
  const baseUrl = 'https://kratos-mcp.com'
  const today = new Date().toISOString().split('T')[0]
  
  // Static pages with priority
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/blog', changefreq: 'weekly', priority: 0.9 },
    { url: '/docs', changefreq: 'weekly', priority: 0.9 },
    { url: '/blog/kratos-vs-memory-bank', changefreq: 'monthly', priority: 0.8 },
  ]
  
  // Generate all programmatic pages
  const programmaticPages = generateAllProgrammaticPages()
  
  // Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n'
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'
  
  // Add static pages
  staticPages.forEach(page => {
    xml += '  <url>\n'
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`
    xml += `    <priority>${page.priority}</priority>\n`
    xml += '  </url>\n'
  })
  
  // Add programmatic pages
  programmaticPages.forEach(page => {
    // Determine priority based on category
    let priority = 0.6
    if (page.category === 'Location') priority = 0.7
    if (page.category === 'Comparison') priority = 0.8
    if (page.category === 'Alternative') priority = 0.75
    
    xml += '  <url>\n'
    xml += `    <loc>${baseUrl}/resources/${page.slug}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += `    <changefreq>weekly</changefreq>\n`
    xml += `    <priority>${priority}</priority>\n`
    xml += '  </url>\n'
  })
  
  xml += '</urlset>'
  
  return xml
}

// Generate sitemap index for large sitemaps
export function generateSitemapIndex(): string {
  const baseUrl = 'https://kratos-mcp.com'
  const today = new Date().toISOString().split('T')[0]
  
  // Split sitemaps by category for better organization
  const sitemaps = [
    'sitemap-main.xml',
    'sitemap-location.xml',
    'sitemap-usecase.xml',
    'sitemap-comparison.xml',
    'sitemap-alternative.xml'
  ]
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  sitemaps.forEach(sitemap => {
    xml += '  <sitemap>\n'
    xml += `    <loc>${baseUrl}/${sitemap}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '  </sitemap>\n'
  })
  
  xml += '</sitemapindex>'
  
  return xml
}

// Generate category-specific sitemaps
export function generateCategorySitemap(category: string): string {
  const baseUrl = 'https://kratos-mcp.com'
  const today = new Date().toISOString().split('T')[0]
  
  const allPages = generateAllProgrammaticPages()
  const categoryPages = allPages.filter(page => page.category.toLowerCase().includes(category.toLowerCase()))
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  categoryPages.forEach(page => {
    xml += '  <url>\n'
    xml += `    <loc>${baseUrl}/resources/${page.slug}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += `    <changefreq>weekly</changefreq>\n`
    xml += `    <priority>0.7</priority>\n`
    xml += '  </url>\n'
  })
  
  xml += '</urlset>'
  
  return xml
}