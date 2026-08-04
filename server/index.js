const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const events = [
  { id: 1, title: 'Sample Event', date: new Date().toISOString().slice(0,10), location: 'Online', description: 'Sample Event', maxCapacity: 0, attendees: [], Actions: ["edit", "delete"] },
  { id: 2, title: 'Event 2', date: new Date().toISOString().slice(0,10), location: 'Delhi', description: 'AI event', maxCapacity: 20, attendees: [], Actions: ["edit", "delete"] },
  { id: 3, title: 'Event 3', date: new Date().toISOString().slice(0,10), location: 'Mumbai', description: 'Cloud Event', maxCapacity: 10, attendees: [] , Actions: ["edit", "delete"]}
]

app.get('/api/events', (req, res) => {
  res.json(events)
})

app.post('/api/events', (req, res) => {
  const { title, date, location, description, maxCapacity } = req.body
  const newEvent = {
    id: events.length + 1,
    title,
    date: date || new Date().toISOString().slice(0,10),
    location: location || '',
    description: description || '',
    maxCapacity: maxCapacity != null ? Number(maxCapacity) : 0,
    attendees: []
  }
  events.push(newEvent)
  res.status(201).json(newEvent)
})

// Register an attendee for an event
app.post('/api/events/:id/register', (req, res) => {
  const eventId = Number(req.params.id)
  const event = events.find(e => e.id === eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })

  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email are required to register' })

  // Enforce maxCapacity only when it's a positive number
  if (event.maxCapacity > 0 && event.attendees.length >= event.maxCapacity) {
    return res.status(400).json({ error: 'Event is full' })
  }

  // Simple duplicate check by email
  const alreadyRegistered = event.attendees.some(a => a.email === email)
  if (alreadyRegistered) return res.status(400).json({ error: 'Attendee with this email is already registered' })

  const attendee = { id: event.attendees.length + 1, name, email }
  event.attendees.push(attendee)
  res.status(201).json(attendee)
})

// List attendees for an event
app.get('/api/events/:id/attendees', (req, res) => {
  const eventId = Number(req.params.id)
  const event = events.find(e => e.id === eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })
  res.json(event.attendees)
})

// Unregister an attendee by attendee ID
app.delete('/api/events/:id/attendees/:attendeeId', (req, res) => {
  const eventId = Number(req.params.id)
  const attendeeId = Number(req.params.attendeeId)
  const event = events.find(e => e.id === eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })

  const idx = event.attendees.findIndex(a => a.id === attendeeId)
  if (idx === -1) return res.status(404).json({ error: 'Attendee not found' })

  const [removed] = event.attendees.splice(idx, 1)
  res.json(removed)
})

// Unregister an attendee by email (pass { email } in body)
app.delete('/api/events/:id/attendees', (req, res) => {
  const eventId = Number(req.params.id)
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email is required in request body to unregister' })

  const event = events.find(e => e.id === eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })

  const idx = event.attendees.findIndex(a => a.email === email)
  if (idx === -1) return res.status(404).json({ error: 'Attendee not found' })

  const [removed] = event.attendees.splice(idx, 1)
  res.json(removed)
})

// Update an existing event
app.put('/api/events/:id', (req, res) => {
  const eventId = Number(req.params.id)
  const event = events.find(e => e.id === eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })

  const { title, date, location, description, maxCapacity } = req.body

  // If maxCapacity is provided, ensure it's a non-negative integer and not less than current attendees
  if (maxCapacity != null) {
    const capacityNum = Number(maxCapacity)
    if (isNaN(capacityNum) || capacityNum < 0) {
      return res.status(400).json({ error: 'maxCapacity must be a non-negative number' })
    }
    if (capacityNum > 0 && capacityNum < event.attendees.length) {
      return res.status(400).json({ error: 'maxCapacity cannot be less than current number of attendees' })
    }
    event.maxCapacity = capacityNum
  }

  if (title != null) event.title = title
  if (date != null) event.date = date
  if (location != null) event.location = location
  if (description != null) event.description = description

  res.json(event)
})

// Delete an event
app.delete('/api/events/:id', (req, res) => {
  const eventId = Number(req.params.id)
  const idx = events.findIndex(e => e.id === eventId)
  if (idx === -1) return res.status(404).json({ error: 'Event not found' })

  const [removed] = events.splice(idx, 1)
  res.json(removed)
})

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
