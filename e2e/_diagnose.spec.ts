import { test } from "@playwright/test";

// TEMP diagnostic — capture full console + pageerror stacks on the sign-in page.
test("diagnose sign-in console/page errors", async ({ page }) => {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("CONSOLE.ERROR:", msg.text());
      for (const f of msg.location ? [msg.location()] : []) {
        console.log("  @", `${f.url}:${f.lineNumber}:${f.columnNumber}`);
      }
    }
  });
  page.on("pageerror", (err) => {
    console.log("PAGEERROR:", err.message);
    console.log("STACK:", err.stack);
  });

  await page.goto("/ar/patient/signin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
});
