'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/sidebar'
import RightPanel from '@/components/dashboard/right-panel'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type TranscriptEntry = {
  timestamp: string
  text: string
  speaker?: string
}

type Consultation = {
  consultationID: string
  createdAt: string
  status: string
  patientName: string
  doctorName: string
  patientDob: string
  transcript: TranscriptEntry[]
  soap: Record<string, any>
  summary: string
  diagnoses: any[]
  entities: any[]
}

export default function ConsultationDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [data, setData] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/consultations/${id}`)
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(
            (body as { detail?: string }).detail || 'Failed to load consultation',
          )
        }
        setData(body as Consultation)
      } catch (err: any) {
        setError(err.message || 'Failed to load consultation')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const createdDate =
    data?.createdAt ? new Date(data.createdAt).toLocaleString() : ''

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{ background: '#050A0F' }}
    >
      {/* Background Grid and Orbs (same theme as main dashboard) */}
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
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: '#00C896',
            top: '-200px',
            left: '-150px',
            animation: 'driftA 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: '#00A3FF',
            bottom: '-100px',
            right: '-100px',
            animation: 'driftB 22s ease-in-out infinite',
          }}
        />
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

      {/* Foreground layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            selectedRecord={id || ''}
            onSelectRecord={(recordId) => router.push(`/dashboard/${recordId}`)}
          />

          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ background: 'rgba(12,21,32,.4)' }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: 'rgba(0,200,150,0.15)' }}
            >
              <div>
                <div className="text-lg font-bold" style={{ color: '#E8F4F0' }}>
                  {data?.patientName || 'Unknown patient'}
                </div>
                <div className="text-xs" style={{ color: '#5A7A6E' }}>
                  {data?.doctorName && <>Doctor: {data.doctorName} | </>}
                  {data?.patientDob && <>DOB: {data.patientDob} | </>}
                  {createdDate && <>Created: {createdDate}</>}
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold border-none cursor-pointer"
                style={{
                  background: 'rgba(0,200,150,.12)',
                  color: '#00C896',
                  boxShadow: '0 0 14px rgba(0,200,150,.35)',
                }}
                onClick={() => router.push('/dashboard')}
              >
                ← Back to live view
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)] gap-4 p-6 overflow-hidden">
              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                {/* Summary */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'rgba(255,255,255,.02)',
                    borderColor: 'rgba(0,200,150,0.15)',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase mb-2"
                    style={{ color: '#5A7A6E', letterSpacing: '1.5px' }}
                  >
                    Clinical Summary
                  </div>
                  <div className="text-sm" style={{ color: '#C5DDD5' }}>
                    {data?.summary ? data.summary : 'No summary available.'}
                  </div>
                </div>

                {/* SOAP */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'rgba(255,255,255,.02)',
                    borderColor: 'rgba(0,200,150,0.15)',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase mb-3"
                    style={{ color: '#5A7A6E', letterSpacing: '1.5px' }}
                  >
                    SOAP Note
                  </div>
                  {data?.soap && Object.keys(data.soap).length > 0 ? (
                    <div className="space-y-3">
                      {['subjective', 'objective', 'assessment', 'plan'].map(
                        (key) => {
                          const value =
                            (data.soap as any)[key] ??
                            (data.soap as any)[
                              key.charAt(0).toUpperCase() + key.slice(1)
                            ]
                          if (!value) return null
                          const label =
                            key === 'subjective'
                              ? 'S — Subjective'
                              : key === 'objective'
                                ? 'O — Objective'
                                : key === 'assessment'
                                  ? 'A — Assessment'
                                  : 'P — Plan'
                          return (
                            <div
                              key={key}
                              className="rounded-lg p-3"
                              style={{
                                background: 'rgba(0,200,150,0.04)',
                                border: '1px solid rgba(0,200,150,0.15)',
                              }}
                            >
                              <div
                                className="text-xs font-semibold mb-1"
                                style={{ color: '#00C896' }}
                              >
                                {label}
                              </div>
                              <div
                                className="text-sm"
                                style={{
                                  color: '#C5DDD5',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {typeof value === 'string'
                                  ? value
                                  : JSON.stringify(value, null, 2)}
                              </div>
                            </div>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    <div className="text-sm" style={{ color: '#5A7A6E' }}>
                      No SOAP note stored for this consultation.
                    </div>
                  )}
                </div>

                {/* Transcript */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'rgba(5,10,15,.9)',
                    borderColor: 'rgba(0,200,150,0.15)',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase mb-3"
                    style={{ color: '#5A7A6E', letterSpacing: '1.5px' }}
                  >
                    Transcript
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {data?.transcript && data.transcript.length > 0 ? (
                      data.transcript.map((line, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{
                              background: 'rgba(0,200,150,.2)',
                              color: '#00C896',
                            }}
                          >
                            AI
                          </div>
                          <div className="flex-1">
                            <div
                              className="text-[11px]"
                              style={{ color: '#5A7A6E' }}
                            >
                              {line.timestamp}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: '#C5DDD5' }}
                            >
                              {line.text}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm" style={{ color: '#5A7A6E' }}>
                        No transcript captured for this consultation.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: diagnoses + entities reuse RightPanel */}
              <RightPanel
                selectedRecord={id || ''}
                diagnoses={data?.diagnoses || []}
                entities={data?.entities || []}
                isLoading={loading}
              />
            </div>

            {loading && (
              <div
                className="absolute inset-0 flex items-center justify-center text-xs"
                style={{
                  background: 'rgba(5,10,15,.6)',
                  color: '#5A7A6E',
                }}
              >
                Loading consultation...
              </div>
            )}

            {error && !loading && (
              <div
                className="absolute inset-x-0 bottom-4 mx-auto max-w-md text-xs px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(255,77,109,0.14)',
                  color: '#FFB3C3',
                  border: '1px solid rgba(255,77,109,0.4)',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

