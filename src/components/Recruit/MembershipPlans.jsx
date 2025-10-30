import { motion } from 'framer-motion'
import { CheckCircle, Check } from 'lucide-react'
import { membershipPlans } from '../../data/membershipData'

const MembershipPlans = ({ selectedPlan, setSelectedPlan }) => {
  return (
    <section className="container-custom mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Select Your <span className="gradient-text">Membership Duration</span>
        </h2>
        <p className="text-gray-400 text-lg">Choose the plan that works best for you</p>
      </motion.div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {membershipPlans.map((plan, index) => {
          const totalPrice = plan.basePrice + plan.platformFee
          const isSelected = selectedPlan === plan.id
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer group transition-all duration-300 ${
                isSelected
                  ? 'transform scale-105'
                  : ''
              }`}
            >
              {/* Card */}
              <div className={`
                relative h-full rounded-3xl p-8 transition-all duration-300
                ${isSelected 
                  ? 'bg-gradient-to-br from-primary-600/20 to-cyber-blue/20 border-2 border-primary-500 shadow-2xl shadow-primary-500/20' 
                  : 'bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary-500/50 hover:bg-white/10'
                }
              `}>
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-500 to-cyber-blue text-white text-xs font-bold shadow-lg">
                    ⭐ Most Popular
                  </div>
                )}
                
                {/* Check Badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-cyber-blue flex items-center justify-center shadow-lg z-10"
                  >
                    <CheckCircle className="w-6 h-6 text-white" />
                  </motion.div>
                )}
                
                {/* Content */}
                <div className="text-center pt-2">
                  <h3 className="text-2xl font-bold mb-6 text-white">{plan.name}</h3>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyber-blue mb-2">
                      ₹{totalPrice}
                    </div>
                    <div className="text-sm text-gray-400">
                      ₹{plan.basePrice} + ₹{plan.platformFee} fee
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isSelected ? 1 : 0 }}
                    className="flex items-center justify-center gap-2 text-green-400 font-semibold"
                  >
                    <Check className="w-5 h-5" />
                    <span>Selected</span>
                  </motion.div>
                </div>
              </div>
              
              {/* Glow Effect */}
              {isSelected && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/20 to-cyber-blue/20 blur-xl -z-10 opacity-50" />
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default MembershipPlans
