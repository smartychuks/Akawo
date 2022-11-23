import { Contract } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from "../constants";

// function to determine the amount of MATCI/AKW tokens to be
// Recieved when the user swaps
export const getAmountOfTokensReceivedFromSwap = async (
    _swapAmountWei, 
    provider, 
    maticSelected,
    reservedAKW
) => {
    const exchange = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );
    let amountOfTokens;

    if(maticSelected) {
        amountOfTokens = await exchange.getAmountOfTokens(
            _swapAmountWei, maticBalance, reservedAKW
        );
    }else{
        amountOfTokens = await exchange.getAmountOfTokens(
            _swapAmountWei, reservedAKW, maticBalance
        );
    }

    return amountOfTokens;
};

// function to swap ETH/AKW tokens
export const swapTokens = async (
    signer, 
    swapAmountWei, 
    tokenToBeReceivedAfterSwap, 
    maticSelected
) => {
    const exchange = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
    );
    let tx;
    if(maticSelected) {
        tx = await exchange.maticToAkowoToken(
            tokenToBeReceivedAfterSwap, 
            { value: swapAmountWei, }
        );
    }else{
        tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, swapAmountWei.toString());
        await tx.wait();
        tx = await exchange.akawoTokenToMatic(swapAmountWei, tokenToBeReceivedAfterSwap);
    }
    await tx.wait();//wait for transaction to be mined
}