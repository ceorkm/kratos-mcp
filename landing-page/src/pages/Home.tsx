import { motion, type Easing } from 'framer-motion'
import { useState } from 'react'
import { Lock, Search, Zap, Terminal, Shield, Clock, ArrowRight } from 'lucide-react'

const easeOut: Easing = [0.0, 0.0, 0.2, 1.0]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: easeOut },
  }),
}

/* ── Terminal mockup component ── */
const TerminalMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#262626] rounded-[16px] overflow-hidden border border-[#333333]">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333333]">
      <div className="w-3 h-3 bg-[#ff5f57] rounded-full opacity-70" />
      <div className="w-3 h-3 bg-[#febc2e] rounded-full opacity-70" />
      <div className="w-3 h-3 bg-[#28c840] rounded-full opacity-70" />
      <span className="ml-2 text-xs text-[#828282] font-mono">terminal</span>
    </div>
    <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto">
      {children}
    </div>
  </div>
)

/* ── Code block with copy ── */
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
        <div className="px-4 py-2 bg-[#171717] border-b border-[#262626] rounded-t-[16px]">
          <span className="text-xs text-[#828282] font-mono">{title}</span>
        </div>
      )}
      <div className={`bg-[#171717] p-4 ${title ? 'rounded-b-[16px]' : 'rounded-[16px]'} border border-[#262626] overflow-hidden`}>
        <pre className="text-[#f5f5f5] font-mono text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 p-2 bg-[#262626]/80 border border-[#333333] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Copy code"
        >
          {copied ? (
            <svg className="h-4 w-4 text-[#96a665]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-[#828282]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* =========================================
          1. HERO SECTION — Full viewport
          ========================================= */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        {/* Kero-style gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(102, 145, 163, 0.15) 0%, rgba(189, 169, 109, 0.08) 40%, rgb(10, 10, 10) 100%)',
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10 pt-20">
          <motion.h1
            className="font-serif font-normal text-[50px] sm:text-[64px] lg:text-[80px] text-[#f5f5f5] leading-[1.05] mb-6"
            style={{ letterSpacing: '-1px' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            Persistent memory for AI coding agents
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
            style={{ color: 'rgba(245, 245, 245, 0.88)' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            Auto-capture observations, compress with Claude, and recall context
            instantly — all encrypted, all local.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            <a href="#install" className="pill-button pill-button-filled text-base">
              Get Started
            </a>
          </motion.div>
        </div>

        {/* Logo bar */}
        <motion.div
          className="max-w-3xl mx-auto mt-20 relative z-10"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xs text-[#828282] text-center uppercase tracking-widest mb-6">
            Built for modern development workflows
          </p>
          <div className="overflow-hidden">
            <div className="flex animate-marquee">
            {[...Array(2)].map((_, dupeIdx) => (
              <div key={dupeIdx} className="flex items-center gap-16 sm:gap-20 shrink-0 pr-20">
            {[
              { name: 'Claude', path: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z' },
              { name: 'Cursor', path: 'M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23' },
              { name: 'VS Code', vb: '0 0 32 32', path: 'M29.01,5.03,23.244,2.254a1.742,1.742,0,0,0-1.989.338L2.38,19.8A1.166,1.166,0,0,0,2.3,21.447c.025.027.05.053.077.077l1.541,1.4a1.165,1.165,0,0,0,1.489.066L28.142,5.75A1.158,1.158,0,0,1,30,6.672V6.605A1.748,1.748,0,0,0,29.01,5.03ZM29.01,26.97l-5.766,2.777a1.745,1.745,0,0,1-1.989-.338L2.38,12.2A1.166,1.166,0,0,1,2.3,10.553c.025-.027.05-.053.077-.077l1.541-1.4A1.165,1.165,0,0,1,5.41,9.01L28.142,26.25A1.158,1.158,0,0,0,30,25.328V25.4A1.749,1.749,0,0,1,29.01,26.97ZM23.244,29.747a1.745,1.745,0,0,1-1.989-.338A1.025,1.025,0,0,0,23,28.684V3.316a1.024,1.024,0,0,0-1.749-.724,1.744,1.744,0,0,1,1.989-.339l5.765,2.772A1.748,1.748,0,0,1,30,6.6V25.4a1.748,1.748,0,0,1-.991,1.576Z' },
              { name: 'Windsurf', path: 'M23.55 5.067c-1.2038-.002-2.1806.973-2.1806 2.1765v4.8676c0 .972-.8035 1.7594-1.7597 1.7594-.568 0-1.1352-.286-1.4718-.7659l-4.9713-7.1003c-.4125-.5896-1.0837-.941-1.8103-.941-1.1334 0-2.1533.9635-2.1533 2.153v4.8957c0 .972-.7969 1.7594-1.7596 1.7594-.57 0-1.1363-.286-1.4728-.7658L.4076 5.1598C.2822 4.9798 0 5.0688 0 5.2882v4.2452c0 .2147.0656.4228.1884.599l5.4748 7.8183c.3234.462.8006.8052 1.3509.9298 1.3771.313 2.6446-.747 2.6446-2.0977v-4.893c0-.972.7875-1.7593 1.7596-1.7593h.003a1.798 1.798 0 0 1 1.4718.7658l4.9723 7.0994c.4135.5905 1.05.941 1.8093.941 1.1587 0 2.1515-.9645 2.1515-2.153v-4.8948c0-.972.7875-1.7594 1.7596-1.7594h.194a.22.22 0 0 0 .2204-.2202v-4.622a.22.22 0 0 0-.2203-.2203Z' },
              { name: 'Zed', path: 'M2.25 1.5a.75.75 0 0 0-.75.75v16.5H0V2.25A2.25 2.25 0 0 1 2.25 0h20.095c1.002 0 1.504 1.212.795 1.92L10.764 14.298h3.486V12.75h1.5v1.922a1.125 1.125 0 0 1-1.125 1.125H9.264l-2.578 2.578h11.689V9h1.5v9.375a1.5 1.5 0 0 1-1.5 1.5H5.185L2.562 22.5H21.75a.75.75 0 0 0 .75-.75V5.25H24v16.5A2.25 2.25 0 0 1 21.75 24H1.655C.653 24 .151 22.788.86 22.08L13.19 9.75H9.75v1.5h-1.5V9.375A1.125 1.125 0 0 1 9.375 8.25h5.314l2.625-2.625H5.625V15h-1.5V5.625a1.5 1.5 0 0 1 1.5-1.5h13.19L21.438 1.5' },
              { name: 'Cline', path: 'm23.365 13.556-1.442-2.895V8.994c0-2.764-2.218-5.002-4.954-5.002h-2.464c.178-.367.276-.779.276-1.213A2.77 2.77 0 0 0 12.018 0a2.77 2.77 0 0 0-2.763 2.779c0 .434.098.846.276 1.213H7.067c-2.736 0-4.954 2.238-4.954 5.002v1.667L.64 13.549c-.149.29-.149.636 0 .927l1.472 2.855v1.667C2.113 21.762 4.33 24 7.067 24h9.902c2.736 0 4.954-2.238 4.954-5.002V17.33l1.44-2.865c.143-.286.143-.622.002-.91m-12.854 2.36a2.27 2.27 0 0 1-2.261 2.273 2.27 2.27 0 0 1-2.261-2.273v-4.042A2.27 2.27 0 0 1 8.249 9.6a2.267 2.267 0 0 1 2.262 2.274zm7.285 0a2.27 2.27 0 0 1-2.26 2.273 2.27 2.27 0 0 1-2.262-2.273v-4.042A2.267 2.267 0 0 1 15.535 9.6a2.267 2.267 0 0 1 2.261 2.274z' },
              { name: 'JetBrains', path: 'M2.345 23.997A2.347 2.347 0 0 1 0 21.652V10.988C0 9.665.535 8.37 1.473 7.433l5.965-5.961A5.01 5.01 0 0 1 10.989 0h10.666A2.347 2.347 0 0 1 24 2.345v10.664a5.056 5.056 0 0 1-1.473 3.554l-5.965 5.965A5.017 5.017 0 0 1 13.007 24v-.003H2.345Zm8.969-6.854H5.486v1.371h5.828v-1.371ZM3.963 6.514h13.523v13.519l4.257-4.257a3.936 3.936 0 0 0 1.146-2.767V2.345c0-.678-.552-1.234-1.234-1.234H10.989a3.897 3.897 0 0 0-2.767 1.145L3.963 6.514Zm-.192.192L2.256 8.22a3.944 3.944 0 0 0-1.145 2.768v10.664c0 .678.552 1.234 1.234 1.234h10.666a3.9 3.9 0 0 0 2.767-1.146l1.512-1.511H3.771V6.706Z' },
              { name: 'Warp', path: 'M12.035 2.723h9.253A2.712 2.712 0 0 1 24 5.435v10.529a2.712 2.712 0 0 1-2.712 2.713H8.047Zm-1.681 2.6L6.766 19.677h5.598l-.399 1.6H2.712A2.712 2.712 0 0 1 0 18.565V8.036a2.712 2.712 0 0 1 2.712-2.712Z' },
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-2.5 text-[#f5f5f5]/50 shrink-0">
                <svg viewBox={tool.vb || '0 0 24 24'} className="h-5 w-5" fill="currentColor"><path d={tool.path} /></svg>
                <span className="text-base font-medium whitespace-nowrap">{tool.name}</span>
              </div>
            ))}
              </div>
            ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* =========================================
          2. FEATURES — Alternating Kero cards
          ========================================= */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.h2
              className="font-serif font-normal text-4xl sm:text-5xl text-[#f5f5f5] mb-4"
              style={{ letterSpacing: '-1px' }}
              variants={fadeUp}
              custom={0}
            >
              Deep memory for modern development
            </motion.h2>
            <motion.p
              className="text-[#828282] text-lg max-w-2xl mx-auto"
              variants={fadeUp}
              custom={0.1}
            >
              Transform every coding session into permanent, searchable knowledge.
            </motion.p>
          </motion.div>

          <div className="space-y-12">
            {/* ── Card 1: Auto-Capture (image left, text right) ── */}
            <motion.div
              className="kero-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              <div className="grid md:grid-cols-2">
                {/* Terminal mockup left */}
                <motion.div className="p-6 md:p-8" variants={fadeUp} custom={0}>
                  <TerminalMockup>
                    <div className="text-[#828282]">$ kratos save &quot;Added JWT auth middleware&quot;</div>
                    <div className="mt-3 text-[#96a665]">&#10004; Memory saved</div>
                    <div className="text-[#a1a1a1] mt-1">  id: mem_4f8a2c</div>
                    <div className="text-[#a1a1a1]">  tags: [auto-capture, auth]</div>
                    <div className="text-[#a1a1a1]">  importance: 4</div>
                    <div className="text-[#a1a1a1]">  encrypted: true</div>
                    <div className="mt-3 text-[#828282]">$ kratos status</div>
                    <div className="text-[#a1a1a1] mt-1">  Memories: 247</div>
                    <div className="text-[#a1a1a1]">  Sessions: 38</div>
                    <div className="text-[#a1a1a1]">  DB size: 1.2 MB</div>
                  </TerminalMockup>
                </motion.div>
                {/* Text right */}
                <motion.div className="p-6 md:p-8 flex flex-col justify-center" variants={fadeUp} custom={0.15}>
                  <span className="inline-block w-fit px-3 py-1 text-xs font-medium text-[#96a665] bg-[#96a665]/10 border border-[#96a665]/20 rounded-full mb-4">
                    Zero Effort
                  </span>
                  <h3 className="font-serif font-normal text-3xl text-[#f5f5f5] mb-4" style={{ letterSpacing: '-1px' }}>
                    Auto-Capture
                  </h3>
                  <p className="text-[#828282] leading-relaxed text-lg mb-6">
                    Every file edit, every command, every decision — captured
                    automatically via Claude Code hooks. You just code.
                  </p>
                  <a href="#cli" className="pill-button pill-button-outline text-sm w-fit">
                    Learn More
                  </a>
                </motion.div>
              </div>
            </motion.div>

            {/* ── Card 2: Smart Search (text left, image right) ── */}
            <motion.div
              className="kero-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              <div className="grid md:grid-cols-2">
                {/* Text left */}
                <motion.div className="p-6 md:p-8 flex flex-col justify-center order-2 md:order-1" variants={fadeUp} custom={0}>
                  <span className="inline-block w-fit px-3 py-1 text-xs font-medium text-[#6691a3] bg-[#6691a3]/10 border border-[#6691a3]/20 rounded-full mb-4">
                    FTS5 Engine
                  </span>
                  <h3 className="font-serif font-normal text-3xl text-[#f5f5f5] mb-4" style={{ letterSpacing: '-1px' }}>
                    Smart Search
                  </h3>
                  <p className="text-[#828282] leading-relaxed text-lg mb-6">
                    Full-text search with porter tokenizer, smart fallbacks, and
                    natural language queries. Find any memory in &lt;10ms.
                  </p>
                  <a href="#cli" className="pill-button pill-button-outline text-sm w-fit">
                    Learn More
                  </a>
                </motion.div>
                {/* Terminal mockup right */}
                <motion.div className="p-6 md:p-8 order-1 md:order-2" variants={fadeUp} custom={0.15}>
                  <TerminalMockup>
                    <div className="text-[#828282]">$ kratos search &quot;auth&quot;</div>
                    <div className="mt-3 text-[#a1a1a1]">Found 3 memories (2ms):</div>
                    <div className="mt-2 text-[#f5f5f5]">#1  JWT auth with refresh tokens</div>
                    <div className="text-[#a1a1a1]">    15-min expiry, httpOnly cookies,</div>
                    <div className="text-[#a1a1a1]">    rotate on each request</div>
                    <div className="text-[#6691a3]">    [auth] [security] — importance: 5</div>
                    <div className="mt-2 text-[#f5f5f5]">#2  Rate limiter middleware</div>
                    <div className="text-[#a1a1a1]">    express-rate-limit, 100 req/15min</div>
                    <div className="text-[#6691a3]">    [middleware] — importance: 3</div>
                    <div className="mt-2 text-[#f5f5f5]">#3  OAuth2 Google provider</div>
                    <div className="text-[#a1a1a1]">    passport-google-oauth20</div>
                    <div className="text-[#6691a3]">    [auth] [oauth] — importance: 4</div>
                  </TerminalMockup>
                </motion.div>
              </div>
            </motion.div>

            {/* ── Card 3: Security (image left, text right) ── */}
            <motion.div
              className="kero-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              id="security"
            >
              <div className="grid md:grid-cols-2">
                {/* Terminal mockup left */}
                <motion.div className="p-6 md:p-8" variants={fadeUp} custom={0}>
                  <TerminalMockup>
                    <div className="text-[#828282]">$ kratos scan</div>
                    <div className="mt-3 text-[#96a665]">&#10004; Encryption: AES-256-GCM</div>
                    <div className="text-[#96a665]">&#10004; Key derivation: PBKDF2</div>
                    <div className="text-[#96a665]">&#10004; Per-project keys: enabled</div>
                    <div className="mt-2 text-[#bda96d]">&#9888; PII scan found 2 items:</div>
                    <div className="text-[#a1a1a1]">  - email in mem_3a1c (redacted)</div>
                    <div className="text-[#a1a1a1]">  - api_key in mem_7f2d (redacted)</div>
                    <div className="mt-2 text-[#96a665]">&#10004; Secret scanning: clean</div>
                    <div className="text-[#96a665]">&#10004; Retention policy: 90d</div>
                    <div className="mt-2 text-[#a1a1a1]">All checks passed. 0 network calls.</div>
                  </TerminalMockup>
                </motion.div>
                {/* Text right */}
                <motion.div className="p-6 md:p-8 flex flex-col justify-center" variants={fadeUp} custom={0.15}>
                  <span className="inline-block w-fit px-3 py-1 text-xs font-medium text-[#bda96d] bg-[#bda96d]/10 border border-[#bda96d]/20 rounded-full mb-4">
                    AES-256-GCM
                  </span>
                  <h3 className="font-serif font-normal text-3xl text-[#f5f5f5] mb-4" style={{ letterSpacing: '-1px' }}>
                    Military-Grade Security
                  </h3>
                  <p className="text-[#828282] leading-relaxed text-lg mb-6">
                    Per-project encryption, PII detection, secret scanning, and
                    data retention policies. Nothing leaves your machine.
                  </p>
                  <a href="#security" className="pill-button pill-button-outline text-sm w-fit">
                    Learn More
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================
          3. CLI SECTION
          ========================================= */}
      <section id="cli" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#262626]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.h2
              className="font-serif font-normal text-4xl sm:text-5xl text-[#f5f5f5] mb-4"
              style={{ letterSpacing: '-1px' }}
              variants={fadeUp}
              custom={0}
            >
              One CLI to rule them all
            </motion.h2>
            <motion.p
              className="text-[#828282] text-lg max-w-xl mx-auto"
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
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
            custom={0.15}
          >
            <div className="bg-[#171717] border border-[#262626] rounded-[20px] p-6 overflow-x-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-[#ff5f57]/70 rounded-full" />
                <div className="w-3 h-3 bg-[#febc2e]/70 rounded-full" />
                <div className="w-3 h-3 bg-[#28c840]/70 rounded-full" />
                <span className="ml-2 text-xs text-[#828282] font-mono">kratos</span>
              </div>
              <pre className="text-[#96a665] font-mono text-xs sm:text-sm leading-relaxed">
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
                className="bg-[#171717] border border-[#262626] rounded-[16px] p-5 hover:border-[#333333] transition-colors duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={fadeUp}
                custom={i * 0.05}
              >
                <div className="flex items-center gap-3 mb-2">
                  <cmd.icon className="h-4 w-4 text-[#96a665]" />
                  <span className="font-mono text-sm font-medium text-[#f5f5f5]">
                    {cmd.name}
                  </span>
                </div>
                <p className="text-[#828282] text-sm mb-3">{cmd.desc}</p>
                <code className="text-xs font-mono text-[#bda96d]/80 bg-[#0a0a0a]/60 px-2 py-1 rounded block truncate">
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
      <section id="plugin" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[#262626]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.h2
              className="font-serif font-normal text-4xl sm:text-5xl text-[#f5f5f5] mb-4"
              style={{ letterSpacing: '-1px' }}
              variants={fadeUp}
              custom={0}
            >
              Or let it run itself
            </motion.h2>
            <motion.p
              className="text-[#828282] text-lg max-w-2xl mx-auto"
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
            viewport={{ once: true, amount: 0.1 }}
          >
            {[
              {
                hook: 'SessionStart',
                desc: 'Load project context and recent memories into the session.',
                dotColor: '#96a665',
              },
              {
                hook: 'PostToolUse',
                desc: 'Capture file edits, commands, and tool outputs automatically.',
                dotColor: '#bda96d',
              },
              {
                hook: 'Stop',
                desc: 'Compress and save observations before the response ends.',
                dotColor: '#6691a3',
              },
              {
                hook: 'SessionEnd',
                desc: 'Generate a full session summary and archive to memory.',
                dotColor: '#a1a1a1',
              },
            ].map((item, i) => (
              <motion.div
                key={item.hook}
                className="bg-[#171717] border border-[#262626] rounded-[16px] p-5"
                variants={fadeUp}
                custom={i * 0.08}
              >
                <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: item.dotColor }} />
                <h4 className="font-mono text-sm font-medium text-[#f5f5f5] mb-2">
                  {item.hook}
                </h4>
                <p className="text-[#828282] text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#262626] border-b border-b-[#262626]">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {[
            { icon: Clock, value: '<10ms', label: 'Retrieval' },
            { icon: Lock, value: 'AES-256', label: 'Encrypted' },
            { icon: Zap, value: '13', label: 'CLI Commands' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i * 0.1}>
              <stat.icon className="h-5 w-5 text-[#96a665] mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-serif font-normal text-[#f5f5f5]" style={{ letterSpacing: '-1px' }}>
                {stat.value}
              </div>
              <div className="text-sm text-[#828282] mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* =========================================
          6. INSTALLATION
          ========================================= */}
      <section id="install" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.h2
              className="font-serif font-normal text-4xl sm:text-5xl text-[#f5f5f5] mb-4"
              style={{ letterSpacing: '-1px' }}
              variants={fadeUp}
              custom={0}
            >
              Get started in seconds
            </motion.h2>
          </motion.div>

          <motion.div
            className="space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div variants={fadeUp} custom={0.1}>
              <p className="text-sm text-[#828282] mb-2">Run one command. That's it.</p>
              <CodeBlock code="npx kratos-mcp" />
            </motion.div>
            <motion.p className="text-[#828282] text-sm" variants={fadeUp} custom={0.2}>
              Auto-detects your project, sets up hooks, and starts capturing memories. No global install needed.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* =========================================
          7. FINAL CTA
          ========================================= */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(165.211% 73% at 44.5% 92.4%, rgba(189, 169, 109, 0.4) 0%, rgba(23, 23, 23, 0.64) 48.8457%, rgba(23, 23, 23, 0.48) 100%)',
          }}
        />
        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.h2
            className="font-serif font-normal text-4xl sm:text-5xl lg:text-6xl text-[#f5f5f5] mb-6"
            style={{ letterSpacing: '-1px' }}
            variants={fadeUp}
            custom={0}
          >
            Your AI should remember everything
          </motion.h2>
          <motion.p
            className="text-[#828282] text-lg max-w-xl mx-auto mb-10"
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
