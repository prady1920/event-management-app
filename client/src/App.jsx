import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEvents, addOptimistic, replaceEvent, removeEvent } from './store/eventsSlice'
import AddEventForm from './components/AddEventForm'
import RegisterUserForm from './components/RegisterUserForm'

export default function App() {

  const [showForm, setShowForm] = useState(false)
  const [registerForm, setRegisterForm] = useState(false)

  const dispatch = useDispatch()
  const events = useSelector(state => state.events.items)
  const status = useSelector(state => state.events.status)
  const storeError = useSelector(state => state.events.error)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)              

 useEffect(() => {
  	if (status === 'idle') {
    	dispatch(fetchEvents())
   	}
	}, [status, dispatch])
	
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

  // state + functions for viewing attendees list
  const [attendeesModal, setAttendeesModal] = useState({ open: false, loading: false, items: [], eventId: null, error: null })

  async function showAttendees(eventId) {
    if (!eventId) {
      setError('Missing event id')
      return
    }

    setAttendeesModal({ open: true, loading: true, items: [], eventId, error: null })
    try {
      const res = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(eventId)}/attendees`)
      if (!res.ok) {
        const text = await res.text()
        const msg = text || `Failed to load attendees (status ${res.status})`
        setAttendeesModal(prev => ({ ...prev, loading: false, error: msg }))
        return
      }
      const items = await res.json()
      setAttendeesModal({ open: true, loading: false, items, eventId, error: null })
    } catch (err) {
      setAttendeesModal({ open: true, loading: false, items: [], eventId, error: err.message || 'Failed to fetch attendees' })
    }
  }

  function closeAttendees() {
    setAttendeesModal({ open: false, loading: false, items: [], eventId: null, error: null })
  }

  // friendly cell renderer for arrays/objects
  function renderCell(header, ev) {
    if (header === '_optimistic') {
      return ev._optimistic ? 'saving…' : 'committed'
    }

    const value = ev[header]

    // special-case attendees (array of objects): show count as a link that opens attendee list
    if (header === 'attendees' && Array.isArray(value)) {
      const count = value.length
      if (count === 0) return '—'
      return (
        <button
          onClick={() => showAttendees(ev.id)}
          className="text-sm text-blue-600 hover:underline"
          type="button"
        >
          {count}
        </button>
      )
    }

    // arrays in general: join primitives, otherwise JSON.stringify items
    if (Array.isArray(value)) {
      if (value.length === 0) return '—'
      const joined = value.map(item => {
        if (item == null) return ''
        if (typeof item === 'object') return JSON.stringify(item)
        return String(item)
      }).join(', ')
      return joined
    }

    // objects: pretty JSON (fall back to string)
    if (value && typeof value === 'object') {
      // try to show a human-friendly field if present
      const friendly = value.name ?? value.title ?? value.label
      if (friendly) return String(friendly)
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }

    if (value !== undefined && value !== null && value !== '') return String(value)
    return '—'
  }

  // optimistic add: immediately add a temporary event, then POST; replace on success, remove and show error on failure
  async function addEventOptimistic(eventBody) {
  const tempId = `temp-${Date.now()}`
  const tempEvent = { id: tempId, ...eventBody, _optimistic: true }
  // optimistic update in Redux
  dispatch(addOptimistic(tempEvent))

  try {
    const res = await fetch('http://localhost:5000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody)
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Server error')
    }
    const created = await res.json()
    // replace optimistic entry with created event
    dispatch(replaceEvent({ tempId, event: created }))
    return created
  } catch (err) {
    // rollback
    dispatch(removeEvent(tempId))
    setError(err.message || 'Failed to create event')
    throw err
  }
}

// fetch attendees for an event
async function showAttendees(eventId) {
  if (!eventId) { setError('Missing event id'); return }
  setAttendeesModal({ open: true, loading: true, items: [], eventId, error: null })
  try {
    const res = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(eventId)}/attendees`)
    if (!res.ok) {
      const text = await res.text()
      setAttendeesModal(prev => ({ ...prev, loading: false, error: text || `Failed to load attendees (status ${res.status})` }))
      return
    }
    const items = await res.json()
    setAttendeesModal({ open: true, loading: false, items, eventId, error: null })
  } catch (err) {
    setAttendeesModal({ open: true, loading: false, items: [], eventId, error: err.message || 'Failed to fetch attendees' })
  }
}

 async function registerUser(userBody) {
  // userBody expected: { userId, username, firstName, lastName, email, eventId }
  const { eventId, email, firstName, lastName, username } = userBody || {}

  if (!eventId) {
    setError('Please select an event to register for')
    throw new Error('Missing eventId')
  }
  if (!email || !email.trim()) {
    setError('Email is required to register')
    throw new Error('Missing email')
  }

  const name = [firstName, lastName].filter(Boolean).join(' ') || username || `user-${userBody.userId || 'anon'}`

  try {
    // clear previous messages
    setError(null)
    setSuccess(null)

    const res = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(eventId)}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email.trim() })
    })

    if (!res.ok) {
      const text = await res.text()
      const msg = text || `Failed to register (status ${res.status})`
      setError(msg)
      throw new Error(msg)
    }

    const attendee = await res.json()
    // refresh events so attendee list is up-to-date
    await dispatch(fetchEvents())
    // show success briefly
    setSuccess(`Registered ${attendee.name ?? attendee.email ?? 'user'} successfully`)
    setTimeout(() => setSuccess(null), 4000)
    return attendee
  } catch (err) {
    setError(err.message || 'Registration failed')
    throw err
  }
}

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Event Management App</h1>
      </header>

      <main className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 flex justify-between items-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 flex justify-between items-center">
            <p className="text-sm text-green-700">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-sm text-green-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-8 flex gap-3">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Add New Event
          </button>
        </div>

	<div className="mb-8 flex gap-3">
          <button
            type="button"
            onClick={() => setRegisterForm(true)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Register User
          </button>
        </div>

	{registerForm && (
          <RegisterUserForm
	    onRegUser = {registerUser}
            onClose={() => setRegisterForm(false)}
          />
        )}

        {showForm && (
          <AddEventForm
            onAddOptimistic={addEventOptimistic}
            onClose={() => setShowForm(false)}
          />
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
                        {renderCell(header, ev)}
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

        {/* attendees modal */}
        {attendeesModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Attendees for event {attendeesModal.eventId}</h2>
                <button onClick={closeAttendees} className="text-sm text-gray-500 hover:underline">Close</button>
              </div>

              {attendeesModal.loading && <p className="text-sm text-gray-600">Loading…</p>}
              {attendeesModal.error && <p className="text-sm text-red-600">{attendeesModal.error}</p>}

              {!attendeesModal.loading && !attendeesModal.error && (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {attendeesModal.items.length === 0 && <li className="text-sm text-gray-600">No attendees</li>}
                  {attendeesModal.items.map((a, i) => (
                    <li key={a.id ?? a.email ?? i} className="text-sm text-gray-700">
                      {typeof a === 'string' ? a : (a.name ?? a.email ?? a.username ?? JSON.stringify(a))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
