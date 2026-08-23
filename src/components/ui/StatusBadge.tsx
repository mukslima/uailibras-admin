import { statusLabels } from "@/lib/permissions";
import type { NewsStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: NewsStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{statusLabels[status]}</span>;
}
