import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { membershipPlans } from '../data/membershipData'

/**
 * Custom hook for managing recruitment/membership registration
 */
export const useRecruit = () => {
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState('one-year')
  const [loading, setLoading] = useState(false)
  
  // Initialize form data with user profile data
  const getInitialFormData = () => ({
    name: user?.name || user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || user?.profile?.phone || '',
    branch: user?.branch || user?.profile?.branch || '',
    year: user?.profile?.year || '',
    usn: user?.usn || '',
    whyJoin: ''
  })
  
  const [formData, setFormData] = useState(getInitialFormData())

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || user?.displayName || '',
        email: user?.email || '',
        phone: user?.phone || user?.profile?.phone || '',
        branch: user?.branch || user?.profile?.branch || '',
        year: user?.profile?.year || '',
        usn: user?.usn || '',
        whyJoin: ''
      })
    }
  }, [user?.name, user?.email, user?.phone, user?.profile?.phone, user?.branch, user?.profile?.branch, user?.profile?.year, user?.usn])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || 
        !formData.branch || !formData.year || !formData.usn) {
      toast.error('Please fill all required fields')
      return false
    }
    
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number')
      return false
    }
    
    return true
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please sign in to continue')
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        toast.error('Payment gateway not configured')
        return
      }
      // Load Razorpay script
      const res = await loadRazorpayScript()
      if (!res) {
        toast.error('Failed to load payment gateway')
        return
      }

      // Get selected plan
      const plan = membershipPlans.find(p => p.id === selectedPlan)
      const totalPrice = plan.basePrice + plan.platformFee
      
      // Create order (in production, this would be an API call to your backend)
      const orderData = {
        amount: totalPrice * 100, // Amount in paise
        currency: 'INR',
        receipt: `CSI_${Date.now()}`,
        notes: {
          userId: user.uid,
          planId: plan.id,
          planName: plan.name,
          basePrice: plan.basePrice,
          platformFee: plan.platformFee
        }
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CSI NMAMIT',
        description: `${plan.name} - ${plan.duration}`,
        image: '/csi-logo.png',
        handler: function (response) {
          // Handle successful payment
          toast.success('Payment successful! Welcome to CSI NMAMIT!')
          // console.log('Payment ID:', response.razorpay_payment_id)
          
          // Update user membership status (in production, verify payment on backend)
          // Then redirect to profile
          setTimeout(() => {
            navigate('/profile')
          }, 2000)
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        notes: orderData.notes,
        theme: {
          color: '#3b82f6'
        }
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
    } catch (error) {
      // console.error('Payment error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handlePayment()
  }

  return {
    formData,
    loading,
    selectedPlan,
    setSelectedPlan,
    handleInputChange,
    handleSubmit,
    signInWithGoogle
  }
}
