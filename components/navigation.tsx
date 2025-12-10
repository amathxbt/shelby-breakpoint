"use client";

import { Home, Plus, User, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { cn } from "@/lib/utils";
import { useWalletDialog } from "@/providers/WalletDialogProvider";
import { Icons } from "./ui/icons";
import { SettingsDialog } from "./settings-dialog";
import { useState } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  isUpload?: boolean;
  isProfile?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Plus, label: "Upload", href: "/upload", isUpload: true },
  { icon: User, label: "Profile", href: "/profile", isProfile: true },
];

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { connected } = useWallet();
  const { openWalletDialog } = useWalletDialog();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navigateTo = (href: string) => {
    router.push(href);
  };

  const handleNavClick = (item: NavItem) => {
    // If clicking profile or upload and not connected, show wallet dialog
    // After connection, navigate to the intended destination
    if ((item.isProfile || item.isUpload) && !connected) {
      openWalletDialog(() => navigateTo(item.href));
      return;
    }

    navigateTo(item.href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col items-center py-6 px-2 bg-sidebar border-r border-sidebar-border w-[72px] shrink-0 font-gt-planar">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="mb-4 text-primary hover:text-primary/80 transition-colors"
        >
          <Icons.ShelbyToken className="w-8 h-8" />
        </button>

        <div className="flex flex-col items-center gap-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-colors group w-full",
                  isActive
                    ? "text-sidebar-foreground"
                    : "text-secondary-foreground hover:text-sidebar-foreground"
                )}
              >
                {item.isUpload ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-r from-primary to-destructive rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center w-10 h-10 bg-card rounded-lg">
                      <Icon
                        className="w-5 h-5 text-primary"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors group w-full mb-2",
            isSettingsOpen
              ? "text-sidebar-foreground"
              : "text-secondary-foreground hover:text-sidebar-foreground"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
              isSettingsOpen
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/50"
            )}
          >
            <Settings
              className="w-5 h-5"
              strokeWidth={isSettingsOpen ? 2.5 : 2}
            />
          </div>
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-sidebar/95 backdrop-blur-lg border-t border-sidebar-border z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center gap-0.5 transition-colors min-w-[64px] group",
                isActive ? "text-sidebar-foreground" : "text-muted-foreground"
              )}
            >
              {item.isUpload ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-r from-primary to-destructive rounded-md blur-sm opacity-75" />
                  <div className="relative flex items-center justify-center w-11 h-7 bg-card rounded-md">
                    <Icon className="w-4 h-4 text-primary" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.5} />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 transition-colors min-w-[64px] group",
            isSettingsOpen ? "text-sidebar-foreground" : "text-muted-foreground"
          )}
        >
          <Settings
            className="w-6 h-6"
            strokeWidth={isSettingsOpen ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
