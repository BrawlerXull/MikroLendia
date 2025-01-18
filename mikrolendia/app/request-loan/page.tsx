'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { toast } from 'sonner'
import useLoanContract from '@/lib/hooks/useLoanContract'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { ethers } from 'ethers'

export default function RequestLoan() {


  const [loanType, setLoanType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const {loanData} = useLoanContract();

  const { walletAddress } = useAppSelector((state) => state.wallet)
  

  const { requestLoan, creatingLoan } = useLoanContract();
  async function getEthPriceInINR() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
      const data = await response.json();
      console.log(data)
      return data.ethereum.inr; // Return the ETH price in INR
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      throw new Error('Unable to fetch ETH price');
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loanType || !amount || !description || !duration) {
      toast.error('Please fill in all the fields.');
      return;
    }

    try {
      const loanEnum = loanType === 'personal' ? 0 : loanType === 'business' ? 1 : 2;
      
      // First, request the loan on the blockchain
      const ethPriceInINR = await getEthPriceInINR();
      const ethAmount = parseFloat(amount) / ethPriceInINR;
      const loanAmount=ethers.utils.parseUnits(ethAmount.toString())
      console.log(loanAmount)
      await requestLoan(
        loanAmount,
        description,        
        loanEnum,           
        parseInt(duration)  
      );

      // Send the data to your local server at localhost:5000
      const response = await fetch('http://localhost:5001/api/loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address : walletAddress, // Make sure to use the actual wallet address
          userLoan: parseFloat(amount),
          loanIndex:  loanData.length 
        }),
      });

      const lund = await response.json();

      console.log(lund)

      if (!response.ok) {
        throw new Error('Failed to send data to server');
      }

      // Redirect to the bidding page on success
      // router.push('/bidding');
      
    } catch (err) {
      console.error('Loan request failed:', err);
      toast.error('An error occurred while requesting the loan.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <h1 className="text-3xl font-bold mb-6">Request a Loan</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Loan Type */}
        <div>
          <Label htmlFor="loan-type">Loan Type</Label>
          <Select onValueChange={setLoanType} required>
            <SelectTrigger id="loan-type">
              <SelectValue placeholder="Select loan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Amount Required</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* Loan Description */}
        <div>
          <Label htmlFor="description">Loan Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="duration">Duration (Months)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={creatingLoan}>
          {creatingLoan ? 'Requesting Loan...' : 'Submit Loan Request'}
        </Button>
      </form>
    </motion.div>
  );
}