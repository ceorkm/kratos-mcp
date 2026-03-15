import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface GitHubStarsProps {
  repo?: string
  className?: string
  showLabel?: boolean
}

const GitHubStars = ({ 
  repo = 'ceorkm/kratos-mcp', 
  className = '',
  showLabel = true 
}: GitHubStarsProps) => {
  const [stars, setStars] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`)
        const data = await response.json()
        setStars(data.stargazers_count)
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error)
        setStars(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStars()
    // Refresh every 5 minutes
    const interval = setInterval(fetchStars, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [repo])

  const formatStars = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Star className="h-4 w-4" />
        <span className="text-sm">...</span>
      </div>
    )
  }

  if (stars === null) {
    return null
  }

  return (
    <motion.div 
      className={`flex items-center gap-1.5 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Star className="h-4 w-4 fill-current" />
      <span className="text-sm font-mono font-semibold">{formatStars(stars)}</span>
      {showLabel && <span className="text-sm">stars</span>}
    </motion.div>
  )
}

export default GitHubStars