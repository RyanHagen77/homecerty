// app/pro/page.tsx
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ProClient from "./ProClient";

export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const t = (searchParams.type ?? "").toLowerCase();

  if (t === "realtor") redirect("/pro/realtor");
  if (t === "inspector") redirect("/pro/inspector");
  // default: contractor dashboard

  return (
    <Suspense fallback={null}>
      <ProClient />
    </Suspense>
  );
}
