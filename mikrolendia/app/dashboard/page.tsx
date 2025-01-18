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

  const { approveLoan } = useLoanContract();

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
      console.log(lund);
      setUserLoanData(lund);
    }

    fetchData();
  }, [walletAddress]);

  console.log(activeTab);
  const approve = async (loan: Loan, bid: any) => {
    try {
      let address = [];
      address = loan.bids.map((bid: any) => bid.bidBy)
      console.log(address)
      await approveLoan(loan.loanIndex, bid.interest, bid.bidBy, address)

    } catch (err) {
      console.log(err)
    }

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
          <div className=" w-[70%] text-xl p-2 ">
            <div className=" flex gap-3">
              <Card className="  min-w-80 ">
                <CardHeader>
                  <CardTitle>Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$10,500</p>
                </CardContent>
              </Card>
              <Card className="  min-w-80 ">
                <CardHeader>
                  <CardTitle>Active Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">3</p>
                </CardContent>
              </Card>
              <Card className="  min-w-56 ">
                <CardHeader>
                  <CardTitle>Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$1,200</p>
                </CardContent>
              </Card>


            </div>
          </div>
          <Tabs
            defaultValue="overview"
            className="space-y-4"
            onValueChange={setActiveTab}
          >
            <TabsList>
              {/* <TabsTrigger value="overview">Overview</TabsTrigger> */}
              <TabsTrigger value="requested-loans">Requested Loans</TabsTrigger>
              <TabsTrigger value="my-bids">My Bids</TabsTrigger>
              <TabsTrigger value="approved-loans">Approved Loans</TabsTrigger>

              {/* <TabsTrigger value="approved-loands">My Loans</TabsTrigger> */}

              {/* <TabsTrigger value="transactions">Transactions</TabsTrigger>  */}
            </TabsList>



            <TabsContent value="requested-loans">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userLoanData.map((loan, index) => (
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
                                  <button onClick={() => approve(loan, bid)} className="bg-cyan-950 hover:bg-cyan-600 transition-all p-2 rounded-lg">

                                    Accept bid
                                  </button>
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

            <TabsContent value="approved-loans" className=" w-[100%]  p-2">
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
                {DUMMY_TRANSACTIONS.map((transaction) => (
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

        <div>
          <Card className="min-w-80 p-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 rounded-xl shadow-2xl transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute top-0 right-0 p-2 bg-yellow-500 text-white rounded-bl-xl text-sm font-bold">
              Reward
            </div>
            <CardHeader>
              <CardTitle className="text-white text-3xl font-extrabold">Native Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-extrabold text-white">+$10,500</p>
              <div className="mt-4 text-sm text-white opacity-80">Earned through your incredible performance!</div>
            </CardContent>
          </Card>

        </div>
      </div>



    </motion.div>
  );
}