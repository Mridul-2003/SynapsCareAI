"use client";

interface SidebarProps {
  selectedRecord: string;
  onSelectRecord: (recordId: string) => void;
}

export default function Sidebar({
  selectedRecord,
  onSelectRecord,
}: SidebarProps) {
  const records = [
    {
      id: "rec-001",
      name: "John Smith",
      date: "2024-02-28",
      status: "complete",
    },
    {
      id: "rec-002",
      name: "Sarah Johnson",
      date: "2024-02-27",
      status: "review",
    },
    {
      id: "rec-003",
      name: "Michael Chen",
      date: "2024-02-26",
      status: "draft",
    },
    {
      id: "rec-004",
      name: "Emma Wilson",
      date: "2024-02-25",
      status: "complete",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return { bg: "rgba(0,200,150,.15)", text: "#00C896" };
      case "review":
        return { bg: "rgba(255,149,0,.15)", text: "#FF9500" };
      case "draft":
        return { bg: "rgba(255,255,255,.06)", text: "#5A7A6E" };
      default:
        return { bg: "rgba(255,255,255,.06)", text: "#5A7A6E" };
    }
  };

  return (
    <div
      className="w-72 border-r flex flex-col overflow-hidden"
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
        {records.map((record) => {
          const isActive = selectedRecord === record.id;
          const statusColor = getStatusColor(record.status);

          return (
            <div
              key={record.id}
              onClick={() => onSelectRecord(record.id)}
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
              <div
                className="font-semibold text-sm mb-0.5"
                style={{ color: "#E8F4F0" }}
              >
                {record.name}
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
          { num: "42", label: "Total" },
          { num: "8", label: "Pending" },
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
