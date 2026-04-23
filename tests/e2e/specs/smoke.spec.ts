import { expect, test } from "@playwright/test";

test("healthz responde", async ({ request }) => {
  const response = await request.get("/api/healthz");

  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload.status).toBe("ok");
  expect(payload.service).toBe("web");
});
