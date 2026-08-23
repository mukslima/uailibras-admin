"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Send, X } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { NewsPreview } from "@/components/news/NewsPreview";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState, ErrorMessage, ErrorState, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { canActAsReviewer, canPublishNews } from "@/lib/permissions";
import type { News } from "@/lib/types";

export default function RevisarNoticiaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [news, setNews] = useState<News | null>(null);
  const [comment, setComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNews(await api.getNews(params.id));
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
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!news || !comment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      setNews(await api.rejectNews(news.id, comment));
      setMessage("Noticia rejeitada com comentario.");
      setComment("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!news) return;
    setSaving(true);
    setError(null);
    try {
      await api.publishNews(news.id);
      router.replace("/painel/revisoes");
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

          <div className="form-grid">
            <section className="panel panel-padding">
              <NewsPreview news={news} />
            </section>

            <aside className="form-stack">
              <section className="panel panel-padding form-stack">
                <h2>Acoes editoriais</h2>
                {!canActAsReviewer(user, news) ? (
                  <ErrorMessage message="Voce nao pode aprovar, rejeitar ou publicar uma noticia propria." />
                ) : null}
                {message ? <SuccessMessage message={message} /> : null}
                {error ? <ErrorMessage message={error} /> : null}

                {news.status === "IN_REVIEW" && canActAsReviewer(user, news) ? (
                  <>
                    <label className="field">
                      <span>Comentario opcional da aprovacao</span>
                      <textarea value={approveComment} onChange={(event) => setApproveComment(event.target.value)} maxLength={2000} />
                    </label>
                    <button className="button primary" type="button" disabled={saving} onClick={() => void approve()}>
                      <Check size={17} aria-hidden />
                      Aprovar
                    </button>

                    <form className="form-stack" onSubmit={reject}>
                      <label className="field">
                        <span>Motivo da rejeicao</span>
                        <textarea value={comment} onChange={(event) => setComment(event.target.value)} required maxLength={2000} />
                      </label>
                      <button className="button danger" type="submit" disabled={saving || !comment.trim()}>
                        <X size={17} aria-hidden />
                        Rejeitar noticia
                      </button>
                    </form>
                  </>
                ) : null}

                {canPublishNews(user, news) ? (
                  <ConfirmButton message="Publicar esta noticia? Apos a publicacao ela ficara disponivel para o site publico." onConfirm={publish} disabled={saving} className="button primary">
                    <Send size={17} aria-hidden />
                    Publicar
                  </ConfirmButton>
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
        </>
      ) : null}
    </ProtectedRoute>
  );
}
