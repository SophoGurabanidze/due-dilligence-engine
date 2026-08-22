"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            Due Diligence Engine
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/investigations"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            My Investigations
          </Link>
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
