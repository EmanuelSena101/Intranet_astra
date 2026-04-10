"use client";

import { type ReactNode, useEffect, useState } from "react";
import { fetchCurrentUser, isAdministrator } from "@/lib/auth";

type AdminOnlyProps = {
  children: ReactNode;
};

type AdminOnlyState =
  | { status: "loading" }
  | { status: "authorized" }
  | { status: "hidden" };

export function AdminOnly({ children }: AdminOnlyProps) {
  const [state, setState] = useState<AdminOnlyState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const result = await fetchCurrentUser();

      if (cancelled) {
        return;
      }

      if (result.status !== "authenticated") {
        setState({ status: "hidden" });
        return;
      }

      setState(isAdministrator(result.user) ? { status: "authorized" } : { status: "hidden" });
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status !== "authorized") {
    return null;
  }

  return <>{children}</>;
}
