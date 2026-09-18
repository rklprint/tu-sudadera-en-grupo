"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      richColors
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast: "tsg-toast",
          title: "tsg-toast-title",
          description: "tsg-toast-description",
          closeButton: "tsg-toast-close",
        },
      }}
    />
  );
}
