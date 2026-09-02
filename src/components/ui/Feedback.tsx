export function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return <div className="panel-state loading">{message}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="panel-state empty">{message}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="panel-state error" role="alert">
      {message}
    </div>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="inline-message success" role="status">
      {message}
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="inline-message error" role="alert">
      {message}
    </div>
  );
}

export function WarningMessage({ message }: { message: string }) {
  return (
    <div className="inline-message warning" role="status">
      {message}
    </div>
  );
}
