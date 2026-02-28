'use client'

import { useState } from 'react'
import TopBar from '@/components/topbar'
import Dashboard from '@/components/dashboard'
import Analytics from '@/components/analytics'
import Records from '@/components/records'
import Settings from '@/components/settings'

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: '#050A0F' }}>
      {/* Background Grid and Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,200,150,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,200,150,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Orb 1 */}
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: '#00C896',
            top: '-200px',
            left: '-150px',
            animation: 'driftA 18s ease-in-out infinite',
          }}
        />
        {/* Orb 2 */}
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: '#00A3FF',
            bottom: '-100px',
            right: '-100px',
            animation: 'driftB 22s ease-in-out infinite',
          }}
        />
        {/* Orb 3 */}
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: '#7B61FF',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'driftC 15s ease-in-out infinite',
          }}
        />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes driftA {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 40px); }
        }
        @keyframes driftB {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, -60px); }
        }
        @keyframes driftC {
          0%, 100% { transform: translate(-50%, -50%); }
          50% { transform: translate(-45%, -55%); }
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <TopBar currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* Page Content */}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'analytics' && <Analytics />}
        {currentPage === 'records' && <Records />}
        {currentPage === 'settings' && <Settings />}
      </div>
    </div>
  )
}
