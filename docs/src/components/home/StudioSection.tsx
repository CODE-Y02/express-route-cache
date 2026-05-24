"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, Terminal, Check, Copy, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function StudioSection() {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      "npx @express-route-cache/studio --host localhost",
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      aria-label="Cache Studio Diagnostics Suite"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <Card className="border border-border bg-card rounded-3xl p-6 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-lg">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/10 rounded-full blur-[80px]" />
        <div className="w-full flex-1 min-w-0">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-4">
            <Eye className="size-4" aria-hidden="true" />
            <span>Diagnostics Suite</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground">
            Cache Studio
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            A visual dashboard built for debugging. Monitor cache hits, trace
            SWR background processes, and analyze key epochs. Runs inside your
            Express app or as a standalone CLI targeting *any* compatible Redis
            cluster.
          </p>

          <button
            onClick={copyToClipboard}
            aria-label="Copy npx command to clipboard"
            className="flex items-center justify-between gap-3 px-5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 cursor-pointer w-full sm:w-auto font-mono text-xs sm:text-sm text-foreground/80 transition-all select-none group shadow-[0_1px_2px_rgba(0,0,0,0.08)] !h-12 max-w-full overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-900 mb-4 md:mb-0"
          >
            <Terminal
              className="size-4 text-primary shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0 overflow-x-auto scrollbar-none whitespace-nowrap">
              npx @express-route-cache/studio --host localhost
            </span>
            {copied ? (
              <Check
                className="size-4 text-emerald-500 animate-scale-up shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Copy
                className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        <div className="w-full md:w-auto flex flex-col gap-3">
          <Link
            href="/docs/guide/studio"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full sm:w-auto rounded-xl font-semibold px-8 gap-2 bg-primary hover:bg-primary-hover text-primary-foreground group shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_20px_rgba(var(--primary-rgb,220,38,38),0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center justify-center !h-12 whitespace-nowrap",
            )}
          >
            Read Studio Guide
            <ArrowRight
              className="size-4 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>
      </Card>
    </section>
  );
}
