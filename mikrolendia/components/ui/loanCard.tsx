import React, { Dispatch, SetStateAction, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Badge } from "./badge";
import useUserContract from "@/lib/hooks/useUserContract";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "./button";
import { DialogHeader, DialogFooter } from "./dialog";
import { Loan } from "@/types/type";
export function LoanCard  ({index,
    loan,
    handleBid,
    submitBid,
    setInterestRate,
    interestRate}:
 { index: number,
  loan: any,
  handleBid: (loan: Loan) => void,
  submitBid: (event: React.FormEvent) => void,
  setInterestRate: Dispatch<SetStateAction<string>>,
  interestRate: number}
)  {
    const {userDetails, fetchUserDetails}=useUserContract(loan.requester)
    useEffect(()=>{fetchUserDetails()}, [])
    useEffect(()=>console.log(userDetails), [userDetails])
  return (
    <Card key={index}>
      <CardHeader>
        <CardTitle>{loan.loanType} Loan</CardTitle>
        <CardDescription>{userDetails?.name}-{loan.requester}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Convert BigNumber amount to string */}
        <p className="font-semibold mb-2">
          {loan.amount / Math.pow(10, 18)} AVX
        </p>
        <p className="font-semibold mb-2">
          +91 {userDetails?.phone}
        </p>
        <p className="font-semibold mb-2">
          {userDetails?.city}
        </p>
        <p className="text-sm mb-2">{loan.description}</p>
        <Badge className=" p-2">
          Strikes: {Number(userDetails?.strikes)}
        </Badge>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => handleBid(loan)} className=" w-full">
              Bid
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Place a Bid</DialogTitle>
              <DialogDescription>
                Enter the interest rate you want to offer for this loan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="interest-rate" className="text-right">
                  Interest Rate (%)
                </Label>
                <Input
                  id="interest-rate"
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e: { target: { value: any } }) =>
                    setInterestRate(e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submitBid}>Submit Bid</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};


