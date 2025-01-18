import { useState, useCallback, } from "react";
import { ethers } from "ethers";
import { toast } from "sonner"; 
import useLoanContract from "./useLoanContract";

type Message = {
  role: "user" | "bot";
  content: string;
};

enum FunctionName {
  REQUEST_LOAN = "requestLoan",
  // APPROVE_LOAN = "approveLoan",
  // REPAY_LOAN = "repayLoan",
  // FETCH_ALL_LOANS = "fetchAllLoans",
  // FETCH_USER_LOANS = "fetchUserLoans",
  // ADD_COMMUNITY_LOAN = "addCommunityLoan",
  // BID_MONEY = "bidMoney",
  // GENERIC = "generic",
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

      if (data.functionName) {
        const { functionName, parameters } = data;

        setFunctionName(functionName as FunctionName);

        const botMessage: Message = { role: "bot", content: "" };

        switch (functionName) {
          case FunctionName.REQUEST_LOAN:
            const { amount, description, loanType, duration } = parameters;
            await requestLoan(
              ethers.utils.parseEther(amount.toString()),
              description,
              loanType,
              duration
            );
            botMessage.content = "Loan requested successfully.";
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
