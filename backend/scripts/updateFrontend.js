// Script pour mettre à jour automatiquement le frontend après déploiement

const fs = require('fs')
const path = require('path')

async function updateFrontend() {
  console.log('🔄 Mise à jour du frontend...')

  try {
    // Chemin vers les fichiers de déploiement
    const deploymentsDir = path.join(__dirname, '../deployments')
    const frontendContractsDir = path.join(__dirname, '../../frontend/src/contracts')

    // Vérifier que le dossier deployments existe
    if (!fs.existsSync(deploymentsDir)) {
      console.error('❌ Dossier deployments non trouvé. Déployez d\'abord le contrat.')
      process.exit(1)
    }

    // Trouver le fichier de déploiement le plus récent
    const deploymentFiles = fs.readdirSync(deploymentsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(deploymentsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)

    if (deploymentFiles.length === 0) {
      console.error('❌ Aucun fichier de déploiement trouvé.')
      process.exit(1)
    }

    const latestDeployment = deploymentFiles[0].name
    console.log(`📄 Fichier de déploiement: ${latestDeployment}`)

    // Lire les informations de déploiement
    const deploymentData = JSON.parse(
      fs.readFileSync(path.join(deploymentsDir, latestDeployment), 'utf8')
    )

    // Lire l'ABI du contrat compilé
    const artifactPath = path.join(__dirname, '../artifacts/contracts/Voting.sol/Voting.json')
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ Artifact du contrat non trouvé. Compilez d\'abord le contrat.')
      process.exit(1)
    }

    const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))

    // Créer le dossier contracts dans le frontend si nécessaire
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true })
    }

    // Créer le fichier de configuration pour le frontend
    const frontendConfig = {
      contractAddress: deploymentData.contractAddress,
      abi: contractArtifact.abi,
      network: deploymentData.network,
      deployer: deploymentData.deployer,
      blockNumber: deploymentData.blockNumber,
      transactionHash: deploymentData.transactionHash,
      timestamp: deploymentData.timestamp
    }

    // Sauvegarder dans le frontend
    const outputPath = path.join(frontendContractsDir, 'Voting.json')
    fs.writeFileSync(outputPath, JSON.stringify(frontendConfig, null, 2))

    console.log('✅ Configuration du contrat mise à jour dans le frontend')
    console.log(`📍 Adresse: ${deploymentData.contractAddress}`)
    console.log(`🌐 Réseau: ${deploymentData.network}`)
    console.log(`💾 Fichier: ${outputPath}`)

    // Mettre à jour le fichier .env.local du frontend si possible
    const envPath = path.join(__dirname, '../../frontend/.env.local')
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8')
      
      // Mettre à jour l'adresse du contrat
      const contractAddressRegex = /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/
      if (contractAddressRegex.test(envContent)) {
        envContent = envContent.replace(
          contractAddressRegex, 
          `NEXT_PUBLIC_CONTRACT_ADDRESS=${deploymentData.contractAddress}`
        )
      } else {
        envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${deploymentData.contractAddress}\n`
      }

      fs.writeFileSync(envPath, envContent)
      console.log('✅ Fichier .env.local mis à jour')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message)
    process.exit(1)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  updateFrontend()
}

module.exports = { updateFrontend }