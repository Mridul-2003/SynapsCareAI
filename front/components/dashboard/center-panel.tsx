"use client";

import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface CenterPanelProps {
  selectedRecord: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
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

export default function CenterPanel({
  selectedRecord,
  activeTab,
  onTabChange,
}: CenterPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [duration, setDuration] = useState(0);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapError, setSoapError] = useState<string | null>(null);

  const consultationIdRef = useRef<string>("");
  const createdAtRef = useRef<string>("");

  const socketRef = useRef<Socket | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [waveformBars] = useState(
    Array.from({ length: 40 }, () => Math.random() * 100),
  );

  const patientData = {
    "rec-001": { name: "John Smith", dob: "1985-03-15", mrn: "MRN-2024-001" },
    "rec-002": {
      name: "Sarah Johnson",
      dob: "1990-07-22",
      mrn: "MRN-2024-002",
    },
    "rec-003": { name: "Michael Chen", dob: "1978-11-08", mrn: "MRN-2024-003" },
    "rec-004": { name: "Emma Wilson", dob: "1995-05-30", mrn: "MRN-2024-004" },
  };

  const patient =
    patientData[selectedRecord as keyof typeof patientData] ||
    patientData["rec-001"];

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  async function startRecording() {
    try {
      const socket = io("http://localhost:8000", {
        transports: ["websocket"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket connected");
      });

      socket.on(
        "consultation_started",
        (data: { consultation_id: string; created_at: string }) => {
          consultationIdRef.current = data.consultation_id;
          createdAtRef.current = data.created_at;
          console.log(
            "Consultation started:",
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
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    socketRef.current?.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    setTimeout(() => {
      generateSOAP();
      onTabChange("soap");
    }, 1500);
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function generateSOAP() {
    const consultationId = consultationIdRef.current;
    const createdAt = createdAtRef.current;

    if (!consultationId || !createdAt) {
      setSoapError("Consultation ID nahi mila. Pehle record karo.");
      return;
    }

    setSoapLoading(true);
    setSoapError(null);
    setSoapNote(null);

    console.log("Generating SOAP for:", consultationId, createdAt);

    try {
      const response = await fetch(
        "http://localhost:8001/generate_soap_notes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consultation_id: consultationId,
            created_at: createdAt,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // API returns { soap: { subjective, objective, assessment, plan }, entities: [], diagnoses: [] }
      // Extract only the soap object
      const soapData: SOAPNote = data.soap ?? data;
      setSoapNote(soapData);
    } catch (err: any) {
      setSoapError(err.message || "Failed to generate SOAP note");
    } finally {
      setSoapLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      stopRecording();
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
            {soapSections.map(({ key, label, icon }) => (
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
                  {typeof soapNote[key] === "string" ? (
                    soapNote[key]
                  ) : soapNote[key] ? (
                    JSON.stringify(soapNote[key])
                  ) : (
                    <span style={{ color: "#5A7A6E" }}>Not available</span>
                  )}
                </div>
              </div>
            ))}
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
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(0,200,150,0.15)" }}
      >
        <div>
          <div className="text-lg font-bold" style={{ color: "#E8F4F0" }}>
            {patient.name}
          </div>
          <div className="text-xs" style={{ color: "#5A7A6E" }}>
            DOB: {patient.dob} | {patient.mrn}
          </div>
        </div>

        <button
          onClick={toggleRecording}
          className="px-5 py-2.5 rounded-full text-xs font-bold"
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
      <div className="px-6 py-3 flex items-center gap-2">
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
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "transcript" && renderTranscript()}
        {activeTab === "soap" && renderSOAP()}
        {activeTab === "summary" && (
          <div style={{ color: "#5A7A6E" }} className="text-sm">
            Summary coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
