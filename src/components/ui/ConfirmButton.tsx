"use client";

import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export function ConfirmButton({
  children,
  message,
  title = "Confirmar acao",
  confirmLabel = "Confirmar",
  variant = "default",
  className = "button danger",
  onConfirm,
  disabled,
}: {
  children: React.ReactNode;
  message: React.ReactNode;
  title?: string;
  confirmLabel?: string;
  variant?: "default" | "danger" | "warning";
  className?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirmAction() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={() => setOpen(true)}>
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        description={message}
        confirmLabel={confirmLabel}
        variant={variant}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}
