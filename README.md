# Akawo
A decentralized Bank.
## Tech Stack
- **Solidity**  - for the Smart Contract
- **Hardhat** - for the Smart Contract development and testing
- **ethersJs** - ethers used for integrating the Smart contract and the frontend
- **Nextjs** - Nextjs used for the frontend
## Usage
- Users connect wallet before accessing the dapp.
- Users must hold at least 1 AKW tokens before utilizing the platform, by using the trade tab and swapping for AKW tokens.
- Users choose to use fixed or flexible savings. Fixed savings locks up the user tokens for sometime but flexible can be
withdrawn at will.
- There is withdrawal fee which are paid by users when trying to withdraw from a flexible savings account, but no fee
if it is a fixed account. The withdrawal fee is 0.1% of value of tokens (in usdt) been withdrawn. This fee is paid 
using AKW.
- The fee from withdrawals are used to buy back AKW tokens every quarter.
- Users use the swap tab to add Liquidity, or swap their (BTC, ETH and MATIC) for AKW tokens or swap AKW Tokens for (BTC, ETH and MATIC).
- There is a trading fee of 1% on each swap, this fee is distributed among those that added liquidity for the pair.
- Users earn by showing activeness on the platform every 24 hours by clicking on 'Earn Akawo' button in the Earn tab.
- At the end of each 24 hours, the withdraw button would appear so users can withdraw earned tokens.
- The reward Rate is not same for fixed and flexible saving. Fixed savings users earns more than flexible account savers.
## Host
The Dapp was hosted on https://akawo.vercel.app/
