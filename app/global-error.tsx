"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main className="fatal-error">
          <span aria-hidden="true">TSG</span>
          <h1>Algo no ha salido bien.</h1>
          <p>El error se ha registrado sin incluir tus datos personales. Puedes volver a intentarlo.</p>
          <button type="button" onClick={reset}>Reintentar</button>
        </main>
      </body>
    </html>
  );
}
