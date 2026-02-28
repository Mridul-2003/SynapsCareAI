'use client'

import { useState } from 'react'

export default function Analytics() {
  const [activePeriod, setActivePeriod] = useState('week')

  const metrics = [
    { label: 'Total Records', value: '1,248', icon: '📋', delta: '+12%' },
    { label: 'Avg Processing', value: '2.3s', icon: '⚡', delta: '-8%' },
    { label: 'Accuracy Rate', value: '98.7%', icon: '✓', delta: '+2.1%' },
    { label: 'Active Users', value: '342', icon: '👥', delta: '+5%' },
  ]

  const barData = [
    { label: 'Mon', value: 65 },
    { label: 'Tue', value: 78 },
    { label: 'Wed', value: 71 },
    { label: 'Thu', value: 82 },
    { label: 'Fri', value: 95 },
    { label: 'Sat', value: 72 },
    { label: 'Sun', value: 68 },
  ]

  const recentRecords = [
    { patient: 'John Smith', date: '2024-02-28', status: 'Complete', confidence: '99%' },
    { patient: 'Sarah Johnson', date: '2024-02-28', status: 'Processing', confidence: '—' },
    { patient: 'Michael Chen', date: '2024-02-27', status: 'Complete', confidence: '97%' },
  ]

  return (
    <div
      className="flex flex-col overflow-y-auto flex-1 p-7 gap-6"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,200,150,0.15) transparent',
      }}
    >
      {/* Title */}
      <div>
        <div className="text-2xl font-bold mb-1" style={{ color: '#E8F4F0' }}>
          System <span style={{ color: '#00C896' }}>Analytics</span>
        </div>
        <div className="text-xs" style={{ color: '#5A7A6E' }}>
          Real-time performance metrics and insights
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map((metric, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border cursor-pointer transition-all"
            style={{
              background: 'rgba(255,255,255,.02)',
              borderColor: 'rgba(0,200,150,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,200,150,.3)'
              e.currentTarget.style.background = 'rgba(0,200,150,.04)'
              e.currentTarget.style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,200,150,0.15)'
              e.currentTarget.style.background = 'rgba(255,255,255,.02)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="text-2xl mb-2">{metric.icon}</div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#E8F4F0' }}>
              {metric.value}
            </div>
            <div className="text-xs mb-2" style={{ color: '#5A7A6E' }}>
              {metric.label}
            </div>
            <span
              className="text-xs px-2 py-1 rounded-lg inline-block"
              style={{
                background:
                  metric.delta.startsWith('+') ?
                    'rgba(0,200,150,.15)'
                    : 'rgba(255,77,109,.15)',
                color:
                  metric.delta.startsWith('+')
                    ? '#00C896'
                    : '#FF4D6D',
              }}
            >
              {metric.delta}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bar Chart */}
        <div
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(255,255,255,.02)',
            borderColor: 'rgba(0,200,150,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase" style={{ letterSpacing: '1px' }}>
              Records Processed
            </div>
            <button
              className="text-xs px-2 py-1 rounded border cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,.04)',
                borderColor: 'rgba(0,200,150,0.15)',
                color: '#5A7A6E',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#00C896'
                e.currentTarget.style.borderColor = '#00C896'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#5A7A6E'
                e.currentTarget.style.borderColor = 'rgba(0,200,150,0.15)'
              }}
            >
              Week
            </button>
          </div>
          <div className="flex items-end gap-1 h-28">
            {barData.map((item, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 h-full"
              >
                <div
                  className="w-full rounded-t transition-all cursor-pointer"
                  style={{
                    height: `${(item.value / 100) * 100}%`,
                    background: 'linear-gradient(180deg, #00C896, rgba(0,200,150,.3))',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(180deg, #00E6B0, rgba(0,200,150,.5))'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(180deg, #00C896, rgba(0,200,150,.3))'
                  }}
                />
                <span className="text-xs" style={{ color: '#5A7A6E' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        <div
          className="p-4 rounded-lg border flex items-center gap-4"
          style={{
            background: 'rgba(255,255,255,.02)',
            borderColor: 'rgba(0,200,150,0.15)',
          }}
        >
          <div className="flex-1">
            <div className="text-xs font-bold uppercase mb-3" style={{ letterSpacing: '1px' }}>
              Status Distribution
            </div>
            <svg className="w-24 h-24" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(0,200,150,0.3)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#00C896"
                strokeWidth="8"
                strokeDasharray="75 100"
              />
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: 'Complete', value: '75%', color: '#00C896' },
              { label: 'Processing', value: '20%', color: '#FF9500' },
              { label: 'Draft', value: '5%', color: '#5A7A6E' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                <div
                  className="w-2.5 h-2.5 rounded"
                  style={{ background: item.color }}
                />
                <span style={{ color: '#E8F4F0' }}>{item.label}</span>
                <span style={{ color: '#5A7A6E', marginLeft: 'auto' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          borderColor: 'rgba(0,200,150,0.15)',
        }}
      >
        <div
          className="grid grid-cols-5 gap-3 p-3 text-xs uppercase"
          style={{
            background: 'rgba(255,255,255,.03)',
            borderBottomColor: 'rgba(0,200,150,0.15)',
            borderBottomWidth: '1px',
            color: '#5A7A6E',
            letterSpacing: '1px',
          }}
        >
          <div>Patient</div>
          <div>Date</div>
          <div>Status</div>
          <div>Confidence</div>
          <div>Action</div>
        </div>
        {recentRecords.map((record, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-3 p-3 text-xs border-b cursor-pointer transition-all"
            style={{
              borderBottomColor: 'rgba(0,200,150,.05)',
              color: '#E8F4F0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,200,150,.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div>{record.patient}</div>
            <div>{record.date}</div>
            <div
              style={{
                color:
                  record.status === 'Complete'
                    ? '#00C896'
                    : '#FF9500',
              }}
            >
              {record.status}
            </div>
            <div>{record.confidence}</div>
            <div style={{ color: '#00C896', cursor: 'pointer' }}>View →</div>
          </div>
        ))}
      </div>

      {/* Period Buttons */}
      <div className="flex gap-1.5">
        {['day', 'week', 'month', 'year'].map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className="px-3.5 py-1.5 rounded-full text-xs border cursor-pointer transition-all font-medium"
            style={{
              background:
                activePeriod === period ? 'rgba(0,200,150,.1)' : 'transparent',
              borderColor:
                activePeriod === period
                  ? '#00C896'
                  : 'rgba(0,200,150,0.15)',
              color: activePeriod === period ? '#00C896' : '#5A7A6E',
            }}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
