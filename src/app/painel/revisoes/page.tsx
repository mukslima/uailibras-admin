"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { News } from "@/lib/types";

export default function RevisoesPage() {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await api.listNews({ status: "IN_REVIEW", pageSize: 50 });
        setItems(result.items);
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <ProtectedRoute roles={["ADMIN", "REVIEWER"]}>
      <header className="page-header">
        <div>
          <h1>Revisoes</h1>
          <p className="muted">Fila de conteudos aguardando avaliacao editorial.</p>
        </div>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState message="Nenhuma noticia aguardando revisao." /> : null}

      {!loading && items.length > 0 ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Autor</th>
                  <th>Categoria principal</th>
                  <th>Status</th>
                  <th>Atualizada em</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((news) => (
                  <tr key={news.id}>
                    <td>{news.title}</td>
                    <td>{news.author.name}</td>
                    <td>{news.primaryCategory?.name ?? "-"}</td>
                    <td><StatusBadge status={news.status} /></td>
                    <td>{formatDate(news.updatedAt)}</td>
                    <td>
                      <Link className="ghost-button" href={`/painel/revisoes/${news.id}`}>
                        <Eye size={16} aria-hidden />
                        Revisar
                      </Link>
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
