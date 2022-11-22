import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, AKAWO_CONTRACT_ADDRESS, AKAWO_CONTRACT_ABI } from "../constants";


export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [addressBalance, setAddressBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [accountType, setAccountType] = useState(false);
  const [withdrawDate, setWithdrawDate] = useState("");
  const [unixWithdrawDate, setUnixWithdrawDate] = useState("");
  const [extendTime, setExtendTime] = useState("");
  const [isAccount, setIsAccount] = useState(true);
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

  // Function to determine if wallet need singing or not
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
    }
  }, [walletConnected, accountType]);

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
        if(accountType){// For flexible account
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
        //await getLockTime();
        setLoading(false);
      }else{// For fixed account
        let tx;
        // Aprove the contract to access user's token
        tx = await tokenContract.approve(
          AKAWO_CONTRACT_ADDRESS, 
          depositAmount.toString()
          );      
        setLoading(true);
        await tx.wait()//wait for transaction to be mined
        setLoading(false);
        //let tx2 = await akawoContract.setAcount(accountType);
        setLoading(true);
        //await tx2.wait();
        tx = await akawoContract.deposit(
          depositAmount.toString(), 
          TOKEN_CONTRACT_ADDRESS
          );                
        await tx.wait();        
        await getBalance();
        await getLockTime();
        setLoading(false);
      }
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

      // Check account type before withdrawal
      if (accountType){//for flexible
        let tx = await akawoContract.withdraw(
          withdrawAmount.toString(), 
          TOKEN_CONTRACT_ADDRESS
          );        
        setLoading(true);
        await tx.wait();
        await getBalance();
        // setWithdrawDate("Not available") if balance empty
        if(addressBalance <= 0){
          setWithdrawDate("Not Available");
        }
        setLoading(false); 
      }else{// for fixed account
        // Check if its time to withdraw
        if(unixWithdrawDate > Date.now()/1000){
          alert("You can only withdraw after funds has been unlocked")
        }else{
          let tx = await akawoContract.withdraw(
            withdrawAmount.toString(), 
            TOKEN_CONTRACT_ADDRESS
            );        
          setLoading(true);
          await tx.wait();
          await getBalance();
          await getLockTime();
          // setWithdrawDate("Not available") if balance empty
          if(addressBalance <= 0){
            setWithdrawDate("Not Available");
            console.log("setWithdrawDate");
          }
          setLoading(false);
        }
      }   
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
      let bal = await akawoContract.getBalances(accountType);
      // convert from wei to user readable format
      bal = utils.formatEther(bal);
      setAddressBalance(bal);
      return addressBalance;
    } catch (error) {
      console.error(error);
    }
  }

  // Function to set account type
  const setAccount = async() =>{
    try {
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      setConnectedAddress(address);
      const akawoContract = new Contract(
        AKAWO_CONTRACT_ADDRESS, 
        AKAWO_CONTRACT_ABI, 
        signer
      );

      console.log(accountType);
      await akawoContract.setAcount(accountType);
      
      await getBalance();
    } catch (error) {
      console.error(error);
    }
  }

  // function to increase the funds are locked
  const increaseLockTime = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const akawoContract = new Contract(
        AKAWO_CONTRACT_ADDRESS, 
        AKAWO_CONTRACT_ABI, 
        signer
      );
      let newDate = extendTime.toString();
      newDate = new Date(newDate).getTime()/1000;
      if(newDate - unixWithdrawDate < 0){
        alert("The new Date set must be further ahead of previous Date");
      }else if(newDate - Date.now()/1000 < 0) {
        alert("New Date can not be in past")
      }else{
        newDate = newDate - unixWithdrawDate;
        const increaseTime = await akawoContract.increaseLockTime(newDate);
        setLoading(true);
        await increaseTime.wait();
        await getLockTime();
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // function that disconnects wallet not used yet
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

  //function to get date for withdrawal
  const getLockTime = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const akawoContract = new Contract(
        AKAWO_CONTRACT_ADDRESS, 
        AKAWO_CONTRACT_ABI, 
        signer
      );
      let withdrawDate = await akawoContract.getLockTime();
      setUnixWithdrawDate(withdrawDate.toString());
      withdrawDate = new Date (withdrawDate * 1000);
      setWithdrawDate(withdrawDate.toString());

      if(accountType){
        setWithdrawDate("Flexible account");
      }
    } catch (error) {
      console.error(error);
    }
  }

  // function to render content if wallet is connected
  const renderConnect = () => {
    if(walletConnected && isAccount){ 

      return(
        <div>
          <div className={styles.description}>
            <strong><a className={styles.descriptionlink} href="#" onClick={getLockTime}>Click here to check withdrawal Date: </a>  </strong> {withdrawDate}
            <br />
            <strong>Wallet Address Connected:</strong> {connectedAddress}
            <br />
            <strong>Total Amount in Account:</strong> {addressBalance}
            <br />
            <label className={styles.label}>
              Account:
              <select className={styles.select} name="dropdown" id="dropdown"
              onChange={async()=>{
                setLoading(true);
                setAccountType(!accountType);
                setAccount();
                getBalance();
                setLoading(false);
              }}>
                <option value="false">Fixed Account</option>
                <option value="true">Flexible Account</option>
              </select><br />
            </label>
            <label className={styles.label}>
              Deposit:
              <input id="deposit" type="number" placeholder="Amount of Tokens"
              onChange={(e) => setDepositAmount(utils.parseEther(e.target.value || "0"))}
              className={styles.input} />
              <button className={styles.button} onClick={deposit}>Close Vault</button>
            </label>
            <br /><br />
            <label className={styles.label}>
              Withdraw:
              <input id="withdraw" type="number" placeholder="Amount of Tokens"
              onChange={(e) => setWithdrawAmount(utils.parseEther(e.target.value || "0"))}
              className={styles.input} />
              <button className={styles.button} onClick={withdraw}>
                Open Vault
              </button>
            </label>
          </div>
        </div>
      );
    };
  };

  // function to render the input to extend locktime for fixed account
  const extendsTime = () => {
      if(isAccount){
        return(
          <label className={styles.label}>
            Set Custom lock Date: 
            <input type="datetime-local" id="withdraw" className={styles.input}
              onChange={(e) => setExtendTime(e.target.value || "0")} />
            <button className={styles.button} onClick={increaseLockTime}>
              Set / Extend Date
            </button>
          </label>
        )
      }
  }

  // Render content if not connected
  const renderOnDisconnect = () => {
    if(!walletConnected){
      <button onClick={connectWallet} className={styles.button}>
        Sign up / Sign in
      </button>
    ;
    }
  }

  return(
    <div>
      <Head>
        <title>Akawo</title>
        <meta name="description" content="Decentralised Bank" />
        <link rel="icon" href="#" />
      </Head>
      <div className={styles.main}>
        <div className={styles.body}>
          <div className={styles.nav}>
            <div className={styles.navheader}>
              <div className={styles.navtitle}>
                Akawo
              </div>
            </div>
            <div className={styles.navbtn}>
              <label for="nav-check">
                <span></span>
                <span></span>
                <span></span>
              </label>
            </div>
            <div className={styles.navlinks}>
              <ul>
                <li><a href="#" onClick={()=>setIsAccount(true)}>Account</a></li>
                <li><a href="#" onClick={()=>setIsAccount(false)}>Swap</a></li>
                
              </ul>
            </div>
          </div>

        </div>
        <div className={styles.description}>
          <p>Akawo, is a Decentralised Bank. Where you save funds to earn.</p>
          
          {walletConnected ? renderConnect() : renderOnDisconnect()}
          {walletConnected && !accountType ? extendsTime() : null }
          
        </div>
        {loading == true ? isLoading() : null}
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by <a href="https://twitter.com/goldenchuks4" target="_blank" rel="noreferrer"> @iSmarty</a>
      </footer>

    </div>
  );

}