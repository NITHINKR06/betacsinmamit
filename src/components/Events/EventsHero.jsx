import { motion } from 'framer-motion'

const EventsHero = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 animated-bg opacity-10" />
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="heading-1 mb-4">
            Our <span className="gradient-text-animated">Events</span>
          </h1>
        </motion.div>
      </div>
    </section>
  )
}

export default EventsHero
