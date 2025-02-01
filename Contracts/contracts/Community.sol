// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./LoanContract.sol";
contract Community is Initializable {
    uint256 private _requiredSignatures;
    address[] private _owners;
    string name;
    uint256 fixedInterest;
    mapping(address => bool) private pendingInvites;

    event TransactionExecuted(uint256 transactionId, address executer);
    event ReceivedEth(uint256 amount);
    LoanContract loan=LoanContract(0x0D9fB0f68cDCdeEB323411230Ac03ADeA20B3515);


    function changeLoanContract(address newContract) public{
        loan = LoanContract(newContract);
    }

    function initialize(address[] memory owners, uint256 requiredSignatures, string memory _name, uint256 _fixedInterest) public initializer {
        require(owners.length > 0, "At least one owner required");
        require(requiredSignatures > 0 && requiredSignatures <= owners.length, "Invalid number of required signatures");
        require(isAllAddress(owners), "Invalid owner addresses");

        _owners = owners;
        _requiredSignatures = requiredSignatures;
        name = _name;
        fixedInterest = _fixedInterest;
    }
    function getMessageHash(
        address _to,
        uint256 _amount,
        string memory _message
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _amount, _message));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
        );
    }

    function verify(
        address _to,
        uint256 _amount,
        string memory _message,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 messageHash = getMessageHash(_to, _amount, _message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return isOwner(recoverSigner(ethSignedMessageHash, signature));
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) private pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        private
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function executeTransaction(address payable to, uint256 value, bytes[] memory signatures) public {
        require((address(this).balance >= value) && (value > 0), "Invalid value");
        uint256 numberOfSignatures=0;
        for(uint i=0;i<signatures.length;i++){
             if(verify(to, value, "", signatures[i])){
                numberOfSignatures++;
            }
        }
        require(numberOfSignatures>=getRequiredSignatures(),"Not enough signatures");
        (bool success,) = to.call{value: value}("");
        loan.addCommunityLoan(value, fixedInterest, payable(address(this)));
        require(success, "Transaction execution failed");
    }

    function updateOwners(address[] memory newOwners, uint256 requiredSignatures) public {
        require(newOwners.length > 0, "At least one owner required");
        require(requiredSignatures > 0 && requiredSignatures <= newOwners.length, "Invalid number of required signatures");
        require(isAllAddress(newOwners), "Invalid owner addresses");

        _owners = newOwners;
        _requiredSignatures = requiredSignatures;
    }

    function sendInvite(address newMember) public {
        require(isOwner(msg.sender), "Only owners can send invites");
        require(!isOwner(newMember), "Already an owner");
        pendingInvites[newMember] = true;
        // emit InviteSent(newMember);
    }
    
    function acceptInvite() public {
        require(pendingInvites[msg.sender], "No pending invite");
        pendingInvites[msg.sender] = false;
        _owners.push(msg.sender);
        // emit InviteAccepted(msg.sender);
    }
    function isOwner(address account) public view returns (bool) {
        for (uint256 i = 0; i < _owners.length; i++) {
            if (_owners[i] == account) {
                return true;
            }
        }
        return false;
    }

    function getOwners() public view returns(address[] memory) {
        return _owners;
    }

    function getRequiredSignatures() public view returns(uint256) {
        return _requiredSignatures;
    }
    function getFixedInterestRate() public view returns(uint256) {
        return fixedInterest;
    }

    function isAllAddress(address[] memory newOwners) pure private returns(bool) {
        for(uint256 i = 0; i < newOwners.length; i++) {
            if(newOwners[i] != address(newOwners[i]))
                return false;
        }
        return true;
    }

    function isInvited() public view returns(bool){
        return pendingInvites[msg.sender];
    }
    function fundme() public payable{
        emit ReceivedEth(msg.value);
    }

    receive() external payable  { 
        fundme();
    }

    fallback() external payable {
        fundme();
    }
}