"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePenLine, FolderTree, Gauge, LogOut, Menu, Newspaper, Tags, UsersRound, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateNews, canManageAdmin, canReview, roleLabels } from "@/lib/permissions";

const baseItems = [{ href: "/painel", label: "Dashboard", icon: Gauge }];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const items = user
    ? [
        ...baseItems,
        ...(user.role === "AUTHOR" ? [{ href: "/painel/noticias", label: "Minhas Noticias", icon: Newspaper }] : []),
        ...(user.role !== "AUTHOR" ? [{ href: "/painel/noticias", label: "Noticias", icon: Newspaper }] : []),
        ...(canCreateNews(user.role) ? [{ href: "/painel/noticias/nova", label: "Nova noticia", icon: FilePenLine }] : []),
        ...(canReview(user.role) ? [{ href: "/painel/revisoes", label: "Revisoes", icon: CheckCheck }] : []),
        ...(canManageAdmin(user.role)
          ? [
              { href: "/painel/categorias", label: "Categorias", icon: FolderTree },
              { href: "/painel/tags", label: "Tags", icon: Tags },
              { href: "/painel/usuarios", label: "Usuarios", icon: UsersRound },
            ]
          : []),
      ]
    : baseItems;

  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon-button mobile-only" type="button" aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu size={20} aria-hidden />
        </button>
        <Link href="/painel" className="brand">
          UaiLibras Admin
        </Link>
        {user ? (
          <div className="user-menu" aria-label="Usuario atual">
            <span>{user.name}</span>
            <small>{roleLabels[user.role]}</small>
            <button type="button" className="ghost-button" onClick={signOut}>
              <LogOut size={16} aria-hidden />
              Sair
            </button>
          </div>
        ) : null}
      </header>

      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Navegacao principal">
        <button className="ghost-button mobile-only close-menu" type="button" onClick={() => setOpen(false)}>
          Fechar
        </button>
        <nav>
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
                <Icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
