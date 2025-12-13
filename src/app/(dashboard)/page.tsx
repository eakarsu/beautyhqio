"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to /dashboard
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
    </div>
  );
}
