"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Edit } from "lucide-react";
import { NewsPreview } from "@/components/news/NewsPreview";
import { ErrorMessage, ErrorState, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { canActAsReviewer, canEditNews, featuredLabels } from "@/lib/permissions";
import type { News } from "@/lib/types";

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

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Preview da noticia</h1>
          <p className="muted">Visualizacao limpa dentro do painel.</p>
        </div>
        {user && canEditNews(user, news) ? (
          <Link className="button secondary" href={`/painel/noticias/${news.id}/editar`}>
            <Edit size={17} aria-hidden />
            Editar
          </Link>
        ) : null}
      </header>
      <section className="panel panel-padding">
        <NewsPreview news={news} />
      </section>
      {user && news.status === "PUBLISHED" && canActAsReviewer(user, news) ? (
        <section className="panel panel-padding form-stack" style={{ marginTop: 16 }}>
          <h2>Destaque editorial</h2>
          <fieldset className="checkbox-grid">
            <legend>Exibicao no site</legend>
            <label className="checkbox-pill">
              <input type="radio" name="publishedFeaturedPosition" checked={featuredPosition === null} onChange={() => setFeaturedPosition(null)} />
              {featuredLabels.normal}
            </label>
            <label className="checkbox-pill">
              <input type="radio" name="publishedFeaturedPosition" checked={featuredPosition === 1} onChange={() => setFeaturedPosition(1)} />
              {featuredLabels[1]}
            </label>
            <label className="checkbox-pill">
              <input type="radio" name="publishedFeaturedPosition" checked={featuredPosition === 2} onChange={() => setFeaturedPosition(2)} />
              {featuredLabels[2]}
            </label>
          </fieldset>
          {message ? <SuccessMessage message={message} /> : null}
          {error ? <ErrorMessage message={error} /> : null}
          <button className="button primary" type="button" disabled={saving} onClick={() => void updateFeaturedPosition()}>
            {saving ? "Atualizando..." : "Atualizar destaque"}
          </button>
        </section>
      ) : null}
    </>
  );
}
