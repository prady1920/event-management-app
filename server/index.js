const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const events = [
  { id: 1, title: 'Sample Event', date: new Date().toISOString().slice(0,10), location: 'Online' }
]

app.get('/api/events', (req, res) => {
  res.json(events)
})

app.post('/api/events', (req, res) => {
  const { title, date, location } = req.body
  const newEvent = { id: events.length + 1, title, date: date || new Date().toISOString().slice(0,10), location: location || '' }
  events.push(newEvent)
  res.status(201).json(newEvent)
})

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
