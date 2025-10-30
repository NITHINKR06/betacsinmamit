import { useState } from 'react'
import { Download, CreditCard, X, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const QuickActions = () => {
  const [showCertModal, setShowCertModal] = useState(false)

  const downloadCertificate = () => {
    // For now, show modal that certificate download is unavailable
    setShowCertModal(true)
  }

  const manageMembership = () => {
    // Implement membership management logic
    // console.log('Manage membership')
  }

  return (
    <div className="glass-card rounded-xl p-6 mt-6">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <button
          onClick={downloadCertificate}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Download size={18} />
            Download Certificate
          </span>
        </button>
        <button 
          onClick={manageMembership}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <CreditCard size={18} />
            Manage Membership
          </span>
        </button>
      </div>

      {/* Certificate Unavailable Modal */}
      {showCertModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCertModal(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setShowCertModal(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold">Certificate download unavailable</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                For now, this feature is not available. Please contact the Core members of CSI to get your certificate.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickActions
