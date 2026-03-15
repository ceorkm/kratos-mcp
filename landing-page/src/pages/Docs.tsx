import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Book, ChevronRight, ChevronDown, Code, Terminal, Settings, 
  Database, Lock, Zap, Search, GitBranch, FileText, AlertCircle,
  CheckCircle, Copy, ExternalLink, ArrowRight, Brain,
  Shield, Globe, Cpu, HardDrive, Package, Layers
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Docs = () => {
  const [activeSection, setActiveSection] = useState('introduction')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<{ [key: string]: string }>({})

  // Table of contents structure
  const tocStructure = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      children: [
        { id: 'introduction', title: 'Introduction', icon: FileText },
        { id: 'quick-start', title: 'Quick Start', icon: Zap },
        { id: 'installation', title: 'Installation', icon: Package },
        { id: 'first-memory', title: 'Your First Memory', icon: Brain },
      ]
    },
    {
      id: 'core-concepts',
      title: 'Core Concepts',
      icon: Layers,
      children: [
        { id: 'memory-system', title: 'Memory System', icon: Database },
        { id: 'project-isolation', title: 'Project Isolation', icon: Lock },
        { id: 'context-injection', title: 'Context Injection', icon: Cpu },
        { id: 'semantic-search', title: 'Semantic Search', icon: Search },
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      children: [
        { id: 'memory-operations', title: 'Memory Operations', icon: Database },
        { id: 'search-api', title: 'Search API', icon: Search },
        { id: 'context-api', title: 'Context API', icon: GitBranch },
        { id: 'security-api', title: 'Security API', icon: Shield },
      ]
    },
    {
      id: 'configuration',
      title: 'Configuration',
      icon: Settings,
      children: [
        { id: 'config-file', title: 'Configuration File', icon: FileText },
        { id: 'environment-vars', title: 'Environment Variables', icon: Terminal },
        { id: 'advanced-settings', title: 'Advanced Settings', icon: Settings },
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Globe,
      children: [
        { id: 'claude-desktop', title: 'Claude Desktop & Code', icon: Brain },
        { id: 'cursor-ide', title: 'Cursor & Windsurf', icon: Code },
        { id: 'vscode', title: 'VS Code & Cline', icon: Code },
        { id: 'custom-clients', title: 'Other AI Tools', icon: Cpu },
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: CheckCircle,
      children: [
        { id: 'memory-management', title: 'Memory Management', icon: Database },
        { id: 'security', title: 'Security Guidelines', icon: Lock },
        { id: 'performance', title: 'Performance Tips', icon: Zap },
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: AlertCircle,
      children: [
        { id: 'common-issues', title: 'Common Issues', icon: AlertCircle },
        { id: 'debugging', title: 'Debugging Guide', icon: Terminal },
        { id: 'faq', title: 'FAQ', icon: FileText },
      ]
    }
  ]

  // Code copy function
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = tocStructure.flatMap(section => 
        section.children.map(child => child.id)
      )
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top >= 0 && rect.top <= 200) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Code block component
  const CodeBlock = ({ code, language, id, tabs }: { code: string | { [key: string]: string }, language: string, id: string, tabs?: string[] }) => {
    const isTabbed = tabs && typeof code === 'object'
    const currentTab = activeTab[id] || (tabs?.[0] || '')
    
    return (
      <div className="relative group my-6">
        {isTabbed && tabs && (
          <div className="flex border-b border-dark-border/50">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab({ ...activeTab, [id]: tab })}
                className={`px-4 py-2 text-sm font-mono transition-all ${
                  currentTab === tab 
                    ? 'text-neon-blue border-b-2 border-neon-blue' 
                    : 'text-dark-text-secondary hover:text-dark-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
        <div className="bg-dark-bg border border-dark-border/50 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm">
            <code className={`language-${language} text-white`}>
              {isTabbed && typeof code === 'object' ? code[currentTab] : typeof code === 'string' ? code : ''}
            </code>
          </pre>
          <button
            onClick={() => copyCode(isTabbed && typeof code === 'object' ? code[currentTab] : typeof code === 'string' ? code : '', id)}
            className="absolute top-2 right-2 p-2 bg-dark-surface/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copiedCode === id ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-dark-text-secondary" />
            )}
          </button>
        </div>
      </div>
    )
  }

  // Alert component
  const Alert = ({ type, children }: { type: 'info' | 'warning' | 'success' | 'error', children: React.ReactNode }) => {
    const styles = {
      info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
      warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
      success: 'bg-green-500/10 border-green-500/50 text-green-400',
      error: 'bg-red-500/10 border-red-500/50 text-red-400'
    }
    
    const icons = {
      info: AlertCircle,
      warning: AlertCircle,
      success: CheckCircle,
      error: AlertCircle
    }
    
    const Icon = icons[type]
    
    return (
      <div className={`p-4 rounded-lg border ${styles[type]} my-4`}>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg pt-20">
      <div className="flex">
        {/* Left Sidebar - Navigation */}
        <motion.aside 
          className="w-64 h-[calc(100vh-5rem)] sticky top-20 border-r border-dark-border/50 bg-dark-surface/30 overflow-y-auto"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <nav className="p-4">
            <div className="mb-4">
              <Link to="/" className="flex items-center gap-2 text-dark-text-secondary hover:text-neon-blue transition-colors">
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span className="text-sm">Back to Home</span>
              </Link>
            </div>
            
            <div className="space-y-2">
              {tocStructure.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-dark-card/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className="h-4 w-4 text-dark-text-secondary group-hover:text-neon-blue" />
                      <span className="text-sm font-medium text-dark-text">{section.title}</span>
                    </div>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-4 w-4 text-dark-text-secondary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-dark-text-secondary" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.has(section.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 overflow-hidden"
                      >
                        {section.children.map((child) => (
                          <a
                            key={child.id}
                            href={`#${child.id}`}
                            onClick={() => setActiveSection(child.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                              activeSection === child.id
                                ? 'bg-neon-blue/20 text-neon-blue border-l-2 border-neon-blue'
                                : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-card/30'
                            }`}
                          >
                            <child.icon className="h-3 w-3" />
                            <span className="text-sm">{child.title}</span>
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Introduction Section */}
            <section id="introduction" className="mb-16">
              <h1 className="text-4xl font-mono font-bold text-dark-text mb-4">
                Kratos MCP Documentation
              </h1>
              <p className="text-xl text-dark-text-secondary mb-8">
                The complete guide to implementing persistent AI memory with the Model Context Protocol
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <div className="text-2xl font-mono text-neon-blue mb-2">v1.4.1</div>
                  <div className="text-sm text-dark-text-secondary">Latest Version</div>
                </div>
                <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <div className="text-2xl font-mono text-neon-blue mb-2">MCP 1.0</div>
                  <div className="text-sm text-dark-text-secondary">Protocol Version</div>
                </div>
                <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <div className="text-2xl font-mono text-neon-cyan mb-2">MIT</div>
                  <div className="text-sm text-dark-text-secondary">License</div>
                </div>
              </div>

              <Alert type="info">
                Kratos MCP is the #1 memory implementation for ALL AI coding tools - Claude Desktop, Claude Code, Cursor, 
                Windsurf, VS Code, Cline, Augment Code, and any MCP-compatible client. Get 95.8% context accuracy 
                with sub-10ms retrieval times across all your AI assistants.
              </Alert>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Zap className="h-8 w-8 text-neon-blue" />
                Quick Start
              </h2>
              
              <p className="text-dark-text-secondary mb-6">
                Get up and running with Kratos MCP in under 2 minutes.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-3">Prerequisites</h3>
                  <ul className="list-disc list-inside text-dark-text-secondary space-y-2">
                    <li>Node.js 18 or higher</li>
                    <li>Your AI coding tool (Claude Desktop, Claude Code, Cursor, Windsurf, Cline, etc.)</li>
                    <li>npm or yarn package manager</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-3">Install in 30 seconds</h3>
                  <CodeBlock 
                    id="quick-install"
                    language="bash"
                    code="npm install -g kratos-mcp"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-3">Configure Your AI Tool</h3>
                  <p className="text-dark-text-secondary mb-3">
                    Add Kratos MCP to your AI tool's configuration:
                  </p>
                  <CodeBlock 
                    id="ai-config"
                    language="json"
                    code={`{
  "mcpServers": {
    "kratos": {
      "command": "npx",
      "args": ["--yes", "kratos-mcp@latest"]
    }
  }
}`}
                  />
                </div>

                <Alert type="success">
                  That's it! Restart your AI tool and it now has persistent memory across all sessions.
                </Alert>
              </div>
            </section>

            {/* Installation */}
            <section id="installation" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Package className="h-8 w-8 text-neon-blue" />
                Installation Guide
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">Install Globally</h3>
                  
                  <CodeBlock
                    id="install-methods"
                    language="bash"
                    tabs={['npm', 'yarn', 'pnpm', 'source']}
                    code={{
                      'npm': 'npm install -g kratos-mcp',
                      'yarn': 'yarn global add kratos-mcp',
                      'pnpm': 'pnpm add -g kratos-mcp',
                      'source': `git clone https://github.com/ceorkm/kratos-mcp.git
cd kratos-mcp
npm install
npm run build
npm link`
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">AI Tool Configuration Locations</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-mono text-dark-text mb-2 flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Claude Desktop / Claude Code
                      </h4>
                      <CodeBlock
                        id="claude-config-path"
                        language="bash"
                        tabs={['macOS', 'Windows', 'Linux']}
                        code={{
                          'macOS': '~/Library/Application Support/Claude/claude_desktop_config.json',
                          'Windows': '%APPDATA%\\Claude\\claude_desktop_config.json',
                          'Linux': '~/.config/Claude/claude_desktop_config.json'
                        }}
                      />
                    </div>

                    <div>
                      <h4 className="font-mono text-dark-text mb-2 flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Cursor
                      </h4>
                      <p className="text-dark-text-secondary mb-2">
                        Navigate to: <code className="px-2 py-1 bg-dark-card rounded text-white text-sm">Settings → MCP Servers → Add New Server</code>
                      </p>
                      <CodeBlock
                        id="cursor-config"
                        language="json"
                        code={`{
  "name": "kratos",
  "command": "npx",
  "args": ["kratos-mcp"]
}`}
                      />
                    </div>

                    <div>
                      <h4 className="font-mono text-dark-text mb-2 flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Windsurf
                      </h4>
                      <p className="text-dark-text-secondary mb-2">
                        Navigate to: <code className="px-2 py-1 bg-dark-card rounded text-white text-sm">Preferences → AI → MCP Configuration</code>
                      </p>
                      <CodeBlock
                        id="windsurf-config"
                        language="json"
                        code={`{
  "mcp_servers": {
    "kratos": {
      "command": "npx",
      "args": ["kratos-mcp"]
    }
  }
}`}
                      />
                    </div>

                    <div>
                      <h4 className="font-mono text-dark-text mb-2 flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        VS Code (with Cline/Continue)
                      </h4>
                      <p className="text-dark-text-secondary mb-2">
                        Navigate to: <code className="px-2 py-1 bg-dark-card rounded text-white text-sm">Extension Settings → MCP Server Configuration</code>
                      </p>
                      <CodeBlock
                        id="vscode-config"
                        language="json"
                        code={`{
  "cline.mcpServers": {
    "kratos": {
      "command": "npx",
      "args": ["kratos-mcp"]
    }
  }
}`}
                      />
                    </div>

                    <div>
                      <h4 className="font-mono text-dark-text mb-2 flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Augment Code
                      </h4>
                      <p className="text-dark-text-secondary mb-2">
                        Navigate to: <code className="px-2 py-1 bg-dark-card rounded text-white text-sm">AI Settings → Memory Provider → MCP</code>
                      </p>
                      <CodeBlock
                        id="augment-config"
                        language="json"
                        code={`{
  "memory_provider": "mcp",
  "mcp_config": {
    "server": "npx kratos-mcp",
    "project_path": "/path/to/project"
  }
}`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">Verify Installation</h3>
                  <CodeBlock
                    id="verify-install"
                    language="bash"
                    code={`# Check version
kratos-mcp --version

# Test connection
kratos-mcp test

# View help
kratos-mcp --help`}
                  />
                </div>
              </div>
            </section>

            {/* First Memory */}
            <section id="first-memory" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Brain className="h-8 w-8 text-neon-cyan" />
                Your First Memory
              </h2>

              <p className="text-dark-text-secondary mb-6">
                Learn how to create, search, and manage memories in your project.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-3">Creating a Memory</h3>
                  <p className="text-dark-text-secondary mb-3">
                    In any AI coding tool, use these commands to interact with Kratos:
                  </p>
                  <CodeBlock
                    id="create-memory"
                    language="typescript"
                    code={`// Save a memory about your project architecture
await kratos.memory.save({
  summary: "Authentication uses JWT with refresh tokens",
  text: "The authentication system implements JWT tokens with a 15-minute expiry and refresh token rotation. Tokens are stored in httpOnly cookies for security.",
  importance: 5,
  tags: ["auth", "security", "jwt"],
  paths: ["src/auth/**/*.ts"]
})`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-3">Searching Memories</h3>
                  <CodeBlock
                    id="search-memory"
                    language="typescript"
                    code={`// Search for relevant memories
const memories = await kratos.memory.search({
  q: "authentication flow",
  k: 5,  // Return top 5 results
  tags: ["auth"]  // Optional: filter by tags
})

// Results include relevance scores
memories.forEach(mem => {
  console.log(\`[\${mem.score}] \${mem.summary}\`)
})`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-3">Automatic Context Injection</h3>
                  <Alert type="info">
                    Kratos automatically injects relevant memories based on your current task. 
                    No manual intervention needed!
                  </Alert>
                  <CodeBlock
                    id="context-injection"
                    language="typescript"
                    code={`// Preview what context will be injected
const preview = await kratos.context.preview({
  task: "Implement password reset flow",
  open_files: ["src/auth/reset.ts"],
  budget_bytes: 8000
})

// Kratos finds and injects:
// - Previous auth implementations
// - Security decisions
// - Email service configurations
// - Related API endpoints`}
                  />
                </div>
              </div>
            </section>

            {/* Memory System */}
            <section id="memory-system" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Database className="h-8 w-8 text-neon-blue" />
                Memory System Architecture
              </h2>

              <p className="text-dark-text-secondary mb-6">
                Understanding how Kratos stores and retrieves memories for optimal AI context.
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">Memory Structure</h3>
                  <CodeBlock
                    id="memory-structure"
                    language="typescript"
                    code={`interface Memory {
  id: string              // Unique identifier
  summary: string         // Short 1-2 line summary
  text: string           // Full memory content
  importance: 1-5        // Priority level
  tags: string[]         // Categorization tags
  paths: string[]        // Related file paths (globs)
  created_at: number     // Unix timestamp
  updated_at: number     // Last modification
  ttl?: number          // Optional time-to-live
  metadata?: {          // Custom metadata
    [key: string]: any
  }
}`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">Storage Backend</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                      <HardDrive className="h-6 w-6 text-neon-blue mb-2" />
                      <h4 className="font-mono text-dark-text mb-2">SQLite Database</h4>
                      <p className="text-sm text-dark-text-secondary">
                        Fast, embedded database with full-text search and vector indexing
                      </p>
                    </div>
                    <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                      <Cpu className="h-6 w-6 text-neon-cyan mb-2" />
                      <h4 className="font-mono text-dark-text mb-2">Vector Embeddings</h4>
                      <p className="text-sm text-dark-text-secondary">
                        Semantic search using locally computed embeddings
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">Memory Lifecycle</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-mono text-neon-blue">1</span>
                      </div>
                      <div>
                        <h4 className="font-mono text-dark-text mb-1">Creation</h4>
                        <p className="text-sm text-dark-text-secondary">
                          Memory is created with content, importance, and metadata
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-mono text-neon-blue">2</span>
                      </div>
                      <div>
                        <h4 className="font-mono text-dark-text mb-1">Indexing</h4>
                        <p className="text-sm text-dark-text-secondary">
                          Automatic embedding generation and full-text indexing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-mono text-neon-cyan">3</span>
                      </div>
                      <div>
                        <h4 className="font-mono text-dark-text mb-1">Retrieval</h4>
                        <p className="text-sm text-dark-text-secondary">
                          Hybrid search combining semantic and keyword matching
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-mono text-green-500">4</span>
                      </div>
                      <div>
                        <h4 className="font-mono text-dark-text mb-1">Injection</h4>
                        <p className="text-sm text-dark-text-secondary">
                          Automatic context injection based on relevance scoring
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Concepts: Project Isolation */}
            <section id="project-isolation" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Lock className="h-8 w-8 text-neon-cyan" />
                Project Isolation
              </h2>
              <p className="text-dark-text-secondary mb-6">
                Each project maintains completely isolated memory stores, ensuring zero cross-contamination.
              </p>
              <div className="space-y-6">
                <div className="p-6 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <h3 className="text-xl font-mono text-dark-text mb-3">Isolation Benefits</h3>
                  <ul className="space-y-2 text-dark-text-secondary">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>Complete memory isolation between projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>No accidental context leakage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>Per-project configuration and settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>Independent memory limits and retention</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Core Concepts: Context Injection */}
            <section id="context-injection" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Cpu className="h-8 w-8 text-neon-cyan" />
                Context Injection
              </h2>
              <p className="text-dark-text-secondary mb-6">
                Smart, automatic injection of relevant memories based on your current task.
              </p>
              <div className="space-y-6">
                <div className="p-6 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <h3 className="text-xl font-mono text-dark-text mb-3">How It Works</h3>
                  <ol className="space-y-3 text-dark-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue font-mono">1</span>
                      <span>Analyzes your current task and open files</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue font-mono">2</span>
                      <span>Searches for relevant memories using semantic matching</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue font-mono">3</span>
                      <span>Ranks memories by relevance and importance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue font-mono">4</span>
                      <span>Automatically injects top memories into AI context</span>
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Core Concepts: Semantic Search */}
            <section id="semantic-search" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Search className="h-8 w-8 text-neon-cyan" />
                Semantic Search
              </h2>
              <p className="text-dark-text-secondary mb-6">
                Advanced search capabilities using both keyword and semantic matching.
              </p>
              <div className="space-y-6">
                <div className="p-6 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <h3 className="text-xl font-mono text-dark-text mb-3">Search Features</h3>
                  <ul className="space-y-2 text-dark-text-secondary">
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>Hybrid search combining semantic and keyword matching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>95.8% accuracy in finding relevant memories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>Sub-10ms retrieval times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>Tag-based filtering and path matching</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Memory Operations API */}
            <section id="memory-operations" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Code className="h-8 w-8 text-neon-blue" />
                Memory Operations API
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">memory.save()</h3>
                  <p className="text-dark-text-secondary mb-3">Save a new memory to the project store.</p>
                  <CodeBlock
                    id="api-memory-save"
                    language="typescript"
                    code={`// Full example with all options
const memory = await kratos.memory.save({
  summary: "Database connection pool configuration",
  text: \`Implemented connection pooling with:
    - Max connections: 20
    - Idle timeout: 10 seconds
    - Connection retry: 3 attempts
    Using pg-pool for PostgreSQL\`,
  importance: 4,
  tags: ["database", "performance", "postgresql"],
  paths: ["src/db/**/*.ts", "config/database.json"],
  ttl: 2592000,  // 30 days in seconds
  metadata: {
    version: "2.0.0",
    author: "john.doe",
    related_pr: "#456"
  }
})

console.log("Memory saved:", memory.id)`}
                  />

                  <h4 className="font-mono text-sm text-dark-text mt-4 mb-2">Parameters</h4>
                  <div className="bg-dark-card/30 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-border/50">
                          <th className="text-left py-2 text-dark-text">Parameter</th>
                          <th className="text-left py-2 text-dark-text">Type</th>
                          <th className="text-left py-2 text-dark-text">Required</th>
                          <th className="text-left py-2 text-dark-text">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-dark-text-secondary">
                        <tr className="border-b border-dark-border/30">
                          <td className="py-2 font-mono">summary</td>
                          <td className="py-2 font-mono">string</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">Short 1-2 line summary</td>
                        </tr>
                        <tr className="border-b border-dark-border/30">
                          <td className="py-2 font-mono">text</td>
                          <td className="py-2 font-mono">string</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">Full memory content</td>
                        </tr>
                        <tr className="border-b border-dark-border/30">
                          <td className="py-2 font-mono">importance</td>
                          <td className="py-2 font-mono">1-5</td>
                          <td className="py-2">No</td>
                          <td className="py-2">Priority level (default: 3)</td>
                        </tr>
                        <tr className="border-b border-dark-border/30">
                          <td className="py-2 font-mono">tags</td>
                          <td className="py-2 font-mono">string[]</td>
                          <td className="py-2">No</td>
                          <td className="py-2">Categorization tags</td>
                        </tr>
                        <tr className="border-b border-dark-border/30">
                          <td className="py-2 font-mono">paths</td>
                          <td className="py-2 font-mono">string[]</td>
                          <td className="py-2">No</td>
                          <td className="py-2">File paths (supports globs)</td>
                        </tr>
                        <tr className="border-b border-dark-border/30">
                          <td className="py-2 font-mono">ttl</td>
                          <td className="py-2 font-mono">number</td>
                          <td className="py-2">No</td>
                          <td className="py-2">Time to live in seconds</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">metadata</td>
                          <td className="py-2 font-mono">object</td>
                          <td className="py-2">No</td>
                          <td className="py-2">Custom metadata</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">memory.search()</h3>
                  <p className="text-dark-text-secondary mb-3">Search memories using semantic and keyword matching.</p>
                  <CodeBlock
                    id="api-memory-search"
                    language="typescript"
                    code={`// Search with multiple filters
const results = await kratos.memory.search({
  q: "authentication security",
  k: 10,                      // Return top 10 results
  tags: ["auth", "security"], // Filter by tags (OR)
  require_path_match: true,   // Must match current file paths
  include_expired: false      // Exclude expired memories
})

// Process results
results.forEach(({ memory, score }) => {
  console.log(\`Score: \${score.toFixed(3)}\`)
  console.log(\`Summary: \${memory.summary}\`)
  console.log(\`Tags: \${memory.tags.join(", ")}\`)
  console.log("---")
})`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">memory.get_recent()</h3>
                  <p className="text-dark-text-secondary mb-3">Retrieve recent memories from the project.</p>
                  <CodeBlock
                    id="api-memory-recent"
                    language="typescript"
                    code={`// Get recent memories with filters
const recent = await kratos.memory.get_recent({
  k: 20,                        // Max results
  path_prefix: "src/auth",      // Filter by path prefix
  include_expired: false        // Exclude expired
})

// Display timeline
recent.forEach(memory => {
  const date = new Date(memory.created_at)
  console.log(\`[\${date.toLocaleDateString()}] \${memory.summary}\`)
})`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">memory.forget()</h3>
                  <p className="text-dark-text-secondary mb-3">Delete a memory by ID.</p>
                  <CodeBlock
                    id="api-memory-forget"
                    language="typescript"
                    code={`// Delete a specific memory
await kratos.memory.forget({
  id: "mem_abc123xyz"
})

// Bulk delete with search
const outdated = await kratos.memory.search({
  q: "deprecated implementation",
  k: 100
})

for (const { memory } of outdated) {
  await kratos.memory.forget({ id: memory.id })
}`}
                  />
                </div>
              </div>
            </section>

            {/* Context API */}
            <section id="context-api" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <GitBranch className="h-8 w-8 text-neon-cyan" />
                Context Injection API
              </h2>

              <p className="text-dark-text-secondary mb-6">
                Control how memories are automatically injected into your AI's context.
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">context.preview()</h3>
                  <p className="text-dark-text-secondary mb-3">Preview what context will be injected for a task.</p>
                  <CodeBlock
                    id="api-context-preview"
                    language="typescript"
                    code={`const preview = await kratos.context.preview({
  task: "Implement user profile API endpoint",
  open_files: [
    "src/api/users.ts",
    "src/models/User.ts"
  ],
  budget_bytes: 8000,
  mode: "smart",  // "hard" | "soft" | "smart"
  top_k: 10
})

console.log(\`Will inject \${preview.memories.length} memories\`)
console.log(\`Total size: \${preview.total_bytes} bytes\`)
console.log(\`Relevance score: \${preview.avg_score}\`)

// Preview includes:
preview.memories.forEach(mem => {
  console.log(\`- [\${mem.score}] \${mem.summary}\`)
})`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">context.rules_get() / rules_set()</h3>
                  <p className="text-dark-text-secondary mb-3">Configure context injection behavior.</p>
                  <CodeBlock
                    id="api-context-rules"
                    language="typescript"
                    code={`// Get current rules
const rules = await kratos.context.rules_get()

// Update injection rules
await kratos.context.rules_set({
  minImportance: 3,              // Min importance threshold
  conceptImportanceThreshold: 4, // For global concepts
  maxMemoryAge: 7776000000,      // 90 days in milliseconds
  dedupeThreshold: 0.85,         // Similarity threshold
  pathBoostMultiplier: 1.5       // Boost for path matches
})

// Mode explanations:
// "hard": Strict matching, high precision
// "soft": Relaxed matching, high recall  
// "smart": Adaptive based on task context`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">Injection Modes</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                      <h4 className="font-mono text-dark-text mb-2">Hard Mode</h4>
                      <p className="text-sm text-dark-text-secondary">
                        Strict relevance matching. Only highly relevant memories injected.
                      </p>
                    </div>
                    <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                      <h4 className="font-mono text-dark-text mb-2">Soft Mode</h4>
                      <p className="text-sm text-dark-text-secondary">
                        Relaxed matching. More context injected for exploration.
                      </p>
                    </div>
                    <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                      <h4 className="font-mono text-dark-text mb-2">Smart Mode</h4>
                      <p className="text-sm text-dark-text-secondary">
                        Adaptive algorithm based on task complexity and context.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Security API */}
            <section id="security-api" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-500" />
                Security API
              </h2>

              <Alert type="warning">
                Kratos includes built-in security features for PII detection, encryption, and compliance.
              </Alert>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">security.scan()</h3>
                  <p className="text-dark-text-secondary mb-3">Scan text for PII and sensitive data.</p>
                  <CodeBlock
                    id="api-security-scan"
                    language="typescript"
                    code={`// Scan for PII before saving
const scanResult = await kratos.security.scan({
  text: "User email is john.doe@example.com, SSN: 123-45-6789",
  redact: true  // Get redacted version
})

if (scanResult.found_pii) {
  console.log("PII detected:", scanResult.pii_types)
  // Types: email, ssn, credit_card, phone, api_key, etc.
  
  // Use redacted version
  console.log("Redacted:", scanResult.redacted_text)
  // Output: "User email is [EMAIL_REDACTED], SSN: [SSN_REDACTED]"
}`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">security.encrypt() / decrypt()</h3>
                  <p className="text-dark-text-secondary mb-3">Encrypt sensitive data at rest.</p>
                  <CodeBlock
                    id="api-security-encrypt"
                    language="typescript"
                    code={`// Encrypt sensitive configuration
const encrypted = await kratos.security.encrypt({
  data: {
    api_key: "sk-secret-key-12345",
    db_password: "super-secret-pass",
    private_key: "-----BEGIN RSA PRIVATE KEY-----"
  }
})

// Store encrypted blob
await kratos.memory.save({
  summary: "Encrypted API credentials",
  text: encrypted.ciphertext,
  tags: ["credentials", "encrypted"],
  metadata: { 
    encrypted: true,
    algorithm: encrypted.algorithm 
  }
})

// Decrypt when needed
const decrypted = await kratos.security.decrypt({
  ciphertext: encrypted.ciphertext,
  nonce: encrypted.nonce
})`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">GDPR Compliance</h3>
                  <CodeBlock
                    id="api-security-gdpr"
                    language="typescript"
                    code={`// Export user data (GDPR Article 20)
const userData = await kratos.security.gdpr_export({
  user_id: "user_123"
})

// Returns all memories and data associated with user
fs.writeFileSync('user_export.json', JSON.stringify(userData))

// Delete user data (GDPR Article 17 - Right to Erasure)
await kratos.security.gdpr_delete({
  target_type: "user",
  target_id: "user_123",
  user_id: "user_123",
  reason: "User requested deletion under GDPR"
})

// Apply retention policies
await kratos.security.retention_apply({
  memory_id: "mem_xyz",
  policy: "temporary"  // "default" | "temporary" | "important" | "permanent"
})`}
                  />
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-neon-green" />
                Best Practices
              </h2>

              {/* Memory Management */}
              <div id="memory-management" className="mb-8">
                <h3 className="text-2xl font-mono text-dark-text mb-4">Memory Management</h3>
                <div className="p-6 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <ul className="space-y-3 text-dark-text-secondary">
                    <li className="flex items-start gap-2">
                      <Database className="h-5 w-5 text-neon-blue mt-0.5" />
                      <span>Set appropriate importance levels (1-5) for your memories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Database className="h-5 w-5 text-neon-blue mt-0.5" />
                      <span>Use TTL for temporary memories to auto-cleanup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Database className="h-5 w-5 text-neon-blue mt-0.5" />
                      <span>Tag memories consistently for better retrieval</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Database className="h-5 w-5 text-neon-blue mt-0.5" />
                      <span>Regularly review and clean up outdated memories</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Security Guidelines */}
              <div id="security" className="mb-8">
                <h3 className="text-2xl font-mono text-dark-text mb-4">Security Guidelines</h3>
                <div className="p-6 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <ul className="space-y-3 text-dark-text-secondary">
                    <li className="flex items-start gap-2">
                      <Lock className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>Enable PII scanning for sensitive projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>Use encryption at rest for production environments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>Never store API keys or passwords in plain text memories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="h-5 w-5 text-neon-green mt-0.5" />
                      <span>Implement retention policies for GDPR compliance</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Performance Tips */}
              <div id="performance" className="mb-8">
                <h3 className="text-2xl font-mono text-dark-text mb-4">Performance Tips</h3>
                <div className="p-6 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <ul className="space-y-3 text-dark-text-secondary">
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>Limit memory size to 100MB per project</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>Use path filtering to reduce search scope</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>Enable auto-cleanup at 80% capacity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="h-5 w-5 text-neon-yellow mt-0.5" />
                      <span>Use smart mode for balanced performance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Configuration */}
            <section id="config-file" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <Settings className="h-8 w-8 text-neon-blue" />
                Configuration
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-mono text-dark-text mb-4">Configuration File</h3>
                  <p className="text-dark-text-secondary mb-3">
                    Create a `.kratos.json` file in your project root:
                  </p>
                  <CodeBlock
                    id="config-example"
                    language="json"
                    code={`{
  "version": "1.4.1",
  "project": {
    "name": "my-awesome-app",
    "description": "E-commerce platform with AI features"
  },
  "memory": {
    "max_size_mb": 100,
    "auto_cleanup": true,
    "cleanup_threshold": 0.8,
    "default_importance": 3,
    "default_ttl": 2592000
  },
  "context": {
    "mode": "smart",
    "budget_bytes": 8000,
    "min_importance": 2,
    "dedupe_threshold": 0.85
  },
  "security": {
    "encrypt_at_rest": true,
    "scan_pii": true,
    "redact_pii": false,
    "retention_days": 90
  },
  "search": {
    "algorithm": "hybrid",
    "embedding_model": "local",
    "rerank": true,
    "boost_recent": 1.2
  },
  "integrations": {
    "claude_desktop": {
      "auto_inject": true,
      "show_memory_count": true
    },
    "vscode": {
      "enabled": false
    }
  }
}`}
                  />
                </div>

                <div id="environment-vars">
                  <h3 className="text-xl font-mono text-dark-text mb-4">Environment Variables</h3>
                  <CodeBlock
                    id="env-vars"
                    language="bash"
                    code={`# Core settings
KRATOS_PROJECT_PATH=/path/to/project
KRATOS_DATA_DIR=~/.kratos/data
KRATOS_LOG_LEVEL=info  # debug | info | warn | error

# Memory settings
KRATOS_MEMORY_MAX_SIZE=100  # MB
KRATOS_MEMORY_AUTO_CLEANUP=true
KRATOS_DEFAULT_TTL=2592000  # 30 days

# Security
KRATOS_ENCRYPT_AT_REST=true
KRATOS_SCAN_PII=true
KRATOS_ENCRYPTION_KEY=your-32-char-key

# Performance
KRATOS_CACHE_SIZE=50  # MB
KRATOS_WORKER_THREADS=4
KRATOS_BATCH_SIZE=100

# Debug
KRATOS_DEBUG=false
KRATOS_VERBOSE=false
KRATOS_TRACE_QUERIES=false`}
                  />
                </div>

                <div id="advanced-settings">
                  <h3 className="text-xl font-mono text-dark-text mb-4">Advanced Settings</h3>
                  <Alert type="info">
                    These settings are for advanced users who need fine-grained control.
                  </Alert>
                  <CodeBlock
                    id="advanced-config"
                    language="json"
                    code={`{
  "advanced": {
    "vector_dimensions": 768,
    "similarity_metric": "cosine",
    "index_type": "hnsw",
    "hnsw_m": 16,
    "hnsw_ef": 200,
    "chunk_size": 512,
    "chunk_overlap": 128,
    "embedding_batch_size": 32,
    "cache_ttl": 3600,
    "gc_interval": 300,
    "compact_threshold": 0.5,
    "wal_mode": true,
    "mmap_size": 268435456,
    "page_size": 4096
  }
}`}
                  />
                </div>
              </div>
            </section>

            {/* Common Issues */}
            <section id="common-issues" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6 flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                Troubleshooting
              </h2>

              <div className="space-y-6">
                <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <h3 className="font-mono text-dark-text mb-2">
                    "No tools available" in your AI tool
                  </h3>
                  <p className="text-dark-text-secondary mb-3">
                    This usually means the MCP server isn't starting correctly.
                  </p>
                  <CodeBlock
                    id="fix-no-tools"
                    language="bash"
                    code={`# 1. Check installation
kratos-mcp --version

# 2. Test server directly
kratos-mcp test

# 3. Check your AI tool's config file
# Claude: ~/Library/Application\\ Support/Claude/claude_desktop_config.json
# Cursor: Check Settings → MCP Servers
# Windsurf: Check Preferences → AI → MCP
# VS Code: Check extension settings

# 4. Restart your AI tool
# Quit and reopen the application`}
                  />
                </div>

                <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <h3 className="font-mono text-dark-text mb-2">
                    Memory not persisting between sessions
                  </h3>
                  <p className="text-dark-text-secondary mb-3">
                    Check that the project path is correctly configured.
                  </p>
                  <CodeBlock
                    id="fix-persistence"
                    language="json"
                    code={`// Ensure absolute path in config
{
  "mcpServers": {
    "kratos": {
      "command": "npx",
      "args": ["kratos-mcp"]
    }
  }
}`}
                  />
                </div>

                <div className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                  <h3 className="font-mono text-dark-text mb-2">
                    High memory usage
                  </h3>
                  <p className="text-dark-text-secondary mb-3">
                    Configure cleanup and limits:
                  </p>
                  <CodeBlock
                    id="fix-memory"
                    language="bash"
                    code={`# Set memory limits
export KRATOS_MEMORY_MAX_SIZE=50  # MB
export KRATOS_CACHE_SIZE=25       # MB

# Enable auto cleanup
export KRATOS_MEMORY_AUTO_CLEANUP=true
export KRATOS_CLEANUP_THRESHOLD=0.7

# Direct database location for manual management
# ~/.kratos/projects/[project-id]/memory.db`}
                  />
                </div>

                <Alert type="info">
                  For more help, check our GitHub issues or open a new one at{' '}
                  <a 
                    href="https://github.com/ceorkm/kratos-mcp/issues" 
                    className="text-neon-blue hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/ceorkm/kratos-mcp
                  </a>
                </Alert>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-16">
              <h2 className="text-3xl font-mono font-bold text-dark-text mb-6">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {[
                  {
                    q: "Which AI coding tools does Kratos support?",
                    a: "Kratos works with ALL MCP-compatible AI tools including Claude Desktop, Claude Code, Cursor, Windsurf, VS Code with Cline/Continue, Augment Code, and more. Any tool that supports the Model Context Protocol can use Kratos."
                  },
                  {
                    q: "How much memory does Kratos use?",
                    a: "By default, Kratos limits memory storage to 100MB per project and uses ~50MB RAM for indexing. This is configurable."
                  },
                  {
                    q: "Can I use Kratos with multiple projects?",
                    a: "Yes! Each project has isolated memory. Kratos automatically manages project context based on your current working directory."
                  },
                  {
                    q: "Can I share memories between different AI tools?",
                    a: "Yes! Since Kratos stores memories locally, all your AI tools can access the same project memories. Work in Cursor during the day and switch to Claude Code at night - your context follows you."
                  },
                  {
                    q: "Is my data secure?",
                    a: "Kratos stores all data locally, supports encryption at rest, and includes PII detection/redaction."
                  },
                  {
                    q: "How does Kratos compare to vector databases?",
                    a: "Kratos uses embedded SQLite with vector indexing - it's faster, simpler, and requires no external services."
                  },
                  {
                    q: "Can I backup my memories?",
                    a: "Yes! Kratos stores all memories in a SQLite database. You can directly backup the database file located at ~/.kratos/projects/[project-id]/memory.db. The database is portable and can be copied to another machine or restored from backup."
                  }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
                    <h3 className="font-mono text-dark-text mb-2">{item.q}</h3>
                    {typeof item.a === 'string' ? (
                      <p className="text-dark-text-secondary">{item.a}</p>
                    ) : (
                      <div className="text-dark-text-secondary">{item.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        </main>

        {/* Right Sidebar - On This Page */}
        <motion.aside 
          className="hidden xl:block w-64 h-[calc(100vh-5rem)] sticky top-20 p-6"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-mono text-dark-text-secondary mb-4">ON THIS PAGE</h3>
          <nav className="space-y-2">
            {tocStructure.flatMap(section => 
              section.children.filter(child => {
                const element = document.getElementById(child.id)
                return element !== null
              })
            ).map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block text-sm py-1 pl-2 border-l-2 transition-all ${
                  activeSection === item.id
                    ? 'text-neon-blue border-neon-blue'
                    : 'text-dark-text-secondary border-dark-border/30 hover:text-dark-text hover:border-dark-border'
                }`}
              >
                {item.title}
              </a>
            ))}
          </nav>

          <div className="mt-8 p-4 bg-dark-card/50 rounded-lg border border-dark-border/30">
            <h4 className="text-sm font-mono text-dark-text mb-2">Need Help?</h4>
            <div className="space-y-2">
              <a 
                href="https://github.com/ceorkm/kratos-mcp/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-dark-text-secondary hover:text-neon-blue transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                GitHub Issues
              </a>
              <a 
                href="https://github.com/ceorkm/kratos-mcp/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-dark-text-secondary hover:text-neon-blue transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Discussions
              </a>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  )
}

export default Docs