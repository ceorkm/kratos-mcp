import { ChevronRight, Brain, Code2 } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-gray-200">
            <Brain className="h-5 w-5 text-kratos-accent" />
            <span className="text-sm font-medium">Memory System for AI Coding Tools</span>
          </div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
          Kratos MCP
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Never explain your codebase again. Let AI remember everything.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-kratos-black text-white rounded-lg hover:bg-kratos-gray transition-colors flex items-center justify-center">
            Get Started
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
          <button className="px-8 py-4 bg-white border-2 border-kratos-black rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
            <Code2 className="mr-2 h-5 w-5" />
            View on GitHub
          </button>
        </div>
        
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold">100%</div>
            <div className="text-sm text-gray-600">Project Isolation</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">95.8%</div>
            <div className="text-sm text-gray-600">Context Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">0ms</div>
            <div className="text-sm text-gray-600">Setup Time</div>
          </div>
        </div>
      </div>
    </section>
  )
}