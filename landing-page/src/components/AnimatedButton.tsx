import { motion } from 'framer-motion'
import { ReactNode, MouseEvent } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
  disabled?: boolean
}

const AnimatedButton = ({ 
  children, 
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  disabled = false
}: AnimatedButtonProps) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: 'bg-neon-blue text-white shadow-lg',
    secondary: 'border-2 border-neon-blue text-white bg-transparent',
    ghost: 'text-dark-text-secondary hover:text-neon-blue bg-transparent'
  }

  const baseClasses = `relative font-mono rounded-lg transition-all duration-300 overflow-hidden group ${sizeClasses[size]} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`

  const content = (
    <>
      <motion.span
        className="relative z-10 flex items-center justify-center gap-2"
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
      
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: disabled ? '-100%' : '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
      
      {variant === 'secondary' && (
        <motion.div
          className="absolute inset-0 bg-neon-blue/10"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: disabled ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </>
  )

  if (href) {
    return (
      <motion.a
        href={href}
        className={baseClasses}
        whileHover={disabled ? {} : { 
          scale: 1.05,
          boxShadow: variant === 'primary' ? '0 0 25px rgba(0, 136, 204, 0.4)' : undefined
        }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.a>
    )
  }

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      className={baseClasses}
      disabled={disabled}
      whileHover={disabled ? {} : { 
        scale: 1.05,
        boxShadow: variant === 'primary' ? '0 0 25px rgba(0, 136, 204, 0.4)' : undefined
      }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.button>
  )
}

export default AnimatedButton