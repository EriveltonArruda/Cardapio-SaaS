"use client";

import * as React from "react";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">, LinkProps {
  className?: string | ((props: { isActive: boolean }) => string);
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, href, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      <Link
        ref={ref}
        href={href}
        className={typeof className === "function" ? className({ isActive }) : cn(className, isActive && "active")}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";
