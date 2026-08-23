"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Eye, Plus, Send } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { canCreateNews, canEditNews, canSubmitNews } from "@/lib/permissions";
import type { News, NewsStatus } from "@/lib/types";

export default function NoticiasPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<NewsStatus | "">("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listNews({ pageSize: 50, status: status || undefined });
      setItems(result.items);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? items.filter((news) => news.title.toLowerCase().includes(term)) : items;
  }, [items, search]);

  async function submit(id: string) {
    try {
      await api.submitNews(id);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{user?.role === "AUTHOR" ? "Minhas Noticias" : "Noticias"}</h1>
          <p className="muted">Listagem editorial com acoes permitidas conforme sua role.</p>
        </div>
        {user && canCreateNews(user.role) ? (
          <Link className="button primary" href="/painel/noticias/nova">
            <Plus size={17} aria-hidden />
            Nova noticia
          </Link>
        ) : null}
      </header>

      <div className="toolbar">
        <div className="filters">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as NewsStatus | "")}>
              <option value="">Todos</option>
              <option value="DRAFT">Rascunho</option>
              <option value="IN_REVIEW">Em revisao</option>
              <option value="REJECTED">Rejeitada</option>
              <option value="APPROVED">Aprovada</option>
              <option value="PUBLISHED">Publicada</option>
              <option value="ARCHIVED">Arquivada</option>
            </select>
          </label>
          <label className="field">
            <span>Busca por titulo</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digite parte do titulo" />
          </label>
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && filtered.length === 0 ? <EmptyState message="Nenhuma noticia encontrada." /> : null}

      {!loading && filtered.length > 0 ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Autor</th>
                  <th>Categoria principal</th>
                  <th>Status</th>
                  <th>Atualizada em</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((news) => (
                  <tr key={news.id}>
                    <td>{news.title}</td>
                    <td>{news.author.name}</td>
                    <td>{news.primaryCategory?.name ?? "-"}</td>
                    <td><StatusBadge status={news.status} /></td>
                    <td>{formatDate(news.updatedAt)}</td>
                    <td>
                      <div className="actions">
                        <Link className="ghost-button" href={`/painel/noticias/${news.id}/preview`}>
                          <Eye size={16} aria-hidden />
                          Preview
                        </Link>
                        {user && canEditNews(user, news) ? (
                          <Link className="ghost-button" href={`/painel/noticias/${news.id}/editar`}>
                            <Edit size={16} aria-hidden />
                            Editar
                          </Link>
                        ) : null}
                        {user && canSubmitNews(user, news) ? (
                          <button className="button secondary" type="button" onClick={() => void submit(news.id)}>
                            <Send size={16} aria-hidden />
                            Enviar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
