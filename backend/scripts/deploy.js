// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Déploiement du contrat Voting...");

  // Obtenir le signataire (déployeur)
  const [deployer] = await ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);
  
  // Vérifier le solde
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Solde du compte:", ethers.formatEther(balance), "ETH");

  // Déployer le contrat
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  
  await voting.waitForDeployment();
  const contractAddress = await voting.getAddress();
  
  console.log("✅ Contrat Voting déployé à l'adresse:", contractAddress);
  console.log("🔗 Lien Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);

  // Sauvegarder les informations de déploiement
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: network.name,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    transactionHash: voting.deploymentTransaction().hash
  };

  // Créer le dossier deployments s'il n'existe pas
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Sauvegarder dans un fichier JSON
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Informations de déploiement sauvegardées dans:", deploymentFile);

  // Générer l'ABI pour le frontend
  const contractArtifact = await ethers.getContractFactory("Voting");
  const abi = contractArtifact.interface.formatJson();
  
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  const abiFile = path.join(frontendDir, "Voting.json");
  fs.writeFileSync(abiFile, JSON.stringify({
    contractAddress: contractAddress,
    abi: JSON.parse(abi)
  }, null, 2));
  console.log("📋 ABI sauvegardée pour le frontend:", abiFile);

  // Attendre quelques confirmations avant la vérification
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("⏳ Attente de confirmations avant vérification...");
    await voting.deploymentTransaction().wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contrat vérifié sur Etherscan");
    } catch (error) {
      console.log("❌ Erreur lors de la vérification:", error.message);
    }
  }

  console.log("\n🎉 Déploiement terminé avec succès!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement:", error);
    process.exit(1);
  });