"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutDashboard, LogOut, Settings, User } from "lucide-react";

export function TopHeader() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2">
          <Image src="/logo.png" alt="Mizzle" width={28} height={28} />
          <span className="text-sm font-bold tracking-tight">Mizzle</span>
        </button>

        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
      </div>

      <div className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            S
          </div>
          <div className="text-left">
            <p className="text-sm font-medium leading-tight">Student</p>
            <p className="text-xs text-muted-foreground leading-tight">student@mizzle.app</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {profileOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setProfileOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border bg-white p-1.5 shadow-lg">
              <button
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                My Profile
              </button>
              <button
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
