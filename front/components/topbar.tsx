'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TopBarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function TopBar({ currentPage, setCurrentPage }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'records', label: 'RECORDS' },
    { id: 'settings', label: 'SETTINGS' },
  ]

  const handleNav = (id: string) => {
    setCurrentPage(id)
    setMenuOpen(false)
  }

  return (
    <>
      <div
        className="flex items-center justify-between px-4 md:px-7 py-3 md:py-4 border-b sticky top-0 z-[100] backdrop-blur-md flex-shrink-0"
        style={{
          borderColor: 'rgba(0,200,150,0.15)',
          background: 'rgba(5,10,15,.85)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
          onClick={() => { router.push('/'); setCurrentPage('dashboard') }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #00C896, #00A3FF)',
              boxShadow: '0 0 20px rgba(0,200,150,.4)',
              color: 'white',
            }}
          >
            ⚕️
          </div>
          <div className="flex items-center gap-1">
            <span
              className="font-bold text-base"
              style={{ letterSpacing: '-0.5px', color: '#E8F4F0' }}
            >
              Synapse<span style={{ color: '#00C896' }}>Care</span>
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full border"
              style={{
                background: 'rgba(0,200,150,.15)',
                borderColor: '#00C896',
                color: '#00C896',
                letterSpacing: '1.5px',
              }}
            >
              AI
            </span>
          </div>
        </div>

        {/* Desktop Navigation Pills */}
        <div className="hidden md:flex gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border"
              style={{
                fontSize: '11px',
                letterSpacing: '0.5px',
                background:
                  currentPage === item.id ? 'rgba(0,200,150,.1)' : 'transparent',
                borderColor:
                  currentPage === item.id
                    ? 'rgba(0,200,150,0.15)'
                    : 'transparent',
                color: currentPage === item.id ? '#00C896' : '#5A7A6E',
                boxShadow:
                  currentPage === item.id
                    ? '0 0 12px rgba(0,200,150,.15)'
                    : 'none',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop Status Indicator */}
        <div
          className="hidden md:flex items-center gap-2 text-xs"
          style={{ color: '#5A7A6E' }}
        >
          <span>SYSTEM STATUS</span>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: '#00C896',
              boxShadow: '0 0 8px #00C896',
              animation: 'pulse 2s infinite',
            }}
          />
        </div>

        {/* Mobile Right: status dot + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: '#00C896',
              boxShadow: '0 0 8px #00C896',
              animation: 'pulse 2s infinite',
            }}
          />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-1.5 p-1 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <span
              className="block w-5 h-0.5 rounded-full transition-all duration-200"
              style={{
                background: menuOpen ? '#00C896' : '#5A7A6E',
                transform: menuOpen
                  ? 'rotate(45deg) translate(3px, 6px)'
                  : 'none',
              }}
            />
            <span
              className="block w-5 h-0.5 rounded-full transition-all duration-200"
              style={{
                background: '#5A7A6E',
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-5 h-0.5 rounded-full transition-all duration-200"
              style={{
                background: menuOpen ? '#00C896' : '#5A7A6E',
                transform: menuOpen
                  ? 'rotate(-45deg) translate(3px, -6px)'
                  : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div
          className="md:hidden sticky top-[57px] z-[99] border-b"
          style={{
            background: 'rgba(5,10,15,.97)',
            borderColor: 'rgba(0,200,150,0.15)',
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="w-full flex items-center justify-between px-6 py-3.5 text-left text-xs font-medium border-b transition-colors cursor-pointer"
              style={{
                borderColor: 'rgba(0,200,150,0.08)',
                background:
                  currentPage === item.id
                    ? 'rgba(0,200,150,.07)'
                    : 'transparent',
                color: currentPage === item.id ? '#00C896' : '#5A7A6E',
                letterSpacing: '1px',
              }}
            >
              <span>{item.label}</span>
              {currentPage === item.id && (
                <span style={{ color: '#00C896', fontSize: '8px' }}>●</span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  )
}
