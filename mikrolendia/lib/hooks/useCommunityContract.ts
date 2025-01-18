import { Contract, ethers, } from "ethers";
import { useState, useEffect, useCallback } from "react";
import { getCommunityContract } from "../contract/contract";
import axios from "axios"
import { useAppSelector } from "./useAppSelector";

const useCommunity = (communityAddress: string) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [owners, setOwners] = useState<[string]|[]>([]);
  const [requiredSignatures, setRequiredSignatures] = useState(0);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [provider, setProvider]=useState<ethers.providers.Web3Provider | null>(null)
  const [balance, setBalance]=useState<number>(0)
  const [interestRate, setInterestRate]=useState<number>(0)
  const [requestedLoans, setRequestedLoans]=useState([]);
  const {walletAddress}=useAppSelector(state=>state.wallet)
  // Initialize provider and contract
  const fetchLoans=async()=>{
    const res=await axios.post("http://localhost:5001/api/txn", {multisigWallet: communityAddress})
    setRequestedLoans(res.data.data)
  }
  useEffect(() => {
    const initialize = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider)
        const signer = provider.getSigner();
        const address=await signer.getAddress()
        setUserAddress(address);
        const communityContract = getCommunityContract(provider, communityAddress)
        setContract(communityContract);
        
        // Fetch initial data
        const ownersList = await communityContract.getOwners();
        setOwners(ownersList);
        const requiredSigs = await communityContract.getRequiredSignatures();
        setRequiredSignatures(requiredSigs.toNumber());
      }
    };
    initialize();
    fetchLoans()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityAddress]);

  const fundCommunity = async (amount: number) => {
    if (!contract) throw new Error("Contract is not initialized");
    const tx = await contract.fundme({ value: ethers.utils.parseEther(amount.toString()) });
    await tx.wait();
  };
  const addLoanRequest=async(amount: number, reason: string)=>{
    try{

      const res=await axios.post("http://localhost:5001/api/txn/add", {to: walletAddress, from:communityAddress ,amount, reason})
      console.log(res)
    }catch(err){
      console.log(err)
    }
  }

  const executeTransaction = async (to: string, value: string, signatures: [string]) => {
    if (!contract) throw new Error("Contract is not initialized");
    const tx = await contract.executeTransaction(to, ethers.utils.parseEther(value.toString()), signatures);
    await tx.wait();
  };
  const signTransaction=async(transaction:any)=>{
    const signer=await provider?.getSigner()
    const hashMessage=ethers.utils.solidityKeccak256(["address","uint256","string"],[transaction.to, transaction.amount.toString(), ""])
    const signature=await signer?.signMessage(hashMessage)
    const res=await axios.post("http://localhost:5001/api/txn/sign", {transactionId:transaction._id, signature:{address: walletAddress, signature}})
    console.log(res)
  }
  const updateOwners = async (newOwners:[string], newRequiredSignatures:number) => {
    if (!contract) throw new Error("Contract is not initialized");
    const tx = await contract.updateOwners(newOwners, newRequiredSignatures);
    await tx.wait();
  };

  const changeLoanContract = async (newAddress: string) => {
    if (!contract) throw new Error("Contract is not initialized");
    const tx = await contract.changeLoanContract(newAddress);
    await tx.wait();
  };

  const verifyOwner = async (address: string) => {
    if (!contract) throw new Error("Contract is not initialized");
    return await contract.isOwner(address);
  };
  const fetchBalance=useCallback(()=>{
    const getBalance=async()=>{
      if(communityAddress && provider){
        const bal=await provider?.getBalance(communityAddress);
        return setBalance(Number(bal))
      }
    }
    getBalance();
  }, [provider, communityAddress])

  const fetchInterest=useCallback(()=>{
    const getInterest=async()=>{
      if(!contract) throw new Error("Contract is not initialized");
      if(communityAddress && provider){
        const interest=await contract.getFixedInterestRate();
        return setInterestRate(Number(interest))
      }
    }
    getInterest();
  }, [provider, contract, communityAddress])
  const addSignatureToTransaction = async (to: string, value: number) => {
    if (!userAddress) throw new Error("User address not detected");
    const messageHash = ethers.utils.solidityKeccak256(["address", "uint256", "string"], [to, ethers.utils.parseEther(value.toString()), ""]);
    const signer=await provider?.getSigner()
    const signature = await signer?.signMessage(messageHash)
    return signature;
  };

  return {
    contract,
    owners,
    requiredSignatures,
    userAddress,
    fundCommunity,
    executeTransaction,
    updateOwners,
    changeLoanContract,
    verifyOwner,
    addSignatureToTransaction,
    fetchBalance,
    fetchInterest,
    balance,
    interestRate,
    provider,
    requestedLoans,
    addLoanRequest,
    fetchLoans,
    signTransaction
  };
};

export default useCommunity;