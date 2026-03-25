import { useEffect } from "react";

interface Props {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[6px] border px-4 py-2 text-sm font-medium text-white"
      style={{
        background: type === "success" ? "#5E5CE6" : "#DC2626",
        borderColor: type === "success" ? "#5E5CE6" : "#DC2626",
      }}
    >
      {message}
    </div>
  );
}
