import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { Shield } from 'lucide-react'

// Determine dev mode: use Vite's flag OR VITE_APP_ENV=development
const IS_DEV_MODE = (import.meta.env?.DEV === true) || (import.meta.env?.VITE_APP_ENV === 'development')

const AdminGuard = ({ children }) => {
  const { adminUser, loading } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // In development mode, allow access without authentication
    if (IS_DEV_MODE) {
      return
    }
    
    if (!loading && !adminUser) {
      navigate('/admin/login')
    }
  }, [adminUser, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#417690] border-t-transparent"></div>
          <p className="mt-4 text-[#666]">Loading...</p>
        </div>
      </div>
    )
  }

  // In development mode, always allow access
  if (IS_DEV_MODE) {
    return children
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
        <div className="bg-white border border-[#ddd] rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f8d7da] rounded-full mb-4">
            <Shield className="w-8 h-8 text-[#721c24]" />
          </div>
          <h2 className="text-xl font-normal text-[#721c24] mb-2">Access Denied</h2>
          <p className="text-[#666] mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/admin/login')}
            className="px-6 py-2 bg-[#417690] text-white rounded hover:bg-[#205067] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default AdminGuard
