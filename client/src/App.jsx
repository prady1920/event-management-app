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
        <h1>Event Management App (Minimal)</h1>
      </header>

      <main>
        <form onSubmit={addEvent} className="add-form">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New event title" />
          <button type="submit">Add</button>
        </form>

        {/* table view for events */}
        <table className="events-table">
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev, idx) => (
              <tr key={ev.id ?? idx}>
                {headers.map(h => (
                  <td key={h}>{ev && ev[h] != null ? String(ev[h]) : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </main>
    </div>
  )
}