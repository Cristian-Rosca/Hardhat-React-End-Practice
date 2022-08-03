// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";

contract Lock {
    uint public unlockTime;
    address payable public owner;

    mapping(address => uint) public depositors;

    event Withdrawal(uint amount, uint when);
    event DepositEvent(address _sender, uint _value);

    constructor(uint _unlockTime) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = _unlockTime;
        owner = payable(msg.sender);

        depositors[msg.sender] = msg.value;
    }

    function withdraw() public {
        // Uncomment this line to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);

    }

    function deposit() public payable {
        emit DepositEvent(msg.sender, msg.value);
        depositors[msg.sender] += msg.value;
    }

    receive() payable external{
        deposit();
    }

    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    // add function that allows you to return the corresponding value from an address in the mapping
}
