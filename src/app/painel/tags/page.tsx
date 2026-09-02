"use client";

import { FormEvent, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import type { Tag } from "@/lib/types";

export default function TagsPage() {
  const [items, setItems] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.listTags());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.createTag({ name });
      setName("");
      setMessage("Tag criada.");
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <header className="page-header">
        <div>
          <h1>Tags</h1>
          <p className="muted">Listagem e criacao de tags para organizar noticias.</p>
        </div>
      </header>

      <section className="panel panel-padding form-stack">
        <form className="toolbar" onSubmit={create}>
          <label className="field">
            <span>Nome</span>
            <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
            <small>Evite duplicar tags com nomes parecidos.</small>
          </label>
          <button className="button primary" type="submit">Criar tag</button>
        </form>
        {message ? <SuccessMessage message={message} /> : null}
        {error ? <ErrorMessage message={error} /> : null}
      </section>

      {loading ? <LoadingState /> : null}
      {!loading && items.length === 0 ? <EmptyState message="Nenhuma tag encontrada." /> : null}
      {!loading && items.length > 0 ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Nome">{item.name}</td>
                    <td data-label="Slug">{item.slug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </ProtectedRoute>
  );
}
