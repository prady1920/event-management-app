// simple per-event promise-chain lock to serialize mutations per eventId
const eventLocks = new Map()

function withEventLock(eventId, fn) {
  const prev = eventLocks.get(eventId) || Promise.resolve()
  const next = prev.then(() => Promise.resolve().then(fn))
  eventLocks.set(
    eventId,
    next.finally(() => {
      if (eventLocks.get(eventId) === next) eventLocks.delete(eventId)
    })
  )
  return next
}

module.exports = { withEventLock }
