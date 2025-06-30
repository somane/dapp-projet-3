'use client'

import { useState } from 'react'
import { useVoting } from '@/hooks/useVoting'
import { WorkflowStatus } from '@/config/web3'
import { DocumentTextIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function VoterPanel() {
  const {
    workflowStatus,
    voterInfo,
    proposals,
    addProposal,
    setVote,
    hasVoted,
    isLoading
  } = useVoting()

  const [newProposal, setNewProposal] = useState('')

  const handleAddProposal = async () => {
    if (!newProposal.trim()) return
    try {
      await addProposal(newProposal.trim())
      setNewProposal('')
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la proposition:', error)
    }
  }

  const handleVote = async (proposalId: number) => {
    try {
      await setVote(proposalId)
    } catch (error) {
      console.error('Erreur lors du vote:', error)
    }
  }

  const canAddProposal = workflowStatus === WorkflowStatus.ProposalsRegistrationStarted
  const canVote = workflowStatus === WorkflowStatus.VotingSessionStarted && !hasVoted

  return (
    <div className="space-y-6">
      {/* Statut de l'électeur */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Mon statut d'électeur</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Électeur enregistré</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${hasVoted ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>{hasVoted ? 'Vote exprimé' : 'Vote non exprimé'}</span>
          </div>
        </div>
        
        {hasVoted && voterInfo && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Vous avez voté pour la proposition #{Number(voterInfo.votedProposalId)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ajouter une proposition */}
      {canAddProposal && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Ajouter une proposition
          </h3>
          <div className="space-y-3">
            <textarea
              value={newProposal}
              onChange={(e) => setNewProposal(e.target.value)}
              placeholder="Décrivez votre proposition (max 200 caractères)..."
              maxLength={200}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {newProposal.length}/200 caractères
              </span>
              <button
                onClick={handleAddProposal}
                disabled={!newProposal.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voter */}
      {canVote && proposals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Choisir une proposition</h3>
          <div className="space-y-3">
            {proposals.map((proposal, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      Proposition #{index}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{proposal.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleVote(index)}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Voter pour cette proposition
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages d'information */}
      {!canAddProposal && !canVote && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="text-blue-800">
            {workflowStatus === WorkflowStatus.RegisteringVoters && (
              <p>En attente du début de l'enregistrement des propositions...</p>
            )}
            {workflowStatus === WorkflowStatus.ProposalsRegistrationEnded && (
              <p>L'enregistrement des propositions est terminé. En attente du début du vote...</p>
            )}
            {workflowStatus === WorkflowStatus.VotingSessionEnded && (
              <p>La session de vote est terminée. En attente des résultats...</p>
            )}
            {workflowStatus === WorkflowStatus.VotesTallied && (
              <p>Les votes ont été comptabilisés. Consultez l'onglet Résultats.</p>
            )}
            {hasVoted && workflowStatus === WorkflowStatus.VotingSessionStarted && (
              <p>Vous avez déjà voté. Merci pour votre participation !</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}