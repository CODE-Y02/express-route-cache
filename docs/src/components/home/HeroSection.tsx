"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Terminal,
  Check,
  Copy,
  ArrowRight,
  GitBranch,
  Database,
  Shield,
  Code2,
  Zap,
  BarChart3,
  Clock,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const [copied, setCopied] = React.useState(false);
  const [githubStars, setGithubStars] = React.useState<number | null>(null);
  const [npmDownloads, setNpmDownloads] = React.useState<number | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("npm install @express-route-cache/core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    fetch("https://api.github.com/repos/CODE-Y02/express-route-cache")
      .then((r) => r.json())
      .then(
        (data) =>
          typeof data?.stargazers_count === "number" &&
          setGithubStars(data.stargazers_count),
      )
      .catch(() => {});
    fetch(
      "https://api.npmjs.org/downloads/point/last-week/@express-route-cache/core",
    )
      .then((r) => r.json())
      .then(
        (data) =>
          typeof data?.downloads === "number" &&
          setNpmDownloads(data.downloads),
      )
      .catch(() => {});
  }, []);

  return (
    <header className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-8 animate-fade-in">
        <Sparkles className="size-3.5" aria-hidden="true" />
        <span>
          v2.0 &mdash; Production Caching Infrastructure for Express.js
        </span>
      </div>

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-none bg-clip-text text-transparent bg-gradient-to-b from-slate-950 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 mb-8 select-none">
        Production caching infrastructure for Express{" "}
        <span className="text-primary">— routes, services, and beyond.</span>
      </h1>

      <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mb-12 leading-relaxed font-normal">
        Cache any Express route{" "}
        <span className="text-foreground font-semibold">or async function</span>{" "}
        with <span className="text-foreground font-semibold">SWR</span>,{" "}
        <span className="text-foreground font-semibold">O(1) invalidation</span>
        , and{" "}
        <span className="text-foreground font-semibold">
          stampede protection
        </span>
        . Redis, Memcached &amp; in-memory adapters. TypeScript-first.
      </p>

      {/* CTAs — npm install as primary action */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-2xl mb-8">
        <button
          onClick={copyToClipboard}
          aria-label="Copy npm installation command to clipboard"
          className="flex items-center justify-between gap-3 px-5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 cursor-pointer w-full sm:w-auto font-mono text-sm text-foreground/80 transition-all select-none group shadow-[0_1px_2px_rgba(0,0,0,0.08)] !h-12 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-900"
        >
          <Terminal
            className="size-4 text-primary shrink-0"
            aria-hidden="true"
          />
          <span className="shrink-0">npm i @express-route-cache/core</span>
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

        <Link
          href="/docs"
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full sm:w-auto rounded-xl font-semibold px-8 gap-2 bg-primary hover:bg-primary-hover text-primary-foreground group shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_20px_rgba(var(--primary-rgb,220,38,38),0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center justify-center !h-12 whitespace-nowrap",
          )}
        >
          View Documentation
          <ArrowRight
            className="size-4 group-hover:translate-x-1 transition-transform"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* Social proof stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-16 text-xs text-muted-foreground">
        <a
          href="https://github.com/CODE-Y02/express-route-cache"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <GitBranch className="size-3.5" aria-hidden="true" />
          <span className="font-semibold">
            {githubStars !== null
              ? `${githubStars.toLocaleString()} GitHub stars`
              : "GitHub"}
          </span>
        </a>
        <span className="text-border">·</span>
        <a
          href="https://www.npmjs.com/package/@express-route-cache/core"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <Database className="size-3.5" aria-hidden="true" />
          <span className="font-semibold">
            {npmDownloads !== null
              ? `${npmDownloads.toLocaleString()} weekly downloads`
              : "npm"}
          </span>
        </a>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1.5">
          <Shield className="size-3.5" aria-hidden="true" />
          <span className="font-semibold">MIT License</span>
        </span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1.5">
          <Code2 className="size-3.5" aria-hidden="true" />
          <span className="font-semibold">100% TypeScript</span>
        </span>
      </div>

      {/* Core Features Quick Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mt-8">
        <div className="relative overflow-hidden p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border transition-all flex flex-col gap-3 group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <Zap className="size-5 text-primary" aria-hidden="true" />
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            O(1)
          </span>
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-foreground">
              Epoch Invalidation
            </h3>
            <span className="text-xs text-muted-foreground mt-0.5">
              Instant nested key updates without scanning Redis keys
            </span>
          </div>
        </div>
        <div className="relative overflow-hidden p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border transition-all flex flex-col gap-3 group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <BarChart3 className="size-5 text-primary" aria-hidden="true" />
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            99%
          </span>
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-foreground">
              DB Query Reduction
            </h3>
            <span className="text-xs text-muted-foreground mt-0.5">
              Saves databases from melting under peak concurrent load
            </span>
          </div>
        </div>
        <div className="relative overflow-hidden p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border transition-all flex flex-col gap-3 group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <Clock className="size-5 text-primary" aria-hidden="true" />
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            &lt; 4ms
          </span>
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-foreground">
              Avg Cache-Hit Latency
            </h3>
            <span className="text-xs text-muted-foreground mt-0.5">
              SWR serving from Redis on loopback — benchmark in README
            </span>
          </div>
        </div>
        <div className="relative overflow-hidden p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border transition-all flex flex-col gap-3 group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <Code2 className="size-5 text-primary" aria-hidden="true" />
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            Pure TS
          </span>
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-foreground">
              TypeScript-First API
            </h3>
            <span className="text-xs text-muted-foreground mt-0.5">
              Fully type-safe schemas, options, and event listeners
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
