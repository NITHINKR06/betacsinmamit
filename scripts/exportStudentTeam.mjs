#!/usr/bin/env node
// Export Firestore core members to src/data/teamData.json (studentTeamData only)

import fs from 'fs'
import path from 'path'
import url from 'url'
import admin from 'firebase-admin'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function log(msg) {
  process.stdout.write(`${msg}\n`)
}

async function initFirebaseAdmin() {
  // Initialize using Application Default Credentials or service account JSON
  // Preferred: set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      })
    } catch (e) {
      throw new Error('Failed to initialize Firebase Admin. Ensure GOOGLE_APPLICATION_CREDENTIALS is set to a valid service account JSON file.')
    }
  }
  return admin.firestore()
}

function getUserRole(data) {
  return (
    data?.profile?.role ||
    data?.roleDetails?.position ||
    data?.role ||
    'Member'
  )
}

function sortMembersByRole(members) {
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
  return [...members].sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99))
}

async function fetchCoreMembers(db) {
  const snapshot = await db.collection('users').get()
  const members = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (data?.role === 'coreMember' || data?.isCoreMember === true) {
      members.push({ id: doc.id, ...data })
    }
  })
  return members
}

function mapToStudentTeamFormat(users) {
  const mapped = users.map((data) => ({
    name: data.name || 'Unknown',
    role: getUserRole(data),
    branch: data.profile?.branch || '',
    year: data.profile?.year || '',
    linkedin: data.profile?.linkedin || '#',
    github: data.profile?.github || '#',
    imageSrc: data.photoURL || '/default-avatar.png',
    skills: Array.isArray(data.profile?.skills) ? data.profile.skills : []
  }))
  const sorted = sortMembersByRole(mapped)
  // Assign order sequentially after sorting
  return sorted.map((m, idx) => ({ ...m, order: idx + 1 }))
}

function readTeamDataJson(projectRoot) {
  const filePath = path.join(projectRoot, 'src', 'data', 'teamData.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  return { filePath, json: JSON.parse(raw) }
}

function writeTeamDataJson(filePath, json) {
  const pretty = JSON.stringify(json, null, 2) + '\n'
  fs.writeFileSync(filePath, pretty, 'utf-8')
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..')
  log('Initializing Firebase Admin...')
  const db = await initFirebaseAdmin()

  log('Fetching core members from Firestore...')
  const coreUsers = await fetchCoreMembers(db)
  log(`Fetched ${coreUsers.length} core members`)

  log('Transforming to studentTeamData format...')
  const studentTeamData = mapToStudentTeamFormat(coreUsers)

  log('Reading existing teamData.json...')
  const { filePath, json } = readTeamDataJson(projectRoot)

  const updated = { ...json, studentTeamData }
  log(`Writing ${studentTeamData.length} members to ${path.relative(projectRoot, filePath)}...`)
  writeTeamDataJson(filePath, updated)
  log('Done.')
}

main().catch((err) => {
  console.error('Export failed:', err?.message || err)
  process.exit(1)
})


