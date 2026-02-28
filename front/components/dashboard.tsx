'use client'

import { useState } from 'react'
import Sidebar from './dashboard/sidebar'
import CenterPanel from './dashboard/center-panel'
import RightPanel from './dashboard/right-panel'

export default function Dashboard() {
  const [selectedRecord, setSelectedRecord] = useState('rec-001')
  const [activeTab, setActiveTab] = useState('transcript')

  return (
    <div
      className="flex flex-1 overflow-hidden"
      style={{ height: 'calc(100vh - 66px)' }}
    >
      <Sidebar selectedRecord={selectedRecord} onSelectRecord={setSelectedRecord} />
      <CenterPanel
        selectedRecord={selectedRecord}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <RightPanel selectedRecord={selectedRecord} />
    </div>
  )
}
