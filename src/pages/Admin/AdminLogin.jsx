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
  User,
  WifiOff,
  ShieldOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import firestoreFallback from '../../utils/firestoreFallback'

const AdminLogin = () => {
  const navigate = useNavigate()
  const {
    adminUser,
    authLoading,
    signInAdminWithGoogle,
    pendingAdmin,
    tokenSent,
    verifyAdminToken,
    resendAdminToken
  } = useAdminAuth()

  // Replace OTP state with admin token state
  const [adminToken, setAdminToken] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [checkingRedirect, setCheckingRedirect] = useState(true)
  const [blockingDetected, setBlockingDetected] = useState(false)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const maxAttempts = 3

  // Check for redirect result on mount and detect blocking
  useEffect(() => {
    // Check if we're returning from an OAuth redirect
    const urlParams = new URLSearchParams(window.location.search)
    const isReturningFromAuth = urlParams.has('code') || urlParams.has('state') ||
                                window.location.hash.includes('access_token')

    // If we have a stored pending admin or returning from auth, wait longer
    const storedPending = sessionStorage.getItem('pendingAdmin')
    const authInitiated = sessionStorage.getItem('authRedirectInitiated')

    const waitTime = (isReturningFromAuth || storedPending || authInitiated) ? 3000 : 1500

    const timer = setTimeout(async () => {
      setCheckingRedirect(false)
      // Clean up the auth initiated flag
      if (authInitiated && !isReturningFromAuth) {
        sessionStorage.removeItem('authRedirectInitiated')
      }

      // Check for blocking extensions
      const blockingInfo = await firestoreFallback.detectBlockingExtensions()
      if (blockingInfo.hasBlocker) {
        setBlockingDetected(true)
        console.warn('Ad blocker or network blocking detected')
      }
    }, waitTime)

    return () => clearTimeout(timer)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (adminUser) {
      navigate('/admin/dashboard')
    }
  }, [adminUser, navigate])

  useEffect(() => {
    if (tokenSent && resendTimer === 0) {
      setResendTimer(60)
    }
  }, [tokenSent])

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

  // Replace handleOtpChange, handleKeyDown, handlePaste with a single handler
  const handleTokenInput = (e) => {
    setAdminToken(e.target.value)
  }

  const handleVerify = async () => {
    if (!adminToken || adminToken.length < 6) {
      toast.error('Please enter the full admin login token')
      return
    }
    if (attempts >= maxAttempts) {
      toast.error('Maximum attempts exceeded. Refresh and try again.')
      return
    }
    setAttempts(attempts + 1)
    const ok = await verifyAdminToken(adminToken)
    if (!ok) {
      setAdminToken('')
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    const ok = await resendAdminToken()
    if (ok) {
      setResendTimer(60)
      setAdminToken('')
    }
  }

  // Show loading while checking for redirect result or if auth is in progress
  if ((checkingRedirect || authLoading) && !pendingAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#417690] dark:bg-gray-800 text-white p-4">
              <h1 className="text-lg font-normal">CSI NMAMIT administration</h1>
            </div>
            <div className="p-6 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#417690] mb-4" />
              <p className="text-[#333] dark:text-gray-200 text-center">
                {authLoading ? 'Processing authentication...' : 'Checking authentication status...'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Django-style Login Box */}
        <div className="bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#417690] dark:bg-gray-800 text-white p-4">
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
                  <h2 className="text-xl font-normal text-[#333] dark:text-gray-200 mb-6">Admin Login</h2>

                  <div className="mb-6 space-y-3">
                    <div className="bg-[#d1ecf1] border border-[#bee5eb] dark:bg-cyan-900/30 dark:border-cyan-900 rounded p-3 text-sm text-[#0c5460] dark:text-cyan-200">
                      <AlertCircle className="inline w-4 h-4 mr-2" />
                      Only authorized administrators can access this area
                    </div>

                    {blockingDetected && (
                      <div className="bg-[#fff3cd] border border-[#ffeeba] dark:bg-amber-900/30 dark:border-amber-900 rounded p-3 text-sm text-[#856404] dark:text-amber-200">
                        <ShieldOff className="inline w-4 h-4 mr-2" />
                        <span className="font-medium">Ad blocker detected!</span>
                        <button
                          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                          className="ml-2 text-[#0066cc] dark:text-blue-400 hover:underline"
                        >
                          {showTroubleshooting ? 'Hide' : 'Show'} troubleshooting
                        </button>
                      </div>
                    )}

                    {showTroubleshooting && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#f8f9fa] border border-[#dee2e6] dark:bg-gray-800 dark:border-gray-700 rounded p-3 text-sm"
                      >
                        <p className="font-medium mb-2">To fix authentication issues:</p>
                        <ol className="list-decimal list-inside space-y-1 text-[#495057] dark:text-gray-300">
                          <li>Disable ad blockers (AdBlock, uBlock, etc.) for this site</li>
                          <li>Add this site to your ad blocker's whitelist</li>
                          <li>Check if browser shields/protection is blocking requests</li>
                          <li>Try using incognito/private mode</li>
                          <li>Disable VPN or proxy if using one</li>
                          <li>Clear browser cache and cookies</li>
                        </ol>
                      </motion.div>
                    )}

                    {!navigator.onLine && (
                      <div className="bg-[#f8d7da] border border-[#f5c6cb] dark:bg-rose-900/30 dark:border-rose-900 rounded p-3 text-sm text-[#721c24] dark:text-rose-200">
                        <WifiOff className="inline w-4 h-4 mr-2" />
                        No internet connection detected
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded hover:bg-[#f5f5f5] dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span className="text-[#333] dark:text-gray-200">Sign in with Google</span>
                      </>
                    )}
                  </button>

                  <div className="mt-6 text-center"></div>
                </motion.div>
              ) : (
                // Step 2: Token Verification
                <motion.div
                  key="token"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-xl font-normal text-[#333] dark:text-gray-200 mb-6">Admin Login Token</h2>

                  <div className="mb-4 space-y-3">
                    <div className="p-3 bg-[#fff3cd] border border-[#ffeeba] dark:bg-amber-900/30 dark:border-amber-900 rounded">
                      <Clock className="inline w-4 h-4 mr-2 text-[#856404] dark:text-amber-200" />
                      <span className="dark:text-amber-100">We sent your admin login token to </span><span className="font-medium">{pendingAdmin?.email}</span>
                    </div>
                    {blockingDetected && (
                      <div className="p-3 bg-[#fff3cd] border border-[#ffeeba] dark:bg-amber-900/30 dark:border-amber-900 rounded text-sm">
                        <AlertCircle className="inline w-4 h-4 mr-2 text-[#856404] dark:text-amber-200" />
                        <span className="text-[#856404] dark:text-amber-100">
                          If you do not receive your token, please disable ad blockers and try again
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#333] dark:text-gray-200 mb-2">Enter your admin login token</label>
                    <input
                      type="password"
                      value={adminToken}
                      onChange={handleTokenInput}
                      className="w-full h-12 text-center text-lg font-semibold border border-[#ddd] dark:border-gray-700 rounded focus:border-[#417690] focus:ring-1 focus:ring-[#417690] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      disabled={authLoading}
                      maxLength={16}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {attempts > 0 && (
                    <div className="mb-4 p-3 bg-[#fff3cd] border border-[#ffeeba] dark:bg-amber-900/30 dark:border-amber-900 rounded text-sm">
                      <AlertCircle className="inline w-4 h-4 mr-2" />
                      <span className="dark:text-amber-100">{maxAttempts - attempts} attempt{maxAttempts - attempts !== 1 ? 's' : ''} remaining</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={handleResend}
                      disabled={resendTimer > 0 || authLoading}
                      className={`text-sm ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#417690] dark:text-blue-400 hover:text-[#205067] dark:hover:text-blue-300'} flex items-center space-x-1`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{resendTimer > 0 ? `Resend token in ${resendTimer}s` : 'Resend Token'}</span>
                    </button>
                    <span className="text-xs text-[#666] dark:text-gray-400">Token valid for limited time</span>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={authLoading || adminToken.length < 6}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#417690] dark:bg-gray-700 text-white rounded hover:bg-[#205067] dark:hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Secure admin access with two-factor authentication
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
