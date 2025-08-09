import { FileText, Terminal, Database, Brain } from 'lucide-react'

export default function FourPillars() {
  const pillars = [
    {
      icon: FileText,
      title: "PRD",
      subtitle: "Product Requirements",
      description: "Define what matters for your project. Set goals, constraints, and key decisions that AI should remember.",
      example: "Tech stack choices, API patterns, naming conventions"
    },
    {
      icon: Terminal,
      title: "Prompt",
      subtitle: "Reusable Templates",
      description: "Create task templates that work perfectly with your codebase. Never write the same prompt twice.",
      example: "Component creation, API endpoint setup, test writing"
    },
    {
      icon: Database,
      title: "Context",
      subtitle: "Smart Retrieval",
      description: "Automatically pulls relevant memories based on what you're working on. 95.8% accuracy.",
      example: "Working on auth? Gets auth patterns, middleware, user model"
    },
    {
      icon: Brain,
      title: "Memory",
      subtitle: "Permanent Storage",
      description: "Everything important gets remembered across sessions. Your AI never forgets.",
      example: "Architecture decisions, bug fixes, optimization patterns"
    }
  ]
  
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">The Four Pillars</h2>
          <p className="text-xl text-gray-600">
            A complete framework for AI-assisted development
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {pillars.map((pillar, index) => (
            <div key={index} className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="bg-kratos-light p-3 rounded-lg">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline space-x-2 mb-2">
                    <h3 className="text-2xl font-bold">{pillar.title}</h3>
                    <span className="text-sm text-gray-500">{pillar.subtitle}</span>
                  </div>
                  <p className="text-gray-600 mb-3">{pillar.description}</p>
                  <div className="bg-kratos-light px-3 py-2 rounded text-sm font-mono">
                    {pillar.example}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}