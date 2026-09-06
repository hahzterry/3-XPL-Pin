// app/p/[pin]/page.tsx

"use client";

import { useParams } from "next/navigation";

export default function PinPage() {
  const params = useParams();
  const pin = params.pin as string;

  return (
    <div>
      <h1>{pin}</h1>
    </div>
  );
}
