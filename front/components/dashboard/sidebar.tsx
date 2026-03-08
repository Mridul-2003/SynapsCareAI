"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SidebarProps {
  selectedRecord: string;
  onSelectRecord: (recordId: string) => void;
  refreshKey?: number;
  className?: string;
}

type SidebarRecord = {
  id: string;
  name: string;
  date: string;
  status: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Sidebar({
  selectedRecord,
  onSelectRecord,
  refreshKey = 0,
  className,
}: SidebarProps) {
  const router = useRouter();
  const [records, setRecords] = useState<SidebarRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/records`);
        if (!res.ok) {
          throw new Error("Failed to fetch records");
        }
        const data = await res.json();
        const items = (data.records || []) as any[];

        const mapped: SidebarRecord[] = items.map((item) => ({
          id: item.id,
          name: item.patient,
          date: item.date,
          status: item.status,
        }));

        setRecords(mapped);

        if (!selectedRecord && mapped.length > 0) {
          onSelectRecord(mapped[0].id);
        }
      } catch (err) {
        console.error("Error loading sidebar records", err);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return { bg: "rgba(0,200,150,.15)", text: "#00C896" };
      case "verified":
        return { bg: "rgba(0,163,255,.18)", text: "#00A3FF" };
      case "not_verified":
      case "not-verified":
        return { bg: "rgba(255,149,0,.18)", text: "#FF9500" };
      case "processing":
      case "review":
        return { bg: "rgba(255,149,0,.15)", text: "#FF9500" };
      case "draft":
        return { bg: "rgba(255,255,255,.06)", text: "#5A7A6E" };
      default:
        return { bg: "rgba(255,255,255,.06)", text: "#5A7A6E" };
    }
  };

  const performDelete = async (recordId: string) => {
    if (deletingId || !recordId) return;
    try {
      setDeletingId(recordId);
      const res = await fetch(`${API_BASE_URL}/records/${recordId}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (body as { detail?: string }).detail ||
            "Failed to delete consultation.",
        );
        return;
      }
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (selectedRecord === recordId) {
        onSelectRecord("");
        router.push("/dashboard");
      }
      toast.success("Consultation deleted");
    } catch (err) {
      console.error("Failed to delete record", err);
      toast.error("Failed to delete consultation.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    recordId: string,
  ) => {
    e.stopPropagation();
    if (deletingId || !recordId) return;

    toast("Delete this consultation?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          void performDelete(recordId);
        },
      },
    });
  };

  return (
    <div
      className={`border-r flex flex-col overflow-hidden ${className ?? 'w-72'}`}
      style={{
        borderColor: "rgba(0,200,150,0.15)",
        background: "rgba(12,21,32,.6)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-4 border-b flex items-center justify-between shrink-0"
        style={{
          borderColor: "rgba(0,200,150,0.15)",
        }}
      >
        <span
          className="text-xs font-bold uppercase"
          style={{
            letterSpacing: "2px",
            color: "#5A7A6E",
          }}
        >
          Patient Records
        </span>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none text-xs font-semibold cursor-pointer transition-all shrink-0"
          style={{
            background: "linear-gradient(135deg, #00C896, #00A875)",
            color: "#050A0F",
            boxShadow: "0 0 14px rgba(0,200,150,.3)",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.boxShadow =
              "0 0 22px rgba(0,200,150,.5)";
            (e.target as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.boxShadow =
              "0 0 14px rgba(0,200,150,.3)";
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }}
          onClick={() => {
            onSelectRecord("");
            router.push("/dashboard");
          }}
        >
          ➕ New
        </button>
      </div>

      {/* Records List */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-1.5 p-2.5"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,200,150,0.15) transparent",
        }}
      >
        {isLoading && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,.02)",
              color: "#5A7A6E",
            }}
          >
            Loading records...
          </div>
        )}

        {!isLoading && records.length === 0 && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,.02)",
              color: "#5A7A6E",
            }}
          >
            No consultations yet. Start a new recording to create one.
          </div>
        )}

        {!isLoading &&
          records.map((record) => {
            const isActive = selectedRecord === record.id;
            const statusColor = getStatusColor(record.status);

            return (
              <div
                key={record.id}
                onClick={() => {
                  onSelectRecord(record.id);
                  router.push(`/dashboard/${record.id}`);
                }}
                className="p-3 rounded-lg border cursor-pointer transition-all"
                style={{
                  borderColor: isActive
                    ? "rgba(0,200,150,.3)"
                    : "rgba(0,200,150,0.15)",
                  background: isActive
                    ? "rgba(0,200,150,.05)"
                    : "rgba(255,255,255,.02)",
                  transform: isActive ? "translateX(3px)" : "translateX(0)",
                  borderLeftWidth: isActive ? "3px" : "1px",
                  borderLeftColor: isActive ? "#00C896" : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div
                    className="font-semibold text-sm truncate"
                    style={{ color: "#E8F4F0" }}
                  >
                    {record.name}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, record.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded-full border-none cursor-pointer"
                    style={{
                      background: "rgba(255,77,109,0.14)",
                      color: "#FFB3C3",
                    }}
                    title="Delete consultation"
                  >
                    {deletingId === record.id ? "…" : "Delete"}
                  </button>
                </div>
                <div
                  className="text-xs flex gap-2 items-center"
                  style={{ color: "#5A7A6E" }}
                >
                  <span>{record.date}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                    style={{
                      background: statusColor.bg,
                      color: statusColor.text,
                      fontSize: "9px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Stats */}
      <div
        className="p-3 border-t grid grid-cols-2 gap-1.5 shrink-0"
        style={{
          borderColor: "rgba(0,200,150,0.15)",
        }}
      >
        {[
          {
            num: records.length.toString(),
            label: "Total",
          },
          {
            num: records
              .filter((r) => r.status !== "complete")
              .length.toString(),
            label: "Pending",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-2.5 rounded-lg border text-center cursor-pointer transition-all"
            style={{
              background: "rgba(255,255,255,.03)",
              borderColor: "rgba(0,200,150,0.15)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "rgba(0,200,150,.3)";
              el.style.background = "rgba(0,200,150,.05)";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "rgba(0,200,150,0.15)";
              el.style.background = "rgba(255,255,255,.03)";
              el.style.transform = "translateY(0)";
            }}
          >
            <div className="font-bold text-xl" style={{ color: "#00C896" }}>
              {stat.num}
            </div>
            <div
              className="text-xs mt-0.5 uppercase"
              style={{
                color: "#5A7A6E",
                letterSpacing: "1px",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
