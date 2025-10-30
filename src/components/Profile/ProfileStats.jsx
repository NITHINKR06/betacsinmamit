import { useMemo } from 'react'
import { Trophy, FileText, Award } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ProfileStats = () => {
  const { user } = useAuth()

  const { eventsCount, certificatesCount, awardsCount } = useMemo(() => {
    const eventsCount = (user?.events && Array.isArray(user.events) && user.events.length) ||
      (user?.participation && Array.isArray(user.participation) && user.participation.length) || 0

    const certificatesCount = (user?.certificates && Array.isArray(user.certificates) && user.certificates.length) || 0

    const awardsCount = (user?.awards && Array.isArray(user.awards) && user.awards.length) || 0

    return { eventsCount, certificatesCount, awardsCount }
  }, [user])

  const stats = [
    { icon: Trophy, value: eventsCount, label: 'Events', color: 'text-yellow-500' },
    { icon: FileText, value: certificatesCount, label: 'Certificates', color: 'text-blue-500' },
    { icon: Award, value: awardsCount, label: 'Awards', color: 'text-purple-500' }
  ]

  return (
    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
      {stats.map((stat) => (
        <div key={stat.label}>
          <stat.icon className={`w-6 h-6 mx-auto mb-1 ${stat.color}`} />
          <div className="text-xl font-bold">{stat.value}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export default ProfileStats
