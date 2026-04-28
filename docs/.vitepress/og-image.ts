import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export interface OgPageInfo {
  slug: string; // e.g. "guide/getting-started"
  title: string;
  description: string;
}

// Minimal satori element helper — no JSX / React needed
function el(type: string, style: Record<string, any>, children?: any): object {
  return { type, props: { style, children: children ?? "" } };
}

function buildElement(title: string, description: string) {
  const display =
    title.replace(/\s*\|\s*@express-route-cache$/, "").trim() ||
    "@express-route-cache";

  const desc =
    description && description.length > 110
      ? description.slice(0, 110) + "…"
      : description || "";

  const fontSize = display.length > 45 ? "48px" : "60px";
  const tags = ["O(1) Invalidation", "SWR", "Stampede Protection"];

  return el(
    "div",
    {
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#0f172a",
      fontFamily: "Inter",
      position: "relative",
      overflow: "hidden",
    },
    [
      // Indigo radial glow top-left
      el("div", {
        position: "absolute",
        top: "-100px",
        left: "-100px",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
      }),
      // Cyan radial glow bottom-right
      el("div", {
        position: "absolute",
        bottom: "-80px",
        right: "-80px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)",
      }),
      // Top accent bar
      el("div", {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "6px",
        background: "linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)",
      }),
      // Content
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          height: "100%",
          justifyContent: "center",
          position: "relative",
        },
        [
          // Brand label
          el(
            "div",
            {
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
            },
            [
              el(
                "div",
                { fontSize: "20px", fontWeight: 700, color: "#818cf8" },
                "@express-route-cache"
              ),
              el("div", {
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                backgroundColor: "#06b6d4",
                marginTop: "2px",
              }),
              el(
                "div",
                { fontSize: "20px", fontWeight: 400, color: "#475569" },
                "Docs"
              ),
            ]
          ),
          // Page title
          el(
            "div",
            {
              fontSize,
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: "-0.03em",
              lineHeight: "1.1",
              maxWidth: "950px",
              marginBottom: "20px",
            },
            display
          ),
          // Description
          ...(desc
            ? [
                el(
                  "div",
                  {
                    fontSize: "22px",
                    fontWeight: 400,
                    color: "#94a3b8",
                    lineHeight: "1.4",
                    maxWidth: "860px",
                  },
                  desc
                ),
              ]
            : []),
          // Bottom row
          el(
            "div",
            {
              position: "absolute",
              bottom: "52px",
              left: "80px",
              right: "80px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
            [
              el(
                "div",
                { fontSize: "17px", color: "#475569", fontWeight: 500 },
                "express-route-cache.js.org"
              ),
              el(
                "div",
                { display: "flex", gap: "8px" },
                tags.map((t) =>
                  el(
                    "div",
                    {
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#818cf8",
                      backgroundColor: "rgba(99,102,241,0.12)",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: "1px solid rgba(99,102,241,0.25)",
                    },
                    t
                  )
                )
              ),
            ]
          ),
        ]
      ),
    ]
  );
}

export async function generateOgImages(
  outDir: string,
  pages: OgPageInfo[]
): Promise<void> {
  const { default: satori } = await import("satori");
  const { Resvg } = await import("@resvg/resvg-js");

  // Load Inter from @fontsource/inter — .woff (satori supports woff, not woff2)
  let fonts: any[];
  try {
    const reg = require.resolve(
      "@fontsource/inter/files/inter-latin-400-normal.woff"
    );
    const bold = require.resolve(
      "@fontsource/inter/files/inter-latin-800-normal.woff"
    );
    fonts = [
      {
        name: "Inter",
        data: readFileSync(reg).buffer,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: readFileSync(bold).buffer,
        weight: 800,
        style: "normal",
      },
    ];
  } catch (e) {
    console.warn("[og-image] Could not load fonts — skipping OG generation:", e);
    return;
  }

  for (const page of pages) {
    const parts = page.slug.split("/");
    const dir =
      parts.length > 1
        ? join(outDir, "og", ...parts.slice(0, -1))
        : join(outDir, "og");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    try {
      const element = buildElement(page.title, page.description);
      const svg = await satori(element as any, {
        width: 1200,
        height: 630,
        fonts,
      });
      const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
        .render()
        .asPng();
      writeFileSync(join(outDir, "og", `${page.slug}.png`), png);
      console.log(`  [og] /og/${page.slug}.png`);
    } catch (e) {
      console.warn(`[og-image] Failed for "${page.slug}":`, e);
    }
  }
}
