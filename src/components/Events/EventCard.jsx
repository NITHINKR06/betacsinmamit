import { motion } from 'framer-motion'
import { EVENT_TYPE_COLORS } from '../../constants/eventConstants'

const getEventTypeColor = (type) => {
  return EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.default
}

const EventCard = ({ event, index, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(event)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="h-full rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300 p-4">
        {/* Poster */}
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-96 object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>

        {/* Meta */}
        <div className="px-2 pt-5 pb-3">
          {event.type && (
            <div className="w-full flex justify-center mb-3">
              <span className={`px-3 py-1 rounded-full text-[10px] tracking-wider font-semibold uppercase bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300`}> 
                {event.type}
              </span>
            </div>
          )}
          <h3 className="text-lg md:text-xl font-bold text-center text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
            {event.title}
          </h3>
          {(event.date || event.time) && (
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {formatDate(event.date)}{event.time ? ` • ${event.time}` : ''}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default EventCard
