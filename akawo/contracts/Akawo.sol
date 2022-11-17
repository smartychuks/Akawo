// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Akawo{
    ERC20 _token;
    address _owner;

    constructor(){
        _owner = msg.sender;
    }

    function deposit(uint256 _amount, ERC20 token) public{
        _token = ERC20(token);
        _token.transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(uint256 _amount, ERC20 token) external payable{
        _token = ERC20(token);
        _token.transfer(msg.sender, _amount);
    }
}