/**
 * Email Service for Frontend
 * Handles OTP email sending directly through Web3Forms service
 * Works without backend - sends emails directly from the browser
 */

import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import crypto from 'crypto-js'
import { WEB3FORMS_CONFIG, isWeb3FormsConfigured } from '../config/web3forms'

class EmailService {
  constructor() {
    // OTP configuration
    this.otpCollection = 'adminOTPs'
    this.otpExpiryTime = 10 * 60 * 1000 // 10 minutes
    
    // Validate Web3Forms configuration on initialization
    this.isConfigured = isWeb3FormsConfigured()
  }

  /**
   * Generate a secure OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Hash OTP for secure storage
   */
  hashOTP(otp) {
    return crypto.SHA256(otp).toString()
  }

  /**
   * Send OTP email via Web3Forms
   * This sends emails directly from the browser without backend
   */
  async sendOTPEmail(email, name) {
    try {
      // Debug: Log configuration status
      console.log('📧 Web3Forms Configuration Check:')
      console.log('ACCESS_KEY:', WEB3FORMS_CONFIG.ACCESS_KEY ? '✅ Set' : '❌ Missing')
      console.log('Is Configured:', this.isConfigured)
      
      // Check if Web3Forms is configured
      if (!this.isConfigured) {
        // console.warn('⚠️ Web3Forms not configured. Please set VITE_WEB3FORMS_ACCESS_KEY')
        
        // In development, still generate and return OTP for testing
        if (import.meta.env.DEV) {
          const otp = this.generateOTP()
          const hashedOTP = this.hashOTP(otp)
          const expiryTime = Date.now() + this.otpExpiryTime
          
          // Store OTP in Firestore even if email isn't sent
          
          const safeEmailId = encodeURIComponent(email)
          const otpRef = doc(db, this.otpCollection, safeEmailId)
          await setDoc(otpRef, {
            otp: hashedOTP,
            email: email,
            expiryTime: expiryTime,
            used: false,
            createdAt: serverTimestamp(),
            attempts: 0
          })
          
          // console.log(`🔐 Development OTP for ${email}: ${otp}`)
          return { success: true, otp: otp, emailSkipped: true }
        }
        
        throw new Error('Email service not configured. Please contact administrator.')
      }

      // Generate OTP
      const otp = this.generateOTP()
      const hashedOTP = this.hashOTP(otp)
      const expiryTime = Date.now() + this.otpExpiryTime

      // console.log('📧 Attempting to send OTP email to:', email)

      // Store OTP in Firestore (hashed for security)
      // Store OTP in Firestore (hashed for security)
      const safeEmailId = encodeURIComponent(email)
      const otpRef = doc(db, this.otpCollection, safeEmailId)
      await setDoc(otpRef, {
        otp: hashedOTP,
        email: email,
        expiryTime: expiryTime,
        used: false,
        createdAt: serverTimestamp(),
        attempts: 0
      })
      // console.log('✅ OTP stored in Firestore')

      // Prepare Web3Forms form data
      const formData = new FormData()
      formData.append('access_key', WEB3FORMS_CONFIG.ACCESS_KEY)
      formData.append('subject', 'Your OTP Code')
      formData.append('name', name || 'User')
      formData.append('email', email)
      formData.append(
        'message',
        `Hello ${name || ''},\n\nYour OTP code is: ${otp}\nThis code is valid for 10 minutes.\n\nIf you did not request this, you can ignore this email.\n\nThanks,\nCSI NMAMIT`
      )
      // Optional: let recipient reply to a support address (depends on template)
      formData.append('replyto', 'csidatabasenmamit@gmail.com')

      console.log('📧 Sending email via Web3Forms...')
      const response = await fetch(WEB3FORMS_CONFIG.ENDPOINT, {
        method: 'POST',
        body: formData
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok && result.success) {
        if (import.meta.env.PROD) {
          return { success: true }
        }
        return { success: true, otp: import.meta.env.DEV ? otp : undefined }
      }

      throw new Error(result.message || `Web3Forms failed with status: ${response.status}`)
    } catch (error) {
      // console.error('❌ Error sending OTP email:', error)

      // If EmailJS fails in development, still return OTP for testing
      if (import.meta.env.DEV) {
        // console.warn('⚠️ Email sending failed, but returning OTP for development testing')
        const otp = this.generateOTP()
        const hashedOTP = this.hashOTP(otp)
        const expiryTime = Date.now() + this.otpExpiryTime
        
        // Store OTP in Firestore
        // Store OTP in Firestore
        const safeEmailId = encodeURIComponent(email)
        const otpRef = doc(db, this.otpCollection, safeEmailId)
        await setDoc(otpRef, {
          otp: hashedOTP,
          email: email,
          expiryTime: expiryTime,
          used: false,
          createdAt: serverTimestamp(),
          attempts: 0
        })
        
        // console.log(`🔐 Development OTP for ${email}: ${otp}`)
        return { success: true, otp: otp, emailError: true }
      }
      
      throw error
    }
  }

  /**
   * Send custom email via Web3Forms (generic helper)
   */
  async sendCustomEmail(templateId, templateParams) {
    try {
      if (!this.isConfigured) {
        throw new Error('Email service not configured')
      }

      const formData = new FormData()
      formData.append('access_key', WEB3FORMS_CONFIG.ACCESS_KEY)
      // Map common fields if provided
      if (templateParams?.subject) formData.append('subject', templateParams.subject)
      if (templateParams?.to_name) formData.append('name', templateParams.to_name)
      if (templateParams?.to_email) formData.append('email', templateParams.to_email)
      const message = templateParams?.message || 'Message from application'
      formData.append('message', message)

      const response = await fetch(WEB3FORMS_CONFIG.ENDPOINT, { method: 'POST', body: formData })
      const result = await response.json().catch(() => ({}))

      return { success: response.ok && result.success, response: result }
    } catch (error) {
      // console.error('Error sending custom email:', error)
      throw error
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email, inputOTP) {
    try {
      // Get OTP document
      // Get OTP document
      const safeEmailId = encodeURIComponent(email)
      const otpRef = doc(db, this.otpCollection, safeEmailId)
      const otpDoc = await getDoc(otpRef)

      if (!otpDoc.exists()) {
        return {
          success: false,
          message: 'OTP not found'
        }
      }

      const otpData = otpDoc.data()

      // Check if OTP is already used
      if (otpData.used) {
        return {
          success: false,
          message: 'OTP already used'
        }
      }

      // Check if OTP is expired
      if (Date.now() > otpData.expiryTime) {
        return {
          success: false,
          message: 'OTP expired'
        }
      }

      // Increment attempts
      await updateDoc(otpRef, {
        attempts: (otpData.attempts || 0) + 1
      })

      // Check if too many attempts
      if (otpData.attempts >= 5) {
        await updateDoc(otpRef, { used: true })
        return {
          success: false,
          message: 'Too many attempts. Please request a new OTP'
        }
      }

      // Verify OTP (compare hashed values)
      const hashedInput = this.hashOTP(inputOTP)
      if (otpData.otp !== hashedInput) {
        return {
          success: false,
          message: 'Invalid OTP'
        }
      }

      // Mark OTP as used
      await updateDoc(otpRef, { used: true })

      return {
        success: true,
        message: 'OTP verified successfully'
      }
    } catch (error) {
      // console.error('Error verifying OTP:', error)
      throw error
    }
  }

}

// Export singleton instance
export default new EmailService()
