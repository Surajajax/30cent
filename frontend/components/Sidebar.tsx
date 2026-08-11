'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import imageBlack from '../image_black.png';
import {
  Home,
  Wallet,
  Target,
  Sparkles,
  BarChart3,
  Settings,
  Plug,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;  
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'AI assistant', href: '/ai', icon: Sparkles },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Connect', href: '/connect', icon: Plug },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#000000] text-[#ececec] border-r border-[#262626] flex flex-col h-screen sticky top-0 select-none font-sans">
      {/* Header section with PNG logo image & app name */}
      <div className="p-3.5 border-b border-[#262626] flex items-center gap-3">
        <Link
          href="/"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
          className="relative w-10 h-10 flex-shrink-0"
        >
          <Image
            src={imageBlack}
            alt="30cent Logo"
            width={40}
            height={40}
            className="object-contain w-full h-full"
            priority
          />
        </Link>
        <span className="font-semibold text-lg text-[#ececec] tracking-tight">
          30Cent
        </span>
      </div>

      {/* Main navigation list */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-[#1a1a1a] text-[#ececec] font-medium shadow-xs'
                  : 'text-[#b4b4b4] hover:text-[#ececec] hover:bg-[#1a1a1a] font-normal'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-[#FFFFFF]' : 'text-[#b4b4b4]'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Account-level bottom section (OpenAI dark theme style) */}
      <div className="p-2 border-t border-[#262626] mt-auto">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              SC
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#ececec] truncate leading-tight">
                User Account
              </p>
              <p className="text-xs text-[#b4b4b4] truncate leading-tight">
                user@30cent.app
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="text-[#b4b4b4] hover:text-[#ececec] p-1 rounded-md hover:bg-[#262626] transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

