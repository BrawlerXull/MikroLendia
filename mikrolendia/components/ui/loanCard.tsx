import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardFooter, CardHeader } from "./card"
import { Badge } from "./badge"
import useUserContract from "@/lib/hooks/useUserContract"
import { Button } from "./button"
import { Loan } from "@/types/type"
import { Gavel, MapPin, Briefcase, Clock, FileText, Users, CheckCircle2, Wallet } from "lucide-react"

export function LoanCard({
  loan,
  handleBid,
  walletAddress,
  hasPlacedBid = false,
  isConnected = false,
}: {
  loan: any
  handleBid: (loan: Loan) => void
  walletAddress?: string
  hasPlacedBid?: boolean
  isConnected?: boolean
}) {
  const { userDetails, fetchUserDetails } = useUserContract()
  const [bidCount, setBidCount] = useState<number | null>(null)

  useEffect(() => {
    fetchUserDetails(loan.requester)
  }, [loan.requester])

  useEffect(() => {
    const fetchBidCount = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/loan')
        if (!res.ok) return
        const allLoans = await res.json()
        const match = allLoans.find((l: any) => Number(l.loanIndex) === Number(loan.loanId))
        if (match) setBidCount(match.bidCount ?? 0)
      } catch {
        // backend unavailable — skip
      }
    }
    fetchBidCount()
  }, [loan.loanId])

  // Format amount from wei to ETH
  let ethAmount = '0'
  try {
    ethAmount = parseFloat(ethers.utils.formatEther(loan.amount.toString())).toFixed(4)
  } catch {
    ethAmount = String(loan.amount)
  }

  const loanTypes = { 0: "Personal", 1: "Business", 2: "Student" }

  const isOwnLoan =
    !!walletAddress &&
    loan.requester?.toLowerCase() === walletAddress.toLowerCase()

  // Derive button appearance from context
  const getBidButton = () => {
    if (isOwnLoan) {
      return (
        <Button
          disabled
          className="w-full bg-muted/50 text-muted-foreground border-0 cursor-not-allowed opacity-70"
        >
          Your Loan
        </Button>
      )
    }
    if (!isConnected) {
      return (
        <Button
          disabled
          className="w-full bg-muted/50 text-muted-foreground border-0 cursor-not-allowed opacity-70"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet to Bid
        </Button>
      )
    }
    if (hasPlacedBid) {
      return (
        <Button
          disabled
          className="w-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Bid Placed
        </Button>
      )
    }
    return (
      <Button
        onClick={() => handleBid(loan)}
        className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white border-0 transition-colors"
      >
        <Gavel className="h-4 w-4 mr-2" />
        Place Bid
      </Button>
    )
  }

  return (
    <Card className={`glass relative overflow-hidden group flex flex-col h-full transition-all duration-300 ${
      isOwnLoan
        ? 'border-amber-500/30'
        : hasPlacedBid
        ? 'border-emerald-500/30'
        : 'border-border/50 hover:border-primary/50'
    }`}>
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-primary/20" />

      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium tracking-wide">
              {loanTypes[loan.typeOfLoan as keyof typeof loanTypes]} Loan
            </Badge>
            {isOwnLoan && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                Your Loan
              </Badge>
            )}
            {hasPlacedBid && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Bid Placed
              </Badge>
            )}
          </div>
          <div className="text-right shrink-0 ml-2">
            <div className="text-2xl font-black gradient-text leading-none">{ethAmount} ETH</div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50">
          <h3 className="font-semibold text-lg text-foreground truncate mt-2">
            {userDetails?.name || "Anonymous Borrower"}
          </h3>
          <p className="font-mono text-xs text-muted-foreground truncate">
            {loan.requester.slice(0, 8)}...{loan.requester.slice(-6)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="truncate">{userDetails?.city || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="truncate capitalize">{userDetails?.profession || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 text-primary/70" />
            <span>{Number(loan.duration)} Months</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 shrink-0 text-primary/70" />
            <span>Rating: {Number(userDetails?.strikes) === 0 ? 'A+' : 'B'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-primary/70" />
            <span>{bidCount !== null ? `${bidCount} Bid${bidCount !== 1 ? 's' : ''}` : '— Bids'}</span>
          </div>
        </div>

        <div className="bg-background/50 rounded-lg p-3 text-sm leading-relaxed border border-border/50 text-muted-foreground">
          <span className="text-foreground font-medium block mb-1">Purpose:</span>
          {loan.description.length > 80
            ? `${loan.description.substring(0, 80)}...`
            : loan.description}
        </div>
      </CardContent>

      <CardFooter className="pt-4 mt-auto">
        {getBidButton()}
      </CardFooter>
    </Card>
  )
}
