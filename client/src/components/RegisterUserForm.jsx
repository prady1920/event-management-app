import React, { useState, useEffect } from 'react'

export default function RegisterUserForm({ onRegUser, onClose, events = [], lastUserId = 0 }) {
  const [userId, setUserId] = useState(() => (Number(lastUserId) ? Number(lastUserId) + 1 : 1))
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [eventId, setEventId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setUserId(Number(lastUserId) ? Number(lastUserId) + 1 : 1)
  }, [lastUserId])

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
      userId: Number(userId) || userId,
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
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
      setUsername('')
      setFirstName('')
      setLastName('')
      setEventId('')
      // reset userId to next value based on prop
      setUserId(Number(lastUserId) ? Number(lastUserId) + 1 : 1)
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
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <input
              value={userId}
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm bg-gray-100 focus:ring-blue-500 focus:border-blue-500"
              placeholder="User ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="User Name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="First Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Last Name"
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
