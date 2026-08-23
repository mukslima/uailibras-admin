"use client";

export function ConfirmButton({
  children,
  message,
  className = "button danger",
  onConfirm,
  disabled,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => {
        if (window.confirm(message)) void onConfirm();
      }}
    >
      {children}
    </button>
  );
}
