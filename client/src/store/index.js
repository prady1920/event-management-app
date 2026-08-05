import { configureStore } from '@reduxjs/toolkit'
import eventsReducer from './eventsSlice'

const store = configureStore({
  reducer: {
    events: eventsReducer
  }
})

export default store
