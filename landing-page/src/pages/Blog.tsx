import { motion } from 'framer-motion'
import { Calendar, Clock, User, ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
// import GradientText from '../components/GradientText' - removed gradients

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['All', 'AI Memory', 'MCP Guides', 'Tutorials', 'Architecture', 'Performance']

  const blogPosts = [
    {
      id: 1,
      title: "Building Persistent AI Memory: The Architecture Behind Kratos MCP",
      excerpt: "Deep dive into how Kratos MCP maintains context across sessions while ensuring complete project isolation. Learn about our memory architecture, semantic search implementation, and performance optimizations.",
      author: "Kratos Team",
      date: "2025-08-10",
      readTime: "8 min read",
      category: "Architecture",
      tags: ["AI Memory", "Architecture", "Performance"],
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
      featured: true
    },
    {
      id: 2,
      title: "Getting Started with Model Context Protocol: Complete Setup Guide",
      excerpt: "From zero to hero: Set up Kratos MCP with Claude Desktop, Cursor, and other AI tools. Includes troubleshooting common issues and configuration best practices for different project types.",
      author: "Sarah Chen",
      date: "2025-08-08",
      readTime: "12 min read",
      category: "MCP Guides",
      tags: ["Setup", "Claude", "Tutorial"],
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop"
    },
    {
      id: 3,
      title: "Memory Search Optimization: 95.8% Accuracy in Under 10ms",
      excerpt: "How we achieved lightning-fast semantic search with near-perfect accuracy. Explore our vector embedding strategies, indexing optimizations, and real-world performance benchmarks.",
      author: "Alex Rodriguez",
      date: "2025-08-05",
      readTime: "10 min read",
      category: "Performance",
      tags: ["Performance", "Search", "AI Memory"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    },
    {
      id: 4,
      title: "Project Isolation in Practice: Managing 50+ Codebases",
      excerpt: "Real-world case study: How a development team uses Kratos MCP to maintain context across dozens of projects without cross-contamination. Includes workflow tips and team collaboration strategies.",
      author: "Marcus Thompson",
      date: "2025-08-03",
      readTime: "7 min read",
      category: "Tutorials",
      tags: ["Workflow", "Teams", "Best Practices"],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
    },
    {
      id: 5,
      title: "Security-First AI Memory: PII Detection and GDPR Compliance",
      excerpt: "Learn how Kratos MCP automatically detects and redacts sensitive information while maintaining GDPR compliance. Explore our built-in security features and privacy-by-design architecture.",
      author: "Elena Vasquez",
      date: "2025-08-01",
      readTime: "6 min read",
      category: "AI Memory",
      tags: ["Security", "Privacy", "GDPR"],
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop"
    },
    {
      id: 6,
      title: "Advanced Context Injection: Smart Memory Selection",
      excerpt: "Go beyond basic memory retrieval. Discover how Kratos MCP intelligently selects the most relevant context based on your current task, conversation history, and project patterns.",
      author: "David Kim",
      date: "2025-07-28",
      readTime: "9 min read",
      category: "AI Memory",
      tags: ["Context", "AI Memory", "Advanced"],
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop"
    },
    {
      id: 7,
      title: "Kratos vs Memory Bank MCP: Performance Comparison 2025",
      excerpt: "Comprehensive benchmark analysis comparing Kratos MCP with Memory Bank MCP. See why developers are switching with 95.8% accuracy vs 60%, and <10ms retrieval vs 200ms+.",
      author: "Technical Team",
      date: "2025-01-11",
      readTime: "15 min read",
      category: "Performance",
      tags: ["Comparison", "Memory Bank", "Benchmarks"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    },
    {
      id: 8,
      title: "Best MCP Memory Server 2025: Complete Buyer's Guide",
      excerpt: "Evaluating the best MCP memory servers for AI development. Compare Kratos, Memory Bank, Mem0, and Sequential Thinking across 15+ criteria including performance, security, and ease of use.",
      author: "Sarah Chen",
      date: "2025-01-10",
      readTime: "20 min read",
      category: "MCP Guides",
      tags: ["Best MCP", "Comparison", "Guide"],
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop"
    },
    {
      id: 9,
      title: "Migrating from Memory Bank MCP to Kratos: Step-by-Step",
      excerpt: "Complete migration guide for teams switching from Memory Bank MCP. Includes data migration scripts, configuration mapping, and troubleshooting common transition issues.",
      author: "Alex Rodriguez",
      date: "2025-01-09",
      readTime: "12 min read",
      category: "Tutorials",
      tags: ["Migration", "Memory Bank", "Tutorial"],
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop"
    },
    {
      id: 10,
      title: "AI Context Amnesia: The Hidden Cost of Poor Memory Management",
      excerpt: "Explore how AI context amnesia costs developers 10+ hours weekly. Learn why persistent memory is critical for AI development and how Kratos MCP solves this industry-wide problem.",
      author: "Marcus Thompson",
      date: "2025-01-08",
      readTime: "10 min read",
      category: "AI Memory",
      tags: ["Context Amnesia", "Productivity", "AI Memory"],
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop"
    },
    {
      id: 11,
      title: "Claude Desktop Memory: Complete Setup with Kratos MCP",
      excerpt: "Master Claude Desktop with persistent memory. Step-by-step guide to integrating Kratos MCP for perfect context retention across all your Claude conversations and projects.",
      author: "Elena Vasquez",
      date: "2025-01-07",
      readTime: "8 min read",
      category: "MCP Guides",
      tags: ["Claude Desktop", "Setup", "Memory"],
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop"
    },
    {
      id: 12,
      title: "The 4 Pillars Framework: Revolutionary AI Development Methodology",
      excerpt: "Deep dive into the 4 Pillars of AI development: PRD Engineering, Prompt Engineering, Context Engineering, and Memory Engineering. Transform how you build with AI.",
      author: "Kratos Team",
      date: "2025-01-06",
      readTime: "25 min read",
      category: "Architecture",
      tags: ["4 Pillars", "Framework", "Methodology"],
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop"
    }
  ]

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const featuredPost = blogPosts.find(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-dark-bg pt-20">
      {/* Subtle background effect */}
      <div className="fixed inset-0 bg-neon-blue/5 opacity-5" />

      {/* Header */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            className="text-5xl sm:text-6xl font-mono font-bold text-dark-text mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Kratos Blog
          </motion.h1>
          
          <motion.p 
            className="text-xl text-dark-text-secondary mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Deep insights into AI memory, context protocols, and building better developer experiences
          </motion.p>

          {/* Search and Filters */}
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-text-muted" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-dark-surface/50 backdrop-blur-sm border border-dark-border/30 rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 w-80"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50'
                      : 'bg-dark-surface/50 text-dark-text-secondary border border-dark-border/30 hover:border-neon-blue/30 hover:text-dark-text'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && selectedCategory === 'All' && !searchQuery && (
        <section className="px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              className="text-2xl font-mono font-bold text-dark-text mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Featured Article
            </motion.h2>

            <motion.article
              className="relative overflow-hidden bg-dark-card/50 backdrop-blur-xl border border-dark-border/30 rounded-2xl hover:border-neon-blue/50 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Link to={featuredPost.id === 7 ? '/blog/kratos-vs-memory-bank' : '#'}>
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-xs font-mono rounded-full border border-neon-blue/30">
                      {featuredPost.category}
                    </span>
                    <span className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-xs font-mono rounded-full border border-neon-blue/30">
                      FEATURED
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-mono font-bold text-dark-text mb-4 group-hover:text-neon-blue transition-colors">
                    {featuredPost.title}
                  </h3>
                  
                  <p className="text-dark-text-secondary mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-dark-text-muted mb-6">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {featuredPost.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {featuredPost.readTime}
                    </div>
                  </div>

                  <motion.div 
                    className="inline-flex items-center gap-2 text-neon-blue hover:text-white transition-colors font-mono"
                    whileHover={{ x: 5 }}
                  >
                    Read More <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </div>
              </Link>
            </motion.article>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {!featuredPost || selectedCategory !== 'All' || searchQuery ? (
            <motion.h2 
              className="text-2xl font-mono font-bold text-dark-text mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {searchQuery ? `Search Results (${filteredPosts.length})` : 'Latest Articles'}
            </motion.h2>
          ) : (
            <motion.h2 
              className="text-2xl font-mono font-bold text-dark-text mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Latest Articles
            </motion.h2>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, index) => (
              <Link
                key={post.id}
                to={post.id === 7 ? '/blog/kratos-vs-memory-bank' : '#'}
              >
                <motion.article
                  className="bg-dark-card/50 backdrop-blur-xl border border-dark-border/30 rounded-2xl overflow-hidden hover:border-neon-blue/50 transition-all duration-300 group cursor-pointer h-full"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                <div className="relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-dark-bg/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-xs font-mono rounded-full border border-neon-blue/30">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-dark-text-muted">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </div>
                  </div>

                  <h3 className="text-xl font-mono font-bold text-dark-text mb-3 group-hover:text-neon-blue transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-dark-text-secondary text-sm mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-dark-text-muted">
                      <User className="h-3 w-3" />
                      {post.author}
                    </div>
                    <div className="text-xs text-dark-text-muted">
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 bg-dark-surface/50 text-dark-text-muted text-xs rounded-full border border-dark-border/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                </motion.article>
              </Link>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-mono text-dark-text mb-2">No articles found</h3>
              <p className="text-dark-text-secondary">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Blog