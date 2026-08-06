const addEvent = require('../lib/addEvent')

describe('addEvent', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete global.fetch
  })

  it('posts the event body and returns the created event on success', async () => {
    const created = { id: 123, title: 'My Test Event' }
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => created
    })

    const body = { title: 'My Test Event' }
    const res = await addEvent(body)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/events', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }))
    expect(res).toEqual(created)
  })

  it('throws with server text when response is not ok', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      text: async () => 'bad request'
    })

    await expect(addEvent({ title: 'x' })).rejects.toThrow('bad request')
  })
})
