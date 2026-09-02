import { describe, expect, it } from "vitest";
import { canActAsReviewer, canCreateNews, canEditNews, canManageAdmin, canPublishNews, canReview, canUnpublishNews } from "./permissions";
import type { News, User } from "./types";

const admin: User = {
  id: "admin",
  username: "admin",
  name: "Admin",
  email: "admin@uailibras.test",
  role: "ADMIN",
  active: true,
  createdAt: "",
  updatedAt: "",
};

const author: User = {
  ...admin,
  id: "author",
  username: "author",
  role: "AUTHOR",
};

const reviewer: User = {
  ...admin,
  id: "reviewer",
  username: "reviewer",
  role: "REVIEWER",
};

function news(overrides: Partial<News> = {}): News {
  return {
    id: "news",
    title: "Titulo",
    slug: "titulo",
    summary: "Resumo completo",
    content: "<p>Conteudo</p>",
    status: "DRAFT",
    authorId: author.id,
    createdAt: "",
    updatedAt: "",
    author,
    categories: [],
    tags: [],
    media: [],
    reviews: [],
    ...overrides,
  };
}

describe("role permissions", () => {
  it("shows creation only for admin and author", () => {
    expect(canCreateNews("ADMIN")).toBe(true);
    expect(canCreateNews("AUTHOR")).toBe(true);
    expect(canCreateNews("REVIEWER")).toBe(false);
  });

  it("keeps administrative areas admin-only", () => {
    expect(canManageAdmin("ADMIN")).toBe(true);
    expect(canManageAdmin("AUTHOR")).toBe(false);
    expect(canManageAdmin("REVIEWER")).toBe(false);
  });

  it("allows reviewer actions only for admin and reviewer", () => {
    expect(canReview("ADMIN")).toBe(true);
    expect(canReview("REVIEWER")).toBe(true);
    expect(canReview("AUTHOR")).toBe(false);
  });

  it("does not allow approving or publishing own news", () => {
    const ownNews = news({ authorId: admin.id, status: "APPROVED" });
    expect(canActAsReviewer(admin, ownNews)).toBe(false);
    expect(canPublishNews(admin, ownNews)).toBe(false);
  });

  it("prevents reviewer from editing and author from editing third-party news", () => {
    expect(canEditNews(reviewer, news())).toBe(false);
    expect(canEditNews(author, news({ authorId: "other" }))).toBe(false);
    expect(canEditNews(author, news({ status: "REJECTED" }))).toBe(true);
  });

  it("allows publishing approved third-party news", () => {
    expect(canPublishNews(reviewer, news({ status: "APPROVED" }))).toBe(true);
    expect(canPublishNews(reviewer, news({ status: "ARCHIVED" }))).toBe(true);
    expect(canPublishNews(reviewer, news({ status: "IN_REVIEW" }))).toBe(false);
  });

  it("allows unpublishing only published third-party news", () => {
    expect(canUnpublishNews(reviewer, news({ status: "PUBLISHED" }))).toBe(true);
    expect(canUnpublishNews(reviewer, news({ status: "APPROVED" }))).toBe(false);
    expect(canUnpublishNews(admin, news({ authorId: admin.id, status: "PUBLISHED" }))).toBe(false);
  });
});
