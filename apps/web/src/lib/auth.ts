import type { CurrentUser } from "@/components/types";
import { apiUrl } from "@/lib/api";

type ErrorBody = {
  error?: string;
  title?: string;
  detail?: string;
};

export type SessionResult =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export async function fetchCurrentUser(): Promise<SessionResult> {
  try {
    const response = await fetch(apiUrl("/auth/me"), {
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ErrorBody | null;

      return {
        status: "error",
        message:
          body?.error ??
          body?.detail ??
          body?.title ??
          "A API de autenticação respondeu com erro."
      };
    }

    const user = (await response.json()) as CurrentUser;

    return {
      status: "authenticated",
      user
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possível carregar a sessão do usuário."
    };
  }
}

export function hasRole(user: CurrentUser, role: string): boolean {
  return user.roles.some((candidateRole) => candidateRole.toLowerCase() === role.toLowerCase());
}

export function isAdministrator(user: CurrentUser): boolean {
  return hasRole(user, "Admin");
}
