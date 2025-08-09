import { ArrowRight } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Install Kratos",
      description: "npm install and build the MCP server",
      code: "npm install\nnpm run build"
    },
    {
      number: "02",
      title: "Configure Your Tool",
      description: "Add Kratos to your AI tool's MCP config",
      code: '{\n  "mcpServers": {\n    "kratos": {\n      "command": "node",\n      "args": ["/path/to/kratos/dist/index.js"]\n    }\n  }\n}'
    },
    {
      number: "03",
      title: "Start Coding",
      description: "Kratos auto-detects your project and starts remembering",
      code: "// AI now knows your entire codebase\n// No setup, no configuration\n// Just start working"
    }
  ]
  
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-600">
            Three steps to perfect AI memory
          </p>
        </div>
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-kratos-black text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <div className="bg-kratos-light p-4 rounded-lg">
                  <pre className="text-sm font-mono overflow-x-auto">{step.code}</pre>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center">
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}