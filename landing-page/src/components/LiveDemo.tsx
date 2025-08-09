import { useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function LiveDemo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  
  const demoSteps = [
    {
      user: "Explain the auth system",
      ai: "Your auth uses JWT with refresh tokens stored in httpOnly cookies. The middleware validates tokens on protected routes at /api/middleware/auth.ts:42",
      memory: "Retrieved: AUTH_PATTERN, JWT_CONFIG, MIDDLEWARE_SETUP"
    },
    {
      user: "Create a new user endpoint",
      ai: "I'll create a new endpoint following your existing pattern. You use Express with TypeScript, validate with Zod schemas, and return standardized responses.",
      memory: "Retrieved: API_PATTERNS, USER_MODEL, VALIDATION_SCHEMAS"
    },
    {
      user: "What's the database schema for users?",
      ai: "Users table has id (UUID), email (unique), password_hash, created_at, updated_at. Related to roles via user_roles junction table. Defined in migrations/001_users.sql",
      memory: "Retrieved: DB_SCHEMA, USER_TABLE, ROLE_SYSTEM"
    }
  ]
  
  const handlePlay = () => {
    setIsPlaying(true)
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= demoSteps.length - 1) {
          setIsPlaying(false)
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 3000)
  }
  
  const handleReset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }
  
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
          <p className="text-xl text-gray-600">
            Watch how Kratos remembers your codebase
          </p>
        </div>
        
        <div className="bg-kratos-black text-white rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={isPlaying ? () => setIsPlaying(false) : handlePlay}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-6 min-h-[400px]">
            {demoSteps.slice(0, currentStep + 1).map((step, index) => (
              <div key={index} className="space-y-3 animate-fade-in">
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400">User:</span>
                  <span className="flex-1">{step.user}</span>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400">AI:</span>
                  <span className="flex-1 text-green-400">{step.ai}</span>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400">Memory:</span>
                  <span className="flex-1 text-blue-400 font-mono text-sm">{step.memory}</span>
                </div>
                
                {index < demoSteps.length - 1 && <div className="border-t border-gray-800 pt-3"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}