import Image from "next/image";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { featuredLabels } from "@/lib/permissions";
import type { News, NewsPayload, Category, Tag, Media } from "@/lib/types";

export function NewsPreview({
  news,
  draft,
  categories = [],
  tags = [],
  cover,
}: {
  news?: News;
  draft?: Partial<NewsPayload>;
  categories?: Category[];
  tags?: Tag[];
  cover?: Media | null;
}) {
  const primaryCategory = news?.primaryCategory ?? categories.find((category) => category.id === draft?.primaryCategoryId);
  const selectedTags = news?.tags.map((item) => item.tag) ?? tags.filter((tag) => draft?.tagIds?.includes(tag.id));
  const title = news?.title ?? draft?.title ?? "Titulo da noticia";
  const summary = news?.summary ?? draft?.summary ?? "";
  const content = news?.content ?? draft?.content ?? "";
  const coverImage = news?.coverImage ?? cover;
  const requestedFeaturedPosition = news?.requestedFeaturedPosition ?? draft?.requestedFeaturedPosition ?? null;
  const featuredPosition = news?.featuredPosition ?? null;

  return (
    <article className="preview-article">
      {coverImage ? (
        <Image
          className="cover-preview"
          src={coverImage.url}
          alt={coverImage.originalName}
          width={coverImage.width ?? 1200}
          height={coverImage.height ?? 675}
          unoptimized
        />
      ) : null}
      <div className="tag-row">
        {primaryCategory ? <span className="tag-chip">{primaryCategory.name}</span> : null}
        {news ? <StatusBadge status={news.status} /> : null}
        {featuredPosition ? <span className="tag-chip">{featuredLabels[featuredPosition]}</span> : null}
        {!featuredPosition && requestedFeaturedPosition ? <span className="tag-chip">Sugestao: {featuredLabels[requestedFeaturedPosition]}</span> : null}
      </div>
      <h1>{title}</h1>
      {summary ? <p className="muted">{summary}</p> : null}
      {news ? <p className="muted">Atualizada em {formatDate(news.updatedAt)}</p> : null}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: content }} />
      {selectedTags.length > 0 ? (
        <div className="tag-row" aria-label="Tags">
          {selectedTags.map((tag) => (
            <span className="tag-chip" key={tag.id}>
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
