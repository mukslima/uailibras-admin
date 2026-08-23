import type { News, Role, User } from "./types";

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  AUTHOR: "Autor",
  REVIEWER: "Revisor",
};

export const statusLabels = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em revisao",
  REJECTED: "Rejeitada",
  APPROVED: "Aprovada",
  PUBLISHED: "Publicada",
  ARCHIVED: "Arquivada",
} as const;

export const featuredLabels: Record<"normal" | 1 | 2 | 3, string> = {
  normal: "Noticia normal",
  1: "Destaque principal",
  2: "Destaque secundario",
  3: "Destaque secundario anterior",
};

export function canCreateNews(role: Role) {
  return role === "ADMIN" || role === "AUTHOR";
}

export function canManageAdmin(role: Role) {
  return role === "ADMIN";
}

export function canReview(role: Role) {
  return role === "ADMIN" || role === "REVIEWER";
}

export function canEditNews(user: User, news: News) {
  if (user.role === "REVIEWER") return false;
  if (user.role === "ADMIN") return news.status !== "PUBLISHED" && news.status !== "ARCHIVED";
  return news.authorId === user.id && (news.status === "DRAFT" || news.status === "REJECTED");
}

export function canSubmitNews(user: User, news: News) {
  return news.authorId === user.id && (news.status === "DRAFT" || news.status === "REJECTED");
}

export function canActAsReviewer(user: User, news: News) {
  return canReview(user.role) && user.id !== news.authorId;
}

export function canPublishNews(user: User, news: News) {
  return canActAsReviewer(user, news) && news.status === "APPROVED";
}
