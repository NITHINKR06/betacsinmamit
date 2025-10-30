import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { CORE_MEMBERS } from '../constants/coreMembers'
import teamData from '../data/teamData.json'

/**
 * Get role from CORE_MEMBERS constant or Firestore data
 * @param {Object} data - User data from Firestore
 * @returns {string} User's role
 */
const getUserRole = (data) => {
  // First, check if the email exists in CORE_MEMBERS constant
  const email = data.email?.toLowerCase()
  if (email && CORE_MEMBERS[email]) {
    return CORE_MEMBERS[email].role
  }
  
  // Fallback to Firestore data
  return data.profile?.role || data.roleDetails?.position || 'Member'
}

/**
 * Fetch all core members from Firestore
 * @returns {Promise<Array>} Array of core member profiles
 */
export const fetchCoreMembers = async () => {
  try {
    // Try to fetch from Firestore first (only if db is available)
    if (db) {
      try {
        const usersRef = collection(db, 'users')
        
        // Fetch all users and filter for core members
        const allUsersSnapshot = await getDocs(usersRef)
        const coreMembersData = []
        
        allUsersSnapshot.forEach((doc) => {
          const data = doc.data()
          // Check if user is a core member either by Firestore role or email in CORE_MEMBERS
          const email = data.email?.toLowerCase()
          const isInCoreMembers = email && CORE_MEMBERS[email]
          
          // Include user if they are marked as core member OR their email is in CORE_MEMBERS
          if (data.role === 'coreMember' || data.isCoreMember === true || isInCoreMembers) {
            // If email is in CORE_MEMBERS but Firestore doesn't have the role, use CORE_MEMBERS data
            let memberData = { id: doc.id, ...data }
            
            // Ensure we have the correct role from CORE_MEMBERS if available
            if (isInCoreMembers) {
              memberData.role = 'coreMember'
              memberData.isCoreMember = true
              memberData.roleDetails = memberData.roleDetails || {
                position: CORE_MEMBERS[email].role,
                permissions: CORE_MEMBERS[email].permissions,
                level: CORE_MEMBERS[email].level
              }
            }
            
            coreMembersData.push(memberData)
          }
        })
        
        // If we found core members in Firestore, process and return them
        if (coreMembersData.length > 0) {
          const members = coreMembersData.map(data => ({
            id: data.id,
            name: data.name || 'Unknown',
            role: getUserRole(data),
            usn: data.profile?.usn || data.usn || '',
            branch: data.profile?.branch || '',
            year: data.profile?.year || '',
            linkedin: data.profile?.linkedin || '#',
            github: data.profile?.github || '#',
            imageSrc: data.photoURL || '/default-avatar.png',
            skills: data.profile?.skills || [],
            bio: data.profile?.bio || '',
            phone: data.profile?.phone || '',
            email: data.email || '',
            isCoreMember: true,
            ...data
          }))
          
          return sortMembersByRole(members)
        }
      } catch (firestoreError) {
        console.warn('Firestore not available, using fallback data:', firestoreError.message)
      }
    }
    
    // If Firestore fails or no data found, use teamData.json as primary source
    console.log('Using teamData.json as data source')
    const studentData = teamData.studentTeamData || []
    // Add id field and sort by order if available, otherwise by role
    return studentData.map((member, index) => ({
      ...member,
      id: member.id || `student-${index}`
    })).sort((a, b) => {
      if (a.order && b.order) return a.order - b.order
      return sortMembersByRole([a, b])
    })
  } catch (error) {
    console.error('Error in fetchCoreMembers:', error)
    
    // Final fallback to JSON data
    try {
      console.log('Using static fallback data from teamData.json')
      return teamData.studentTeamData || []
    } catch (importError) {
      console.error('Failed to use fallback JSON data:', importError)
      
      // Return empty array as last resort
      return []
    }
  }
}

/**
 * Fetch all members (core and non-core) from Firestore
 * Publicly readable for the Team page without authentication
 */
export const fetchAllMembers = async () => {
  try {
    if (db) {
      try {
        const usersRef = collection(db, 'users')
        const allUsersSnapshot = await getDocs(usersRef)
        const allMembers = []
        allUsersSnapshot.forEach((docSnap) => {
          const data = docSnap.data()
          const member = {
            id: docSnap.id,
            name: data.name || 'Unknown',
            role: getUserRole(data),
            usn: data.profile?.usn || data.usn || '',
            branch: data.profile?.branch || '',
            year: data.profile?.year || '',
            linkedin: data.profile?.linkedin || '#',
            github: data.profile?.github || '#',
            imageSrc: data.photoURL || '/default-avatar.png',
            skills: data.profile?.skills || [],
            bio: data.profile?.bio || '',
            phone: data.profile?.phone || '',
            email: data.email || '',
            isCoreMember: data.role === 'coreMember' || data.isCoreMember === true || false,
            ...data
          }
          allMembers.push(member)
        })
        if (allMembers.length > 0) {
          return sortMembersByRole(allMembers)
        }
      } catch (firestoreError) {
        console.warn('Firestore not available, using fallback data:', firestoreError.message)
      }
    }

    // Fallback to static team data
    const studentData = teamData.studentTeamData || []
    return studentData.map((member, index) => ({
      ...member,
      id: member.id || `student-${index}`
    })).sort((a, b) => {
      if (a.order && b.order) return a.order - b.order
      return sortMembersByRole([a, b])
    })
  } catch (error) {
    console.error('Error in fetchAllMembers:', error)
    try {
      return teamData.studentTeamData || []
    } catch {
      return []
    }
  }
}

/**
 * Sort members by role hierarchy
 * @param {Array} members - Array of team members
 * @returns {Array} Sorted array of team members
 */
const sortMembersByRole = (members) => {
  const roleOrder = {
    'President': 1,
    'Vice President': 2,
    'Secretary': 3,
    'Joint Secretary': 4,
    'Treasurer': 5,
    'Program Committee Head': 6,
    'Program Committee Co-head': 7,
    'Technical Lead': 8,
    'Technical (Lead)': 8,
    'Technical Team': 9,
    'Graphics Lead': 10,
    'Graphics Team': 11,
    'Graphics': 11,
    'Social Media Lead': 12,
    'Social Media': 13,
    'Publicity Lead': 14,
    'Publicity Core Team': 15,
    'Publicity (Lead)': 14,
    'Publicity Team': 16,
    'Publicity': 16,
    'Event Management Lead': 17,
    'Event Management': 18,
    'MC Committee': 19,
    'Member': 99
  }
  
  return members.sort((a, b) => {
    const orderA = roleOrder[a.role] || 99
    const orderB = roleOrder[b.role] || 99
    return orderA - orderB
  })
}

/**
 * Fetch faculty members
 * For now, returns static data as faculty are not in Firestore
 * @returns {Promise<Array>} Array of faculty profiles
 */
export const fetchFacultyMembers = async () => {
  try {
    // You can implement Firestore fetch for faculty if needed
    // For now, return static data
    console.log('Using static faculty data from teamData.json')
    return teamData.facultyData
  } catch (error) {
    console.error('Error fetching faculty members:', error)
    return []
  }
}

/**
 * Transform Firestore user data to team member format
 * @param {Object} userData - Raw user data from Firestore
 * @returns {Object} Formatted team member object
 */
export const transformUserToTeamMember = (userData) => {
  return {
    id: userData.uid,
    name: userData.name || 'Unknown',
    role: getUserRole(userData), // Use the helper function to get role
    usn: userData.profile?.usn || userData.usn || '',
    branch: userData.profile?.branch || '',
    year: userData.profile?.year || '',
    linkedin: userData.profile?.linkedin || '#',
    github: userData.profile?.github || '#',
    imageSrc: userData.photoURL || '/default-avatar.png',
    skills: userData.profile?.skills || [],
    bio: userData.profile?.bio || '',
    email: userData.email || '',
    isCoreMember: userData.role === 'coreMember' || userData.isCoreMember || false
  }
}

/**
 * Check if a user has updated their profile
 * @param {Object} member - Team member object
 * @returns {boolean} True if profile is complete
 */
export const isProfileComplete = (member) => {
  return !!(
    member.photoURL && 
    member.photoURL !== '/default-avatar.png' &&
    member.profile?.branch &&
    member.profile?.year &&
    (member.profile?.linkedin || member.profile?.github)
  )
}
