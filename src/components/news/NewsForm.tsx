"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImagePlus, Save, Send, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";
import { NewsPreview } from "./NewsPreview";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import type { Category, Media, News, NewsPayload, Tag } from "@/lib/types";
import { ErrorMessage, SuccessMessage } from "@/components/ui/Feedback";

const emptyPayload: NewsPayload = {
  title: "",
  summary: "",
  content: "<p></p>",
  primaryCategoryId: "",
  categoryIds: [],
  tagIds: [],
  tags: [],
  mediaIds: [],
  coverImageId: null,
  requestedFeaturedPosition: null,
};

export function NewsForm({ news }: { news?: News }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [cover, setCover] = useState<Media | null>(news?.coverImage ?? null);
  const [newTag, setNewTag] = useState("");
  const [payload, setPayload] = useState<NewsPayload>(() =>
    news
      ? {
          title: news.title,
          summary: news.summary,
          content: news.content,
          primaryCategoryId: news.primaryCategoryId ?? "",
          categoryIds: news.categories.map((item) => item.category.id),
          tagIds: news.tags.map((item) => item.tag.id),
          tags: [],
          mediaIds: news.media.map((item) => item.media.id),
          coverImageId: news.coverImageId,
          requestedFeaturedPosition: news.requestedFeaturedPosition ?? null,
        }
      : emptyPayload,
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoryList, tagList] = await Promise.all([api.listCategories(false), api.listTags()]);
        setCategories(categoryList);
        setTags(tagList);
        if (!news && categoryList[0]) {
          setPayload((current) => ({
            ...current,
            primaryCategoryId: categoryList[0].id,
            categoryIds: [categoryList[0].id],
          }));
        }
      } catch (err) {
        setError(friendlyError(err));
      }
    }

    void loadOptions();
  }, [news]);

  const latestRejection = useMemo(() => news?.reviews.filter((review) => review.action === "REJECTED").at(-1), [news]);

  function setPrimaryCategory(categoryId: string) {
    setPayload((current) => ({
      ...current,
      primaryCategoryId: categoryId,
      categoryIds: [...new Set([categoryId, ...current.categoryIds.filter((id) => id !== current.primaryCategoryId)])],
    }));
  }

  function toggleCategory(categoryId: string, checked: boolean) {
    setPayload((current) => {
      const next = checked ? [...new Set([...current.categoryIds, categoryId])] : current.categoryIds.filter((id) => id !== categoryId);
      return {
        ...current,
        categoryIds: current.primaryCategoryId === categoryId ? [...new Set([categoryId, ...next])] : next,
      };
    });
  }

  async function handleCover(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const media = await api.uploadMedia(file);
      setCover(media);
      setPayload((current) => ({ ...current, coverImageId: media.id }));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setUploading(false);
    }
  }

  async function saveDraft(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const saved = news ? await api.updateNews(news.id, payload) : await api.createNews(payload);
      setMessage("Rascunho salvo com sucesso.");
      router.replace(`/painel/noticias/${saved.id}/editar`);
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveAndSubmit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const saved = news ? await api.updateNews(news.id, payload) : await api.createNews(payload);
      await api.submitNews(saved.id);
      router.replace("/painel/noticias");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-grid">
      <form className="form-stack panel panel-padding" onSubmit={saveDraft}>
        {latestRejection?.comment ? (
          <div className="review-comment" role="status">
            <strong>Esta noticia precisa de correcoes.</strong>
            <p>{latestRejection.comment}</p>
          </div>
        ) : null}

        <label className="field">
          <span>Titulo</span>
          <input value={payload.title} onChange={(event) => setPayload({ ...payload, title: event.target.value })} required minLength={3} maxLength={180} />
        </label>

        <label className="field">
          <span>Resumo</span>
          <textarea value={payload.summary} onChange={(event) => setPayload({ ...payload, summary: event.target.value })} required minLength={10} maxLength={320} />
        </label>

        <div className="cover-uploader">
          <div className="section-title">
            <div>
              <strong>Imagem de capa</strong>
              <p className="muted">PNG, JPG ou WEBP. Use imagem horizontal sempre que possivel.</p>
            </div>
            <label className="ghost-button">
              <ImagePlus size={17} aria-hidden />
              {cover ? "Trocar" : "Selecionar"}
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void handleCover(event.target.files?.[0])} />
            </label>
          </div>
          {uploading ? <p className="muted">Enviando capa...</p> : null}
          {cover ? (
            <div className="cover-preview-wrap">
              <Image
                className="cover-preview"
                src={cover.url}
                alt={cover.originalName}
                width={cover.width ?? 1200}
                height={cover.height ?? 675}
                unoptimized
              />
              <button type="button" className="ghost-button" onClick={() => { setCover(null); setPayload({ ...payload, coverImageId: null }); }}>
                <X size={16} aria-hidden />
                Remover capa
              </button>
            </div>
          ) : (
            <p className="muted">Nenhuma capa selecionada.</p>
          )}
        </div>

        <label className="field">
          <span>Categoria principal</span>
          <select value={payload.primaryCategoryId} onChange={(event) => setPrimaryCategory(event.target.value)} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="checkbox-grid">
          <legend>Sugestao de destaque</legend>
          <div className="choice-grid">
          <label className="choice-card">
            <input
              type="radio"
              name="requestedFeaturedPosition"
              checked={payload.requestedFeaturedPosition === null}
              onChange={() => setPayload({ ...payload, requestedFeaturedPosition: null })}
            />
            <span><strong>Noticia normal</strong><small>Publicada sem ocupar area de destaque.</small></span>
          </label>
          <label className="choice-card">
            <input
              type="radio"
              name="requestedFeaturedPosition"
              checked={payload.requestedFeaturedPosition === 1}
              onChange={() => setPayload({ ...payload, requestedFeaturedPosition: 1 })}
            />
            <span><strong>Destaque principal</strong><small>Sugere a posicao principal da Home para a revisao.</small></span>
          </label>
          <label className="choice-card">
            <input
              type="radio"
              name="requestedFeaturedPosition"
              checked={payload.requestedFeaturedPosition === 2}
              onChange={() => setPayload({ ...payload, requestedFeaturedPosition: 2 })}
            />
            <span><strong>Destaque secundario</strong><small>Sugere uma posicao secundaria na Home.</small></span>
          </label>
          </div>
          <p className="muted">Esta e uma sugestao. A posicao final podera ser alterada durante a revisao.</p>
        </fieldset>

        <fieldset className="checkbox-grid">
          <legend>Categorias adicionais</legend>
          <div className="checkbox-list">
            {categories.map((category) => (
              <label className="checkbox-pill" key={category.id}>
                <input
                  type="checkbox"
                  checked={payload.categoryIds.includes(category.id)}
                  disabled={payload.primaryCategoryId === category.id}
                  onChange={(event) => toggleCategory(category.id, event.target.checked)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="checkbox-grid">
          <legend>Tags existentes</legend>
          <div className="checkbox-list">
            {tags.map((tag) => (
              <label className="checkbox-pill" key={tag.id}>
                <input
                  type="checkbox"
                  checked={payload.tagIds.includes(tag.id)}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      tagIds: event.target.checked ? [...current.tagIds, tag.id] : current.tagIds.filter((id) => id !== tag.id),
                    }))
                  }
                />
                {tag.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>Adicionar tag nova</span>
          <div className="input-with-button">
            <input value={newTag} onChange={(event) => setNewTag(event.target.value)} minLength={2} />
            <button
              type="button"
              onClick={() => {
                const trimmed = newTag.trim();
                if (!trimmed || payload.tags.includes(trimmed)) return;
                setPayload({ ...payload, tags: [...payload.tags, trimmed] });
                setNewTag("");
              }}
            >
              Adicionar
            </button>
          </div>
        </label>
        {payload.tags.length > 0 ? (
          <div className="tag-row">
            {payload.tags.map((tag) => (
              <button key={tag} className="tag-chip" type="button" onClick={() => setPayload({ ...payload, tags: payload.tags.filter((item) => item !== tag) })}>
                {tag} x
              </button>
            ))}
          </div>
        ) : null}

        <label className="field">
          <span>Conteudo</span>
          <small>Use a toolbar para estruturar texto, alinhar paragrafos e ajustar imagens inseridas.</small>
          <RichTextEditor value={payload.content} onChange={(content) => setPayload((current) => ({ ...current, content }))} />
        </label>

        {message ? <SuccessMessage message={message} /> : null}
        {error ? <ErrorMessage message={error} /> : null}

        <div className="actions">
          <button className="button secondary" type="submit" disabled={loading}>
            <Save size={17} aria-hidden />
            {loading ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button className="button primary" type="button" disabled={loading} onClick={() => void saveAndSubmit()}>
            <Send size={17} aria-hidden />
            Enviar para revisao
          </button>
          <label className="ghost-button">
            <Upload size={17} aria-hidden />
            Upload de capa
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void handleCover(event.target.files?.[0])} />
          </label>
        </div>
      </form>

      <section className="panel panel-padding" aria-labelledby="preview-title">
        <h2 id="preview-title">Preview</h2>
        <NewsPreview draft={payload} categories={categories} tags={tags} cover={cover} />
      </section>
    </div>
  );
}
