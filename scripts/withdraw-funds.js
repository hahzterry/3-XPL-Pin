require('dotenv').config({ path: '.env.local' });
const { ethers } = require("ethers");

async function main() {
  const contractAddress = "0xB10d640B74016ed2b8E1f59CA931467D16534D08"; // Your Gen-Plasma contract
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = "https://rpc.plasma.to";

  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env.local");
    process.exit(1);
  }

  console.log("🎯 Gen-Plasma Fund Withdrawal");
  console.log("===============================");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const contractABI = [
    "function withdraw() external",
    "function owner() view returns (address)",
    "function totalSupply() view returns (uint256)",
    "function mintPrice() view returns (uint256)"
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  try {
    // Check if you're the owner
    const owner = await contract.owner();
    console.log("📋 Contract owner:", owner);
    console.log("💰 Your wallet:", wallet.address);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error("❌ You are not the contract owner!");
      process.exit(1);
    }

    // Check contract balance
    const contractBalance = await provider.getBalance(contractAddress);
    const balanceInXPL = ethers.formatEther(contractBalance);
    
    console.log("📊 Contract Statistics:");
    console.log("- Contract Address:", contractAddress);
    console.log("- Contract Balance:", balanceInXPL, "XPL");
    
    if (contractBalance === 0n) {
      console.log("ℹ️  No funds to withdraw. Contract balance is 0 XPL.");
      process.exit(0);
    }

    // Get additional stats
    const totalSupply = await contract.totalSupply();
    const mintPrice = await contract.mintPrice();
    
    console.log("- Total NFTs Minted:", totalSupply.toString());
    console.log("- Mint Price:", ethers.formatEther(mintPrice), "XPL");
    console.log("- Expected Revenue:", ethers.formatEther(BigInt(totalSupply) * mintPrice), "XPL");

    // Check your wallet balance before withdrawal
    const walletBalanceBefore = await provider.getBalance(wallet.address);
    console.log("- Your Wallet Balance:", ethers.formatEther(walletBalanceBefore), "XPL");

    console.log("\n💸 Withdrawing funds...");
    
    // Execute withdrawal
    const tx = await contract.withdraw();
    console.log("📤 Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Check balances after withdrawal
    const contractBalanceAfter = await provider.getBalance(contractAddress);
    const walletBalanceAfter = await provider.getBalance(wallet.address);
    
    console.log("\n🎉 Withdrawal Successful!");
    console.log("===============================");
    console.log("📊 Final Balances:");
    console.log("- Contract Balance:", ethers.formatEther(contractBalanceAfter), "XPL");
    console.log("- Your Wallet Balance:", ethers.formatEther(walletBalanceAfter), "XPL");
    console.log("- Amount Withdrawn:", balanceInXPL, "XPL");
    
    console.log("\n🔗 Transaction Details:");
    console.log("- Hash:", tx.hash);
    console.log("- Explorer:", `https://plasmascan.to/tx/${tx.hash}`);
    
  } catch (error) {
    console.error("❌ Error during withdrawal:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    if (errorMessage.includes("No funds to withdraw")) {
      console.log("ℹ️  Contract has no funds to withdraw.");
    } else if (errorMessage.includes("Ownable: caller is not the owner")) {
      console.log("❌ Only the contract owner can withdraw funds.");
    } else {
      console.log("💡 Make sure you have enough XPL for gas fees.");
    }
  }
}

main().catch(console.error);
