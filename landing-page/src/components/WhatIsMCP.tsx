import { Zap, Lock, Globe } from 'lucide-react'

export default function WhatIsMCP() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What is Kratos MCP?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A memory system that gives AI coding tools perfect context about your project.
            Works with any tool that supports the Model Context Protocol.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-kratos-light p-8 rounded-xl">
            <div className="bg-white p-3 rounded-lg w-fit mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant Context</h3>
            <p className="text-gray-600">
              AI instantly knows your codebase structure, patterns, and decisions. 
              No more explaining what files do what.
            </p>
          </div>
          
          <div className="bg-kratos-light p-8 rounded-xl">
            <div className="bg-white p-3 rounded-lg w-fit mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Perfect Isolation</h3>
            <p className="text-gray-600">
              Each project gets its own memory space. 
              No cross-contamination between different codebases.
            </p>
          </div>
          
          <div className="bg-kratos-light p-8 rounded-xl">
            <div className="bg-white p-3 rounded-lg w-fit mb-4">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Universal Protocol</h3>
            <p className="text-gray-600">
              Works with Claude, Cursor, Windsurf, and any MCP-compatible tool. 
              One memory system for all your AI tools.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}