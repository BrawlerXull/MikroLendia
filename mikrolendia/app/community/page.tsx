'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Community, LoanRequest } from '@/types/type'
import CommunityCard from '@/components/community-card'
import { ethers } from 'ethers'
import CommunityABI from "../../lib/contract/config/CommunityAbi.json"
import useCommunityFactory from '@/lib/hooks/useCommunityFactoryContract'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { loanContractAddress } from '@/lib/contract/contract'



export default function Community() {
  const [activeTab, setActiveTab] = useState('all')
  const [communities, setCommunities] = useState<Community[]>([])
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([])
  const [newCommunityName, setNewCommunityName] = useState('')
  const [newCommunityDescription, setNewCommunityDescription] = useState('')
  const [newCommunityInterestRate, setNewCommunityInterestRate] = useState('')
  const [newCommunityRequiredSignatures, setNewCommunityRequiredSignatures] = useState('')
  const [showNewCommunityDialog, setShowNewCommunityDialog] = useState(false)
  const [owners, setOwners]=useState<[string]>([''])
  const joinedCommunities = communities.filter(c => c.joined)
const {deployCommunity, allCommunities, userCommunities}=useCommunityFactory()
const {walletAddress}=useAppSelector(state=>state.wallet)
useEffect(()=>{
  console.log(allCommunities)
}, [allCommunities])
  const handleJoin = (communityId: number) => {
    // setCommunities(communities.map(c => 
    //   c.id === communityId ? { ...c, joined: true } : c
    // ))
  }
  const handleOwnerChange = (index:  number, event: { target: { value: any } }) => {
    const newOwners = [...owners];
    newOwners[index] = event.target.value;
    setOwners(newOwners);
  };
  const addOwnerField = () => {
    setOwners([...owners, ""]);
  };
  const handleCreateCommunity = async() => {
    try{
      const initData=new ethers.utils.Interface(CommunityABI).encodeFunctionData("initialize", [owners, newCommunityRequiredSignatures, newCommunityName, newCommunityInterestRate, loanContractAddress]);
      await deployCommunity(initData, owners, newCommunityName)
    }
    catch(err: any){
      console.log(err)
    };
  }

  const handleApproveLoan = (loanId: number) => {
    setLoanRequests(loanRequests.map(loan =>
      loan.id === loanId ? { ...loan, approvals: loan.approvals + 1, totalVotes: loan.totalVotes + 1 } : loan
    ))
  }

  const filteredCommunities = activeTab === 'all' ? allCommunities : userCommunities

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Communities</h1>
        <Button onClick={() => setShowNewCommunityDialog(true)}>Create Community</Button>
      </div>
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Communities</TabsTrigger>
          <TabsTrigger value="joined">Joined Communities</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community, index) => (
              <CommunityCard
              owners={community.owners}
                key={index} 
                community={community} 
                walletAddress={walletAddress?walletAddress:""}
                onJoin={handleJoin} 
                loanRequests={loanRequests}
                onApproveLoan={handleApproveLoan}
                
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="joined">
          {filteredCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCommunities.map((community, index) => (
                <CommunityCard 
                owners={community.owners}
                key={index} 
                community={community} 
                walletAddress={walletAddress?walletAddress:""}
                  onJoin={handleJoin} 
                  onLoanRequest={handleLoanRequest}
                  onApproveLoan={handleApproveLoan}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">You haven&#39;t joined any communities yet.</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showNewCommunityDialog} onOpenChange={setShowNewCommunityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>Fill out the details to create a new community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="community-name">Community Name</Label>
              <Input
                id="community-name"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                placeholder="Enter community name"
              />
            </div>
            
              <Label htmlFor="community-owners">Community Owners</Label>
            {owners.map((owner, index) => (
              <div key={index} id="community-owners">

                <Input
                  id={`${index}`}
                  type="text"
                  placeholder={`Owner ${index + 1} Address`}
                  value={owner}
                  onChange={(e) => handleOwnerChange(index, e)}
                  />
                  </div>
              ))}
              <Button onClick={addOwnerField} className={"w-full "}>
                Add Owner
              </Button>
            <div>
              <Label htmlFor="community-interest-rate">Fixed Loan Interest Rate (%)</Label>
              <Input
                id="community-interest-rate"
                type="number"
                value={newCommunityInterestRate}
                onChange={(e) => setNewCommunityInterestRate(e.target.value)}
                placeholder="Enter interest rate"
              />
            </div>
            <div>
              <Label htmlFor="community-required-signatures">Required Signatures</Label>
              <Input
                id="community-required-signatures"
                type="number"
                value={newCommunityRequiredSignatures}
                onChange={(e) => setNewCommunityRequiredSignatures(e.target.value)}
                placeholder="Enter number of signatures required"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCommunity}>Create Community</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}