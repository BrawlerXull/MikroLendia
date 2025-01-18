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
import { ArrowBigUp } from "lucide-react";
export function LoanCard({
  index,
  loan,
  handleBid,
  submitBid,
  setInterestRate,
  interestRate,
}: {
  index: number;
  loan: any;
  handleBid: (loan: Loan) => void;
  submitBid: (event: React.FormEvent) => void;
  setInterestRate: Dispatch<SetStateAction<string>>;
  interestRate: number;
}) {
  const { userDetails, fetchUserDetails } = useUserContract(loan.requester);
  useEffect(() => {
    fetchUserDetails();
  }, []);
  useEffect(() => console.log(userDetails), [userDetails]);
  return (
    <Card key={index} className=" ">
      <CardHeader>
        <CardTitle className=" py-2">
          {loan.typeOfLoan === 1 && <span> Personal </span>}
          {loan.typeOfLoan === 2 && <span>Business </span>}
          {loan.typeOfLoan === 3 && <span>Student </span>}
          Loan
        </CardTitle>
        <CardDescription>{loan.requester}</CardDescription>
      </CardHeader>
      <CardContent className=" flex justify-between align-bottom items-end mb-[-10px]">
        <div className=" dark:bg-inherit bg-slate-200 w-[72%]  p-2  rounded-xl">
          {/* Convert BigNumber amount to string */}
          <p className="font-semibold mb-2">{userDetails?.name}</p>
          <p className="font-semibold mb-2">+91 {userDetails?.phone}</p>
          <p className="font-semibold mb-2">
            {loan.amount / Math.pow(10, 18)} AVAX
          </p>
          <p className="text-sm mb-2">
            {loan.description.length > 20
              ? `${loan.description.slice(0, 20)}...${loan.description.slice(
                  -10
                )}`
              : loan.description}
          </p>
          <div className=" flex justify-between">
            <Badge className=" p-2">
              Strikes: {Number(userDetails?.strikes)}
            </Badge>
          </div>
        </div>

        <div>
          <Badge className=" p-2 mb-2 flex gap-1 dark:bg-green-600 ">
            <ArrowBigUp className=" h-5 w-5 dark:bg bg-green-600 rounded-sm" />
            Bids: 1
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => handleBid(loan)} className=" w-full ">
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
                  onChange={(e) => setInterestRate(e.target.value)}
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
}
