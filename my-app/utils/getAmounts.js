import { Contract, ContractFactory } from "ethers";
import { EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI } from "../constants";

// function that to get the MATIC balance of contract of user
export const getMaticBalance = async (provider, address, contract = false) => {
    try {
        if(contract){// Check contract balance
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            return balance;
        }else{
            const balance = await provider.getBalance(address);
            return balance;
        }
    } catch (error) {
        console.error(error);
        return 0;
    }
};

// function to get balance of token from user
export const getAKWTokensBalance = async (provider, address) => {
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
            );
            const balanceOfAkawoTokens = await tokenContract.balanceOf(address);
            return balanceOfAkawoTokens;
    } catch (error) {
        console.error(error);
    }
};

// function to get user's lp token balance
export const getLPTokensBalance = async (provider, address) => {
    try {
        const exchange = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const balanceOfLPTokens = await exchange.balanceOf(address);
        return balanceOfLPTokens;
    } catch (error) {
        console.error(error);
    }
};

// function to get amount of tokens in contract
export const getReserveOfAKWTokens = async (provider) => {
    try {
        const exchange = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const reserve = await exchange.getReserve();
        return reserve;
    } catch (error) {
        console.error(error);
    }
};