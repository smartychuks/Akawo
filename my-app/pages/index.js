import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, AKAWO_CONTRACT_ADDRESS, AKAWO_CONTRACT_ABI } from "../constants";


export default function Home (){

  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [addressBalance, setAddressBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const web3ModalRef = useRef();

  // Function to connect to the wallet
  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(error){
      console.log(error);
    }
  }

  // Function to determine if wallet nedd singing or not
  // and also connected to the metamask wallet
  const getProviderOrSigner = async (needSigner=false) => {
    // Connect to metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // check if user connected to mumbai
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001){
      window.alert("Please Switch to mumbai network");
      throw new Error("Change the network to mumbai");
    }

    if (needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        cacheProvider: true,
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
      getBalance()
    }
  }, [walletConnected]);

  // Function to deposit ERC20 token to contract
  const deposit = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const akawoContract = new Contract(
        AKAWO_CONTRACT_ADDRESS, 
        AKAWO_CONTRACT_ABI, 
        signer
        );
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, 
        TOKEN_CONTRACT_ABI, 
        signer
        );

      let tx;
      // Aprove the contract to access user's token
      tx = await tokenContract.approve(
        AKAWO_CONTRACT_ADDRESS, 
        depositAmount.toString()
        );      
      setLoading(true);
      await tx.wait()//wait for transaction to be mined
      setLoading(false);
      tx = await akawoContract.deposit(
        depositAmount.toString(), 
        TOKEN_CONTRACT_ADDRESS
        );
      setLoading(true);
      await tx.wait();
      await getBalance();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  }

  // Function to withdraw tokens
  const withdraw = async()=>{
    try {
      const signer = await getProviderOrSigner(true);
      const akawoContract = new Contract(
        AKAWO_CONTRACT_ADDRESS, 
        AKAWO_CONTRACT_ABI, 
        signer
        );

        console.log(withdrawAmount);

      let tx = await akawoContract.withdraw(
        withdrawAmount.toString(), 
        TOKEN_CONTRACT_ADDRESS
        );
      setLoading(true);
      await tx.wait();
      await getBalance();
      setLoading(false);      
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  }

  // Function to get the Balance
  const getBalance = async()=> {
    try {
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      setConnectedAddress(address);
      const akawoContract = new Contract(
        AKAWO_CONTRACT_ADDRESS, 
        AKAWO_CONTRACT_ABI, 
        signer
      );
      let bal = await akawoContract.getBalances();
      // convert from wei to user readable format
      bal = utils.formatEther(bal);
      setAddressBalance(bal);
      return addressBalance;
    } catch (error) {
      console.error(error);
    }
  }

  // function that disconnects wallet
  const onDisconnect = async () => {
    try {
      await getProviderOrSigner();
      await web3ModalRef.current.clearCachedProvider();
      setWalletConnected(false);
      console.log("walletConnected is ",walletConnected);
    } catch (error) {
      console.error(error);
    }
  }

  // Function to show loading animation
  const isLoading = () => (
    <div className={styles.loading}>
      <h6 className={styles.description}>This may take few seconds (-_-)</h6>
    </div>
  );

  // function to render content if wallet is connected
  const renderConnect = () => {
    if(walletConnected && !loading){
      return(
        <div>
          <div className={styles.description}>
            <strong>Wallet Address Connected:</strong> {connectedAddress}
            <br /><br />
            <strong>Total Amount in Account:</strong> {addressBalance}
            <br />
            <label>
              Deposit:
              <input id="deposit" type="number" placeholder="Amount of Tokens"
              onChange={(e) => setDepositAmount(utils.parseEther(e.target.value || "0"))}
              className={styles.input} />
              <button className={styles.button} onClick={deposit}>Close Vault</button>
            </label>
            <br /><br />
            <label>
              Withdraw:
              <input id="withdraw" type="number" placeholder="Amount of Tokens"
              onChange={(e) => setWithdrawAmount(utils.parseEther(e.target.value || "0"))}
              className={styles.input} />
              <button className={styles.button} onClick={withdraw}>
                Open Vault
              </button>
            </label>
            <button className={styles.button} onClick={onDisconnect}>
              Log out
            </button>
            <br /> <br />
          </div>
        </div>
      );
    };
  };

  // Render content if not connected
  const renderOnDisconnect = () => (
    <button onClick={connectWallet} className={styles.button}>
      Sign up / Sign in
    </button>
  );

  return(
    <div>
      <Head>
        <title>Akawo</title>
        <meta name="description" content="Decentralised Bank" />
        <link rel="icon" href="#" />
      </Head>
      <div className={styles.main}>
        <div className={styles.body}>
          <h1 className={styles.title}>Akawo</h1>


        </div>
        <div className={styles.description}>
          Akawo, is a Decentralised Bank. Where you save funds to earn.
        </div>
        <div className={styles.description}>
          {walletConnected ? renderConnect() : renderOnDisconnect()}
        </div>
        <br /><br />
        {loading == true ? isLoading() : null}
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by <a href="https://twitter.com/goldenchuks4" target="_blank" rel="noreferrer">@iSmarty</a>
      </footer>

    </div>
  );

}