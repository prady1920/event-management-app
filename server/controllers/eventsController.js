const events = require('../models/events')
const { withEventLock } = require('../utils/lock')
const HttpError = require('../errors/HttpError')

exports.getEvents = (req, res) => {
  res.json(events)
}

exports.createEvent = (req, res, next) => {
  try {
    const { title, date, location, description, maxCapacity } = req.body
    if (!title) throw new HttpError(400, 'title is required')

    const newEvent = {
      id: events.length + 1,
      title,
      date: date || new Date().toISOString().slice(0, 10),
      location: location || '',
      description: description || '',
      maxCapacity: maxCapacity != null ? Number(maxCapacity) : 0,
      attendees: []
    }

    events.push(newEvent)
    res.status(201).json(newEvent)
  } catch (err) {
    next(err)
  }
}

exports.registerAttendee = async (req, res, next) => {
  const eventId = Number(req.params.id)
  const event = events.find(e => e.id === eventId)
  if (!event) return next(new HttpError(404, 'Event not found'))

  const { name, email } = req.body
  if (!name || !email) return next(new HttpError(400, 'name and email are required to register'))

  try {
    const attendee = await withEventLock(eventId, () => {
      // duplicate check
      if (event.attendees.some(a => a.email === email)) {
        throw new HttpError(400, 'Attendee with this email is already registered')
      }

      // Enforce maxCapacity
      if (event.maxCapacity > 0 && event.attendees.length >= event.maxCapacity) {
        throw new HttpError(400, 'Event is full')
      }

      const newAttendee = { id: event.attendees.length + 1, name, email }
      event.attendees.push(newAttendee)
      return newAttendee
    })

    res.status(201).json({ message: `User successfully added to event ${event.title}`, attendee })
  } catch (err) {
    next(err)
  }
}

exports.listAttendees = (req, res, next) => {
  const eventId = Number(req.params.id)
  const event = events.find(e => e.id === eventId)
  if (!event) return next(new HttpError(404, 'Event not found'))
  res.json(event.attendees)
}

exports.unregisterById = (req, res, next) => {
  const eventId = Number(req.params.id)
  const attendeeId = Number(req.params.attendeeId)
  const event = events.find(e => e.id === eventId)
  if (!event) return next(new HttpError(404, 'Event not found'))

  const idx = event.attendees.findIndex(a => a.id === attendeeId)
  if (idx === -1) return next(new HttpError(404, 'Attendee not found'))

  const [removed] = event.attendees.splice(idx, 1)
  res.json(removed)
}

exports.unregisterByEmail = (req, res, next) => {
  const eventId = Number(req.params.id)
  const { email } = req.body
  if (!email) return next(new HttpError(400, 'email is required in request body to unregister'))

  const event = events.find(e => e.id === eventId)
  if (!event) return next(new HttpError(404, 'Event not found'))

  const idx = event.attendees.findIndex(a => a.email === email)
  if (idx === -1) return next(new HttpError(404, 'Attendee not found'))

  const [removed] = event.attendees.splice(idx, 1)
  res.json(removed)
}

exports.updateEvent = (req, res, next) => {
  const eventId = Number(req.params.id)
  const event = events.find(e => e.id === eventId)
  if (!event) return next(new HttpError(404, 'Event not found'))

  const { title, date, location, description, maxCapacity } = req.body

  if (maxCapacity != null) {
    const capacityNum = Number(maxCapacity)
    if (Number.isNaN(capacityNum) || capacityNum < 0) {
      return next(new HttpError(400, 'maxCapacity must be a non-negative number'))
    }
    if (capacityNum > 0 && capacityNum < event.attendees.length) {
      return next(new HttpError(400, 'maxCapacity cannot be less than current number of attendees'))
    }
    event.maxCapacity = capacityNum
  }

  if (title != null) event.title = title
  if (date != null) event.date = date
  if (location != null) event.location = location
  if (description != null) event.description = description

  res.json(event)
}

exports.deleteEvent = (req, res, next) => {
  const eventId = Number(req.params.id)
  const idx = events.findIndex(e => e.id === eventId)
  if (idx === -1) return next(new HttpError(404, 'Event not found'))

  const [removed] = events.splice(idx, 1)
  res.json(removed)
}
