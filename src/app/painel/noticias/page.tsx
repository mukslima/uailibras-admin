"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Eye, Plus, RefreshCw, Send } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import { PublishNewsDialog } from "@/components/news/PublishNewsDialog";
import { UnpublishNewsDialog } from "@/components/news/UnpublishNewsDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { canCreateNews, canEditNews, canPublishNews, canStartPublishedRevision, canSubmitNews, canUnpublishNews, featuredLabels } from "@/lib/permissions";
import type { News, NewsStatus } from "@/lib/types";

export default function NoticiasPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<NewsStatus | "">("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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
    setError(null);
    setMessage(null);
    try {
      await api.submitNews(id);
      setMessage("Noticia enviada para revisao.");
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function startPublishedRevision(id: string) {
    setError(null);
    setMessage(null);
    try {
      const revision = await api.createPublishedRevision(id);
      setMessage("Ciclo de edicao criado. A versao publicada continua ativa ate a republicacao.");
      window.location.href = `/painel/noticias/${revision.id}/editar`;
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
              <option value="ARCHIVED">Despublicada</option>
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
      {message ? <SuccessMessage message={message} /> : null}
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
                  <th>Destaque</th>
                  <th>Atualizada em</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((news) => (
                  <tr key={news.id}>
                    <td data-label="Titulo">
                      <div className="cell-title">
                        <strong>{news.title}</strong>
                        <span className="muted">{news.revisionOfId ? "Revisao de noticia publicada" : news.summary}</span>
                      </div>
                    </td>
                    <td data-label="Autor">{news.author.name}</td>
                    <td data-label="Categoria principal">{news.primaryCategory?.name ?? "-"}</td>
                    <td data-label="Status"><StatusBadge status={news.status} /></td>
                    <td data-label="Destaque">{news.featuredPosition ? featuredLabels[news.featuredPosition] : news.requestedFeaturedPosition ? `Sugestao: ${featuredLabels[news.requestedFeaturedPosition]}` : featuredLabels.normal}</td>
                    <td data-label="Atualizada em">{formatDate(news.updatedAt)}</td>
                    <td data-label="Acoes">
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
                        {user && canStartPublishedRevision(user, news) ? (
                          <button className="ghost-button" type="button" onClick={() => void startPublishedRevision(news.id)}>
                            <RefreshCw size={16} aria-hidden />
                            Editar publicada
                          </button>
                        ) : null}
                        {user && canPublishNews(user, news) ? (
                          <PublishNewsDialog
                            news={news}
                            onPublished={() => {
                              setMessage(news.status === "ARCHIVED" ? "Noticia republicada com sucesso." : "Noticia publicada com sucesso.");
                              void load();
                            }}
                          />
                        ) : null}
                        {user && canUnpublishNews(user, news) ? (
                          <UnpublishNewsDialog
                            news={news}
                            onUnpublished={() => {
                              setMessage("Noticia despublicada com sucesso.");
                              void load();
                            }}
                          />
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
