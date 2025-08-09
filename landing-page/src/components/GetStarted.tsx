import { Check, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function GetStarted() {
  const [copied, setCopied] = useState(false)
  
  const installCommand = "git clone https://github.com/yourusername/kratos-mcp.git && cd kratos-mcp && npm install && npm run build"
  
  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const tools = [
    { name: "Claude Desktop", supported: true },
    { name: "Cursor", supported: true },
    { name: "Windsurf", supported: true },
    { name: "Continue", supported: true },
    { name: "Any MCP Tool", supported: true }
  ]
  
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Get Started</h2>
          <p className="text-xl text-gray-600">
            Install once, use everywhere
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-kratos-light rounded-xl p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4">Quick Install</h3>
            <div className="bg-white rounded-lg p-4 flex items-center justify-between">
              <code className="text-sm font-mono flex-1 overflow-x-auto pr-4">
                {installCommand}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-8 border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold mb-4">Works With</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tools.map((tool, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/yourusername/kratos-mcp"
              className="px-8 py-4 bg-kratos-black text-white rounded-lg hover:bg-kratos-gray transition-colors flex items-center justify-center"
            >
              View on GitHub
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
            <a
              href="https://docs.kratos-mcp.dev"
              className="px-8 py-4 bg-white border-2 border-kratos-black rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              Read Documentation
            </a>
          </div>
        </div>
        
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            Built for developers who value their time.
          </p>
        </div>
      </div>
    </section>
  )
}