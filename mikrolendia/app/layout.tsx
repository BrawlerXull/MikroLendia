'use client' 

import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { NavbarWrapper } from '@/components/navbar-wrapper' 
import { FooterOverlay } from '@/components/footer-overlay'
import '@/styles/globals.css'
import { Provider } from 'react-redux'
import store from '@/lib/store/store'
import {Toaster} from 'sonner'
import { Chatbot } from '@/components/chatbot'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-cover bg-center`} style={{ backgroundImage: 'url(herogradient.png)' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Provider store={store}>
            <div className="flex flex-col min-h-screen">
              <NavbarWrapper />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
                <Toaster />
              </main>
              <FooterOverlay />
            </div>
          <Chatbot />

          </Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
