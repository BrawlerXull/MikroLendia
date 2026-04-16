'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoanCard } from '@/components/ui/loanCard'
import useLoanContract from '@/lib/hooks/useLoanContract'
import { Loan } from '@/types/type'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { ethers } from 'ethers'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ArrowUpDown, Gavel, ArrowRight } from 'lucide-react'

export default function Bidding() {
  const { loanData, isLoading, error, bidMoney } = useLoanContract()
  const [searchTerm, setSearchTerm] = useState('')
  const [loanTypeFilter, setLoanTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [interestRate, setInterestRate] = useState('')
  const [isBidding, setIsBidding] = useState(false)
  // Map of loanIndex → bids from backend
  const [bidsMap, setBidsMap] = useState<Record<string, any[]>>({})
  const { walletAddress, isConnected } = useAppSelector((state) => state.wallet)

  const fetchBidsFromBackend = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5001/api/loan')
      if (!res.ok) return
      const all: any[] = await res.json()
      const map: Record<string, any[]> = {}
      for (const l of all) map[String(l.loanIndex)] = l.bids ?? []
      setBidsMap(map)
    } catch { /* backend offline */ }
  }, [])

  useEffect(() => { fetchBidsFromBackend() }, [fetchBidsFromBackend])

  // Filter out approved/repaid loans, only show pending (status == 0)
  const pendingLoans = loanData?.filter((loan) => Number(loan.status) === 0) || []

  const filteredLoans = pendingLoans
    .filter((loan) => {
      const matchesSearch =
        loan?.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType =
        loanTypeFilter === 'all' || Number(loan?.typeOfLoan) === Number(loanTypeFilter)
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount)
      if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount)
      return 0
    })

  const handleBid = (loan: Loan) => {
    // Guard: own loan or already bid — button is disabled so this shouldn't fire,
    // but double-check here as well.
    if (loan.requester?.toLowerCase() === walletAddress?.toLowerCase()) return
    const alreadyBid = (bidsMap[String(loan.loanId)] ?? []).some(
      (b: any) => b.bidBy?.toLowerCase() === walletAddress?.toLowerCase()
    )
    if (alreadyBid) return
    setSelectedLoan(loan)
  }

  const submitBid = async () => {
    if (!selectedLoan) return
    if (!interestRate || parseFloat(interestRate) <= 0) {
      toast.error('Please enter a valid interest rate.')
      return
    }
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      toast.error('Wallet not connected. Please connect MetaMask first.')
      return
    }

    setIsBidding(true)
    try {
      // Convert loan amount and deposit to contract
      const ethAmount = parseFloat(ethers.utils.formatEther(selectedLoan.amount.toString()))
      const amount = ethers.utils.parseEther(Math.max(ethAmount, 0.000001).toFixed(6))
      
      await bidMoney(amount)

      // Save bid to backend API
      const bidderAddress = walletAddress
      try {
        await fetch('http://localhost:5001/api/loan/bid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanIndex: Number(selectedLoan.loanId),
            bidBy: bidderAddress,
            bid: interestRate,
          }),
        })
      } catch (backendErr) {
        console.warn('Backend bid save failed (non-critical):', backendErr)
      }

      toast.success('Bid placed successfully!')
      setSelectedLoan(null)
      setInterestRate('')
      fetchBidsFromBackend()
    } catch (err) {
      console.error('Bid failed:', err)
      toast.error('Failed to place bid. Transaction was rejected.')
    } finally {
      setIsBidding(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Loan Marketplace</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Earn interest by funding verified micro-loans. Compete with other lenders by offering the best rates.
            </p>
          </div>
          
          <div className="w-full md:w-auto flex flex-wrap gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by address or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-border/50 h-11"
              />
            </div>
            <Select value={loanTypeFilter} onValueChange={setLoanTypeFilter}>
              <SelectTrigger className="h-11 w-40 bg-background/50 border-border/50">
                <SelectValue placeholder="Loan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="0">Personal</SelectItem>
                <SelectItem value="1">Business</SelectItem>
                <SelectItem value="2">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 w-44 bg-background/50 border-border/50">
                <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Order</SelectItem>
                <SelectItem value="amount-asc">Amount: Low → High</SelectItem>
                <SelectItem value="amount-desc">Amount: High → Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[340px] w-full skeleton" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20 bg-destructive/10 rounded-2xl border border-destructive/20 text-destructive">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Loan Grid */}
        {!isLoading && !error && (
          <>
            {filteredLoans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredLoans.filter(l => l && l.requester !== undefined).map((loan, index) => {
                    const hasPlacedBid = !!walletAddress && (bidsMap[String(loan.loanId)] ?? []).some(
                      (b: any) => b.bidBy?.toLowerCase() === walletAddress.toLowerCase()
                    )
                    return (
                      <motion.div
                        key={Number(loan.loanId) || index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <LoanCard
                          loan={loan}
                          handleBid={handleBid}
                          walletAddress={walletAddress ?? undefined}
                          hasPlacedBid={hasPlacedBid}
                          isConnected={isConnected}
                        />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-32 glass rounded-2xl border-dashed">
                <Gavel className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Loans Found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {searchTerm ? "No pending loans match your search criteria." : "There are currently no loan requests waiting for funding."}
                </p>
              </div>
            )}
          </>
        )}

        {/* Bid Dialog */}
        <Dialog open={!!selectedLoan} onOpenChange={(open) => { if (!open) setSelectedLoan(null) }}>
          <DialogContent className="sm:max-w-[425px] glass border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl">Place Your Bid</DialogTitle>
              <DialogDescription>
                You are committing funds to this loan. The borrower will review all bids and select their preferred interest rate.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              {selectedLoan && (
                <>
                  <div className="bg-background/50 rounded-xl p-4 border border-border/50 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Loan Principal</span>
                    <span className="text-xl font-bold gradient-text">
                      {parseFloat(ethers.utils.formatEther(selectedLoan.amount.toString())).toFixed(4)} ETH
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="interest-rate" className="text-sm">Proposed Interest Rate (%)</Label>
                    <div className="relative">
                      <Input
                        id="interest-rate"
                        type="number"
                        step="0.1"
                        min="0"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="e.g. 5.5"
                        className="bg-background/50 h-12 pr-12 text-lg font-medium"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                        %
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lower interest rates are more likely to be accepted by the borrower.
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedLoan(null)}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={submitBid}
                disabled={
                  !interestRate ||
                  !selectedLoan ||
                  isBidding ||
                  selectedLoan?.requester?.toLowerCase() === walletAddress?.toLowerCase()
                }
                className="h-11 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0"
              >
                {selectedLoan?.requester?.toLowerCase() === walletAddress?.toLowerCase()
                  ? "Can't bid on your own loan"
                  : isBidding ? 'Confirming in Wallet…' : 'Submit Bid'}
                {!isBidding && selectedLoan?.requester?.toLowerCase() !== walletAddress?.toLowerCase() && (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}
