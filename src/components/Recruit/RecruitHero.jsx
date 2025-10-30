import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, Zap } from 'lucide-react'

const RecruitHero = () => {
  const { user } = useAuth()
  
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-cyber-blue/20 to-primary-500/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500/20 to-cyber-blue/20 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-primary-500/30"
          >
            <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" />
            <span className="text-sm font-semibold text-primary-500">EXECUTIVE MEMBERSHIP</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-100 to-cyber-blue leading-tight"
          >
            Join CSI NMAMIT
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 font-light"
          >
            Become part of India's leading tech community
          </motion.p>
          
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 mb-6 border border-white/20 shadow-xl"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-cyber-blue flex items-center justify-center">
                <span className="text-white text-lg">👋</span>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">Welcome back</div>
                <div className="font-semibold text-white">{user.name}</div>
              </div>
            </motion.div>
          )}
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center items-center gap-8 mt-12"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 backdrop-blur-sm flex items-center justify-center border border-primary-500/30">
                <TrendingUp className="w-6 h-6 text-primary-400" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-xs text-gray-400">Members</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyber-blue/20 backdrop-blur-sm flex items-center justify-center border border-cyber-blue/30">
                <Zap className="w-6 h-6 text-cyber-blue" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-xs text-gray-400">Events/Year</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default RecruitHero
