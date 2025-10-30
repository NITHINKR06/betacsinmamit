import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfileWithImage, validateProfileData } from '../services/profileService'
import toast from 'react-hot-toast'

// Components
import ProfileHeader from '../components/CoreProfile/ProfileHeader'
import ProfileAvatar from '../components/CoreProfile/ProfileAvatar'
import ProfileForm from '../components/CoreProfile/ProfileForm'
import ProfileDisplay from '../components/CoreProfile/ProfileDisplay'
import StatsGrid from '../components/CoreProfile/StatsGrid'
import PermissionsSection from '../components/CoreProfile/PermissionsSection'

// Utils
import { getRoleCategory, getRoleColor, getStats } from '../utils/coreProfileUtils'

const CoreMemberProfile = () => {
  const { user, getUserRoleDisplay, updateUserProfile } = useAuth()
  const updatesDisabled = true
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showComingSoon, setShowComingSoon] = useState(true)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    usn: user?.profile?.usn || user?.usn || '',
    phone: user?.profile?.phone || '',
    role: user?.profile?.role || user?.roleDetails?.position || '',
    bio: user?.profile?.bio || '',
    branch: user?.profile?.branch || '',
    year: user?.profile?.year || '',
    skills: user?.profile?.skills || [],
    linkedin: user?.profile?.linkedin || '',
    github: user?.profile?.github || ''
  })

  // Create preview URL when image is selected
  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage)
      setPreviewUrl(url)
      
      // Cleanup
      return () => URL.revokeObjectURL(url)
    }
  }, [selectedImage])

  // Handle image selection
  const handleImageSelect = (file) => {
    if (updatesDisabled) return
    setSelectedImage(file)
    // Automatically enter edit mode when image is selected
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  // Event Handlers
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form data
    const validation = validateProfileData(formData)
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      toast.error(firstError)
      return
    }
    
    try {
      setIsUploading(true)
      
      // Prepare profile data
      const profileData = {
        name: formData.name,
        photoURL: user?.photoURL,
        usn: formData.usn,
        phone: formData.phone,
        role: formData.role,
        bio: formData.bio,
        branch: formData.branch,
        year: formData.year,
        skills: formData.skills,
        linkedin: formData.linkedin,
        github: formData.github
      }
      
      // Update profile with image if selected
      const updatedData = await updateProfileWithImage(
        user.uid,
        profileData,
        selectedImage
      )
      
      // Update local state through AuthContext
      await updateUserProfile(updatedData)
      
      // Show success message
      if (selectedImage) {
        toast.success('Profile and image updated successfully!', {
          duration: 4000,
          icon: '🎉'
        })
      } else {
        toast.success('Profile updated successfully!')
      }
      
      // Reset states
      setIsEditing(false)
      setSelectedImage(null)
      setPreviewUrl(null)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      
      // Show specific error messages
      if (error.message.includes('Cloudinary')) {
        toast.error('Failed to upload image. Please check your internet connection and try again.')
      } else if (error.message.includes('permission')) {
        toast.error('You do not have permission to update this profile.')
      } else {
        toast.error('Failed to update profile. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSelectedImage(null)
    setPreviewUrl(null)
    // Reset form data to original values
    setFormData({
      name: user?.name || '',
      usn: user?.profile?.usn || user?.usn || '',
      phone: user?.profile?.phone || '',
      role: user?.profile?.role || user?.roleDetails?.position || '',
      bio: user?.profile?.bio || '',
      branch: user?.profile?.branch || '',
      year: user?.profile?.year || '',
      skills: user?.profile?.skills || [],
      linkedin: user?.profile?.linkedin || '',
      github: user?.profile?.github || ''
    })
  }

  // Helper functions with proper binding
  const roleCategory = getRoleCategory(getUserRoleDisplay)
  const roleColor = getRoleColor(getRoleCategory, getUserRoleDisplay)
  const stats = getStats(getUserRoleDisplay)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 pt-20">
      <div className="container-custom py-8">
        {/* Coming Soon Modal */}
        {showComingSoon && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowComingSoon(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.98, y: 6 }} 
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              className="relative mx-4 w-full max-w-md rounded-2xl bg-white/90 dark:bg-gray-900/80 border border-white/20 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-3 right-3 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setShowComingSoon(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Core Member Profile</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">Profile update features are coming soon.</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">We’re polishing the experience. Thanks for your patience!</p>
                <div className="mt-5">
                  <button 
                    className="btn-primary w-full"
                    onClick={() => setShowComingSoon(false)}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Header */}
        <ProfileHeader />

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden mb-8"
        >
          {/* Cover Section */}
          <div className={`h-32 bg-gradient-to-r ${roleColor}`} />
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between -mt-16">
              {/* Avatar and Basic Info */}
              <ProfileAvatar 
                user={user}
                getUserRoleDisplay={getUserRoleDisplay}
                getRoleCategory={() => roleCategory}
                onImageSelect={handleImageSelect}
                isUploading={isUploading}
                previewUrl={previewUrl}
              />

              {/* Edit Button Disabled */}
              <button
                disabled
                className="btn-primary flex items-center space-x-2 opacity-50 cursor-not-allowed"
                title="Editing is temporarily disabled"
              >
                <Edit size={18} />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Profile Form/Display */}
            {isEditing && !updatesDisabled ? (
              <ProfileForm 
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                isUploading={isUploading}
              />
            ) : (
              <ProfileDisplay 
                user={user}
                formData={formData}
              />
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <StatsGrid 
          stats={stats}
          getRoleColor={() => roleColor}
        />

        {/* Permissions Section */}
        <PermissionsSection 
          user={user}
          getUserRoleDisplay={getUserRoleDisplay}
          getRoleCategory={() => roleCategory}
        />
      </div>
    </div>
  )
}

export default CoreMemberProfile
