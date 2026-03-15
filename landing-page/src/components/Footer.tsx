import { Github, Twitter } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'CLI', href: '#cli' },
        { name: 'Plugin', href: '#plugin' },
        { name: 'Security', href: '#security' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', to: '/docs' },
        { name: 'Blog', to: '/blog' },
        { name: 'GitHub', href: 'https://github.com/ceorkm/kratos-mcp' },
        { name: 'npm', href: 'https://www.npmjs.com/package/kratos-mcp' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '#' },
        { name: 'License', href: 'https://github.com/ceorkm/kratos-mcp/blob/main/LICENSE' },
        { name: 'Changelog', href: 'https://github.com/ceorkm/kratos-mcp/releases' },
      ],
    },
  ]

  return (
    <footer className="border-t border-kratos-border/30 bg-kratos-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top: Brand + Tagline */}
        <div className="mb-12">
          <Link to="/" className="flex items-center space-x-3 mb-4">
            <img src="/kratos-icon.png" alt="Kratos" className="h-7 w-7" />
            <span className="text-kratos-text font-serif text-lg font-semibold">
              Kratos
            </span>
          </Link>
          <p className="text-kratos-muted text-sm max-w-sm leading-relaxed">
            Persistent memory, powered by you.
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-kratos-text text-sm font-semibold mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {'to' in link && link.to ? (
                      <Link
                        to={link.to}
                        className="text-kratos-muted hover:text-kratos-copper text-sm transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target={link.href?.startsWith('http') ? '_blank' : undefined}
                        rel={link.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-kratos-muted hover:text-kratos-copper text-sm transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social links */}
        <div className="flex items-center space-x-4 mb-8">
          <a
            href="https://github.com/ceorkm/kratos-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-kratos-muted hover:text-kratos-text transition-colors duration-200"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="#"
            className="text-kratos-muted hover:text-kratos-text transition-colors duration-200"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" />
          </a>
        </div>

        {/* Bottom */}
        <div className="border-t border-kratos-border/20 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-kratos-muted text-xs">
            &copy; {currentYear} Kratos. All rights reserved.
          </p>
          <p className="text-kratos-muted text-xs font-mono">
            v1.4.1 &middot; MIT License
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
