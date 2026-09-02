"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { NewsPreview } from "@/components/news/NewsPreview";
import { PublishNewsDialog } from "@/components/news/PublishNewsDialog";
import { EmptyState, ErrorMessage, ErrorState, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { canActAsReviewer, canPublishNews, featuredLabels } from "@/lib/permissions";
import type { News } from "@/lib/types";

function getAuthorSuggestion(news: News) {
  return news.requestedFeaturedPosition ? featuredLabels[news.requestedFeaturedPosition] : featuredLabels.normal;
}

function getLatestReviewer(news: News) {
  return news.approvedBy?.name ?? news.reviews.filter((review) => review.action === "APPROVED").at(-1)?.reviewer.name ?? null;
}

export default function RevisarNoticiaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [news, setNews] = useState<News | null>(null);
  const [comment, setComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await api.getNews(params.id);
      setNews(loaded);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve() {
    if (!news) return;
    setSaving(true);
    setError(null);
    try {
      setNews(await api.approveNews(news.id, approveComment));
      setMessage("Noticia aprovada.");
      setApproveComment("");
      setApproveOpen(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function reject() {
    if (!news || !comment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      setNews(await api.rejectNews(news.id, comment));
      setMessage("Noticia rejeitada com comentario.");
      setComment("");
      setRejectOpen(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["ADMIN", "REVIEWER"]}>
      {loading ? <LoadingState /> : null}
      {error && !news ? <ErrorState message={error} /> : null}
      {!loading && news && user ? (
        <>
          <header className="page-header">
            <div>
              <h1>Revisar noticia</h1>
              <p className="muted">
                {news.author.name} - <StatusBadge status={news.status} />
              </p>
            </div>
          </header>

          <div className="form-grid review-layout">
            <section className="panel panel-padding">
              <NewsPreview news={news} />
            </section>

            <aside className="form-stack editorial-sidebar">
              <section className="panel panel-padding form-stack editorial-panel">
                <div className="section-title">
                  <h2>Acoes editoriais</h2>
                </div>
                {!canActAsReviewer(user, news) ? (
                  <ErrorMessage message="Voce nao pode aprovar, rejeitar ou publicar uma noticia propria." />
                ) : null}
                {message ? <SuccessMessage message={message} /> : null}
                {error ? <ErrorMessage message={error} /> : null}

                {news.status === "IN_REVIEW" && canActAsReviewer(user, news) ? (
                  <div className="form-stack editorial-summary">
                    <p className="muted">Esta noticia aguarda sua revisao.</p>
                    <div className="compact-action-row">
                      <button className="button success" type="button" disabled={saving} onClick={() => setApproveOpen(true)}>
                        <Check size={17} aria-hidden />
                        Aprovar
                      </button>
                      <button className="button danger" type="button" disabled={saving} onClick={() => setRejectOpen(true)}>
                        <X size={17} aria-hidden />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ) : null}

                {canPublishNews(user, news) ? (
                  <div className="form-stack editorial-summary">
                    <dl className="editorial-facts">
                      <div>
                        <dt>Status</dt>
                        <dd><StatusBadge status={news.status} /></dd>
                      </div>
                      <div>
                        <dt>Revisor</dt>
                        <dd>{getLatestReviewer(news) ?? "Nao informado"}</dd>
                      </div>
                      <div>
                        <dt>Proxima etapa</dt>
                        <dd>Publicacao</dd>
                      </div>
                      <div>
                        <dt>Sugestao do autor</dt>
                        <dd>{getAuthorSuggestion(news)}</dd>
                      </div>
                    </dl>
                    <div className="compact-action-row">
                      <PublishNewsDialog news={news} onPublished={() => router.replace("/painel/revisoes")} />
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="panel panel-padding">
                <h2>Historico editorial</h2>
                {news.reviews.length === 0 ? (
                  <EmptyState message="Nenhum evento editorial disponivel." />
                ) : (
                  <div className="form-stack">
                    {news.reviews.map((review) => (
                      <div key={review.id} className="card">
                        <strong>
                          {review.reviewer.name} - {review.action === "APPROVED" ? "Aprovou" : "Rejeitou"}
                        </strong>
                        <p className="muted">{formatDate(review.createdAt)}</p>
                        {review.comment ? <p>{review.comment}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>

          <Modal open={approveOpen} title="Aprovar noticia" description="Comentario opcional para orientar a publicacao." onClose={() => setApproveOpen(false)}>
            <div className="form-stack">
              <label className="field">
                <span>Comentario opcional</span>
                <textarea value={approveComment} onChange={(event) => setApproveComment(event.target.value)} maxLength={2000} />
              </label>
              <div className="modal-actions">
                <button className="ghost-button" type="button" disabled={saving} onClick={() => setApproveOpen(false)}>
                  Cancelar
                </button>
                <button className="button success" type="button" disabled={saving} onClick={() => void approve()}>
                  {saving ? "Aprovando..." : "Aprovar"}
                </button>
              </div>
            </div>
          </Modal>

          <Modal open={rejectOpen} title="Rejeitar noticia" description="Informe o motivo para o autor corrigir o conteudo." onClose={() => setRejectOpen(false)}>
            <form className="form-stack" onSubmit={(event) => { event.preventDefault(); void reject(); }}>
              <label className="field">
                <span>Motivo da rejeicao</span>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} required maxLength={2000} />
              </label>
              <div className="modal-actions">
                <button className="ghost-button" type="button" disabled={saving} onClick={() => setRejectOpen(false)}>
                  Cancelar
                </button>
                <button className="button danger" type="submit" disabled={saving || !comment.trim()}>
                  {saving ? "Rejeitando..." : "Rejeitar"}
                </button>
              </div>
            </form>
          </Modal>

        </>
      ) : null}
    </ProtectedRoute>
  );
}
