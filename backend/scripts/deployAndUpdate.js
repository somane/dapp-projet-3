// Script combiné pour déployer et mettre à jour le frontend

const { ethers } = require("hardhat")
const { updateFrontend } = require('./updateFrontend')

async function deployAndUpdate() {
  console.log('🚀 Déploiement et mise à jour complète...')

  try {
    // Exécuter le script de déploiement
    console.log('1️⃣ Déploiement du contrat...')
    await require('./deploy.js')

    // Attendre un peu pour s'assurer que les fichiers sont écrits
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mettre à jour le frontend
    console.log('2️⃣ Mise à jour du frontend...')
    await updateFrontend()

    console.log('🎉 Déploiement et mise à jour terminés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du processus:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  deployAndUpdate()
}

module.exports = { deployAndUpdate }