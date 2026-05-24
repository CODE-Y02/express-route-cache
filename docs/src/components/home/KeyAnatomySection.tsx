"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export default function KeyAnatomySection() {
  const [selectedKeySegment, setSelectedKeySegment] = React.useState<
    "prefix" | "route" | "epoch" | "vary" | null
  >("epoch");

  return (
    <section
      aria-label="Cache Key Structure Explorer"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground">
          Anatomy of a Versioned Key
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          How we compose deterministic, instant-invalidating Redis keys. Click
          the segments to inspect how our versioning engine works.
        </p>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

        {/* The Interactive Key row */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs sm:text-sm mb-8 bg-muted/30 p-3 sm:p-4 rounded-2xl border border-border/50">
          <button
            onClick={() => setSelectedKeySegment("prefix")}
            aria-pressed={selectedKeySegment === "prefix"}
            className={cn(
              "px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl transition-all border font-semibold select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none",
              selectedKeySegment === "prefix"
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                : "bg-muted/80 hover:bg-muted text-muted-foreground border-border",
            )}
          >
            erc
          </button>

          <span className="text-muted-foreground/60 font-bold px-0.5 select-none">
            :
          </span>

          <button
            onClick={() => setSelectedKeySegment("route")}
            aria-pressed={selectedKeySegment === "route"}
            className={cn(
              "px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl transition-all border font-semibold select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none",
              selectedKeySegment === "route"
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                : "bg-muted/80 hover:bg-muted text-primary border-border",
            )}
          >
            GET:/api/users/:id
          </button>

          <span className="text-muted-foreground/60 font-bold px-0.5 select-none">
            :
          </span>

          <button
            onClick={() => setSelectedKeySegment("epoch")}
            aria-pressed={selectedKeySegment === "epoch"}
            className={cn(
              "px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl transition-all border font-semibold select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none",
              selectedKeySegment === "epoch"
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                : "bg-muted/80 hover:bg-muted text-amber-500 dark:text-amber-400 border-border",
            )}
          >
            v:api=0|v:api/users=3
          </button>

          <span className="text-muted-foreground/60 font-bold px-0.5 select-none">
            :
          </span>

          <button
            onClick={() => setSelectedKeySegment("vary")}
            aria-pressed={selectedKeySegment === "vary"}
            className={cn(
              "px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl transition-all border font-semibold select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none",
              selectedKeySegment === "vary"
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                : "bg-muted/80 hover:bg-muted text-muted-foreground border-border",
            )}
          >
            vary:auth=user_789
          </button>

          <span className="text-muted-foreground/60 font-bold px-1 select-none">
            ➡
          </span>
          <span className="px-2 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 font-bold text-foreground text-[10px] sm:text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            SHA-256 HASH
          </span>
        </div>

        {/* Explanation Card */}
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-6 text-left relative min-h-[160px] flex flex-col justify-center">
          {!selectedKeySegment ? (
            <div className="text-center text-muted-foreground italic">
              Click any key segment above to explore its anatomy and
              invalidation characteristics.
            </div>
          ) : (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">
                  {selectedKeySegment === "prefix" && "Prefix Namespace"}
                  {selectedKeySegment === "route" &&
                    "HTTP Method & Route Matcher"}
                  {selectedKeySegment === "epoch" &&
                    "Epoch Version counters (O(1) invalidation)"}
                  {selectedKeySegment === "vary" &&
                    "Vary Header accent identifier"}
                </h4>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedKeySegment === "prefix" &&
                  "Standard namespace prefix preventing cache key collisions. Allows isolating your Express cache pools from other databases or application keys inside a shared Redis/Memcached cluster."}
                {selectedKeySegment === "route" &&
                  "Guarantees resource isolation. Requests targeting different routes or HTTP methods (like GET vs HEAD) automatically cache to separate partition trees, preventing payload mixups."}
                {selectedKeySegment === "epoch" &&
                  "Appends version counters for the route and its ancestor path nodes. By incrementing 'v:api/users', any cached requests referencing it instantly mismatch on key lookup. This invalidates millions of sub-paths (like /api/users/123/profile) in O(1) time without scanning Redis keys."}
                {selectedKeySegment === "vary" &&
                  "Dynamic signature generated based on headers or customized client features (e.g. user authentication level, cookies, browser language, or tenant ID). Enables precise multitenant caching."}
              </p>

              <div className="pt-2 font-mono text-[11px] text-primary/90 flex flex-col sm:flex-row sm:items-center items-start gap-1.5 sm:gap-2">
                <span className="font-semibold text-muted-foreground shrink-0">
                  Configured via:
                </span>
                <span className="bg-primary/5 px-2 py-0.5 rounded border border-primary/10 break-all">
                  {selectedKeySegment === "prefix" &&
                    "createCache({ keyPrefix: 'erc' })"}
                  {selectedKeySegment === "route" &&
                    "cache.route() middleware matcher"}
                  {selectedKeySegment === "epoch" &&
                    "cache.invalidateRoute('/api/users')"}
                  {selectedKeySegment === "vary" &&
                    "cache.route({ vary: ['x-auth-user'] })"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
