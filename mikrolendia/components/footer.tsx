'use client'

import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs">
                ML
              </div>
              <span className="text-lg font-bold">LendLedger</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Decentralized micro-lending powered by Ethereum smart contracts. Borrow, lend, 
              and build financial communities — all on-chain, all transparent.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Built on Ethereum</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { href: '/bidding', label: 'Marketplace' },
                { href: '/request-loan', label: 'Borrow' },
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/community', label: 'Communities' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">
              {[
                { href: '/register', label: 'Get Started' },
                { href: '#', label: 'Documentation' },
                { href: '#', label: 'Smart Contracts' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LendLedgerwh. All rights reserved.
          </p>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
