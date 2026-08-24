'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  BellRing,
  Map as MapIcon,
  Shield,
  Radar,
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Alerts', href: '/alerts', icon: BellRing },
  { label: 'Map', href: '/map', icon: MapIcon },
  { label: 'Admin', href: '/admin', icon: Shield },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              InfraSight AI
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Infrastructure Risk
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operations
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {item.label}
                {item.label === 'Alerts' && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'ml-auto h-5 px-1.5 text-[10px] font-semibold',
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-risk-critical/15 text-risk-critical'
                    )}
                  >
                    9
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-md bg-muted/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              System Status
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
              </span>
              <span className="text-xs font-medium text-foreground">All systems nominal</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Last sync 2 min ago</p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, alerts, districts..."
              className="h-9 bg-muted/50 pl-9 text-sm"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
              </span>
              Live
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-risk-critical ring-2 ring-card" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  <Badge variant="secondary" className="text-[10px]">9 new</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {[
                    { t: 'Critical alert: Brahmaputra embankment', time: '12m ago', sev: 'critical' },
                    { t: 'Schedule slippage: Ken-Betwa link', time: '1h ago', sev: 'critical' },
                    { t: 'AI imagery flagged corrosion on MCR-II', time: '3h ago', sev: 'high' },
                    { t: 'Cost overrun trending on BSRP-02', time: '5h ago', sev: 'high' },
                  ].map((n, i) => (
                    <DropdownMenuItem key={i} className="flex items-start gap-2 py-2.5">
                      <span
                        className={cn(
                          'mt-1 h-2 w-2 shrink-0 rounded-full',
                          n.sev === 'critical' ? 'bg-risk-critical' : 'bg-risk-high'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{n.t}</span>
                        <span className="text-[11px] text-muted-foreground">{n.time}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm text-primary">
                  View all alerts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-1.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      RA
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start leading-none md:flex">
                    <span className="text-xs font-semibold text-foreground">R. Anand</span>
                    <span className="text-[10px] text-muted-foreground">Program Director</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">R. Anand</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      r.anand@infrasight.gov.in
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-sm">
                  <UserCircle className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-sm">
                  <Settings className="h-4 w-4" /> Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-sm text-risk-critical">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
