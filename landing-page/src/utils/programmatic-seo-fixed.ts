// Fixed Programmatic SEO Generator - Matches sitemap URLs exactly
export interface ProgrammaticPage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  content: string
  schemaMarkup: any
  category: string
  keywords: string[]
  relatedPages: string[]
}

// Match cities from generate-50k-pages.js
export const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
  'San Francisco', 'Charlotte', 'Indianapolis', 'Seattle', 'Denver', 'Washington DC',
  'Boston', 'El Paso', 'Detroit', 'Nashville', 'Portland', 'Memphis', 'Oklahoma City',
  'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno',
  'Mesa', 'Sacramento', 'Atlanta', 'Kansas City', 'Colorado Springs', 'Miami', 'Raleigh',
  'Omaha', 'Long Beach', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington',
  'Tampa', 'New Orleans', 'Wichita', 'Cleveland', 'Bakersfield', 'Aurora', 'Anaheim',
  'Honolulu', 'Santa Ana', 'Riverside', 'Corpus Christi', 'Lexington', 'Stockton',
  'Henderson', 'Saint Paul', 'St Louis', 'Cincinnati', 'Pittsburgh', 'Greensboro',
  'Anchorage', 'Plano', 'Lincoln', 'Orlando', 'Irvine', 'Newark', 'Toledo', 'Durham',
  'Chula Vista', 'Fort Wayne', 'Jersey City', 'St Petersburg', 'Laredo', 'Madison',
  'Chandler', 'Buffalo', 'Lubbock', 'Scottsdale', 'Reno', 'Glendale', 'Gilbert',
  'Winston Salem', 'North Las Vegas', 'Norfolk', 'Chesapeake', 'Garland', 'Irving',
  'Hialeah', 'Fremont', 'Boise', 'Richmond', 'Baton Rouge', 'Spokane', 'Des Moines',
  'London', 'Paris', 'Berlin', 'Amsterdam', 'Barcelona', 'Madrid', 'Rome', 'Milan',
  'Munich', 'Hamburg', 'Vienna', 'Warsaw', 'Budapest', 'Prague', 'Brussels', 'Stockholm',
  'Copenhagen', 'Oslo', 'Helsinki', 'Dublin', 'Edinburgh', 'Manchester', 'Birmingham',
  'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Sydney', 'Melbourne',
  'Brisbane', 'Perth', 'Auckland', 'Wellington', 'Singapore', 'Hong Kong', 'Tokyo',
  'Osaka', 'Seoul', 'Beijing', 'Shanghai', 'Shenzhen', 'Bangalore', 'Mumbai', 'Delhi',
  'Dubai', 'Abu Dhabi', 'Tel Aviv', 'Jerusalem', 'Cairo', 'Lagos', 'Cape Town', 'Johannesburg'
]

// Match technologies from generate-50k-pages.js
export const technologies = [
  'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Gatsby', 'Remix',
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Python', 'Django', 'Flask', 'FastAPI',
  'JavaScript', 'TypeScript', 'Java', 'Spring', 'C#', '.NET', 'Go', 'Rust',
  'Ruby', 'Rails', 'PHP', 'Laravel', 'Swift', 'Kotlin', 'Flutter', 'React Native',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST', 'Docker', 'Kubernetes'
]

// Match actions from generate-50k-pages.js
export const actions = [
  'setup', 'install', 'configure', 'implement', 'deploy', 'optimize', 'debug', 'test',
  'monitor', 'scale', 'secure', 'integrate', 'migrate', 'upgrade', 'troubleshoot', 'fix'
]

// Match competitors from generate-50k-pages.js
export const competitors = [
  'memory-bank', 'mem0', 'sequential-thinking', 'context-keeper', 'ai-memory-pro',
  'claude-memory', 'cursor-memory', 'copilot-memory', 'codeium-memory', 'tabnine-memory'
]

// Match industries from generate-50k-pages.js
export const industries = [
  'startup', 'enterprise', 'agency', 'freelance', 'consultant', 'saas', 'fintech',
  'healthtech', 'edtech', 'ecommerce', 'marketplace', 'social', 'gaming', 'crypto'
]

// Match modifiers from generate-50k-pages.js
export const modifiers = [
  'best', 'top', 'fastest', 'easiest', 'professional', 'enterprise', 'free', 'ultimate',
  'complete', 'advanced', 'simple', 'quick', 'instant', 'automatic', 'smart', 'modern'
]

// Generate ALL pages to match sitemap exactly
export function generateAllProgrammaticPages(): ProgrammaticPage[] {
  const pages: ProgrammaticPage[] = []
  
  // Strategy 1: City + Tech + Action (matches sitemap generation)
  for (let c = 0; c < Math.min(cities.length, 200) && pages.length < 20000; c++) {
    for (let t = 0; t < technologies.length && pages.length < 20000; t++) {
      for (let a = 0; a < actions.length && pages.length < 20000; a++) {
        const city = cities[c]
        const tech = technologies[t]
        const action = actions[a]
        const slug = `${action}-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}-mcp-${city.toLowerCase().replace(/ /g, '-')}`
        
        pages.push({
          slug,
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${tech} MCP in ${city} - Kratos Memory Server`,
          metaDescription: `Learn how to ${action} ${tech} with MCP memory server in ${city}. Get 95.8% context accuracy and instant AI memory for ${tech} development.`,
          h1: `${action.charAt(0).toUpperCase() + action.slice(1)} ${tech} MCP Memory in ${city}`,
          content: generateTechActionCityContent(action, tech, city),
          schemaMarkup: generateHowToSchema(action, tech, city),
          category: 'Guide',
          keywords: [`${tech} ${action}`, `MCP ${city}`, `${tech} memory server`, `${action} AI memory`],
          relatedPages: []
        })
      }
    }
  }
  
  // Strategy 2: Competitor comparisons with cities
  for (let comp = 0; comp < competitors.length && pages.length < 36000; comp++) {
    for (let c = 0; c < Math.min(cities.length, 200) && pages.length < 36000; c++) {
      for (let m = 0; m < Math.min(modifiers.length, 8) && pages.length < 36000; m++) {
        const competitor = competitors[comp]
        const city = cities[c]
        const modifier = modifiers[m]
        const slug = `${modifier}-mcp-vs-${competitor}-${city.toLowerCase().replace(/ /g, '-')}`
        
        pages.push({
          slug,
          title: `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} MCP vs ${competitor.replace(/-/g, ' ')} in ${city}`,
          metaDescription: `Compare the ${modifier} MCP memory server Kratos vs ${competitor} for developers in ${city}. See why Kratos wins with 95.8% accuracy.`,
          h1: `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} MCP Alternative to ${competitor} in ${city}`,
          content: generateComparisonContent(competitor, city, modifier),
          schemaMarkup: generateComparisonSchema(competitor, city),
          category: 'Comparison',
          keywords: [`${competitor} alternative`, `${modifier} MCP ${city}`, `Kratos vs ${competitor}`],
          relatedPages: []
        })
      }
    }
  }
  
  // Strategy 3: Industry + Tech + City
  const targetPages = 50000
  for (let i = 0; i < industries.length && pages.length < targetPages; i++) {
    for (let t = 0; t < technologies.length && pages.length < targetPages; t++) {
      for (let c = 0; c < Math.min(cities.length, 200) && pages.length < targetPages; c++) {
        const industry = industries[i]
        const tech = technologies[t]
        const city = cities[c]
        const slug = `${industry}-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}-mcp-${city.toLowerCase().replace(/ /g, '-')}`
        
        pages.push({
          slug,
          title: `${industry.charAt(0).toUpperCase() + industry.slice(1)} ${tech} MCP in ${city}`,
          metaDescription: `MCP memory server for ${industry} ${tech} developers in ${city}. Perfect AI memory for ${industry} projects with 95.8% accuracy.`,
          h1: `${tech} MCP for ${industry.charAt(0).toUpperCase() + industry.slice(1)} in ${city}`,
          content: generateIndustryTechCityContent(industry, tech, city),
          schemaMarkup: generateLocalBusinessSchema(industry, tech, city),
          category: 'Industry',
          keywords: [`${industry} ${tech}`, `MCP ${city}`, `${industry} memory server`],
          relatedPages: []
        })
      }
    }
  }
  
  // Strategy 4: Question pages
  const questions = [
    'what is', 'how to', 'why use', 'when to use', 'where to find',
    'can you', 'should i', 'is it worth', 'does it work', 'will it help'
  ]
  
  while (pages.length < targetPages) {
    const idx = pages.length - 47200 // Index relative to start of question pages
    const question = questions[idx % questions.length]
    const tech = technologies[idx % technologies.length]
    const modifier = modifiers[idx % modifiers.length]
    const city = cities[idx % cities.length]
    const slug = `${question.replace(/ /g, '-')}-${modifier}-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}-mcp-${city.toLowerCase().replace(/ /g, '-')}`
    
    pages.push({
      slug,
      title: `${question.charAt(0).toUpperCase() + question.slice(1)} ${modifier} ${tech} MCP in ${city}?`,
      metaDescription: `${question.charAt(0).toUpperCase() + question.slice(1)} the ${modifier} ${tech} MCP memory server in ${city}? Learn about Kratos MCP with 95.8% accuracy.`,
      h1: `${question.charAt(0).toUpperCase() + question.slice(1)} ${modifier} ${tech} MCP Memory in ${city}`,
      content: generateQuestionContent(question, modifier, tech, city),
      schemaMarkup: generateFAQSchema(question, modifier, tech, city),
      category: 'FAQ',
      keywords: [`${question} ${tech} MCP`, `${modifier} memory server`, `${city} AI development`],
      relatedPages: []
    })
  }
  
  return pages
}

// Content generators
function generateTechActionCityContent(action: string, tech: string, city: string): string {
  return `
    <h2>How to ${action} ${tech} with MCP Memory in ${city}</h2>
    <p>Developers in ${city} are discovering the power of Kratos MCP for ${tech} development. When you need to ${action} ${tech} projects, having persistent AI memory makes the difference between hours of re-explanation and instant context recall.</p>
    
    <h3>Why ${city} Developers Choose Kratos MCP</h3>
    <ul>
      <li><strong>95.8% Context Accuracy</strong>: Never lose your ${tech} project context</li>
      <li><strong>&lt;10ms Retrieval</strong>: Instant memory recall for ${action} tasks</li>
      <li><strong>Complete Isolation</strong>: Your ${tech} projects stay separate and secure</li>
      <li><strong>Zero Configuration</strong>: Start using MCP memory in minutes</li>
    </ul>
    
    <h3>Steps to ${action} ${tech} with Kratos MCP</h3>
    <ol>
      <li>Install Kratos MCP: <code>npm install -g kratos-mcp</code></li>
      <li>Configure for ${tech} development</li>
      <li>Let AI remember your ${tech} architecture</li>
      <li>Never explain your codebase again</li>
    </ol>
    
    <h3>${tech} Development in ${city}</h3>
    <p>The ${city} tech scene is booming, with thousands of ${tech} developers building innovative solutions. Kratos MCP helps ${city} developers maintain perfect project context across all AI-assisted coding sessions.</p>
    
    <h3>Get Started with ${tech} MCP Memory</h3>
    <p>Join hundreds of ${city} developers who have already eliminated context amnesia from their ${tech} workflow. Installation takes less than 2 minutes.</p>
  `
}

function generateComparisonContent(competitor: string, city: string, modifier: string): string {
  const competitorName = competitor.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return `
    <h2>Why Kratos MCP is the ${modifier} Alternative to ${competitorName} in ${city}</h2>
    <p>Developers in ${city} comparing Kratos MCP vs ${competitorName} consistently choose Kratos for its superior performance and ease of use.</p>
    
    <h3>Kratos MCP vs ${competitorName}: Key Differences</h3>
    <table>
      <tr>
        <th>Feature</th>
        <th>Kratos MCP</th>
        <th>${competitorName}</th>
      </tr>
      <tr>
        <td>Context Accuracy</td>
        <td><strong>95.8%</strong></td>
        <td>72-85%</td>
      </tr>
      <tr>
        <td>Retrieval Speed</td>
        <td><strong>&lt;10ms</strong></td>
        <td>50-200ms</td>
      </tr>
      <tr>
        <td>Setup Time</td>
        <td><strong>2 minutes</strong></td>
        <td>30+ minutes</td>
      </tr>
      <tr>
        <td>Project Isolation</td>
        <td><strong>Complete</strong></td>
        <td>Limited</td>
      </tr>
    </table>
    
    <h3>Why ${city} Developers Switch from ${competitorName}</h3>
    <ul>
      <li>Faster memory retrieval for real-time development</li>
      <li>Better context accuracy reduces errors</li>
      <li>Zero configuration vs complex setup</li>
      <li>Built-in security with PII protection</li>
    </ul>
    
    <h3>Migration from ${competitorName} to Kratos</h3>
    <p>Switching from ${competitorName} to Kratos MCP is simple. Most ${city} developers complete the migration in under an hour with full context preservation.</p>
  `
}

function generateIndustryTechCityContent(industry: string, tech: string, city: string): string {
  return `
    <h2>${industry.charAt(0).toUpperCase() + industry.slice(1)} ${tech} Development with MCP in ${city}</h2>
    <p>${industry.charAt(0).toUpperCase() + industry.slice(1)} companies in ${city} rely on Kratos MCP for maintaining perfect AI memory across their ${tech} projects.</p>
    
    <h3>${industry.charAt(0).toUpperCase() + industry.slice(1)} Use Cases for ${tech} MCP</h3>
    <ul>
      <li>Maintain context across sprint boundaries</li>
      <li>Onboard new ${tech} developers faster</li>
      <li>Preserve architectural decisions</li>
      <li>Track ${industry}-specific requirements</li>
    </ul>
    
    <h3>Why ${industry.charAt(0).toUpperCase() + industry.slice(1)} Teams Choose Kratos</h3>
    <p>In the fast-paced ${industry} sector, ${city} teams can't afford to waste time re-explaining their ${tech} codebase to AI tools. Kratos MCP provides persistent memory that scales with your team.</p>
    
    <h3>${tech} Best Practices for ${industry.charAt(0).toUpperCase() + industry.slice(1)}</h3>
    <p>Combine ${tech}'s powerful features with Kratos MCP's perfect memory for unmatched development velocity in ${industry} projects.</p>
  `
}

function generateQuestionContent(question: string, modifier: string, tech: string, city: string): string {
  return `
    <h2>${question.charAt(0).toUpperCase() + question.slice(1)} the ${modifier} ${tech} MCP Memory Server?</h2>
    <p>If you're a ${tech} developer in ${city} wondering "${question} the ${modifier} MCP memory server?", here's everything you need to know about Kratos MCP.</p>
    
    <h3>Quick Answer</h3>
    <p>Yes, Kratos MCP is the ${modifier} choice for ${tech} developers who want persistent AI memory. With 95.8% accuracy and instant retrieval, it's transforming how ${city} developers work with AI tools.</p>
    
    <h3>Detailed Explanation</h3>
    <p>${question.charAt(0).toUpperCase() + question.slice(1)} Kratos MCP? It's a memory layer that gives your AI tools perfect recall of your ${tech} projects. No more explaining your codebase repeatedly.</p>
    
    <h3>Benefits for ${city} ${tech} Developers</h3>
    <ul>
      <li>Save 2+ hours daily on context re-explanation</li>
      <li>Maintain perfect project isolation</li>
      <li>Get instant memory retrieval (&lt;10ms)</li>
      <li>Enjoy ${modifier} performance in the industry</li>
    </ul>
    
    <h3>Getting Started</h3>
    <p>Install Kratos MCP today and experience the ${modifier} MCP memory server for ${tech} development in ${city}.</p>
  `
}

// Schema generators
function generateHowToSchema(action: string, tech: string, city: string) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to ${action} ${tech} with MCP in ${city}`,
    "description": `Complete guide to ${action} ${tech} using Kratos MCP memory server in ${city}`,
    "step": [
      {
        "@type": "HowToStep",
        "name": "Install Kratos MCP",
        "text": "npm install -g kratos-mcp"
      },
      {
        "@type": "HowToStep",
        "name": `Configure for ${tech}`,
        "text": `Set up Kratos MCP for ${tech} development`
      },
      {
        "@type": "HowToStep",
        "name": "Start using AI memory",
        "text": `Begin ${action} with persistent context`
      }
    ]
  }
}

function generateComparisonSchema(competitor: string, city: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `Kratos MCP vs ${competitor} in ${city}`,
    "description": `Detailed comparison of Kratos MCP and ${competitor} for developers in ${city}`,
    "author": {
      "@type": "Organization",
      "name": "Kratos MCP"
    }
  }
}

function generateLocalBusinessSchema(industry: string, tech: string, city: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `Kratos MCP for ${industry} ${tech} in ${city}`,
    "applicationCategory": "DeveloperApplication",
    "description": `MCP memory server for ${industry} ${tech} developers in ${city}`
  }
}

function generateFAQSchema(question: string, modifier: string, tech: string, city: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": {
      "@type": "Question",
      "name": `${question} the ${modifier} ${tech} MCP in ${city}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `Yes, Kratos MCP is the ${modifier} choice for ${tech} developers in ${city}.`
      }
    }
  }
}