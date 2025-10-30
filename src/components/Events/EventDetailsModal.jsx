import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  User,
  AlertCircle,
  Share2,
  Copy,
  Loader,
  Users as TeamIcon,
  Hash,
  Plus
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { formatEventDate } from '../../utils/eventUtils'
import { EVENT_TYPE_COLORS } from '../../constants/eventConstants'
import toast from 'react-hot-toast'
import {
  doc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  getDoc,
  arrayUnion
} from 'firebase/firestore'
import { db } from '../../config/firebase'

const getEventTypeColor = (type) => {
  return EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.default
}

const EventDetailsModal = ({ event, isOpen, onClose }) => {
  const { user, signInWithGoogle, isProfileIncomplete, checkProfileCompletion } = useAuth()
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showJoinTeamForm, setShowJoinTeamForm] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamCode, setTeamCode] = useState('')
  const [teamSize, setTeamSize] = useState(2)
  const [loading, setLoading] = useState(false)
  const [userTeam, setUserTeam] = useState(null)

  useEffect(() => {
    if (event && user && isOpen) {
      checkUserTeam()
    }
  }, [event, user, isOpen])

  const checkUserTeam = async () => {
    if (!user || event.type !== 'TEAM') return
    
    try {
      const registrationsRef = collection(db, 'eventRegistrations')
      const q = query(
        registrationsRef,
        where('eventId', '==', event.id),
        where('userId', '==', user.uid)
      )
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const registration = snapshot.docs[0].data()
        setUserTeam({
          teamName: registration.teamName,
          teamCode: registration.teamCode,
          teamSize: registration.teamSize,
          members: registration.members || []
        })
      }
    } catch (error) {
      console.error('Error checking user team:', error)
    }
  }

  const generateTeamCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Ensure we don't collide with an existing team code for the same event
  const generateUniqueTeamCode = async () => {
    const registrationsRef = collection(db, 'eventRegistrations')
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateTeamCode()
      const qCode = query(
        registrationsRef,
        where('eventId', '==', event.id),
        where('teamCode', '==', code)
      )
      const snap = await getDocs(qCode)
      if (snap.empty) return code
    }
    // Fallback if repeated collisions (extremely unlikely)
    return generateTeamCode()
  }

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle()
      // Only show success if the popup path returned a user immediately
      if (result) {
        toast.success('Successfully logged in!')
      }
    } catch (error) {
      // Suppress error toast for user-initiated cancellations
      const code = error?.code || ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return
      }
      toast.error('Failed to login. Please try again.')
    }
  }

  const checkProfileComplete = () => {
    if (isProfileIncomplete) {
      toast.error('Please complete your profile before registering for events')
      return false
    }
    return true
  }

  const handleIndividualRegistration = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    if (!checkProfileComplete()) return

    if (!event.registrationsAvailable) {
      toast.error('Registrations are closed for this event')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'eventRegistrations'), {
        eventId: event.id,
        eventTitle: event.title,
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        registrationType: 'individual',
        status: 'pending',
        registeredAt: serverTimestamp()
      })

      // Update event participant count
      const eventRef = doc(db, 'events', event.id)
      await updateDoc(eventRef, {
        participantCount: (event.participantCount || 0) + 1,
        participants: arrayUnion({
          userId: user.uid,
          name: user.name,
          email: user.email,
          // serverTimestamp is not allowed inside arrays; use client timestamp
          registeredAt: new Date()
        }),
        updatedAt: serverTimestamp()
      })

      toast.success('Successfully registered for the event!')
      onClose()
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }
    if (!teamName.trim()) {
      toast.error('Please enter a team name')
      return
    }

    if (!checkProfileComplete()) return

    if (!event.registrationsAvailable) {
      toast.error('Registrations are closed for this event')
      return
    }

    setLoading(true)
    try {
      const code = await generateUniqueTeamCode()

      await addDoc(collection(db, 'eventRegistrations'), {
        eventId: event.id,
        eventTitle: event.title,
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        registrationType: 'team',
        teamName: teamName.trim(),
        teamCode: code,
        teamSize: teamSize,
        teamLeader: user.uid,
        members: [{
          userId: user.uid,
          name: user.name,
          email: user.email,
          role: 'leader',
          // serverTimestamp is not allowed inside arrays; use client timestamp
          joinedAt: new Date()
        }],
        status: 'pending',
        registeredAt: serverTimestamp()
      })

      toast.success(`Team created! Your team code is: ${code}`)
      setUserTeam({ teamName: teamName.trim(), teamCode: code, members: [] })
      setShowTeamForm(false)
    } catch (error) {
      console.error('Team creation error:', error)
      const message = (error && (error.message || error.code)) ? error.message || error.code : 'Failed to create team. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      toast.error('Please enter a team code')
      return
    }

    if (!checkProfileComplete()) return

    if (!event.registrationsAvailable) {
      toast.error('Registrations are closed for this event')
      return
    }

    setLoading(true)
    try {
      const registrationsRef = collection(db, 'eventRegistrations')
      const q = query(
        registrationsRef,
        where('eventId', '==', event.id),
        where('teamCode', '==', teamCode.trim().toUpperCase())
      )
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        toast.error('Team code not found')
        setLoading(false)
        return
      }

      const teamDoc = snapshot.docs[0]
      const teamData = teamDoc.data()

      // Check if user is already in the team
      const alreadyMember = teamData.members?.some(m => m.userId === user.uid)
      if (alreadyMember) {
        toast.error('You are already a member of this team')
        setLoading(false)
        return
      }

      // Check team size
      if (teamData.members && teamData.members.length >= teamData.teamSize) {
        toast.error('Team is full')
        setLoading(false)
        return
      }

      // Add member to team
      await updateDoc(doc(db, 'eventRegistrations', teamDoc.id), {
        members: arrayUnion({
          userId: user.uid,
          name: user.name,
          email: user.email,
          role: 'member',
          // serverTimestamp is not allowed inside arrays; use client timestamp
          joinedAt: new Date()
        })
      })

      toast.success('Successfully joined the team!')
      setUserTeam({
        teamName: teamData.teamName,
        teamCode: teamData.teamCode,
        teamSize: teamData.teamSize,
        members: [...(teamData.members || []), {
          userId: user.uid,
          name: user.name,
          email: user.email,
          role: 'member',
          joinedAt: new Date()
        }]
      })
      setShowJoinTeamForm(false)
    } catch (error) {
      console.error('Join team error:', error)
      const message = (error && (error.message || error.code)) ? error.message || error.code : 'Failed to join team. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events?event=${event.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: shareUrl
        })
        toast.success('Event shared!')
      } catch (error) {
        if (error.name !== 'AbortError') {
          // User didn't cancel, so there was an error
          copyToClipboard(shareUrl)
        }
      }
    } else {
      copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Event link copied to clipboard!')
  }

  if (!isOpen || !event) return null

  const isTeamEvent = event.type === 'TEAM'
  const isRegistered = userTeam !== null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-40 p-4 overflow-y-auto pt-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto mt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{event.title}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Share Event"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Event Image */}
            <div className="relative h-64 rounded-xl overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r ${getEventTypeColor(event.type)}`}>
                {event.type}
              </div>
              {!event.registrationsAvailable && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium">
                  Registrations Closed
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">{formatEventDate(event.date)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Time</div>
                  <div className="font-medium">{event.time || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium">{event.venue || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Entry Fee</div>
                  <div className="font-medium">₹{event.entryFee || 0}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Brief */}
            {event.brief && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {event.brief}
                </p>
              </div>
            )}

            {/* Organizers */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Organized By</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {event.organizers || 'CSI NMAMIT'}
              </p>
            </div>

            {/* Team Section */}
            {isTeamEvent && user && isRegistered && userTeam && (
              <div className="bg-primary-50 dark:bg-gray-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TeamIcon className="w-5 h-5 text-primary-500" />
                    Your Team
                  </h3>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg">
                    <Hash className="w-4 h-4 text-primary-500" />
                    <span className="font-mono font-semibold">{userTeam.teamCode}</span>
                    <button
                      onClick={() => copyToClipboard(userTeam.teamCode)}
                      className="ml-2 text-primary-500 hover:text-primary-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                  {userTeam.teamName}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {userTeam.members.length} / {userTeam.teamSize} members
                </div>
              </div>
            )}

            {/* Registration Section */}
            {event.registrationsAvailable && (
              <div className="border-t pt-6">
                {!user ? (
                  <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-primary-500 mx-auto" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Please login to register for this event
                    </p>
                    <button onClick={handleLogin} className="btn-primary">
                      Login with Google
                    </button>
                  </div>
                ) : isProfileIncomplete ? (
                  <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Please complete your profile to register for events
                    </p>
                    <button 
                      onClick={() => {
                        onClose()
                        window.location.href = '/profile'
                      }} 
                      className="btn-primary"
                    >
                      Go to Profile
                    </button>
                  </div>
                ) : isTeamEvent && !isRegistered ? (
                  <div className="space-y-4">
                    {!showTeamForm && !showJoinTeamForm && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowTeamForm(true)}
                          className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create Team
                        </button>
                        <button
                          onClick={() => setShowJoinTeamForm(true)}
                          className="flex-1 btn-secondary flex items-center justify-center gap-2"
                        >
                          <TeamIcon className="w-4 h-4" />
                          Join Team
                        </button>
                      </div>
                    )}

                    {showTeamForm && (
                      <div className="bg-primary-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold">Create Your Team</h3>
                        <div>
                          <label className="block text-sm font-medium mb-2">Team Name</label>
                          <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="input-field"
                            placeholder="Enter team name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Team Size</label>
                          <select
                            value={teamSize}
                            onChange={(e) => setTeamSize(parseInt(e.target.value))}
                            className="input-field"
                          >
                            <option value={2}>2 members</option>
                            <option value={3}>3 members</option>
                            <option value={4}>4 members</option>
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleCreateTeam}
                            disabled={loading}
                            className="flex-1 btn-primary"
                          >
                            {loading ? (
                              <Loader className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Create Team'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowTeamForm(false)
                              setTeamName('')
                            }}
                            className="flex-1 btn-secondary"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {showJoinTeamForm && (
                      <div className="bg-primary-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold">Join a Team</h3>
                        <div>
                          <label className="block text-sm font-medium mb-2">Team Code</label>
                          <input
                            type="text"
                            value={teamCode}
                            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                            className="input-field font-mono text-center text-lg"
                            placeholder="XXXXXX"
                            maxLength={6}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleJoinTeam}
                            disabled={loading}
                            className="flex-1 btn-primary"
                          >
                            {loading ? (
                              <Loader className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Join Team'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowJoinTeamForm(false)
                              setTeamCode('')
                            }}
                            className="flex-1 btn-secondary"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : !isTeamEvent ? (
                  <div className="text-center">
                    <button
                      onClick={handleIndividualRegistration}
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? (
                        <Loader className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Register Now
                        </span>
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {!event.registrationsAvailable && (
              <div className="border-t pt-6 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  Registrations are currently closed for this event
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default EventDetailsModal

