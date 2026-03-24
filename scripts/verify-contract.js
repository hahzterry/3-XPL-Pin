const hre = require("hardhat");

async function main() {
  const contractAddress = process.argv[2];
  const constructorArgs = process.argv.slice(3);

  if (!contractAddress) {
    console.error("❌ Contract address is required");
    console.log("Usage: npx hardhat run scripts/verify-contract.js --network plasma <contractAddress> [constructorArgs...]");
    process.exit(1);
  }

  console.log(`🔍 Verifying contract at address: ${contractAddress}`);
  
  if (constructorArgs.length > 0) {
    console.log(`📝 Constructor arguments: ${constructorArgs.join(", ")}`);
  }

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    
    console.log(`✅ Contract verified successfully!`);
    console.log(`🌐 View on Plasmascan: https://plasmascan.to/address/${contractAddress}`);
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ Contract is already verified!`);
      console.log(`🌐 View on Plasmascan: https://plasmascan.to/address/${contractAddress}`);
    } else {
      console.error(`❌ Verification failed:`, error.message);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
