'use client'

import { useVoting } from '@/hooks/useVoting'
import { WorkflowStatus } from '@/config/web3'
import { DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function ProposalsList() {
  const { proposals, workflowStatus } = useVoting()

  const showVoteCounts = workflowStatus >= WorkflowStatus.VotesTallied

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Propositions
        </h2>
        <div className="text-center py-8 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune proposition n'a encore été soumise</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Propositions ({proposals.length})
        </div>
        {showVoteCounts && (
          <div className="flex items-center text-sm text-gray-600">
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Votes visibles
          </div>
        )}
      </h2>
      
      <div className="space-y-4">
        {proposals.map((proposal, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-2">
                  Proposition #{index}
                </div>
                <p className="text-gray-600">{proposal.description}</p>
              </div>
              
              {showVoteCounts && (
                <div className="ml-4 text-right">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {Number(proposal.voteCount)} vote{Number(proposal.voteCount) !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
            
            {showVoteCounts && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${proposals.length > 0 
                        ? (Number(proposal.voteCount) / Math.max(...proposals.map(p => Number(p.voteCount)))) * 100 
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}