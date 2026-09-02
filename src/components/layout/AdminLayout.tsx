"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FilePenLine, FolderTree, Gauge, LogOut, Menu, Newspaper, Tags, UsersRound, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateNews, canManageAdmin, canReview, roleLabels } from "@/lib/permissions";

const navGroups = [
  {
    title: "Principal",
    items: [{ href: "/painel", label: "Dashboard", icon: Gauge, show: () => true }],
  },
  {
    title: "Conteudo",
    items: [
      { href: "/painel/noticias", label: "Noticias", icon: Newspaper, show: () => true },
      { href: "/painel/noticias/nova", label: "Nova noticia", icon: FilePenLine, show: (role: string) => canCreateNews(role as never) },
      { href: "/painel/revisoes", label: "Revisoes", icon: CheckCheck, show: (role: string) => canReview(role as never) },
    ],
  },
  {
    title: "Organizacao",
    items: [
      { href: "/painel/categorias", label: "Categorias", icon: FolderTree, show: (role: string) => canManageAdmin(role as never) },
      { href: "/painel/tags", label: "Tags", icon: Tags, show: (role: string) => canManageAdmin(role as never) },
    ],
  },
  {
    title: "Administracao",
    items: [{ href: "/painel/usuarios", label: "Usuarios", icon: UsersRound, show: (role: string) => canManageAdmin(role as never) }],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon-button mobile-only" type="button" aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu size={20} aria-hidden />
        </button>
        <Link href="/painel" className="brand">
          <Image src="/uailibras-logo.png" alt="" width={58} height={42} priority />
          <span>UaiLibras Admin</span>
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
        <div className="sidebar-brand">
          <Image src="/uailibras-logo.png" alt="Logo UaiLibras" width={58} height={42} />
          <strong>Painel administrativo</strong>
          <span className="muted">Conteudo e operacao editorial</span>
        </div>
        <nav>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !user || item.show(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div className="nav-section" key={group.title}>
                <span className="nav-section-title">{group.title}</span>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== "/painel" && pathname.startsWith(item.href));
                  const label = item.href === "/painel/noticias" && user?.role === "AUTHOR" ? "Minhas noticias" : item.label;

                  return (
                    <Link key={item.href} href={item.href} className={active ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
                      <Icon size={18} aria-hidden />
                      {label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
