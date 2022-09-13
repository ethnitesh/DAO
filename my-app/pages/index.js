import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import {Contract, providers,utils} from "ethers";
import {useRef,useEffect,useState  } from "react";
import Web3Modal from "web3modal";
import { CRYPTO_DEVS_NFT_Contract_Abi,CryptoDevsDAO_Contract_Abi,CryptoDevsDAO_Contract_Address,CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } from '../constants';
import { formatEther, id } from 'ethers/lib/utils';

// console.log("address",CryptoDevsDAO_Contract_Address,CRYPTO_DEVS_NFT_CONTRACT_ADDRESS );
export default function Home() {
  
  const[walletConnected, setWalletConnected]= useState(false);
  const[treasuryBalance,setTreasuryBalance] = useState("0");
  const[numProposalsInDAO, setNumProposalsInDAO] = useState("0");
  const[userNFTBalance, setUserNFTBalance] = useState("0");
  const[loading, setLoading] = useState(false);
  const[fakeNftTokenId, setFakeNftTokenId] = useState("");
  const[selectedTab,setSelectedTab] = useState(""); 
  const[proposals,setProposals] = useState([]);
  const web3ModalRef = useRef();

const connectWallet= async () => {
    try {
      await getSignerOrProvider();
      setWalletConnected(true);
    } catch (error) {
      console.error("connectWallet",error);
    } 
  };

 const getDAOTreasuryBalance = async () => {
  try {
    const provider = await getSignerOrProvider();
    // const contract = new Contract(CryptoDevsDAO_Contract_Address,CryptoDevsDAO_Contract_Abi,provider);
    const balance = await provider.getBalance(CryptoDevsDAO_Contract_Address);
    console.log("treasury balance",utils.formatEther(balance));

    setTreasuryBalance(balance.toString());
  } catch (error) {
    console.error("DaoTeasury",error);
  }
 } 

const getNumProposalsInDAO = async () => {
  try {
    const provider = await getSignerOrProvider();
    const contract = new Contract(CryptoDevsDAO_Contract_Address,CryptoDevsDAO_Contract_Abi,provider);
    const Proposal= await contract.numProposals()
    setNumProposalsInDAO(Proposal.toString());
  } catch (error) {
    console.error("NumProposalsInDAO",error);
  }
 }
 
const getUserNFTBalance = async () => {
  try {
    const signer = await getSignerOrProvider(true);
    const contract = new Contract(CRYPTO_DEVS_NFT_CONTRACT_ADDRESS,CRYPTO_DEVS_NFT_Contract_Abi,signer);
    const NFTbalance = await contract.balanceOf(signer.getAddress());
    console.log("NFTbalance",parseInt(NFTbalance.toString()));
    setUserNFTBalance(parseInt(NFTbalance.toString()));
  } catch (error) {
    console.error("UserNFTBalance",error);
  }
}

 const createProposal = async () => {
  try {
    const signer = await getSignerOrProvider(true);
    const contract = new Contract(CryptoDevsDAO_Contract_Address,CryptoDevsDAO_Contract_Abi,signer);
    const txn = await contract.createProposal(fakeNftTokenId);
    setLoading(true);
    await txn.wait();
    await getNumProposalsInDAO();
    setLoading(false);
  } catch (error) {
    console.error("createProposal",error);
  }
}

const fetchProposalById = async(id) => {
  try {
    const provider = await getSignerOrProvider();
    const contract = new Contract(CryptoDevsDAO_Contract_Address,CryptoDevsDAO_Contract_Abi,provider);
    const proposal = await contract.proposals(id);
    
    const parsedProposal = {
      proposalId: id,
      nftTokenId: proposal.nftTokenId.toString(),
      deadline: new Date(parseInt(proposal.deadline.toString())*1000),
      yayVotes: proposal.yayVotes.toString(),
      nayVotes: proposal.nayVotes.toString(),
      executed: proposal.executed,
    }
    // console.log("proposals",{parseInt(parsedProposal)});
    return parsedProposal;
  } catch (error) {
    console.error("fetchProposalById",error);
  }
}

const fetchAllProposals = async() => {
  try {
    const proposals =[];
    for(let i=0; i<numProposalsInDAO; i++){
      const proposal = await fetchProposalById(i);
      proposals.push(proposal);
    }
    console.log("proposals",proposals);
    setProposals(proposals);
    return proposals;
  } catch (error) {
    console.error("fetchAllProposals",error);
  }
}

const voteOnProposal = async (proposalId, _vote) => {
  try {
    const signer = await getSignerOrProvider(true);
    const contract = new Contract(CryptoDevsDAO_Contract_Address,CryptoDevsDAO_Contract_Abi,signer);
     
    let vote = _vote === "YAY" ? 0:1;
    const txn = await contract.voteOnProposal(proposalId, vote);
    setLoading(true);
    await txn.wait();
    setLoading(false);
    await fetchAllProposals();
  } catch (error) {
    console.error("VoteOnProposal",error);
    window.alert(error.data.message);
  }
}

const executeProposal = async(proposalId) => {
  try {
    const signer = await getSignerOrProvider(true);
    const contract = new Contract(CryptoDevsDAO_Contract_Address,CryptoDevsDAO_Contract_Abi,signer);
    const txn = await contract.executeProposal(proposalId);
    setLoading(true);
    await txn.wait();
    setLoading(false);
    await fetchAllProposals();
  } catch (error) {
    console.error("executeProposal",error);
    window.alert(error.message);
  }
}

const getSignerOrProvider = async (needSigner = false) =>{
  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  const {chainId} = await web3Provider.getNetwork();
  if (chainId != 4) {
    window.alert("please switch the network to rinkeby");
    throw new Error ("please switch the network to rinkeby");
  }
  if (needSigner) {
    const signer = web3Provider.getSigner();
    return signer;
  }
  return web3Provider;
}

useEffect(() => {
  if (!walletConnected) {
    web3ModalRef.current= new Web3Modal({
      network: "rinkeby",
      providerOptions:{},
      disableInjectedProvider: false,
    })
    connectWallet().then(() => {
      getDAOTreasuryBalance();
      getUserNFTBalance();
      getNumProposalsInDAO();
    });
  }
}, [walletConnected]);

useEffect(() => {
if (selectedTab === "Create Proposals") {
  fetchAllProposals();
}

},[selectedTab]);

function renderTabs() {
 
  if (selectedTab === "Create Proposals") {
    return renderCreateProposalTab();
  }  else if (selectedTab === "View Proposals"){
    return renderViewProposalsTab();
  }
  return null;
}

function renderCreateProposalTab() {
  if (loading) {
    return(
      <div className={styles.description}>Loading... Waiting for transaction...</div>
    );
  }
  else if(userNFTBalance === 0) {
    return(
      <div className={styles.description}>
        you do not own any CryptoDevs NFTs.<br/>
        <b>You cannot create or vote on Proposals</b>
      </div>
    );
  }else{
    return(
      <div className={styles.container}>
        <lable>Fake NFT Token ID to purchase:</lable>
        <input 
        placeholder="0"
        type = "number"
        onChange ={(e) => setFakeNftTokenId(e.target.value)} />
        < button className ={styles.button2} onClick = {createProposal}> 
        Create
        </button>
      </div>
    );
  }
}

function renderViewProposalsTab() {
  if(loading) {
    return(
      <div className={styles.description}>
        loading... Waiting for transaction...
      </div>
    );
  }
  else if(proposals.length ===0){
   return(
    <div className={styles.description}>
      No proposals have been created
    </div>
   )
  }else{
    return(
      <div>
        {proposals.map((p,index) => (
          <div key={index} className={styles.proposalCard}>
            <p>Proposal ID: {p?.proposalId}</p>
            <p>Fake NFT to Purchase:{p?.nftTokenId}</p>
            <p>Deadline:{p?.deadline.toLocaleString()}</p>
            <p>Yay Votes: {p?.yayVotes}</p>
            <p>Nay Votes:{p?.nayVotes}</p>
            <p>Executed?:{p?.executed.toString()}</p>
             {p.deadline.getTime() > Date.now() && !p.executed ? (
              <div className={styles.flex}>
                <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId,"YAY")}>
                  Vote YAY
                </button>
                <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId,"NAY")}>
                  Vote NAY
                </button>
                </div>
             ):p.deadline.getTime()< Date.now() && !p.executed ?(
              <div className={styles.flex}>
                <button className={styles.button2} onClick = {()=> executeProposal(p.proposalId)}>
                  Execute Proposal{""}
                  {p.yayVotes > p.nayVotes ? "(YAY)":"(NAY)"}
                </button>
                </div>
             ):(
             <div className= {styles.description}>Proposal Executed</div>
             )}
             </div>
        ))}
      </div>
    );
  }
}
  return (
    <div className={styles.container}>
      <Head>
        <title>Nitesh first DAO web page</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

    <div className={styles.main}>
     <div>
      <h1 className={styles.title}>Welcome to Supreme 1st DAO WebPage</h1>
      <div className={styles.description}><h3>Welcome to the DAO!</h3></div>
      <div className={styles.description}> Your CryptoDevs NFT Balance : {userNFTBalance}<br/>
      Treasury Balance: {formatEther(treasuryBalance)} ETH<br/>
      Total Number of Proposals:{numProposalsInDAO}</div>
      <div className={styles.flex}>
        <button className={styles.button} onClick={() => setSelectedTab("Create Proposals")}>
          Create proposals
        </button>
        <button className={styles.button} onClick={() => setSelectedTab("View Proposals")}>
          View Proposals
        </button>   
          
      </div>
     {renderTabs()}
     </div>
    </div>

      <footer className={styles.footer}>
      </footer>
    </div>
  )
}
