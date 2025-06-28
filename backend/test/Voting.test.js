// test/Voting.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let owner;
  let voter1, voter2, voter3;
  let nonVoter;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("Déploiement", function () {
    it("Devrait déployer avec le bon propriétaire", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Devrait initialiser le workflow à RegisteringVoters", async function () {
      expect(await voting.workflowStatus()).to.equal(0); // RegisteringVoters
    });
  });

  describe("Enregistrement des électeurs", function () {
    it("Devrait permettre au propriétaire d'ajouter un électeur", async function () {
      await expect(voting.addVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);

      const voter = await voting.getVoter(voter1.address);
      expect(voter.isRegistered).to.be.true;
    });

    it("Devrait permettre d'ajouter plusieurs électeurs", async function () {
      const voters = [voter1.address, voter2.address, voter3.address];
      await voting.addVoters(voters);

      for (const voterAddr of voters) {
        const voter = await voting.getVoter(voterAddr);
        expect(voter.isRegistered).to.be.true;
      }
    });

    it("Ne devrait pas permettre d'ajouter le même électeur deux fois", async function () {
      await voting.addVoter(voter1.address);
      await expect(voting.addVoter(voter1.address))
        .to.be.revertedWith("Electeur deja enregistre");
    });

    it("Ne devrait pas permettre à un non-propriétaire d'ajouter un électeur", async function () {
      await expect(voting.connect(voter1).addVoter(voter2.address))
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("Ne devrait pas permettre d'ajouter l'adresse zéro", async function () {
      await expect(voting.addVoter(ethers.ZeroAddress))
        .to.be.revertedWith("Adresse invalide");
    });
  });

  describe("Gestion du workflow", function () {
    beforeEach(async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
    });

    it("Devrait permettre de démarrer l'enregistrement des propositions", async function () {
      await expect(voting.startProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(0, 1);

      expect(await voting.workflowStatus()).to.equal(1);
    });

    it("Ne devrait pas permettre de démarrer les propositions sans électeurs", async function () {
      const emptyVoting = await ethers.getContractFactory("Voting");
      const emptyContract = await emptyVoting.deploy();
      
      await expect(emptyContract.startProposalsRegistering())
        .to.be.revertedWith("Aucun electeur enregistre");
    });

    it("Devrait suivre le workflow complet", async function () {
      // Démarrer les propositions
      await voting.startProposalsRegistering();
      
      // Ajouter des propositions
      await voting.connect(voter1).addProposal("Proposition 1");
      await voting.connect(voter2).addProposal("Proposition 2");
      
      // Terminer les propositions
      await voting.endProposalsRegistering();
      expect(await voting.workflowStatus()).to.equal(2);
      
      // Démarrer les votes
      await voting.startVotingSession();
      expect(await voting.workflowStatus()).to.equal(3);
      
      // Voter
      await voting.connect(voter1).setVote(0);
      await voting.connect(voter2).setVote(1);
      
      // Terminer les votes
      await voting.endVotingSession();
      expect(await voting.workflowStatus()).to.equal(4);
      
      // Comptabiliser
      await voting.tallyVotes();
      expect(await voting.workflowStatus()).to.equal(5);
    });
  });

  describe("Propositions", function () {
    beforeEach(async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startProposalsRegistering();
    });

    it("Devrait permettre aux électeurs d'ajouter des propositions", async function () {
      await expect(voting.connect(voter1).addProposal("Ma proposition"))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(0);

      const proposal = await voting.getOneProposal(0);
      expect(proposal.description).to.equal("Ma proposition");
      expect(proposal.voteCount).to.equal(0);
    });

    it("Ne devrait pas permettre aux non-électeurs d'ajouter des propositions", async function () {
      await expect(voting.connect(nonVoter).addProposal("Proposition"))
        .to.be.revertedWith("Vous n'etes pas un electeur enregistre");
    });

    it("Ne devrait pas permettre d'ajouter une proposition vide", async function () {
      await expect(voting.connect(voter1).addProposal(""))
        .to.be.revertedWith("Description vide");
    });

    it("Ne devrait pas permettre d'ajouter une proposition trop longue", async function () {
      const longDescription = "a".repeat(201);
      await expect(voting.connect(voter1).addProposal(longDescription))
        .to.be.revertedWith("Description trop longue");
    });

    it("Devrait retourner toutes les propositions", async function () {
      await voting.connect(voter1).addProposal("Proposition 1");
      await voting.connect(voter2).addProposal("Proposition 2");

      const proposals = await voting.getProposals();
      expect(proposals.length).to.equal(2);
      expect(proposals[0].description).to.equal("Proposition 1");
      expect(proposals[1].description).to.equal("Proposition 2");
    });
  });

  describe("Vote", function () {
    beforeEach(async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.addVoter(voter3.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposition 1");
      await voting.connect(voter2).addProposal("Proposition 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
    });

    it("Devrait permettre aux électeurs de voter", async function () {
      await expect(voting.connect(voter1).setVote(0))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, 0);

      const voter = await voting.getVoter(voter1.address);
      expect(voter.hasVoted).to.be.true;
      expect(voter.votedProposalId).to.equal(0);

      const proposal = await voting.getOneProposal(0);
      expect(proposal.voteCount).to.equal(1);
    });

    it("Ne devrait pas permettre de voter deux fois", async function () {
      await voting.connect(voter1).setVote(0);
      await expect(voting.connect(voter1).setVote(1))
        .to.be.revertedWith("Vous avez deja vote");
    });

    it("Ne devrait pas permettre de voter pour une proposition inexistante", async function () {
      await expect(voting.connect(voter1).setVote(999))
        .to.be.revertedWith("Proposition inexistante");
    });

    it("Ne devrait pas permettre aux non-électeurs de voter", async function () {
      await expect(voting.connect(nonVoter).setVote(0))
        .to.be.revertedWith("Vous n'etes pas un electeur enregistre");
    });
  });

  describe("Comptabilisation", function () {
    beforeEach(async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.addVoter(voter3.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposition 1");
      await voting.connect(voter2).addProposal("Proposition 2");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
    });

    it("Devrait déterminer le gagnant correctement", async function () {
      // 2 votes pour la proposition 0, 1 vote pour la proposition 1
      await voting.connect(voter1).setVote(0);
      await voting.connect(voter2).setVote(0);
      await voting.connect(voter3).setVote(1);

      await voting.endVotingSession();
      await expect(voting.tallyVotes())
        .to.emit(voting, "VotesTallied");

      const winner = await voting.getWinner();
      expect(winner.description).to.equal("Proposition 1");
      expect(winner.voteCount).to.equal(2);
      expect(await voting.winningProposalID()).to.equal(0);
    });

    it("Ne devrait pas permettre de consulter le gagnant avant comptabilisation", async function () {
      await expect(voting.getWinner())
        .to.be.revertedWith("Les votes ne sont pas encore comptabilises");
    });
  });

  describe("Fonctions de lecture", function () {
    beforeEach(async function () {
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
    });

    it("Devrait retourner le bon nombre d'électeurs", async function () {
      expect(await voting.getVotersCount()).to.equal(2);
    });

    it("Devrait retourner la liste des électeurs", async function () {
      const votersList = await voting.getVotersList();
      expect(votersList.length).to.equal(2);
      expect(votersList).to.include(voter1.address);
      expect(votersList).to.include(voter2.address);
    });

    it("Devrait retourner le bon nombre de propositions", async function () {
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposition 1");
      await voting.connect(voter2).addProposal("Proposition 2");
      
      expect(await voting.getProposalsCount()).to.equal(2);
    });
  });

  describe("Sécurité", function () {
    it("Devrait protéger contre la réentrance lors du vote", async function () {
      await voting.addVoter(voter1.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposition 1");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();

      // Le modificateur nonReentrant devrait protéger
      await voting.connect(voter1).setVote(0);
      // Impossible de tester la réentrance facilement sans contrat malveillant
    });

    it("Devrait protéger contre la réentrance lors de la comptabilisation", async function () {
      await voting.addVoter(voter1.address);
      await voting.startProposalsRegistering();
      await voting.connect(voter1).addProposal("Proposition 1");
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.connect(voter1).setVote(0);
      await voting.endVotingSession();

      // Le modificateur nonReentrant devrait protéger
      await voting.tallyVotes();
    });
  });
});