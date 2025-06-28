// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Voting
 * @dev Smart contract pour un système de vote sécurisé avec workflow défini
 */
contract Voting is Ownable, ReentrancyGuard {
    
    // ===== STRUCTURES =====
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
    
    struct Proposal {
        string description;
        uint voteCount;
    }
    
    // ===== ÉNUMÉRATIONS =====
    
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }
    
    // ===== VARIABLES D'ÉTAT =====
    
    WorkflowStatus public workflowStatus;
    
    mapping(address => Voter) public voters;
    Proposal[] public proposals;
    
    uint public winningProposalID;
    address[] public votersList; // Pour itérer sur les électeurs
    
    // ===== ÉVÉNEMENTS =====
    
    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);
    event VotesTallied();
    
    // ===== MODIFICATEURS =====
    
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "Vous n'etes pas un electeur enregistre");
        _;
    }
    
    modifier onlyDuringVotersRegistration() {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Les inscriptions ne sont pas ouvertes");
        _;
    }
    
    modifier onlyDuringProposalsRegistration() {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Les propositions ne sont pas ouvertes");
        _;
    }
    
    modifier onlyDuringVotingSession() {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "La session de vote n'est pas active");
        _;
    }
    
    // ===== CONSTRUCTOR =====
    
    constructor() Ownable(msg.sender) {
        workflowStatus = WorkflowStatus.RegisteringVoters;
    }
    
    // ===== FONCTIONS ADMINISTRATEUR =====
    
    /**
     * @dev Ajouter un électeur à la liste blanche
     * @param _addr Adresse de l'électeur à ajouter
     */
    function addVoter(address _addr) external onlyOwner onlyDuringVotersRegistration {
        require(!voters[_addr].isRegistered, "Electeur deja enregistre");
        require(_addr != address(0), "Adresse invalide");
        
        voters[_addr].isRegistered = true;
        votersList.push(_addr);
        
        emit VoterRegistered(_addr);
    }
    
    /**
     * @dev Ajouter plusieurs électeurs en une fois
     * @param _addrs Tableau d'adresses d'électeurs
     */
    function addVoters(address[] calldata _addrs) external onlyOwner onlyDuringVotersRegistration {
        for (uint i = 0; i < _addrs.length; i++) {
            if (!voters[_addrs[i]].isRegistered && _addrs[i] != address(0)) {
                voters[_addrs[i]].isRegistered = true;
                votersList.push(_addrs[i]);
                emit VoterRegistered(_addrs[i]);
            }
        }
    }
    
    /**
     * @dev Démarrer la session d'enregistrement des propositions
     */
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Etat incorrect");
        require(votersList.length > 0, "Aucun electeur enregistre");
        
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, workflowStatus);
    }
    
    /**
     * @dev Terminer la session d'enregistrement des propositions
     */
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Etat incorrect");
        require(proposals.length > 0, "Aucune proposition enregistree");
        
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, workflowStatus);
    }
    
    /**
     * @dev Démarrer la session de vote
     */
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, "Etat incorrect");
        
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, workflowStatus);
    }
    
    /**
     * @dev Terminer la session de vote
     */
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Etat incorrect");
        
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, workflowStatus);
    }
    
    /**
     * @dev Comptabiliser les votes et déterminer le gagnant
     */
    function tallyVotes() external onlyOwner nonReentrant {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Etat incorrect");
        
        uint winningVoteCount = 0;
        
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposalID = p;
            }
        }
        
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, workflowStatus);
        emit VotesTallied();
    }
    
    // ===== FONCTIONS ÉLECTEURS =====
    
    /**
     * @dev Ajouter une proposition
     * @param _desc Description de la proposition
     */
    function addProposal(string calldata _desc) external onlyVoters onlyDuringProposalsRegistration {
        require(bytes(_desc).length > 0, "Description vide");
        require(bytes(_desc).length <= 200, "Description trop longue");
        
        proposals.push(Proposal({
            description: _desc,
            voteCount: 0
        }));
        
        emit ProposalRegistered(proposals.length - 1);
    }
    
    /**
     * @dev Voter pour une proposition
     * @param _id ID de la proposition
     */
    function setVote(uint _id) external onlyVoters onlyDuringVotingSession nonReentrant {
        require(!voters[msg.sender].hasVoted, "Vous avez deja vote");
        require(_id < proposals.length, "Proposition inexistante");
        
        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        
        proposals[_id].voteCount++;
        
        emit Voted(msg.sender, _id);
    }
    
    // ===== FONCTIONS DE LECTURE =====
    
    /**
     * @dev Obtenir une proposition par son ID
     * @param _id ID de la proposition
     * @return description et nombre de votes
     */
    function getOneProposal(uint _id) external view returns (Proposal memory) {
        require(_id < proposals.length, "Proposition inexistante");
        return proposals[_id];
    }
    
    /**
     * @dev Obtenir toutes les propositions
     * @return Tableau de toutes les propositions
     */
    function getProposals() external view returns (Proposal[] memory) {
        return proposals;
    }
    
    
    function getWinner() external view returns (Proposal memory winnerProposal) {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Les votes ne sont pas encore comptabilises");
        return proposals[winningProposalID];
    }
    
    /**
     * @dev Obtenir les informations d'un électeur
     * @param _addr Adresse de l'électeur
     * @return Informations de l'électeur
     */
    function getVoter(address _addr) external view returns (Voter memory) {
        return voters[_addr];
    }
    
    /**
     * @dev Obtenir la liste des électeurs enregistrés
     * @return Tableau d'adresses des électeurs
     */
    function getVotersList() external view returns (address[] memory) {
        return votersList;
    }
    
    /**
     * @dev Obtenir le nombre total de propositions
     * @return Nombre de propositions
     */
    function getProposalsCount() external view returns (uint) {
        return proposals.length;
    }
    
    /**
     * @dev Obtenir le nombre total d'électeurs
     * @return Nombre d'électeurs enregistrés
     */
    function getVotersCount() external view returns (uint) {
        return votersList.length;
    }
}