// Core Web Vitals Optimization for SEO
// Target: LCP < 2.5s, INP < 200ms, CLS < 0.1

export function initWebVitals() {
  // Preload critical resources
  preloadCriticalResources()
  
  // Optimize images
  lazyLoadImages()
  
  // Optimize fonts
  optimizeFonts()
  
  // Monitor performance
  monitorPerformance()
}

// Preload critical resources for faster LCP
function preloadCriticalResources() {
  // Preload critical CSS
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = '/styles/critical.css'
  document.head.appendChild(link)
  
  // Preconnect to external domains
  const domains = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']
  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = domain
    document.head.appendChild(link)
  })
}

// Lazy load images to improve LCP and reduce initial load
export function lazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[data-src]')
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src!
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      })
    })
    
    images.forEach(img => imageObserver.observe(img))
  }
}

// Optimize font loading to prevent layout shifts (CLS)
function optimizeFonts() {
  // Use font-display: swap for non-critical fonts
  const style = document.createElement('style')
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-display: swap;
      src: local('Inter'), url('/fonts/inter.woff2') format('woff2');
    }
  `
  document.head.appendChild(style)
}

// Monitor Core Web Vitals
export function monitorPerformance() {
  // Monitor LCP (Largest Contentful Paint)
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    console.log('LCP:', lastEntry.startTime, 'ms')
    
    // Send to analytics if needed
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'LCP',
        value: Math.round(lastEntry.startTime)
      })
    }
  })
  observer.observe({ type: 'largest-contentful-paint', buffered: true })
  
  // Monitor CLS (Cumulative Layout Shift)
  let clsValue = 0
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value
      }
    }
    console.log('CLS:', clsValue)
  })
  clsObserver.observe({ type: 'layout-shift', buffered: true })
  
  // Monitor INP (Interaction to Next Paint) - replacement for FID
  const inpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach(entry => {
      if (entry.entryType === 'event') {
        const duration = entry.duration
        console.log('INP:', duration, 'ms')
      }
    })
  })
  if (PerformanceObserver.supportedEntryTypes?.includes('event')) {
    inpObserver.observe({ type: 'event', buffered: true })
  }
}

// Optimize interactions for better INP
export function optimizeInteractions() {
  // Use requestIdleCallback for non-critical updates
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // Non-critical updates here
      document.querySelectorAll('.non-critical').forEach(el => {
        el.classList.add('loaded')
      })
    })
  }
  
  // Debounce input handlers
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
  
  // Apply debouncing to search inputs
  const searchInputs = document.querySelectorAll('input[type="search"]')
  searchInputs.forEach(input => {
    input.addEventListener('input', debounce((e: Event) => {
      // Handle search
      console.log('Search:', (e.target as HTMLInputElement).value)
    }, 300))
  })
}

// Prefetch pages for faster navigation
export function prefetchPages() {
  if ('IntersectionObserver' in window && 'requestIdleCallback' in window) {
    const links = document.querySelectorAll('a[href^="/"]')
    const linkObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement
          window.requestIdleCallback(() => {
            const prefetchLink = document.createElement('link')
            prefetchLink.rel = 'prefetch'
            prefetchLink.href = link.href
            document.head.appendChild(prefetchLink)
          })
          linkObserver.unobserve(link)
        }
      })
    })
    
    links.forEach(link => linkObserver.observe(link))
  }
}

// Resource hints for faster page loads
export function addResourceHints() {
  // DNS prefetch for external domains
  const dnsPrefetch = ['https://www.google-analytics.com', 'https://cdn.jsdelivr.net']
  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  })
  
  // Prerender next likely page
  const prerenderLink = document.createElement('link')
  prerenderLink.rel = 'prerender'
  prerenderLink.href = '/docs'
  document.head.appendChild(prerenderLink)
}

// Export Web Vitals metrics
export interface WebVitalsMetrics {
  lcp: number
  inp: number
  cls: number
  fcp: number
  ttfb: number
}

export function getWebVitals(): Promise<WebVitalsMetrics> {
  return new Promise((resolve) => {
    const metrics: Partial<WebVitalsMetrics> = {}
    
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      metrics.ttfb = navigation.responseStart - navigation.requestStart
    }
    
    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    if (fcp) {
      metrics.fcp = fcp.startTime
    }
    
    // Collect other metrics asynchronously
    setTimeout(() => {
      resolve(metrics as WebVitalsMetrics)
    }, 3000)
  })
}