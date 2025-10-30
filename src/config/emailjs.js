/**
 * EmailJS Configuration
 * Handles SMTP email sending directly from the frontend
 * No backend required - uses EmailJS service
 */

// EmailJS Configuration
// You'll need to sign up at https://www.emailjs.com/ and get these values
export const EMAILJS_CONFIG = {
  // Service ID from EmailJS dashboard
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  
  // Template ID for OTP emails
  OTP_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID || '',
  
  // Public Key from EmailJS dashboard
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
  
  // Optional: Private key for added security (not recommended for frontend)
  // PRIVATE_KEY: import.meta.env.VITE_EMAILJS_PRIVATE_KEY || ''
}

// Validate configuration
export const validateEmailJSConfig = () => {
  const missingConfigs = []
  
  if (!EMAILJS_CONFIG.SERVICE_ID) {
    missingConfigs.push('VITE_EMAILJS_SERVICE_ID')
  }
  
  if (!EMAILJS_CONFIG.OTP_TEMPLATE_ID) {
    missingConfigs.push('VITE_EMAILJS_OTP_TEMPLATE_ID')
  }
  
  if (!EMAILJS_CONFIG.PUBLIC_KEY) {
    missingConfigs.push('VITE_EMAILJS_PUBLIC_KEY')
  }
  
  if (missingConfigs.length > 0) {
    // console.warn('⚠️ EmailJS configuration missing:', missingConfigs.join(', '))
    // console.warn('Please add these to your .env file')
    return false
  }
  
  return true
}

// Email template parameters helper
export const createOTPEmailParams = (email, name, otp) => {
  // Calculate expiry time, e.g., "12:45 PM"
  // Note: This matches the 10-minute expiry set in emailService.js
  const expiry = new Date(Date.now() + 10 * 60 * 1000); 
  const timeString = expiry.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const templateParams = {
    // --- Aliases for email ---
    to_email: email,
    user_email: email,
    email: email,
    recipient_email: email,
    
    // --- Aliases for name ---
    to_name: name,
    user_name: name,
    name: name,
    
    // --- Variables for your template ---
    passcode: otp, // Matches {{passcode}}
    time: timeString, // Matches {{time}}
    valid_time: '10 minutes', // Matches {{valid_time}} if used in template
    
    // --- Keep old aliases just in case ---
    otp_code: otp,
    otp: otp,
    code: otp,
    // --- End Changes ---

    from_name: 'CSI NMAMIT Admin',

    // helpful context (ignored by template if not used)
    site_origin: typeof window !== 'undefined' ? window.location.origin : ''
  }
  return templateParams
}

// SMTP Configuration Guide for EmailJS
export const SMTP_SETUP_GUIDE = `
EmailJS Setup Instructions:

1. Sign up at https://www.emailjs.com/
2. Add an email service (Gmail, Outlook, or custom SMTP)
3. Create an email template with these variables:
   - {{to_email}} - Recipient email
   - {{to_name}} - Recipient name
   - {{otp_code}} - The OTP code
   - {{valid_time}} - OTP validity duration
   
4. Get your credentials from EmailJS dashboard:
   - Service ID
   - Template ID
   - Public Key
   
5. Add to your .env file:
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_OTP_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key

For custom SMTP in EmailJS:
- SMTP Server: smtp.gmail.com (for Gmail)
- Port: 587 (TLS) or 465 (SSL)
- Username: your email
- Password: app-specific password
`

export default EMAILJS_CONFIG
