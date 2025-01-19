'use client'
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/lib/hooks/useAppSelector';
import { toast } from 'sonner';
import useUserContract from '@/lib/hooks/useUserContract';

export default function Register() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profession, setProfession] = useState('');
  const [metamaskAddress, setMetamaskAddress] = useState<string | null>('');
  const walletAddress = useAppSelector((state) => state.wallet.walletAddress);

  const { addUser, isLoading } = useUserContract();

  useEffect(() => {
    setMetamaskAddress(walletAddress);
  }, [walletAddress]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !age || !city || !phoneNumber || !profession || !metamaskAddress) {
      toast.error('Please fill in all the fields.');
      return;
    }


    try {
      await addUser(name, parseInt(age), city, profession, phoneNumber);
      toast.success('Registration successful!');
    } catch (err) {
      console.error('Registration failed:', err);
      toast.error('An error occurred during registration.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className=" max-w-md mx-auto"
    >
      <Card className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="metamask-address">Metamask Address</Label>
              <Input
                id="metamask-address"
                value={metamaskAddress ? metamaskAddress : ''}
                readOnly
                className="bg-muted"
              />
            </div>
          
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
