"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { roleLabels } from "@/lib/permissions";
import type { Role, User } from "@/lib/types";

export default function UsuariosPage() {
  const [items, setItems] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: "AUTHOR" as Role });
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
    setCreating(true);
    try {
      await api.createUser(form);
      setForm({ name: "", username: "", email: "", password: "", role: "AUTHOR" });
      setMessage("Usuario criado.");
      setCreateOpen(false);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setCreating(false);
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

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.username.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term);
      const matchesRole = !role || item.role === role;
      const matchesStatus = active === "all" || (active === "active" ? item.active : !item.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [active, items, role, search]);

  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <header className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">Gerencie usuarios internos e suas roles.</p>
        </div>
        <button className="button primary" type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={17} aria-hidden />
          Novo usuario
        </button>
      </header>

      <div className="toolbar">
        <div className="filters">
          <label className="field">
            <span>Busca</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, username ou e-mail" />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value as Role | "")}>
              <option value="">Todas</option>
              <option value="AUTHOR">Autor</option>
              <option value="REVIEWER">Revisor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={active} onChange={(event) => setActive(event.target.value as "all" | "active" | "inactive")}>
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </label>
        </div>
      </div>

      {message ? <SuccessMessage message={message} /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      <Modal open={createOpen} title="Novo usuario" description="Crie um acesso interno para o painel." onClose={() => setCreateOpen(false)}>
        <form className="form-stack" onSubmit={create}>
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
            <small>Minimo de 10 caracteres.</small>
          </label>
          <label className="field">
            <span>Role</span>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
              <option value="AUTHOR">Autor</option>
              <option value="REVIEWER">Revisor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="ghost-button" type="button" disabled={creating} onClick={() => setCreateOpen(false)}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar usuario"}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? <LoadingState /> : null}
      {!loading && filteredItems.length === 0 ? <EmptyState message="Nenhum usuario encontrado." /> : null}
      {!loading && filteredItems.length > 0 ? (
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
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Nome">{item.name}</td>
                    <td data-label="Username">{item.username}</td>
                    <td data-label="E-mail">{item.email}</td>
                    <td data-label="Role">
                      <select aria-label={`Role de ${item.name}`} value={item.role} onChange={(event) => void update(item.id, { role: event.target.value as Role })}>
                        <option value="AUTHOR">{roleLabels.AUTHOR}</option>
                        <option value="REVIEWER">{roleLabels.REVIEWER}</option>
                        <option value="ADMIN">{roleLabels.ADMIN}</option>
                      </select>
                    </td>
                    <td data-label="Status">{item.active ? "Ativo" : "Inativo"}</td>
                    <td data-label="Acoes">
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
