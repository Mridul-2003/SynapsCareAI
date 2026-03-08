"use client";

import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface CenterPanelProps {
  selectedRecord: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSoapGenerated?: (data: { diagnoses: any[]; entities: any[]; consultationId: string; createdAt: string; patientName: string; doctorName: string }) => void;
  onLoadingChange?: (loading: boolean) => void;
  onConsultationSaved?: (info?: { consultationId: string; createdAt: string; patientName: string; doctorName: string }) => void;
}

interface TranscriptMessage {
  timestamp: string;
  text: string;
}

interface SOAPNote {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  [key: string]: string | undefined;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CenterPanel({
  selectedRecord,
  activeTab,
  onTabChange,
  onSoapGenerated,
  onLoadingChange,
  onConsultationSaved,
}: CenterPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [duration, setDuration] = useState(0);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapError, setSoapError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [patientDob, setPatientDob] = useState("");

  const consultationIdRef = useRef<string>("");
  const createdAtRef = useRef<string>("");

  const socketRef = useRef<Socket | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [waveformBars] = useState(
    Array.from({ length: 40 }, () => Math.random() * 100),
  );

  function cleanupAudio() {
    try {
      processorRef.current?.disconnect();
    } catch (_) {
      // ignore
    }
    try {
      const ctx = audioContextRef.current;
      if (ctx && typeof ctx.close === "function" && ctx.state !== "closed") {
        void ctx.close();
      }
    } catch (_) {
      // ignore InvalidStateError or other close errors
    } finally {
      audioContextRef.current = null;
      processorRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  async function startRecording() {
    try {
      setSoapNote(null);
      setSoapError(null);
      setSummary(null);
      setDuration(0); // ← reset duration on new recording

      const socket = io(process.env.NEXT_PUBLIC_APP_URL as string, {
        path: "/socket.io",
        transports: ["websocket"],
        secure: true,
      });
      socketRef.current = socket;

      socket.on("connect", () => console.log("Socket connected"));
      socket.on("recording_started", () => console.log("Recording started"));

      socket.on(
        "consultation_saved",
        (data: { consultation_id: string; created_at: string }) => {
          consultationIdRef.current = data.consultation_id ?? "";
          createdAtRef.current = data.created_at ?? "";
          console.log(
            "✅ Consultation saved:",
            data.consultation_id,
            data.created_at,
          );
        },
      );

      socket.on("transcript", (data) => {
        setMessages((prev) => [
          ...prev,
          { timestamp: data.timestamp, text: data.text },
        ]);
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = function (e) {
        if (!socketRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(input.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < input.length; i++) {
          let s = Math.max(-1, Math.min(1, input[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        socketRef.current.emit("audio_chunk", buffer);
      };

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Mic permission required");
    }
  }

  function stopRecording() {
    cleanupAudio();
    setIsRecording(false);

    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("stop_recording");

      const tryGenerate = (attempts = 0) => {
        if (consultationIdRef.current && createdAtRef.current) {
          console.log("✅ IDs ready, generating SOAP...");
          socket.disconnect();
          onTabChange("soap");
          generateSOAP();
        } else if (attempts < 10) {
          console.log(
            `⏳ Waiting for consultation_saved... attempt ${attempts + 1}`,
          );
          setTimeout(() => tryGenerate(attempts + 1), 500);
        } else {
          console.error("❌ consultation_saved never received");
          socket.disconnect();
          setSoapError("Consultation ID nahi mila. Dobara try karo.");
        }
      };

      setTimeout(() => tryGenerate(), 300);
    } else {
      if (consultationIdRef.current && createdAtRef.current) {
        onTabChange("soap");
        generateSOAP();
      } else {
        setSoapError("Connection lost. Consultation ID nahi mila.");
      }
    }
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function resetForNewConsultation() {
    setMessages([]);
    setDuration(0);
    consultationIdRef.current = "";
    createdAtRef.current = "";
    setPatientName("");
    setDoctorName("");
    setPatientDob("");
    onTabChange("transcript");
  }

  async function saveConsultationMetadata(args: {
    consultationId: string;
    createdAt: string;
    soap: SOAPNote | null;
    summary: string | null;
    diagnoses: any[];
    entities: any[];
    totalDuration: number; // ← ADDED
    soapConfidence: Record<string, number>; // ← ADDED
  }) {
    const {
      consultationId,
      createdAt,
      soap,
      summary,
      diagnoses,
      entities,
      totalDuration, // ← ADDED
      soapConfidence, // ← ADDED
    } = args;

    if (!consultationId || !createdAt) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/consultations/${consultationId}/metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            created_at: createdAt,
            patient_name: patientName || "Unknown patient",
            doctor_name: doctorName || "Unknown doctor",
            patient_dob: patientDob || "",
            soap,
            summary,
            diagnoses,
            entities,
            total_duration: totalDuration, // ← ADDED
            soap_confidence: soapConfidence, // ← ADDED
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "❌ Failed to save consultation metadata",
          res.status,
          text,
        );
      } else {
        console.log("✅ Consultation metadata saved");
        onConsultationSaved?.({
          consultationId,
          createdAt,
          patientName: patientName || "Unknown patient",
          doctorName: doctorName || "Unknown doctor",
        });
      }
    } catch (err) {
      console.error("Error saving consultation metadata", err);
    }
  }

  async function generateSOAP() {
    const consultationId = consultationIdRef.current;
    const createdAt = createdAtRef.current;

    if (!consultationId || !createdAt) {
      setSoapError("Consultation ID nahi mila. Pehle recording karo.");
      return;
    }

    setSoapLoading(true);
    onLoadingChange?.(true);
    setSoapError(null);
    setSoapNote(null);
    setSummary(null);

    console.log("🚀 Generating SOAP for:", consultationId, createdAt);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SOAP_API_URL}/generate_soap_notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consultation_id: consultationId,
            created_at: createdAt,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          (data as { detail?: string }).detail ||
            `Server error: ${response.status}`,
        );
      }

      if ((data as { status?: string }).status === "error") {
        setSoapError(
          (data as { error?: string }).error || "SOAP generate fail",
        );
        return;
      }

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📦 Full API Response:", data);
      console.log("📋 SOAP:", data.soap);
      console.log("📝 Summary:", data.summary);
      console.log("🏷️  Entities:", data.entities);
      console.log("🩺 Diagnoses:", data.diagnoses);
      console.log("⏱️  Total Duration:", data.total_duration);
      console.log("📊 SOAP Confidence:", data.soap_confidence);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const soapData: SOAPNote = data.soap ?? {};
      setSoapNote(soapData);
      setSummary(data.summary ?? null);

      if (onSoapGenerated) {
        onSoapGenerated({
          diagnoses: data.diagnoses ?? [],
          entities: data.entities ?? [],
          consultationId,
          createdAt,
          patientName: patientName || "Unknown patient",
          doctorName: doctorName || "Unknown doctor",
        });
      } else {
        console.warn("⚠️ onSoapGenerated prop missing! Parent se pass karo.");
      }

      await saveConsultationMetadata({
        consultationId,
        createdAt,
        soap: soapData,
        summary: data.summary ?? null,
        diagnoses: data.diagnoses ?? [],
        entities: data.entities ?? [],
        totalDuration: data.total_duration ?? duration,
        soapConfidence: data.soap_confidence ?? {},
      });
    } catch (err: any) {
      setSoapError(err.message || "Failed to generate SOAP note");
    } finally {
      setSoapLoading(false);
      onLoadingChange?.(false);
    }
  }

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const renderTranscript = () => (
    <div className="space-y-3">
      {messages.length === 0 && (
        <div style={{ color: "#5A7A6E" }} className="text-sm">
          No transcript yet. Click RECORD to start.
        </div>
      )}
      {messages.map((msg, i) => (
        <div key={i} className="flex gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(0,200,150,.2)", color: "#00C896" }}
          >
            AI
          </div>
          <div className="flex-1">
            <div className="text-xs" style={{ color: "#5A7A6E" }}>
              {msg.timestamp}
            </div>
            <div className="text-sm" style={{ color: "#C5DDD5" }}>
              {msg.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSOAP = () => {
    const soapSections = [
      { key: "subjective", label: "S — Subjective", icon: "🗣" },
      { key: "objective", label: "O — Objective", icon: "🔬" },
      { key: "assessment", label: "A — Assessment", icon: "🩺" },
      { key: "plan", label: "P — Plan", icon: "📋" },
    ];

    return (
      <div className="space-y-4">
        <button
          onClick={generateSOAP}
          disabled={soapLoading}
          className="px-4 py-2 rounded-lg text-xs font-bold w-full"
          style={{
            background: soapLoading
              ? "rgba(0,200,150,0.1)"
              : "linear-gradient(135deg, rgba(0,200,150,0.3), rgba(0,200,150,0.1))",
            color: soapLoading ? "#5A7A6E" : "#00C896",
            border: "1px solid rgba(0,200,150,0.3)",
            cursor: soapLoading ? "not-allowed" : "pointer",
          }}
        >
          {soapLoading ? "⏳ Generating SOAP Note..." : "✦ Generate SOAP Note"}
        </button>

        {soapError && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,77,109,0.1)",
              color: "#FF4D6D",
              border: "1px solid rgba(255,77,109,0.2)",
            }}
          >
            ⚠ {soapError}
          </div>
        )}

        {!soapNote && !soapLoading && !soapError && (
          <div style={{ color: "#5A7A6E" }} className="text-sm">
            Recording stop karo — SOAP note automatically generate hoga.
          </div>
        )}

        {soapNote && (
          <div className="space-y-3">
            {soapSections.map(({ key, label, icon }) => {
              const value =
                soapNote[key] ??
                soapNote[
                  (key.charAt(0).toUpperCase() + key.slice(1)) as keyof SOAPNote
                ];
              return (
                <div
                  key={key}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(0,200,150,0.05)",
                    border: "1px solid rgba(0,200,150,0.15)",
                  }}
                >
                  <div
                    className="text-xs font-bold mb-2 flex items-center gap-1.5"
                    style={{ color: "#00C896" }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                  <div className="text-sm" style={{ color: "#C5DDD5" }}>
                    {typeof value === "string" ? (
                      value
                    ) : value ? (
                      JSON.stringify(value)
                    ) : (
                      <span style={{ color: "#5A7A6E" }}>Not available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: "rgba(12,21,32,.4)" }}
    >
      {/* Header */}
      <div
        className="px-4 md:px-6 py-3 md:py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderColor: "rgba(0,200,150,0.15)" }}
      >
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="block text-[10px] uppercase mb-1"
                style={{ color: "#5A7A6E", letterSpacing: "1px" }}
              >
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-1.5 rounded border text-xs outline-none"
                style={{
                  background: "rgba(255,255,255,.03)",
                  borderColor: "rgba(0,200,150,0.15)",
                  color: "#E8F4F0",
                }}
              />
            </div>
            <div>
              <label
                className="block text-[10px] uppercase mb-1"
                style={{ color: "#5A7A6E", letterSpacing: "1px" }}
              >
                Doctor Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Patel"
                className="w-full px-3 py-1.5 rounded border text-xs outline-none"
                style={{
                  background: "rgba(255,255,255,.03)",
                  borderColor: "rgba(0,200,150,0.15)",
                  color: "#E8F4F0",
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
            <div className="max-w-[11rem]">
              <label
                className="block text-[10px] uppercase mb-1"
                style={{ color: "#5A7A6E", letterSpacing: "1px" }}
              >
                Patient DOB
              </label>
              <input
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                className="w-full px-3 py-1.5 rounded border text-xs outline-none"
                style={{
                  background: "rgba(255,255,255,.03)",
                  borderColor: "rgba(0,200,150,0.15)",
                  color: "#E8F4F0",
                }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={toggleRecording}
          className="px-5 py-2.5 rounded-full text-xs font-bold self-end sm:self-auto shrink-0"
          style={{
            background: "linear-gradient(135deg, #FF4D6D, #c0392b)",
            color: "white",
            boxShadow: isRecording
              ? "0 0 38px rgba(255,77,109,.8)"
              : "0 0 22px rgba(255,77,109,.4)",
          }}
        >
          {isRecording ? "STOP" : "RECORD"}
        </button>
      </div>

      {/* Waveform */}
      <div className="px-4 md:px-6 py-3 flex items-center gap-2 overflow-hidden">
        {waveformBars.map((h, i) => (
          <div
            key={i}
            className="w-0.5"
            style={{
              height: isRecording ? `${h}%` : "4px",
              background: "#00C896",
              opacity: 0.4,
            }}
          />
        ))}
        <span style={{ color: "#00C896" }}>{formatTime(duration)}</span>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: "rgba(0,200,150,0.15)" }}
      >
        {["transcript", "soap", "summary"].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="px-4 py-3 text-xs"
            style={{ color: activeTab === tab ? "#00C896" : "#5A7A6E" }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activeTab === "transcript" && renderTranscript()}
        {activeTab === "soap" && renderSOAP()}
        {activeTab === "summary" && (
          <div className="space-y-3">
            {summary ? (
              <p
                className="text-sm"
                style={{ color: "#C5DDD5", lineHeight: 1.6 }}
              >
                {summary}
              </p>
            ) : (
              <div style={{ color: "#5A7A6E" }} className="text-sm">
                Stop the recording and generate the SOAP notes — the summary
                will appear here.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
