import { Contract, utils } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI } from "../constants";

export const addLiquidity = async (signer, addAKWAmountWei, addMaticAmountWei)=>{
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            signer
        );
        const exchange = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        );
        // Approve tokens 
        let tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, addAKWAmountWei.toString());
        await tx.wait();//wait for transaction to be mined
        // Add liquidity
        tx = await exchange.addLiquidity(addAKWAmountWei, {value: addMaticAmountWei,});
        await tx.wait();
    } catch (error) {
        console.error(error);
    }
};

export const calculateAKW = async (
    _addMatic = "0", 
    maticBalanceContract, 
    akwTokenReserve
) => {
    const _addMaticAmountWei = utils.parseEther(_addMatic);
    // amount of AKW token to be added for each MATIC
    const akawoTokenAmount = _addMaticAmountWei.mul(akwTokenReserve).div(maticBalanceContract);
    return akawoTokenAmount;
};