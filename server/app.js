const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const eventsRouter = require('./routes/events')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// Security and middleware
app.use(helmet())
app.use(cors({ origin: true })) // consider restricting origin in production
app.use(morgan('tiny'))
app.use(express.json())

// Routes
app.use('/api/events', eventsRouter)

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' })
})

// Central error handler
app.use(errorHandler)

module.exports = app
