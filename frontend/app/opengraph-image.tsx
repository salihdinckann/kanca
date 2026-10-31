import { ImageResponse } from "next/og";

// Preview card shown when the link is shared on LinkedIn, WhatsApp, X, etc.
export const alt = "Kanca – Kancayı yemeden önce gör";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0a1019",
          color: "#ece6d9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#ff5b2e" />
            <g fill="none" stroke="#0a1019" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="19" cy="7.5" r="2.2" strokeWidth="2" />
              <path d="M19 9.7V18.5a5.5 5.5 0 0 1-11 0V15" strokeWidth="2.6" />
              <path d="M8 15l3.2 2.6" strokeWidth="2.2" />
            </g>
          </svg>
          <span style={{ fontSize: 48, fontWeight: 700 }}>kanca</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>Kancayı yemeden</span>
          <span style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>önce gör.</span>
          <div style={{ width: 220, height: 8, background: "#ff5b2e", marginTop: 28, borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 30, color: "#8b93a3" }}>Yapay zeka destekli phishing link tarayıcı</span>
      </div>
    ),
    size,
  );
}
