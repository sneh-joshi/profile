import { useEffect, useRef } from 'react'

export function useReveal<T extends HTMLElement = HTMLElement>(delay = 0) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('is-visible'), delay)
          obs.disconnect()
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -24px 0px' },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  return ref
}
