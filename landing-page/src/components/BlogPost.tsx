import { motion } from 'framer-motion'
import { Calendar, Clock, User, ArrowLeft, Share2, Twitter, Linkedin, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface BlogPostProps {
  title: string
  author: string
  date: string
  readTime: string
  category: string
  tags: string[]
  content: React.ReactNode
  image?: string
}

const BlogPost = ({ title, author, date, readTime, category, tags, content, image }: BlogPostProps) => {
  const [copied, setCopied] = useState(false)

  const shareUrl = window.location.href
  const shareTitle = `${title} - Kratos MCP`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-dark-bg pt-20">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back to Blog */}
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-dark-text-secondary hover:text-neon-blue transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <motion.header 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <span className="text-neon-blue text-sm font-mono">{category}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-white mb-6">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-dark-text-secondary text-sm mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {readTime}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map(tag => (
              <span 
                key={tag}
                className="px-3 py-1 bg-dark-surface/50 border border-dark-border/30 rounded-full text-xs text-dark-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-4 pb-8 border-b border-dark-border/30">
            <span className="text-sm text-dark-text-secondary">Share:</span>
            <button
              onClick={handleTwitterShare}
              className="p-2 bg-dark-surface/50 border border-dark-border/30 rounded-lg hover:border-neon-blue/50 transition-colors"
              aria-label="Share on Twitter"
            >
              <Twitter className="h-4 w-4 text-dark-text-secondary" />
            </button>
            <button
              onClick={handleLinkedInShare}
              className="p-2 bg-dark-surface/50 border border-dark-border/30 rounded-lg hover:border-neon-blue/50 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="h-4 w-4 text-dark-text-secondary" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 bg-dark-surface/50 border border-dark-border/30 rounded-lg hover:border-neon-blue/50 transition-colors"
              aria-label="Copy link"
            >
              {copied ? (
                <span className="text-green-400 text-xs">Copied!</span>
              ) : (
                <Copy className="h-4 w-4 text-dark-text-secondary" />
              )}
            </button>
          </div>
        </motion.header>

        {/* Hero Image */}
        {image && (
          <motion.div 
            className="mb-12 rounded-2xl overflow-hidden border border-dark-border/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img 
              src={image} 
              alt={title}
              className="w-full h-auto"
            />
          </motion.div>
        )}

        {/* Content */}
        <motion.div 
          className="prose prose-invert prose-lg max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {content}
        </motion.div>

        {/* Footer */}
        <motion.footer 
          className="mt-16 pt-8 border-t border-dark-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <Link 
              to="/blog"
              className="text-neon-blue hover:text-neon-blue/80 transition-colors"
            >
              ← Back to all posts
            </Link>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-dark-text-secondary" />
              <button
                onClick={handleCopy}
                className="text-dark-text-secondary hover:text-neon-blue transition-colors text-sm"
              >
                {copied ? 'Link copied!' : 'Share this article'}
              </button>
            </div>
          </div>
        </motion.footer>
      </article>
    </div>
  )
}

export default BlogPost