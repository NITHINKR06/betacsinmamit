import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Mail, 
  Key, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Clock,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminLogin = () => {
  const navigate = useNavigate()
  const { 
    adminUser,
    authLoading,
    signInAdminWithGoogle,
    pendingAdmin,
    otpSent,
    verifyOTP,
    resendOTP
  } = useAdminAuth()

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [checkingRedirect, setCheckingRedirect] = useState(true)
  const maxAttempts = 3

  // Check for redirect result on mount
  useEffect(() => {
    // Give some time for redirect result to be processed
    const timer = setTimeout(() => {
      setCheckingRedirect(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (adminUser) {
      navigate('/admin/dashboard')
    }
  }, [adminUser, navigate])

  useEffect(() => {
    if (otpSent && resendTimer === 0) {
      setResendTimer(60)
    }
  }, [otpSent])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      await signInAdminWithGoogle()
    } catch (error) {
      // console.error('Sign in error:', error)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const next = [...otp]
      next[index] = value
      setOtp(next)
      if (value && index < 5) {
        const el = document.getElementById(`otp-${index + 1}`)
        el && el.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      prev && prev.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pasted)) {
      const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
      setOtp(next)
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      toast.error('Please enter complete OTP')
      return
    }
    if (attempts >= maxAttempts) {
      toast.error('Maximum attempts exceeded. Refresh and try again.')
      return
    }
    setAttempts(attempts + 1)
    const ok = await verifyOTP(code)
    if (!ok) {
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    const ok = await resendOTP()
    if (ok) {
      setResendTimer(60)
      setOtp(['', '', '', '', '', ''])
    }
  }

  // OTP removed

  // OTP removed

  // Show loading while checking for redirect result
  if (checkingRedirect && !pendingAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#ddd] rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#417690] text-white p-4">
              <h1 className="text-lg font-normal">CSI NMAMIT administration</h1>
            </div>
            <div className="p-6 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#417690] mb-4" />
              <p className="text-[#333]">Checking authentication status...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Django-style Login Box */}
        <div className="bg-white border border-[#ddd] rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#417690] text-white p-4">
            <h1 className="text-lg font-normal">CSI NMAMIT administration</h1>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {!pendingAdmin ? (
                // Step 1: Google Sign In
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-xl font-normal text-[#333] mb-6">Admin Login</h2>
                  
                  <div className="mb-6">
                    <div className="bg-[#d1ecf1] border border-[#bee5eb] rounded p-3 text-sm text-[#0c5460]">
                      <AlertCircle className="inline w-4 h-4 mr-2" />
                      Only authorized administrators can access this area
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white border border-[#ddd] rounded hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-[#417690]" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-[#333]">Sign in with Google</span>
                      </>
                    )}
                  </button>

                  <div className="mt-6 text-center"></div>
                </motion.div>
              ) : (
                // Step 2: OTP Verification
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-xl font-normal text-[#333] mb-6">Verify OTP</h2>

                  <div className="mb-4 p-3 bg-[#fff3cd] border border-[#ffeeba] rounded">
                    <Clock className="inline w-4 h-4 mr-2 text-[#856404]" />
                    We sent a 6-digit code to <span className="font-medium">{pendingAdmin?.email}</span>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#333] mb-2">Enter 6-digit OTP</label>
                    <div className="flex justify-between space-x-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          className="w-12 h-12 text-center text-lg font-semibold border border-[#ddd] rounded focus:border-[#417690] focus:ring-1 focus:ring-[#417690]"
                          disabled={authLoading}
                        />
                      ))}
                    </div>
                  </div>

                  {attempts > 0 && (
                    <div className="mb-4 p-3 bg-[#fff3cd] border border-[#ffeeba] rounded text-sm">
                      <AlertCircle className="inline w-4 h-4 mr-2" />
                      {maxAttempts - attempts} attempt{maxAttempts - attempts !== 1 ? 's' : ''} remaining
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={handleResend}
                      disabled={resendTimer > 0 || authLoading}
                      className={`text-sm ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#417690] hover:text-[#205067]'} flex items-center space-x-1`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}</span>
                    </button>
                    <span className="text-xs text-[#666]">Valid for 10 minutes</span>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={authLoading || otp.join('').length !== 6}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#417690] text-white rounded hover:bg-[#205067] disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5" />
                        <span>Verify & Access</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Secure admin access with two-factor authentication
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
