import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEvents, addOptimistic, replaceEvent, removeEvent } from './store/eventsSlice'
import AddEventForm from './components/AddEventForm'
import RegisterUserForm from './components/RegisterUserForm'

export default function App() {

  const [showForm, setShowForm] = useState(false)
  const [registerForm, setRegisterForm] = useState(false)
  const [editEvent, setEditEvent] = useState(null)

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
    // always include actions column at the end for edit/delete icons
    if (!ordered.includes('actions')) ordered.push('actions')
    return ordered
  }, [events])

  // state + functions for viewing attendees list
  const [attendeesModal, setAttendeesModal] = useState({ open: false, loading: false, items: [], eventId: null, error: null })
  const [unregistering, setUnregistering] = useState({})

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

    // special actions column (edit/delete)
    if (header === 'actions') {
      const id = ev?.id
      return (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              // open edit form (simple opener; integrate with your AddEventForm if it supports editing)
              setEditEvent(ev)
              setShowForm(true)
            }}
            title="Edit"
            className="p-1 rounded text-gray-600 hover:bg-gray-100"
          >
            {/* pencil icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 15.25V18h2.75l8.486-8.486-2.75-2.75L2 15.25z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!id) {
                // no id -> cannot delete on server; remove locally if desired
                setError('Cannot delete event without an id')
                return
              }
              deleteEvent(id)
            }}
            title="Delete"
            className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={!ev?.id}
          >
            {/* trash icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M6 2a1 1 0 00-.894.553L4 4H2a1 1 0 100 2h1v9a2 2 0 002 2h8a2 2 0 002-2V6h1a1 1 0 100-2h-2l-1.106-1.447A1 1 0 0014 2H6zm3 5a1 1 0 10-2 0v6a1 1 0 102 0V7zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )
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

 async function registerUser(userBody) {
  // userBody expected: { name, userId, username, firstName, lastName, email, eventId }
  const { eventId, email, firstName, lastName, username } = userBody || {}

  if (!eventId) {
    setError('Please select an event to register for')
    throw new Error('Missing eventId')
  }
  if (!email || !email.trim()) {
    setError('Email is required to register')
    throw new Error('Missing email')
  }

  // prefer an explicit name sent from the form; fall back to first/last, username, or generated id
  const providedName = (userBody && typeof userBody.name === 'string' && userBody.name.trim()) ? userBody.name.trim() : null
  const name = providedName || [firstName, lastName].filter(Boolean).join(' ') || username || `user-${userBody?.userId || 'anon'}`

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

// unregister an attendee from the currently-open event
async function unregisterAttendee(attendee) {
  if (!attendeesModal.eventId) {
    setError('Missing event id')
    return
  }
  const aKey = attendee.id ?? attendee.email ?? JSON.stringify(attendee)
  setUnregistering(prev => ({ ...prev, [aKey]: true }))
  setError(null)
  setSuccess(null)

  try {
    let res
    // prefer an id-based delete if the attendee has an id
    if (attendee.id) {
      res = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(attendeesModal.eventId)}/attendees/${encodeURIComponent(attendee.id)}`, {
        method: 'DELETE'
      })
    } else if (attendee.email) {
      // fallback to sending the email in the body
      res = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(attendeesModal.eventId)}/attendees`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: attendee.email })
      })
    } else {
      // last resort: try sending name in body
      res = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(attendeesModal.eventId)}/attendees`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: attendee.name ?? null })
      })
    }

    if (!res.ok) {
      const text = await res.text()
      const msg = text || `Failed to unregister (status ${res.status})`
      setError(msg)
      return
    }

    // try to parse a response message, but it's optional
    let data = {}
    try { data = await res.json() } catch (_) { data = {} }

    // remove the attendee from the modal list
    setAttendeesModal(prev => ({
      ...prev,
      items: prev.items.filter(it => {
        if (attendee.name && it.name) return it.name !== attendee.name
        if (attendee.email && it.email) return it.email !== attendee.email
        return JSON.stringify(it) !== JSON.stringify(attendee)
      })
    }))

    // refresh events so counts reflect change
    await dispatch(fetchEvents())

    const message = data.message ?? data.msg ?? `Unregistered ${attendee.name ?? attendee.email ?? 'user'} successfully`
    setSuccess(message)
    setTimeout(() => setSuccess(null), 4000)
  } catch (err) {
    setError(err.message || 'Unregister failed')
    throw err
  } finally {
    setUnregistering(prev => { const copy = { ...prev }; delete copy[aKey]; return copy })
  }
}

// delete an event by id
async function deleteEvent(eventId) {
  if (!eventId) {
    setError('Missing event id')
    return
  }
  if (!window.confirm('Are you sure you want to delete this event?')) return

  setError(null)
  setSuccess(null)

  try {
    const res = await fetch(`http://localhost:5000/api/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const text = await res.text()
      const msg = text || `Failed to delete event (status ${res.status})`
      setError(msg)
      return
    }

    // remove from store
    dispatch(removeEvent(eventId))
    setSuccess('Event deleted')
    setTimeout(() => setSuccess(null), 3000)
  } catch (err) {
    setError(err.message || 'Delete failed')
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

        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
  <div className="w-full sm:w-auto">
    <button
      type="button"
      onClick={() => { setShowForm(true); setEditEvent(null) }}
      className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
    >
      Add New Event
    </button>
  </div>

  <div className="w-full sm:w-auto text-right">
    <button
      type="button"
      onClick={() => setRegisterForm(true)}
      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
    >
      Register User
    </button>
  </div>
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
    	onClose={() => { setShowForm(false); setEditEvent(null) }}
    	editEvent={editEvent}
    	onEventUpdated={async (updated) => {
      	// refresh events from server so the table shows the updated fields
      	await dispatch(fetchEvents())
      	setSuccess('Event updated')
      	setTimeout(() => setSuccess(null), 3000)
    	}}
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
                      {header === 'actions' ? 'Actions' : header}
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
                  {attendeesModal.items.map((a, i) => {
                    const key = a.name ?? a.name ?? i
                    return (
                      <li key={key} className="text-sm text-gray-700 flex justify-between items-center">
                        <span className="truncate">
                          {typeof a === 'string' ? a : (a.name ?? a.email ?? JSON.stringify(a))}
                        </span>
                        <button
                          type="button"
                          onClick={() => unregisterAttendee(a)}
                          disabled={!!unregistering[key]}
                          className="ml-3 text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          {unregistering[key] ? 'Unregistering…' : 'Unregister'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
