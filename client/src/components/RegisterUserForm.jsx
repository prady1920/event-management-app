import React, { useState, useEffect } from 'react'

export default function RegisterUserForm({ onRegUser, onClose }) {
  const [username, setUsername] = useState('')
   
  async function handleSubmit(e) {
    e.preventDefault()
  
    const body = {
      username: username.trim()
    }

    setSubmitting(true)
    // optimistic update: inform parent, close form immediately
    try {
      if (onRegUser) {
        // fire and forget — parent will handle errors and updating the optimistic row
        onRegUser(body).catch(() => {})
      }
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
      // reset fields; parent now has the optimistic event
      setUsername('')
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
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              value={username}
              onChange={e => setTitle(e.target.value)}
              className={`mt-1 block w-full rounded-md border ${errors.title ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
              placeholder="User Name"
              required
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
        </form>
      </div>
    </div>
  )
}
