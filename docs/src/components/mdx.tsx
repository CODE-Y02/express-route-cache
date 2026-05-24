import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "fumadocs-mermaid/ui";
import { Callout } from "fumadocs-ui/components/callout";
import React from "react";

function CustomBlockquote({ children, ...props }: React.ComponentPropsWithoutRef<"blockquote">) {
  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0];

  if (React.isValidElement(firstChild)) {
    const element = firstChild as React.ReactElement<{ children?: React.ReactNode }>;
    const pChildren = React.Children.toArray(element.props.children);
    const firstTextNode = pChildren[0];

    if (typeof firstTextNode === "string") {
      const match = firstTextNode.trim().match(/^\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/i);
      if (match) {
        const type = match[0].slice(2, -1).toLowerCase();
        const cleanedText = firstTextNode.replace(/^\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\s*/i, "");

        let calloutType: "info" | "warn" | "error" | "success" | "idea" = "info";
        if (type === "warning" || type === "caution") {
          calloutType = "warn";
        } else if (type === "important") {
          calloutType = "error";
        } else if (type === "tip") {
          calloutType = "idea";
        }

        const newFirstChild = React.cloneElement(
          firstChild as React.ReactElement<any>,
          {},
          cleanedText ? [cleanedText, ...pChildren.slice(1)] : pChildren.slice(1)
        );

        return (
          <Callout type={calloutType}>
            {newFirstChild}
            {childrenArray.slice(1)}
          </Callout>
        );
      }
    }
  } else if (typeof firstChild === "string") {
    const match = firstChild.trim().match(/^\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/i);
    if (match) {
      const type = match[0].slice(2, -1).toLowerCase();
      const cleanedText = firstChild.replace(/^\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\s*/i, "");

      let calloutType: "info" | "warn" | "error" | "success" | "idea" = "info";
      if (type === "warning" || type === "caution") {
        calloutType = "warn";
      } else if (type === "important") {
        calloutType = "error";
      } else if (type === "tip") {
        calloutType = "idea";
      }

      return (
        <Callout type={calloutType}>
          {cleanedText}
          {childrenArray.slice(1)}
        </Callout>
      );
    }
  }

  return <blockquote {...props}>{children}</blockquote>;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Mermaid,
    blockquote: CustomBlockquote,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
