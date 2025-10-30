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

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group -mt-10 cursor-pointer"
      onClick={handleClick}
    >
      <div className="h-full glass-card rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        {/* Event Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Event Type Badge */}
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r ${getEventTypeColor(event.type)}`}>
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </div>
          
          {/* Status Badge */}
          {event.status === 'upcoming' && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
              Upcoming
            </div>
          )}
        </div>

        {/* Event Name Only */}
        <div className="p-6">
          <h3 className="text-xl font-bold group-hover:text-primary-500 transition-colors text-center">
            {event.title}
          </h3>
        </div>
      </div>
    </motion.div>
  )
}

export default EventCard
