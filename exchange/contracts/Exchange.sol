// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exchange is ERC20{
    address public akawoTokenAddress = 0xf773e8fAdc25F35d43355a1204218a5E4B8529de;

    // inherit ERC20 helps to keep track of the lp tokens
    constructor (address _Akawotoken) ERC20("Akawo LP Token", "AKWLP"){
        require(_Akawotoken != address(0), "Token address passed is null address");
    }

    // function that returns amount of akawo token held by contract
    function getReserve() public view returns (uint){
        return ERC20(akawoTokenAddress).balanceOf(address(this));
    }

    // function that adds liquidity
    function addLiquidity(uint _amount) public payable returns (uint) {
        uint liquidity;
        uint maticBalance = address(this).balance;
        uint akawoTokenReserve = getReserve();
        ERC20 akawoToken = ERC20(akawoTokenAddress);

        // Check if reserve is empty, if so intake any user supplied value
        if(akawoTokenReserve == 0) {
            akawoToken.transferFrom(msg.sender, address(this), _amount);
            // mint lp tokens to user
            liquidity = maticBalance;
            _mint(msg.sender, liquidity);
        }else{// Reserve not empty, i.e there is already liquidity created
            // take in any desired matic from user and determined
            // the required akawo token
            uint maticReserve = maticBalance - msg.value;

            // to avoid great impacts from addition of liquidity,
            // a ratio is maintained
            uint akawoTokenAmount = (msg.value * akawoTokenReserve)/(maticReserve);
            require(_amount >= akawoTokenAmount, "Amount sent is less than required");
            akawoToken.transferFrom(msg.sender, address(this), akawoTokenAmount);

            // AMount of lp tokens to be sent to user is
            // liquidity = (total supply of lp in contract * matic sent by user)/(matic reserve in contract)
            liquidity = (totalSupply() * msg.value)/maticReserve;
            _mint(msg.sender, liquidity);
        }
        return liquidity;
    }

    // Function that removes liquidity
    // returns amount of matic and akw to return to user
    function removeLiquidity(uint _amount) public returns (uint, uint) {
        require(_amount > 0, "Value can not be zero");
        uint maticReserve = address(this).balance;
        uint _totalSupply = totalSupply();
        uint maticAmount = (maticReserve * _amount)/_totalSupply;// amount of Matic to send back to user
        uint akawoTokenAmount = (getReserve() *_amount)/ _totalSupply;// akw token to send back to user
        _burn(msg.sender, _amount);// burn the lp token
        payable(msg.sender).transfer(maticAmount);// send matic to user
        ERC20(akawoTokenAddress).transfer(msg.sender, akawoTokenAmount);
        return (maticAmount, akawoTokenAmount);
    }

    // Function that returns amount of MATIC/AKW to be returned to user after swap
    function getAmountOfTokens(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "Reserve less than zero");
        //There is a 1% fee for swaps, used to incentivise liquidity providers
        uint256 inputAmountWithFee = inputAmount * 99;
        // in order to follow the concept of `XY = K` curve
        // We need to make sure (x + Δx) * (y - Δy) = x * y
        // So the final formula is Δy = (y * Δx) / (x + Δx)
        // Δy is `tokens to be received`
        // Δx = ((input amount)*99)/100, x = inputReserve, y = outputReserve
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator / denominator;
    }

    // Function that swaps MATIC for AKW tokens
    function maticToAkawoToken(uint _minTokens) public payable {
        uint256 tokenReserve = getReserve();
        // first get the amount of akawo tokens that would be returned after swap
        uint256 tokensBought = getAmountOfTokens(
            msg.value, 
            address(this).balance - msg.value, 
            tokenReserve
            );

        require(tokensBought >= _minTokens, "insufficient tokens in reserve");
        ERC20(akawoTokenAddress).transfer(msg.sender, tokensBought);
    }

    // Function that swaps AKW for MATIC
    function akawoTokenToMatic(uint _tokensSold, uint _minMatic) public {
        uint256 tokenReserve = getReserve();
        // Get amount of MATIC to be returned to user
        uint256 maticBought = getAmountOfTokens(
            _tokensSold,
            tokenReserve,
            address(this).balance
        );
        require(maticBought >= _minMatic, "insufficient Matic in reserve");
        ERC20(akawoTokenAddress).transferFrom(msg.sender, address(this), _tokensSold);
        //send the matic to user
        payable(msg.sender).transfer(maticBought);
    }
}