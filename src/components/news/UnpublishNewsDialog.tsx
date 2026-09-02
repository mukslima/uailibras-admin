"use client";

import { useState } from "react";
import { ArchiveX } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import type { News } from "@/lib/types";

export function UnpublishNewsDialog({
  news,
  onUnpublished,
  className = "button danger",
}: {
  news: News;
  onUnpublished?: (news: News) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unpublish() {
    setSaving(true);
    setError(null);

    try {
      const unpublished = await api.unpublishNews(news.id);
      setOpen(false);
      onUnpublished?.(unpublished);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className={className} type="button" disabled={saving} onClick={() => setOpen(true)}>
        <ArchiveX size={17} aria-hidden />
        Despublicar
      </button>

      <ConfirmDialog
        open={open}
        title="Despublicar noticia"
        description={
          <div className="form-stack">
            <p>
              Esta noticia deixara de aparecer no site publico, mas continuara salva no painel e podera ser republicada
              posteriormente.
            </p>
            {error ? <p className="inline-message error">{error}</p> : null}
          </div>
        }
        confirmLabel="Despublicar"
        variant="danger"
        loading={saving}
        onClose={() => setOpen(false)}
        onConfirm={() => void unpublish()}
      />
    </>
  );
}
