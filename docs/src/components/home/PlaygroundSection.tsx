"use client";

import * as React from "react";
import { Zap, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CODE_SNIPPETS = {
  route: `import express from 'express';
import { createCache, createRedisAdapter } from '@express-route-cache/core';

const app = express();
const cache = createCache({
  adapter: createRedisAdapter({ host: 'localhost' }),
  staleTime: 60, // Fresh for 60s
  gcTime: 300,   // Keep stale for 5m
  swr: true      // Background revalidation
});

// Cache this route globally
app.get('/api/users/:id', cache.route(), (req, res) => {
  res.json({ id: req.params.id, name: 'Alex' });
});`,
  fetch: `// Cache arbitrary DB queries or external API calls
const getUserAnalytics = async (userId: string) => {
  return await cache.fetch(
    \`analytics:\${userId}\`,
    async () => {
      // Expensive operation (e.g. DB aggregation / LLM call)
      const data = await db.aggregations.findMany({ userId });
      return data;
    },
    { 
      staleTime: 120, // 2 minutes fresh
      swr: true,      // SWR enabled
      retry: 3        // Automatic retry on failure
    }
  );
};`,
  invalidate: `// Invalidate nested paths in O(1) time
app.post('/api/users', async (req, res) => {
  await db.users.create(req.body);
  
  // Instantly invalidates all cached sub-paths (e.g. /api/users/123)
  // via Epoch Versioning increments
  await cache.invalidateRoute('/api/users');
  
  res.status(201).json({ success: true });
});`,
};

interface SimulatedRequest {
  id: number;
  method: string;
  path: string;
  status: "miss" | "hit" | "swr" | "invalidate";
  time: string;
  duration: string;
}

export default function PlaygroundSection() {
  const [activePlaygroundTab, setActivePlaygroundTab] = React.useState<
    "route" | "fetch" | "invalidate"
  >("route");

  const [playgroundLogs, setPlaygroundLogs] = React.useState<string[]>([]);
  const [playgroundStatus, setPlaygroundStatus] = React.useState<
    "idle" | "running"
  >("idle");
  const [requestCount, setRequestCount] = React.useState(0);
  const [requestList, setRequestList] = React.useState<SimulatedRequest[]>([]);

  // Reset logs and requests when tab changes
  React.useEffect(() => {
    setPlaygroundLogs([]);
    setRequestCount(0);
  }, [activePlaygroundTab]);

  const runPlaygroundSimulation = async () => {
    if (playgroundStatus === "running") return;
    setPlaygroundStatus("running");
    setPlaygroundLogs([]);

    const addLog = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setPlaygroundLogs((prev) => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    if (activePlaygroundTab === "route") {
      const isFirst = requestCount % 2 === 0;
      setRequestCount((prev) => prev + 1);

      if (isFirst) {
        setRequestList((prev) => [
          {
            id: prev.length + 1,
            method: "GET",
            path: "/api/users/123",
            status: "miss",
            time: new Date().toLocaleTimeString(),
            duration: "554ms",
          },
          ...prev,
        ]);
        await addLog("🚀 GET /api/users/123 -> Request received", 0);
        await addLog('🔍 Checking Redis cache for key "erc:hash:3b9a..."', 400);
        await addLog("❌ Cache MISS", 300);
        await addLog(
          "🔌 Executing route handler (Accessing PostgreSQL database...)",
          300,
        );
        await addLog("💾 Database query complete (took 240ms)", 500);
        await addLog(
          "📥 Writing response to Redis (staleTime: 60s, gcTime: 300s)",
          300,
        );
        await addLog(
          "📦 Response served. Header [X-Cache: MISS] | Duration: 554ms",
          400,
        );
      } else {
        setRequestList((prev) => [
          {
            id: prev.length + 1,
            method: "GET",
            path: "/api/users/123",
            status: "hit",
            time: new Date().toLocaleTimeString(),
            duration: "3ms",
          },
          ...prev,
        ]);
        await addLog("🚀 GET /api/users/123 -> Request received", 0);
        await addLog('🔍 Checking Redis cache for key "erc:hash:3b9a..."', 200);
        await addLog("✅ Cache HIT", 200);
        await addLog(
          "📦 Response served. Header [X-Cache: HIT] | Duration: 3ms",
          300,
        );
      }
    } else if (activePlaygroundTab === "fetch") {
      setRequestList((prev) => [
        {
          id: prev.length + 1,
          method: "FETCH",
          path: "analytics:user_789",
          status: "swr",
          time: new Date().toLocaleTimeString(),
          duration: "2ms (SWR)",
        },
        ...prev,
      ]);
      await addLog('⚙️ Executing getUserAnalytics("user_789")', 0);
      await addLog(
        '🔍 cache.fetch("analytics:user_789") -> Inspecting store',
        300,
      );
      await addLog("🟡 Cache HIT (Stale: Age 85s > staleTime 60s)", 400);
      await addLog(
        "📦 Serving STALE cached data immediately to client (Duration: 2ms)",
        300,
      );
      await addLog("🔄 Background Revalidation triggered", 200);
      await addLog(
        "🔌 Executing fetcher: aggregating DB logs in background...",
        400,
      );
      await addLog("💾 Background DB query complete (took 180ms)", 500);
      await addLog(
        "📥 Cache updated with fresh data. Next request will be served fresh.",
        300,
      );
    } else if (activePlaygroundTab === "invalidate") {
      setRequestList((prev) => [
        {
          id: prev.length + 1,
          method: "POST",
          path: "/api/users (INVL)",
          status: "invalidate",
          time: new Date().toLocaleTimeString(),
          duration: "O(1) Epoch",
        },
        ...prev,
      ]);
      await addLog("🟠 POST /api/users -> Creating user in Database", 0);
      await addLog("💾 DB Insert successful", 300);
      await addLog('⚡ cache.invalidateRoute("/api/users") called', 300);
      await addLog(
        '🔄 Redis INCR "v:epoch:/api/users" -> Incremented O(1) Epoch',
        300,
      );
      await addLog(
        "✨ All nested route keys (e.g. /api/users/123) are now instantly stale",
        400,
      );
      await addLog(
        "🚀 Next GET request will force a fresh fetch from the DB",
        200,
      );
    }

    setPlaygroundStatus("idle");
  };

  return (
    <section
      aria-label="Interactive Caching Playground"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
          Explore Caching Mechanics
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Click the tabs to toggle code patterns, and run the simulator to see
          the background orchestration logs in action.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-stretch max-w-4xl lg:max-w-none mx-auto">
        {/* Left: Code Box */}
        <div className="lg:col-span-7 flex flex-col min-w-0">
          <Tabs
            defaultValue="route"
            value={activePlaygroundTab}
            onValueChange={(v) => setActivePlaygroundTab(v as any)}
            className="flex flex-col flex-grow border border-border rounded-3xl bg-slate-950 overflow-hidden shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-900 bg-slate-900">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <TabsList className="bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 w-full sm:w-auto overflow-x-auto scrollbar-none flex flex-row flex-nowrap shrink-0">
                <TabsTrigger
                  value="route"
                  className="shrink-0 text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-slate-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Route Caching
                </TabsTrigger>
                <TabsTrigger
                  value="fetch"
                  className="shrink-0 text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-slate-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Standalone fetch()
                </TabsTrigger>
                <TabsTrigger
                  value="invalidate"
                  className="shrink-0 text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-slate-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Auto Invalidation
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto text-slate-200 flex-grow bg-slate-950">
              <pre className="whitespace-pre">
                {CODE_SNIPPETS[activePlaygroundTab]}
              </pre>
            </div>
          </Tabs>
        </div>

        {/* Right: Live Interactive Console */}
        <div className="lg:col-span-5 flex flex-col min-w-0">
          <Card className="border border-border bg-card flex flex-col h-full rounded-3xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity
                  className="size-4.5 text-primary animate-pulse"
                  aria-hidden="true"
                />
                <span className="font-bold text-sm text-foreground">
                  Simulation Monitor
                </span>
              </div>
              {activePlaygroundTab === "route" && (
                <span className="text-xs text-muted-foreground font-semibold">
                  Requests sent: {requestCount}
                </span>
              )}
            </div>

            <CardContent className="p-6 flex-grow flex flex-col justify-between min-h-[400px]">
              {/* Visual Request Stream */}
              <div className="mb-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Visual Request Stream
                  </span>
                  {requestList.length > 0 && (
                    <button
                      onClick={() => setRequestList([])}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {requestList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-border bg-muted/10 text-center text-muted-foreground text-xs gap-2 min-h-[96px]">
                    <Activity
                      className="size-5 text-muted-foreground/45 animate-pulse"
                      aria-hidden="true"
                    />
                    <span>
                      No requests simulated yet. Click below to run a test.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {requestList.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20 animate-fade-in"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded",
                              req.method === "GET"
                                ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                                : req.method === "POST"
                                  ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                                  : "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30",
                            )}
                          >
                            {req.method}
                          </span>
                          <span className="text-xs font-mono font-semibold text-foreground">
                            {req.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5",
                              req.status === "hit"
                                ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                                : req.status === "miss"
                                  ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                                  : req.status === "swr"
                                    ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                                    : "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30",
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                req.status === "hit"
                                  ? "bg-emerald-500"
                                  : req.status === "miss"
                                    ? "bg-rose-500"
                                    : req.status === "swr"
                                      ? "bg-amber-500"
                                      : "bg-indigo-500",
                              )}
                            />
                            {req.status.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground font-semibold">
                            {req.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Console Logs Output */}
              <div
                aria-live="polite"
                aria-atomic="false"
                className="font-mono text-xs space-y-2 flex-grow overflow-y-auto max-h-[220px] scrollbar-thin bg-black border border-slate-950 p-4 rounded-2xl mb-6 text-slate-100 min-h-[140px]"
              >
                <div className="text-[10px] text-muted-foreground border-b border-slate-900 pb-1.5 mb-2 font-semibold">
                  TERMINAL OUTPUT
                </div>
                {playgroundLogs.length === 0 ? (
                  <div className="text-slate-400 italic h-[calc(100%-24px)] flex items-center justify-center">
                    Console logs will appear here during simulation.
                  </div>
                ) : (
                  playgroundLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="leading-relaxed border-l border-primary/40 pl-2 animate-fade-in text-left text-slate-300"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>

              {/* Play Action Button */}
              <Button
                onClick={runPlaygroundSimulation}
                disabled={playgroundStatus === "running"}
                className="w-full rounded-xl font-semibold bg-primary hover:bg-primary-hover text-primary-foreground group shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_20px_rgba(var(--primary-rgb,220,38,38),0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center justify-center !h-12 whitespace-nowrap gap-2"
              >
                {playgroundStatus === "running" ? (
                  <>
                    <RefreshCw
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="size-4 fill-current" aria-hidden="true" />
                    {activePlaygroundTab === "route"
                      ? requestCount === 0
                        ? "Send Request 1 (Cache Miss)"
                        : "Send Request 2 (Cache Hit)"
                      : activePlaygroundTab === "fetch"
                        ? "Trigger Fetch (SWR Demo)"
                        : "Trigger DB Mutation & Invalidate"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
