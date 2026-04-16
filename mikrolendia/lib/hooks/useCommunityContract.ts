import { Contract, ethers } from "ethers";
import { useState, useEffect, useCallback } from "react";
import { getCommunityContract } from "../contract/contract";
import axios from "axios";
import { useAppSelector } from "./useAppSelector";
import { LoanRequest } from "@/types/type";
import { toast } from "sonner";

const useCommunity = (communityAddress: string) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [owners, setOwners] = useState<string[]>([]);
  const [requiredSignatures, setRequiredSignatures] = useState(0);
  const [balance, setBalance] = useState<string>('0'); // wei as string
  const [interestRate, setInterestRate] = useState<number>(0);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const { walletAddress } = useAppSelector(state => state.wallet);

  // Fetch pending loan requests for this community from backend
  const fetchLoans = useCallback(async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/txn", {
        multisigWallet: communityAddress,
      });
      setLoanRequests(res.data.data ?? []);
    } catch (err) {
      console.warn("fetchLoans failed:", err);
    }
  }, [communityAddress]);

  // Fetch ETH balance of the community contract
  const fetchBalance = useCallback(async () => {
    if (!provider || !communityAddress) return;
    try {
      const bal = await provider.getBalance(communityAddress);
      setBalance(bal.toString());
    } catch (err) {
      console.warn("fetchBalance failed:", err);
    }
  }, [provider, communityAddress]);

  // Fetch fixed interest rate from contract
  const fetchInterest = useCallback(async () => {
    if (!contract) return;
    try {
      const rate = await contract.getFixedInterestRate();
      setInterestRate(Number(rate));
    } catch (err) {
      console.warn("fetchInterest failed:", err);
    }
  }, [contract]);

  // Initialise MetaMask provider and community contract
  useEffect(() => {
    const initialize = async () => {
      if (typeof window === 'undefined' || !window.ethereum || !communityAddress) return;
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        const signer = web3Provider.getSigner();
        const communityContract = getCommunityContract(web3Provider, communityAddress);
        const connected = communityContract.connect(signer);
        setContract(connected);

        const ownersList: string[] = await communityContract.getOwners();
        setOwners(ownersList);

        const reqSigs = await communityContract.getRequiredSignatures();
        setRequiredSignatures(reqSigs.toNumber());

        const bal = await web3Provider.getBalance(communityAddress);
        setBalance(bal.toString());

        try {
          const rate = await communityContract.getFixedInterestRate();
          setInterestRate(Number(rate));
        } catch { /* contract may not have this method */ }
      } catch (err) {
        console.warn("Community init failed:", err);
      }
    };
    initialize();
    fetchLoans();
  }, [communityAddress, fetchLoans]);

  // Fund the community pool with ETH
  const addFunds = async (ethAmount: number) => {
    if (!contract) {
      toast.error("Wallet not connected");
      return;
    }
    if (ethAmount <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }
    try {
      const tx = await contract.fundme({
        value: ethers.utils.parseEther(ethAmount.toString()),
      });
      await tx.wait();
      toast.success(`Funded community with ${ethAmount} ETH`);
      fetchBalance();
    } catch (error) {
      console.error(error);
      toast.error("Could not add funds");
    }
  };

  // Submit a loan request to the community (records in backend; owners then sign)
  const addLoanRequest = async (ethAmount: number, reason: string) => {
    if (!walletAddress) {
      toast.error("Wallet not connected");
      return;
    }
    try {
      await axios.post("http://localhost:5001/api/txn/add", {
        to: walletAddress,
        from: communityAddress,
        amount: ethAmount,
        reason,
      });
      toast.success("Loan request submitted — owners can now sign it");
      fetchLoans();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit loan request");
    }
  };

  // Owner signs a pending transaction (off-chain EIP-191 signature)
  const signTransaction = async (transaction: LoanRequest) => {
    if (!provider || !walletAddress) {
      toast.error("Wallet not connected");
      return;
    }
    try {
      const signer = provider.getSigner();
      const hashMessage = ethers.utils.solidityKeccak256(
        ["address", "uint256", "string"],
        [
          transaction.to,
          ethers.utils.parseEther(transaction.amount.toString()),
          "",
        ]
      );
      const signature = await signer.signMessage(ethers.utils.arrayify(hashMessage));
      await axios.post("http://localhost:5001/api/txn/sign", {
        transactionId: transaction._id,
        signature: { address: walletAddress, signature },
      });
      toast.success("Transaction signed successfully");
      fetchLoans();
    } catch (error: any) {
      console.error(error);
      if (error?.code === 4001) {
        toast.error("Signature rejected in wallet");
      } else {
        toast.error("Failed to sign transaction");
      }
    }
  };

  // Execute a fully-signed transaction on-chain
  const approveLoan = async (transaction: LoanRequest) => {
    if (!contract) {
      toast.error("Wallet not connected");
      return;
    }
    try {
      const signatures = transaction.signatures.map(s => s.signature);
      const amountWei = ethers.utils.parseEther(transaction.amount.toString());
      const tx = await contract.executeTransaction(transaction.to, amountWei, signatures);
      await tx.wait();
      await axios.post("http://localhost:5001/api/txn/execute", {
        txHash: tx.hash,
        transactionId: transaction._id,
      });
      toast.success("Transaction executed — funds sent to borrower");
      fetchLoans();
      fetchBalance();
    } catch (error: any) {
      console.error(error);
      const msg: string = error?.reason ?? error?.message ?? "";
      if (msg.includes("not enough balance")) {
        toast.error("Community pool has insufficient balance. Fund it first.");
      } else if (msg.includes("invalid signature") || msg.includes("signatures")) {
        toast.error("Signature verification failed on-chain.");
      } else {
        toast.error("Could not execute transaction");
      }
    }
  };

  const executeTransaction = async (to: string, value: string, signatures: string[]) => {
    if (!contract) return;
    const tx = await contract.executeTransaction(
      to,
      ethers.utils.parseEther(value.toString()),
      signatures
    );
    await tx.wait();
    fetchLoans();
  };

  const updateOwners = async (newOwners: string[], newRequiredSignatures: number) => {
    if (!contract) return;
    const tx = await contract.updateOwners(newOwners, newRequiredSignatures);
    await tx.wait();
  };

  const changeLoanContract = async (newAddress: string) => {
    if (!contract) return;
    const tx = await contract.changeLoanContract(newAddress);
    await tx.wait();
  };

  const verifyOwner = async (address: string) => {
    if (!contract) return false;
    return await contract.isOwner(address);
  };

  const fundCommunity = async (amount: number) => {
    if (!contract) return;
    const tx = await contract.fundme({ value: ethers.utils.parseEther(amount.toString()) });
    await tx.wait();
  };

  return {
    contract,
    provider,
    owners,
    requiredSignatures,
    balance,
    interestRate,
    loanRequests,
    addFunds,
    addLoanRequest,
    signTransaction,
    approveLoan,
    fetchLoans,
    fetchBalance,
    fetchInterest,
    fundCommunity,
    executeTransaction,
    updateOwners,
    changeLoanContract,
    verifyOwner,
  };
};

export default useCommunity;
