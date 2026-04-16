'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Users, Zap, TrendingUp, Coins, FileCheck } from 'lucide-react'
import useLoanContract from '@/lib/hooks/useLoanContract'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { ethers } from 'ethers'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Home() {
  const { loanData } = useLoanContract()
  const { isConnected } = useAppSelector((state) => state.wallet)

  // Live stats from blockchain
  const totalLoans = loanData.length
  const totalVolume = loanData.reduce((sum: number, loan: any) => {
    try {
      return sum + parseFloat(ethers.utils.formatEther(loan.amount))
    } catch {
      return sum
    }
  }, 0)

  const stats = [
    { label: 'Active Loans', value: totalLoans.toString(), icon: FileCheck },
    { label: 'Volume (ETH)', value: totalVolume.toFixed(2), icon: Coins },
    { label: 'Communities', value: '—', icon: Users },
  ]

  const features = [
    {
      icon: Shield,
      title: 'Fully Decentralized',
      description: 'Every loan, bid, and repayment is recorded on-chain. No intermediaries, no hidden fees.',
    },
    {
      icon: TrendingUp,
      title: 'Competitive Rates',
      description: 'Lenders bid competitively on your loan request. You pick the best interest rate.',
    },
    {
      icon: Users,
      title: 'Community Lending',
      description: 'Form lending communities with multi-sig approval for group-backed loans.',
    },
  ]

  const steps = [
    { num: '01', title: 'Register', desc: 'Create your on-chain identity with your wallet address.' },
    { num: '02', title: 'Request a Loan', desc: 'Specify amount, duration, and purpose. Your request goes live instantly.' },
    { num: '03', title: 'Get Funded', desc: 'Lenders bid on your loan. Accept the best offer and receive ETH.' },
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Live on Localhost Testnet</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Micro-Lending,{' '}
            <span className="gradient-text">Reimagined</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Borrow and lend directly on Ethereum. No banks, no paperwork — 
            just transparent, community-driven finance powered by smart contracts.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button asChild size="lg" className="h-12 px-8 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 rounded-xl text-base glow-accent">
              <Link href={isConnected ? '/request-loan' : '/register'}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl text-base">
              <Link href="/bidding">Browse Loans</Link>
            </Button>
          </motion.div>
        </div>

        {/* Live Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-5 text-center stat-card">
              <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-border/50">
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps to get your loan funded on the blockchain.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative glass rounded-2xl p-6 text-center gradient-border"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 1}
              variants={fadeUp}
            >
              <div className="text-4xl font-black gradient-text mb-3">{step.num}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-border/50">
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Why LendLedger?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Built for the underbanked. Designed for transparency.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="glass rounded-2xl p-6 stat-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 1}
              variants={fadeUp}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          className="glass rounded-3xl p-10 sm:p-16 text-center gradient-border"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Connect your wallet, register, and start borrowing or lending in minutes.
          </p>
          <Button asChild size="lg" className="h-12 px-10 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 rounded-xl text-base glow-accent">
            <Link href="/register">
              Create Account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  )
}
