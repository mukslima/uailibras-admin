import { statusLabels } from "@/lib/permissions";
import type { NewsStatus } from "@/lib/types";

const statusMarks: Record<NewsStatus, string> = {
  DRAFT: "D",
  IN_REVIEW: "R",
  REJECTED: "!",
  APPROVED: "A",
  PUBLISHED: "P",
  ARCHIVED: "X",
};

export function StatusBadge({ status }: { status: NewsStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span aria-hidden>{statusMarks[status]}</span>
      {statusLabels[status]}
    </span>
  );
}
