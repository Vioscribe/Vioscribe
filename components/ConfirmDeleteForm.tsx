"use client";

import type { FormEvent, ReactNode } from "react";

export default function ConfirmDeleteForm({
  action,
  children,
  className,
  message,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  message: string;
}) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }

  return <form action={action} className={className} onSubmit={confirmDelete}>{children}</form>;
}
