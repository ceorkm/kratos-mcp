import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  type?: 'text' | 'card' | 'avatar' | 'button'
  className?: string
  count?: number
}

const LoadingSkeleton = ({ type = 'text', className = '', count = 1 }: LoadingSkeletonProps) => {
  const baseClasses = 'bg-dark-surface/50 rounded animate-pulse'
  
  const typeClasses = {
    text: 'h-4 w-full',
    card: 'h-32 w-full',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24'
  }

  const shimmerAnimation = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear' as const
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`${baseClasses} ${typeClasses[type]} ${className} relative overflow-hidden`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-dark-border/20 to-transparent"
            style={{ backgroundSize: '200% 100%' }}
            animate={shimmerAnimation.animate}
            transition={shimmerAnimation.transition}
          />
        </motion.div>
      ))}
    </>
  )
}

export default LoadingSkeleton