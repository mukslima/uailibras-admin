export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const messages: Record<number, string> = {
  400: "Revise os dados enviados.",
  401: "Sua sessao expirou. Entre novamente.",
  403: "Voce nao tem permissao para esta acao.",
  404: "Registro nao encontrado.",
  409: "A acao nao pode ser concluida no estado atual.",
  422: "Alguns campos precisam de correcao.",
  500: "Ocorreu um erro no servidor. Tente novamente em instantes.",
};

const backendMessages: Record<string, string> = {
  "At least one active admin must remain": "Ao menos um administrador ativo deve permanecer.",
  "The user was updated concurrently. Try again.": "Este usuario foi alterado ao mesmo tempo. Tente novamente.",
  "Username or email already exists": "Username ou e-mail ja existe.",
  "News slug already exists": "Slug da noticia ja existe.",
  "News cannot be edited in the current status": "A noticia nao pode ser editada no status atual.",
  "Only draft or rejected news can be submitted": "Somente rascunhos ou noticias rejeitadas podem ser enviados para revisao.",
  "Only news in review can be approved": "Somente noticias em revisao podem ser aprovadas.",
  "Only news in review can be rejected": "Somente noticias em revisao podem ser rejeitadas.",
  "Only approved or unpublished news can be published": "Somente noticias aprovadas ou despublicadas podem ser publicadas.",
  "Only published news can be unpublished": "Somente noticias publicadas podem ser despublicadas.",
  "Only published news can be featured": "Somente noticias publicadas podem virar destaque.",
  "Invalid category": "Categoria invalida.",
  "Invalid media": "Midia invalida.",
  "Invalid image type": "Tipo de imagem invalido.",
  "File exceeds maximum size": "Arquivo acima do tamanho permitido.",
  "Tag already exists": "Tag ja existe.",
  "Category already exists": "Categoria ja existe.",
};

function isSafeBackendMessage(message: string) {
  return !/(prisma|sql|stack|database|constraint|internal server error)/i.test(message);
}

export function friendlyError(error: unknown) {
  if (error instanceof ApiError) {
    if ((error.status === 400 || error.status === 409) && error.message && isSafeBackendMessage(error.message)) {
      return backendMessages[error.message] ?? error.message;
    }

    return messages[error.status] ?? error.message;
  }

  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Nao foi possivel conectar ao backend.";
  }

  return "Nao foi possivel concluir a acao.";
}
