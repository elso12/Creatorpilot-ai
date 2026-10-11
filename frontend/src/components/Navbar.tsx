"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  Search,
  Users2,
  Sparkles,
  CalendarDays,
  Settings as SettingsIcon,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Research",
    href: "/research",
    icon: Search,
    activeMatch: "/research",
  },
  {
    name: "Competitors",
    href: "/competitors",
    icon: Users2,
    activeMatch: "/competitors",
  },
  {
    name: "AI Studio",
    href: "/ai-studio",
    icon: Sparkles,
    activeMatch: "/ai-studio",
  },
  {
    name: "Planner",
    href: "/planner",
    icon: CalendarDays,
    activeMatch: "/planner",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    activeMatch: "/settings",
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <Compass className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              CreatorPilot{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI
              </span>
            </span>
            <span className="text-[10px] uppercase font-medium tracking-wider text-zinc-400 -mt-1">
              YouTube Intelligence Suite
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
          {NAV_LINKS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : (item.activeMatch &&
                  (pathname === item.activeMatch ||
                    pathname.startsWith(item.activeMatch + "/")));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-600/15 text-indigo-300 ring-1 ring-indigo-500/30"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-indigo-400" : "text-zinc-400"
                  )}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute -bottom-[19px] left-2 right-2 h-[2px] bg-indigo-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action / Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
            title="System healthy - Click to view diagnostics"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">System Healthy</span>
          </Link>
          <Link
            href="/ai-studio"
            className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/10 hover:opacity-90 transition-opacity"
            title="Go to AI Studio"
          >
            <Zap className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden items-center justify-around border-t border-white/[0.04] bg-[#090a0f] py-2 px-2">
        {NAV_LINKS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : (item.activeMatch &&
                (pathname === item.activeMatch ||
                  pathname.startsWith(item.activeMatch + "/")));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-[10px] p-1.5 rounded-md",
                isActive ? "text-indigo-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
