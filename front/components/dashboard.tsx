"use client";

import { useState } from "react";
import Sidebar from "./dashboard/sidebar";
import CenterPanel from "./dashboard/center-panel";
import RightPanel from "./dashboard/right-panel";

export default function Dashboard() {
  const [selectedRecord, setSelectedRecord] = useState<string>("");
  const [activeTab, setActiveTab] = useState("transcript");

  // ✅ SOAP API se aane wala data yahan store hoga
  const [soapData, setSoapData] = useState<{
    diagnoses: any[];
    entities: any[];
  }>({ diagnoses: [], entities: [] });

  const [soapLoading, setSoapLoading] = useState(false);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  return (
    <div
      className="flex flex-1 overflow-hidden"
      style={{ height: "calc(100vh - 66px)" }}
    >
      <Sidebar
        selectedRecord={selectedRecord}
        onSelectRecord={setSelectedRecord}
        refreshKey={recordsRefreshKey}
      />

      <CenterPanel
        selectedRecord={selectedRecord}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        // ✅ Jab SOAP generate ho, data yahan aayega
        onSoapGenerated={(data) => {
          console.log("📥 Dashboard got soapData:", data);
          setSoapData(data);
        }}
        onLoadingChange={setSoapLoading}
        onConsultationSaved={() =>
          setRecordsRefreshKey((prev) => prev + 1)
        }
      />

      <RightPanel
        selectedRecord={selectedRecord}
        // ✅ RightPanel ko data mil raha hai
        diagnoses={soapData.diagnoses}
        entities={soapData.entities}
        isLoading={soapLoading}
      />
    </div>
  );
}
