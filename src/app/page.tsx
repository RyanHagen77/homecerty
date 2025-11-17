// src/app/page.tsx
import { Suspense } from "react";
import HomeLanding from "@/app/_components/MainLanding";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <HomeLanding />
    </Suspense>
  );
}