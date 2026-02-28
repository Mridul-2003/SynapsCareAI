'use client'

import { useState } from 'react'

export default function Records() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const records = [
    {
      id: 1,
      patient: 'John Smith',
      date: '2024-02-28',
      time: '14:30',
      status: 'complete',
      duration: '12 min',
      confidence: '99%',
    },
    {
      id: 2,
      patient: 'Sarah Johnson',
      date: '2024-02-28',
      time: '13:15',
      status: 'processing',
      duration: '8 min',
      confidence: '—',
    },
    {
      id: 3,
      patient: 'Michael Chen',
      date: '2024-02-27',
      time: '16:45',
      status: 'complete',
      duration: '15 min',
      confidence: '97%',
    },
    {
      id: 4,
      patient: 'Emma Wilson',
      date: '2024-02-27',
      time: '10:20',
      status: 'draft',
      duration: '5 min',
      confidence: '—',
    },
    {
      id: 5,
      patient: 'David Brown',
      date: '2024-02-26',
      time: '11:30',
      status: 'complete',
      duration: '10 min',
      confidence: '98%',
    },
    {
      id: 6,
      patient: 'Lisa Anderson',
      date: '2024-02-26',
      time: '09:00',
      status: 'complete',
      duration: '14 min',
      confidence: '96%',
    },
  ]

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm)
    const matchesFilter =
      filterStatus === 'all' || record.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return { bg: 'rgba(0,200,150,.15)', text: '#00C896' }
      case 'processing':
        return { bg: 'rgba(255,149,0,.15)', text: '#FF9500' }
      case 'draft':
        return { bg: 'rgba(255,255,255,.06)', text: '#5A7A6E' }
      default:
        return { bg: 'rgba(255,255,255,.06)', text: '#5A7A6E' }
    }
  }

  return (
    <div
      className="flex flex-col overflow-hidden flex-1 p-7 gap-5"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,200,150,0.15) transparent',
      }}
    >
      {/* Header */}
      <div>
        <div className="text-2xl font-bold" style={{ color: '#E8F4F0' }}>
          All <span style={{ color: '#00C896' }}>Records</span>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border flex-1 max-w-xs"
          style={{
            background: 'rgba(255,255,255,.03)',
            borderColor: 'rgba(0,200,150,0.15)',
          }}
        >
          <span style={{ color: '#5A7A6E' }}>🔍</span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-none border-none outline-none flex-1 text-xs"
            style={{
              color: '#E8F4F0',
              fontFamily: "'DM Mono', monospace",
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {['all', 'complete', 'processing', 'draft'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className="px-3 py-1.5 rounded-full text-xs border cursor-pointer transition-all font-medium"
              style={{
                background:
                  filterStatus === filter ? 'rgba(0,200,150,.1)' : 'transparent',
                borderColor:
                  filterStatus === filter
                    ? '#00C896'
                    : 'rgba(0,200,150,0.15)',
                color: filterStatus === filter ? '#00C896' : '#5A7A6E',
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto">
        {filteredRecords.map((record) => {
          const statusColor = getStatusColor(record.status)
          return (
            <div
              key={record.id}
              className="p-4 rounded-lg border cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,.02)',
                borderColor: 'rgba(0,200,150,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,200,150,.3)'
                e.currentTarget.style.background = 'rgba(0,200,150,.04)'
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,200,150,0.15)'
                e.currentTarget.style.background = 'rgba(255,255,255,.02)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#E8F4F0' }}>
                    {record.patient}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: '#5A7A6E' }}
                  >
                    {record.date} at {record.time}
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: statusColor.bg,
                    color: statusColor.text,
                  }}
                >
                  {record.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-4 text-xs" style={{ color: '#5A7A6E' }}>
                <span>Duration: {record.duration}</span>
                <span>
                  Confidence:{' '}
                  <span
                    style={{
                      color: record.confidence === '—' ? '#5A7A6E' : '#00C896',
                    }}
                  >
                    {record.confidence}
                  </span>
                </span>
                <span style={{ color: '#00C896', marginLeft: 'auto', cursor: 'pointer' }}>
                  View details →
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
