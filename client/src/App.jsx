import React, { useEffect, useState, useMemo } from 'react'

export default function App() {
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(setEvents)
      .catch(console.error)
  }, [])

  function addEvent(e) {
    e.preventDefault()
    if (!title) return
    fetch('http://localhost:5000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
      .then(res => res.json())
      .then(newEvent => {
        setEvents(prev => [...prev, newEvent])
        setTitle('')
      })
      .catch(console.error)
  }

  // build table headers dynamically from event keys so all properties show up
  const headers = useMemo(() => {
    const keys = new Set()
    events.forEach(ev => {
      if (ev && typeof ev === 'object') {
        Object.keys(ev).forEach(k => keys.add(k))
      }
    })
    // provide a stable ordering for common fields first
    const commonOrder = ['id', 'title', 'description', 'date', 'location', 'maxCapacity', 'max_capacity', 'capacity']
    const ordered = [...commonOrder.filter(k => keys.has(k)), ...[...keys].filter(k => !commonOrder.includes(k))]
    return ordered
  }, [events])

  return (
    <div className="app">
      <header>
        <h1>Event Management App</h1>
      </header>

      <main>
        <form onSubmit={addEvent} className="add-form">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New event title" />
          <button type="submit">Add</button>
        </form>

        <ul className="events">
          {events.map(ev => (
            <li key={ev.id}>
              <strong>{ev.title}</strong>
              {ev.description && <p className="description">{ev.description}</p>}
              <div className="meta">
                {ev.date || ''}{ev.location ? ` — ${ev.location}` : ''}{(ev.maxCapacity !== undefined && ev.maxCapacity !== null) ? ` — Capacity: ${ev.maxCapacity}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
