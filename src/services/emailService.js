/**
 * Email Service for Frontend
 * Handles OTP email sending directly through Web3Forms service
 * Works without backend - sends emails directly from the browser
 */

// Import functions FROM firebase.js (these will be real or mock based on isDemoMode)
import {
  db,
  isDemoMode,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp // This will be new Date() if isDemoMode is true
} from '../config/firebase';
import crypto from 'crypto-js';
import { WEB3FORMS_CONFIG, isWeb3FormsConfigured } from '../config/web3forms';
import firestoreFallback from '../utils/firestoreFallback';
import { ADMIN_LOGIN_TOKEN } from '../config/admin';

class EmailService {
  constructor() {
    // OTP configuration
    this.otpCollection = 'adminOTPs';
    this.otpExpiryTime = 10 * 60 * 1000; // 10 minutes

    // Validate Web3Forms configuration on initialization
    this.isConfigured = isWeb3FormsConfigured();
  }

  /**
   * Generate a secure OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash OTP for secure storage
   */
  hashOTP(otp) {
    // Ensure OTP is a string before hashing
    return crypto.SHA256(String(otp)).toString();
  }

  /**
   * Send "OTP" email (token email) to admin, always using ADMIN_LOGIN_TOKEN
   */
  async sendOTPEmail(email, name) {
    try {
      if (!this.isConfigured) {
        throw new Error('Email service (Web3Forms) not configured');
      }
      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_CONFIG.ACCESS_KEY);
      formData.append('subject', 'Your Admin Login Token');
      formData.append('name', name || 'Admin');
      formData.append('email', email);
      formData.append('message', `Hello ${name || ''},\n\nYour admin login token is: ${ADMIN_LOGIN_TOKEN}\nThis code is required for admin sign-in.\n\nIf you did not request this, you can ignore this email.\n\nThanks,\nCSI NMAMIT`);
      formData.append('replyto', import.meta.env.VITE_ADMIN_REPLY_EMAIL || 'noreply@csinmamit.in');
      const response = await fetch(WEB3FORMS_CONFIG.ENDPOINT, { method: 'POST', body: formData });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        return { success: true };
      }
      throw new Error(result.message || `Web3Forms failed with status: ${response.status}`);
    } catch (error) {
      return { success: false, message: error.message || 'Failed to send admin login token email.' };
    }
  }

  // --- sendCustomEmail remains the same ---
  async sendCustomEmail(toEmail, subject, message, name = 'User') {
    try {
      if (!this.isConfigured) {
        throw new Error('Email service (Web3Forms) not configured');
      }

      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_CONFIG.ACCESS_KEY);
      formData.append('subject', subject);
      formData.append('name', name);
      formData.append('email', toEmail);
      formData.append('message', message);
      // Optional: Add replyto if needed
      // formData.append('replyto', 'support@example.com');

      const response = await fetch(WEB3FORMS_CONFIG.ENDPOINT, { method: 'POST', body: formData });
      const result = await response.json().catch(() => ({}));

       if (response.ok && result.success) {
         // Custom email sent successfully
         return { success: true, response: result };
       } else {
         // Failed to send custom email
         throw new Error(result.message || `Web3Forms failed with status: ${response.status}`);
       }
    } catch (error) {
      // Error sending custom email
      throw error; // Rethrow the error for upstream handling
    }
  }


  /**
   * Verify admin login token (instead of OTP)
   */
  async verifyOTP(email, inputOTP) {
      if (inputOTP === ADMIN_LOGIN_TOKEN) {
        // Admin login successful
        return { success: true, message: 'Token verified successfully' };
      } else {
        // Admin login failed - invalid token
        return { success: false, message: 'Invalid token.' };
      }
  }
}

// Export singleton instance
export default new EmailService();

