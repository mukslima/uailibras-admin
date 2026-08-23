import { NewsForm } from "@/components/news/NewsForm";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function NovaNoticiaPage() {
  return (
    <ProtectedRoute roles={["ADMIN", "AUTHOR"]}>
      <header className="page-header">
        <div>
          <h1>Nova noticia</h1>
          <p className="muted">Crie um rascunho e envie para revisao quando estiver pronto.</p>
        </div>
      </header>
      <NewsForm />
    </ProtectedRoute>
  );
}
