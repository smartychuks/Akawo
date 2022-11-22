// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Akawo{
    ERC20 _token;
    address _owner;
    uint locktime = 0;
    mapping(address => uint) public balancesFlexible;
    mapping(address => uint) public balancesFixed;
    // @map: account selected false for flexible and true for fixed
    mapping(address => bool) public account;
    mapping(address => uint) public time;


    constructor(){
        _owner = msg.sender;
    }

    //function to deposit
    function deposit(uint256 _amount, ERC20 token) public{
        _token = ERC20(token);
        _token.transferFrom(msg.sender, address(this), _amount);        
        
        // Conditional to check which account to deposit to
        if(!account[msg.sender]){
            balancesFlexible[msg.sender] += _amount;
        }else{
            balancesFixed[msg.sender] += _amount;
            
            //lock and add one minute locktime for each deposit
            /*if (locktime < block.timestamp){
                locktime = block.timestamp + 60;
                time[msg.sender] += locktime;
            }*/
            // I comment out the above statement, because there seem to be an error such
            // that it adds 106 years to locktime when the user does deposits multiple times
            // in a row within a minute
        }
    }

    // function to withdraw
    function withdraw(uint256 _amount, ERC20 token) public{
        _token = ERC20(token);
        if(!account[msg.sender]){// For flexible account
            require(balancesFlexible[msg.sender] > 0, "Flexible Balance is empty");
            require(balancesFlexible[msg.sender] >= _amount, "Insufficient flexible account Balance");   
            _token.transfer(msg.sender, _amount);
            balancesFlexible[msg.sender] -= _amount;
        }else{// for fixed account
            require(balancesFixed[msg.sender] > 0, "Fixed saving account Balance is empty");
            require(balancesFixed[msg.sender] >= _amount, "Insufficient fixed account Balance");   
            require(block.timestamp > time[msg.sender], "Time for withdrawal has not reached");
            _token.transfer(msg.sender, _amount);
            balancesFixed[msg.sender] -= _amount;
        }
    }

    // function to set account type
    function setAcount(bool _account) public {
        account[msg.sender] = _account;
    }

    // function to get user balance
    function getBalances(bool _account) public view returns (uint){
        if(!_account){//flexible account balance
            return balancesFlexible[msg.sender];
        }else{// Fixed account balance
            return balancesFixed[msg.sender];
        }
    }

    // function to get amount of time its locked
    function getLockTime() public view returns(uint){
        return time[msg.sender];
    }

    //Function to increase locktime
    function increaseLockTime(uint _secondsToIncrease) public {
        time[msg.sender] += _secondsToIncrease; 
    }
}