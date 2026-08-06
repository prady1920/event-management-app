// simple helper to POST a new event to the API
// kept as a small CommonJS module so it can be tested by Jest without extra transform
function addEvent(eventBody) {
  return fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventBody)
  }).then(async res => {
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Server error')
    }
    return res.json()
  })
}

module.exports = addEvent
