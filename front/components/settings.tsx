'use client'

import { useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoSave: true,
    analytics: true,
  })

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div
      className="grid grid-cols-[220px_1fr] gap-0 h-[calc(100vh-66px)]"
    >
      {/* Left Sidebar Menu */}
      <div
        className="border-r flex flex-col overflow-hidden"
        style={{
          borderColor: 'rgba(0,200,150,0.15)',
          background: 'rgba(12,21,32,.6)',
        }}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div
            className="text-xs font-bold uppercase mb-4"
            style={{
              color: '#5A7A6E',
              letterSpacing: '2px',
            }}
          >
            Settings
          </div>
          {[
            { id: 'account', label: 'Account Settings' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'privacy', label: 'Privacy & Security' },
            { id: 'integrations', label: 'Integrations' },
            { id: 'billing', label: 'Billing' },
            { id: 'about', label: 'About' },
          ].map((item) => (
            <div
              key={item.id}
              className="px-3 py-2 rounded-lg cursor-pointer transition-all mb-1 text-xs"
              style={{
                background:
                  item.id === 'account' ? 'rgba(0,200,150,.1)' : 'transparent',
                color:
                  item.id === 'account' ? '#00C896' : '#5A7A6E',
              }}
              onMouseEnter={(e) => {
                if (item.id !== 'account') {
                  e.currentTarget.style.background = 'rgba(0,200,150,.05)'
                  e.currentTarget.style.color = '#00C896'
                }
              }}
              onMouseLeave={(e) => {
                if (item.id !== 'account') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#5A7A6E'
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* User Info */}
        <div
          className="p-4 border-t"
          style={{
            borderColor: 'rgba(0,200,150,0.15)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
              style={{
                background: 'linear-gradient(135deg, #00C896, #00A3FF)',
                color: '#050A0F',
              }}
            >
              A
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: '#E8F4F0' }}>
                Admin User
              </div>
              <div className="text-xs" style={{ color: '#5A7A6E' }}>
                Premium Plan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div
        className="overflow-y-auto p-8"
        style={{
          background: 'rgba(12,21,32,.4)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,200,150,0.15) transparent',
        }}
      >
        <div>
          <div className="text-2xl font-bold mb-1" style={{ color: '#E8F4F0' }}>
            Account <span style={{ color: '#00C896' }}>Settings</span>
          </div>
          <div className="text-xs mb-6" style={{ color: '#5A7A6E' }}>
            Manage your account preferences and settings
          </div>

          {/* Settings Sections */}
          <div className="space-y-6 max-w-2xl">
            {/* Profile Section */}
            <div
              className="p-4 rounded-lg border"
              style={{
                background: 'rgba(255,255,255,.02)',
                borderColor: 'rgba(0,200,150,0.15)',
              }}
            >
              <div className="text-sm font-semibold mb-4" style={{ color: '#E8F4F0' }}>
                Profile Information
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Full Name', value: 'Administrator' },
                  { label: 'Email', value: 'admin@synapscare.ai' },
                  { label: 'Organization', value: 'SynapseCare Medical' },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="text-xs mb-1.5 block" style={{ color: '#5A7A6E' }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      defaultValue={field.value}
                      className="w-full px-3 py-2 rounded border text-xs outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,.03)',
                        borderColor: 'rgba(0,200,150,0.15)',
                        color: '#E8F4F0',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#00C896'
                        e.target.style.boxShadow = '0 0 0 1px rgba(0,200,150,.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(0,200,150,0.15)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Preferences Section */}
            <div
              className="p-4 rounded-lg border"
              style={{
                background: 'rgba(255,255,255,.02)',
                borderColor: 'rgba(0,200,150,0.15)',
              }}
            >
              <div className="text-sm font-semibold mb-4" style={{ color: '#E8F4F0' }}>
                Preferences
              </div>
              <div className="space-y-3">
                {[
                  { key: 'notifications', label: 'Enable Notifications' },
                  { key: 'autoSave', label: 'Auto-save Records' },
                  { key: 'analytics', label: 'Share Usage Analytics' },
                ].map((pref) => (
                  <div
                    key={pref.key}
                    className="flex items-center justify-between p-2 rounded"
                  >
                    <label className="text-xs cursor-pointer" style={{ color: '#E8F4F0' }}>
                      {pref.label}
                    </label>
                    <button
                      onClick={() => toggleSetting(pref.key as keyof typeof settings)}
                      className="w-10 h-5 rounded-full transition-all border-none cursor-pointer relative"
                      style={{
                        background: settings[pref.key as keyof typeof settings]
                          ? '#00C896'
                          : 'rgba(255,255,255,.1)',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                        style={{
                          background: 'white',
                          left: settings[pref.key as keyof typeof settings]
                            ? '22px'
                            : '2px',
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Section */}
            <div
              className="p-4 rounded-lg border"
              style={{
                background: 'rgba(255,255,255,.02)',
                borderColor: 'rgba(0,200,150,0.15)',
              }}
            >
              <div className="text-sm font-semibold mb-4" style={{ color: '#E8F4F0' }}>
                Security
              </div>
              <div className="space-y-2">
                <button
                  className="w-full px-3 py-2 rounded border text-xs font-semibold cursor-pointer transition-all"
                  style={{
                    background: 'transparent',
                    borderColor: 'rgba(0,200,150,0.15)',
                    color: '#E8F4F0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FF9500'
                    e.currentTarget.style.color = '#FF9500'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,200,150,0.15)'
                    e.currentTarget.style.color = '#E8F4F0'
                  }}
                >
                  Change Password
                </button>
                <button
                  className="w-full px-3 py-2 rounded border text-xs font-semibold cursor-pointer transition-all"
                  style={{
                    background: 'transparent',
                    borderColor: 'rgba(255,77,109,0.15)',
                    color: '#FF4D6D',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FF4D6D'
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(255,77,109,.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,77,109,0.15)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Logout All Sessions
                </button>
              </div>
            </div>

            {/* System Info */}
            <div
              className="p-4 rounded-lg border"
              style={{
                background: 'rgba(255,255,255,.02)',
                borderColor: 'rgba(0,200,150,0.15)',
              }}
            >
              <div className="text-sm font-semibold mb-4" style={{ color: '#E8F4F0' }}>
                System Information
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: '#5A7A6E' }}>API Version</span>
                  <span style={{ color: '#E8F4F0' }}>v2.4.1</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5A7A6E' }}>Model Version</span>
                  <span style={{ color: '#E8F4F0' }}>GPT-4 Turbo</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5A7A6E' }}>Database</span>
                  <span style={{ color: '#E8F4F0' }}>PostgreSQL 15</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              className="w-full py-3 rounded-lg border-none text-sm font-bold cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, #00C896, #00A875)',
                color: '#050A0F',
                boxShadow: '0 0 18px rgba(0,200,150,.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 0 28px rgba(0,200,150,.5)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 0 18px rgba(0,200,150,.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
