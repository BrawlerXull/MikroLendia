'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppSelector } from '@/lib/hooks/useAppSelector'
import { toast } from 'sonner'
import useUserContract from '@/lib/hooks/useUserContract'
import { UserCheck, Wallet, ShieldCheck } from 'lucide-react'

export default function Register() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [profession, setProfession] = useState('')
  const walletAddress = useAppSelector((state) => state.wallet.walletAddress)
  const isConnected = useAppSelector((state) => state.wallet.isConnected)
  const { addUser, isLoading, userDetails } = useUserContract()
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name || !age || !city || !phoneNumber || !profession) {
      toast.error('Please fill in all fields.')
      return
    }
    try {
      await addUser(name, parseInt(age), city, profession, phoneNumber)
      toast.success('Registration successful! Welcome to LendLedger.')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      console.error('Registration failed:', err)
      toast.error('Registration failed. Please try again.')
    }
  }

  // Already registered
  if (userDetails && userDetails.name) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <UserCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Already Registered</h2>
          <p className="text-muted-foreground mb-2">Welcome back, <span className="font-semibold text-foreground">{userDetails.name}</span>!</p>
          <p className="text-sm text-muted-foreground mb-6">
            {userDetails.city} • {userDetails.profession}
          </p>
          <Button asChild className="bg-gradient-to-r from-indigo-500 to-teal-400 text-white border-0 rounded-xl">
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </motion.div>
      </div>
    )
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your MetaMask wallet to register on LendLedger.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Register your on-chain identity to start borrowing and lending.</p>
        </div>

        <Card className="glass border-border/50">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Mumbai" value={city} onChange={(e) => setCity(e.target.value)} required className="bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Select value={profession} onValueChange={setProfession}>
                  <SelectTrigger id="profession" className="bg-background/50">
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="business-owner">Business Owner</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-mono text-muted-foreground truncate">{walletAddress}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6">
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white border-0 rounded-xl" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Create Account'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
