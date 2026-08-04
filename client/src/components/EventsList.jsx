import React from 'react'

export default function EventsList({ events, headers, onEventUpdated, onEventDeleted }) {
  async function updateEvent(id, updates) {
    const res = await fetch(`http://localhost:5000/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Failed to update event')
    }
    return await res.json()
  }

  async function deleteEvent(id) {
    const res = await fetch(`http://localhost:5000/api/events/${id}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Failed to delete event')
    }
    return await res.json()
  }

  async function handleEdit(ev) {
    // Prevent editing optimistic/temp events that are not yet persisted
    if (typeof ev.id !== 'number') {
      alert('This event is not yet saved on the server and cannot be edited.')
      return
    }

    try {
      // Prompt the user for common editable fields (pre-filled with current values)
      const title = window.prompt('Edit title', ev.title ?? '')
      if (title === null) return // user cancelled

      const date = window.prompt('Edit date (YYYY-MM-DD)', ev.date ?? '')
      if (date === null) return

      const location = window.prompt('Edit location', ev.location ?? '')
      if (location === null) return

      const description = window.prompt('Edit description', ev.description ?? '')
      if (description === null) return

      const maxCapacityRaw = window.prompt('Edit max capacity (leave blank for 0)', ev.maxCapacity != null ? String(ev.maxCapacity) : '')
      if (maxCapacityRaw === null) return

      const updates = {
        title,
        date,
        location,
        description
      }

      if (maxCapacityRaw.trim() === '') {
        updates.maxCapacity = 0
      } else {
        const n = Number(maxCapacityRaw)
        if (Number.isNaN(n)) {
          alert('maxCapacity must be a number')
          return
        }
        updates.maxCapacity = n
      }

      const updated = await updateEvent(ev.id, updates)
      if (onEventUpdated) onEventUpdated(updated)
    } catch (err) {
      console.error('Failed to update event', err)
      alert(err.message || 'Failed to update event')
    }
  }

  async function handleDelete(ev) {
    if (typeof ev.id !== 'number') {
      // If it's a local optimistic event, just call the callback so parent can remove it locally
      if (onEventDeleted) {
        onEventDeleted(ev)
        return
      }
      alert('This event is not yet saved on the server and cannot be deleted remotely.')
      return
    }

    if (!window.confirm(`Are you sure you want to delete event "${ev.title ?? ev.id}"?`)) return

    try {
      const removed = await deleteEvent(ev.id)
      if (onEventDeleted) onEventDeleted(removed)
    } catch (err) {
      console.error('Failed to delete event', err)
      alert(err.message || 'Failed to delete event')
    }
  }

  // simple inline SVG icons
  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 hover:text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h6M4 15.5V19a1 1 0 001 1h3.5L20 9.5a2.121 2.121 0 000-3L17.5 3.5a2.121 2.121 0 00-3 0L4 13.5z" />
    </svg>
  )

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 hover:text-red-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
    </svg>
  )

  return (
    <>
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Actions
                </th>
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
                      {header === '_optimistic' ? (ev._optimistic ? 'saving…' : 'committed') : (ev[header] !== undefined && ev[header] !== null ? String(ev[header]) : '—')}
                    </td>
                  ))}

                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(ev)}
                        aria-label={`Edit event ${ev.id ?? ''}`}
                        className="p-1 rounded-md hover:bg-gray-100"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>

                      <button
                        onClick={() => handleDelete(ev)}
                        aria-label={`Delete event ${ev.id ?? ''}`}
                        className="p-1 rounded-md hover:bg-gray-100"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
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
    </>
  )
}
