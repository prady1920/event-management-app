import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// thunk to fetch events from backend
export const fetchEvents = createAsyncThunk('events/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch('http://localhost:5000/api/events')
    if (!res.ok) {
      const text = await res.text()
      return rejectWithValue(text || 'Failed to fetch events')
    }
    const data = await res.json()
    return data
  } catch (err) {
    return rejectWithValue(err.message || 'Network error')
  }
})

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {
    addOptimistic(state, action) {
      // action.payload should be the temp event object (with temp id)
      state.items.push(action.payload)
    },
    replaceEvent(state, action) {
      // action.payload: { tempId, event }
      const { tempId, event } = action.payload
      state.items = state.items.map(ev => (ev.id === tempId ? event : ev))
    },
    removeEvent(state, action) {
      // action.payload: id to remove
      state.items = state.items.filter(ev => ev.id !== action.payload)
    },
    setEvents(state, action) {
      state.items = action.payload
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchEvents.pending, state => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || action.error.message
      })
  }
})

export const { addOptimistic, replaceEvent, removeEvent, setEvents } = eventsSlice.actions
export default eventsSlice.reducer
