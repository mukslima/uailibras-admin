import { ApiError } from "./errors";
import type { Category, Media, News, NewsPayload, NewsStatus, Paginated, Tag, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

let accessToken: string | null = null;
let refreshPromise: Promise<{ accessToken: string; user: User }> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? "Erro na requisicao.");
  }

  return data as T;
}

type ApiOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isForm = options.body instanceof FormData;

  if (!isForm && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && options.auth !== false && options.retry !== false) {
    try {
      await refreshSession();
      return apiFetch<T>(path, { ...options, retry: false });
    } catch {
      setAccessToken(null);
    }
  }

  return parseResponse<T>(response);
}

export async function login(identifier: string, password: string) {
  const result = await apiFetch<{ accessToken: string; user: User }>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ identifier, password }),
  });
  setAccessToken(result.accessToken);
  return result.user;
}

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = apiFetch<{ accessToken: string; user: User }>("/auth/refresh", {
      method: "POST",
      auth: false,
    }).finally(() => {
      refreshPromise = null;
    });
  }

  const result = await refreshPromise;
  setAccessToken(result.accessToken);
  return result;
}

export async function getMe() {
  return apiFetch<User>("/auth/me");
}

export async function logout() {
  await apiFetch<{ success: boolean }>("/auth/logout", { method: "POST", auth: false });
  setAccessToken(null);
}

export async function listNews(params: { page?: number; pageSize?: number; status?: NewsStatus } = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 50));
  if (params.status) query.set("status", params.status);
  return apiFetch<Paginated<News>>(`/admin/news?${query.toString()}`);
}

export async function getNews(id: string) {
  return apiFetch<News>(`/admin/news/${id}`);
}

export async function createNews(payload: NewsPayload) {
  return apiFetch<News>("/news", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateNews(id: string, payload: Partial<NewsPayload>) {
  return apiFetch<News>(`/news/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function submitNews(id: string) {
  return apiFetch<News>(`/news/${id}/submit`, { method: "POST" });
}

export async function approveNews(id: string, comment?: string) {
  return apiFetch<News>(`/news/${id}/approve`, { method: "POST", body: JSON.stringify({ comment }) });
}

export async function rejectNews(id: string, comment: string) {
  return apiFetch<News>(`/news/${id}/reject`, { method: "POST", body: JSON.stringify({ comment }) });
}

export async function publishNews(id: string) {
  return apiFetch<News>(`/news/${id}/publish`, { method: "POST" });
}

export async function archiveNews(id: string) {
  return apiFetch<News>(`/news/${id}/archive`, { method: "POST" });
}

export async function listCategories(includeInactive = true) {
  return apiFetch<Category[]>(includeInactive ? "/categories/internal/all" : "/categories");
}

export async function createCategory(payload: { name: string; slug?: string; active?: boolean }) {
  return apiFetch<Category>("/categories", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateCategory(id: string, payload: Partial<Category>) {
  return apiFetch<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function listTags() {
  return apiFetch<Tag[]>("/tags");
}

export async function createTag(payload: { name: string; slug?: string }) {
  return apiFetch<Tag>("/tags", { method: "POST", body: JSON.stringify(payload) });
}

export async function uploadMedia(file: File) {
  const form = new FormData();
  form.set("file", file);
  return apiFetch<Media>("/media", { method: "POST", body: form });
}

export async function listUsers() {
  return apiFetch<User[]>("/users");
}

export async function createUser(payload: {
  name: string;
  username: string;
  email: string;
  password: string;
  role: User["role"];
}) {
  return apiFetch<User>("/users", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateUser(id: string, payload: Partial<Pick<User, "name" | "username" | "email" | "role" | "active">>) {
  return apiFetch<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}
