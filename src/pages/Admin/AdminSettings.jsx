import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { Save, Brush, LayoutList, Bell, Shield, Database } from 'lucide-react'

const DEFAULT_SETTINGS = {
  tableDensity: 'comfortable', // 'comfortable' | 'compact'
  sidebarDefaultOpen: true,
  stickyHeaders: true,
  notificationsEnabled: true,
  notificationSound: false,
  sessionTimeoutMinutes: 30,
  itemsPerPage: 10,
  dateFormat: 'DD MMM YYYY, HH:mm',
  // Security
  hardenRecruitProtections: true,
  blockRightClickOnSensitive: true,
  blockSelectOnSensitive: true,
  blockDevtoolsKeysOnSensitive: true,
  clipboardWatermark: true,
  cspLevel: 'standard', // 'standard' | 'strict'
}

const SETTINGS_KEY = 'adminSettings'

const AdminSettings = () => {
  const { updateSessionTimeout } = useAdminAuth()
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [saving, setSaving] = useState(false)

  // Apply density globally via a root class for admin tables
  useEffect(() => {
    const root = document.documentElement
    if (settings.tableDensity === 'compact') {
      root.classList.add('admin-compact')
    } else {
      root.classList.remove('admin-compact')
    }
  }, [settings.tableDensity])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      // Apply session timeout immediately
      if (settings.sessionTimeoutMinutes) {
        updateSessionTimeout(settings.sessionTimeoutMinutes * 60 * 1000)
      }
    } finally {
      setTimeout(() => setSaving(false), 400)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#333] dark:text-gray-100 mb-6">Admin Settings</h1>

      <div className="space-y-6">
        {/* Appearance */}
        <section className="bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded-lg">
          <div className="px-5 py-4 border-b border-[#eee] dark:border-gray-800 flex items-center gap-2">
            <Brush className="w-4 h-4 text-[#417690]" />
            <h2 className="text-sm font-medium text-[#333] dark:text-gray-200">Appearance</h2>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Table density</label>
              <select
                value={settings.tableDensity}
                onChange={(e) => handleChange('tableDensity', e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Compact reduces table cell spacing</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sticky table headers</label>
              <select
                value={settings.stickyHeaders ? 'on' : 'off'}
                onChange={(e) => handleChange('stickyHeaders', e.target.value === 'on')}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Keeps headers visible while scrolling</p>
            </div>
          </div>
        </section>

        {/* Admin UI */}
        <section className="bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded-lg">
          <div className="px-5 py-4 border-b border-[#eee] dark:border-gray-800 flex items-center gap-2">
            <LayoutList className="w-4 h-4 text-[#417690]" />
            <h2 className="text-sm font-medium text-[#333] dark:text-gray-200">Admin UI</h2>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sidebar default</label>
              <select
                value={settings.sidebarDefaultOpen ? 'open' : 'collapsed'}
                onChange={(e) => handleChange('sidebarDefaultOpen', e.target.value === 'open')}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="open">Open</option>
                <option value="collapsed">Collapsed</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applies on next admin visit</p>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded-lg">
          <div className="px-5 py-4 border-b border-[#eee] dark:border-gray-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#417690]" />
            <h2 className="text-sm font-medium text-[#333] dark:text-gray-200">Notifications</h2>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Enable notifications</label>
              <select
                value={settings.notificationsEnabled ? 'on' : 'off'}
                onChange={(e) => handleChange('notificationsEnabled', e.target.value === 'on')}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Notification sound</label>
              <select
                value={settings.notificationSound ? 'on' : 'off'}
                onChange={(e) => handleChange('notificationSound', e.target.value === 'on')}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded-lg">
          <div className="px-5 py-4 border-b border-[#eee] dark:border-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#417690]" />
            <h2 className="text-sm font-medium text-[#333] dark:text-gray-200">Security</h2>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Session timeout</label>
              <select
                value={String(settings.sessionTimeoutMinutes)}
                onChange={(e) => handleChange('sessionTimeoutMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Clipboard watermark on copy</label>
              <select
                value={settings.clipboardWatermark ? 'on' : 'off'}
                onChange={(e) => handleChange('clipboardWatermark', e.target.value === 'on')}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Appends © CSI NMAMIT to copied text</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sensitive pages protection</label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings.hardenRecruitProtections} onChange={(e) => handleChange('hardenRecruitProtections', e.target.checked)} />
                  Harden on /recruit
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings.blockRightClickOnSensitive} onChange={(e) => handleChange('blockRightClickOnSensitive', e.target.checked)} />
                  Disable right click
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings.blockSelectOnSensitive} onChange={(e) => handleChange('blockSelectOnSensitive', e.target.checked)} />
                  Disable text selection
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings.blockDevtoolsKeysOnSensitive} onChange={(e) => handleChange('blockDevtoolsKeysOnSensitive', e.target.checked)} />
                  Block DevTools keys
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Content Security Policy</label>
              <select
                value={settings.cspLevel}
                onChange={(e) => handleChange('cspLevel', e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="standard">Standard (recommended)</option>
                <option value="strict">Strict (may break embeds)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Controls CSP applied via meta tag</p>
            </div>
          </div>
        </section>

        {/* Data & Export */}
        <section className="bg-white dark:bg-gray-900 border border-[#ddd] dark:border-gray-800 rounded-lg">
          <div className="px-5 py-4 border-b border-[#eee] dark:border-gray-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#417690]" />
            <h2 className="text-sm font-medium text-[#333] dark:text-gray-200">Data & Display</h2>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Items per page</label>
              <select
                value={String(settings.itemsPerPage)}
                onChange={(e) => handleChange('itemsPerPage', Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applied progressively to paginated tables</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Date format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#ddd] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="DD MMM YYYY, HH:mm">DD MMM YYYY, HH:mm</option>
                <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm</option>
                <option value="MMM DD, YYYY">MMM DD, YYYY</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#417690] dark:bg-gray-700 text-white hover:bg-[#205067] dark:hover:bg-gray-600 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings


