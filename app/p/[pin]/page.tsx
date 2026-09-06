"use client";
import { useParams } from "next/navigation";
export default function PinPage() {
  const params = useParams<{ pin: string }>();
  if (!params) {
    return null;
  }
  const pin = params.pin;
  return (
    <div>
      <h1>{pin}</h1>
    </div>
  );
}
