"use client";

import { useParams } from "next/navigation";

export default function PinPage() {
  const params = useParams<{ pin?: string }>();
  const pin = params?.pin ?? "";

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: "16px",
          }}
        >
          3 WORD PIN
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 8vw, 64px)",
            lineHeight: 1.1,
            fontWeight: 800,
            wordBreak: "break-word",
          }}
        >
          {pin}
        </h1>

        <p
          style={{
            marginTop: "20px",
            fontSize: "16px",
            opacity: 0.7,
          }}
        >
          Shared location
        </p>
      </div>
    </main>
  );
}
