'use client' 

import { Outfit } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { NavbarWrapper } from '@/components/navbar-wrapper'
import { FooterOverlay } from '@/components/footer-overlay'
import './globals.css'
import { Provider } from 'react-redux'
import store from '@/lib/store/store'
import { Toaster } from 'sonner'
import { Chatbot } from '@/components/chatbot'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>LendLedger — Decentralized Micro-Lending</title>
        <meta name="description" content="Empowering individuals and small businesses through blockchain-based micro-lending. Borrow, lend, and build communities on Ethereum." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${outfit.className} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Provider store={store}>
            <div className="flex flex-col min-h-screen">
              <NavbarWrapper />
              <main className="flex-grow">
                {children}
              </main>
              <FooterOverlay />
              <Toaster
                theme="dark"
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'hsl(225, 20%, 12%)',
                    border: '1px solid hsl(225, 15%, 20%)',
                    color: 'hsl(210, 20%, 95%)',
                  },
                }}
              />
            </div>
            <Chatbot />
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
