import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { mockEvents } from '../data/eventsData'
import { filterEvents } from '../utils/eventUtils'

/**
 * Custom hook for managing events data and filtering
 */
export const useEvents = (initialYear = '2024') => {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Load events based on selected year
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch from Firestore. Do not rely on fields that may be missing
        // like `year` or `published`. We'll derive year client-side and only
        // exclude unpublished items when the field explicitly says false.
        const eventsRef = collection(db, 'events')

        let eventsData = []
        try {
          // Prefer ordering by createdAt if an index exists
          const orderedQuery = query(eventsRef, orderBy('createdAt', 'desc'))
          const snapshot = await getDocs(orderedQuery)
          eventsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        } catch (firestoreOrderError) {
          // Fall back to an unordered fetch if orderBy requires an index
          const snapshot = await getDocs(eventsRef)
          eventsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          // Manual sort by best-effort timestamp
          eventsData.sort((a, b) => {
            const getTime = (x) => {
              const fromCreated = x?.createdAt ? new Date(x.createdAt).getTime() : undefined
              const fromDate = x?.date ? new Date(x.date).getTime() : undefined
              return (Number.isFinite(fromCreated) ? fromCreated : -Infinity) || (Number.isFinite(fromDate) ? fromDate : -Infinity)
            }
            return getTime(b) - getTime(a)
          })
        }

        // Filter out explicitly unpublished docs only
        const visibleEvents = eventsData.filter(e => e.published !== false)

        // Derive year from fields and filter by selected year
        const deriveYear = (e) => {
          if (e.year) return parseInt(e.year)
          if (typeof e.date === 'string') {
            // support values like '2019' or ISO "2025-08-03..."
            const yearPart = e.date.slice(0, 4)
            const y = parseInt(yearPart)
            if (!Number.isNaN(y)) return y
          }
          if (e.createdAt) {
            const y = new Date(e.createdAt).getFullYear()
            if (Number.isFinite(y)) return y
          }
          return undefined
        }

        const yearInt = parseInt(selectedYear)
        const filteredByYear = visibleEvents.filter(e => deriveYear(e) === yearInt)

        setEvents(filteredByYear)
        setFilteredEvents(filteredByYear)
        
        // If no events in Firestore, fallback to mock data
        if (filteredByYear.length === 0 && mockEvents[selectedYear]) {
          // console.log('No events in Firestore, using mock data')
          const yearEvents = mockEvents[selectedYear] || []
          setEvents(yearEvents)
          setFilteredEvents(yearEvents)
        }
      } catch (err) {
        // console.error('Error loading events:', err)
        setError('Failed to load events')
        
        // Fallback to mock data on error
        const yearEvents = mockEvents[selectedYear] || []
        setEvents(yearEvents)
        setFilteredEvents(yearEvents)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [selectedYear])

  // Filter events when search term or type changes
  useEffect(() => {
    const filtered = filterEvents(events, searchTerm, selectedType)
    setFilteredEvents(filtered)
  }, [searchTerm, selectedType, events])

  return {
    events,
    filteredEvents,
    loading,
    error,
    selectedYear,
    setSelectedYear,
    selectedType,
    setSelectedType,
    searchTerm,
    setSearchTerm
  }
}
