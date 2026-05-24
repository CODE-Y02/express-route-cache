"use client";

import * as React from "react";
import {
  Shield,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function StampedeSection() {
  const [stampedeStatus, setStampedeStatus] = React.useState<
    "idle" | "running" | "complete"
  >("idle");
  const [stampedeLogs, setStampedeLogs] = React.useState<string[]>([]);
  const [stampedeProgress, setStampedeProgress] = React.useState(0);
  const [dbQueriesSaved, setDbQueriesSaved] = React.useState(0);

  const runStampedeSimulation = async () => {
    if (stampedeStatus === "running") return;
    setStampedeStatus("running");
    setStampedeLogs([]);
    setStampedeProgress(0);
    setDbQueriesSaved(0);

    const addLog = (msg: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setStampedeLogs((prev) => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    await addLog(
      "⚡ Simulating 100 concurrent requests hitting GET /api/reports/annual...",
      0,
    );
    setStampedeProgress(10);
    await addLog(
      "🔒 Request #1: Acquired process-local Mutex & Distributed Lock (SETNX)",
      500,
    );
    setStampedeProgress(30);
    await addLog(
      "⏳ Requests #2 to #100: Cache miss, but lock is occupied. Subscribed to local Promise coalescer.",
      400,
    );
    setStampedeProgress(50);
    await addLog(
      "🔌 Node Executing expensive database query & PDF generation (Duration: 350ms)...",
      500,
    );
    setStampedeProgress(70);
    await addLog("💾 DB query finished. Populated Redis Cache.", 600);
    setStampedeProgress(90);
    await addLog(
      "🔓 Released lock. Resolving all 99 waiting requests with computed result.",
      300,
    );
    setStampedeProgress(100);
    await addLog(
      "🎉 Complete! 100 requests served. Database hit: EXACTLY 1. Saved 99 DB queries.",
      400,
    );

    setDbQueriesSaved(99);
    setStampedeStatus("complete");
  };

  return (
    <section aria-label="Cache Stampede Simulation" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        {/* Left side: Explainer */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted text-xs font-semibold text-primary mb-6">
            <Shield className="size-3.5" aria-hidden="true" />
            <span>Two-Tier Concurrency Lock</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground">
            Deflect Cache Stampedes
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            When a high-traffic cache key expires, the "thundering herd"
            hits your database simultaneously, causing load spikes or server
            crashes.
          </p>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Our two-tier lock coordinates requests process-wide (via memory
            coalescing) and cluster-wide (via Redis/Memcached SETNX).
            Follower requests poll the cache silently while one leader
            generates the data.
          </p>

          <div className="flex gap-4">
            <Button
              onClick={runStampedeSimulation}
              disabled={stampedeStatus === "running"}
              className="w-full sm:w-auto rounded-xl font-semibold px-8 gap-2 bg-primary hover:bg-primary-hover text-primary-foreground group shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_20px_rgba(var(--primary-rgb,220,38,38),0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center justify-center !h-12 whitespace-nowrap"
            >
              <Lock className="size-4" aria-hidden="true" />
              Simulate 100 Stampeding Requests
            </Button>
          </div>
        </div>

        {/* Right side: Simulation Box */}
        <div className="lg:col-span-7">
          <Card className="border border-border bg-card rounded-3xl p-6 overflow-hidden shadow-lg">
            <div className="mb-6 flex justify-between items-center">
              <span className="font-semibold text-sm text-foreground">
                Stampede Simulation Console
              </span>
              {dbQueriesSaved > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold">
                  Saved {dbQueriesSaved} Database Hits!
                </span>
              )}
            </div>

            {/* Visual request grid */}
            <div className="mb-6 bg-muted/20 border border-border/40 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Concurrent Requests Visualizer
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />{" "}
                    DB Query (1)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{" "}
                    Waiting (99)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                    Served (100)
                  </span>
                </span>
              </div>

              <div className="sr-only" aria-live="polite">
                {stampedeStatus === "idle" && "Simulator is idle. No requests currently executing."}
                {stampedeStatus === "running" && stampedeProgress < 30 && "Request 1 started. Acquiring locks."}
                {stampedeStatus === "running" && stampedeProgress >= 30 && stampedeProgress < 90 && "Request 1 executing database query. Requests 2 to 100 are waiting in the coalescer."}
                {stampedeStatus === "running" && stampedeProgress >= 90 && "Database query finished. Serving all 100 requests."}
                {stampedeStatus === "complete" && "All 100 requests successfully served. 1 database query executed, 99 queries saved."}
              </div>

              <div className="grid grid-cols-10 gap-1.5 max-h-[160px] overflow-hidden" aria-hidden="true">
                {Array.from({ length: 100 }).map((_, idx) => {
                  let color =
                    "bg-muted-foreground/15 border border-transparent";
                  if (stampedeStatus !== "idle") {
                    if (idx === 0) {
                      if (stampedeProgress < 90) {
                        color =
                          "bg-rose-500 border border-rose-600 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]";
                      } else {
                        color =
                          "bg-emerald-500 border border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                      }
                    } else {
                      if (stampedeProgress < 30) {
                        color =
                          "bg-muted-foreground/15 border border-transparent";
                      } else if (stampedeProgress < 90) {
                        color =
                          "bg-amber-500 border border-amber-600 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.4)]";
                      } else {
                        color =
                          "bg-primary border border-primary/80 shadow-[0_0_6px_rgba(59,130,246,0.4)]";
                      }
                    }
                  }
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "aspect-square rounded transition-all duration-300",
                        color,
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Progress bar */}
            <div
              role="progressbar"
              aria-label="Stampede simulation progress"
              aria-valuenow={stampedeProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full bg-muted h-1 rounded-full mb-6 overflow-hidden"
            >
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${stampedeProgress}%` }}
              />
            </div>

            <div
              aria-live="polite"
              aria-atomic="false"
              className="font-mono text-xs space-y-2 h-[260px] overflow-y-auto scrollbar-thin bg-black border border-slate-950 p-4 rounded-2xl flex flex-col justify-end text-slate-100"
            >
              {stampedeLogs.length === 0 ? (
                <div className="text-slate-400 italic h-full flex items-center justify-center">
                  Ready. Click "Simulate 100 Stampeding Requests".
                </div>
              ) : (
                stampedeLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="leading-relaxed animate-fade-in pl-2 border-l border-primary/20 text-left"
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
