'use client'

import { useEffect, useState } from 'react'
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function RequestLoan() {


  const [loanType, setLoanType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');

  const { walletAddress } = useAppSelector((state) => state.wallet)
  

  const { requestLoan, creatingLoan, loanData, fetchAllLoans, isLoading } = useLoanContract();
  useEffect(()=>{fetchAllLoans()}, [])
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
  const handleSubmit = async (e: React.FormEvent) => {
    if(!loanData) return alert("Not initialized")
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
      console.log(loanData)
      await requestLoan(
        loanAmount,
        description,        
        loanEnum,           
        parseInt(duration),
        amount
      );

      // Send the data to your local server at localhost:5000
      

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
      {/* <form onSubmit={handleSubmit} className="space-y-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription>Join MikroLendia and start your micro-lending journey</CardDescription>
        </CardHeader>
        <CardContent>
          
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="30"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <Select value={profession} onValueChange={setProfession}>
                <SelectTrigger id="profession">
                  <SelectValue placeholder="Select your profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={creatingLoan}>
            {creatingLoan ? 'Registering...' : 'Register'}
          </Button>
        </CardFooter>
        </form> */}

<Card>
<form onSubmit={handleSubmit} className="space-y-4">
        {/* Loan Type */}

        <CardHeader>
          <CardTitle className="text-2xl font-bold">Request a loan</CardTitle>
          <CardDescription>Join MikroLendia and start your micro-lending journey</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>

        <CardFooter>
        <Button type="submit" className="w-full" disabled={creatingLoan }>
          {creatingLoan ? 'Requesting Loan...' : 'Submit Loan Request'}
        </Button>
        </CardFooter>
      </form>
</Card>
    </motion.div>
  );
}