'use client'

import { useState } from 'react'

interface CenterPanelProps {
  selectedRecord: string
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function CenterPanel({
  selectedRecord,
  activeTab,
  onTabChange,
}: CenterPanelProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [waveformBars] = useState(
    Array.from({ length: 40 }, () => Math.random() * 100)
  )

  const patientData = {
    'rec-001': { name: 'John Smith', dob: '1985-03-15', mrn: 'MRN-2024-001' },
    'rec-002': { name: 'Sarah Johnson', dob: '1990-07-22', mrn: 'MRN-2024-002' },
    'rec-003': { name: 'Michael Chen', dob: '1978-11-08', mrn: 'MRN-2024-003' },
    'rec-004': { name: 'Emma Wilson', dob: '1995-05-30', mrn: 'MRN-2024-004' },
  }

  const patient =
    patientData[selectedRecord as keyof typeof patientData] || patientData['rec-001']

  const renderTranscript = () => (
    <div className="space-y-3">
      {[
        {
          role: 'Doctor',
          avatar: 'D',
          text: 'Good morning. How are you feeling today?',
          avatarBg: 'rgba(0,163,255,.2)',
          avatarColor: '#00A3FF',
        },
        {
          role: 'Patient',
          avatar: 'P',
          text: 'I am experiencing some mild headaches for the past few days. They seem to be worse in the morning.',
          avatarBg: 'rgba(123,97,255,.2)',
          avatarColor: '#7B61FF',
        },
        {
          role: 'Doctor',
          avatar: 'D',
          text: 'I see. Let me ask a few more questions. Have you experienced any <hl>nausea or sensitivity to light</hl>? Any recent stress or changes in sleep pattern?',
          avatarBg: 'rgba(0,163,255,.2)',
          avatarColor: '#00A3FF',
        },
      ].map((msg, i) => (
        <div key={i} className="flex gap-3">
          <div
            className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
            style={{
              background: msg.avatarBg,
              color: msg.avatarColor,
            }}
          >
            {msg.avatar}
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1" style={{ color: '#5A7A6E' }}>
              <span
                className="font-semibold uppercase"
                style={{
                  color:
                    msg.role === 'Doctor' ? '#00A3FF' : '#7B61FF',
                  letterSpacing: '0.5px',
                }}
              >
                {msg.role}
              </span>
            </div>
            <div
              className="text-sm leading-relaxed"
              style={{ color: '#C5DDD5' }}
            >
              {msg.text.includes('<hl>')
                ? msg.text
                    .split(/(<hl>.*?<\/hl>)/g)
                    .map((part, j) =>
                      part.startsWith('<hl>') ? (
                        <span
                          key={j}
                          style={{
                            background: 'rgba(0,200,150,.15)',
                            color: '#00C896',
                            padding: '1px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          {part.replace(/<\/?hl>/g, '')}
                        </span>
                      ) : (
                        part
                      )
                    )
                : msg.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderSOAP = () => (
    <div className="space-y-3">
      {[
        { letter: 'S', name: 'Subjective', fullName: 'SUBJECTIVE REPORT' },
        { letter: 'O', name: 'Objective', fullName: 'OBJECTIVE FINDINGS' },
        { letter: 'A', name: 'Assessment', fullName: 'CLINICAL ASSESSMENT' },
        { letter: 'P', name: 'Plan', fullName: 'TREATMENT PLAN' },
      ].map((section, i) => {
        const bgColors = [
          'rgba(0,200,150,.2)',
          'rgba(0,163,255,.2)',
          'rgba(123,97,255,.2)',
          'rgba(255,149,0,.2)',
        ]
        const textColors = ['#00C896', '#00A3FF', '#7B61FF', '#FF9500']
        const letterBg = [
          'rgba(0,200,150,.2)',
          'rgba(0,163,255,.2)',
          'rgba(123,97,255,.2)',
          'rgba(255,149,0,.2)',
        ]
        return (
          <div
            key={i}
            className="border rounded-xl overflow-hidden transition-colors"
            style={{
              borderColor: 'rgba(0,200,150,0.15)',
            }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{
                background: 'rgba(255,255,255,.03)',
                borderColor: 'rgba(0,200,150,0.15)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold italic"
                  style={{
                    background: letterBg[i],
                    color: textColors[i],
                  }}
                >
                  {section.letter}
                </div>
                <div>
                  <div
                    className="text-xs font-bold uppercase"
                    style={{ letterSpacing: '1px' }}
                  >
                    {section.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: '#5A7A6E', letterSpacing: '0.5px' }}
                  >
                    {section.fullName}
                  </div>
                </div>
              </div>
              <span
                className="px-2 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(0,200,150,.15)',
                  color: '#00C896',
                }}
              >
                HIGH
              </span>
            </div>
            <div
              className="px-4 py-3 text-sm leading-relaxed"
              style={{ color: '#B8D4CA' }}
            >
              Sample {section.name.toLowerCase()} content extracted from the
              clinical documentation. This section contains detailed medical
              information and clinical findings.
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(12,21,32,.4)',
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between gap-4 flex-shrink-0"
        style={{
          borderColor: 'rgba(0,200,150,0.15)',
        }}
      >
        <div>
          <div
            className="text-lg font-bold mb-1"
            style={{ letterSpacing: '-0.5px', color: '#E8F4F0' }}
          >
            {patient.name}
          </div>
          <div
            className="text-xs flex gap-3 flex-wrap"
            style={{ color: '#5A7A6E' }}
          >
            <span>DOB: {patient.dob}</span>
            <span>{patient.mrn}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-none text-xs font-bold cursor-pointer transition-all flex-shrink-0"
            style={{
              background: isRecording
                ? 'linear-gradient(135deg, #FF4D6D, #c0392b)'
                : 'linear-gradient(135deg, #FF4D6D, #c0392b)',
              color: 'white',
              boxShadow: isRecording
                ? '0 0 38px rgba(255,77,109,.8)'
                : '0 0 22px rgba(255,77,109,.4)',
              animation: isRecording ? 'recPulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: 'white',
                animation: isRecording ? 'blink 0.8s infinite' : 'none',
              }}
            />
            {isRecording ? 'RECORDING' : 'RECORD'}
          </button>
          {[...Array(3)].map((_, i) => (
            <button
              key={i}
              className="w-9 h-9 rounded-lg border cursor-pointer transition-all flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,.05)',
                borderColor: 'rgba(0,200,150,0.15)',
                color: '#5A7A6E',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,200,150,.1)'
                e.currentTarget.style.borderColor = '#00C896'
                e.currentTarget.style.color = '#00C896'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.05)'
                e.currentTarget.style.borderColor = 'rgba(0,200,150,0.15)'
                e.currentTarget.style.color = '#5A7A6E'
              }}
            >
              {i === 0 ? '⬇️' : i === 1 ? '⬆️' : '⋯'}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform */}
      <div
        className="px-6 py-3 border-b flex items-center gap-3 flex-shrink-0"
        style={{
          background: 'rgba(0,200,150,.02)',
          borderColor: 'rgba(0,200,150,0.15)',
        }}
      >
        <span
          className="text-xs uppercase whitespace-nowrap"
          style={{
            letterSpacing: '2px',
            color: '#5A7A6E',
          }}
        >
          AUDIO WAVEFORM
        </span>
        <div className="flex items-center gap-0.5 flex-1 h-10">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className="w-0.5 rounded-sm flex-shrink-0"
              style={{
                height: isRecording ? `${height}%` : '4px',
                background: '#00C896',
                opacity: 0.35,
                animation: isRecording ? `wave 1s ease-in-out infinite` : 'none',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
        <span
          className="text-lg font-medium whitespace-nowrap"
          style={{
            color: '#00C896',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          00:45
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b px-6 overflow-x-auto flex-shrink-0"
        style={{
          borderColor: 'rgba(0,200,150,0.15)',
          background: 'rgba(12,21,32,.4)',
        }}
      >
        {['transcript', 'soap', 'summary'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="px-4 py-3 text-xs uppercase border-b-2 cursor-pointer transition-all whitespace-nowrap"
            style={{
              letterSpacing: '1px',
              color: activeTab === tab ? '#00C896' : '#5A7A6E',
              borderBottomColor: activeTab === tab ? '#00C896' : 'transparent',
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,200,150,0.15) transparent',
        }}
      >
        {activeTab === 'transcript' && renderTranscript()}
        {activeTab === 'soap' && renderSOAP()}
        {activeTab === 'summary' && (
          <div
            className="text-sm leading-relaxed"
            style={{ color: '#B8D4CA' }}
          >
            <p className="mb-4">
              <span style={{ color: '#E8F4F0', fontWeight: '500' }}>
                Clinical Summary:{' '}
              </span>
              Patient presents with mild headaches for several days, worse in
              mornings. Reports no nausea or photophobia.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; opacity: 0.3; }
          50% { height: var(--h); opacity: 0.8; }
        }
        @keyframes recPulse {
          0%, 100% { box-shadow: 0 0 22px rgba(255,77,109,.4); }
          50% { box-shadow: 0 0 38px rgba(255,77,109,.8); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
