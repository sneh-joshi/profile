import { useEffect, useState } from 'react'
import Nav from './components/Nav'
import ExperienceChatbot from './components/ExperienceChatbot'
import Profile from './sections/Profile'
import Projects from './sections/Projects'
import ArchitecturePhilosophy from './sections/ArchitecturePhilosophy'
import './App.css'

const SECTIONS = ['profile', 'projects', 'architecture'] as const
type Section = (typeof SECTIONS)[number]

function App() {
  const [activeSection, setActiveSection] = useState<Section>('profile')

  useEffect(() => {
    const observers = SECTIONS.map((id) => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { rootMargin: '-50% 0px -50% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [])

  return (
    <div className="app">
      <Nav active={activeSection} />
      <main>
        <section id="profile" className="section">
          <Profile />
        </section>
        <section id="projects" className="section">
          <Projects />
        </section>
        <section id="architecture" className="section">
          <ArchitecturePhilosophy />
        </section>
      </main>
      <ExperienceChatbot />
      <footer className="footer">
        <span className="footer-text">snehaljoshi09@hotmail.com · {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}

export default App
