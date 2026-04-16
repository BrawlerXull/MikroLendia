'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import useLoanContract from '@/lib/hooks/useLoanContract'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { ethers } from 'ethers'
import { HandCoins, Wallet, Info } from 'lucide-react'

export default function RequestLoan() {
  const [loanType, setLoanType] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  
  const { isConnected } = useAppSelector((state) => state.wallet)
  const { requestLoan, creatingLoan, fetchAllLoans } = useLoanContract()
  const router = useRouter()

  useEffect(() => {
    fetchAllLoans()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loanType || !amount || !description || !duration) {
      toast.error('Please fill in all the fields.')
      return
    }

    try {
      const loanEnum = loanType === 'personal' ? 0 : loanType === 'business' ? 1 : 2
      
      // Amount is directly entered as ETH by the user
      const ethAmount = parseFloat(amount)
      if (isNaN(ethAmount) || ethAmount <= 0) {
        toast.error('Please enter a valid ETH amount.')
        return
      }

      const loanAmount = ethers.utils.parseEther(ethAmount.toString())
      
      await requestLoan(
        loanAmount,
        description,        
        loanEnum,           
        parseInt(duration),
        amount // passing the string amount to backend for logging
      )

      toast.success('Loan requested successfully!')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      console.error('Loan request failed:', err)
      toast.error('An error occurred while requesting the loan.')
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your MetaMask wallet to request a loan.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HandCoins className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Request a Loan</h1>
          <p className="text-muted-foreground">Publish your loan request to the decentralized marketplace.</p>
        </div>

        <Card className="glass border-border/50 shadow-xl">
          <form onSubmit={handleSubmit}>
            <CardHeader className="border-b border-border/50 pb-6 mb-6">
              <CardTitle className="text-xl">Loan Details</CardTitle>
              <CardDescription>Specify your requirements. Lenders will bid with competitive interest rates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <Label htmlFor="loan-type">Loan Type</Label>
                <Select value={loanType} onValueChange={setLoanType} required>
                  <SelectTrigger id="loan-type" className="bg-background/50 h-12">
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="amount">Amount Required (ETH)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="0.5"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="bg-background/50 h-12 pl-4 pr-16 text-lg font-medium"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    ETH
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="duration">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="12"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className="bg-background/50 h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Why do you need this loan?</Label>
                <Textarea
                  id="description"
                  placeholder="Explain the purpose of your loan to attract lenders..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="bg-background/50 min-h-[120px] resize-none"
                />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-400">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold block mb-1">Smart Contract Escrow</span>
                  Once a lender approves your request, the funds are instantly transferred to your wallet via our decentralized escrow contract.
                </div>
              </div>

            </CardContent>

            <CardFooter className="pt-4 pb-8 px-6">
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 rounded-xl text-md font-medium shadow-lg hover:shadow-indigo-500/25 transition-all" disabled={creatingLoan}>
                {creatingLoan ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Transaction...
                  </span>
                ) : (
                  'Publish Loan Request'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}