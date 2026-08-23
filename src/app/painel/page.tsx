"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { statusLabels } from "@/lib/permissions";
import type { News, NewsStatus } from "@/lib/types";

const statuses: NewsStatus[] = ["DRAFT", "IN_REVIEW", "REJECTED", "APPROVED", "PUBLISHED"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await api.listNews({ pageSize: 50 });
        setItems(result.items);
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const counts = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        count: items.filter((news) => news.status === status).length,
      })),
    [items],
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            {user?.role === "REVIEWER" ? "Fila editorial e publicacoes recentes." : "Resumo das noticias disponiveis para sua role."}
          </p>
        </div>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid-cards" aria-label="Resumo por status">
            {counts.map((item) => (
              <div className="card metric" key={item.status}>
                <span>{statusLabels[item.status]}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </section>

          <section className="panel">
            <div className="panel-padding">
              <h2>Noticias recentes</h2>
            </div>
            {items.length === 0 ? (
              <EmptyState message={user?.role === "REVIEWER" ? "Nenhuma noticia aguardando revisao." : "Nenhuma noticia encontrada."} />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Titulo</th>
                      <th>Status</th>
                      <th>Autor</th>
                      <th>Atualizacao</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, 8).map((news) => (
                      <tr key={news.id}>
                        <td>{news.title}</td>
                        <td><StatusBadge status={news.status} /></td>
                        <td>{news.author.name}</td>
                        <td>{formatDate(news.updatedAt)}</td>
                        <td><Link className="ghost-button" href={`/painel/noticias/${news.id}/preview`}>Abrir</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
