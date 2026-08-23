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

export function friendlyError(error: unknown) {
  if (error instanceof ApiError) {
    return messages[error.status] ?? error.message;
  }

  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Nao foi possivel conectar ao backend.";
  }

  return "Nao foi possivel concluir a acao.";
}
