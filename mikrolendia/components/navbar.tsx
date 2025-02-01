'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Laptop, Menu } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { toast } from 'sonner'
import { useAppSelector } from '@/lib/hooks/useAppSelector'

interface NavbarProps {
  connectWallet: () => Promise<void>
  disconnectWalletHandler: () => void
}

const navItems = [
  { href: '/bidding', label: 'Bidding' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/request-loan', label: 'Request Loan' },
  { href: '/community', label: 'Community' },
  { href: '/register', label: 'Register' },
]

export function Navbar({
  connectWallet,
  disconnectWalletHandler,
}: NavbarProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const { isConnected } = useAppSelector((state) => state.wallet)

  useEffect(() => setMounted(true), [])
  console.log(theme)

  if (!mounted) return null

  const handleConnect = async () => {
    try {
      await connectWallet()

      if(isConnected){
        toast.success('Successfully connected to your wallet!')
      }
      
    } catch (err) {
      if(!isConnected){
        toast.error('Error connecting to wallet. Please try again.')
      }
      console.log(err)
    }
  }

  const handleDisconnect = () => {
    try {
      disconnectWalletHandler()

      if(!isConnected){
        toast.success('Successfully disconnected from your wallet!')
      }
      
    } catch (err) {
      if(isConnected){
        toast.error('Error disconnecting to wallet. Please try again.')
      }
      console.log(err)
    }
  }

  return (
    <motion.nav 
      className="sticky top-0 z-40 w-full backdrop-blur"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <motion.span 
              className="text-2xl font-bold flex items-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Image src="/logo.png" width={40} height={40} alt="Udaan Logo" />
              <div className='ml-3'>Udaan</div>
            </motion.span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <motion.div
                key={item.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isConnected && (
              <Button onClick={handleConnect} disabled={isConnected}>
                Connect Wallet
              </Button>
          )}
          {isConnected && (
            <Button onClick={handleDisconnect} variant="outline" size="sm">
              Disconnect Wallet
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t"
          >
            <div className="container py-4 px-4 space-y-4">
              {navItems.map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className="block text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}