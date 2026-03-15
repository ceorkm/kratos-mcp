import { motion, type Easing } from 'framer-motion'
import { useState } from 'react'
import { Lock, Search, Zap, Terminal, Shield, Clock, Wifi, ArrowRight } from 'lucide-react'

// Fade-up animation variant for scroll reveals
const easeOut: Easing = [0.0, 0.0, 0.2, 1.0]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: easeOut },
  }),
}

// CodeBlock component
const CodeBlock = ({ code, title }: { code: string; title?: string }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      {title && (
        <div className="px-4 py-2 bg-kratos-surface border-b border-kratos-border/30 rounded-t-lg">
          <span className="text-xs text-kratos-muted font-mono">{title}</span>
        </div>
      )}
      <div className={`bg-kratos-dark p-4 ${title ? 'rounded-b-lg' : 'rounded-lg'} border border-kratos-border/30 overflow-hidden`}>
        <pre className="text-kratos-text font-mono text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 p-2 bg-kratos-surface/80 border border-kratos-border/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Copy code"
        >
          {copied ? (
            <svg className="h-4 w-4 text-kratos-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-kratos-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

const Home = () => {
  return (
    <div className="min-h-screen bg-kratos-dark relative overflow-hidden">
      {/* =========================================
          1. HERO SECTION
          ========================================= */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Warm radial glow background */}
        <div className="absolute inset-0 bg-warm-glow pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-kratos-copper/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-kratos-text leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Persistent memory for{' '}
            <span className="gradient-text-warm">AI coding agents</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-kratos-muted max-w-2xl mx-auto leading-relaxed mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            Auto-capture observations, compress with Claude, and recall context
            instantly — all encrypted, all local, zero network calls.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <a href="#install" className="pill-button pill-button-filled text-base">
              Get Started
            </a>
            <a
              href="https://github.com/ceorkm/kratos-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="pill-button pill-button-outline text-base"
            >
              View on GitHub
            </a>
          </motion.div>
        </div>

        {/* Logo bar */}
        <motion.div
          className="max-w-3xl mx-auto mt-20 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <p className="text-xs text-kratos-muted text-center uppercase tracking-widest mb-6">
            Built for modern development workflows
          </p>
          <div className="flex items-center justify-center gap-10 sm:gap-14 flex-wrap">
            {['Claude Code', 'Cursor', 'VS Code', 'Windsurf', 'Zed'].map(
              (name) => (
                <span
                  key={name}
                  className="text-kratos-muted/50 text-sm sm:text-base font-medium tracking-wide"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </motion.div>
      </section>

      {/* =========================================
          2. PRODUCT SECTION — Alternating Cards
          ========================================= */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="font-serif text-4xl sm:text-5xl font-semibold text-kratos-text mb-4"
              variants={fadeUp}
              custom={0}
            >
              Everything your AI forgets, Kratos remembers
            </motion.h2>
            <motion.p
              className="text-kratos-muted text-lg max-w-2xl mx-auto"
              variants={fadeUp}
              custom={0.1}
            >
              From file edits to architecture decisions, every observation is
              captured, compressed, and searchable.
            </motion.p>
          </motion.div>

          {/* Feature Cards — alternating layout */}
          <div className="space-y-24">
            {/* Card 1: Auto-Capture */}
            <motion.div
              className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-block px-3 py-1 text-xs font-medium text-kratos-copper bg-kratos-copper/10 border border-kratos-copper/20 rounded-full mb-4">
                  Zero Effort
                </span>
                <h3 className="font-serif text-3xl font-semibold text-kratos-text mb-4">
                  Auto-Capture
                </h3>
                <p className="text-kratos-muted leading-relaxed text-lg">
                  Every file edit, every command, every decision — captured
                  automatically via Claude Code hooks. You just code.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} custom={0.15}>
                <CodeBlock
                  title="hooks/PostToolUse.ts"
                  code={`// Automatic observation capture
if (tool === 'Write' || tool === 'Edit') {
  await kratos.save({
    type: 'observation',
    content: \`Modified \${filePath}\`,
    tags: ['auto-capture', 'edit'],
    importance: 3
  });
}`}
                />
              </motion.div>
            </motion.div>

            {/* Card 2: Smart Search (reversed) */}
            <motion.div
              className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              <motion.div variants={fadeUp} custom={0.15} className="order-2 md:order-1">
                <CodeBlock
                  title="terminal"
                  code={`$ kratos search "auth middleware"

Found 3 memories (2ms):

#1  JWT auth with refresh tokens
    15-min expiry, httpOnly cookies,
    rotate on each request
    [auth] [security] — importance: 5

#2  Rate limiter middleware added
    express-rate-limit, 100 req/15min
    [middleware] — importance: 3`}
                />
              </motion.div>
              <motion.div variants={fadeUp} custom={0} className="order-1 md:order-2">
                <span className="inline-block px-3 py-1 text-xs font-medium text-kratos-teal bg-kratos-teal/10 border border-kratos-teal/20 rounded-full mb-4">
                  FTS5 Engine
                </span>
                <h3 className="font-serif text-3xl font-semibold text-kratos-text mb-4">
                  Smart Search
                </h3>
                <p className="text-kratos-muted leading-relaxed text-lg">
                  Full-text search with porter tokenizer, smart fallbacks, and
                  natural language queries. Find any memory in &lt;10ms.
                </p>
              </motion.div>
            </motion.div>

            {/* Card 3: Security */}
            <motion.div
              className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              id="security"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-block px-3 py-1 text-xs font-medium text-kratos-sage bg-kratos-sage/10 border border-kratos-sage/20 rounded-full mb-4">
                  AES-256-GCM
                </span>
                <h3 className="font-serif text-3xl font-semibold text-kratos-text mb-4">
                  Military-Grade Security
                </h3>
                <p className="text-kratos-muted leading-relaxed text-lg">
                  Per-project encryption, PII detection, secret scanning, and
                  data retention policies. Nothing leaves your machine.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} custom={0.15}>
                <CodeBlock
                  title="security.config"
                  code={`encryption:
  algorithm: AES-256-GCM
  key_derivation: PBKDF2
  per_project: true

pii_detection:
  enabled: true
  patterns: [email, phone, ssn, api_key]
  action: redact

retention:
  max_age: 90d
  auto_cleanup: true`}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================
          3. CLI SECTION
          ========================================= */}
      <section id="cli" className="py-24 px-4 sm:px-6 lg:px-8 bg-kratos-surface/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="font-serif text-4xl sm:text-5xl font-semibold text-kratos-text mb-4"
              variants={fadeUp}
              custom={0}
            >
              One CLI to rule them all
            </motion.h2>
            <motion.p
              className="text-kratos-muted text-lg max-w-xl mx-auto"
              variants={fadeUp}
              custom={0.1}
            >
              A single command-line tool for your entire memory workflow.
            </motion.p>
          </motion.div>

          {/* ASCII Banner */}
          <motion.div
            className="mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.15}
          >
            <div className="bg-kratos-dark border border-kratos-border/30 rounded-xl p-6 overflow-x-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500/70 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500/70 rounded-full" />
                <div className="w-3 h-3 bg-green-500/70 rounded-full" />
                <span className="ml-2 text-xs text-kratos-muted font-mono">kratos</span>
              </div>
              <pre className="text-kratos-copper font-mono text-xs sm:text-sm leading-relaxed">
{`  ██╗  ██╗██████╗  █████╗ ████████╗ ██████╗ ███████╗
  ██║ ██╔╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔════╝
  █████╔╝ ██████╔╝███████║   ██║   ██║   ██║███████╗
  ██╔═██╗ ██╔══██╗██╔══██║   ██║   ██║   ██║╚════██║
  ██║  ██╗██║  ██║██║  ██║   ██║   ╚██████╔╝███████║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝

  Persistent AI Memory — CLI-first, encrypted, local.`}
              </pre>
            </div>
          </motion.div>

          {/* Command Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'save',
                desc: 'Save a memory observation',
                example: 'kratos save "Added JWT auth middleware"',
                icon: Zap,
              },
              {
                name: 'search',
                desc: 'Full-text search across memories',
                example: 'kratos search "auth middleware"',
                icon: Search,
              },
              {
                name: 'ask',
                desc: 'Ask questions about your project',
                example: 'kratos ask "How does auth work?"',
                icon: Terminal,
              },
              {
                name: 'status',
                desc: 'View project memory statistics',
                example: 'kratos status',
                icon: Clock,
              },
              {
                name: 'scan',
                desc: 'Scan for PII and secrets',
                example: 'kratos scan --fix',
                icon: Shield,
              },
              {
                name: 'hooks install',
                desc: 'Install Claude Code hooks',
                example: 'kratos hooks install',
                icon: ArrowRight,
              },
            ].map((cmd, i) => (
              <motion.div
                key={cmd.name}
                className="bg-kratos-card/50 border border-kratos-border/30 rounded-xl p-5 hover:border-kratos-copper/30 transition-colors duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.05}
              >
                <div className="flex items-center gap-3 mb-2">
                  <cmd.icon className="h-4 w-4 text-kratos-copper" />
                  <span className="font-mono text-sm font-semibold text-kratos-text">
                    {cmd.name}
                  </span>
                </div>
                <p className="text-kratos-muted text-sm mb-3">{cmd.desc}</p>
                <code className="text-xs font-mono text-kratos-gold/80 bg-kratos-dark/60 px-2 py-1 rounded block truncate">
                  $ {cmd.example}
                </code>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          4. PLUGIN SECTION
          ========================================= */}
      <section id="plugin" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="font-serif text-4xl sm:text-5xl font-semibold text-kratos-text mb-4"
              variants={fadeUp}
              custom={0}
            >
              Or let it run itself
            </motion.h2>
            <motion.p
              className="text-kratos-muted text-lg max-w-2xl mx-auto"
              variants={fadeUp}
              custom={0.1}
            >
              The Claude Code plugin auto-captures observations, generates session
              summaries via Claude's own LLM — free, no API key required.
            </motion.p>
          </motion.div>

          {/* Lifecycle hooks */}
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                hook: 'SessionStart',
                desc: 'Load project context and recent memories into the session.',
                color: 'kratos-copper',
              },
              {
                hook: 'PostToolUse',
                desc: 'Capture file edits, commands, and tool outputs automatically.',
                color: 'kratos-gold',
              },
              {
                hook: 'Stop',
                desc: 'Compress and save observations before the response ends.',
                color: 'kratos-sage',
              },
              {
                hook: 'SessionEnd',
                desc: 'Generate a full session summary and archive to memory.',
                color: 'kratos-teal',
              },
            ].map((item, i) => (
              <motion.div
                key={item.hook}
                className="bg-kratos-card/50 border border-kratos-border/30 rounded-xl p-5"
                variants={fadeUp}
                custom={i * 0.08}
              >
                <div className={`w-2 h-2 rounded-full bg-${item.color} mb-3`} />
                <h4 className="font-mono text-sm font-semibold text-kratos-text mb-2">
                  {item.hook}
                </h4>
                <p className="text-kratos-muted text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.3}
          >
            <a href="#install" className="pill-button pill-button-filled text-base inline-block">
              Install Plugin
            </a>
          </motion.div>
        </div>
      </section>

      {/* =========================================
          5. STATS ROW
          ========================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-kratos-border/20">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { icon: Clock, value: '<10ms', label: 'Retrieval' },
            { icon: Lock, value: 'AES-256', label: 'Encrypted' },
            { icon: Wifi, value: 'Zero', label: 'Network Calls' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i * 0.1}>
              <stat.icon className="h-5 w-5 text-kratos-copper mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-serif font-semibold text-kratos-text">
                {stat.value}
              </div>
              <div className="text-sm text-kratos-muted mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* =========================================
          6. INSTALLATION / GET STARTED
          ========================================= */}
      <section id="install" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="font-serif text-4xl sm:text-5xl font-semibold text-kratos-text mb-4"
              variants={fadeUp}
              custom={0}
            >
              Get started in seconds
            </motion.h2>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} custom={0.1}>
              <p className="text-sm text-kratos-muted mb-2">Install globally</p>
              <CodeBlock code="npm install -g kratos-mcp" />
            </motion.div>
            <motion.div variants={fadeUp} custom={0.2}>
              <p className="text-sm text-kratos-muted mb-2">Install hooks for auto-capture</p>
              <CodeBlock code="kratos hooks install" />
            </motion.div>
            <motion.div variants={fadeUp} custom={0.3}>
              <p className="text-sm text-kratos-muted mb-2">Start saving memories</p>
              <CodeBlock code='kratos save "Project uses Express + TypeScript + Prisma"' />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========================================
          7. FINAL CTA
          ========================================= */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-warm-glow-subtle pointer-events-none" />
        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-kratos-text mb-6"
            variants={fadeUp}
            custom={0}
          >
            Your AI should remember everything
          </motion.h2>
          <motion.p
            className="text-kratos-muted text-lg max-w-xl mx-auto mb-10"
            variants={fadeUp}
            custom={0.1}
          >
            Stop re-explaining your codebase. Let Kratos handle the memory so you
            can focus on building.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeUp}
            custom={0.2}
          >
            <a href="#install" className="pill-button pill-button-filled text-base">
              Get Started
            </a>
            <a
              href="https://github.com/ceorkm/kratos-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="pill-button pill-button-outline text-base"
            >
              View on GitHub
            </a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}

export default Home
