import { createContext, useContext, useState, useEffect } from 'react'
import { auth, googleProvider, isDemoMode, db } from '../config/firebase'
import { 
  signInWithPopup as firebaseSignInWithPopup,
  signInWithRedirect as firebaseSignInWithRedirect,
  getRedirectResult as firebaseGetRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth'
import { 
  doc as firebaseDoc,
  setDoc as firebaseSetDoc,
  getDoc as firebaseGetDoc,
  serverTimestamp as firebaseServerTimestamp,
  collection as firebaseCollection
} from 'firebase/firestore'
import toast from 'react-hot-toast'
import emailService from '../services/emailService'
import firestoreFallback from '../utils/firestoreFallback'

// Determine dev mode: use Vite's flag OR VITE_APP_ENV=development
const IS_DEV_MODE = (import.meta.env?.DEV === true) || (import.meta.env?.VITE_APP_ENV === 'development')

// Use appropriate functions based on mode
let signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged
let doc, setDoc, getDoc, serverTimestamp, collection

if (isDemoMode) {
  // Use mock functions from demo
  signInWithPopup = (auth, provider) => auth.signInWithPopup(provider)
  signOut = (auth) => auth.signOut()
  onAuthStateChanged = (auth, callback) => auth.onAuthStateChanged(callback)
  signInWithRedirect = (auth, provider) => auth.signInWithRedirect(provider)
  getRedirectResult = (auth) => auth.getRedirectResult()
  
  // Mock Firestore functions
  doc = (db, collectionName, id) => db.doc(`${collectionName}/${id}`)
  setDoc = (docRef, data, options) => docRef.set(data, options)
  getDoc = (docRef) => docRef.get()
  serverTimestamp = () => new Date()
  collection = (db, name) => db.collection(name)
} else {
  // Use real Firebase functions
  signInWithPopup = firebaseSignInWithPopup
  signInWithRedirect = firebaseSignInWithRedirect
  getRedirectResult = firebaseGetRedirectResult
  signOut = firebaseSignOut
  onAuthStateChanged = firebaseOnAuthStateChanged
  doc = firebaseDoc
  setDoc = firebaseSetDoc
  getDoc = firebaseGetDoc
  serverTimestamp = firebaseServerTimestamp
  collection = firebaseCollection
}

const AdminAuthContext = createContext({})

export const useAdminAuth = () => useContext(AdminAuthContext)

const ADMIN_WHITELIST = (import.meta.env.VITE_ADMIN_WHITELIST || "")
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean); // removes empty strings

// Admin Token configuration
const TOKEN_EXPIRY_TIME = 10 * 60 * 1000 // 10 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000 // 60 minutes

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [tokenSent, setTokenSent] = useState(false)
  const [sessionExpiry, setSessionExpiry] = useState(null)
  const [pendingAdmin, setPendingAdmin] = useState(() => {
    // Restore pendingAdmin from sessionStorage on mount
    const stored = sessionStorage.getItem('pendingAdmin')
    return stored ? JSON.parse(stored) : null
  })

  // Generate Admin Token
  // const generateToken = () => {
  //   return Math.floor(100000 + Math.random() * 900000).toString()
  // }

  // Check if user is whitelisted admin
  const isWhitelistedAdmin = (email) => {
    // If no whitelist provided, allow all (useful in development)
    if (ADMIN_WHITELIST.length === 0) return true
    return ADMIN_WHITELIST.includes(email.toLowerCase())
  }

  // Helper function to set pending admin with persistence
  const setPendingAdminWithPersistence = (adminData) => {
    if (adminData) {
      sessionStorage.setItem('pendingAdmin', JSON.stringify(adminData))
    } else {
      sessionStorage.removeItem('pendingAdmin')
    }
    setPendingAdmin(adminData)
  }

  // Sign in with Google (Step 1)
  const signInAdminWithGoogle = async () => {
    setAuthLoading(true);
    try {
      // Always try popup first (works in most browsers)
      if (auth && googleProvider) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result?.user;
          
          if (user) {
            // Popup sign-in successful
            
            // Whitelist check
            if (!isWhitelistedAdmin(user.email)) {
              await signOut(auth);
              toast.error('Unauthorized: You are not an admin');
              setAuthLoading(false);
              return null;
            }
            
            // Prepare token step with persistence
            const adminData = {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              photoURL: user.photoURL
            };
            
            setPendingAdminWithPersistence(adminData);
            await sendAdminToken(user.email, user.displayName || 'Admin');
            sessionStorage.setItem('tokenSentForPending', 'true');
            setTokenSent(true);
            setAuthLoading(false);
            return null;
          }
        } catch (popupError) {
          // Popup blocked or failed, falling back to redirect
          
          // Mark that we're initiating a redirect
          sessionStorage.setItem('authRedirectInitiated', 'true');
          
          // Fallback to redirect if popup is blocked
          await signInWithRedirect(auth, googleProvider);
          return null;
        }
      }
    } catch (error) {
      // Sign-in error occurred
      toast.error('Failed to sign in. Please try again.');
      setAuthLoading(false);
      throw error;
    }
  }

  // Handle redirect result after returning from Google auth
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        if (!auth) {
          return;
        }

        // Check if we're returning from a redirect
        const urlParams = new URLSearchParams(window.location.search);
        const isReturningFromAuth = urlParams.has('code') || urlParams.has('state') || 
                                    window.location.hash.includes('access_token');

        // First check if we already have a pending admin from a previous redirect
        const storedPending = sessionStorage.getItem('pendingAdmin');
        
        if (storedPending && !isReturningFromAuth) {
          // We have a pending admin and not currently processing a redirect
          const pendingData = JSON.parse(storedPending);
          
          // Restore the state
          setPendingAdmin(pendingData);
          
          // Check if token was already sent
          const tokenSentFlag = sessionStorage.getItem('tokenSentForPending');
          if (!tokenSentFlag) {
            // Token not sent yet, send it now
            await sendAdminToken(pendingData.email, pendingData.name);
            sessionStorage.setItem('tokenSentForPending', 'true');
            setTokenSent(true);
          } else {
            setTokenSent(true);
          }
          return;
        }

        // Try to get redirect result
        const result = await getRedirectResult(auth);
        const user = result?.user;

        if (!user) {
          // No user from redirect and no stored pending admin
          return;
        }

        // We have a user from redirect, process it

        // Check whitelist
        const isAdmin = isWhitelistedAdmin(user.email);
        if (!isAdmin) {
          await signOut(auth);
          sessionStorage.removeItem('pendingAdmin');
          sessionStorage.removeItem('tokenSentForPending');
          toast.error('Unauthorized: You are not an admin');
          return;
        }

        // Store pending admin with persistence
        const adminData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL
        };
        
        setPendingAdminWithPersistence(adminData);

        // Send token via EmailJS
        await sendAdminToken(user.email, user.displayName || 'Admin');
        sessionStorage.setItem('tokenSentForPending', 'true');
        setTokenSent(true);

        // Clear URL parameters to prevent re-processing
        if (isReturningFromAuth) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

      } catch (e) {
        // Error in handleRedirect
        
        // Check if we have a stored pending admin even if redirect failed
        const storedPending = sessionStorage.getItem('pendingAdmin');
        if (storedPending) {
          const pendingData = JSON.parse(storedPending);
          setPendingAdmin(pendingData);
          setTokenSent(true);
        } else {
          toast.error('Error handling sign-in redirect');
        }
      }
    };
    
    handleRedirect();
  }, []); // Keep dependency array empty


  // Replace sendAdminToken to use sendOTPEmail from emailService
  const sendAdminToken = async (email, name) => {
    try {
      const result = await emailService.sendOTPEmail(email, name)
      if (result.success) {
        toast.success(`Token sent to ${email}. Check your inbox and spam folder.`)
        setTokenSent(true)
        setTimeout(() => {
          setTokenSent(false)
        }, TOKEN_EXPIRY_TIME)
      } else {
        throw new Error('Failed to send token')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send token. Please try again.')
      setTokenSent(false)
    }
  }

  // Replace verifyAdminToken to use verifyOTP from emailService
  const verifyAdminToken = async (inputToken) => {
    if (!pendingAdmin) {
      toast.error('No pending admin login')
      return false
    }
    setAuthLoading(true)
    try {
      const result = await emailService.verifyOTP(pendingAdmin.email, inputToken)
      if (!result.success) {
        toast.error(result.message || 'Invalid token')
        return false
      }
      // Mark admin as logged in (just in state)
      const expiry = Date.now() + 15*60*1000; // 15 minutes
      setAdminUser({ ...pendingAdmin, role: 'admin', verified: true })
      setSessionExpiry(expiry);
      // Save session to localStorage
      localStorage.setItem('adminSession', JSON.stringify({ uid: pendingAdmin.uid, expiry }));
      setPendingAdminWithPersistence(null)
      // ---- Firestore: Save admin user record ----
      try {
        const adminData = {
          uid: pendingAdmin.uid,
          email: pendingAdmin.email,
          name: pendingAdmin.name,
          photoURL: pendingAdmin.photoURL,
          role: 'admin',
          verified: true,
          lastLogin: new Date().toISOString()
        }
        const adminRef = doc(db, 'admins', pendingAdmin.uid);
        await setDoc(adminRef, adminData, { merge: true });
      } catch (e) {
        // Failed to save admin to Firestore
      }
      toast.success('Admin login successful!')
      return true
    } catch (error) {
      toast.error('Failed to verify token. Please try again.')
      return false
    } finally {
      setAuthLoading(false)
    }
  }

  // Resend Admin Token
  const resendAdminToken = async () => {
    if (!pendingAdmin) {
      toast.error('No pending admin login')
      return false
    }

    // Use the sendAdminToken function to resend
    return await sendAdminToken(pendingAdmin.email, pendingAdmin.name)
  }

  // Admin logout
  const logoutAdmin = async () => {
    setAuthLoading(true)
    try {
      await signOut(auth)
      setAdminUser(null)
      setPendingAdminWithPersistence(null)
      setTokenSent(false)
      setSessionExpiry(null)
      localStorage.removeItem('adminSession')
      sessionStorage.removeItem('tokenSentForPending')
      toast.success('Admin logged out successfully')
    } catch (error) {
      // console.error('Error logging out:', error)
      toast.error('Failed to logout')
    } finally {
      setAuthLoading(false)
    }
  }

  // Check admin status
  const checkAdminStatus = async (uid) => {
    try {
      const adminRef = doc(db, 'admins', uid)
      const adminDoc = await getDoc(adminRef)
      
      if (adminDoc.exists() && adminDoc.data().verified) {
        return adminDoc.data()
      }
      return null
    } catch (error) {
      // console.error('Error checking admin status:', error)
      return null
    }
  }

  // Session management
  useEffect(() => {
    if (sessionExpiry) {
      const checkSession = setInterval(() => {
        if (Date.now() > sessionExpiry) {
          toast.error('Admin session expired')
          logoutAdmin()
        }
      }, 60000) // Check every minute

      return () => clearInterval(checkSession)
    }
  }, [sessionExpiry])

  // Update session timeout
  const updateSessionTimeout = (durationMs) => {
    const newExpiry = Date.now() + durationMs
    setSessionExpiry(newExpiry)
    
    // Update localStorage
    const storedSession = localStorage.getItem('adminSession')
    if (storedSession) {
      const session = JSON.parse(storedSession)
      session.expiry = newExpiry
      localStorage.setItem('adminSession', JSON.stringify(session))
    }
    
    toast.success(`Session extended by ${Math.floor(durationMs / 60000)} minutes`)
  }

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      // Always require a valid session; no dev auto-login

      const storedSession = localStorage.getItem('adminSession')
      
      if (storedSession) {
        const session = JSON.parse(storedSession)
        
        if (Date.now() < session.expiry) {
          // Session still valid, restore admin user
          const adminData = await checkAdminStatus(session.uid)
          if (adminData) {
            setAdminUser(adminData)
            setSessionExpiry(session.expiry)
          } else {
            localStorage.removeItem('adminSession')
          }
        } else {
          localStorage.removeItem('adminSession')
        }
      }
      
      setLoading(false)
    }

    checkExistingSession()
  }, [])

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && adminUser) {
        // Keep admin user in sync
        const adminData = await checkAdminStatus(firebaseUser.uid)
        if (adminData) {
          setAdminUser({
            ...adminData,
            uid: firebaseUser.uid
          })
        }
      } else if (firebaseUser && !adminUser) {
        // Check if this user is an admin
        const adminData = await checkAdminStatus(firebaseUser.uid)
        if (adminData) {
          // This is an admin user, but we don't have admin session
          // Don't set admin user without proper session
          // console.log('Admin user detected but no active session')
        }
      }
    })

    return unsubscribe
  }, [])

  // Activity logging
  const logAdminActivity = async (action, details = {}) => {
    if (!adminUser) return

    try {
      const activityRef = doc(collection(db, 'adminActivity'))
      await setDoc(activityRef, {
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        action: action,
        details: details,
        timestamp: serverTimestamp(),
        ip: window.location.hostname // In production, get actual IP
      })
    } catch (error) {
      // console.error('Error logging activity:', error)
    }
  }

  const value = {
    adminUser,
    loading,
    authLoading,
    tokenSent,
    pendingAdmin,
    sessionExpiry,
    signInAdminWithGoogle,
    verifyAdminToken,
    resendAdminToken,
    logoutAdmin,
    checkAdminStatus,
    logAdminActivity,
    isWhitelistedAdmin,
    updateSessionTimeout
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
