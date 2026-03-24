const hre = require("hardhat");

async function main() {
  console.log("Deploying PlasmaNFT to Plasma Mainnet...");

  // Debug environment variables
  console.log("Private key exists:", !!process.env.PRIVATE_KEY);
  console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL);

  // Get the ContractFactory and Signers here.
  const signers = await hre.ethers.getSigners();
  console.log("Number of signers:", signers.length);
  
  if (signers.length === 0) {
    throw new Error("No signers available. Check your PRIVATE_KEY in .env.local");
  }
  
  const [deployer] = signers;
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const PlasmaNFT = await hre.ethers.getContractFactory("PlasmaNFT");
  const plasmaNFT = await PlasmaNFT.deploy(
    "Gen-Plasma Collection", // name - Updated to Gen-Plasma
    "GENPLASMA", // symbol - Updated to GENPLASMA
    process.env.NEXT_PUBLIC_BASE_URL ? 
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/metadata/` : 
      "https://gen-plasma.com/api/metadata/" // baseTokenURI
  );

  // Wait for deployment to complete
  await plasmaNFT.waitForDeployment();

  const contractAddress = await plasmaNFT.getAddress();
  console.log("Gen-Plasma NFT deployed to:", contractAddress);
  
  // Get deployment transaction
  const deploymentTx = plasmaNFT.deploymentTransaction();
  console.log("Transaction hash:", deploymentTx.hash);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await deploymentTx.wait(6);

  console.log("Contract deployed and confirmed!");
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
    timestamp: new Date().toISOString()
  };

  console.log("Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
