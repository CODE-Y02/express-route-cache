import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";
import { Zap } from "lucide-react";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 select-none">
          <Zap className="size-4.5 text-primary fill-current" />
          <span className="font-bold text-foreground">{appName}</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: "Guides",
        url: "/docs",
        active: "nested-url",
        secondary: true,
      },
      {
        text: "Reference",
        url: "/docs/reference/api",
        active: "nested-url",
        secondary: true,
      },
      {
        text: "v1.x (Legacy)",
        url: "/docs/v1",
        secondary: true,
      },
      {
        type: "custom",
        children: <ThemeSwitcher />,
        secondary: true,
      },
    ],
  };
}

export function homeOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 select-none">
          <Zap className="size-4.5 text-primary fill-current" />
          <span className="font-bold text-foreground">{appName}</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: "Docs",
        url: "/docs",
        active: "nested-url",
        secondary: true,
      },
      {
        type: "custom",
        children: <ThemeSwitcher />,
        secondary: true,
      },
    ],
  };
}
