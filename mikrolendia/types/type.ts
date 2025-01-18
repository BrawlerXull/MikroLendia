export type Community = {
  name: string;
  contractAddress: string;
  owners: [string];
};

export type LoanRequest = {
  _id: string;
  reason: string;
  amount: number;
  description: string;
  signatures: signature[];
  from: string;
  to: string;
};
export type signature={
  _id: string,
  address: string,
  signature: string
}
export enum LoanType {
  personal = 0,
  business = 1,
  student = 2,
}

enum Status {
  pending = 0,
  accepted = 1,
  completed = 2,
  cancelled = 3,
}



export interface Loan {
  loanIndex: any;
  bids: any;
  loan: any;
  loanId: any;
  typeOfLoan: number;
  amount: number;
  description: string;
  loanType: LoanType;
  status: Status;
  requester: string;
  granter: string;
  interest: number;
  dueDate: number;
  amountPaid: number;
  duration: number;
}