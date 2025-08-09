import Hero from './components/Hero'
import WhatIsMCP from './components/WhatIsMCP'
import FourPillars from './components/FourPillars'
import HowItWorks from './components/HowItWorks'
import LiveDemo from './components/LiveDemo'
import GetStarted from './components/GetStarted'

function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <WhatIsMCP />
      <FourPillars />
      <HowItWorks />
      <LiveDemo />
      <GetStarted />
    </div>
  )
}

export default App