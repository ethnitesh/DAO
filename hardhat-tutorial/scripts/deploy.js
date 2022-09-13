const {ethers} = require("hardhat");
require("dotenv").config({path: ".env"});
const {CRYPTO_DEVS_NFT_CONTRACT_ADDRESS} = require("../constants");
async function main() {
const FakeNFTMarketplace = await ethers.getContractFactory("FakeNFTMarketplace");

const fakeNFTMarketplace = await FakeNFTMarketplace.deploy();
await fakeNFTMarketplace.deployed();
console.log("CryptoDevs Token Contract address", fakeNFTMarketplace.address );


const CryptoDevsDAO = await ethers.getContractFactory("CryptoDevsDAO");
const cryptoDevsDAO = await CryptoDevsDAO.deploy(fakeNFTMarketplace.address,CRYPTO_DEVS_NFT_CONTRACT_ADDRESS,{value: ethers.utils.parseEther("1")});
await cryptoDevsDAO.deployed();
console.log("CryptoDevsDAO deployed to:", cryptoDevsDAO.address);
}


main()
.then(() => process.exit(0))
.catch((error) =>{
  console.error(error);
  process.exit(1);
})
