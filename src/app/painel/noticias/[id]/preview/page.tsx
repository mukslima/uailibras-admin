"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Edit } from "lucide-react";
import { NewsPreview } from "@/components/news/NewsPreview";
import { ErrorState, LoadingState } from "@/components/ui/Feedback";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { canEditNews } from "@/lib/permissions";
import type { News } from "@/lib/types";

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setNews(await api.getNews(params.id));
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
    </>
  );
}
