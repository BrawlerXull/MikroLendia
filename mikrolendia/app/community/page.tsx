'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LoanRequest } from '@/types/type'
import CommunityCard from '@/components/community-card'
import { ethers } from 'ethers'
import CommunityABI from "../../lib/contract/config/CommunityAbi.json"
import useCommunityFactory from '@/lib/hooks/useCommunityFactoryContract'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { loanContractAddress } from '@/lib/contract/contract'
import { Users, Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function Community() {
  const [activeTab, setActiveTab] = useState('all')
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([])
  const [newCommunityName, setNewCommunityName] = useState('')
  const [newCommunityInterestRate, setNewCommunityInterestRate] = useState('')
  const [newCommunityRequiredSignatures, setNewCommunityRequiredSignatures] = useState('')
  const [showNewCommunityDialog, setShowNewCommunityDialog] = useState(false)
  const [owners, setOwners] = useState<[string]>([''])
  const { deployCommunity, allCommunities, userCommunities } = useCommunityFactory()
  const { walletAddress, isConnected } = useAppSelector(state => state.wallet)

  // Non-owners can still submit a loan request to a community through the manage dialog
  const handleJoin = () => {
    toast.info("Select a community and use 'Request Loan from Pool' to submit a funding request.")
  }

  const handleOwnerChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newOwners = [...owners] as [string]
    newOwners[index] = event.target.value
    setOwners(newOwners)
  }

  const addOwnerField = () => {
    setOwners([...owners, ""] as any)
  }

  const handleCreateCommunity = async () => {
    if (!newCommunityName || !newCommunityInterestRate || !newCommunityRequiredSignatures || !owners[0]) {
      toast.error('Please fill in all fields.')
      return
    }
    try {
      const initData = new ethers.utils.Interface(CommunityABI.abi || CommunityABI).encodeFunctionData("initialize", [
        owners, 
        newCommunityRequiredSignatures, 
        newCommunityName, 
        newCommunityInterestRate, 
        loanContractAddress
      ])
      await deployCommunity(initData, owners, newCommunityName)
      toast.success('Community creation tx sent!')
      setShowNewCommunityDialog(false)
    }
    catch (err: any) {
      console.error(err)
      toast.error('Failed to create community.')
    }
  }

  const handleApproveLoan = (loanId: number) => {
    setLoanRequests(loanRequests.map(loan =>
      Number(loan._id) === loanId ? { ...loan, approvals: (loan as any).approvals + 1, totalVotes: (loan as any).totalVotes + 1 } : loan
    ))
  }

  const filteredCommunities = activeTab === 'all' ? allCommunities : userCommunities

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Lending Communities</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Join or create multi-signature lending pools. Pool your capital with trusted peers to fund larger loans safely.
            </p>
          </div>
          <Button 
            onClick={() => {
              if(!isConnected) {
                toast.error("Please connect your wallet first.")
                return
              }
              setShowNewCommunityDialog(true)
            }} 
            className="shrink-0 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 rounded-xl glow-accent h-11"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Community
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="border-b border-border/50 pb-px mb-8">
            <TabsList className="bg-transparent h-12 p-0 space-x-6">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 font-semibold text-lg"
              >
                Explore Communities
              </TabsTrigger>
              <TabsTrigger 
                value="joined" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 font-semibold text-lg"
              >
                My Communities
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="focus-visible:ring-0">
            {filteredCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunities.map((community, index) => (
                  <CommunityCard
                    owners={community.owners}
                    key={index}
                    community={community}
                    walletAddress={walletAddress || ""}
                    onJoin={handleJoin}
                    loanRequests={loanRequests}
                    onApproveLoan={handleApproveLoan}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="joined" className="focus-visible:ring-0">
            {!isConnected ? (
               <div className="text-center py-20 glass rounded-3xl border-dashed">
                 <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                 <h3 className="text-xl font-bold mb-2">Connect Wallet Required</h3>
                 <p className="text-muted-foreground">Please connect your wallet to view your joined communities.</p>
               </div>
            ) : filteredCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCommunities.map((community, index) => (
                  <CommunityCard
                    owners={community.owners}
                    key={index}
                    community={community}
                    walletAddress={walletAddress || ""}
                    onJoin={handleJoin}
                    loanRequests={loanRequests}
                    onApproveLoan={handleApproveLoan}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 glass rounded-3xl border-dashed">
                 <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                 <h3 className="text-xl font-bold mb-2">No joined communities</h3>
                 <p className="text-muted-foreground">You haven't joined any communities. Explore the 'All Communities' tab to find one.</p>
               </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Community Dialog */}
        <Dialog open={showNewCommunityDialog} onOpenChange={setShowNewCommunityDialog}>
          <DialogContent className="sm:max-w-[425px] glass border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create Community</DialogTitle>
              <DialogDescription>
                Deploy a new smart contract for a multi-signature lending pool.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="community-name">Community Name</Label>
                <Input
                  id="community-name"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="e.g. Creator Fund"
                  className="bg-background/50 h-11"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Founding Members (Owners)</Label>
                  <Button variant="outline" size="sm" onClick={addOwnerField} className="h-8 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Owner
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {owners.map((owner, index) => (
                    <Input
                      key={index}
                      placeholder={`0x... (Owner ${index + 1})`}
                      value={owner}
                      onChange={(e) => handleOwnerChange(index, e)}
                      className="bg-background/50 h-10 font-mono text-xs"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Fixed Interest (%)</Label>
                  <Input
                    id="interest-rate"
                    type="number"
                    value={newCommunityInterestRate}
                    onChange={(e) => setNewCommunityInterestRate(e.target.value)}
                    placeholder="5"
                    className="bg-background/50 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="required-sigs">Required Signatures</Label>
                  <Input
                    id="required-sigs"
                    type="number"
                    value={newCommunityRequiredSignatures}
                    onChange={(e) => setNewCommunityRequiredSignatures(e.target.value)}
                    placeholder="e.g. 2"
                    className="bg-background/50 h-11"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCommunityDialog(false)} className="h-11">
                Cancel
              </Button>
              <Button onClick={handleCreateCommunity} className="h-11 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0">
                Deploy Contract
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-24 glass rounded-3xl border-dashed">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold mb-3">No communities yet</h3>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        There are currently no lending communities on the network. Be the first to create one!
      </p>
    </div>
  )
}