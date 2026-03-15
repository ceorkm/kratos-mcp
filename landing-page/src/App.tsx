import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HelmetProvider } from 'react-helmet-async'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Docs from './pages/Docs'
import ProgrammaticPage from './pages/ProgrammaticPage'
import KratosVsMemoryBank from './blog/kratos-vs-memory-bank'

function App() {
  return (
    <HelmetProvider>
      <Router>
      <div className="min-h-screen bg-dark-bg text-dark-text">
        {/* Subtle background effect */}
        <div className="fixed inset-0 bg-neon-blue/5 opacity-5" />

        {/* Subtle grid pattern */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Navigation */}
        <Navbar />

        {/* Main Content */}
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/kratos-vs-memory-bank" element={<KratosVsMemoryBank />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/resources/:slug" element={<ProgrammaticPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating orbs for visual enhancement */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-64 h-64 bg-neon-blue rounded-full opacity-10 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ top: '20%', left: '10%' }}
          />
          <motion.div
            className="absolute w-96 h-96 bg-neon-blue rounded-full opacity-10 blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{ top: '50%', right: '15%' }}
          />
          <motion.div
            className="absolute w-48 h-48 bg-neon-blue rounded-full opacity-10 blur-3xl"
            animate={{
              x: [0, 120, 0],
              y: [0, -80, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{ bottom: '20%', left: '20%' }}
          />
        </div>
      </div>
      </Router>
    </HelmetProvider>
  )
}

export default App