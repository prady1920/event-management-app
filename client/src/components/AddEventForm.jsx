import React, { useState, useEffect } from 'react'

export default function AddEventForm({ onAddOptimistic, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setErrors(validate())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, date, maxCapacity])

  function validate() {
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required'

    if (!date) {
      errs.date = 'Date is required'
    } else {
      // disallow past dates
      const today = new Date()
      const selected = new Date(date + 'T00:00:00')
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      if (selected < startOfToday) errs.date = 'Date cannot be in the past'
    }

    if (maxCapacity) {
      const n = Number(maxCapacity)
      if (!Number.isInteger(n) || n < 0) errs.maxCapacity = 'Must be a non-negative integer'
    }

    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const currentErrors = validate()
    setErrors(currentErrors)
    if (Object.keys(currentErrors).length > 0) return

    const body = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
      date: date || undefined
    }

    setSubmitting(true)
    // optimistic update: inform parent, close form immediately
    try {
      if (onAddOptimistic) {
        // fire and forget — parent will handle errors and updating the optimistic row
        onAddOptimistic(body).catch(() => {})
      }
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
      // reset fields; parent now has the optimistic event
      setTitle('')
      setDescription('')
      setLocation('')
      setMaxCapacity('')
      setDate('')
    }
  }

  return (
    // Modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg mx-4 rounded-lg shadow-lg border border-gray-200 p-6 z-10">
        <h2 className="text-xl font-medium mb-4">Create New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`mt-1 block w-full rounded-md border ${errors.title ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Event title"
              required
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={`mt-1 block w-full rounded-md border ${errors.date ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
              required
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Short description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max Capacity</label>
            <input
              type="number"
              min="0"
              value={maxCapacity}
              onChange={e => setMaxCapacity(e.target.value)}
              className={`mt-1 block w-full rounded-md border ${errors.maxCapacity ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
              placeholder="e.g. 100"
            />
            {errors.maxCapacity && <p className="mt-1 text-sm text-red-600">{errors.maxCapacity}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || Object.keys(errors).length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
