import { expect, test } from "@playwright/test";

// Garante que o endpoint de health check do banco responde com 200
// quando a API sobe em modo mock (sem variáveis OPENEDGE_* preenchidas).
// Em CI rodamos o compose sem credenciais reais, então o payload esperado
// é `status=ok` com `dataSource=mock`.
test("health/database responde em modo mock", async ({ request }) => {
  const response = await request.get("/api/health/database");

  expect(response.status(), await response.text()).toBe(200);

  const payload = await response.json();
  expect(payload.status).toBe("ok");
  expect(payload.dataSource).toBe("mock");
  expect(payload.slow).toBe(false);
});
