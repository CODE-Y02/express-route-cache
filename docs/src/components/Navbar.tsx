'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Zap, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { gitConfig } from '@/lib/shared';

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function DarkLightToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/15 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer select-none relative">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl p-1 bg-popover border border-border">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar() {
  const pathname = usePathname() || '';
  const isDocs = pathname.startsWith('/docs');
  const [githubStars, setGithubStars] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch('https://api.github.com/repos/CODE-Y02/express-route-cache')
      .then(r => r.json())
      .then(data => typeof data?.stargazers_count === 'number' && setGithubStars(data.stargazers_count))
      .catch(() => {});
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md",
      isDocs && "hidden md:block"
    )}>
      <div className={cn(
        "mx-auto flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8",
        isDocs ? "max-w-none px-6" : "max-w-7xl"
      )}>
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 select-none group">
            <span className="font-sans font-bold text-sm tracking-tight text-foreground transition-colors group-hover:text-primary">
              <span className="text-primary mr-0.5">@</span>express-route-cache
            </span>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          
          {/* Docs Link (Only on Landing Page) */}
          {!isDocs && (
            <Link
              href="/docs"
              className="text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2"
            >
              Docs
            </Link>
          )}

          {/* GitHub Star Button */}
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-muted/15 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-xs font-semibold"
          >
            <Star className="h-3.5 w-3.5" />
            <span>Star</span>
            {githubStars !== null && (
              <span className="bg-muted/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {githubStars >= 1000 ? `${(githubStars / 1000).toFixed(1)}k` : githubStars}
              </span>
            )}
          </a>

          {/* GitHub Icon Link */}
          <Link
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/15 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <GithubIcon className="h-4 w-4" />
          </Link>

          {/* Dark / Light Toggle */}
          <DarkLightToggle />

          {/* Custom Theme Switcher */}
          <div>
            <ThemeSwitcher />
          </div>

        </div>
      </div>
    </header>
  );
}
