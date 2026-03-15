import { useState, useEffect, useRef } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy'
}: OptimizedImageProps) {
  const [isInView, setIsInView] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [loading])

  // Generate WebP source
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  
  // Generate blur placeholder
  const blurDataUrl = `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width || 100}" height="${height || 100}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f5f5f0"/>
    </svg>`
  ).toString('base64')}`

  return (
    <div 
      ref={imgRef}
      className={`relative ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {!hasLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg"
          aria-hidden="true"
        />
      )}
      
      {/* Actual image with WebP support */}
      {isInView && (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            onLoad={() => setHasLoaded(true)}
            className={`${hasLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
          />
        </picture>
      )}
    </div>
  )
}