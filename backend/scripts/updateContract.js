// Script pour vérifier et mettre à jour la configuration du contrat

const fs = require('fs')
const path = require('path')

function updateContract() {
  console.log('🔍 Vérification de la configuration du contrat...')

  const contractFile = path.join(__dirname, '../src/contracts/Voting.json')
  const envFile = path.join(__dirname, '../.env.local')

  // Vérifier que le fichier du contrat existe
  if (!fs.existsSync(contractFile)) {
    console.error('❌ Fichier de contrat non trouvé.')
    console.log('💡 Suggestion: Exécutez le déploiement du contrat et le script updateFrontend.js')
    process.exit(1)
  }

  // Lire la configuration du contrat
  const contractConfig = JSON.parse(fs.readFileSync(contractFile, 'utf8'))
  console.log('✅ Configuration du contrat trouvée')
  console.log(`📍 Adresse: ${contractConfig.contractAddress}`)
  console.log(`🌐 Réseau: ${contractConfig.network}`)

  // Vérifier le fichier .env.local
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8')
    const contractAddressMatch = envContent.match(/NEXT_PUBLIC_CONTRACT_ADDRESS=(.*)/)
    
    if (contractAddressMatch) {
      const envAddress = contractAddressMatch[1].trim()
      if (envAddress === contractConfig.contractAddress) {
        console.log('✅ Variables d\'environnement synchronisées')
      } else {
        console.log('⚠️  Adresse dans .env.local différente de celle du contrat')
        console.log(`   .env.local: ${envAddress}`)
        console.log(`   Contrat:    ${contractConfig.contractAddress}`)
      }
    } else {
      console.log('⚠️  NEXT_PUBLIC_CONTRACT_ADDRESS non trouvée dans .env.local')
    }
  } else {
    console.log('⚠️  Fichier .env.local non trouvé')
  }

  // Vérifier que l'ABI existe et est valide
  if (contractConfig.abi && Array.isArray(contractConfig.abi)) {
    console.log(`✅ ABI valide avec ${contractConfig.abi.length} fonctions/événements`)
  } else {
    console.error('❌ ABI manquante ou invalide')
    process.exit(1)
  }

  console.log('🎉 Configuration vérifiée avec succès!')
}

if (require.main === module) {
  updateContract()
}

module.exports = { updateContract }