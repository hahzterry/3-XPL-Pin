const { ethers } = require("ethers");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const contractAddress = "0xB10d640B74016ed2b8E1f59CA931467D16534D08";
  
  console.log("Activating minting for Gen-Plasma NFT...");
  console.log("Contract address:", contractAddress);

  // Connect to Plasma network
  const provider = new ethers.JsonRpcProvider("https://rpc.plasma.to");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Contract ABI (just the functions we need)
  const contractABI = [
    "function mintingActive() view returns (bool)",
    "function toggleMinting()",
    "function mintPrice() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function MAX_SUPPLY() view returns (uint256)"
  ];
  
  // Connect to contract
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  try {
    // Check current minting status
    const mintingActive = await contract.mintingActive();
    console.log("Current minting status:", mintingActive);
    
    if (!mintingActive) {
      console.log("Activating minting...");
      const tx = await contract.toggleMinting();
      console.log("Transaction hash:", tx.hash);
      
      // Wait for confirmation
      console.log("Waiting for confirmation...");
      await tx.wait();
      console.log("✅ Minting activated successfully!");
    } else {
      console.log("✅ Minting is already active!");
    }
    
    // Verify final status
    const finalStatus = await contract.mintingActive();
    console.log("Final minting status:", finalStatus);
    
    // Display contract info
    const totalSupply = await contract.totalSupply();
    const mintPrice = await contract.mintPrice();
    const maxSupply = await contract.MAX_SUPPLY();
    
    console.log("\n📊 Gen-Plasma Contract Status:");
    console.log("- Total Supply:", totalSupply.toString());
    console.log("- Mint Price:", ethers.formatEther(mintPrice), "XPL");
    console.log("- Max Supply:", maxSupply.toString());
    console.log("- Minting Active:", finalStatus);
    console.log("\n🎉 Gen-Plasma is ready for minting!");
    console.log("🌐 Visit: https://gen-plasma.com");
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error:", errorMessage);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
