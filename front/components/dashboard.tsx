"use client";

import { useState } from "react";
import Sidebar from "./dashboard/sidebar";
import CenterPanel from "./dashboard/center-panel";
import RightPanel from "./dashboard/right-panel";
import { useIsMobile } from "@/hooks/use-mobile";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const [centerPanelKey, setCenterPanelKey] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("center");

  const [lastConsultation, setLastConsultation] = useState<{
    consultationId: string;
    createdAt: string;
    patientName: string;
    doctorName: string;
  } | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingDoctor, setVerifyingDoctor] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"verified" | "not_verified">("verified");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const openVerifyModal = () => {
    if (!lastConsultation) return;
    setVerifyingDoctor(lastConsultation.doctorName || "");
    setVerifyStatus("verified");
    setVerifyError(null);
    setShowVerifyModal(true);
  };

  const handleSubmitVerification = async () => {
    if (!lastConsultation) return;
    try {
      setVerifyLoading(true);
      setVerifyError(null);
      const res = await fetch(
        `${API_BASE_URL}/consultations/${lastConsultation.consultationId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            created_at: lastConsultation.createdAt,
            status: verifyStatus,
            verifying_doctor: verifyingDoctor || lastConsultation.doctorName || undefined,
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { detail?: string }).detail || "Failed to update verification status",
        );
      }
      setShowVerifyModal(false);
      setRecordsRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      setVerifyError(err.message || "Failed to update verification status");
    } finally {
      setVerifyLoading(false);
    }
  };

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
              if (id === "") {
                setCenterPanelKey((prev) => prev + 1);
                setSoapData({ diagnoses: [], entities: [] });
                setLastConsultation(null);
                setActiveTab("transcript");
              }
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
            key={centerPanelKey}
            selectedRecord={selectedRecord}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSoapGenerated={(data) => {
              setSoapData({ diagnoses: data.diagnoses, entities: data.entities });
              setLastConsultation({
                consultationId: data.consultationId,
                createdAt: data.createdAt,
                patientName: data.patientName,
                doctorName: data.doctorName,
              });
              if (isMobile) setMobilePanel("right");
            }}
            onLoadingChange={setSoapLoading}
            onConsultationSaved={(info) => {
              setRecordsRefreshKey((prev) => prev + 1);
              if (info) setLastConsultation(info);
            }}
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
            onVerifyAndSign={lastConsultation ? openVerifyModal : undefined}
            className={isMobile ? "w-full border-l-0" : "min-w-[18rem]"}
          />
        </div>
      </div>

      {showVerifyModal && lastConsultation && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4 z-50"
          style={{
            background: "rgba(5,10,15,0.75)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 border relative"
            style={{
              background: "rgba(12,21,32,0.98)",
              borderColor: "rgba(0,200,150,0.2)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div
                  className="text-xs uppercase mb-1"
                  style={{ color: "#5A7A6E", letterSpacing: "1.6px" }}
                >
                  Verify & Sign
                </div>
                <div className="text-sm font-semibold" style={{ color: "#E8F4F0" }}>
                  {lastConsultation.patientName}
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-xs border-none cursor-pointer"
                style={{ color: "#5A7A6E" }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-3">
              <div>
                <label
                  className="block text-[10px] uppercase mb-1"
                  style={{ color: "#5A7A6E", letterSpacing: "1px" }}
                >
                  Verifying doctor name
                </label>
                <input
                  type="text"
                  value={verifyingDoctor}
                  onChange={(e) => setVerifyingDoctor(e.target.value)}
                  placeholder="Dr. Name"
                  className="w-full px-3 py-1.5 rounded border text-xs outline-none"
                  style={{
                    background: "rgba(255,255,255,.03)",
                    borderColor: "rgba(0,200,150,0.2)",
                    color: "#E8F4F0",
                  }}
                />
              </div>

              <div>
                <div
                  className="text-[10px] uppercase mb-2"
                  style={{ color: "#5A7A6E", letterSpacing: "1px" }}
                >
                  Verification decision
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyStatus("verified")}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
                    style={{
                      background: verifyStatus === "verified" ? "rgba(0,200,150,.18)" : "rgba(255,255,255,.02)",
                      color: verifyStatus === "verified" ? "#00C896" : "#5A7A6E",
                      border: "1px solid rgba(0,200,150,0.25)",
                    }}
                  >
                    ✓ Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyStatus("not_verified")}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
                    style={{
                      background: verifyStatus === "not_verified" ? "rgba(255,149,0,.18)" : "rgba(255,255,255,.02)",
                      color: verifyStatus === "not_verified" ? "#FF9500" : "#5A7A6E",
                      border: "1px solid rgba(255,149,0,0.35)",
                    }}
                  >
                    ✎ Needs edit
                  </button>
                </div>
              </div>

              <div
                className="text-[11px]"
                style={{ color: "#5A7A6E", lineHeight: 1.5 }}
              >
                Choosing <strong>Needs edit</strong> will mark this consultation
                as not verified so you can go back and adjust the notes before approving.
              </div>

              {verifyError && (
                <div
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(255,77,109,0.14)",
                    color: "#FFB3C3",
                    border: "1px solid rgba(255,77,109,0.4)",
                  }}
                >
                  {verifyError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
                style={{
                  background: "rgba(255,255,255,.02)",
                  color: "#5A7A6E",
                  border: "1px solid rgba(0,200,150,0.15)",
                }}
                onClick={() => setShowVerifyModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={verifyLoading}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold border-none cursor-pointer"
                style={{
                  background: verifyLoading
                    ? "rgba(0,200,150,0.16)"
                    : "linear-gradient(135deg, #00C896, #00A875)",
                  color: "#050A0F",
                  boxShadow: "0 0 20px rgba(0,200,150,.4)",
                  opacity: verifyLoading ? 0.7 : 1,
                }}
              >
                {verifyLoading
                  ? "Saving..."
                  : verifyStatus === "verified"
                    ? "Submit as Verified"
                    : "Submit as Not Verified"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
