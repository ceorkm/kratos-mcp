import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Github } from 'lucide-react'
import { Link } from 'react-router-dom'
import GitHubStars from './GitHubStars'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'CLI', href: '#cli' },
    { name: 'Security', href: '#security' },
  ]

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#262626]'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ opacity: 0.8 }}
            >
              <img
                src="/kratos-icon.png"
                alt="Kratos"
                className="h-8 w-8"
              />
              <span className="text-[#f5f5f5] font-serif text-xl font-normal tracking-tight">
                Kratos
              </span>
            </motion.div>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[#a1a1a1] hover:text-[#f5f5f5] text-sm font-medium transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <GitHubStars className="text-[#a1a1a1] text-sm" showLabel={false} />
            <a
              href="https://github.com/ceorkm/kratos-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#a1a1a1] hover:text-[#f5f5f5] text-sm transition-colors duration-200"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a
              href="#install"
              className="pill-button pill-button-filled text-sm"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#a1a1a1]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-[#262626] bg-[#0a0a0a]/95 backdrop-blur-xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="py-4 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-[#a1a1a1] hover:text-[#f5f5f5] text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="px-4 pt-3 space-y-3">
                  <a
                    href="https://github.com/ceorkm/kratos-mcp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#a1a1a1] hover:text-[#f5f5f5] text-sm"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                    <GitHubStars className="text-[#a1a1a1] ml-auto" showLabel={false} />
                  </a>
                  <a
                    href="#install"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center pill-button pill-button-filled text-sm"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

export default Navbar
