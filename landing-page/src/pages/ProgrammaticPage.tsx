import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { generateAllProgrammaticPages, ProgrammaticPage as PageType } from '../utils/programmatic-seo-fixed'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'

const ProgrammaticPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<PageType | null>(null)
  const [relatedPages, setRelatedPages] = useState<PageType[]>([])

  useEffect(() => {
    // In production, this would fetch from a database
    // For now, generate pages on demand
    const allPages = generateAllProgrammaticPages()
    const currentPage = allPages.find(p => p.slug === slug)
    
    if (currentPage) {
      setPage(currentPage)
      
      // Get related pages
      const related = currentPage.relatedPages
        .map(slug => allPages.find(p => p.slug === slug))
        .filter(Boolean) as PageType[]
      setRelatedPages(related)
    }
  }, [slug])

  if (!page) {
    return (
      <div className="min-h-screen bg-dark-bg pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-mono text-white mb-4">Page Not Found</h1>
          <Link to="/" className="text-neon-blue hover:underline">Return Home</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.metaDescription} />
        <meta name="keywords" content={page.keywords.join(', ')} />
        
        {/* Open Graph */}
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://kratos-mcp.com/resources/${page.slug}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.metaDescription} />
        
        {/* Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify(page.schemaMarkup)}
        </script>
        
        {/* Additional SEO */}
        <link rel="canonical" href={`https://kratos-mcp.com/resources/${page.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-dark-bg pt-20">
        <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-dark-text-secondary mb-8">
            <Link to="/" className="hover:text-neon-blue transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-neon-blue">{page.category}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{page.h1}</span>
          </nav>

          {/* Header */}
          <motion.header 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <span className="text-neon-blue text-sm font-mono">{page.category}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-mono font-bold text-white mb-6">
              {page.h1}
            </h1>

            <p className="text-xl text-dark-text-secondary mb-8 leading-relaxed">
              {page.metaDescription}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {page.keywords.map(keyword => (
                <span 
                  key={keyword}
                  className="px-3 py-1 bg-dark-surface/50 border border-dark-border/30 rounded-full text-xs text-dark-text-secondary"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </motion.header>

          {/* Main Content */}
          <motion.div 
            className="prose prose-invert prose-lg max-w-none mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* CTA Section */}
          <motion.section 
            className="bg-dark-card/50 border border-neon-blue/30 rounded-2xl p-8 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-mono font-bold text-white mb-4">
              Ready to End AI Context Amnesia?
            </h2>
            <p className="text-dark-text-secondary mb-6">
              Join thousands of developers using Kratos MCP for persistent AI memory. 
              Installation takes less than 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/#install"
                className="inline-block px-8 py-3 bg-neon-blue text-white font-mono rounded-lg hover:bg-neon-blue/80 transition-colors text-center"
              >
                Get Started Free →
              </Link>
              <Link 
                to="/docs"
                className="inline-block px-8 py-3 border border-neon-blue/50 text-white font-mono rounded-lg hover:bg-neon-blue/10 transition-colors text-center"
              >
                View Documentation
              </Link>
            </div>
          </motion.section>

          {/* Related Pages */}
          {relatedPages.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-2xl font-mono font-bold text-white mb-8">
                Related Resources
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPages.map((related, idx) => (
                  <Link
                    key={idx}
                    to={`/resources/${related.slug}`}
                    className="block p-6 bg-dark-surface/50 border border-dark-border/30 rounded-xl hover:border-neon-blue/50 transition-all duration-300 group"
                  >
                    <h3 className="font-mono text-lg text-white mb-2 group-hover:text-neon-blue transition-colors">
                      {related.h1}
                    </h3>
                    <p className="text-sm text-dark-text-secondary line-clamp-2">
                      {related.metaDescription}
                    </p>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Internal Linking */}
          <motion.section 
            className="mt-16 pt-8 border-t border-dark-border/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between">
              <Link 
                to="/"
                className="text-neon-blue hover:text-neon-blue/80 transition-colors"
              >
                ← Back to Home
              </Link>
              <div className="flex gap-4">
                <Link 
                  to="/blog"
                  className="text-dark-text-secondary hover:text-neon-blue transition-colors"
                >
                  Blog
                </Link>
                <Link 
                  to="/docs"
                  className="text-dark-text-secondary hover:text-neon-blue transition-colors"
                >
                  Docs
                </Link>
              </div>
            </div>
          </motion.section>
        </article>
      </div>
    </>
  )
}

export default ProgrammaticPage