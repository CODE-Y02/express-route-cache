"use client";

import * as React from "react";
import Link from "next/link";

export default function ComparisonSection() {
  return (
    <section aria-label="Feature Comparison Matrix" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground">
          How We Compare
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          We built express-route-cache to solve production infrastructure
          challenges.
        </p>
      </div>

      <div className="hidden md:block overflow-x-auto border border-border rounded-3xl bg-card shadow-lg">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="p-5 font-bold text-foreground text-sm">
                Feature
              </th>
              <th className="p-5 font-bold text-primary text-sm">
                @express-route-cache
              </th>
              <th className="p-5 font-bold text-muted-foreground/85 text-sm">
                apicache
              </th>
              <th className="p-5 font-bold text-muted-foreground/85 text-sm">
                express-cache-controller
              </th>
              <th className="p-5 font-bold text-muted-foreground/85 text-sm">
                node-cache-manager
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground/90">
            <tr>
              <td className="p-5 font-semibold text-foreground">
                Invalidation
              </td>
              <td className="p-5 text-primary font-bold">
                O(1) Epoch Increment
              </td>
              <td className="p-5 text-muted-foreground">
                O(N) SCAN (blocks Redis)
              </td>
              <td className="p-5 text-muted-foreground">
                Browser only, no server cache
              </td>
              <td className="p-5 text-muted-foreground">
                Manual key deletion
              </td>
            </tr>
            <tr>
              <td className="p-5 font-semibold text-foreground">
                Stampede Guard
              </td>
              <td className="p-5 text-primary font-bold">
                Memory + Redis coalescing
              </td>
              <td className="p-5 text-muted-foreground">
                None &mdash; DB melts
              </td>
              <td className="p-5 text-muted-foreground">None</td>
              <td className="p-5 text-muted-foreground">None</td>
            </tr>
            <tr>
              <td className="p-5 font-semibold text-foreground">
                SWR Background Refresh
              </td>
              <td className="p-5 text-primary font-bold">Built-in</td>
              <td className="p-5 text-muted-foreground">
                None (blocking misses)
              </td>
              <td className="p-5 text-muted-foreground">None</td>
              <td className="p-5 text-muted-foreground">None</td>
            </tr>
            <tr>
              <td className="p-5 font-semibold text-foreground">
                Non-Route Caching
              </td>
              <td className="p-5 text-primary font-bold">
                cache.fetch() API
              </td>
              <td className="p-5 text-muted-foreground">
                No (middleware only)
              </td>
              <td className="p-5 text-muted-foreground">No</td>
              <td className="p-5 text-muted-foreground">
                Yes (manual boilerplate)
              </td>
            </tr>
            <tr>
              <td className="p-5 font-semibold text-foreground">
                TypeScript-first
              </td>
              <td className="p-5 text-primary font-bold">
                Yes &mdash; 100%
              </td>
              <td className="p-5 text-muted-foreground">No</td>
              <td className="p-5 text-muted-foreground">No</td>
              <td className="p-5 text-muted-foreground">Partial</td>
            </tr>
            <tr>
              <td className="p-5 font-semibold text-foreground">
                Visual Dashboard
              </td>
              <td className="p-5 text-primary font-bold">
                Cache Studio (standalone)
              </td>
              <td className="p-5 text-muted-foreground">None</td>
              <td className="p-5 text-muted-foreground">None</td>
              <td className="p-5 text-muted-foreground">None</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile comparison view */}
      <div className="md:hidden space-y-4">
        {[
          {
            title: "Invalidation",
            erc: "O(1) Epoch Increment",
            col2: { label: "apicache", val: "O(N) SCAN (blocks Redis)" },
            col3: {
              label: "express-cache-controller",
              val: "Browser only, no server cache",
            },
          },
          {
            title: "Stampede Guard",
            erc: "Memory + Redis coalescing",
            col2: { label: "apicache", val: "None — DB melts" },
            col3: { label: "node-cache-manager", val: "None" },
          },
          {
            title: "SWR Background Refresh",
            erc: "Built-in",
            col2: { label: "apicache", val: "None (blocking misses)" },
            col3: { label: "node-cache-manager", val: "None" },
          },
          {
            title: "Non-Route Caching",
            erc: "cache.fetch() API",
            col2: { label: "apicache", val: "No (middleware only)" },
            col3: {
              label: "node-cache-manager",
              val: "Yes (manual boilerplate)",
            },
          },
          {
            title: "Visual Dashboard",
            erc: "Cache Studio (standalone)",
            col2: { label: "apicache", val: "None" },
            col3: { label: "node-cache-manager", val: "None" },
          },
        ].map((row, idx) => (
          <div
            key={idx}
            className="border border-border rounded-2xl bg-card p-5 shadow-sm space-y-3"
          >
            <h4 className="font-bold text-foreground text-sm border-b border-border/60 pb-1.5">
              {row.title}
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="block text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">
                  @express-route-cache
                </span>
                <span className="text-foreground font-semibold">
                  {row.erc}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                  {row.col2.label}
                </span>
                <span className="text-muted-foreground">
                  {row.col2.val}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                  {row.col3.label}
                </span>
                <span className="text-muted-foreground">
                  {row.col3.val}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Comparison based on publicly documented features.{" "}
        <Link
          href="/docs/guide/comparison"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Full comparison →
        </Link>
      </p>
    </section>
  );
}
