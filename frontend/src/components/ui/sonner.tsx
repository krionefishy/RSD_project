import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "#fff",
          "--normal-text": "#1E293B",
          "--normal-border": "#E2E8F0",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
