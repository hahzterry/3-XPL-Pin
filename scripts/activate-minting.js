const hre = require("hardhat");

async function main() {
  // Gen-Plasma NFT Contract on Plasma Mainnet
  const contractAddress = "0xB10d640B74016ed2b8E1f59CA931467D16534D08";
  
  console.log("Activating minting for Gen-Plasma NFT...");
  console.log("Contract address:", contractAddress);

  // Get the deployed contract
  const PlasmaNFT = await hre.ethers.getContractAt("PlasmaNFT", contractAddress);
  
  // Check current minting status
  const mintingActive = await PlasmaNFT.mintingActive();
  console.log("Current minting status:", mintingActive);
  
  if (!mintingActive) {
    console.log("Activating minting...");
    const tx = await PlasmaNFT.toggleMinting();
    console.log("Transaction hash:", tx.hash);
    
    // Wait for confirmation
    await tx.wait();
    console.log("✅ Minting activated successfully!");
  } else {
    console.log("✅ Minting is already active!");
  }
  
  // Verify final status
  const finalStatus = await PlasmaNFT.mintingActive();
  console.log("Final minting status:", finalStatus);
  
  // Display contract info
  const totalSupply = await PlasmaNFT.totalSupply();
  const mintPrice = await PlasmaNFT.mintPrice();
  const maxSupply = await PlasmaNFT.MAX_SUPPLY();
  
  console.log("\n📊 Contract Status:");
  console.log("- Total Supply:", totalSupply.toString());
  console.log("- Mint Price:", hre.ethers.utils.formatEther(mintPrice), "XPL");
  console.log("- Max Supply:", maxSupply.toString());
  console.log("- Minting Active:", finalStatus);
  console.log("\n🎉 Gen-Plasma is ready for minting!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
