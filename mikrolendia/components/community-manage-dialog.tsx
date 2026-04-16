'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import useCommunity from '@/lib/hooks/useCommunityContract'
import { LoanRequest } from '@/types/type'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Coins,
  PenLine,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
  Wallet,
  Loader2,
  FileText,
} from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityAddress: string
  walletAddress: string
  isOwner: boolean
  defaultTab?: 'requests' | 'fund' | 'request'
}

export function CommunityManageDialog({
  open,
  onOpenChange,
  communityAddress,
  walletAddress,
  isOwner,
  defaultTab = 'requests',
}: Props) {
  const {
    owners,
    requiredSignatures,
    balance,
    interestRate,
    loanRequests,
    addFunds,
    addLoanRequest,
    signTransaction,
    approveLoan,
    fetchLoans,
    fetchBalance,
  } = useCommunity(communityAddress)

  const [fundAmount, setFundAmount] = useState('')
  const [reqAmount, setReqAmount] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [isFunding, setIsFunding] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [signingId, setSigningId] = useState<string | null>(null)
  const [executingId, setExecutingId] = useState<string | null>(null)

  // Refresh data whenever dialog opens
  useEffect(() => {
    if (open) {
      fetchLoans()
      fetchBalance()
    }
  }, [open])

  const handleFund = async () => {
    const amt = parseFloat(fundAmount)
    if (!amt || amt <= 0) return
    setIsFunding(true)
    try {
      await addFunds(amt)
      setFundAmount('')
    } finally {
      setIsFunding(false)
    }
  }

  const handleRequest = async () => {
    const amt = parseFloat(reqAmount)
    if (!amt || amt <= 0 || !reqReason.trim()) return
    setIsRequesting(true)
    try {
      await addLoanRequest(amt, reqReason.trim())
      setReqAmount('')
      setReqReason('')
    } finally {
      setIsRequesting(false)
    }
  }

  const handleSign = async (txn: LoanRequest) => {
    setSigningId(txn._id)
    try {
      await signTransaction(txn)
    } finally {
      setSigningId(null)
    }
  }

  const handleExecute = async (txn: LoanRequest) => {
    setExecutingId(txn._id)
    try {
      await approveLoan(txn)
    } finally {
      setExecutingId(null)
    }
  }

  // Helpers
  const hasSigned = (txn: LoanRequest) =>
    txn.signatures.some(
      s => s.address?.toLowerCase() === walletAddress?.toLowerCase()
    )

  const canExecute = (txn: LoanRequest) =>
    txn.signatures.length >= requiredSignatures && !txn.executed

  const balanceEth = (() => {
    try {
      return parseFloat(ethers.utils.formatEther(balance)).toFixed(4)
    } catch {
      return '0.0000'
    }
  })()

  const pending = loanRequests.filter(t => !t.executed)
  const completed = loanRequests.filter(t => t.executed)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl glass border-border/50 max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Community Dashboard
          </DialogTitle>
          <DialogDescription className="font-mono text-xs truncate">
            {communityAddress}
          </DialogDescription>
        </DialogHeader>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pool Balance', value: `${balanceEth} ETH`, accent: true },
            { label: 'Fixed Rate', value: `${interestRate}%` },
            { label: 'Required Sigs', value: `${requiredSignatures} / ${owners.length}` },
          ].map(s => (
            <div
              key={s.label}
              className="bg-background/50 border border-border/50 rounded-xl p-3 text-center"
            >
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-bold text-sm ${s.accent ? 'gradient-text' : ''}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="mt-1">
          <TabsList className="bg-muted/50 h-10 w-full rounded-xl p-1">
            <TabsTrigger value="requests" className="flex-1 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Requests
              {pending.length > 0 && (
                <Badge className="ml-1.5 bg-primary/20 text-primary border-0 text-xs h-4 px-1.5">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fund" className="flex-1 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Fund Pool
            </TabsTrigger>
            <TabsTrigger value="request" className="flex-1 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              New Request
            </TabsTrigger>
          </TabsList>

          {/* ── REQUESTS TAB ── */}
          <TabsContent value="requests" className="mt-4 focus-visible:ring-0 space-y-3">
            {pending.length === 0 && completed.length === 0 ? (
              <div className="text-center py-10 glass rounded-2xl border-dashed">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No loan requests yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Members can request ETH from the pool using the "New Request" tab.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {[...pending, ...completed].map((txn, i) => {
                  const signed = hasSigned(txn)
                  const executable = canExecute(txn)
                  const sigProgress = `${txn.signatures.length} / ${requiredSignatures}`

                  return (
                    <motion.div
                      key={txn._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`rounded-xl border p-4 space-y-3 transition-all ${
                        txn.executed
                          ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70'
                          : executable
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border/50 bg-background/30'
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{txn.reason}</p>
                          <p className="font-mono text-xs text-muted-foreground truncate">
                            To: {txn.to?.slice(0, 8)}...{txn.to?.slice(-6)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black gradient-text text-lg leading-none">{txn.amount} ETH</p>
                          {txn.executed ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs mt-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Executed
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs mt-1">
                              <Clock className="h-3 w-3 mr-1 animate-pulse" /> Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Signature progress */}
                      {!txn.executed && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Signatures collected</span>
                            <span className={executable ? 'text-emerald-400 font-semibold' : ''}>
                              {sigProgress}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                executable
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                  : 'bg-gradient-to-r from-indigo-500 to-primary'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (txn.signatures.length / Math.max(requiredSignatures, 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Signed-by chips */}
                      {!txn.executed && txn.signatures.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {txn.signatures.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono"
                            >
                              {s.address?.slice(0, 6)}…{s.address?.slice(-4)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      {!txn.executed && isOwner && (
                        <div className="flex gap-2 pt-1">
                          {!signed && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs border-primary/30 text-primary hover:bg-primary hover:text-white"
                              disabled={signingId === txn._id}
                              onClick={() => handleSign(txn)}
                            >
                              {signingId === txn._id ? (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Signing…</>
                              ) : (
                                <><PenLine className="h-3 w-3 mr-1" /> Sign</>
                              )}
                            </Button>
                          )}
                          {signed && !executable && (
                            <div className="flex-1 h-8 flex items-center justify-center text-xs text-emerald-400 gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> You signed
                            </div>
                          )}
                          {executable && (
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs bg-gradient-to-r from-indigo-500 to-teal-400 text-white border-0"
                              disabled={executingId === txn._id}
                              onClick={() => handleExecute(txn)}
                            >
                              {executingId === txn._id ? (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Executing…</>
                              ) : (
                                <><ArrowRight className="h-3 w-3 mr-1" /> Execute & Send Funds</>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* ── FUND POOL TAB ── */}
          <TabsContent value="fund" className="mt-4 focus-visible:ring-0">
            <div className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Add ETH to pool</p>
                  <p className="text-xs text-muted-foreground">
                    Current balance: <span className="font-mono font-medium text-foreground">{balanceEth} ETH</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fund-amount">Amount (ETH)</Label>
                <div className="relative">
                  <Input
                    id="fund-amount"
                    type="number"
                    step="0.01"
                    min="0.001"
                    placeholder="0.5"
                    value={fundAmount}
                    onChange={e => setFundAmount(e.target.value)}
                    className="bg-background/50 h-12 pr-14 text-lg font-medium"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                    ETH
                  </span>
                </div>
              </div>

              <Button
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 rounded-xl"
                disabled={isFunding || !fundAmount || parseFloat(fundAmount) <= 0}
                onClick={handleFund}
              >
                {isFunding ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirming in Wallet…</>
                ) : (
                  <><Coins className="h-4 w-4 mr-2" /> Fund Pool</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ── NEW REQUEST TAB ── */}
          <TabsContent value="request" className="mt-4 focus-visible:ring-0">
            <div className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold">Request ETH from pool</p>
                  <p className="text-xs text-muted-foreground">
                    Funds will be sent to your wallet after {requiredSignatures} owner signature{requiredSignatures !== 1 ? 's' : ''}.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="req-amount">Amount (ETH)</Label>
                <div className="relative">
                  <Input
                    id="req-amount"
                    type="number"
                    step="0.01"
                    min="0.001"
                    placeholder="0.1"
                    value={reqAmount}
                    onChange={e => setReqAmount(e.target.value)}
                    className="bg-background/50 h-12 pr-14 text-lg font-medium"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                    ETH
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="req-reason">Purpose / Reason</Label>
                <Textarea
                  id="req-reason"
                  placeholder="Explain why you need these funds…"
                  value={reqReason}
                  onChange={e => setReqReason(e.target.value)}
                  className="bg-background/50 min-h-[90px] resize-none"
                />
              </div>

              <Button
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white border-0 rounded-xl"
                disabled={isRequesting || !reqAmount || parseFloat(reqAmount) <= 0 || !reqReason.trim()}
                onClick={handleRequest}
              >
                {isRequesting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                ) : (
                  <>Submit Loan Request<ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
