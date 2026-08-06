const eventsController = require('../controllers/eventsController')
const events = require('../models/events')

describe('eventsController.createEvent', () => {
  let req, res, next
  const originalEvents = JSON.parse(JSON.stringify(events))

  beforeEach(() => {
    // clear shared in-memory events array to isolate tests
    events.splice(0, events.length)
    req = { body: {} }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })

  afterAll(() => {
    // restore original events so local dev state isn't lost
    events.splice(0, events.length, ...originalEvents)
  })

  test('creates event with required title and default values', () => {
    req.body = { title: 'Test Event' }

    eventsController.createEvent(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)

    const created = res.json.mock.calls[0][0]
    expect(created).toMatchObject({
      id: 1,
      title: 'Test Event',
      location: '',
      description: '',
      maxCapacity: 0,
      attendees: []
    })

    // date default uses YYYY-MM-DD of today
    expect(created.date).toBe(new Date().toISOString().slice(0, 10))
    expect(events.length).toBe(1)
  })

  test('converts string maxCapacity to number', () => {
    req.body = { title: 'Capacity Event', maxCapacity: '5' }

    eventsController.createEvent(req, res, next)

    const created = res.json.mock.calls[0][0]
    expect(created.maxCapacity).toBe(5)
    expect(typeof created.maxCapacity).toBe('number')
  })

  test('missing title calls next with 400 HttpError', () => {
    req.body = {}

    eventsController.createEvent(req, res, next)

    expect(next).toHaveBeenCalled()
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/title is required/i)
  })
})
