"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Bold, Heading2, Heading3, ImagePlus, Italic, LinkIcon, List, ListOrdered } from "lucide-react";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          loading: "lazy",
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", previousUrl ?? "");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  async function handleImage(file: File | undefined) {
    if (!file || !editor) return;
    setError(null);
    setUploading(true);

    try {
      const media = await api.uploadMedia(file);
      editor.chain().focus().setImage({ src: media.url, alt: media.originalName }).run();
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
          <button type="button" className={editor.isActive("bold") ? "active" : ""} aria-label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={17} aria-hidden />
          </button>
          <button type="button" className={editor.isActive("italic") ? "active" : ""} aria-label="Italico" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={17} aria-hidden />
          </button>
          <button type="button" className={editor.isActive("heading", { level: 2 }) ? "active" : ""} aria-label="Titulo" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={17} aria-hidden />
          </button>
          <button type="button" className={editor.isActive("heading", { level: 3 }) ? "active" : ""} aria-label="Subtitulo" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={17} aria-hidden />
          </button>
          <button type="button" className={editor.isActive("bulletList") ? "active" : ""} aria-label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={17} aria-hidden />
          </button>
          <button type="button" className={editor.isActive("orderedList") ? "active" : ""} aria-label="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={17} aria-hidden />
          </button>
          <button type="button" className={editor.isActive("link") ? "active" : ""} aria-label="Inserir link" onClick={setLink}>
            <LinkIcon size={17} aria-hidden />
          </button>
          <button type="button" aria-label="Inserir imagem" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <ImagePlus size={17} aria-hidden />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => void handleImage(event.target.files?.[0])}
          />
        </div>
        <EditorContent editor={editor} className="editor-content" />
      </div>
      {uploading ? <p className="muted">Enviando imagem...</p> : null}
      {error ? <p className="inline-message error">{error}</p> : null}
    </div>
  );
}
