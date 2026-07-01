import { describe, expect, it, vi } from "vitest";

const { proxy } = vi.hoisted(() => ({
  proxy: vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
}));
vi.mock("@/infrastructure/auth-transport/patient-auth", () => ({
  proxyAuthenticatedPatientRequest: proxy,
}));

import { POST as subscribePost } from "../subscribe/route";
import { POST as unsubscribePost } from "../unsubscribe/route";

function req() {
  return new Request("http://localhost/api/patient-portal/push/subscribe", {
    method: "POST",
    body: "{}",
  }) as unknown as import("next/server").NextRequest;
}

describe("patient push routes", () => {
  it("subscribe proxies to the backend subscribe path", async () => {
    await subscribePost(req());
    expect(proxy).toHaveBeenCalledWith(
      expect.anything(),
      "/patient-portal/push/subscribe",
    );
  });

  it("unsubscribe proxies to the backend unsubscribe path", async () => {
    await unsubscribePost(req());
    expect(proxy).toHaveBeenCalledWith(
      expect.anything(),
      "/patient-portal/push/unsubscribe",
    );
  });
});
