// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
//import "openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "openzeppelin-solidity-2.3.0/contracts/utils/ReentrancyGuard.sol";

contract Akawo{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public immutable tokenAddress;
    // Timestamp when reward finishes
    uint256 public periodFinish = earnTime[msg.sender];
    //Reward to be paid per second
    uint256 public rewardRate = 0;
    // Duration of rewards to be paid out
    uint256 public rewardsDuration = 1 days;

    uint256 one = 1;
    
    uint256 public lastUpdateTime;
    // reward to be paid per token
    uint256 public rewardPerTokenStored;
    address public owner;
    uint256 locktime = 0;
    uint256 public _totalSupply;

    // Storage to keep track of balance of each address in flexible account
    mapping(address => uint256) public balancesFlexible;
    // Keeps track of user fixed account balanace
    mapping(address => uint256) public balancesFixed;
    // @map: account selected 0 for flexible and 1 for fixed
    mapping(address => uint256) public account;
    // Keep track of amount of time token is locked for an address
    mapping(address => uint256) public time;
    // time for earnings to be accrued, usually 24hours
    mapping(address => uint256) public earnTime;
    mapping(address => uint256) public userRewardPerTokenPaid;
    // Rewards for each address
    mapping(address => uint256) public rewards;
    // Mapping for rates for different accounts
    mapping(uint256 => uint256) public rewardRates;

    mapping(address => uint256) public _balances;    


    // modifier for only owner
    modifier onlyOwner{
        require(msg.sender == owner, "Operation not allowed");
        _;
    }

    // modifier to ensure only holders of AKW can access the features
    modifier onlyHolders{
        //address token = 0xf773e8fAdc25F35d43355a1204218a5E4B8529de;
        require(IERC20(tokenAddress).balanceOf(msg.sender) >= 1, "You need at least 1 AKW token in wallet");
        _;
    }

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (_account != address(0)) {
            rewards[_account] = earned();
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _tokenAddress){
        owner = msg.sender;
        tokenAddress = IERC20(_tokenAddress);
    }

    //function to deposit
    function deposit(uint256 _amount) public updateReward(msg.sender) onlyHolders{
        require(_amount > 0, "Cannot Deposit 0");
       
        tokenAddress.transferFrom(msg.sender, address(this), _amount);        
        
        // Conditional to check which account to deposit to
        if(account[msg.sender] == 0){
            rewardRates[0] = one.div(9);
            balancesFlexible[msg.sender] = balancesFlexible[msg.sender].add(_amount);
        }else if(account[msg.sender] == 1){
            rewardRates[1] = one.div(5);
            balancesFixed[msg.sender] = balancesFixed[msg.sender].add(_amount);
            //lock and add one minute locktime for each deposit
            if (locktime < block.timestamp){
                locktime = block.timestamp.add(1 minutes);
                time[msg.sender] = time[msg.sender].add(locktime);
            }
        }
        _balances[msg.sender] = _balances[msg.sender].add(_amount);
        _totalSupply = _totalSupply.add(_amount);
        rewardRate = rewardRates[0].add(rewardRates[1]);
    }

    // function to set earn time to 24 hours
    function setEarnTime() public onlyHolders{
        require(block.timestamp > earnTime[msg.sender], 'Your earning session has not expired');
        // check if user already in earning circle     
        earnTime[msg.sender] = block.timestamp.add(1 days);
    }

    // function to get Earn time
    function getEarnTime () public view onlyHolders returns (uint val) {
        if(earnTime[msg.sender] > 0){
            val = earnTime[msg.sender];
            return val;
        }
    }

    // function to withdraw
    function withdraw(uint256 _amount) public updateReward(msg.sender) onlyHolders{
        require(_amount > 0, "Can not withdraw 0 value");
        
        if(account[msg.sender] == 0){// For flexible account
            require(balancesFlexible[msg.sender] > 0, "Flexible Balance is empty");
            require(balancesFlexible[msg.sender] >= _amount, "Insufficient flexible account Balance");   
            tokenAddress.transfer(msg.sender, _amount);
            balancesFlexible[msg.sender] = balancesFlexible[msg.sender].sub(_amount);
            if(!(balancesFlexible[msg.sender] > 0)) {
                rewardRates[0] = 0;
            }
            
        }else if(account[msg.sender] == 1){// for fixed account
            require(balancesFixed[msg.sender] > 0, "Fixed saving account Balance is empty");
            require(balancesFixed[msg.sender] >= _amount, "Insufficient fixed account Balance");   
            require(block.timestamp > time[msg.sender], "Time for withdrawal has not reached");
            tokenAddress.transfer(msg.sender, _amount);
            balancesFixed[msg.sender] = balancesFixed[msg.sender].sub(_amount);
            if(!(balancesFixed[msg.sender] > 0)) {
                rewardRates[1] = 0;
            }
        }
        _balances[msg.sender] = _balances[msg.sender].sub(_amount);
        _totalSupply = _totalSupply.sub(_amount);   
    }

    // Function to withdraw Earnings
    function withdrawEarn() public updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            tokenAddress.safeTransfer(msg.sender, reward);
        }    
    }

    // function to set account type
    function setAcount(uint _account) public onlyHolders{
        account[msg.sender] = _account;
    }

    // function to get user balance
    function getBalances(bool _account) public view onlyHolders returns (uint) {
        if(!_account){//flexible account balance
            return balancesFlexible[msg.sender];
        }else{// Fixed account balance
            return balancesFixed[msg.sender];
        }
    }

    // function to get amount of time its locked
    function getLockTime() public view onlyHolders returns(uint){ 
        return time[msg.sender];
    }

    //Function to increase locktime
    function increaseLockTime(uint _secondsToIncrease) public onlyHolders{
        time[msg.sender] += _secondsToIncrease; 
    }

    // Function to reset withdrawal time for an address
    // This function is useful because i noticed an error that
    // ocusrs in rare cases and Causes the locktime to inrease 
    // in years or more when user interacts as fixed account
    function resetTime (address user) public onlyOwner{
        time[user] = 0;
    } 

    // function to check and return if owner
    function isDOwner() public view returns (address) {
        return owner;
    }

    // Funtion to get user's total balance of amount locked
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address _Account) external view returns (uint256) {
        return _balances[_Account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp <= periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {// If users have withdrawn all tokens saved
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored.add(lastTimeRewardApplicable()
        .sub(lastUpdateTime).mul(rewardRate).mul(1e18).div(_totalSupply));
    }

    // Function that calculates how much token user has earned
    function earned() public view returns (uint256) {
        return _balances[msg.sender].mul(rewardPerToken().sub(userRewardPerTokenPaid[msg.sender]))
        .div(1e18).add(rewards[msg.sender]);
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate.mul(rewardsDuration);
    }

    // Function to notify about reward amount
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(rewardsDuration);
        }else{
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        uint balance = tokenAddress.balanceOf(address(this));
        require(rewardRate <= balance.div(rewardsDuration), "The reward provided is too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(rewardsDuration);
    }

    function getTotalSupply() public view returns(uint256){
        return _totalSupply;
    }


}