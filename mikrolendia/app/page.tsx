'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { WobbleCardDemo } from '@/components/wobeldemo'

export default function Home() {
  return (
    <div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10px)] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl flex flex-col items-center"
        >
          <Image src="/logo.png" width={200} height={200} alt="MikroLendia Logo" className='mb-10' />
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
            Welcome to MikroLendia
          </h1>
          <p className="text-xl mb-8 text-muted-foreground">
            Empowering individuals and small businesses through blockchain-based micro-lending.
            Join our community and make a difference today.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500">
            <Link href="/bidding">Start Bidding</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/request-loan">Request a Loan</Link>
          </Button>
        </motion.div>

      </div>
      <WobbleCardDemo />

    </div>

  )
}

