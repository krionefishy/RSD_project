import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ message, fullScreen = false }: PageLoaderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      style={{
        minHeight: fullScreen ? "100vh" : "60vh",
        background: "#F8FAFC",
      }}
    >
      <Loader2 size={28} color="#2E7D32" className="animate-spin" />
      {message && (
        <p style={{ color: "#64748B", fontSize: 13 }}>{message}</p>
      )}
    </div>
  );
}
