//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./StorageByHash.sol";

/**
This contract was created just for fun to store messages and reveal them in a future :)
 */
contract Palantir {

    struct Prophecy  {
        string uuid;
        address wizard;
        string prophecy;
        int256 nonce;
    }

    mapping(address => string[]) public wizardsProphecies;
    mapping(string => Prophecy) public storedProphecies;

    StorageByHash storageByHash;

    constructor(address storageByHashAddress) {
        storageByHash = StorageByHash(storageByHashAddress);
    }

    function contactDarkForces(string calldata uuid,uint256 prophecyHash) public{
        require(bytes(storedProphecies[uuid].uuid).length==0, "Someone has done it before you");
        
        storageByHash.storeHash(uuid, prophecyHash);
        storedProphecies[uuid] = Prophecy({
            uuid: uuid,
            wizard: msg.sender,
            prophecy: '',
            nonce: 0
        });
        wizardsProphecies[msg.sender].push(uuid);
    }

    function shockTheWorld(string calldata prophecyId, string memory prophecy, int nonce) public{
        require(storedProphecies[prophecyId].wizard == msg.sender, "You are not a wizar. You scabby Muggle!");
        storageByHash.uploadData(prophecyId, abi.encodePacked(prophecy, nonce));
        storedProphecies[prophecyId].prophecy = prophecy;
        storedProphecies[prophecyId].nonce = nonce;
    }

    function getWizardProphecies(address wizard) public view returns (Prophecy[] memory)
    {
        string[] memory prophecyIds = wizardsProphecies[wizard];
        Prophecy[] memory prophecies = new Prophecy[](prophecyIds.length);
        for (uint i = 0; i < prophecies.length; i++) {
          prophecies[i] = storedProphecies[prophecyIds[i]];
        }
      return prophecies;
    }
}

