import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { getUserContract } from '../contract/contract'; // Assuming this is where your contract is imported from
import { useAppSelector } from './useAppSelector';

// Define a User interface based on the contract structure
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

const useUserContract = (address: string) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null); // Store user data
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorType>(null); // Handle errors
  const {walletAddress}=useAppSelector(state=>state.wallet); 
  // Initialize Ethereum provider
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        console.log(address)
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
      } else {
        toast.error('Please install MetaMask to interact with the blockchain.');
      }
    };

    initProvider();
  }, []);
  useEffect(()=>{
    if(provider){
      fetchUserDetails()
    }
  },[provider])

  // Fetch user details from the contract
  const fetchUserDetails = useCallback(async () => {
    console.log("yay")
    console.log("nigga")
    console.log(provider)
    if (!provider) return;
    console.log("nigga")
    setIsLoading(true);

    try {
      const contract = getUserContract(provider); // Assuming getUserContract is a utility function that returns the contract
      const signer = provider.getSigner();
      const user = await contract.getUser(address);
      // console.log() // Call the getUser function of the contract
      console.log('User details fetched:', user);
      setUserDetails(user); // Set the fetched user data
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching user details:', err.message);
        toast.error('An error occurred while fetching the user details.');
        setError(err.message); // Set the error message
      } else {
        console.error('Unknown error fetching user details:', err);
        toast.error('An unexpected error occurred');
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [provider, walletAddress]);

  // Add a strike to a user
  const addStrike = async (userAddress: string) => {
    if (!provider) return;

    setIsLoading(true);

    const contract = getUserContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const tx = await contractWithSigner.addStrike(userAddress); // Call the addStrike function of the contract
      console.log('Add strike transaction sent:', tx);
      await tx.wait();
      toast.success('Strike added successfully.');
      fetchUserDetails(); // Refresh user details after strike is added
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error adding strike:', err.message);
        toast.error('An error occurred while adding the strike.');
        setError(err.message); // Set the error message
      } else {
        console.error('Unknown error adding strike:', err);
        toast.error('An unexpected error occurred');
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new user
  const addUser = async (
    name: string,
    age: number,
    city: string,
    profession: string,
    phone: string
) => {
    if (!provider) return;

    setIsLoading(true);

    const contract = getUserContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const tx = await contractWithSigner.addUser(name, age, city, profession, phone);
      console.log('User registration transaction sent:', tx);
      await tx.wait();
      toast.success('User registered successfully.');
      fetchUserDetails(); // Refresh user details after registration
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error registering user:', err.message);
        toast.error('An error occurred while registering the user.');
        setError(err.message); // Set the error message
      } else {
        console.error('Unknown error registering user:', err);
        toast.error('An unexpected error occurred');
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
};


  return {
    provider,
    userDetails,
    isLoading,
    fetchUserDetails,
    addStrike,
    addUser,
    error,
  };
};

export default useUserContract;
