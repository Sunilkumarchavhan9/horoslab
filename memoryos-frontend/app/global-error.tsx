"use client";

import * as Sentry from "@sentry/browser";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 24, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          <h2>Unexpected error</h2>
          <p>We logged this error. Please retry.</p>
          <button type="button" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
