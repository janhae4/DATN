import { ReactNode } from "react";

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export function DetailRow({ icon, label, children }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-4 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
