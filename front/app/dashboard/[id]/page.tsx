"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/sidebar";
import RightPanel from "@/components/dashboard/right-panel";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type TranscriptEntry = {
  timestamp: string;
  text: string;
  speaker?: string;
};

type Consultation = {
  consultationID: string;
  createdAt: string;
  status: string;
  patientName: string;
  doctorName: string;
  patientDob: string;
  verifiedBy?: string;
  transcript: TranscriptEntry[];
  soap: Record<string, any>;
  summary: string;
  diagnoses: any[];
  entities: any[];
};

export default function ConsultationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [data, setData] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingDoctor, setVerifyingDoctor] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"verified" | "not_verified">(
    "verified",
  );
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editSummary, setEditSummary] = useState("");
  const [editSoap, setEditSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/consultations/${id}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (body as { detail?: string }).detail ||
              "Failed to load consultation",
          );
        }
        setData(body as Consultation);
      } catch (err: any) {
        setError(err.message || "Failed to load consultation");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const createdDate = data?.createdAt
    ? new Date(data.createdAt).toLocaleString()
    : "";

  const statusStyle = (() => {
    const status = data?.status;
    if (!status) return null;
    switch (status) {
      case "draft":
        return {
          label: "Draft",
          bg: "rgba(255,255,255,.06)",
          color: "#5A7A6E",
        };
      case "complete":
      case "completed":
        return {
          label: "Complete",
          bg: "rgba(0,200,150,.15)",
          color: "#00C896",
        };
      case "verified":
        return {
          label: "Verified",
          bg: "rgba(0,163,255,.18)",
          color: "#00A3FF",
        };
      case "not_verified":
      case "not-verified":
        return {
          label: "Not Verified",
          bg: "rgba(255,149,0,.18)",
          color: "#FF9500",
        };
      default:
        return {
          label: status,
          bg: "rgba(255,255,255,.06)",
          color: "#5A7A6E",
        };
    }
  })();

  const openVerifyModal = () => {
    if (!data) return;
    setVerifyingDoctor(data.doctorName || "");
    setVerifyStatus("verified");
    setVerifyError(null);
    setShowVerifyModal(true);
  };

  const startEditing = () => {
    if (!data) return;
    const soap = data.soap || {};
    const readField = (key: string) =>
      (soap as any)[key] ??
      (soap as any)[key.charAt(0).toUpperCase() + key.slice(1)] ??
      "";

    setEditSummary(data.summary || "");
    setEditSoap({
      subjective: String(readField("subjective") || ""),
      objective: String(readField("objective") || ""),
      assessment: String(readField("assessment") || ""),
      plan: String(readField("plan") || ""),
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveEdits = async () => {
    if (!data) return;
    try {
      setSaveLoading(true);
      setSaveError(null);
      const res = await fetch(
        `${API_BASE_URL}/consultations/${data.consultationID}/metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            created_at: data.createdAt,
            patient_name: data.patientName || "Unknown patient",
            doctor_name: data.doctorName || "Unknown doctor",
            patient_dob: data.patientDob || "",
            soap: editSoap,
            summary: editSummary,
            diagnoses: data.diagnoses || [],
            entities: data.entities || [],
            status: data.status,
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { detail?: string }).detail ||
            "Failed to save edited consultation",
        );
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              summary: editSummary,
              soap: {
                ...(prev.soap || {}),
                ...editSoap,
              },
            }
          : prev,
      );
      setIsEditing(false);
      toast.success("Updates saved");
    } catch (err: any) {
      setSaveError(err.message || "Failed to save edited consultation");
      toast.error(err.message || "Failed to save edited consultation");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!data) return;
    try {
      setVerifyLoading(true);
      setVerifyError(null);
      const res = await fetch(
        `${API_BASE_URL}/consultations/${data.consultationID}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            created_at: data.createdAt,
            status: verifyStatus,
            verifying_doctor: verifyingDoctor || data.doctorName || undefined,
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { detail?: string }).detail ||
            "Failed to update verification status",
        );
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: verifyStatus,
              doctorName: verifyingDoctor || prev.doctorName,
              verifiedBy: verifyingDoctor || prev.verifiedBy,
            }
          : prev,
      );
      setShowVerifyModal(false);
    } catch (err: any) {
      setVerifyError(err.message || "Failed to update verification status");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden" style={{ background: "#050A0F" }}>
      {/* Background Grid and Orbs (same theme as main dashboard) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,200,150,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,200,150,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: "#00C896",
            top: "-200px",
            left: "-150px",
            animation: "driftA 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: "#00A3FF",
            bottom: "-100px",
            right: "-100px",
            animation: "driftB 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{
            background: "#7B61FF",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "driftC 15s ease-in-out infinite",
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
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar hidden on mobile, visible on md+ */}
          <div className="hidden md:flex">
            <Sidebar
              selectedRecord={id || ""}
              onSelectRecord={(recordId) => router.push(`/dashboard/${recordId}`)}
            />
          </div>

          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ background: "rgba(12,21,32,.4)" }}
          >
            {/* Header */}
            <div
              className="px-4 md:px-6 py-3 md:py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ borderColor: "rgba(0,200,150,0.15)" }}
            >
              <div className="min-w-0 flex-1">
                <div
                  className="text-base md:text-lg font-bold truncate"
                  style={{ color: "#E8F4F0" }}
                >
                  {data?.patientName || "Unknown patient"}
                </div>
                <div
                  className="text-xs flex flex-wrap gap-1.5 items-center mt-0.5"
                  style={{ color: "#5A7A6E" }}
                >
                  {data?.doctorName && <>Doctor: {data.doctorName}</>}
                  {data?.patientDob && (
                    <>
                      <span className="hidden sm:inline">|</span>
                      <span>DOB: {data.patientDob}</span>
                    </>
                  )}
                  {createdDate && (
                    <>
                      <span className="hidden sm:inline">|</span>
                      <span>Created: {createdDate}</span>
                    </>
                  )}
                  {data?.verifiedBy && (
                    <>
                      <span className="hidden sm:inline">|</span>
                      <span>Verified by: {data.verifiedBy}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
                {statusStyle && (
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      letterSpacing: "0.8px",
                    }}
                  >
                    {statusStyle.label}
                  </span>
                )}
                <button
                  className="px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs font-semibold border-none cursor-pointer"
                  style={{
                    background: "rgba(0,200,150,.12)",
                    color: "#00C896",
                    boxShadow: "0 0 14px rgba(0,200,150,.35)",
                  }}
                  onClick={() => router.push("/dashboard")}
                >
                  ← Back
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)] gap-4 p-4 md:p-6 overflow-hidden overflow-y-auto lg:overflow-hidden">
              <div
                className="flex flex-col gap-4 lg:overflow-y-auto pr-1"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(0,200,150,0.5) transparent",
                }}
              >
                {/* Summary */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: "rgba(255,255,255,.02)",
                    borderColor: "rgba(0,200,150,0.15)",
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase mb-2"
                    style={{ color: "#5A7A6E", letterSpacing: "1.5px" }}
                  >
                    Clinical Summary
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full mt-1 rounded border px-3 py-2 text-sm outline-none"
                      style={{
                        background: "rgba(5,10,15,.9)",
                        borderColor: "rgba(0,200,150,0.25)",
                        color: "#C5DDD5",
                        resize: "vertical",
                        minHeight: "80px",
                      }}
                    />
                  ) : (
                    <div className="text-sm" style={{ color: "#C5DDD5" }}>
                      {data?.summary ? data.summary : "No summary available."}
                    </div>
                  )}
                </div>

                {/* SOAP */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: "rgba(255,255,255,.02)",
                    borderColor: "rgba(0,200,150,0.15)",
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase mb-3"
                    style={{ color: "#5A7A6E", letterSpacing: "1.5px" }}
                  >
                    SOAP Note
                  </div>
                  {data?.soap && Object.keys(data.soap).length > 0 ? (
                    <div className="space-y-3">
                      {["subjective", "objective", "assessment", "plan"].map(
                        (key) => {
                          const value =
                            (data.soap as any)[key] ??
                            (data.soap as any)[
                              key.charAt(0).toUpperCase() + key.slice(1)
                            ];
                          if (!value) return null;
                          const label =
                            key === "subjective"
                              ? "S — Subjective"
                              : key === "objective"
                                ? "O — Objective"
                                : key === "assessment"
                                  ? "A — Assessment"
                                  : "P — Plan";
                          const sectionKey = key as
                            | "subjective"
                            | "objective"
                            | "assessment"
                            | "plan";
                          return (
                            <div
                              key={key}
                              className="rounded-lg p-3"
                              style={{
                                background: "rgba(0,200,150,0.04)",
                                border: "1px solid rgba(0,200,150,0.15)",
                              }}
                            >
                              <div
                                className="text-xs font-semibold mb-1"
                                style={{ color: "#00C896" }}
                              >
                                {label}
                              </div>
                              {isEditing ? (
                                <textarea
                                  value={editSoap[sectionKey]}
                                  onChange={(e) =>
                                    setEditSoap((prev) => ({
                                      ...prev,
                                      [sectionKey]: e.target.value,
                                    }))
                                  }
                                  className="w-full mt-1 rounded border px-3 py-2 text-sm outline-none"
                                  style={{
                                    background: "rgba(5,10,15,.9)",
                                    borderColor: "rgba(0,200,150,0.25)",
                                    color: "#C5DDD5",
                                    resize: "vertical",
                                    minHeight: "70px",
                                  }}
                                />
                              ) : (
                                <div
                                  className="text-sm"
                                  style={{
                                    color: "#C5DDD5",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {typeof value === "string"
                                    ? value
                                    : JSON.stringify(value, null, 2)}
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <div className="text-sm" style={{ color: "#5A7A6E" }}>
                      No SOAP note stored for this consultation.
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {saveError && (
                      <div
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(255,77,109,0.14)",
                          color: "#FFB3C3",
                          border: "1px solid rgba(255,77,109,0.4)",
                        }}
                      >
                        {saveError}
                      </div>
                    )}
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer"
                        style={{
                          background: "rgba(255,255,255,.02)",
                          color: "#5A7A6E",
                          border: "1px solid rgba(0,200,150,0.15)",
                        }}
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdits}
                        disabled={saveLoading}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold border-none cursor-pointer"
                        style={{
                          background: saveLoading
                            ? "rgba(0,200,150,0.16)"
                            : "linear-gradient(135deg, #00C896, #00A875)",
                          color: "#050A0F",
                          boxShadow: "0 0 16px rgba(0,200,150,.4)",
                          opacity: saveLoading ? 0.7 : 1,
                        }}
                      >
                        {saveLoading ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Transcript */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: "rgba(5,10,15,.9)",
                    borderColor: "rgba(0,200,150,0.15)",
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase mb-3"
                    style={{ color: "#5A7A6E", letterSpacing: "1.5px" }}
                  >
                    Transcript
                  </div>
                  <div className="space-y-2 pr-1">
                    {data?.transcript && data.transcript.length > 0 ? (
                      data.transcript.map((line, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{
                              background: "rgba(0,200,150,.2)",
                              color: "#00C896",
                            }}
                          >
                            AI
                          </div>
                          <div className="flex-1">
                            <div
                              className="text-[11px]"
                              style={{ color: "#5A7A6E" }}
                            >
                              {line.timestamp}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: "#C5DDD5" }}
                            >
                              {line.text}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm" style={{ color: "#5A7A6E" }}>
                        No transcript captured for this consultation.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: diagnoses + entities reuse RightPanel */}
              <div className="hidden lg:flex">
                <RightPanel
                  selectedRecord={id || ""}
                  diagnoses={data?.diagnoses || []}
                  entities={data?.entities || []}
                  isLoading={loading}
                  onVerifyAndSign={openVerifyModal}
                  className="flex-1 border-l"
                />
              </div>

              {/* Mobile-only: Diagnoses/Entities below main content */}
              <div className="lg:hidden">
                <RightPanel
                  selectedRecord={id || ""}
                  diagnoses={data?.diagnoses || []}
                  entities={data?.entities || []}
                  isLoading={loading}
                  onVerifyAndSign={openVerifyModal}
                  className="flex-1 border border-t-0 border-l-0 border-r-0"
                />
              </div>
            </div>

            {loading && (
              <div
                className="absolute inset-0 flex items-center justify-center text-xs"
                style={{
                  background: "rgba(5,10,15,.6)",
                  color: "#5A7A6E",
                }}
              >
                Loading consultation...
              </div>
            )}

            {error && !loading && (
              <div
                className="absolute inset-x-0 bottom-4 mx-auto max-w-md text-xs px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(255,77,109,0.14)",
                  color: "#FFB3C3",
                  border: "1px solid rgba(255,77,109,0.4)",
                }}
              >
                {error}
              </div>
            )}

            {showVerifyModal && (
              <div
                className="absolute inset-0 flex items-center justify-center px-4"
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
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "#E8F4F0" }}
                      >
                        {data?.patientName || "Unknown patient"}
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
                            background:
                              verifyStatus === "verified"
                                ? "rgba(0,200,150,.18)"
                                : "rgba(255,255,255,.02)",
                            color:
                              verifyStatus === "verified"
                                ? "#00C896"
                                : "#5A7A6E",
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
                            background:
                              verifyStatus === "not_verified"
                                ? "rgba(255,149,0,.18)"
                                : "rgba(255,255,255,.02)",
                            color:
                              verifyStatus === "not_verified"
                                ? "#FF9500"
                                : "#5A7A6E",
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
                      Choosing <strong>Needs edit</strong> will mark this
                      consultation as not verified so you can go back and adjust
                      the notes before approving.
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

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,.02)",
                        color: "#5A7A6E",
                        border: "1px solid rgba(0,200,150,0.15)",
                      }}
                      onClick={() => {
                        setShowVerifyModal(false);
                        startEditing();
                      }}
                    >
                      Edit note
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
                        ? "Saving verification..."
                        : verifyStatus === "verified"
                          ? "Submit as Verified"
                          : "Submit as Not Verified"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
