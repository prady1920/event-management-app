import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

export default function RegisterUserForm({ onRegUser, onClose, events: propsEvents = [], lastUserId = 0 }) {
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [eventId, setEventId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // read events from Redux; fall back to any events passed via props
  const storeEvents = useSelector(state => (state && state.events && Array.isArray(state.events.items) ? state.events.items : []))
  const events = Array.isArray(propsEvents) && propsEvents.length > 0 ? propsEvents : storeEvents


  // Helpers to handle different event shapes (strings or objects)
  function getEventValue(ev) {
    if (ev == null) return ''
    if (typeof ev === 'object') return ev.id ?? ev._id ?? ev.value ?? ''
    return String(ev)
  }
  function getEventLabel(ev) {
    if (ev == null) return ''
    if (typeof ev === 'object') return ev.name ?? ev.title ?? ev.label ?? String(getEventValue(ev))
    return String(ev)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const body = {
      name: name.trim(),
      email: email.trim(),
      eventId: eventId || null
    }

    setSubmitting(true)
    // optimistic update: inform parent, close form immediately
    try {
      if (onRegUser) {
        // let parent handle optimistic updates/errors; await so we can show submitting state
        await onRegUser(body).catch(() => {})
      }
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
      setName('')
      setEmail('')
      setEventId('')
    }
  }

  return (
    // Modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg mx-4 rounded-lg shadow-lg border border-gray-200 p-6 z-10">
        <h2 className="text-xl font-medium mb-4">Register User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">


          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Name"
            />
          </div>


	<div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@example.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Event</label>
            <select
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select event</option>
              {Array.isArray(events) && events.map((ev, idx) => {
                const val = getEventValue(ev) || String(idx)
                const label = getEventLabel(ev)
                return (
                  <option key={val + '-' + idx} value={val}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">
              {submitting ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
