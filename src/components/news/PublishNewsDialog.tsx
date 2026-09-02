"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { featuredLabels } from "@/lib/permissions";
import type { News } from "@/lib/types";

function getAuthorSuggestion(news: News) {
  return news.requestedFeaturedPosition ? featuredLabels[news.requestedFeaturedPosition] : featuredLabels.normal;
}

export function PublishNewsDialog({
  news,
  onPublished,
  className = "button success",
}: {
  news: News;
  onPublished?: (news: News) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRepublication = news.status === "ARCHIVED";
  const actionLabel = isRepublication ? "Republicar" : "Publicar";
  const [featuredPosition, setFeaturedPosition] = useState<1 | 2 | null>(isRepublication ? null : news.requestedFeaturedPosition ?? null);

  useEffect(() => {
    if (!open) return;
    setFeaturedPosition(news.status === "ARCHIVED" ? null : news.requestedFeaturedPosition ?? null);
    setError(null);
  }, [news, open]);

  async function publish() {
    setSaving(true);
    setError(null);

    try {
      const published = await api.publishNews(news.id, featuredPosition);
      setOpen(false);
      onPublished?.(published);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className={className} type="button" disabled={saving} onClick={() => setOpen(true)}>
        <Send size={17} aria-hidden />
        {actionLabel}
      </button>

      <Modal
        open={open}
        title={isRepublication ? "Republicar noticia" : "Publicar noticia"}
        description={isRepublication ? "Esta noticia voltara a aparecer no site publico." : "Escolha como a noticia vai aparecer no site."}
        onClose={() => setOpen(false)}
      >
        <div className="form-stack">
          <fieldset className="checkbox-grid">
            <legend>Exibicao no site</legend>
            <label className="choice-card">
              <input type="radio" name={`featuredPosition-${news.id}`} checked={featuredPosition === null} onChange={() => setFeaturedPosition(null)} />
              <span><strong>Noticia normal</strong><small>Publicada sem ocupar area de destaque.</small></span>
            </label>
            <label className="choice-card">
              <input type="radio" name={`featuredPosition-${news.id}`} checked={featuredPosition === 1} onChange={() => setFeaturedPosition(1)} />
              <span><strong>Destaque principal</strong><small>Ocupa a posicao principal da Home.</small></span>
            </label>
            <label className="choice-card">
              <input type="radio" name={`featuredPosition-${news.id}`} checked={featuredPosition === 2} onChange={() => setFeaturedPosition(2)} />
              <span><strong>Destaque secundario</strong><small>Ocupa uma posicao secundaria da Home.</small></span>
            </label>
          </fieldset>
          <p className="muted">Sua escolha pode reorganizar automaticamente os destaques atuais.</p>
          <p className="muted">Sugestao do autor: {getAuthorSuggestion(news)}.</p>
          {error ? <p className="inline-message error">{error}</p> : null}
          <div className="modal-actions">
            <button className="ghost-button" type="button" disabled={saving} onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="button success" type="button" disabled={saving} onClick={() => void publish()}>
              {saving ? `${actionLabel}...` : actionLabel}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
