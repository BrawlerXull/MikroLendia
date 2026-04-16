import { useState, useEffect, useCallback } from "react";
import { BigNumber, ethers } from "ethers";
import { getLoanContract } from "../contract/contract";
import { toast } from "sonner";
import { Loan, LoanType } from "@/types/type";
import { useAppSelector } from "./useAppSelector";
import axios from "axios";
import { getSignerProvider } from "../utils/getSignerProvider";

// Static read-only provider — talks directly to the Hardhat node, no MetaMask needed
const READ_RPC = "http://127.0.0.1:8545";
const readProvider = new ethers.providers.JsonRpcProvider(READ_RPC);

const useLoanContract = () => {
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [loanData, setLoanData] = useState<Loan[]>([]);
  const [userRequestedLoans, setUserRequestedLoans] = useState<Loan[]>([]);
  const [approvedLoans, setApprovedLoans] = useState<Loan[]>([]);
  const [lenderLoans, setLenderLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [creatingLoan, setCreatingLoan] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useAppSelector((state) => state.wallet);

  // Initialize MetaMask Web3Provider for writes only
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
      }
    };
    initProvider();
  }, []);

  // Fetch all loans using static read provider — always works, no MetaMask required
  const fetchAllLoans = useCallback(async () => {
    console.log("fetching loans...");
    setIsLoading(true);
    setError(null);

    try {
      const contract = getLoanContract(readProvider);
      const loans = await contract.getAllLoans();
      setLoanData(loans);
      console.log("Fetched all loans:", loans);
      return loans;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error fetching loans:", err.message);
        setError("Failed to fetch loan data");
      } else {
        console.error("Unknown error fetching loans", err);
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  const fetchApprovedLoans = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const contract = getLoanContract(readProvider);
      const loans = await contract.getUserApprovedLoans(walletAddress);
      setApprovedLoans(loans);
      console.log("Fetched approved loans:", loans);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error fetching approved loans:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch loans where current user is the LENDER (granter) — uses getUserPaidLoans
  const fetchLenderLoans = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const contract = getLoanContract(readProvider);
      const loans = await contract.getUserPaidLoans(walletAddress);
      setLenderLoans(loans);
      console.log("Fetched lender loans:", loans);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error fetching lender loans:", err.message);
      }
    }
  }, [walletAddress]);

  const fetchUserAllLoans = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const contract = getLoanContract(readProvider);
      const loans = await contract.getUserRequestedLoans(walletAddress);
      setUserRequestedLoans(loans);
      console.log("Fetched user requested loans:", loans);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error fetching user loans:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);


  useEffect(() => {
    fetchAllLoans();
  }, [fetchAllLoans]);

  useEffect(() => {
    if (walletAddress) {
      fetchApprovedLoans();
      fetchUserAllLoans();
      fetchLenderLoans();
    }
  }, [walletAddress, fetchApprovedLoans, fetchUserAllLoans, fetchLenderLoans]);

  const requestLoan = async (
    amount: BigNumber,
    description: string,
    loanType: LoanType,
    duration: number,
    backendAmount: string
  ): Promise<void> => {
    setCreatingLoan(true);
    try {
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getLoanContract(web3Provider);
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.requestLoan(amount, description, loanType, duration);
      await tx.wait();
      const loans = await fetchAllLoans();

      try {
        const response = await fetch('http://localhost:5001/api/loan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: walletAddress,
            userLoan: parseFloat(backendAmount),
            loanIndex: loans?.length,
          }),
        });
        if (response.ok) console.log('Loan saved to backend');
      } catch (backendErr) {
        console.warn('Backend save failed (non-critical):', backendErr);
      }

      toast.success("Loan requested successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error("Error requesting loan:", msg);
      toast.error("An error occurred while requesting the loan.");
    } finally {
      setCreatingLoan(false);
    }
  };

  // Approve a loan
  const approveLoan = async (
    loanId: number,
    loan: Loan,
    interest: number,
    granter: string,
    allBidderAddresses: string[],
    bidNumber: number
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getLoanContract(web3Provider);
      const contractWithSigner = contract.connect(signer);

      // loanId is a plain index (0, 1, 2...) — no wei scaling
      // interest is a whole-number percentage (5 = 5%) — no wei scaling
      // Strip any empty/invalid addresses before passing to the contract —
      // ethers tries to resolve empty strings as ENS names and throws.
      const validBidders = allBidderAddresses.filter(
        (a) => typeof a === 'string' && ethers.utils.isAddress(a)
      );
      if (!granter || !ethers.utils.isAddress(granter)) {
        throw new Error(`Invalid granter address: "${granter}"`);
      }
      const tx = await contractWithSigner.approveLoan(loanId, interest, granter, validBidders);
      await tx.wait();
      await axios.post('http://localhost:5001/api/loan/approve', { loanIndex: loanId, bidNumber });
      toast.success("Loan approved successfully.");
      fetchAllLoans();
      fetchLenderLoans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error("Error approving loan:", msg);
      toast.error("An error occurred while approving the loan.");
    } finally {
      setIsLoading(false);
    }
  };

  const addCommunityLoan = async (_amount: Number, _interest: Number, _community: String) => {
    setIsLoading(true);
    setError(null);
    try {
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getLoanContract(web3Provider);
      const tx = await contract.connect(signer).addCommunityLoan(
        ethers.utils.parseEther(_amount.toString()),
        _interest,
        _community
      );
      await tx.wait();
      return tx;
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setError("Could not add community loan");
    } finally {
      setIsLoading(false);
    }
  };

  const repayLoan = async (loanId: number, amount: BigNumber): Promise<void> => {
    setIsLoading(true);
    try {
      // The contract requires block.timestamp > loan.dueDate (set to approvalTime + 30 days).
      // Advance the Hardhat clock past it via direct RPC so estimateGas doesn't underflow.
      // Uses evm_increaseTime (Hardhat/Ganache) via raw fetch to bypass ethers provider caching.
      // Silently ignored on mainnet (method won't exist).
      try {
        const rpc = (method: string, params: unknown[]) =>
          fetch('http://127.0.0.1:8545', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
          });
        await rpc('evm_increaseTime', [31 * 24 * 60 * 60]);
        await rpc('evm_mine', []);
      } catch { /* non-local network — skip */ }

      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getLoanContract(web3Provider);
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.repayLoan(loanId, { value: amount });
      await tx.wait();
      toast.success("Loan repaid successfully.");
      fetchAllLoans();
      fetchUserAllLoans();
      fetchApprovedLoans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error("Error repaying loan:", msg);
      toast.error("An error occurred while repaying the loan.");
    } finally {
      setIsLoading(false);
    }
  };

  const bidMoney = async (amount: BigNumber) => {
    setIsLoading(true);
    try {
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getLoanContract(web3Provider);
      // Deposit loan.amount + 1 wei so the contract's strict `balance > loan.amount`
      // check passes at approval time (otherwise balance == loan.amount fails).
      const tx = await contract.connect(signer).deposit({ value: amount.add(1) });
      await tx.wait();
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    provider,
    loanData,
    isLoading,
    creatingLoan,
    userRequestedLoans,
    requestLoan,
    approveLoan,
    repayLoan,
    error,
    bidMoney,
    addCommunityLoan,
    approvedLoans,
    lenderLoans,
    fetchApprovedLoans,
    fetchLenderLoans,
    fetchUserAllLoans,
    fetchAllLoans,
  };
};

export default useLoanContract;