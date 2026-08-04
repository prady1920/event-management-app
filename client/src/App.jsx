import React, { useEffect, useState, useMemo } from 'react'
import AddEventForm from './components/AddEventForm'

export default function App() {
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(setEvents)
      .catch(console.error)
  }, [])

  // build table headers dynamically from event keys so all properties show up
  const headers = useMemo(() => {
    const keys = new Set()
    events.forEach(ev => {
      if (ev && typeof ev === 'object') {
        Object.keys(ev).forEach(k => keys.add(k))
      }
    })
    // provide a stable ordering for common fields first
    const commonOrder = ['id', 'title', 'date', 'location', 'description', 'maxCapacity', 'attendees']
    const ordered = [...commonOrder.filter(k => keys.has(k)), ...[...keys].filter(k => !commonOrder.includes(k))]
    return ordered
  }, [events])

  function handleAdd(newEvent) {
    setEvents(prev => [...prev, newEvent])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Event Management App</h1>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="mb-8 flex gap-3">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Add New Event
          </button>
        </div>

        {showForm && (
          <div className="mb-8">
            <AddEventForm
              onAdd={(ev) => { handleAdd(ev); setShowForm(false) }}
              onClose={() => setShowForm(false)}
            />
          </div>
        )}

        {events.length > 0 ? (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="w-full bg-white border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  {headers.map(header => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((ev, index) => (
                  <tr key={ev.id ?? index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} >
                    {headers.map(header => (
                      <td
                        key={`${ev.id ?? index}-${header}`}
                        className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
                      >
                        {ev[header] !== undefined && ev[header] !== null ? String(ev[header]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No events yet. Create one to get started!</p>
          </div>
        )}
      </main>
    </div>
  )
}
