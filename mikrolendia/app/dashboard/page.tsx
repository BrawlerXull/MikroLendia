"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import useLoanContract from "@/lib/hooks/useLoanContract"
import { useAppSelector } from "@/lib/hooks/useAppSelector"
import { ethers } from "ethers"
import {
  Activity,
  Clock,
  CheckCircle2,
  TrendingUp,
  HandCoins,
  ArrowDownRight,
  LayoutDashboard,
  LineChart,
  Gavel,
  ChevronRight,
  Wallet,
  BadgeCheck,
  Users,
  Percent,
} from "lucide-react"

const LOAN_STATUS: Record<number, string> = {
  0: "Pending",
  1: "Active",
  2: "Repaid",
}

const LOAN_TYPE: Record<number, string> = {
  0: "Personal",
  1: "Business",
  2: "Student",
}

// Calculate the next monthly installment using the same formula as the contract
function calcInstallment(loan: any): string {
  try {
    const amount = parseFloat(ethers.utils.formatEther(loan.amount.toString()))
    const amountPaid = parseFloat(ethers.utils.formatEther(loan.amountPaid.toString()))
    const remaining = Math.max(amount - amountPaid, 0)
    const interest = Number(loan.interest)
    const duration = Number(loan.duration)
    if (!duration) return "—"
    const principal = amount / duration
    const interestDue = (remaining * interest) / 100
    return (principal + interestDue).toFixed(6)
  } catch {
    return "—"
  }
}

export default function Dashboard() {
  const { walletAddress } = useAppSelector((state) => state.wallet)
  const {
    loanData,
    userRequestedLoans,
    approveLoan,
    repayLoan,
    fetchUserAllLoans,
    fetchApprovedLoans,
    fetchLenderLoans,
    fetchAllLoans,
    isLoading,
  } = useLoanContract()

  // Backend bids data keyed by loan index
  const [bidsMap, setBidsMap] = useState<Record<string, any[]>>({})
  // The loan whose bids dialog is open
  const [bidDialogLoan, setBidDialogLoan] = useState<any | null>(null)
  const [isAcceptingBid, setIsAcceptingBid] = useState(false)

  const fetchBidsFromBackend = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/api/loan")
      if (!res.ok) return
      const all: any[] = await res.json()
      const map: Record<string, any[]> = {}
      for (const l of all) {
        map[String(l.loanIndex)] = l.bids ?? []
      }
      setBidsMap(map)
    } catch {
      // backend offline — silent
    }
  }, [])

  useEffect(() => {
    if (walletAddress) {
      fetchAllLoans()
      fetchUserAllLoans()
      fetchApprovedLoans()
      fetchLenderLoans()
      fetchBidsFromBackend()
    }
  }, [walletAddress])

  // --- helpers ---
  const convertToDate = (time: number) => {
    if (!time || time === 0) return "N/A"
    return new Date(Number(time) * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatEth = (bn: any) => {
    try {
      return parseFloat(ethers.utils.formatEther(bn.toString())).toFixed(4)
    } catch {
      return "0.0000"
    }
  }

  const repayProgress = (loan: any): number => {
    try {
      const total = parseFloat(ethers.utils.formatEther(loan.amount.toString()))
      const paid = parseFloat(ethers.utils.formatEther(loan.amountPaid.toString()))
      if (!total) return 0
      return Math.min(Math.round((paid / total) * 100), 100)
    } catch {
      return 0
    }
  }

  const handleRepay = async (loan: any) => {
    try {
      // Compute installment in wei using BigNumber to avoid JS Number precision loss
      const amountBN = ethers.BigNumber.from(loan.amount.toString())
      const amountPaidBN = ethers.BigNumber.from(loan.amountPaid.toString())
      const remaining = amountBN.sub(amountPaidBN).lt(0)
        ? ethers.BigNumber.from(0)
        : amountBN.sub(amountPaidBN)
      const durationBN = ethers.BigNumber.from(loan.duration.toString())
      const interestBN = ethers.BigNumber.from(loan.interest.toString())
      const principal = amountBN.div(durationBN)
      const interestDue = remaining.mul(interestBN).div(100)
      const installment = principal.add(interestDue)
      await repayLoan(Number(loan.loanId), installment)
      await fetchAllLoans()
    } catch (err) {
      console.error(err)
      toast.error("Failed to repay loan.")
    }
  }

  const handleAcceptBid = async (loan: any, bid: any, bidIndex: number) => {
    setIsAcceptingBid(true)
    try {
      const allBids: any[] = bidsMap[String(loan.loanId)] ?? []

      // Only pass valid 0x addresses — empty/undefined bidBy causes ENS resolution error
      const isValidAddr = (a: any) => typeof a === 'string' && ethers.utils.isAddress(a)

      if (!isValidAddr(bid.bidBy)) {
        toast.error('This bid has an invalid lender address. The bid may have been placed before the wallet was fully connected.')
        setIsAcceptingBid(false)
        return
      }

      const allBidderAddresses = allBids
        .map((b: any) => b.bidBy)
        .filter(isValidAddr)

      await approveLoan(
        Number(loan.loanId),
        loan,
        Number(bid.interest),
        bid.bidBy,
        allBidderAddresses,
        bidIndex
      )
      setBidDialogLoan(null)
      await fetchUserAllLoans()
      await fetchLenderLoans()
      await fetchBidsFromBackend()
    } catch (err) {
      console.error(err)
    } finally {
      setIsAcceptingBid(false)
    }
  }

  // Segment loans into buckets — always read from loanData (getAllLoans) so
  // amountPaid, status, and dueDate reflect the live on-chain state, not the
  // stale snapshots stored in UserApprovedLoans / UserPaidLoans mappings.
  const addr = walletAddress?.toLowerCase() ?? ''
  const pendingLoans = userRequestedLoans.filter((l: any) => Number(l.status) === 0)
  const activeLoans = loanData.filter(
    (l: any) => l.requester?.toLowerCase() === addr && Number(l.status) === 1
  )
  const repaidLoans = loanData.filter(
    (l: any) => l.requester?.toLowerCase() === addr && Number(l.status) === 2
  )
  const lenderLoans = loanData.filter(
    (l: any) => l.granter?.toLowerCase() === addr && Number(l.status) >= 1
  )

  // Stats
  const totalBorrowed = [...pendingLoans, ...activeLoans, ...repaidLoans].reduce(
    (acc, l: any) => acc + (parseFloat(formatEth(l.amount)) || 0), 0
  )
  const totalLent = lenderLoans.reduce(
    (acc: number, l: any) => acc + (parseFloat(formatEth(l.amount)) || 0), 0
  )

  // Bids the current user has placed — scan the bidsMap
  const myPlacedBids = Object.entries(bidsMap).flatMap(([loanIndex, bids]) =>
    (bids || [])
      .filter((b: any) => b.bidBy?.toLowerCase() === walletAddress?.toLowerCase())
      .map((b: any) => ({ ...b, loanIndex }))
  )

  if (!walletAddress) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <LayoutDashboard className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Please connect your MetaMask wallet to view your financial dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your loans, track repayments, and monitor your lending portfolio.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <Card className="glass border-border/50 stat-card">
            <CardHeader className="pb-2">
              <CardDescription className="font-medium flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-emerald-400" /> Total Borrowed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black gradient-text">{totalBorrowed.toFixed(4)} ETH</div>
              <p className="text-xs text-muted-foreground mt-2">
                {userRequestedLoans.length} loan request{userRequestedLoans.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 stat-card">
            <CardHeader className="pb-2">
              <CardDescription className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Total Lent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black gradient-text">{totalLent.toFixed(4)} ETH</div>
              <p className="text-xs text-muted-foreground mt-2">
                {lenderLoans.length} active investment{lenderLoans.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 stat-card">
            <CardHeader className="pb-2">
              <CardDescription className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400" /> Pending Bids
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{myPlacedBids.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting borrower acceptance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="my-loans" className="space-y-8">
          <div className="flex justify-between items-center border-b border-border/50 pb-px">
            <TabsList className="bg-transparent h-12 p-0 space-x-6">
              <TabsTrigger
                value="my-loans"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 font-semibold text-lg"
              >
                My Loans
                {pendingLoans.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/20">
                    {pendingLoans.length} Pending
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="lending"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 font-semibold text-lg"
              >
                Lending
                {lenderLoans.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                    {lenderLoans.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="bids"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 font-semibold text-lg"
              >
                My Bids
                {myPlacedBids.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                    {myPlacedBids.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* MY LOANS TAB */}
          <TabsContent value="my-loans" className="focus-visible:ring-0 space-y-10">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="h-56 skeleton" />
                <div className="h-56 skeleton" />
              </div>
            ) : (
              <>
                {/* Pending Loans */}
                {pendingLoans.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-amber-400" />
                      Awaiting Funding
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        — choose the best bid to fund your loan
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {pendingLoans.map((loan: any, i: number) => {
                        const bids: any[] = bidsMap[String(loan.loanId)] ?? []
                        return (
                          <Card key={i} className="glass border-amber-500/20 overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-400" />
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="outline" className="mb-2 bg-amber-500/10 text-amber-400 border-amber-500/20">
                                    {LOAN_TYPE[Number(loan.typeOfLoan)]}
                                  </Badge>
                                  <CardTitle className="text-lg">{loan.description}</CardTitle>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                  <div className="text-2xl font-black gradient-text">{formatEth(loan.amount)}</div>
                                  <div className="text-xs font-bold text-muted-foreground">ETH</div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/50">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" /> {Number(loan.duration)} Months
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5" />
                                  <span className={bids.length > 0 ? "text-emerald-400 font-semibold" : ""}>
                                    {bids.length} Bid{bids.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                                  <Activity className="w-3 h-3 mr-1 animate-pulse" /> Pending
                                </Badge>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-5">
                              <Button
                                className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0"
                                onClick={() => setBidDialogLoan(loan)}
                                disabled={bids.length === 0}
                              >
                                <Gavel className="h-4 w-4" />
                                {bids.length === 0 ? "No Bids Yet" : `Review ${bids.length} Bid${bids.length !== 1 ? "s" : ""}`}
                                {bids.length > 0 && <ChevronRight className="h-4 w-4 ml-auto" />}
                              </Button>
                            </CardFooter>
                          </Card>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Active Loans */}
                {activeLoans.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Active Loans
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {activeLoans.map((loan: any, i: number) => {
                        const progress = repayProgress(loan)
                        const installment = calcInstallment(loan)
                        return (
                          <Card key={i} className="glass border-primary/30 glow-indigo overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-teal-400" />
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="outline" className="mb-2 bg-background/50 border-border/50">
                                    {LOAN_TYPE[Number(loan.typeOfLoan)]}
                                  </Badge>
                                  <CardTitle className="text-lg">{loan.description}</CardTitle>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                  <div className="text-2xl font-black gradient-text">{formatEth(loan.amount)}</div>
                                  <div className="text-xs font-bold text-muted-foreground">ETH</div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-3">
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/50">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" /> {Number(loan.duration)} Months
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Percent className="h-3.5 w-3.5" /> {Number(loan.interest)}% Interest
                                </div>
                                {loan.dueDate && (
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    Due: {convertToDate(Number(loan.dueDate))}
                                  </div>
                                )}
                              </div>

                              {/* Repayment Progress */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Repayment Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{formatEth(loan.amountPaid)} ETH paid</span>
                                  <span>{formatEth(loan.amount)} ETH total</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-5 gap-2 flex-col sm:flex-row">
                              <div className="w-full sm:w-auto flex-1 bg-background/50 border border-border/50 rounded-lg px-4 py-2 text-sm">
                                <span className="text-muted-foreground">Next installment: </span>
                                <span className="font-bold gradient-text">{installment} ETH</span>
                              </div>
                              <Button
                                className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                onClick={() => handleRepay(loan)}
                              >
                                Repay Installment
                              </Button>
                            </CardFooter>
                          </Card>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Repaid Loans */}
                {repaidLoans.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-400" />
                      Fully Repaid
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {repaidLoans.map((loan: any, i: number) => (
                        <Card key={i} className="glass border-emerald-500/20 opacity-80">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <Badge variant="outline" className="mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  Completed
                                </Badge>
                                <CardTitle className="text-lg">{loan.description}</CardTitle>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <div className="text-2xl font-black text-emerald-400">{formatEth(loan.amount)}</div>
                                <div className="text-xs font-bold text-muted-foreground">ETH</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                              <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-right">Fully repaid</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty state */}
                {pendingLoans.length === 0 && activeLoans.length === 0 && repaidLoans.length === 0 && (
                  <EmptyState
                    icon={HandCoins}
                    title="No loans yet"
                    desc="You haven't requested any loans on LendLedger yet."
                    action={{ label: "Request a Loan", href: "/request-loan" }}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* LENDING TAB */}
          <TabsContent value="lending" className="focus-visible:ring-0">
            {lenderLoans.length === 0 ? (
              <EmptyState
                icon={LineChart}
                title="No active investments"
                desc="You haven't funded any loans yet. Browse the marketplace, place a bid, and the borrower will accept the best offer."
                action={{ label: "Browse Marketplace", href: "/bidding" }}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {lenderLoans.map((loan: any, i: number) => {
                  const progress = repayProgress(loan)
                  return (
                    <Card key={i} className="glass border-primary/20">
                      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-teal-400" />
                      <CardHeader className="pb-4 border-b border-border/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <Badge variant="outline" className="mb-1 bg-background/50 border-border/50 text-xs">
                              {LOAN_TYPE[Number(loan.typeOfLoan)]}
                            </Badge>
                            <CardTitle className="text-lg">Loan #{Number(loan.loanId)}</CardTitle>
                          </div>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {Number(loan.status) === 2 ? "Repaid" : "Active"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-5 space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Principal</span>
                          <span className="font-bold text-lg gradient-text">{formatEth(loan.amount)} ETH</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <span className="text-muted-foreground">Borrower</span>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {loan.requester?.slice(0, 6)}...{loan.requester?.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <span className="text-muted-foreground">Interest Rate</span>
                          <span className="font-semibold text-primary">{Number(loan.interest)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Maturity</span>
                          <span className="font-medium">{convertToDate(Number(loan.dueDate))}</span>
                        </div>

                        {/* Repayment progress */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Repayment received</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* MY BIDS TAB */}
          <TabsContent value="bids" className="focus-visible:ring-0">
            {myPlacedBids.length === 0 ? (
              <EmptyState
                icon={Gavel}
                title="No bids placed"
                desc="You haven't bid on any loans yet. Browse the marketplace to find opportunities and offer competitive interest rates."
                action={{ label: "Browse Marketplace", href: "/bidding" }}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {myPlacedBids.map((bid: any, i: number) => (
                  <Card key={i} className="glass border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Loan #{bid.loanIndex}</CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            bid.status === "pending"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }
                        >
                          {bid.status === "pending" ? (
                            <><Activity className="w-3 h-3 mr-1 animate-pulse" /> Pending</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-border/50">
                        <span className="text-muted-foreground">Your Interest Offer</span>
                        <span className="font-bold text-lg text-primary">{bid.interest}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Bid placed</span>
                        <span className="text-xs">{new Date(bid.bidAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Bid Review Dialog */}
      <Dialog open={!!bidDialogLoan} onOpenChange={(open) => { if (!open) setBidDialogLoan(null) }}>
        <DialogContent className="sm:max-w-lg glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" /> Review Bids
            </DialogTitle>
            <DialogDescription>
              Select the best interest rate offer. The winning lender funds your loan immediately and other bidders are refunded.
            </DialogDescription>
          </DialogHeader>

          {bidDialogLoan && (
            <div className="py-2 space-y-5">
              {/* Loan summary */}
              <div className="bg-background/50 rounded-xl p-4 border border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Loan Amount</p>
                  <span className="text-2xl font-black gradient-text">
                    {formatEth(bidDialogLoan.amount)} ETH
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                  <span className="font-semibold">{Number(bidDialogLoan.duration)} Months</span>
                </div>
              </div>

              {/* Bid list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(bidsMap[String(bidDialogLoan.loanId)] ?? []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No bids yet.</p>
                ) : (
                  [...(bidsMap[String(bidDialogLoan.loanId)] ?? [])]
                    .sort((a, b) => a.interest - b.interest)
                    .map((bid: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          idx === 0
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-border/50 bg-background/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {idx === 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-xs shrink-0">
                              Best
                            </Badge>
                          )}
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">
                              {bid.bidBy?.slice(0, 8)}...{bid.bidBy?.slice(-6)}
                            </p>
                            <p className="text-xl font-black gradient-text leading-none mt-0.5">
                              {bid.interest}%
                            </p>
                            <p className="text-xs text-muted-foreground">interest rate</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-indigo-500 to-teal-400 text-white border-0 rounded-lg"
                          disabled={isAcceptingBid}
                          onClick={() => handleAcceptBid(
                            bidDialogLoan,
                            bid,
                            (bidsMap[String(bidDialogLoan.loanId)] ?? []).indexOf(bid)
                          )}
                        >
                          {isAcceptingBid ? "Confirming…" : "Accept"}
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBidDialogLoan(null)} className="h-11">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: number }) {
  if (status === 0)
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
        <Activity className="w-3 h-3 mr-1 animate-pulse" /> Pending Bids
      </Badge>
    )
  if (status === 1)
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
      </Badge>
    )
  if (status === 2)
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Repaid
      </Badge>
    )
  return null
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: any
  title: string
  desc: string
  action: { label: string; href: string }
}) {
  return (
    <div className="text-center py-24 glass rounded-3xl border-dashed">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">{desc}</p>
      <Button
        asChild
        className="bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 rounded-xl"
      >
        <a href={action.href}>{action.label}</a>
      </Button>
    </div>
  )
}
