"use client";

import * as React from "react";
import Link from "next/link";
import { Terminal, Check, Copy, ArrowRight, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FooterSection() {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("npm install @express-route-cache/core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="relative border-t border-border bg-muted/5 overflow-hidden">
      {/* CTA Band */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Build resilient, ultra-fast Express backends.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Add production-grade caching to your service layer in under a
            minute. O(1) invalidation, SWR, and stampede protection out of the
            box.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-between gap-3 px-5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 cursor-pointer w-full sm:w-auto font-mono text-xs sm:text-sm text-foreground/80 transition-all select-none group shadow-[0_1px_2px_rgba(0,0,0,0.08)] !h-12 max-w-full overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-900"
            >
              <Terminal
                className="size-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span className="min-w-0 overflow-x-auto scrollbar-none whitespace-nowrap">npm i @express-route-cache/core</span>
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
              Read the Docs
              <ArrowRight
                className="size-4 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold text-sm text-foreground mb-3">
              @express-route-cache
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              TanStack Query&apos;s mental model, for your Express.js backend.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/CODE-Y02/express-route-cache"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="https://x.com/Yatharth_L"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X / Twitter"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.npmjs.com/package/@express-route-cache/core"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
                aria-label="npm"
              >
                npm
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Product
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/docs"
                  className="hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/guide/getting-started"
                  className="hover:text-foreground transition-colors"
                >
                  Getting Started
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/guide/studio"
                  className="hover:text-foreground transition-colors"
                >
                  Cache Studio
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/reference/api"
                  className="hover:text-foreground transition-colors"
                >
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Resources
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/docs/guide/recipes"
                  className="hover:text-foreground transition-colors"
                >
                  Recipes
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/guide/comparison"
                  className="hover:text-foreground transition-colors"
                >
                  Comparison
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/guide/deployment"
                  className="hover:text-foreground transition-colors"
                >
                  Deployment Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/guide/faq"
                  className="hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Community
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a
                  href="https://github.com/CODE-Y02/express-route-cache"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  GitHub
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/CODE-Y02/express-route-cache/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  Report an Issue
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/CODE-Y02/express-route-cache/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  Contributing
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>
            MIT License &mdash; Built by{" "}
            <a
              href="https://github.com/CODE-Y02"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors font-semibold"
            >
              Yatharth Lakhate
            </a>
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://www.npmjs.com/package/@express-route-cache/core"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              npm
            </a>
            <a
              href="https://github.com/CODE-Y02/express-route-cache"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/docs/guide/faq"
              className="hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
