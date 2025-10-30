import { motion } from 'framer-motion'
import { Users, Calendar, Award, Zap } from 'lucide-react'
import { membershipBenefits } from '../../data/membershipData'

const iconMap = {
  Users,
  Calendar,
  Award,
  Zap
}

const BenefitsSection = () => {
  return (
    <section className="container-custom mb-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-4xl font-bold mb-12 text-center">
          Why Join <span className="gradient-text">CSI NMAMIT?</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {membershipBenefits.map((benefit, index) => {
            const Icon = iconMap[benefit.icon]
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div className="h-full bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-primary-500/50 transition-all hover:bg-white/10 cursor-pointer">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyber-blue/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary-500/30">
                    <Icon className="w-8 h-8 text-primary-400 group-hover:text-primary-300 transition-colors" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-center text-white">{benefit.title}</h3>
                  <p className="text-sm text-gray-400 text-center leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}

export default BenefitsSection
