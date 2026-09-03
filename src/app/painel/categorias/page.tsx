"use client";

import { FormEvent, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import type { Category } from "@/lib/types";

export default function CategoriasPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.listCategories(true));
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
    setCreating(true);
    try {
      await api.createCategory({ name });
      setName("");
      setMessage("Categoria criada.");
      await load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setCreating(false);
    }
  }

  async function toggle(item: Category) {
    setError(null);
    setPendingCategoryId(item.id);
    try {
      await api.updateCategory(item.id, { active: !item.active });
      await load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPendingCategoryId(null);
    }
  }

  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <header className="page-header">
        <div>
          <h1>Categorias</h1>
          <p className="muted">Listar, criar e ativar/desativar categorias.</p>
        </div>
      </header>

      <section className="panel panel-padding form-stack">
        <form className="toolbar" onSubmit={create}>
          <label className="field">
            <span>Nome</span>
            <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
            <small>Use nomes curtos e claros. O slug e gerado automaticamente.</small>
          </label>
          <button className="button primary" type="submit" disabled={creating}>
            {creating ? "Criando..." : "Criar categoria"}
          </button>
        </form>
        {message ? <SuccessMessage message={message} /> : null}
        {error ? <ErrorMessage message={error} /> : null}
      </section>

      {loading ? <LoadingState /> : null}
      {!loading && items.length === 0 ? <EmptyState message="Nenhuma categoria encontrada." /> : null}
      {!loading && items.length > 0 ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Nome">{item.name}</td>
                    <td data-label="Slug">{item.slug}</td>
                    <td data-label="Status">{item.active ? "Ativa" : "Inativa"}</td>
                    <td data-label="Acoes">
                      <button className="ghost-button" type="button" disabled={pendingCategoryId === item.id} onClick={() => void toggle(item)}>
                        {pendingCategoryId === item.id ? "Atualizando..." : item.active ? "Desativar" : "Ativar"}
                      </button>
                    </td>
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
