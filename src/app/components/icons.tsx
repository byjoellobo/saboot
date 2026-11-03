// A small authored icon set: 24px grid, 1.75 stroke, round caps and joins.
// Icons are decorative unless given a `label`, in which case they are announced.
import type { ReactNode } from "react";

export type IconName = "check" | "cross" | "alert" | "info" | "upload" | "device" | "lock" | "offline" | "source" | "download" | "file";

const PATHS: Readonly<Record<IconName, ReactNode>> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: (
    <>
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.5L21 19.5H3L12 4.5z" />
      <path d="M12 10v4.2" />
      <path d="M12 16.9v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8v.1" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15.5V4.5" />
      <path d="M7.5 9L12 4.5 16.5 9" />
      <path d="M4.5 14.5v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3.5" />
    </>
  ),
  device: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 17.5h2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  offline: (
    <>
      <path d="M2.8 9.2a13 13 0 0 1 18.4 0" />
      <path d="M6 12.6a8.5 8.5 0 0 1 12 0" />
      <path d="M9.3 16a4 4 0 0 1 5.4 0" />
      <path d="M12 19.3v.1" />
      <path d="M4 4l16 16" />
    </>
  ),
  source: (
    <>
      <path d="M8.5 7.5L4 12l4.5 4.5" />
      <path d="M15.5 7.5L20 12l-4.5 4.5" />
      <path d="M13.5 5l-3 14" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.5v11" />
      <path d="M7.5 11L12 15.5 16.5 11" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  file: (
    <>
      <path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5L14 3.5z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 12.5h6M9 15.5h6" />
    </>
  ),
};

export function Icon({ name, size = 20, label, className }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
