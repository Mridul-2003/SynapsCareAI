"use client";

import { useState } from "react";
import Sidebar from "./dashboard/sidebar";
import CenterPanel from "./dashboard/center-panel";
import RightPanel from "./dashboard/right-panel";
import { useIsMobile } from "@/hooks/use-mobile";

type MobilePanel = "sidebar" | "center" | "right";

const MOBILE_TABS: { id: MobilePanel; label: string; icon: string }[] = [
  { id: "sidebar", label: "Records", icon: "📋" },
  { id: "center", label: "Recording", icon: "🎙" },
  { id: "right", label: "Analysis", icon: "🩺" },
];

export default function Dashboard() {
  const [selectedRecord, setSelectedRecord] = useState<string>("");
  const [activeTab, setActiveTab] = useState("transcript");
  const [soapData, setSoapData] = useState<{
    diagnoses: any[];
    entities: any[];
  }>({ diagnoses: [], entities: [] });
  const [soapLoading, setSoapLoading] = useState(false);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("center");

  const isMobile = useIsMobile();

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      style={{ height: "calc(100dvh - 66px)" }}
    >
      {/* Mobile Panel Switcher */}
      {isMobile && (
        <div
          className="flex border-b shrink-0"
          style={{
            borderColor: "rgba(0,200,150,0.15)",
            background: "rgba(5,10,15,.9)",
          }}
        >
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobilePanel(tab.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors cursor-pointer"
              style={{
                color: mobilePanel === tab.id ? "#00C896" : "#5A7A6E",
                background:
                  mobilePanel === tab.id
                    ? "rgba(0,200,150,.06)"
                    : "transparent",
                borderBottom:
                  mobilePanel === tab.id
                    ? "2px solid #00C896"
                    : "2px solid transparent",
              }}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Panels Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — always visible on md+, switchable on mobile */}
        <div
          className={
            isMobile
              ? mobilePanel === "sidebar"
                ? "flex flex-1 overflow-hidden"
                : "hidden"
              : "flex"
          }
        >
          <Sidebar
            selectedRecord={selectedRecord}
            onSelectRecord={(id) => {
              setSelectedRecord(id);
              if (isMobile) setMobilePanel("center");
            }}
            refreshKey={recordsRefreshKey}
            className={isMobile ? "w-full" : "w-72"}
          />
        </div>

        {/* Center Panel — always visible on md+, switchable on mobile */}
        <div
          className={
            isMobile
              ? mobilePanel === "center"
                ? "flex flex-1 overflow-hidden"
                : "hidden"
              : "flex flex-1 overflow-hidden"
          }
        >
          <CenterPanel
            selectedRecord={selectedRecord}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSoapGenerated={(data) => {
              console.log("📥 Dashboard got soapData:", data);
              setSoapData(data);
              if (isMobile) setMobilePanel("right");
            }}
            onLoadingChange={setSoapLoading}
            onConsultationSaved={() =>
              setRecordsRefreshKey((prev) => prev + 1)
            }
          />
        </div>

        {/* Right Panel — hidden on tablet (md–lg), visible on lg+, switchable on mobile */}
        <div
          className={
            isMobile
              ? mobilePanel === "right"
                ? "flex flex-1 overflow-hidden"
                : "hidden"
              : "hidden lg:flex"
          }
        >
          <RightPanel
            selectedRecord={selectedRecord}
            diagnoses={soapData.diagnoses}
            entities={soapData.entities}
            isLoading={soapLoading}
            className={isMobile ? "w-full border-l-0" : "min-w-[18rem]"}
          />
        </div>
      </div>
    </div>
  );
}
