"use client";

import { FormEvent, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { roleLabels } from "@/lib/permissions";
import type { Role, User } from "@/lib/types";

export default function UsuariosPage() {
  const [items, setItems] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: "AUTHOR" as Role });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.listUsers());
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
      await api.createUser(form);
      setForm({ name: "", username: "", email: "", password: "", role: "AUTHOR" });
      setMessage("Usuario criado.");
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function update(id: string, payload: Partial<Pick<User, "role" | "active">>) {
    setError(null);
    try {
      await api.updateUser(id, payload);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <header className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">Gerencie usuarios internos e suas roles.</p>
        </div>
      </header>

      <section className="panel panel-padding form-stack">
        <form className="form-grid" onSubmit={create}>
          <label className="field">
            <span>Nome</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} />
          </label>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required minLength={3} />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label className="field">
            <span>Senha inicial</span>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={10} />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
              <option value="AUTHOR">Autor</option>
              <option value="REVIEWER">Revisor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <div className="field">
            <span>&nbsp;</span>
            <button className="button primary" type="submit">Criar usuario</button>
          </div>
        </form>
        {message ? <SuccessMessage message={message} /> : null}
        {error ? <ErrorMessage message={error} /> : null}
      </section>

      {loading ? <LoadingState /> : null}
      {!loading && items.length === 0 ? <EmptyState message="Nenhum usuario encontrado." /> : null}
      {!loading && items.length > 0 ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Username</th>
                  <th>E-mail</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.username}</td>
                    <td>{item.email}</td>
                    <td>
                      <select aria-label={`Role de ${item.name}`} value={item.role} onChange={(event) => void update(item.id, { role: event.target.value as Role })}>
                        <option value="AUTHOR">{roleLabels.AUTHOR}</option>
                        <option value="REVIEWER">{roleLabels.REVIEWER}</option>
                        <option value="ADMIN">{roleLabels.ADMIN}</option>
                      </select>
                    </td>
                    <td>{item.active ? "Ativo" : "Inativo"}</td>
                    <td>
                      <button className="ghost-button" type="button" onClick={() => void update(item.id, { active: !item.active })}>
                        {item.active ? "Desativar" : "Ativar"}
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
