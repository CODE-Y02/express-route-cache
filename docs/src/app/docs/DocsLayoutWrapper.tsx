"use client";

import { usePathname } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type * as PageTree from "fumadocs-core/page-tree";
import React, { useMemo } from "react";
import { gitConfig } from "@/lib/shared";
import styles from "./docs.module.css";
import Navbar from "@/components/Navbar";

interface DocsLayoutWrapperProps {
  tree: PageTree.Root;
  children: React.ReactNode;
}

export default function DocsLayoutWrapper({
  tree,
  children,
}: DocsLayoutWrapperProps) {
  const pathname = usePathname() || "";
  const isV1 = pathname.startsWith("/docs/v1") || pathname === "/docs/v1";

  const filteredTree = useMemo(() => {
    if (!tree || !tree.children) return tree;

    if (isV1) {
      // Find the folder node representing v1
      const v1Folder = tree.children.find(
        (node) =>
          node.type === "folder" &&
          (node.name === "Legacy (v1)" ||
            node.name === "v1" ||
            node.children.some(
              (child) =>
                child.type === "page" && child.url.startsWith("/docs/v1"),
            )),
      );

      if (v1Folder && v1Folder.type === "folder") {
        return {
          name: "Legacy (v1)",
          children: v1Folder.children,
        };
      }
      return {
        name: "Legacy (v1)",
        children: [],
      };
    } else {
      // Filter out the v1 folder for v2 docs
      const v2Children = tree.children.filter(
        (node) =>
          !(
            node.type === "folder" &&
            (node.name === "Legacy (v1)" ||
              node.name === "v1" ||
              node.children.some(
                (child) =>
                  child.type === "page" && child.url.startsWith("/docs/v1"),
              ))
          ),
      );

      return {
        name: tree.name,
        children: v2Children,
      };
    }
  }, [tree, isV1]);

  return (
    <div className={styles.docsContainer}>
      <DocsLayout
        tree={filteredTree}
        nav={{
          component: <Navbar />,
        }}
        sidebar={{
          title: "@express-route-cache",
        }}
        githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
        tabs={[
          {
            title: "v2 (Latest)",
            description: "Latest stable release",
            url: "/docs",
          },
          {
            title: "v1 (Legacy)",
            description: "Legacy documentation",
            url: "/docs/v1",
          },
        ]}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
