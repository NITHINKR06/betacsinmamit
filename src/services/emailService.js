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
   * Send OTP email via Web3Forms
   * This sends emails directly from the browser without backend
   */
  async sendOTPEmail(email, name) {
    // Define otp variables outside the try block for potential use in catch
    let otp = this.generateOTP();
    let hashedOTP = this.hashOTP(otp);
    const expiryTime = Date.now() + this.otpExpiryTime;
    const safeEmailId = encodeURIComponent(email); // Use encoded email for ID

    // Prepare the data object
    const dataToSave = {
        otp: hashedOTP,
        email: email, // Store original email
        expiryTime: expiryTime,
        used: false,
        createdAt: serverTimestamp(), // Correctly uses new Date() in demo mode
        attempts: 0
    };

    try {
      // Debug: Log configuration status
      console.log('📧 Web3Forms Configuration Check:');
      console.log('ACCESS_KEY:', WEB3FORMS_CONFIG.ACCESS_KEY ? '✅ Set' : '❌ Missing');
      console.log('Is Configured:', this.isConfigured);

      // Check if Web3Forms is configured
      if (!this.isConfigured) {
        console.warn('⚠️ Web3Forms not configured. Email sending skipped.');

        // In development OR demo mode, still generate and store OTP for testing
        if (import.meta.env.DEV || isDemoMode) {
          // Store OTP in Firestore (using imported functions)
          console.log(`[${isDemoMode ? 'Demo Mode' : 'Dev Mode'}] Storing OTP for ${email} without sending email.`);

          // --- DEBUG LOG 1 ---
          console.log('DEBUG (No Config): Attempting to save OTP data:', JSON.stringify(dataToSave, null, 2));
          // Check for undefined values specifically
          for (const key in dataToSave) {
            if (dataToSave[key] === undefined) {
              console.error(`DEBUG (No Config): Field "${key}" is UNDEFINED!`);
            }
          }

          const otpRef = doc(db, this.otpCollection, safeEmailId);
          await setDoc(otpRef, dataToSave); // Use prepared data object
          console.log(`✅ (No Config) OTP stored in ${isDemoMode ? 'Mock ' : ''}Firestore for ID: ${safeEmailId}`);


          console.log(`🔐 ${isDemoMode ? 'Demo Mode' : 'Development'} OTP for ${email}: ${otp}`);
          // Ensure 'otp' is returned only if needed for testing/display
          return { success: true, otp: (import.meta.env.DEV ? otp : undefined), emailSkipped: true };
        }

        // In production without config, throw error
        throw new Error('Email service not configured. Please contact administrator.');
      }

      // --- Normal Flow (Web3Forms configured) ---

      console.log('📧 Attempting to store OTP and send email to:', email);

       // --- DEBUG LOG 2 ---
      console.log('DEBUG (Try Block): Attempting to save OTP data:', JSON.stringify(dataToSave, null, 2));
       // Check for undefined values specifically
       for (const key in dataToSave) {
         if (dataToSave[key] === undefined) {
           console.error(`DEBUG (Try Block): Field "${key}" is UNDEFINED!`);
         }
       }


      // Store OTP in Firestore first (using imported functions)
      const otpRef = doc(db, this.otpCollection, safeEmailId);
      await setDoc(otpRef, dataToSave); // Use prepared data object
      console.log(`✅ OTP stored in ${isDemoMode ? 'Mock ' : ''}Firestore for ID: ${safeEmailId}`);

      // Prepare Web3Forms form data
      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_CONFIG.ACCESS_KEY);
      formData.append('subject', 'Your OTP Code');
      formData.append('name', name || 'User');
      formData.append('email', email); // Send to the actual email address
      formData.append(
        'message',
        `Hello ${name || ''},\n\nYour OTP code is: ${otp}\nThis code is valid for 10 minutes.\n\nIf you did not request this, you can ignore this email.\n\nThanks,\nCSI NMAMIT`
      );
      formData.append('replyto', 'csidatabasenmamit@gmail.com');

      console.log('📧 Sending email via Web3Forms...');
      const response = await fetch(WEB3FORMS_CONFIG.ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json().catch(() => ({})); // Parse JSON safely

      if (response.ok && result.success) {
        console.log('✅ Email sent successfully via Web3Forms.');
         // Return OTP only in dev mode for easier testing, not in production
        return { success: true, otp: import.meta.env.DEV ? otp : undefined };
      }

      // If response not ok or result.success is false
      console.error('❌ Web3Forms Error Response:', result);
      throw new Error(result.message || `Web3Forms failed with status: ${response.status}`);

    } catch (error) {
      console.error('❌ Error during OTP process:', error); // Log the actual error object

      // If ANY error occurs (Firestore OR Web3Forms) in development OR demo mode,
      // still attempt to store/return OTP for testing continuity
      if (import.meta.env.DEV || isDemoMode) {
        console.warn(`⚠️ Error occurred, but attempting to store/return OTP for ${isDemoMode ? 'Demo Mode' : 'Development'} testing.`);

        try {
          // Attempt to store OTP again in case the first attempt failed before email send
          const safeEmailIdFallback = encodeURIComponent(email); // Ensure correct ID

          // --- DEBUG LOG 3 ---
          console.log('DEBUG (Catch Block): Attempting fallback save:', JSON.stringify(dataToSave, null, 2));
           // Check for undefined values specifically
          for (const key in dataToSave) {
            if (dataToSave[key] === undefined) {
              console.error(`DEBUG (Catch Block): Field "${key}" is UNDEFINED!`);
            }
          }

          const otpRefFallback = doc(db, this.otpCollection, safeEmailIdFallback);
          // Use the SAME dataToSave object which includes the correct timestamp
          await setDoc(otpRefFallback, dataToSave, { merge: true }); // Use merge just in case
           console.log(`✅ Fallback OTP stored/merged in ${isDemoMode ? 'Mock ' : ''}Firestore for ID: ${safeEmailIdFallback}`);
        } catch (dbError) {
           console.error('❌ Fallback Firestore save failed:', dbError); // Log the specific DB error
           // Even if fallback save fails, return OTP in dev for testing UI flow
           if (import.meta.env.DEV) {
             // Include original error and fallback DB error if present
             return { success: false, error: error.message, otp: otp, emailError: true, dbFallbackError: dbError.message };
           }
            // In production or demo mode if fallback fails, rethrow original error if it's more informative, else dbError
            throw error instanceof Error ? error : dbError;
        }

        // Return OTP only in dev mode after error
        return { success: false, error: error.message, otp: import.meta.env.DEV ? otp : undefined, emailError: true };
      }

      // In production, just rethrow the original error
      throw error;
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

      console.log(`📧 Sending custom email to ${toEmail} via Web3Forms...`);
      const response = await fetch(WEB3FORMS_CONFIG.ENDPOINT, { method: 'POST', body: formData });
      const result = await response.json().catch(() => ({}));

       if (response.ok && result.success) {
         console.log('✅ Custom email sent successfully.');
         return { success: true, response: result };
       } else {
         console.error('❌ Failed to send custom email:', result);
         throw new Error(result.message || `Web3Forms failed with status: ${response.status}`);
       }
    } catch (error) {
      console.error('❌ Error sending custom email:', error);
      throw error; // Rethrow the error for upstream handling
    }
  }


  // --- verifyOTP remains the same ---
  async verifyOTP(email, inputOTP) {
    const safeEmailId = encodeURIComponent(email); // Use encoded email for ID
    try {
      console.log(`🔍 Verifying OTP for ${email} (ID: ${safeEmailId})`);
      // Get OTP document using the potentially mocked functions
      const otpRef = doc(db, this.otpCollection, safeEmailId);
      const otpDoc = await getDoc(otpRef);

      if (!otpDoc.exists()) {
        console.warn(`❌ OTP document not found for ID: ${safeEmailId}`);
        return { success: false, message: 'OTP not found or expired. Please request a new one.' };
      }

      const otpData = otpDoc.data();
      console.log('📄 Found OTP data:', {
        used: otpData.used,
        expired: Date.now() > otpData.expiryTime,
        attempts: otpData.attempts
      });


      // Check if OTP is already used
      if (otpData.used) {
        return { success: false, message: 'This OTP has already been used.' };
      }

      // Check if OTP is expired
      if (Date.now() > otpData.expiryTime) {
         // Optionally clean up expired/used OTPs here or in a separate process
         // await deleteDoc(otpRef);
        return { success: false, message: 'OTP has expired. Please request a new one.' };
      }

      const currentAttempts = otpData.attempts || 0;

      // Check if too many attempts (BEFORE verifying)
       if (currentAttempts >= 5) {
         // Mark as used after too many attempts to prevent further use
         await updateDoc(otpRef, { used: true, attempts: currentAttempts + 1 });
         console.warn(`🚫 Too many attempts (${currentAttempts + 1}) for OTP ID: ${safeEmailId}. Locking OTP.`);
         return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
       }


      // Verify OTP (compare hashed values)
      const hashedInput = this.hashOTP(inputOTP);
      if (otpData.otp !== hashedInput) {
         // Increment attempts on failure
         await updateDoc(otpRef, { attempts: currentAttempts + 1 });
         console.warn(`❌ Invalid OTP entered for ID: ${safeEmailId}. Attempt ${currentAttempts + 1}`);
        return { success: false, message: 'Invalid OTP code.' };
      }

      // Mark OTP as used only on successful verification
      await updateDoc(otpRef, { used: true, attempts: currentAttempts + 1 }); // Log the successful attempt too
      console.log(`✅ OTP verified successfully for ID: ${safeEmailId} on attempt ${currentAttempts + 1}`);

      return { success: true, message: 'OTP verified successfully' };

    } catch (error) {
      console.error(`❌ Error verifying OTP for ${email} (ID: ${safeEmailId}):`, error);
      // Provide a generic error message to the user
      return { success: false, message: 'An error occurred during OTP verification. Please try again.' };
    }
  }
}

// Export singleton instance
export default new EmailService();

