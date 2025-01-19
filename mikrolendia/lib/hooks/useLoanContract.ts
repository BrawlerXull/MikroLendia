import { useState, useEffect, useCallback } from "react";
import { BigNumber, ethers } from "ethers";
import { getLoanContract } from "../contract/contract";
import { toast } from "sonner";
import { Loan, LoanType } from "@/types/type";
import { useAppSelector } from "./useAppSelector";
import axios from "axios";

const useLoanContract = () => {
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [loanData, setLoanData] = useState<Loan[]>([]);
  const [userLoanData, setUserLoanData] = useState<Loan[]>([]);
  const [approvedLoans, setApprovedLoans]=useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [creatingLoan, setCreatingLoan] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        console.log("Ethereum provider initialized");
      } else {
        toast.error("Please install MetaMask to interact with the blockchain.");
      }
    };

    initProvider();
  }, []);

  const fetchAllLoans = useCallback(async () => {
    if (!provider) return;
    console.log("yayay");
    setIsLoading(true);
    setError(null);

    try {
      const contract = getLoanContract(provider);
      console.log(contract);
      const loans = await contract.getAllLoans();
      setLoanData(loans);
      console.log("Fetched all loans:", loans);
      return loans
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        console.error("Error fetching loans:", err.message);
        setError("Failed to fetch loan data");
      } else {
        console.error("Unknown error fetching loans", err);
        setError("An unexpected error occurred");
      }
      toast.error("An error occurred while fetching the loans.");
    } finally {
      setIsLoading(false);
    }
  }, [provider]);
  const fetchApprovedLoans = useCallback(async () => {
    if (!provider || !walletAddress) return;
    console.log("yayay");
    setIsLoading(true);
    setError(null);

    try {
      const contract = getLoanContract(provider);
      console.log(contract);
      const loans = await contract.getUserApprovedLoans(walletAddress);
      setLoanData(loans);
      console.log("Fetched all loans:", loans);
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        console.error("Error fetching loans:", err.message);
        setError("Failed to fetch loan data");
      } else {
        console.error("Unknown error fetching loans", err);
        setError("An unexpected error occurred");
      }
      toast.error("An error occurred while fetching the loans.");
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  const fetchUserAllLoans = useCallback(async () => {
    if (!provider || !walletAddress) return;
    console.log("yayay");
    setIsLoading(true);
    setError(null);

    try {
      const contract = getLoanContract(provider);
      console.log(contract);
      console.log(walletAddress);
      const loans = await contract.getUserRequestedLoans(walletAddress);
      console.log(loans);
      const loanCount = loans.length;
      console.log(loanCount);
      console.log(loans);
      setApprovedLoans(loans);
      console.log("Fetched all user loans:", loans);
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        console.error("Error fetching user loans:", err.message);
        setError("Failed to fetch user loan data");
      } else {
        console.error("Unknown error fetching user loans", err);
        setError("An unexpected error occurred");
      }
      toast.error("An error occurred while fetching the user loans.");
    } finally {
      setIsLoading(false);
    }
  }, [provider, walletAddress]);

  useEffect(() => {
    if (provider) {
      console.log("fetching");
      fetchAllLoans();
      fetchApprovedLoans();
      fetchUserAllLoans();
    }
  }, [fetchAllLoans, fetchUserAllLoans, provider]);

  const requestLoan = async (
    amount: BigNumber,
    description: string,
    loanType: LoanType,
    duration: number,
    backendAmount: string
  ): Promise<void> => {
    if (!provider) return;
    console.log(amount)
    setCreatingLoan(true);

    const contract = getLoanContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const gas=await contractWithSigner.estimateGas.requestLoan(amount,
        description,
        loanType,
        duration)
      const tx = await contractWithSigner.requestLoan(
        amount,
        description,
        loanType,
        duration
      );
      await tx.wait()
      const loans=await fetchAllLoans();
      console.log(loans)
      const response = await fetch('http://localhost:5001/api/loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address : walletAddress, // Make sure to use the actual wallet address
          userLoan: parseFloat(backendAmount),
          loanIndex:  loans?.length 
        }),
      });

      const data = await response.json();

      console.log(data)

      if (!response.ok) {
        throw new Error('Failed to send data to server');
      }
      console.log("Loan request transaction sent:", tx);
      await tx.wait();
      toast.success("Loan requested successfully.");
      fetchAllLoans();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error requesting loan:", err.message);
        toast.error("An error occurred while requesting the loan.");
      } else {
        console.error("Unknown error requesting loan:", err);
        toast.error("An unexpected error occurred");
      }
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
    address: [string],
    bidNumber: number
  ): Promise<void> => {
    if (!provider) return;

    setIsLoading(true);
    console.log(loanId)
    const contract = getLoanContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const loanIdBigNumber = ethers.utils.parseUnits(
        loanId.toString(),
        18
      );
      // console.log(Number)
      // Convert `interest` to BigNumber, scaling it up if necessary (e.g., if it's in ether)
      const interestBigNumber = ethers.utils.parseUnits(
        interest.toString(),
        18
      ); // Assuming 18 decimals
      console.log(loanIdBigNumber)
      const tx = await contractWithSigner.approveLoan(
        loanIdBigNumber,
        interestBigNumber,
        granter,
        address
      );
      console.log("Loan approval transaction sent:", tx);
      await tx.wait();
      const res=await axios.post('http://localhost:5001/api/loan/approve', {loanId: loan._id, bidNumber})
      toast.success("Loan approved successfully.");
      fetchAllLoans();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error approving loan:", err);
        toast.error("An error occurred while approving the loan.");
      } else {
        console.error("Unknown error approving loan:", err);
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addCommunityLoan = async (_amount: Number, _interest: Number, _community: String) => {
    if(!provider) return
    setIsLoading(true);
    setError(null);
    try {
      const contract = await getLoanContract(provider);
      const tx = await contract.addCommunityLoan(
        ethers.utils.parseEther(_amount.toString()), 
        _interest,
        _community
      );
      await tx.wait();
      return tx;
    } catch (err) {
      console.error(err)
      toast.error("An unexpected error occued")
      setError("Could Not add community loan");
    } finally {
      setIsLoading(false);
    }
  };

  const repayLoan = async (loanId: number, amount: number): Promise<void> => {
    if (!provider) return;

    setIsLoading(true);

    const contract = getLoanContract(provider);
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    try {
      const tx = await contractWithSigner.repayLoan(loanId, {
        value: ethers.utils.parseUnits(amount.toString(), "wei"),
      });
      console.log("Repayment transaction sent:", tx);
      await tx.wait();
      toast.success("Loan repaid successfully.");
      fetchAllLoans();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error repaying loan:", err.message);
        toast.error("An error occurred while repaying the loan.");
      } else {
        console.error("Unknown error repaying loan:", err);
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const bidMoney = async (amount: BigNumber) => {
    if (!provider) return;
    console.log(Number(amount))
    setIsLoading(true);
    const contract = getLoanContract(provider);
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    try {
      const txHash = await contractWithSigner.deposit({
        value: amount
      });
      console.log(txHash);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    provider,
    loanData,
    isLoading,
    creatingLoan,
    userLoanData,
    requestLoan,
    approveLoan,
    repayLoan,
    error,
    bidMoney,
    addCommunityLoan,
    approvedLoans,
    fetchApprovedLoans,
    fetchAllLoans,
  };
};

export default useLoanContract;