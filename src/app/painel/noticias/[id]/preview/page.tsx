"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Edit, RefreshCw } from "lucide-react";
import { NewsPreview } from "@/components/news/NewsPreview";
import { PublishNewsDialog } from "@/components/news/PublishNewsDialog";
import { UnpublishNewsDialog } from "@/components/news/UnpublishNewsDialog";
import { ErrorMessage, ErrorState, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { canActAsReviewer, canEditNews, canPublishNews, canStartPublishedRevision, canUnpublishNews, featuredDescriptions, featuredLabels } from "@/lib/permissions";
import type { News } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [news, setNews] = useState<News | null>(null);
  const [featuredPosition, setFeaturedPosition] = useState<1 | 2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const loaded = await api.getNews(params.id);
        setNews(loaded);
        setFeaturedPosition(loaded.featuredPosition === 1 || loaded.featuredPosition === 2 ? loaded.featuredPosition : null);
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!news) return <ErrorState message="Noticia nao encontrada." />;

  async function updateFeaturedPosition() {
    if (!news) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.featureNews(news.id, featuredPosition);
      setNews(updated);
      setMessage("Destaque atualizado.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function startPublishedRevision() {
    if (!news) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const revision = await api.createPublishedRevision(news.id);
      window.location.href = `/painel/noticias/${revision.id}/editar`;
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Preview da noticia</h1>
          <p className="muted">Visualizacao limpa dentro do painel.</p>
        </div>
        <div className="actions">
          {user && canEditNews(user, news) ? (
            <Link className="button secondary" href={`/painel/noticias/${news.id}/editar`}>
              <Edit size={17} aria-hidden />
              Editar
            </Link>
          ) : null}
          {user && canStartPublishedRevision(user, news) ? (
            <button className="button secondary" type="button" disabled={saving} onClick={() => void startPublishedRevision()}>
              <RefreshCw size={17} aria-hidden />
              Editar publicada
            </button>
          ) : null}
          {user && canPublishNews(user, news) ? (
            <PublishNewsDialog
              news={news}
              onPublished={(published) => {
                setNews(published);
                setMessage(news.status === "ARCHIVED" ? "Noticia republicada com sucesso." : "Noticia publicada com sucesso.");
              }}
            />
          ) : null}
          {user && canUnpublishNews(user, news) ? (
            <UnpublishNewsDialog
              news={news}
              onUnpublished={(unpublished) => {
                setNews(unpublished);
                setFeaturedPosition(null);
                setMessage("Noticia despublicada com sucesso.");
              }}
            />
          ) : null}
        </div>
      </header>
      <section className="workflow-box" aria-label="Status editorial">
        <strong><StatusBadge status={news.status} /></strong>
        <p className="muted">
          {news.status === "PUBLISHED"
            ? "Esta versao esta disponivel no site publico. Para alterar conteudo, inicie um novo ciclo de edicao e revisao."
            : news.status === "APPROVED"
              ? "Pronta para publicacao."
              : news.status === "ARCHIVED"
                ? "Despublicada: nao aparece no site publico e pode ser republicada."
              : news.status === "IN_REVIEW"
                ? "Aguardando analise editorial."
                : news.status === "REJECTED"
                  ? "Precisa de ajustes antes de voltar para revisao."
                  : "Rascunho ainda nao enviado para revisao."}
        </p>
      </section>
      {message ? <SuccessMessage message={message} /> : null}
      <section className="panel panel-padding">
        <NewsPreview news={news} />
      </section>
      {user && news.status === "PUBLISHED" && canActAsReviewer(user, news) ? (
        <section className="panel panel-padding form-stack" style={{ marginTop: 16 }}>
          <h2>Destaque editorial</h2>
          <fieldset className="checkbox-grid">
            <legend>Exibicao no site</legend>
            <div className="choice-grid">
              <label className="choice-card">
                <input type="radio" name="publishedFeaturedPosition" checked={featuredPosition === null} onChange={() => setFeaturedPosition(null)} />
                <span><strong>{featuredLabels.normal}</strong><small>{featuredDescriptions.normal}</small></span>
              </label>
              <label className="choice-card">
                <input type="radio" name="publishedFeaturedPosition" checked={featuredPosition === 1} onChange={() => setFeaturedPosition(1)} />
                <span><strong>{featuredLabels[1]}</strong><small>{featuredDescriptions[1]}</small></span>
              </label>
              <label className="choice-card">
                <input type="radio" name="publishedFeaturedPosition" checked={featuredPosition === 2} onChange={() => setFeaturedPosition(2)} />
                <span><strong>{featuredLabels[2]}</strong><small>{featuredDescriptions[2]}</small></span>
              </label>
            </div>
          </fieldset>
          {error ? <ErrorMessage message={error} /> : null}
          <button className="button primary" type="button" disabled={saving} onClick={() => void updateFeaturedPosition()}>
            {saving ? "Atualizando..." : "Atualizar destaque"}
          </button>
        </section>
      ) : null}
    </>
  );
}
