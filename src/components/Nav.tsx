import './Nav.css'

interface NavProps {
  active: string
}

const NAV_ITEMS = [
  { id: 'profile', label: 'Profile' },
  { id: 'projects', label: 'Projects' },
  { id: 'architecture', label: 'Architecture' },
]

export default function Nav({ active }: NavProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="nav">
      <ul className="nav-links">
        {NAV_ITEMS.map(({ id, label }) => (
          <li key={id}>
            <button
              className={`nav-link${active === id ? ' nav-link--active' : ''}`}
              onClick={() => scrollTo(id)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
