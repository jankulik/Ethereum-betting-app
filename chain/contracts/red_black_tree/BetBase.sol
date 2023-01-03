//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "./StorageByHash.sol";


/// @notice Library SafeMath used to prevent overflows and underflows
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./HitchensOrderStatisticsTreeLib.sol";

//common interface createBet, bet, endBet
//bet with visible options
//bet with hidden options
//multiple choice bet
//string bet
//integer range bet
//whitlist blacklist



contract BetBase {
    using SafeMath for uint256;
    using SafeMath for int256;

    enum Status{NOT_CREATED, RUNNING, WAITING_FOR_ANSWER, ANSWER_REVEALED, FINNISHED}
    
    struct Guess{
        bytes16 id;//also id of storage
        address payable bettor;
        uint256 amount;
        bool evaluated;
        int256 guess;
        int256 nonce;
    }

    struct Option{
        int256 value;
        uint256 totalBet;
    }
    
    struct Bet {
        bytes16 id;//also id of storage
        string name;
        address payable owner;
        int256 answer;
        int256 nonce;
        uint256 totalBets;
        uint256 betLimit;
        uint256 course;
        uint256 bettingDeadline;
        uint256 answerRevealDeadline;
        uint256 prizeClaimDeadline;
        Status status;
        bool hasWhitelist;
        mapping(address => bool) whitelist;
        mapping(address => bool) blacklist;
        bytes16[] guesses;
        Option[] options;
        mapping(int256 => uint256) optionValueToId;
        mapping(int256 => bool) optionExists;
        bool hasRestrictedOptions;
    }

    struct ReturnedBet{
        bytes16 id;//also id of storage
        address payable owner;
        int answer;
        uint totalBets;
        uint betLimit;
        uint course;
        string name;
        uint bettingDeadline;
        uint answerRevealDeadline;
    }

    StorageByHash storageByHash;

    mapping(address => bytes16[]) public userBets;
    mapping(bytes16 => Bet) internal storedBets;
    mapping(address => bytes16[]) public userGuesses;
    mapping(bytes16 => Guess) public storedGuesses;

    HitchensOrderStatisticsTreeLib.Tree mostPopularBets;

    constructor(address storageContractAddress) {
        storageByHash = StorageByHash(storageContractAddress);
    }


    function _createBet(bytes16 id, string memory name, address payable owner, uint256 betLimit, uint256 course, uint256 bettingDeadline, uint256 answerRevealDeadline, uint256 prizeClaimDeadline, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions) internal {
        require(storedBets[id].id==0, "This item already exists");
        storedBets[id].id = id;
        storedBets[id].name = name;
        storedBets[id].owner = owner;
        storedBets[id].totalBets = 0;
        storedBets[id].betLimit = betLimit;
        storedBets[id].course = course;
        storedBets[id].bettingDeadline = bettingDeadline;
        storedBets[id].answerRevealDeadline = answerRevealDeadline;
        storedBets[id].prizeClaimDeadline = prizeClaimDeadline;
        storedBets[id].status = Status.RUNNING;
        if(whitelist.length > 0){
            storedBets[id].hasWhitelist = true;
            for(uint i=0;i<whitelist.length;i++)
                storedBets[id].whitelist[whitelist[i]] = true;
        }
        if(blacklist.length > 0){
            for(uint i=0;i<blacklist.length;i++)
                storedBets[id].blacklist[blacklist[i]] = true;
        }
        if(restrictedOptions.length > 0){
            storedBets[id].hasRestrictedOptions = true;
            for(uint i=0; i< restrictedOptions.length; i++){
                storedBets[id].optionExists[restrictedOptions[i]] = true;
                storedBets[id].optionValueToId[restrictedOptions[i]] = storedBets[id].options.length;
                storedBets[id].options.push(Option(restrictedOptions[i], 0));
            } 
        }
        userBets[msg.sender].push(id);
    }

    function topUp(bytes16 betId) payable public{
        Bet storage selectedBet = storedBets[betId];
        require(block.timestamp < selectedBet.bettingDeadline, "Bet is no longer open");
        require(selectedBet.status == Status.RUNNING, "Bet is no longer open");
        require(msg.sender == selectedBet.owner, "You need to be the owner");
        selectedBet.betLimit += msg.value;
    }

    function whitelistAddress(bytes16 betId, address guesser) public{
        require(betExists(betId), "Bet does not exist");
        Bet storage selectedBet = storedBets[betId];
        require(selectedBet.hasWhitelist, "You cannot add to whitelist if there was not one before");
        require(block.timestamp < selectedBet.bettingDeadline, "Bet is no longer open");
        require(selectedBet.status == Status.RUNNING, "Bet is no longer open");
        require(!selectedBet.whitelist[guesser], "Guesser has been whiteliste already.");
        selectedBet.whitelist[guesser] = true;
    }
    
    function getUserBets(address owner) public view returns (ReturnedBet[] memory){
        bytes16[] memory betIds = userBets[owner];
        ReturnedBet[] memory bets = new ReturnedBet[](betIds.length);
        for (uint i = 0; i < bets.length; i++) {
          bets[i] = convertBetToReturn(storedBets[betIds[i]]);
        }
      return bets;
    }
    
    function getUserBetsNormal(address owner) public view returns (ReturnedBet[] memory){
        bytes16[] memory betIds = userBets[owner];
        ReturnedBet[] memory bets = new ReturnedBet[](betIds.length);
        for (uint i = 0; i < bets.length; i++) {
          bets[i] = convertBetToReturn(storedBets[betIds[i]]);
        }
      return bets;
    }

    function betExists(bytes16 betId) public view returns(bool){
        return storedBets[betId].id!=0;
    }

    function guessExists(bytes16 guesId) public view returns(bool){}


    function getGuess(bytes16 guessId) public view returns(Guess memory){
        return storedGuesses[guessId];
    }

    function getGuesses(bytes16 betId) public view returns(bytes16[] memory){
        return storedBets[betId].guesses;
    }

    function getOptions(bytes16 betId) public view returns(Option[] memory){
        return storedBets[betId].options;
    }

    function getBet(bytes16 betId) public view returns(ReturnedBet memory){
        return convertBetToReturn(storedBets[betId]);
    }

    function convertBetToReturn(Bet storage betToConvert) private view returns (ReturnedBet memory){
        return ReturnedBet(betToConvert.id,
        betToConvert.owner,
        betToConvert.answer,
        betToConvert.totalBets,
        betToConvert.betLimit,
        betToConvert.course,
        betToConvert.name,
        betToConvert.bettingDeadline,
        betToConvert.answerRevealDeadline);
    }

    function getTop10Bets() public view returns (bytes16[] memory){
        bytes16[] memory betIds = new bytes16[](10);
        uint cursor = 0;
        uint256 curVal = HitchensOrderStatisticsTreeLib.last(mostPopularBets);
        while(curVal != 0 && cursor < 10){
            bytes16[] memory keys = mostPopularBets.nodes[curVal].keys;
            for(uint i=0; i< keys.length && cursor < 10; i++){
                betIds[cursor++] = keys[i];
            }
            curVal = HitchensOrderStatisticsTreeLib.prev(mostPopularBets, curVal);
        }
        return betIds;

    }

    function valueToBinary(int256 answer, int256 nonce) public pure returns (bytes memory){
        return abi.encodePacked(answer, nonce);
    }

    function getEncryptedData(bytes16 betId) external view returns (bytes memory){
        (,,,bytes memory encryptedData) = storageByHash.storedItems(betId);
        return encryptedData;
    }

    /*currently there are 120 mln ETH which is 1.2 * 10^26 Wei 2^256/10^26 ~~~ 1.1*10^51 so we can savely reserve 40 decimal places without worying about integer overflow
    */
    function multMoney(uint256 money, uint256 course) public pure returns (uint256){
        return (money*course)/10^40;
    }
}