"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function PinPage() {
  const params = useParams<{ pin?: string }>();
  const router = useRouter();
  useEffect(() => {
    const pin = params?.pin;
    if (!pin) return;
    // Send the 3-word address into the existing map/search experience.
    router.replace(`/?pin=${encodeURIComponent(pin)}`);
  }, [params, router]);
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 12 }}>
          OPENING 3 WORD PIN
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          {params?.pin || "Loading..."}
        </div>
      </div>
    </main>
  );
}
