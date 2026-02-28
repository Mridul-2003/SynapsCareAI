'use client'

interface TopBarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function TopBar({ currentPage, setCurrentPage }: TopBarProps) {
  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'records', label: 'RECORDS' },
    { id: 'settings', label: 'SETTINGS' },
  ]

  return (
    <div
      className="flex items-center justify-between px-7 py-4 border-b sticky top-0 z-100 backdrop-blur-md flex-shrink-0"
      style={{
        borderColor: 'rgba(0,200,150,0.15)',
        background: 'rgba(5,10,15,.85)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 cursor-pointer">
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

      {/* Navigation Pills */}
      <div className="flex gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className="px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border"
            style={{
              fontSize: '11px',
              letterSpacing: '0.5px',
              background:
                currentPage === item.id ? 'rgba(0,200,150,.1)' : 'transparent',
              borderColor:
                currentPage === item.id ? 'rgba(0,200,150,0.15)' : 'transparent',
              color: currentPage === item.id ? '#00C896' : '#5A7A6E',
              boxShadow:
                currentPage === item.id ? '0 0 12px rgba(0,200,150,.15)' : 'none',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Status Indicator */}
      <div
        className="flex items-center gap-2 text-xs"
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
