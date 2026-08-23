"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NewsForm } from "@/components/news/NewsForm";
import { ErrorState, LoadingState } from "@/components/ui/Feedback";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { canEditNews } from "@/lib/permissions";
import type { News } from "@/lib/types";

export default function EditarNoticiaPage() {
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
  if (!news || !user || !canEditNews(user, news)) return <ErrorState message="Voce nao pode editar esta noticia." />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Editar noticia</h1>
          <p className="muted">Atualize o conteudo e salve ou envie novamente para revisao.</p>
        </div>
      </header>
      <NewsForm news={news} />
    </>
  );
}
