// React import not needed in React 18+

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
  bgColor?: string;
  src?: string;
}

const COLORS = [
  "#2E7D32", "#C41E3A", "#F5A623", "#059669", "#D97706", "#DC2626",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, size = 40, className = "", bgColor, src }: AvatarProps) {
  const bg = bgColor || getColor(name);
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.36);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full flex-shrink-0 object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: bg }}
    >
      <span style={{ color: "#fff", fontSize, fontWeight: 600, lineHeight: 1 }}>
        {initials}
      </span>
    </div>
  );
}
