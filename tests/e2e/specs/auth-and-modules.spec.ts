import { expect, test, type APIRequestContext } from "@playwright/test";

async function login(request: APIRequestContext, username: string, password: string) {
  const response = await request.post("/api/auth/login", {
    data: { username, password }
  });

  expect(response.ok()).toBeTruthy();
}

test("sessao exige autenticacao", async ({ request }) => {
  const response = await request.get("/api/auth/me");

  expect(response.status()).toBe(401);
});

test("operador acessa modulos operacionais mas nao ve bootstrap admin", async ({ request }) => {
  await login(request, "bilhetagem", "bilhetagem123");

  const me = await request.get("/api/auth/me");
  expect(me.ok()).toBeTruthy();

  const currentUser = await me.json();
  expect(currentUser.roles).toEqual(["Operador"]);
  expect(currentUser.modules).toEqual(["Bilhetagem", "DocWeb"]);

  const bilhetagemBootstrap = await request.get("/api/bilhetagem/bootstrap");
  expect(bilhetagemBootstrap.status()).toBe(403);

  const docWebBootstrap = await request.get("/api/docweb/bootstrap");
  expect(docWebBootstrap.status()).toBe(403);

  const docWebDocuments = await request.get("/api/docweb/documents");
  expect(docWebDocuments.ok()).toBeTruthy();

  const docWebPayload = await docWebDocuments.json();
  expect(docWebPayload.entries.length).toBeGreaterThan(0);
});

test("admin acessa bootstrap dos modulos", async ({ request }) => {
  await login(request, "admin", "admin123");

  const bilhetagemBootstrap = await request.get("/api/bilhetagem/bootstrap");
  expect(bilhetagemBootstrap.ok()).toBeTruthy();

  const docWebBootstrap = await request.get("/api/docweb/bootstrap");
  expect(docWebBootstrap.ok()).toBeTruthy();

  const payload = await docWebBootstrap.json();
  expect(payload.module).toBe("DocWeb");
  expect(payload.provider).toBe("mock");
});
