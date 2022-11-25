import { Contract, providers, utils, BigNumber } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS } from "../constants";

export const removeLiquidity = async (signer, removeLPTokensWei) => {
    const exchange = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tx = await exchange.removeLiquidity(removeLPTokensWei);
    await tx.wait();
};

// function to calculate the amount of TOkens and MATIC to return to user
//after liquidity is removed
export const getTokensAfterRemove = async (
    provider,
    removeLPTokenWei,
    _maticBalance,
    akawoTokenReserve
) => {
    try {
        const exchange = new Contract(
            EXCHANGE_CONTRACT_ADDRESS, 
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const _totalSupply = await exchange.totalSupply();
        //number of MAtic to give the user
        const _removeMatic = _maticBalance.mul(removeLPTokenWei).div(_totalSupply);
        //number of tokens to return to the user
        const _removeAKW = akawoTokenReserve.mul(removeLPTokenWei).div(_totalSupply);
        
        return{_removeMatic, _removeAKW};
    } catch (error) {
        console.error(error);
    }
};

