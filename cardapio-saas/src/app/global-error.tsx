'use client';

import { useEffect } from "react";

// Captura erros que acontecem no próprio layout raiz (fora do alcance do
// error.tsx normal, que só cobre páginas abaixo do layout). Precisa renderizar
// <html>/<body> porque substitui o layout inteiro quando é acionado.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro crítico no layout raiz:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fff",
        }}>
          <h1 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "12px", color: "#0f172a" }}>
            Algo deu muito errado
          </h1>
          <p style={{ color: "#64748b", marginBottom: "24px", maxWidth: 320 }}>
            Não conseguimos carregar o aplicativo. Tente recarregar a página.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#1caf08",
              color: "#fff",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "11px",
              letterSpacing: "0.2em",
              borderRadius: "16px",
              height: "56px",
              padding: "0 32px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
