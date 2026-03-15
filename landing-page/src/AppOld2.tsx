import { Brain, Zap, Lock, FileText, GitBranch, Search, Shield, Settings } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-kratos-light">
      {/* Header */}
      <header className="border-b border-kratos-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-kratos-black/20" />
              <span className="text-xs text-kratos-gray">End Context Amnesia Forever</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-mono font-bold text-kratos-black mb-2">
            Kratos MCP
          </h1>
          <p className="text-2xl sm:text-3xl text-kratos-black font-bold mb-6">
            The Best Model Context Protocol Memory Server
          </p>
          <p className="text-xl text-kratos-gray mb-10 max-w-3xl mx-auto">
            The #1 MCP memory implementation for Claude Desktop, Cursor, and all AI tools. 
            95.8% context accuracy, &lt;10ms retrieval. End AI amnesia forever with the best Model Context Protocol server.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#install"
              className="px-8 py-4 bg-kratos-black text-kratos-light font-mono text-lg hover:bg-kratos-black/90 transition-colors"
            >
              Get Started ↓
            </a>
            <a 
              href="https://github.com/ceorkm/kratos-mcp"
              className="px-8 py-4 border-2 border-kratos-black text-kratos-black font-mono text-lg hover:bg-kratos-black hover:text-kratos-light transition-colors"
            >
              📁 View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Never Lose Context Again */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-mono font-bold text-kratos-black mb-4 text-center">
            Never Lose Context Again
          </h2>
          <p className="text-center text-lg text-kratos-gray mb-16 max-w-3xl mx-auto">
            Every conversation builds on the last. Every project stays isolated. 
            Every decision remembered.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-kratos-light p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-mono text-xl font-bold text-kratos-black mb-4">
                Persistent Project Memory
              </h3>
              <p className="text-kratos-gray">
                Your AI remembers every architectural decision, code pattern, and project requirement. 
                Come back after a month and continue exactly where you left off.
              </p>
            </div>

            <div className="bg-kratos-light p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-mono text-xl font-bold text-kratos-black mb-4">
                Complete Project Isolation
              </h3>
              <p className="text-kratos-gray">
                Work on 50 projects without context bleeding. Each project maintains its own memory space, 
                ensuring zero cross-contamination between different codebases.
              </p>
            </div>

            <div className="bg-kratos-light p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-mono text-xl font-bold text-kratos-black mb-4">
                Intelligent Context Injection
              </h3>
              <p className="text-kratos-gray">
                Kratos automatically injects the most relevant memories based on your current task. 
                No manual context management needed.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="bg-kratos-light p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-mono text-xl font-bold text-kratos-black mb-4">
                Semantic Memory Search
              </h3>
              <p className="text-kratos-gray">
                Find relevant context instantly with intelligent search. Kratos understands intent, 
                not just keywords, retrieving exactly what you need.
              </p>
            </div>

            <div className="bg-kratos-light p-8 rounded-lg text-center border-2 border-blue-500">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-mono text-xl font-bold text-kratos-black mb-4">
                Built-in Security
              </h3>
              <p className="text-kratos-gray">
                Automatic PII detection and redaction. GDPR-compliant data management. 
                Your sensitive data stays protected while maintaining context.
              </p>
            </div>

            <div className="bg-kratos-light p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-mono text-xl font-bold text-kratos-black mb-4">
                Zero Configuration
              </h3>
              <p className="text-kratos-gray">
                Just point to a directory and start. No complex setup, no configuration files. 
                Kratos intelligently manages everything behind the scenes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-mono font-bold text-kratos-black mb-12 text-center">
            The Context Amnesia Problem
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-mono font-bold text-red-600 mb-6">❌ Without Kratos</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">Start every conversation from scratch</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">Repeatedly explain your codebase structure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">Lose all context between sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">Manually manage context for each project</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">AI forgets your decisions and patterns</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-mono font-bold text-green-600 mb-6">✅ With Kratos</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Continue exactly where you left off</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">AI knows your entire project history</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Perfect memory across months of development</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Automatic context management per project</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Every decision permanently remembered</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MCP vs Other Implementations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-mono font-bold text-kratos-black mb-4 text-center">
            Why Kratos Is The Superior MCP Implementation
          </h2>
          <p className="text-center text-lg text-kratos-gray mb-16">
            Designed specifically for persistent memory while other MCP servers focus on basic tools
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-mono font-bold text-red-600 mb-6">❌ Basic MCP Servers</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">Limited to simple filesystem and fetch operations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">No context retention between sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">Complex configuration required</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">No project isolation or memory management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-kratos-gray">Technical documentation only - no real-world examples</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-mono font-bold text-green-600 mb-6">✅ Kratos MCP</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Specialized persistent memory and context management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">95.8% context accuracy with permanent storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Zero configuration - works out of the box</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Complete project isolation across unlimited projects</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-kratos-gray">Real-world examples and instant setup guide</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-kratos-light p-8 rounded-lg">
              <h3 className="font-mono text-2xl font-bold text-kratos-black mb-4">
                📊 MCP Performance Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-mono font-bold text-green-600 mb-2">95.8%</div>
                  <div className="text-sm text-kratos-gray">Kratos Context Accuracy</div>
                  <div className="text-xs text-red-500">vs 0% for basic MCP servers</div>
                </div>
                <div>
                  <div className="text-3xl font-mono font-bold text-green-600 mb-2">&lt;10ms</div>
                  <div className="text-sm text-kratos-gray">Memory Retrieval Time</div>
                  <div className="text-xs text-red-500">vs N/A for basic MCP servers</div>
                </div>
                <div>
                  <div className="text-3xl font-mono font-bold text-green-600 mb-2">∞</div>
                  <div className="text-sm text-kratos-gray">Project Memory Storage</div>
                  <div className="text-xs text-red-500">vs session-only for others</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50" id="install">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-mono font-bold text-kratos-black mb-4 text-center">
            MCP Memory Setup Guide - 3 Simple Steps
          </h2>
          <p className="text-center text-lg text-kratos-gray mb-16">
            The fastest way to add perfect memory to any MCP-compatible AI tool. Zero configuration needed.
          </p>
          
          <div className="space-y-8">
            <div className="bg-kratos-light p-8 rounded-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-kratos-black text-kratos-light rounded-lg flex items-center justify-center font-mono text-lg">
                  01
                </div>
                <div className="flex-1">
                  <h3 className="font-mono text-xl font-bold text-kratos-black mb-3">Install Kratos</h3>
                  <p className="text-kratos-gray mb-4">One command installation</p>
                  <div className="bg-kratos-black text-kratos-light p-4 rounded">
                    <code className="font-mono">npm install -g kratos-mcp@latest --yes</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-kratos-light p-8 rounded-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-kratos-black text-kratos-light rounded-lg flex items-center justify-center font-mono text-lg">
                  02
                </div>
                <div className="flex-1">
                  <h3 className="font-mono text-xl font-bold text-kratos-black mb-3">Add to Claude Desktop</h3>
                  <p className="text-kratos-gray mb-4">Add to your MCP config file</p>
                  <div className="bg-kratos-black/5 p-4 rounded">
                    <pre className="font-mono text-sm overflow-x-auto">{`{
  "mcpServers": {
    "kratos": {
      "command": "kratos-mcp",
      "args": []
    }
  }
}`}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-kratos-light p-8 rounded-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-kratos-black text-kratos-light rounded-lg flex items-center justify-center font-mono text-lg">
                  03
                </div>
                <div className="flex-1">
                  <h3 className="font-mono text-xl font-bold text-kratos-black mb-3">Start Using Memory</h3>
                  <p className="text-kratos-gray mb-4">Your AI now has perfect memory</p>
                  <div className="bg-kratos-black/5 p-4 rounded">
                    <pre className="font-mono text-sm text-kratos-gray">{`Available tools:
• prd_update - Living project documentation
• context_build - Intelligent codebase analysis  
• prompt_build - Context-aware prompt generation
• memory_store - Permanent knowledge storage`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-mono font-bold text-kratos-black mb-4 text-center">
            See The Magic
          </h2>
          <p className="text-center text-lg text-kratos-gray mb-12">
            Watch how Kratos transforms AI development
          </p>
          
          <div className="bg-kratos-black text-kratos-light p-8 rounded-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-2 text-xs text-kratos-light/60 font-mono">Claude Desktop with Kratos MCP</span>
            </div>
            
            <div className="space-y-6 font-mono text-sm">
              <div className="border-l-2 border-blue-400 pl-4">
                <div className="text-blue-400 mb-2">Day 1: Starting a new React project</div>
                <div className="text-kratos-light/80">
                  <span className="text-green-400">You:</span> "I'm starting a new e-commerce platform with React and Stripe"<br/>
                  <span className="text-yellow-400">[kratos: prd_update]</span> ✓ Created project requirements<br/>
                  <span className="text-yellow-400">[kratos: memory_store]</span> ✓ Saved tech stack decisions
                </div>
              </div>
              
              <div className="border-l-2 border-purple-400 pl-4">
                <div className="text-purple-400 mb-2">Day 30: Coming back after vacation</div>
                <div className="text-kratos-light/80">
                  <span className="text-green-400">You:</span> "What was our authentication approach?"<br/>
                  <span className="text-yellow-400">[kratos: context_retrieval]</span><br/>
                  <span className="text-white">Claude:</span> "We're using JWT with refresh tokens, 15-min expiry, 
                  stored in httpOnly cookies. You decided this on Day 1 for security compliance."
                </div>
              </div>
              
              <div className="border-l-2 border-green-400 pl-4">
                <div className="text-green-400 mb-2">Day 90: Deep into development</div>
                <div className="text-kratos-light/80">
                  <span className="text-green-400">You:</span> "Generate code for the checkout flow"<br/>
                  <span className="text-yellow-400">[kratos: prompt_build]</span><br/>
                  <span className="text-white">Claude:</span> "I'll create the checkout using your established patterns: 
                  custom hooks for state, Stripe Elements, your error boundary wrapper..."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-kratos-black text-kratos-light">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-mono font-bold mb-2">100%</div>
              <div className="text-sm text-kratos-light/60">Context Retention</div>
            </div>
            <div>
              <div className="text-4xl font-mono font-bold mb-2">0ms</div>
              <div className="text-sm text-kratos-light/60">Lookup Time</div>
            </div>
            <div>
              <div className="text-4xl font-mono font-bold mb-2">∞</div>
              <div className="text-sm text-kratos-light/60">Projects</div>
            </div>
            <div>
              <div className="text-4xl font-mono font-bold mb-2">Forever</div>
              <div className="text-sm text-kratos-light/60">Memory</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-mono font-bold text-kratos-black mb-6">
            End Context Amnesia Today
          </h2>
          <p className="text-xl text-kratos-gray mb-10">
            Join developers who never explain their codebase twice
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a 
              href="https://github.com/ceorkm/kratos-mcp"
              className="px-8 py-4 bg-kratos-black text-kratos-light font-mono text-lg hover:bg-kratos-black/90 transition-colors inline-flex items-center gap-3"
            >
              <GitBranch className="h-5 w-5" />
              Get Kratos MCP
            </a>
            <a 
              href="https://github.com/ceorkm/kratos-mcp#readme"
              className="px-8 py-4 border-2 border-kratos-black text-kratos-black font-mono text-lg hover:bg-kratos-black hover:text-kratos-light transition-colors inline-flex items-center gap-3"
            >
              <FileText className="h-5 w-5" />
              Documentation
            </a>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-kratos-gray">
              Transform your AI from a goldfish into an elephant
            </p>
            <p className="text-xs text-kratos-gray font-mono">
              v1.4.1 · MIT License · Built for developers who value their time
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App