'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import useLoanContract from '@/lib/hooks/useLoanContract'
import { Loan } from '@/types/type'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { ethers } from 'ethers'



export default function Bidding() {
  const { loanData, isLoading, error, bidMoney } = useLoanContract()  // Get loan data from the custom hook
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>(loanData)  // Ensure this matches the correct type
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [interestRate, setInterestRate] = useState('')
  const { walletAddress } = useAppSelector((state) => state.wallet)

  // Watch for changes in searchTerm or loanData
  useEffect(() => {
    setFilteredLoans(
      loanData.filter((loan) => 

        loan?.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [searchTerm, loanData])
  async function getEthPriceInINR() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
      const data = await response.json();
      return data.ethereum.inr; // Return the ETH price in INR
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      throw new Error('Unable to fetch ETH price');
    }
  }
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase()
    setSearchTerm(term)
  }

  const handleBid = (loan: Loan) => {
    setSelectedLoan(loan)
  }

  const submitBid = async () => {
    if (selectedLoan && interestRate && walletAddress) {
      // Convert INR amount to ETH
      const ethAmount = selectedLoan.amount/Math.pow(10,18)
      const amount=ethers.utils.parseEther((ethAmount).toString());
      await bidMoney(amount)
      const response = await fetch('http://localhost:5001/api/loan/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanIndex: Number(selectedLoan.loanId),
           bidBy: walletAddress,
            bid: interestRate,
        }),
      });

      const lund = await response.json();

      console.log(lund)

      setSelectedLoan(null)
      setInterestRate('')
    } else {
      console.error('Please select a loan and enter an interest rate before submitting the bid.')
    }
  }

  if (isLoading) {
    return <div>Loading loans...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-4xl font-bold mb-6">Loan Bidding</h1>
      <Input
        type="text"
        placeholder="Search loans..."
        value={searchTerm}
        onChange={handleSearch}
        className="mb-6"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLoans.length > 0 ? (
          filteredLoans.map((loan , index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{loan.loanType} Loan</CardTitle>
                <CardDescription>{loan.requester}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Convert BigNumber amount to string */}
                <p className="font-semibold mb-2">{loan.amount/Math.pow(10,18)}ETH</p>
                <p className="text-sm mb-2">{loan.description}</p>
                <Badge className=' p-2' >
                  Strikes: 1
                </Badge>
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleBid(loan)} className=' w-full' >Bid</Button>
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
          ))
        ) : (
          <p>No loans found matching your criteria.</p>
        )}
      </div>
    </motion.div>
  )
}