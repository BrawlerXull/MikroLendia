// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./UserContract.sol";
import "./Community.sol";
contract LoanContract {
    uint256 totalLoans = 0;
    UserContract userContract;
    enum LoanType {
        personal,
        business,
        student
    }
    enum Status {
        pending,
        accepted,
        completed,
        cancelled
    }

    struct LoanStruct {
        uint256 loanId;
        uint256 amount;
        string description;
        LoanType typeOfLoan;
        Status status;
        address requester;
        address granter;
        uint256 interest;
        uint256 dueDate;
        uint256 amountPaid;
        uint256 duration;
    }

    mapping(uint256 => LoanStruct) public Loans;
    mapping(address => LoanStruct[]) public UserRequestedLoans;
    mapping(address => LoanStruct[]) public UserCommunityLoans;
    mapping(address => LoanStruct[]) public UserApprovedLoans;
    mapping(address => LoanStruct[]) public UserPaidLoans;

    event LoanRequested(uint256 loanId, address indexed requester);
    event LoanApproved(uint256 loanId, address indexed granter);
    event LoanRepaid(uint256 loanId, uint256 amountPaid);

    constructor(address _userContractAddress) {
        userContract = UserContract(_userContractAddress);
    }

    function requestLoan(
        uint256 _amount,
        string memory _description,
        LoanType _type,
        uint256 _duration
    ) public {
        require(
            userContract.getUser(msg.sender).userAddress == msg.sender,
            "User not registered"
        );

        LoanStruct storage newLoan = Loans[totalLoans];
        newLoan.loanId = totalLoans;
        newLoan.amount = _amount;
        newLoan.description = _description;
        newLoan.typeOfLoan = _type;
        newLoan.status = Status.pending;
        newLoan.requester = msg.sender;
        newLoan.duration = _duration;

        UserRequestedLoans[msg.sender].push(newLoan);
        emit LoanRequested(totalLoans, msg.sender);
        totalLoans++;
    }

    function approveLoan(
        uint256 _loanId,
        uint256 _interest,
        address _granter,
        address[] memory _bidderAddresses
    ) public payable {
        LoanStruct storage loan = Loans[_loanId];
        require(loan.status == Status.pending, "Loan is not pending");
        require(address(this).balance > loan.amount, "Insufficient balance");
        loan.status = Status.accepted;
        loan.granter = _granter;
        loan.interest = _interest;
        loan.dueDate = block.timestamp + 30 days;
// 0x04db6f01e9c74f90
        (bool success, ) = payable(loan.requester).call{value: loan.amount}("");
        for (uint i = 0; i < _bidderAddresses.length; i++) {
            address bidder = _bidderAddresses[i];
            if (bidder != _granter) {
                (bool refundSuccess, ) = payable(bidder).call{
                    value: loan.amount
                }("");
                require(refundSuccess, "Refund to bidder failed");
            }
        }

        require(success, "Payment Failed");

        UserApprovedLoans[loan.requester].push(loan);
        UserPaidLoans[_granter].push(loan);

        LoanStruct[] storage requestedLoans = UserRequestedLoans[
            loan.requester
        ];
        for (uint256 i = 0; i < requestedLoans.length; i++) {
            if (requestedLoans[i].loanId == _loanId) {
                for (uint256 j = i; j < requestedLoans.length - 1; j++) {
                    requestedLoans[j] = requestedLoans[j + 1];
                }
                requestedLoans.pop(); 
                break;
            }
        }

        emit LoanApproved(_loanId, _granter);
    }


    
    function addCommunityLoan(uint256 amount, uint256 interest, address payable _community) public{
        LoanStruct storage newLoan = Loans[totalLoans];
        newLoan.requester=msg.sender;
        newLoan.loanId = totalLoans;
        newLoan.amount = amount;
        newLoan.interest = interest;
        newLoan.status = Status.accepted;
        newLoan.granter = _community;
        newLoan.dueDate=block.timestamp + 30 days;
        totalLoans++;
    }

    function repayLoan(uint256 _loanId) public payable {
        LoanStruct storage loan = Loans[_loanId];
        require(
            loan.requester == msg.sender,
            "You are not the requester of this loan"
        );
        require(loan.status == Status.accepted, "Loan is not active");

        uint256 monthsElapsed = (block.timestamp - loan.dueDate) / 30 days;
        require(monthsElapsed > 0, "Repayment can only be made once a month");

        uint256 amountDueNextMonth = calculateAmountDueNextMonth(loan);
        require(msg.value >= amountDueNextMonth, "Incorrect repayment amount");

        _transferRepayment(loan, msg.value);
    }

    function calculateAmountDueNextMonth(
        LoanStruct memory loan
    ) public pure returns (uint256) {
        uint256 principalDueNextMonth = loan.amount / loan.duration;
        uint256 remainingAmount = loan.amount - loan.amountPaid;
        uint256 interestDueNextMonth = (remainingAmount * loan.interest) / 100;
        return principalDueNextMonth + interestDueNextMonth;
    }

    function _transferRepayment(
        LoanStruct storage loan,
        uint256 repaymentAmount
    ) internal {
        (bool success, ) = payable(loan.granter).call{value: repaymentAmount}(
            ""
        );
        require(success, "Payment failed");

        loan.amountPaid += repaymentAmount;
        if (loan.amountPaid >= loan.amount) {
            loan.status = Status.completed;
        }
        loan.dueDate += 30 days;

        emit LoanRepaid(loan.loanId, repaymentAmount);
    }

    function addStrikeIfLate(uint256 _loanId) public {
        LoanStruct storage loan = Loans[_loanId];
        require(loan.status == Status.accepted, "Loan is not active");

        if (block.timestamp > loan.dueDate) {
            userContract.addStrike(loan.requester);
            loan.dueDate += 30 days;
        }
    }

    function getAllLoans() public view returns (LoanStruct[] memory) {
        LoanStruct[] memory allLoans = new LoanStruct[](totalLoans);
        for (uint256 i = 0; i < totalLoans; i++) {
            allLoans[i] = Loans[i];
        }
        return allLoans;
    }

    function getUserRequestedLoans(
        address _user
    ) public view returns (LoanStruct[] memory) {
        return UserRequestedLoans[_user];
    }

    function getUserApprovedLoans(
        address _user
    ) public view returns (LoanStruct[] memory) {
        return UserApprovedLoans[_user];
    }

    function getUserPaidLoans(
        address _user
    ) public view returns (LoanStruct[] memory) {
        return UserPaidLoans[_user];
    }

    function deposit() public payable {}
}