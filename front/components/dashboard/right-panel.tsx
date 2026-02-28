'use client'

import { useState } from 'react'

interface RightPanelProps {
  selectedRecord: string
}

export default function RightPanel({ selectedRecord }: RightPanelProps) {
  const [selectedICDs, setSelectedICDs] = useState<string[]>([])

  const icdCodes = [
    { code: 'G89.29', name: 'Other chronic pain', conf: 0.92 },
    { code: 'M79.3', name: 'Myalgia', conf: 0.88 },
    { code: 'R51.9', name: 'Headache', conf: 0.95 },
    { code: 'F41.1', name: 'Generalized anxiety', conf: 0.71 },
  ]

  const alerts = [
    {
      type: 'ok',
      title: 'Vital signs stable',
      msg: 'All measurements within normal range',
      icon: '✓',
    },
    {
      type: 'warn',
      title: 'Medication interaction alert',
      msg: 'Check drug interactions with current regimen',
      icon: '⚠️',
    },
    {
      type: 'danger',
      title: 'Missing lab results',
      msg: 'Previous bloodwork not on file',
      icon: '!',
    },
  ]

  const toggleICD = (code: string) => {
    setSelectedICDs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  return (
    <div
      className="w-64 border-l flex flex-col overflow-hidden"
      style={{
        borderColor: 'rgba(0,200,150,0.15)',
        background: 'rgba(12,21,32,.6)',
      }}
    >
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,200,150,0.15) transparent',
        }}
      >
        {/* ICD Codes */}
        <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(0,200,150,0.15)' }}>
          <div
            className="flex items-center gap-2 mb-3 text-xs uppercase"
            style={{ color: '#5A7A6E', letterSpacing: '2px' }}
          >
            <span>Diagnoses</span>
            <div
              className="flex-1 h-px"
              style={{ background: 'rgba(0,200,150,0.15)' }}
            />
          </div>
          <div className="space-y-1.5">
            {icdCodes.map((item) => (
              <div
                key={item.code}
                onClick={() => toggleICD(item.code)}
                className="p-2.5 rounded-lg border cursor-pointer transition-all"
                style={{
                  background: selectedICDs.includes(item.code)
                    ? 'rgba(0,200,150,.1)'
                    : 'rgba(255,255,255,.03)',
                  borderColor: selectedICDs.includes(item.code)
                    ? 'rgba(0,200,150,.4)'
                    : 'rgba(0,200,150,0.15)',
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div
                    className="text-xs font-semibold uppercase"
                    style={{
                      color: '#00A3FF',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {item.code}
                  </div>
                  {selectedICDs.includes(item.code) && (
                    <span style={{ color: '#00C896' }}>✓</span>
                  )}
                </div>
                <div
                  className="text-xs mb-1.5 leading-tight"
                  style={{ color: '#5A7A6E' }}
                >
                  {item.name}
                </div>
                <div
                  className="h-0.5 rounded-sm overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,.05)',
                  }}
                >
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{
                      width: `${item.conf * 100}%`,
                      background: `linear-gradient(90deg, #00C896, #00E6B0)`,
                    }}
                  />
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: '#5A7A6E' }}
                >
                  Confidence: {(item.conf * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-4 pb-4 border-b" style={{ borderColor: 'rgba(0,200,150,0.15)' }}>
          <div
            className="flex items-center gap-2 mb-3 text-xs uppercase"
            style={{ color: '#5A7A6E', letterSpacing: '2px' }}
          >
            <span>System Alerts</span>
            <div
              className="flex-1 h-px"
              style={{ background: 'rgba(0,200,150,0.15)' }}
            />
          </div>
          <div className="space-y-1.5">
            {alerts.map((alert, i) => {
              const bgColor = {
                ok: 'rgba(0,200,150,.06)',
                warn: 'rgba(255,149,0,.06)',
                danger: 'rgba(255,77,109,.06)',
              }[alert.type]
              const borderColor = {
                ok: 'rgba(0,200,150,.15)',
                warn: 'rgba(255,149,0,.15)',
                danger: 'rgba(255,77,109,.15)',
              }[alert.type]
              const iconColor = {
                ok: '#00C896',
                warn: '#FF9500',
                danger: '#FF4D6D',
              }[alert.type]

              return (
                <div
                  key={i}
                  className="p-2.5 rounded-lg flex gap-2 items-start text-xs cursor-pointer transition-all"
                  style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <span
                    className="text-sm flex-shrink-0 mt-0.5"
                    style={{ color: iconColor }}
                  >
                    {alert.icon}
                  </span>
                  <div className="flex-1">
                    <div
                      className="font-semibold mb-0.5 block"
                      style={{ color: '#E8F4F0' }}
                    >
                      {alert.title}
                    </div>
                    <div style={{ color: '#5A7A6E', lineHeight: '1.4' }}>
                      {alert.msg}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* NER Tags */}
        <div className="pb-4 border-b" style={{ borderColor: 'rgba(0,200,150,0.15)' }}>
          <div
            className="flex items-center gap-2 mb-3 text-xs uppercase"
            style={{ color: '#5A7A6E', letterSpacing: '2px' }}
          >
            <span>Entities</span>
            <div
              className="flex-1 h-px"
              style={{ background: 'rgba(0,200,150,0.15)' }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { text: 'Hypertension', type: 'sym', bg: 'rgba(0,200,150,.1)', color: '#00C896' },
              { text: 'Metformin', type: 'drug', bg: 'rgba(0,163,255,.1)', color: '#00A3FF' },
              { text: 'BP 140/90', type: 'vital', bg: 'rgba(123,97,255,.1)', color: '#7B61FF' },
              { text: 'Recent stress', type: 'hist', bg: 'rgba(255,149,0,.1)', color: '#FF9500' },
            ].map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full border cursor-pointer transition-all inline-block"
                style={{
                  background: tag.bg,
                  color: tag.color,
                  borderColor: `${tag.bg}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {tag.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Verify Button */}
      <div
        className="p-3 border-t flex flex-col flex-shrink-0"
        style={{
          borderColor: 'rgba(0,200,150,0.15)',
        }}
      >
        <button
          className="w-full py-3 rounded-lg border-none text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #00C896, #00A875)',
            color: '#050A0F',
            boxShadow: '0 0 18px rgba(0,200,150,.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 28px rgba(0,200,150,.5)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 18px rgba(0,200,150,.3)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          ✓ VERIFY & SIGN
        </button>
        <div
          className="mt-1.5 text-xs text-center leading-tight"
          style={{ color: '#5A7A6E' }}
        >
          Review and approve clinical documentation
        </div>
      </div>
    </div>
  )
}
