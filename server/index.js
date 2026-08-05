const express = require('express')
const cors = require('cors')
const eventsRouter = require('./routes/events')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/events', eventsRouter)

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// error handler
app.use((err, req, res, next) => {
  console.error(err)
  if (res.headersSent) return next(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
