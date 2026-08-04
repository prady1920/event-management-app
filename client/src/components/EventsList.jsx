import React, { useState, useEffect } from 'react'

export default function EventsList({ events, headers, onEventUpdated, onEventDeleted }) {
  const [editingEvent, setEditingEvent] = useState(null) // event object being edited
  const [editLoadingId, setEditLoadingId] = useState(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [formValues, setFormValues] = useState({ title: '', date: '', location: '', description: '', maxCapacity: '' })

  useEffect(() => {
    if (editingEvent) {
      setFormValues({
        title: editingEvent.title ?? '',
        date: editingEvent.date ?? '',
        location: editingEvent.location ?? '',
        description: editingEvent.description ?? '',
        maxCapacity: editingEvent.maxCapacity != null ? String(editingEvent.maxCapacity) : ''
      })
      setFormErrors({})
    }
  }, [editingEvent])

  function validate(values) {
    const errs = {}
    if (!values.title || !values.title.trim()) errs.title = 'Title is required'
    if (!values.date) errs.date = 'Date is required'
    if (values.maxCapacity) {
      const n = Number(values.maxCapacity)
      if (!Number.isInteger(n) || n < 0) errs.maxCapacity = 'Must be a non-negative integer'
    }
    return errs
  }

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

  function openEditModal(ev) {
    if (typeof ev.id !== 'number') {
      alert('This event is not yet saved on the server and cannot be edited.')
      return
    }
    setEditingEvent(ev)
  }

  function closeEditModal() {
    setEditingEvent(null)
    setFormErrors({})
  }

  async function submitEdit(e) {
    e.preventDefault()
    const vals = formValues
    const errs = validate(vals)
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    const updates = {
      title: vals.title.trim(),
      date: vals.date || undefined,
      location: vals.location.trim() || undefined,
      description: vals.description.trim() || undefined,
      maxCapacity: vals.maxCapacity === '' ? 0 : Number(vals.maxCapacity)
    }

    try {
      setEditLoadingId(editingEvent.id)
      const updated = await updateEvent(editingEvent.id, updates)
      if (onEventUpdated) onEventUpdated(updated)
      closeEditModal()
    } catch (err) {
      console.error('Failed to update event', err)
      alert(err.message || 'Failed to update event')
    } finally {
      setEditLoadingId(null)
    }
  }

  async function handleDelete(ev) {
    if (typeof ev.id !== 'number') {
      // local optimistic event; remove locally
      if (onEventDeleted) onEventDeleted(ev)
      return
    }

    if (!window.confirm(`Are you sure you want to delete event "${ev.title ?? ev.id}"?`)) return

    try {
      setDeleteLoadingId(ev.id)
      const removed = await deleteEvent(ev.id)
      if (onEventDeleted) onEventDeleted(removed)
    } catch (err) {
      console.error('Failed to delete event', err)
      alert(err.message || 'Failed to delete event')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  // simple inline SVG icons
  const EditIcon = ({ loading }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h6M4 15.5V19a1 1 0 001 1h3.5L20 9.5a2.121 2.121 0 000-3L17.5 3.5a2.121 2.121 0 00-3 0L4 13.5z" />
    </svg>
  )

  const DeleteIcon = ({ loading }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'text-gray-400' : 'text-red-600 hover:text-red-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        onClick={() => openEditModal(ev)}
                        aria-label={`Edit event ${ev.id ?? ''}`}
                        className="p-1 rounded-md hover:bg-gray-100"
                        title="Edit"
                        disabled={editLoadingId === ev.id || deleteLoadingId === ev.id}
                      >
                        <EditIcon loading={editLoadingId === ev.id} />
                      </button>

                      <button
                        onClick={() => handleDelete(ev)}
                        aria-label={`Delete event ${ev.id ?? ''}`}
                        className="p-1 rounded-md hover:bg-gray-100"
                        title="Delete"
                        disabled={deleteLoadingId === ev.id || editLoadingId === ev.id}
                      >
                        <DeleteIcon loading={deleteLoadingId === ev.id} />
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

      {editingEvent && (
        // Modal for editing
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-40" onClick={closeEditModal} />
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-lg shadow-lg border border-gray-200 p-6 z-10">
            <h2 className="text-xl font-medium mb-4">Edit Event</h2>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  value={formValues.title}
                  onChange={e => setFormValues(prev => ({ ...prev, title: e.target.value }))}
                  className={`mt-1 block w-full rounded-md border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Event title"
                  required
                />
                {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={formValues.date}
                  onChange={e => setFormValues(prev => ({ ...prev, date: e.target.value }))}
                  className={`mt-1 block w-full rounded-md border ${formErrors.date ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
                {formErrors.date && <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formValues.description}
                  onChange={e => setFormValues(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  value={formValues.location}
                  onChange={e => setFormValues(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Capacity</label>
                <input
                  type="number"
                  min="0"
                  value={formValues.maxCapacity}
                  onChange={e => setFormValues(prev => ({ ...prev, maxCapacity: e.target.value }))}
                  className={`mt-1 block w-full rounded-md border ${formErrors.maxCapacity ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g. 100"
                />
                {formErrors.maxCapacity && <p className="mt-1 text-sm text-red-600">{formErrors.maxCapacity}</p>}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editLoadingId === editingEvent.id}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoadingId === editingEvent.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoadingId === editingEvent.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
