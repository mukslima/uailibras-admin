"use client";

import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  variant = "default",
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={loading ? () => undefined : onClose}>
      <div className="modal-body">{description}</div>
      <div className="modal-actions">
        <button className="ghost-button" type="button" disabled={loading} onClick={onClose}>
          {cancelLabel}
        </button>
        <button className={`button ${variant === "danger" ? "danger" : variant === "warning" ? "warning" : "primary"}`} type="button" disabled={loading} onClick={() => void onConfirm()}>
          {loading ? "Processando..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
