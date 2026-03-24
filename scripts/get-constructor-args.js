const { ethers } = require("ethers");

async function main() {
  // The exact constructor arguments used in deployment
  const name = "Gen-Plasma Collection";
  const symbol = "GENPLASMA";
  const baseTokenURI = "https://gen-plasma.com/api/metadata/";
  
  console.log("Constructor Arguments:");
  console.log("1. name:", name);
  console.log("2. symbol:", symbol);
  console.log("3. baseTokenURI:", baseTokenURI);
  
  // ABI encode the constructor arguments
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedArgs = abiCoder.encode(
    ["string", "string", "string"],
    [name, symbol, baseTokenURI]
  );
  
  // Remove the '0x' prefix for Plasmascan
  const constructorArgs = encodedArgs.slice(2);
  
  console.log("\n=== FOR PLASMASCAN VERIFICATION ===");
  console.log("Constructor Arguments (ABI-encoded):");
  console.log(constructorArgs);
  
  console.log("\n=== VERIFICATION SETTINGS ===");
  console.log("Contract Name: PlasmaNFT");
  console.log("Compiler Version: v0.8.20+commit.a1b79de6");
  console.log("Optimization: Yes, 200 runs");
  console.log("License: MIT License (MIT)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
