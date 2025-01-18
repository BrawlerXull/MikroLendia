"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Community, LoanRequest, signature } from "@/types/type";
import useCommunity from "@/lib/hooks/useCommunityContract";
import { useAppSelector } from "@/lib/hooks/useAppSelector";

function CommunityCard({
  community,
  owners,
  walletAddress,
  onJoin,
}: {
  community: Community;
  onJoin: (id: number) => void;
  owners: string[]
  walletAddress: string
  onLoanRequest: (
    amount: number,
    description: string,
    walletAddress: string,
    communityAddress: string
  ) => void;
  
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showLoanRequestDialog, setShowLoanRequestDialog] = useState(false);
  const [loanType, setLoanType] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDescription, setLoanDescription] = useState("");
  const [funds, setFunds]=useState<number>(0);
  const [showFundsDialogue, setShowFundsDialogue]=useState<boolean>(false)
  const {
    balance,
    fetchBalance,
    fetchInterest,
    interestRate,
    provider,
    contract,
    loanRequests,
    addLoanRequest,
    fetchLoans,
    requiredSignatures,
    signTransaction,
    approveLoan,
    addFunds
    
  } = useCommunity(community.contractAddress);
  const [joined, setJoined]=useState<boolean>(false)
  useEffect(()=>{
    if(walletAddress && owners){
      const lowerOwners=owners.map((owner)=>owner.toLowerCase())
      setJoined(()=>{
        return lowerOwners.includes(walletAddress.toLowerCase())
      })
    }
  },[walletAddress, owners])
  useEffect(()=>console.log(joined), [joined])
  const handleLoanRequest = (event: React.FormEvent) => {
    event.preventDefault();
    addLoanRequest(+loanAmount, loanDescription)
    setShowLoanRequestDialog(false);
    setLoanType("");
    setLoanAmount("");
    setLoanDescription("");
  };
  const handleFundsSubmit=async(event: React.FormEvent)=>{
    event.preventDefault();
    const tx=await addFunds(funds)
    console.log(tx)
    setFunds(0);
    setShowFundsDialogue(false)
    await fetchBalance()
  }
  useEffect(() => {
    fetchBalance();
    fetchInterest();

  }), [contract, provider, walletAddress];  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{community.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-2">
          <span>Available Funds:</span>
          <span className="font-semibold">{(balance/Math.pow(10,18))?.toLocaleString()} ETH</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Members:</span>
          <span className="font-semibold">{community?.owners?.length}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span>Interest Rate:</span>
          <span className="font-semibold">{interestRate?.toString()}%</span>
        </div>
        {showDetails && joined && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Active Loan Requests</h4>
            {loanRequests.filter(loan=>!loan.executed).map((loan) => (
              <Card   key={loan._id} className="mb-4 px-4">
                <p className="text-sm mb-2">Requestor: {loan.to}</p>
                <p className="text-sm text-muted-foreground mb-1">
                  Reason: {loan.reason}
                </p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Amount: {loan.amount} ETH</span>
                  <Badge variant="secondary">
                    {loan.signatures.length}/{requiredSignatures} Approvals
                  </Badge>
                </div>
                <Progress
                  value={(loan.signatures.length / requiredSignatures) * 100}
                  className="mb-2"
                />
                {walletAddress.toLowerCase() == loan.to.toLowerCase()?
                <Button disabled={loan.signatures.length<requiredSignatures} onClick={() => approveLoan(loan)} size="sm">
                Approve Loan
              </Button>:
              <Button onClick={() => signTransaction(loan)} size="sm">
              Sign
            </Button>}
              </Card>
            ))}
            <Button
              onClick={() => setShowLoanRequestDialog(true)}
              className="w-full mt-4"
            >
              Request a Loan
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
        {joined? (
          <Button onClick={() => setShowFundsDialogue(true)}>Add Funds</Button>
        ): (
          <Button onClick={() => onJoin(community.id)}>Join Community</Button>
        )}
      </CardFooter>

      <Dialog
        open={showFundsDialogue}
        onOpenChange={setShowFundsDialogue}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Add funds to your community to help out your fellow members.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFundsSubmit} className="space-y-4">
            <div>
              <Label htmlFor="funds-amount">Enter Amount</Label>
              <Input
                id="funds-amount"
                type="number"
                value={funds}
                onChange={(e) => setFunds(+e.target.value)}
                placeholder="Enter funds to be added"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Submit Loan Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showLoanRequestDialog}
        onOpenChange={setShowLoanRequestDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Loan</DialogTitle>
            <DialogDescription>
              Fill out the details to request a loan from this community.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoanRequest} className="space-y-4">
            <div>
              <Label htmlFor="loan-amount">Loan Amount</Label>
              <Input
                id="loan-amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Enter loan amount"
              />
            </div>
            <div>
              <Label htmlFor="loan-description">Loan Description</Label>
              <Textarea
                id="loan-description"
                value={loanDescription}
                onChange={(e) => setLoanDescription(e.target.value)}
                placeholder="Describe the purpose of your loan"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Submit Loan Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CommunityCard;
