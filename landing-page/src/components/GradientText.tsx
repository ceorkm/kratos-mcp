import { motion } from 'framer-motion'

interface GradientTextProps {
  text: string
  className?: string
  gradient?: string
}

export default function GradientText({ 
  text, 
  className = '',
  gradient = 'from-blue-600 via-purple-600 to-pink-600'
}: GradientTextProps) {
  return (
    <motion.span
      className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent bg-300% ${className}`}
      animate={{
        backgroundPosition: ['0%', '100%', '0%'],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        backgroundSize: '300% 100%',
      }}
    >
      {text}
    </motion.span>
  )
}