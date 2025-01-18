import { useState, useCallback, } from "react";
import { ethers } from "ethers";
import { toast } from "sonner"; 
import useLoanContract from "./useLoanContract";
import useCommunity from "./useCommunityContract";
import CommunityABI from "../../lib/contract/config/CommunityAbi.json";
import useCommunityFactory from "./useCommunityFactoryContract";

type Message = {
  role: "user" | "bot";
  content: string;
};

enum FunctionName {
  REQUEST_LOAN = "requestLoan",
  CREATE_COMMUNITY = "createCommunity",
  // APPROVE_LOAN = "approveLoan",
  // REPAY_LOAN = "repayLoan",
  // FETCH_ALL_LOANS = "fetchAllLoans",
  // FETCH_USER_LOANS = "fetchUserLoans",
  // ADD_COMMUNITY_LOAN = "addCommunityLoan",
  // BID_MONEY = "bidMoney",
  GENERIC = "generic",
}

const useChainbot = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [functionName, setFunctionName] = useState<FunctionName | null>(null);

  const {
    requestLoan,
    // approveLoan,
    // repayLoan,
    // addCommunityLoan,
    bidMoney,
  } = useLoanContract();

  const { deployCommunity } = useCommunityFactory();

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

  const handleCreateCommunity = async (owners: string[] , newCommunityRequiredSignatures: number, newCommunityName: string, newCommunityInterestRate: number) => {
    try {
      const initData = new ethers.utils.Interface(
        CommunityABI
      ).encodeFunctionData("initialize", [
        owners,
        newCommunityRequiredSignatures,
        newCommunityName,
        newCommunityInterestRate,
      ]);
      await deployCommunity(initData, owners, newCommunityName);
    } catch (err: any) {
      console.log(err);
    }
  };

  const handleSend = useCallback(async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blockchain-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "An unknown error occurred");
        toast.error(data.error || "An unknown error occurred");
        return;
      }

      const data = await response.json();
      console.log(data)

      if (data.functionName) {
        const { functionName, parameters } = data;

        setFunctionName(functionName as FunctionName);

        const botMessage: Message = { role: "bot", content: "" };
        

        switch (functionName) {
          case FunctionName.REQUEST_LOAN:
            const { amount, description, loanType, duration } = parameters;

            const ethPriceInINR = await getEthPriceInINR();
            const ethAmount = parseFloat(amount) / ethPriceInINR;
            const loanAmount=ethers.utils.parseUnits(ethAmount.toString())
            console.log("sadfsadf",loanAmount)
            await requestLoan(
              // ethers.utils.parseEther(amount.toString()),
              loanAmount,
              description,
              loanType,
              duration
            );
            botMessage.content = "Loan requested successfully.";
            break;

          case FunctionName.CREATE_COMMUNITY:
            // { "communityName": "Star community" , "communityOwners": ["0x186662Ce659216a80B074b9D6a28676A112882b6","0xd6EF4e5C3cE2fB06faD3830742Ea303b6339D6e8"] , "interestRate": 2.3 , "requiredSignatures": 2}
            const {communityName , communityOwners ,interestRate ,requiredSignatures} = parameters;
            await handleCreateCommunity(communityOwners , requiredSignatures , communityName , interestRate)
            botMessage.content = "Community created successfully";
            break;

          // case FunctionName.APPROVE_LOAN:
          //   const { loanId, interest, granter, address } = parameters;
          //   await approveLoan(
          //     loanId,
          //     interest,
          //     granter,
          //     address
          //   );
          //   botMessage.content = "Loan approved successfully.";
          //   break;

          // case FunctionName.REPAY_LOAN:
          //   const { loanId: repayLoanId, amount: repayAmount } = parameters;
          //   await repayLoan(repayLoanId, repayAmount);
          //   botMessage.content = "Loan repaid successfully.";
          //   break;

          // case FunctionName.ADD_COMMUNITY_LOAN:
          //   const { amount: commAmount, interest: commInterest, community } = parameters;
          //   await addCommunityLoan(commAmount, commInterest, community);
          //   botMessage.content = "Community loan added successfully.";
          //   break;

          // case FunctionName.BID_MONEY:
          //   const { amount: bidAmount } = parameters;
          //   await bidMoney(ethers.utils.parseEther(bidAmount.toString()));
          //   botMessage.content = "Money bid successfully.";
          //   break;

          case FunctionName.GENERIC:
            const { aiResponse } = parameters;
            botMessage.content = aiResponse;
            break;

          default:
            botMessage.content = "Function not recognized.";
        }

        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error handling request:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [input, requestLoan, bidMoney]);

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    handleSend,
    functionName,
  };
};

export default useChainbot;
