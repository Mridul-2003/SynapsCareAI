"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RecordItem = {
  id: string;
  patient: string;
  date: string;
  time: string;
  status: string;
  duration: string;
  confidence: string;
  soapConfidence?: {
    subjective?: number;
    objective?: number;
    assessment?: number;
    plan?: number;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Records() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/records`);
        if (!res.ok) {
          throw new Error("Failed to fetch records");
        }

        const data = await res.json();
        const items: RecordItem[] = data?.records ?? [];
        setRecords(items);
      } catch (err) {
        console.error("Error fetching records", err);
        setError("Unable to load records");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm);

    const matchesFilter =
      filterStatus === "all" || record.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "complete":
        return { bg: "rgba(0,200,150,.15)", text: "#00C896" };
      case "processing":
        return { bg: "rgba(255,149,0,.15)", text: "#FF9500" };
      case "draft":
        return { bg: "rgba(255,255,255,.06)", text: "#5A7A6E" };
      case "verified":
        return { bg: "rgba(0,122,255,.15)", text: "#007AFF" };
      default:
        return { bg: "rgba(255,255,255,.06)", text: "#5A7A6E" };
    }
  };

  return (
    <div className="flex flex-col flex-1 p-7 gap-5 overflow-hidden">
      {/* Header */}
      <div>
        <div className="text-2xl font-bold" style={{ color: "#E8F4F0" }}>
          All <span style={{ color: "#00C896" }}>Records</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border flex-1 max-w-xs"
          style={{
            background: "rgba(255,255,255,.03)",
            borderColor: "rgba(0,200,150,0.15)",
          }}
        >
          <span style={{ color: "#5A7A6E" }}>🔍</span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-xs"
            style={{ color: "#E8F4F0" }}
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 cursor-pointer">
          {["all", "complete", "draft", "verified"].map((status) => {
            const isActive = filterStatus === status;

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className="px-4 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer"
                style={{
                  borderColor: isActive ? "#00C896" : "rgba(0,200,150,0.15)",
                  background: isActive ? "rgba(0,200,150,0.15)" : "transparent",
                  color: isActive ? "#00C896" : "#5A7A6E",
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records List */}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        {isLoading && (
          <div style={{ color: "#5A7A6E" }}>Loading records...</div>
        )}

        {error && <div style={{ color: "red" }}>{error}</div>}

        {!isLoading && filteredRecords.length === 0 && (
          <div style={{ color: "#5A7A6E" }}>No records found.</div>
        )}

        {filteredRecords.map((record) => {
          const statusColor = getStatusColor(record.status);

          return (
            <div
              key={record.id}
              className="p-4 rounded-lg border cursor-pointer transition-all"
              style={{
                background: "rgba(255,255,255,.02)",
                borderColor: "rgba(0,200,150,0.15)",
              }}
              onClick={() => router.push(`/dashboard/${record.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,200,150,.3)";
                e.currentTarget.style.background = "rgba(0,200,150,.04)";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,200,150,0.15)";
                e.currentTarget.style.background = "rgba(255,255,255,.02)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: "#E8F4F0" }}
                  >
                    {record.patient}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#5A7A6E" }}>
                    {record.date} at {record.time}
                  </div>
                </div>

                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: statusColor.bg,
                    color: statusColor.text,
                  }}
                >
                  {record.status.toUpperCase()}
                </span>
              </div>

              <div className="flex gap-4 text-xs" style={{ color: "#5A7A6E" }}>
                <span>Duration: {record.duration}</span>
                <span>
                  Confidence:{" "}
                  {record.soapConfidence?.subjective !== undefined && (
                    <span>
                      Subjective Confidence:{" "}
                      <span style={{ color: "#00C896" }}>
                        {(record.soapConfidence.subjective * 100).toFixed(0)}%
                      </span>
                    </span>
                  )}
                </span>

                <span
                  style={{
                    color: "#00C896",
                    marginLeft: "auto",
                  }}
                >
                  View details →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
