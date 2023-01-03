//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "@openzeppelin/contracts/utils/Strings.sol";
// import "./ABDKMath64x64.sol";
import "./StorageByHash.sol";
import "./BetBase.sol";




contract BetNumber is BetBase{

    constructor(address storageContractAddress) BetBase(storageContractAddress){
    }

    function createBet(string calldata id, string memory name, string memory description, uint256 hash, uint256 course, uint256 bettingDeadline, uint256 answerRevealDeadline, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions) payable public{
        require(bettingDeadline >= block.timestamp, "deadline already passed");
        require(answerRevealDeadline >= bettingDeadline);
        require(course > 100000000000000000, "Your course needs to be higher than 1e17");
        storageByHash.storeHash(id, hash);
        
        _createDeadlines(id, bettingDeadline, answerRevealDeadline, 0/*not used*/);
        _createBet(id, name, description, payable(msg.sender), msg.value, course, whitelist, blacklist, restrictedOptions);
    }

    function createBet(string calldata id, string memory name, string memory description, uint256 hash, bytes memory encryptedData, uint256 course, uint256 bettingDeadline, uint256 answerRevealDeadline, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions) payable public {
        require(bettingDeadline >= block.timestamp, "deadline already passed");
        require(answerRevealDeadline >= bettingDeadline);
        require(course > 100000000000000000, "Your course needs to be higher than 1e17");
        storageByHash.storeHash(id, hash, encryptedData);
        
        _createDeadlines(id, bettingDeadline, answerRevealDeadline, 0/*not used*/);
        _createBet(id, name, description, payable(msg.sender), msg.value, course, whitelist, blacklist, restrictedOptions);
    }

    function bet(string calldata betId, int256 guess) payable public minValue() betExists(betId) betOpen(betId) isWhitelisted(betId) notBlacklisted(betId) returns (Guess memory){
        Bet storage selectedBet = storedBets[betId];
        require(msg.sender != selectedBet.owner, "You cannot bet on your own Bet.");
        require(multMoney((selectedBet.totalBets + msg.value),decreaseCourse(selectedBet.course)) <= selectedBet.betLimit, "There is not enough money in a vault to pay you if you win. The most you can bet is");

        uint256 newId = selectedBet.guesses.length;
        Guess memory newGuess = Guess(newId, payable(msg.sender), msg.value, false, guess, 0);
        if(!selectedBet.optionExists[guess]){
            require(!selectedBet.hasRestrictedOptions, "Betting is restricted to only given options.");
        }
        _updateOptions(selectedBet, newGuess);
        selectedBet.totalBets += msg.value;
        selectedBet.guesses.push(newGuess);
        userGuesses[msg.sender].push(UserGuess(newGuess.id, betId));
        return newGuess;
    }

    
    function revealNumber(string calldata betId, int256 revealedNumber, int256 nonce) public nonReentrant() betExists(betId) isInAnswerRevealPeriod(betId) betOwner(betId) statusRunning(betId){
        Bet storage selectedBet = storedBets[betId];
        
        storageByHash.uploadData(betId, valueToBinary(revealedNumber, nonce));//storage takes care of checking if value is correct
        selectedBet.answer = revealedNumber;
        selectedBet.nonce = nonce;
        if(selectedBet.hasRestrictedOptions && !selectedBet.optionExists[revealedNumber]){//Bet creator wanted to screw participants, lets punnish him :)
            return _forceFinishBet(selectedBet);
        }

        //By deafault user has 1 day to publish the hidden number
        uint256 totalMoneyPaid = 0;
        for(uint i=0; i<selectedBet.guesses.length; i++){
            Guess memory guess = selectedBet.guesses[i];
            if(guess.guess == revealedNumber){
                payable(guess.bettor).transfer(multMoney(guess.amount,selectedBet.course));
                totalMoneyPaid += multMoney(guess.amount,selectedBet.course);
            }
            guess.evaluated = true;
        }
        payable(selectedBet.owner).transfer(selectedBet.betLimit+selectedBet.totalBets - totalMoneyPaid);
        selectedBet.status = Status.FINNISHED;
    }

    /*
    If creator of the bet does not provide the hidden revealedNumber 1 day after the bettingDeadline all money is given to participants.
    */
    function forceFinishBet(string calldata betId) public nonReentrant() betExists(betId) statusRunning(betId) afterAnswerRevelPeriod(betId){
        Bet storage selectedBet = storedBets[betId];
        _forceFinishBet(selectedBet);
    }

    function _forceFinishBet(Bet storage selectedBet) internal{
        for(uint i=0; i<selectedBet.guesses.length; i++){
            Guess memory guess = selectedBet.guesses[i];
            guess.bettor.transfer(multMoney(guess.amount,selectedBet.course));
        }
        //CONSIDER giving money to sender, because he needed to pay for gas execution
        selectedBet.owner.transfer(selectedBet.betLimit + selectedBet.totalBets - multMoney(selectedBet.totalBets,selectedBet.course));
        selectedBet.status = Status.FINNISHED;
    }
}

