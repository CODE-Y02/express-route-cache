"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const themes = [
  { id: "ember", name: "Ember", icon: "🔥" },
  { id: "thunder", name: "Thunder", icon: "⚡" },
  { id: "sea", name: "Sea", icon: "🐋" },
  { id: "night", name: "Night", icon: "🌙" },
];

export function ThemeSwitcher() {
  const [mounted, setMounted] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState("ember");

  React.useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("erc-theme") || "ember";
    const normalized =
      savedTheme === "enver"
        ? "ember"
        : savedTheme === "space"
          ? "night"
          : savedTheme;
    setCurrentTheme(normalized);
    document.documentElement.setAttribute("data-theme", normalized);
  }, []);

  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("erc-theme", themeId);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-1.5 h-8 font-semibold text-xs transition-colors hover:bg-accent/50 cursor-pointer",
        )}
      >
        <span>🔥</span>
        <span className="hidden sm:inline">Ember</span>
        <ChevronDown className="size-3 opacity-60" />
      </div>
    );
  }

  const active = themes.find((t) => t.id === currentTheme) || themes[0];

  return (
    <div className="flex items-center pl-3 border-l h-5 border-border">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 h-8 font-semibold text-xs transition-colors hover:bg-accent/50 cursor-pointer",
          )}
        >
          <span>{active.icon}</span>
          <span className="hidden sm:inline">{active.name}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[140px] rounded-xl p-1 bg-popover border border-border"
        >
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              className="gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors"
            >
              <span>{theme.icon}</span>
              <span className="flex-1">{theme.name}</span>
              {theme.id === currentTheme && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
