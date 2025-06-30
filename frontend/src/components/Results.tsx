'use client'

import { useVoting } from '@/hooks/useVoting'
import { TrophyIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function Results() {
  const { 
    proposals, 
    winner, 
    winningProposalID, 
    votersCount 
  } = useVoting()

  const totalVotes = proposals.reduce((sum, proposal) => sum + Number(proposal.voteCount), 0)
  const sortedProposals = [...proposals]
    .map((proposal, index) => ({ ...proposal, originalIndex: index }))
    .sort((a, b) => Number(b.voteCount) - Number(a.voteCount))

  return (
    <div className="space-y-6">
      {/* Résultat principal */}
      {winner && winningProposalID !== undefined && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrophyIcon className="h-8 w-8 text-yellow-600" />
            <h2 className="text-2xl font-bold text-yellow-800">Proposition Gagnante</h2>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-900 mb-2">
                  Proposition #{winningProposalID}
                </div>
                <p className="text-gray-700 mb-3">{winner.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    {Number(winner.voteCount)} votes
                  </span>
                  <span>
                    {totalVotes > 0 ? ((Number(winner.voteCount) / totalVotes) * 100).toFixed(1) : 0}% des votes
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold text-lg">
                  🏆 Gagnant
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{proposals.length}</div>
          <div className="text-sm text-gray-600">Propositions</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{totalVotes}</div>
          <div className="text-sm text-gray-600">Votes exprimés</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{votersCount}</div>
          <div className="text-sm text-gray-600">Électeurs inscrits</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {votersCount > 0 ? ((totalVotes / votersCount) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">Participation</div>
        </div>
      </div>

      {/* Classement détaillé */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Classement complet
        </h3>
        
        <div className="space-y-4">
          {sortedProposals.map((proposal, rank) => {
            const percentage = totalVotes > 0 ? (Number(proposal.voteCount) / totalVotes) * 100 : 0
            const isWinner = proposal.originalIndex === winningProposalID
            
            return (
              <div
                key={proposal.originalIndex}
                className={`border rounded-lg p-4 ${
                  isWinner 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`text-2xl font-bold ${
                        rank === 0 ? 'text-yellow-600' : 
                        rank === 1 ? 'text-gray-500' : 
                        rank === 2 ? 'text-orange-600' : 'text-gray-400'
                      }`}>
                        #{rank + 1}
                      </span>
                      <div className="font-semibold text-gray-900">
                        Proposition #{proposal.originalIndex}
                        {isWinner && <span className="ml-2">🏆</span>}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{proposal.description}</p>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        {Number(proposal.voteCount)} votes ({percentage.toFixed(1)}%)
                      </span>
                      
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isWinner ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}