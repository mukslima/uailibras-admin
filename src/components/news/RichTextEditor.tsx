"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Extension } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { Modal } from "@/components/ui/Modal";

type TextAlignment = "left" | "center" | "right" | "justify";
type ImageSize = "small" | "medium" | "large" | "full";
type ImageAlignment = "left" | "center" | "right";
type SelectedImageState = {
  selected: boolean;
  size: ImageSize;
  alignment: ImageAlignment;
};

const alignClass = {
  left: "text-align-left",
  center: "text-align-center",
  right: "text-align-right",
  justify: "text-align-justify",
} satisfies Record<TextAlignment, string>;

const imageSizeClass = {
  small: "image-size-small",
  medium: "image-size-medium",
  large: "image-size-large",
  full: "image-size-full",
} satisfies Record<ImageSize, string>;

const imageAlignClass = {
  left: "image-align-left",
  center: "image-align-center",
  right: "image-align-right",
} satisfies Record<ImageAlignment, string>;

function isImageSize(value: unknown): value is ImageSize {
  return value === "small" || value === "medium" || value === "large" || value === "full";
}

function isImageAlignment(value: unknown): value is ImageAlignment {
  return value === "left" || value === "center" || value === "right";
}

function getSelectedImageState(editor: Editor): SelectedImageState {
  if (!editor.isActive("image")) {
    return {
      selected: false,
      size: "large",
      alignment: "center",
    };
  }

  const attributes = editor.getAttributes("image");

  return {
    selected: true,
    size: isImageSize(attributes.size) ? attributes.size : "large",
    alignment: isImageAlignment(attributes.alignment) ? attributes.alignment : "center",
  };
}

function sameSelectedImageState(a: SelectedImageState, b: SelectedImageState) {
  return a.selected === b.selected && a.size === b.size && a.alignment === b.alignment;
}

const TextClassAlign = Extension.create({
  name: "textClassAlign",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "blockquote"],
        attributes: {
          class: {
            default: null,
            parseHTML: (element) =>
              ["text-align-left", "text-align-center", "text-align-right", "text-align-justify"].find((className) =>
                element.classList.contains(className),
              ) ?? null,
            renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
          },
        },
      },
    ];
  },
});

const EditorialImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "large",
        parseHTML: (element) => {
          const classes = Array.from(element.classList);
          const found = classes.find((className) => className.startsWith("image-size-"));
          return found?.replace("image-size-", "") ?? "large";
        },
        renderHTML: () => ({}),
      },
      alignment: {
        default: "center",
        parseHTML: (element) => {
          const classes = Array.from(element.classList);
          const found = classes.find((className) => className.startsWith("image-align-"));
          return found?.replace("image-align-", "") ?? "center";
        },
        renderHTML: () => ({}),
      },
      class: {
        default: null,
        renderHTML: (attributes) => ({
          class: `${imageSizeClass[(attributes.size as ImageSize) ?? "large"]} ${imageAlignClass[(attributes.alignment as ImageAlignment) ?? "center"]}`,
        }),
      },
    };
  },
});

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<SelectedImageState>({
    selected: false,
    size: "large",
    alignment: "center",
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const syncSelectedImage = useCallback((current: Editor) => {
    const next = getSelectedImageState(current);
    setSelectedImage((previous) => (sameSelectedImageState(previous, next) ? previous : next));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextClassAlign,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      EditorialImage.configure({
        HTMLAttributes: {
          loading: "lazy",
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    onCreate: ({ editor: current }) => syncSelectedImage(current),
    onSelectionUpdate: ({ editor: current }) => syncSelectedImage(current),
    onTransaction: ({ editor: current }) => syncSelectedImage(current),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(previousUrl ?? "");
    setLinkOpen(true);
  }, [editor]);

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }

    setLinkOpen(false);
  }

  function setTextAlignment(alignment: TextAlignment) {
    if (!editor) return;
    const className = alignClass[alignment];
    editor.chain().focus().updateAttributes("paragraph", { class: className }).updateAttributes("heading", { class: className }).updateAttributes("blockquote", { class: className }).run();
  }

  function setImageSize(size: ImageSize) {
    if (!editor || !selectedImage.selected) return;
    editor.chain().focus().updateAttributes("image", { size }).run();
    setSelectedImage((previous) => ({ ...previous, size }));
  }

  function setImageAlignment(alignment: ImageAlignment) {
    if (!editor || !selectedImage.selected) return;
    editor.chain().focus().updateAttributes("image", { alignment }).run();
    setSelectedImage((previous) => ({ ...previous, alignment }));
  }

  async function handleImage(file: File | undefined) {
    if (!file || !editor) return;
    setError(null);
    setUploading(true);

    try {
      const media = await api.uploadMedia(file);
      editor.chain().focus().setImage({ src: media.url, alt: media.originalName }).updateAttributes("image", { size: "large", alignment: "center" }).run();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!editor) return <div className="panel-state">Carregando editor...</div>;

  return (
    <div>
      <div className="editor-shell">
        <div className="editor-toolbar" aria-label="Ferramentas do editor">
          <div className="editor-toolgroup" aria-label="Texto">
            <button type="button" className={editor.isActive("bold") ? "active" : ""} title="Negrito" aria-label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={17} aria-hidden />
            </button>
            <button type="button" className={editor.isActive("italic") ? "active" : ""} title="Italico" aria-label="Italico" onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic size={17} aria-hidden />
            </button>
          </div>
          <div className="editor-toolgroup" aria-label="Estrutura">
            <button type="button" className={editor.isActive("heading", { level: 2 }) ? "active" : ""} title="Titulo H2" aria-label="Titulo H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 size={17} aria-hidden />
            </button>
            <button type="button" className={editor.isActive("heading", { level: 3 }) ? "active" : ""} title="Subtitulo H3" aria-label="Subtitulo H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 size={17} aria-hidden />
            </button>
            <button type="button" className={editor.isActive("bulletList") ? "active" : ""} title="Lista" aria-label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List size={17} aria-hidden />
            </button>
            <button type="button" className={editor.isActive("orderedList") ? "active" : ""} title="Lista numerada" aria-label="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={17} aria-hidden />
            </button>
          </div>
          <div className="editor-toolgroup" aria-label="Alinhamento">
            <button type="button" title="Alinhar a esquerda" aria-label="Alinhar a esquerda" onClick={() => setTextAlignment("left")}>
              <AlignLeft size={17} aria-hidden />
            </button>
            <button type="button" title="Centralizar" aria-label="Centralizar" onClick={() => setTextAlignment("center")}>
              <AlignCenter size={17} aria-hidden />
            </button>
            <button type="button" title="Alinhar a direita" aria-label="Alinhar a direita" onClick={() => setTextAlignment("right")}>
              <AlignRight size={17} aria-hidden />
            </button>
            <button type="button" title="Justificar" aria-label="Justificar" onClick={() => setTextAlignment("justify")}>
              <AlignJustify size={17} aria-hidden />
            </button>
          </div>
          <div className="editor-toolgroup" aria-label="Insercao">
            <button type="button" className={editor.isActive("link") ? "active" : ""} title="Inserir link" aria-label="Inserir link" onClick={setLink}>
              <LinkIcon size={17} aria-hidden />
            </button>
            <button type="button" title="Inserir imagem" aria-label="Inserir imagem" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <ImagePlus size={17} aria-hidden />
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => void handleImage(event.target.files?.[0])}
          />
        </div>
        <div className="editor-image-controls" aria-label="Ajustes da imagem selecionada">
          <span className="muted">{selectedImage.selected ? "Imagem" : "Sem imagem"}</span>
          <select
            aria-label="Tamanho da imagem"
            value={selectedImage.size}
            disabled={!selectedImage.selected}
            onChange={(event) => setImageSize(event.target.value as ImageSize)}
          >
            <option value="small">Pequena</option>
            <option value="medium">Media</option>
            <option value="large">Grande</option>
            <option value="full">Largura total</option>
          </select>
          <select
            aria-label="Alinhamento da imagem"
            value={selectedImage.alignment}
            disabled={!selectedImage.selected}
            onChange={(event) => setImageAlignment(event.target.value as ImageAlignment)}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </div>
        <EditorContent editor={editor} className="editor-content" />
      </div>
      {uploading ? <p className="muted">Enviando imagem...</p> : null}
      {error ? <p className="inline-message error">{error}</p> : null}
      <Modal open={linkOpen} title="Inserir link" description="Use uma URL http, https ou mailto." onClose={() => setLinkOpen(false)}>
        <div className="form-stack">
          <label className="field">
            <span>URL</span>
            <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://exemplo.com" />
          </label>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setLinkOpen(false)}>
              Cancelar
            </button>
            <button className="button primary" type="button" onClick={applyLink}>
              Aplicar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
