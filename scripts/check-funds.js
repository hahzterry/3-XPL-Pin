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

  console.log("📊 Gen-Plasma Fund Status");
  console.log("==========================");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const contractABI = [
    "function owner() view returns (address)",
    "function totalSupply() view returns (uint256)",
    "function mintPrice() view returns (uint256)",
    "function mintingActive() view returns (bool)",
    "function MAX_SUPPLY() view returns (uint256)"
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  try {
    // Get contract info
    const owner = await contract.owner();
    const totalSupply = await contract.totalSupply();
    const mintPrice = await contract.mintPrice();
    const mintingActive = await contract.mintingActive();
    const maxSupply = await contract.MAX_SUPPLY();
    
    // Get balances
    const contractBalance = await provider.getBalance(contractAddress);
    const walletBalance = await provider.getBalance(wallet.address);
    
    console.log("🏦 Contract Information:");
    console.log("- Contract Address:", contractAddress);
    console.log("- Owner Address:", owner);
    console.log("- Your Wallet:", wallet.address);
    console.log("- You are owner:", owner.toLowerCase() === wallet.address.toLowerCase() ? "✅ Yes" : "❌ No");
    
    console.log("\n💰 Financial Summary:");
    console.log("- Contract Balance:", ethers.formatEther(contractBalance), "XPL");
    console.log("- Your Wallet Balance:", ethers.formatEther(walletBalance), "XPL");
    console.log("- Mint Price:", ethers.formatEther(mintPrice), "XPL per NFT");
    
    console.log("\n📈 Collection Statistics:");
    console.log("- Total Minted:", totalSupply.toString(), "NFTs");
    console.log("- Max Supply:", maxSupply.toString(), "NFTs");
    console.log("- Minting Status:", mintingActive ? "🟢 Active" : "🔴 Inactive");
    console.log("- Progress:", `${totalSupply}/${maxSupply} (${((Number(totalSupply) / Number(maxSupply)) * 100).toFixed(1)}%)`);
    
    console.log("\n💵 Revenue Analysis:");
    const expectedRevenue = BigInt(totalSupply) * mintPrice;
    console.log("- Expected Revenue:", ethers.formatEther(expectedRevenue), "XPL");
    console.log("- Actual Balance:", ethers.formatEther(contractBalance), "XPL");
    
    if (contractBalance > 0n) {
      console.log("- Available to Withdraw:", ethers.formatEther(contractBalance), "XPL");
      console.log("\n💡 To withdraw funds, run: npm run withdraw-funds");
    } else {
      console.log("- No funds available to withdraw");
    }
    
    console.log("\n🔗 Useful Links:");
    console.log("- Contract Explorer:", `https://plasmascan.to/address/${contractAddress}`);
    console.log("- Your Wallet Explorer:", `https://plasmascan.to/address/${wallet.address}`);
    console.log("- Gen-Plasma Site:", "https://gen-plasma.com");
    
  } catch (error) {
    console.error("❌ Error checking funds:", error);
  }
}

main().catch(console.error);
