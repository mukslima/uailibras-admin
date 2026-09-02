"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { PublishNewsDialog } from "@/components/news/PublishNewsDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { canPublishNews } from "@/lib/permissions";
import type { News } from "@/lib/types";

export default function RevisoesPage() {
  const { user } = useAuth();
  const [inReview, setInReview] = useState<News[]>([]);
  const [approved, setApproved] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewResult, approvedResult] = await Promise.all([
        api.listNews({ status: "IN_REVIEW", pageSize: 50 }),
        api.listNews({ status: "APPROVED", pageSize: 50 }),
      ]);
      setInReview(reviewResult.items);
      setApproved(approvedResult.items);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publishable = user ? approved.filter((news) => canPublishNews(user, news)) : [];
  const hasWork = inReview.length > 0 || publishable.length > 0;

  function renderTable(items: News[], action: "review" | "publish") {
    return (
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
            {items.map((news) => (
              <tr key={news.id}>
                <td data-label="Titulo">{news.title}</td>
                <td data-label="Autor">{news.author.name}</td>
                <td data-label="Categoria principal">{news.primaryCategory?.name ?? "-"}</td>
                <td data-label="Status"><StatusBadge status={news.status} /></td>
                <td data-label="Atualizada em">{formatDate(news.updatedAt)}</td>
                <td data-label="Acoes">
                  <div className="compact-action-row">
                    <Link className="ghost-button" href={`/painel/revisoes/${news.id}`}>
                      <Eye size={16} aria-hidden />
                      {action === "review" ? "Revisar" : "Visualizar"}
                    </Link>
                    {action === "publish" ? <PublishNewsDialog news={news} onPublished={() => void load()} /> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ProtectedRoute roles={["ADMIN", "REVIEWER"]}>
      <header className="page-header">
        <div>
          <h1>Revisoes</h1>
          <p className="muted">Fila de conteudos aguardando revisao ou publicacao.</p>
        </div>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && !hasWork ? <EmptyState message="Nenhuma noticia aguardando revisao ou publicacao." /> : null}

      {!loading && inReview.length > 0 ? (
        <section className="panel">
          <div className="panel-padding section-title">
            <div>
              <h2>Aguardando revisao</h2>
              <p className="muted">Noticias enviadas para avaliacao editorial.</p>
            </div>
            <span className="tag-chip">{inReview.length}</span>
          </div>
          {renderTable(inReview, "review")}
        </section>
      ) : null}

      {!loading && publishable.length > 0 ? (
        <section className="panel">
          <div className="panel-padding section-title">
            <div>
              <h2>Aguardando publicacao</h2>
              <p className="muted">Noticias aprovadas que ainda precisam ser publicadas.</p>
            </div>
            <span className="tag-chip">{publishable.length}</span>
          </div>
          {renderTable(publishable, "publish")}
        </section>
      ) : null}
    </ProtectedRoute>
  );
}
