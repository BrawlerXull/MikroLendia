import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { getUserContract } from '../contract/contract';
import { useAppSelector } from './useAppSelector';
import { getSignerProvider } from '../utils/getSignerProvider';

interface User {
  userId: number;
  name: string;
  age: number;
  city: string;
  profession: string;
  userAddress: string;
  strikes: number;
  phone: string;
}

type ErrorType = string | null;

// Static read-only provider — no MetaMask dependency for reads
const READ_RPC = "http://127.0.0.1:8545";
const readProvider = new ethers.providers.JsonRpcProvider(READ_RPC);


const useUserContract = () => {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorType>(null);
  const { walletAddress } = useAppSelector(state => state.wallet);

  // Fetch user details using static read provider
  const fetchUserDetails = useCallback(async (address?: string) => {
    const targetAddress = address || walletAddress;
    if (!targetAddress) return;

    setIsLoading(true);
    try {
      const contract = getUserContract(readProvider);
      const user = await contract.getUser(targetAddress);
      console.log('User details fetched:', user);
      setUserDetails(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching user details:', err.message);
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Auto-fetch when walletAddress changes
  useEffect(() => {
    if (walletAddress) {
      fetchUserDetails(walletAddress);
    }
  }, [walletAddress, fetchUserDetails]);

  // Add a strike to a user (write — needs MetaMask)
  const addStrike = async (userAddress: string) => {
    setIsLoading(true);
    try {
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getUserContract(web3Provider);
      const tx = await contract.connect(signer).addStrike(userAddress);
      await tx.wait();
      toast.success('Strike added successfully.');
      fetchUserDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error adding strike:', msg);
      toast.error('An error occurred while adding the strike.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new user (write — needs MetaMask)
  const addUser = async (
    name: string,
    age: number,
    city: string,
    profession: string,
    phone: string
  ) => {
    setIsLoading(true);
    try {
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getUserContract(web3Provider);
      const tx = await contract.connect(signer).addUser(name, age, city, profession, phone);
      console.log('User registration transaction sent:', tx);
      await tx.wait();
      toast.success('User registered successfully.');
      fetchUserDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error registering user:', msg);
      toast.error('An error occurred while registering the user.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userDetails,
    isLoading,
    fetchUserDetails,
    addStrike,
    addUser,
    error,
  };
};

export default useUserContract;
