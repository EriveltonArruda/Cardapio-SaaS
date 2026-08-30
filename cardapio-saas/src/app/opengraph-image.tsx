import { ImageResponse } from "next/og";

// Gera a imagem de compartilhamento (WhatsApp/redes sociais) dinamicamente,
// sem depender de um arquivo .png desenhado manualmente. O Next detecta esse
// arquivo pela convenção de nome e já injeta a tag og:image sozinho — não
// precisa (nem deve) declarar `images` de novo em `metadata` no layout.
export const runtime = "edge";
export const alt = "Cardápio Digital";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 32,
            background: "#1caf08",
            marginBottom: 40,
            fontSize: 72,
          }}
        >
          🍔
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
          Cardápio Digital
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#1caf08", fontWeight: 700, marginTop: 16 }}>
          Venda mais pelo WhatsApp
        </div>
      </div>
    ),
    { ...size }
  );
}
