// simple per-event promise-chain lock to serialize mutations per eventId
// Improved to avoid unhandled promise rejections that can crash the Node process.
// We store a wrapper promise in the map that has a rejection handler attached so
// Node won't emit an "unhandledRejection" if the caller doesn't attach a
// handler immediately. We still return the original promise to the caller so
// their await/catch behaviour is preserved.

const eventLocks = new Map()

function withEventLock(eventId, fn) {
  const prev = eventLocks.get(eventId) || Promise.resolve()
  const next = prev.then(() => Promise.resolve().then(fn))

  // wrapper mirrors `next` but ensures we attach a rejection handler so
  // Node doesn't treat the rejection as unhandled if the caller doesn't
  // immediately attach a catch. We also ensure the map entry is deleted
  // when the chain settles.
  let wrapper
  wrapper = next.finally(() => {
    if (eventLocks.get(eventId) === wrapper) eventLocks.delete(eventId)
  })

  // store a promise that has a no-op catch to prevent unhandled rejections
  eventLocks.set(eventId, wrapper.catch(() => {}))

  // return the original `next` so callers still observe the real resolution
  return next
}

module.exports = { withEventLock }