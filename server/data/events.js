const events = [
  { id: 1, title: 'Sample Event', date: new Date().toISOString().slice(0,10), location: 'Online', description: 'Sample Event', maxCapacity: 5, attendees: []},
  { id: 2, title: 'Event 2', date: new Date().toISOString().slice(0,10), location: 'Delhi', description: 'AI event', maxCapacity: 20, attendees: []},
  { id: 3, title: 'Event 3', date: new Date().toISOString().slice(0,10), location: 'Mumbai', description: 'Cloud Event', maxCapacity: 10, attendees: []}
]

module.exports = events
