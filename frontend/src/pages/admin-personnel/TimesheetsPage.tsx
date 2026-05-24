import React, { useEffect, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { timesheetUploads } from "../../mock/mockData";
import { useStructureOptions } from "../../hooks/useStructureOptions";

const statusConfig = {
  processed: { label: "Обработан", icon: CheckCircle, color: "#22C55E", bg: "#F0FDF4" },
  processing: { label: "В обработке", icon: Clock, color: "#2E7D32", bg: "#E8F5E9" },
  error: { label: "Ошибка", icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
};

export default function TimesheetsPage() {
  const { locations: structureLocations } = useStructureOptions();
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  useEffect(() => {
    if (!selectedLocationId && structureLocations[0]) {
      setSelectedLocationId(structureLocations[0].id);
    }
  }, [structureLocations, selectedLocationId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Табели учёта" showBack white />

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Location timesheet viewer */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Табель по точке</p>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border mb-3"
            style={{ borderColor: "#E2E8F0", fontSize: 14 }}
          >
            {structureLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <div className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
            <p style={{ color: "#64748B", fontSize: 12 }}>Выбрана точка</p>
            <p style={{ color: "#1E293B", fontSize: 16, fontWeight: 700 }}>
              {structureLocations.find((location) => location.id === selectedLocationId)?.name ?? "Не выбрана"}
            </p>
            <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>
              Табель хранит количество часов по дням. Время начала и окончания смены в файле не передается.
            </p>
          </div>
        </div>

        {/* Upload zone */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Загрузка табеля</p>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8"
            style={{
              borderColor: isDragging ? "#2E7D32" : "#E2E8F0",
              background: isDragging ? "#E8F5E9" : "#F8FAFC",
            }}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ background: "#E8F5E9" }}>
              <Upload size={28} color="#2E7D32" />
            </div>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>Перетащите файл или нажмите для выбора</p>
            <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>Поддерживаемые форматы: XLSX, CSV</p>
            {uploaded && (
              <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "#F0FDF4" }}>
                <CheckCircle size={16} color="#22C55E" />
                <span style={{ color: "#16A34A", fontSize: 13, fontWeight: 500 }}>Файл загружен успешно!</span>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>История загрузок</p>
          <div className="flex flex-col gap-2">
            {timesheetUploads.map((upload) => {
              const cfg = statusConfig[upload.status];
              return (
                <div key={upload.id} className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                    <FileSpreadsheet size={20} color="#2E7D32" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }} className="truncate">{upload.fileName}</p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>{upload.period} · {upload.employeesCount} сотрудников</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0" style={{ background: cfg.bg }}>
                    <cfg.icon size={12} color={cfg.color} />
                    <span style={{ color: cfg.color, fontSize: 10, fontWeight: 600 }}>{cfg.label}</span>
                  </div>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F1F5F9" }}>
                    <Download size={16} color="#64748B" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
