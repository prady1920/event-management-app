import React, { useEffect, useState } from 'react'

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

  return (
    <div className="app">
      <header>
        <h1>Event Management App (Minimal)</h1>
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
              <div className="meta">{ev.date || ''} {ev.location ? `— ${ev.location}` : ''}</div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
