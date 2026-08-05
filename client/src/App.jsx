import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEvents, addOptimistic, replaceEvent, removeEvent } from './store/eventsSlice'
import AddEventForm from './components/AddEventForm'
import RegisterUserForm from './components/RegisterUserForm'

export default function App() {
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [registerForm, setRegisterForm] = useState(false)
  const [error, setError] = useState(null)

  const dispatch = useDispatch()
  const events = useSelector(state => state.events.items)
  const status = useSelector(state => state.events.status)
  const storeError = useSelector(state => state.events.error)
  const [error, setError] = useState(null)

 useEffect(() => {
  	if (status === 'idle') {
    	dispatch(fetchEvents())
  	}
	}, [status, dispatch])
	
  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(setEvents)
      .catch(err => {
        console.error(err)
        setError('Failed to load events')
      })
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
     alert("write logic to register user against an event, dont exceed max capacity and dont register duplicate user");    
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
                        {header === '_optimistic' ? (ev._optimistic ? 'saving…' : 'committed') : (ev[header] !== undefined && ev[header] !== null ? String(ev[header]) : '—')}
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
                     
