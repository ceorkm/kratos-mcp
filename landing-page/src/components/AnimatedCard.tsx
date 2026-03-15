import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  delay?: number
  className?: string
  glowColor?: string
}

export default function AnimatedCard({ 
  children, 
  delay = 0, 
  className = '',
  glowColor = 'blue'
}: AnimatedCardProps) {
  return (
    <motion.div
      className={`relative group ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className={`absolute -inset-0.5 bg-gradient-to-r from-${glowColor}-500 to-purple-500 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-500`}
      />
      
      {/* Card content */}
      <div className="relative bg-white/50 backdrop-blur-sm p-8 rounded-lg border border-white/20">
        {children}
      </div>
      
      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  )
}