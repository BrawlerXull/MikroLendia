"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import useLoanContract from "@/lib/hooks/useLoanContract";
import { Loan } from "@/types/type";
import { useAppSelector } from "@/lib/hooks/useAppSelector";
import { Button } from "@/components/ui/button";

const DUMMY_BIDS = [
  {
    id: 1,
    loanType: "Student",
    amount: 1500,
    status: "Active",
    borrower: "Alice Johnson",
    interestRate: 4,
  },
  {
    id: 1,
    loanType: "Student",
    amount: 1500,
    status: "Active",
    borrower: "Alice Johnson",
    interestRate: 4,
  },
  {
    id: 2,
    loanType: "Personal",
    amount: 3000,
    status: "Completed",
    borrower: "Bob Smith",
    interestRate: 6,
  },
  {
    id: 1,
    loanType: "Student",
    amount: 1500,
    status: "Active",
    borrower: "Alice Johnson",
    interestRate: 4,
  },
];

const DUMMY_TRANSACTIONS = [
  {
    id: 1,
    type: "Deposit",
    amount: 1000,
    date: "2023-06-01",
    status: "Completed",
  },
  {
    id: 2,
    type: "Withdrawal",
    amount: 500,
    date: "2023-06-15",
    status: "Pending",
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { approveLoan, loanData, repayLoan } = useLoanContract();

  const [userLoanData, setUserLoanData] = useState<Loan[]>([]);
  const { walletAddress } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        `http://localhost:5001/api/loan/${walletAddress}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const lund = await response.json();
      // console.log(lund)
      console.log(lund);

      setUserLoanData(lund);
    }

    fetchData();
  }, [walletAddress]);
  useEffect(()=>console.log(userLoanData),[userLoanData])

  console.log(activeTab);
  const approve = async (loan: Loan, bid: any) => {
    try {
      let address = [];
      address = loan.bids.map((bid: any) => bid.bidBy)
      let bidNumber:number=0
      for(let i =0;i<loan.bids.length;i++){
        if(loan.bids[i]._id==bid._id){
          break
        }
        bid++;
      }
      console.log(address)
      await approveLoan(loan.loanIndex,loan, bid.interest, bid.bidBy, address, bidNumber)

    } catch (err) {
      console.log(err)
    }

  }
  const convertToDate=(time: number)=>{
    console.log(Number(time))
    const date=new Date(Number(time)*1000)
    return date.toString()
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
      <div className=" flex justify-between">

        <div>
          
          <Tabs
            defaultValue="overview"
            className="space-y-4"
            onValueChange={setActiveTab}
          >
            <TabsList>
              {/* <TabsTrigger value="overview">Overview</TabsTrigger> */}
              <TabsTrigger value="requested-loans">Requested Loans</TabsTrigger>
              {/* <TabsTrigger value="my-bids">My Bids</TabsTrigger> */}
              <TabsTrigger value="approved-loans">Approved Loans</TabsTrigger>

              {/* <TabsTrigger value="approved-loands">My Loans</TabsTrigger> */}

              {/* <TabsTrigger value="transactions">Transactions</TabsTrigger>  */}
            </TabsList>



            <TabsContent value="requested-loans">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userLoanData.filter(loan=>loan.status=="pending").map((loan, index) => (
                  <Card key={Number(index)} className="w-full">
                    <CardHeader>
                      <CardTitle>{loan.description} Loan</CardTitle>
                      <CardDescription>${Number(loan.loan)}</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-1">
                      <table>
                        <tbody className="gap-3">
                          {loan.bids.map((bid, index) => {
                            return (
                              <tr key={index} className=" gap-4 mb-1  font-bold">
                                <td>
                                  <h1 className="">{bid.interest}%</h1>
                                </td>
                                <td>
                                  <h1>{bid.bidBy}</h1>
                                </td>
                                <td>
                                  <Button onClick={() => approve(loan, bid)} className="bg-cyan-950 hover:bg-cyan-600 transition-all p-2 rounded-lg">

                                    Accept bid
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {loan.typeOfLoan == 0
                        ? "Business"
                        : loan.typeOfLoan == 1
                          ? "Student"
                          : "Personal"} Loan
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="approved-loans" className=" w-[100%]  p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userLoanData.filter(loan=>loan.status=="approved").map((loan) => {
                  console.log(loan);
                  return(
                    <Card key={loan._id} className="  min-w-80 ">
                      <CardHeader className=" ">
                        <CardTitle>{loan.loan} Rs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loan.acceptedBid && loanData && (<div>
                          <p>Lender: {loan.acceptedBid.bidBy}</p>
                          <p>Interest: {loan.acceptedBid.interest}%</p>
                          {/* <p>Next Due Date: {convertToDate(loanData[loan.loanIndex]?.dueDate).slice(4,16)}</p> */}
                          <p>Duration: {Number(loanData[loan.loanIndex]?.duration)} Months</p>
                          <Button onClick={()=>repayLoan(loan.loanIndex, loan.totalLoanValue/Number(loanData[loan.loanIndex]?.duration))}>Repay Loan</Button>
                        </div>)}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* <TabsContent value="approved-loans" className=" w-[100%]  p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userLoanData.filter(loan=>loan.status==1).map((loan, index) => (
                  <Card key={Number(index)} className="w-full">
                    <CardHeader>
                      <CardTitle>{loan.description} Loan</CardTitle>
                      <CardDescription>${Number(loan.loan)}</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-1">
                      
                      {loan.typeOfLoan == 0
                        ? "Business"
                        : loan.typeOfLoan == 1
                          ? "Student"
                          : "Personal"} Loan
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent> */}

            <TabsContent value="my-bids" className=" w-[100%]  p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DUMMY_BIDS.map((bid) => (
                  <Card key={bid.id} className="  min-w-80 ">
                    <CardHeader className=" ">
                      <CardTitle>{bid.loanType} Loan</CardTitle>
                      <CardDescription>${bid.amount}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className="mb-2">{bid.status}</Badge>
                      <p className="text-sm mb-2">Borrower: {bid.borrower}</p>
                      <p className="text-sm">Interest Rate: {bid.interestRate}%</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="transactions">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userLoanData.filter(loan=>loan.status==1).map((transaction) => (
                  <Card key={transaction.id}>
                    <CardHeader>
                      <CardTitle>{transaction.type}</CardTitle>
                      <CardDescription>{transaction.date}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold mb-2">
                        ${transaction.amount}
                      </p>
                      <Badge>{transaction.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

       
      </div>



    </motion.div>
  );
}