import { Contract, ethers, } from "ethers";
import { useState, useEffect, useCallback } from "react";
import { getCommunityContract } from "../contract/contract";
import axios from "axios"
import { useAppSelector } from "./useAppSelector";
import { LoanRequest } from "@/types/type";

const useCommunity = (communityAddress: string) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [owners, setOwners] = useState<[string]|[]>([]);
  const [requiredSignatures, setRequiredSignatures] = useState(0);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [provider, setProvider]=useState<ethers.providers.Web3Provider | null>(null)
  const [balance, setBalance]=useState<number>(0)
  const [interestRate, setInterestRate]=useState<number>(0)
  const [loanRequests , setRequestedLoans]=useState<LoanRequest[]>([]);
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
        const cont=await communityContract.connect(signer)
        setContract(cont);
        
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
    if (!contract )return 
    const tx = await contract.fundme({ value: ethers.utils.parseEther(amount.toString()) });
    await tx.wait();
  };
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
  const addLoanRequest=async(amount: number, reason: string)=>{
    try{
      const ethPriceInINR = await getEthPriceInINR();
      const ethAmount = amount/ethPriceInINR;
      console.log((ethAmount/Math.pow(10,18)))
      const res=await axios.post("http://localhost:5001/api/txn/add", {to: walletAddress, from:communityAddress ,amount: ethAmount, reason})
      console.log(res)
      fetchLoans()
    }catch(err){
      console.log(err)
    }
  }

  const executeTransaction = async (to: string, value: string, signatures: [string]) => {
    if (!contract )return 
    const tx = await contract.executeTransaction(to, ethers.utils.parseEther(value.toString()), signatures);
    await tx.wait();
    fetchLoans()
  };
  const updateOwners = async (newOwners:[string], newRequiredSignatures:number) => {
    if (!contract )return 
    const tx = await contract.updateOwners(newOwners, newRequiredSignatures);
    await tx.wait();
  };
  
  const changeLoanContract = async (newAddress: string) => {
    if (!contract )return 
    const tx = await contract.changeLoanContract(newAddress);
    await tx.wait();
  };
  
  const verifyOwner = async (address: string) => {
    if (!contract )return 
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
      if(!contract )return 
      if(communityAddress && provider){
        const interest=await contract.getFixedInterestRate();
        return setInterestRate(Number(interest))
      }
    }
    getInterest();
  }, [provider, contract, communityAddress])
  
  function toBeArray(value: any) {
    return Array.isArray(value) ? value : [value];
}
  
  const signTransaction=async(transaction: LoanRequest)=>{
    const signer=await provider?.getSigner()
    console.log(ethers.utils.parseEther((transaction.amount).toString()))
    const hashMessage=ethers.utils.solidityKeccak256(["address","uint256","string"],[transaction.to, ethers.utils.parseEther((transaction.amount).toString()), ""])
    console.log(ethers.utils.arrayify(hashMessage))
    const signature=await signer?.signMessage(ethers.utils.arrayify(hashMessage))
    const res=await axios.post("http://localhost:5001/api/txn/sign", {transactionId:transaction._id, signature:{address: walletAddress, signature}}
    )
    fetchLoans()
    console.log(res)
  }
  const approveLoan=async(transaction: LoanRequest)=>{
    if(!contract) return alert("Wallet not connected");
      try{
        const signatures=transaction.signatures.map(sign=>sign.signature);
        console.log(signatures)
        console.log(transaction.amount)
        console.log(Number(ethers.utils.parseEther((transaction.amount).toString())))
        const gas=await contract.estimateGas.executeTransaction(transaction.to, ethers.utils.parseEther(transaction.amount.toString()), signatures)
        const tx=await contract.executeTransaction(transaction.to, ethers.utils.parseEther(transaction.amount.toString()), signatures)
        await tx.wait();
        const res=await axios.post('http://localhost:5001/api/txn/execute', {txHash: tx.data, transactionId: transaction._id})
        alert("Executed Transaction")
      }catch(error){
        console.error(error);
        alert("Could not approve transaction")
      }
  }
  const addFunds=async(amount: number)=>{
    if(amount<=0) return alert("Enter more than 0");
    if(!contract) return alert("Contract not initialized");
    try{
      const tx=await contract.fundme({
        value: ethers.utils.parseUnits(amount.toString(), "ether")
      })
      await tx.wait();
      alert("Funds added")
    }catch(error){
      console.error(error);
      alert("Could not add funds")
    }
  }
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
    fetchBalance,
    fetchInterest,
    balance,
    interestRate,
    provider,
    loanRequests,
    addLoanRequest,
    fetchLoans,
    signTransaction,
    approveLoan,
    addFunds
  };
};

export default useCommunity;