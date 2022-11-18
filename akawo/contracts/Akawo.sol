// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Akawo{
    ERC20 _token;
    address _owner;
    mapping(address => uint) public balances;

    constructor(){
        _owner = msg.sender;
    }

    //function to deposit
    function deposit(uint256 _amount, ERC20 token) public{
        _token = ERC20(token);
        _token.transferFrom(msg.sender, address(this), _amount);        
        balances[msg.sender] += _amount;
    }

    // function to withdraw
    function withdraw(uint256 _amount, ERC20 token) public{
        require(balances[msg.sender] > 0, "Pls input value greater than zero");
        require(balances[msg.sender] >= _amount, "Insufficient Balance");        
        _token = ERC20(token);
        _token.transfer(msg.sender, _amount);
        balances[msg.sender] -= _amount;
    }

    // function to get user balance
    function getBalances() public view returns (uint){
        return balances[msg.sender];
    }
}