const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/eventsController')

router.get('/', ctrl.getEvents)
router.post('/', ctrl.createEvent)

router.post('/:id/register', ctrl.registerAttendee)
router.get('/:id/attendees', ctrl.listAttendees)
router.delete('/:id/attendees/:attendeeId', ctrl.unregisterById)
router.delete('/:id/attendees', ctrl.unregisterByEmail)

router.put('/:id', ctrl.updateEvent)
router.delete('/:id', ctrl.deleteEvent)

module.exports = router
