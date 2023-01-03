//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

// import "./ABDKMath64x64.sol";
import "./StorageByHash.sol";
import "./BetBase.sol";

//common interface createBet, bet, endBet
//bet with visible options
//bet with hidden options
//multiple choice bet
//string bet
//integer range bet
//whitlist blacklist



contract BetNumber is BetBase{

    constructor(address storageContractAddress) BetBase(storageContractAddress){
    }

    function createBet(bytes16 id, string memory name, uint256 hash, uint256 course, uint256 bettingDeadline, uint256 answerRevealDeadline, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions) payable public {
        require(bettingDeadline >= block.timestamp, "deadline already passed");
        require(answerRevealDeadline >= bettingDeadline);
        require(!betExists(id), "You shall not pass!");
        require(msg.value > 0, "You need to bet at least sth");
        storageByHash.storeHash(id, hash);
        
        _createBet(id, name, payable(msg.sender), msg.value, course, bettingDeadline, answerRevealDeadline, 0/*not used*/, whitelist, blacklist, restrictedOptions);
    }

    function createBet(bytes16 id, string memory name, uint256 hash, bytes memory encryptedData, uint256 course, uint256 bettingDeadline, uint256 answerRevealDeadline, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions) payable public {
        require(bettingDeadline >= block.timestamp, "deadline already passed");
        require(answerRevealDeadline >= bettingDeadline);
        require(!betExists(id), "You shall not pass!");
        require(msg.value > 0, "You need to bet at least sth");
        storageByHash.storeHash(id, hash, encryptedData);
        
        _createBet(id, name, payable(msg.sender), msg.value, course, bettingDeadline, answerRevealDeadline, 0/*not used*/, whitelist, blacklist, restrictedOptions);
    }

    function bet(bytes16 betId, bytes16 guessId, int256 guess) payable public virtual returns (Guess memory){
        require(betExists(betId), "This bet does not exists");
        require(msg.value > 0, "You need to bet at least sth");
        Bet storage selectedBet = storedBets[betId];
        require(msg.sender != selectedBet.owner, "You cannot bet on your own Bet.");
        require(selectedBet.status == Status.RUNNING, "Bet is already finished");
        require(block.timestamp <= selectedBet.bettingDeadline, "You are late. Bet is over");
        require(!selectedBet.hasWhitelist || selectedBet.whitelist[msg.sender], "Creater of the bet did not want you to take part in this bet");
        require(!selectedBet.blacklist[msg.sender], "You were blacklisted by author");
        require(multMoney((selectedBet.totalBets + msg.value),selectedBet.course) <= selectedBet.betLimit, "There is not enough money in a vault to pay you if you win. The most you can bet is");

        Guess memory newGuess = Guess(guessId, payable(msg.sender), msg.value, false, guess, 0);
        if(!selectedBet.optionExists[guess]){
            require(!selectedBet.hasRestrictedOptions, "Betting is restricted to only given options.");
            selectedBet.optionExists[guess] = true;
            selectedBet.optionValueToId[guess] = selectedBet.options.length;
            selectedBet.options.push(Option(guess, newGuess.amount));
        }else{
            uint256 optionId = selectedBet.optionValueToId[guess];
            selectedBet.options[optionId].totalBet+=newGuess.amount;
        }
        bool wasEmpty = false || selectedBet.totalBets == 0;
        selectedBet.totalBets += msg.value;
        storedGuesses[newGuess.id] = newGuess;
        selectedBet.guesses.push(newGuess.id);
        userGuesses[msg.sender].push(newGuess.id);


        //Update tree
        if(wasEmpty){//We only store non empty active bets in a tree
            HitchensOrderStatisticsTreeLib.insert(mostPopularBets, selectedBet.id, selectedBet.totalBets);
        }else{
            HitchensOrderStatisticsTreeLib.remove(mostPopularBets, selectedBet.id, selectedBet.totalBets - msg.value);
            HitchensOrderStatisticsTreeLib.insert(mostPopularBets, selectedBet.id, selectedBet.totalBets);
        }
        return newGuess;
    }

    
    function revealNumber(bytes16 betId, int256 revealedNumber, int256 nonce) public{
        require(betExists(betId), "Bet does not exists");
        Bet storage selectedBet = storedBets[betId];
        require(block.timestamp  > selectedBet.bettingDeadline, "It is too soon, deadline was not reached.");
        require(block.timestamp  <= selectedBet.answerRevealDeadline, "It is too late.");
        require(selectedBet.status == Status.RUNNING, "Bet is already finished");
        require(msg.sender == selectedBet.owner, "You are not an owner of this bet");
        selectedBet.status = Status.FINNISHED;
        storageByHash.uploadData(betId, valueToBinary(revealedNumber, nonce));//storage takes care of checking if value is correct
        
        if(selectedBet.hasRestrictedOptions && !selectedBet.optionExists[revealedNumber]){//Bet creator wanted to screw participants, lets punnish him :)
            return _forceFinishBet(selectedBet);
        }

        //By deafault user has 1 day to publish the hidden number
        uint256 totalMoneyPaid = 0;
        for(uint i=0; i<selectedBet.guesses.length; i++){
            Guess memory guess = storedGuesses[selectedBet.guesses[i]];
            if(guess.guess == revealedNumber){
                payable(guess.bettor).transfer(multMoney(guess.amount,selectedBet.course));
                totalMoneyPaid += multMoney(guess.amount,selectedBet.course);
            }
            guess.evaluated = true;
        }
        payable(selectedBet.owner).transfer(selectedBet.betLimit+selectedBet.totalBets - totalMoneyPaid);
        HitchensOrderStatisticsTreeLib.remove(mostPopularBets, selectedBet.id, selectedBet.totalBets);
    }

    /*
    If creator of the bet does not provide the hidden revealedNumber 1 day after the bettingDeadline all money is given to participants.
    */
    function forceFinishBet(bytes16 betId) public{
        require(betExists(betId), "Bet does not exist");
        Bet storage selectedBet = storedBets[betId];
        require(selectedBet.status == Status.RUNNING, "Bet is already finished");
        require(block.timestamp > selectedBet.answerRevealDeadline, "It is too soon, bettingDeadline was not reached.");
        selectedBet.status = Status.FINNISHED;
        _forceFinishBet(selectedBet);
    }

    function _forceFinishBet(Bet storage selectedBet) internal{
        for(uint i=0; i<selectedBet.guesses.length; i++){
            Guess memory guess = storedGuesses[selectedBet.guesses[i]];
            guess.bettor.transfer(multMoney(guess.amount,selectedBet.course));
        }
        //CONSIDER giving money to sender, because he needed to pay for gas execution
        selectedBet.owner.transfer(selectedBet.betLimit - multMoney(selectedBet.totalBets,selectedBet.course));
        HitchensOrderStatisticsTreeLib.remove(mostPopularBets, selectedBet.id, selectedBet.totalBets);
    }
}

