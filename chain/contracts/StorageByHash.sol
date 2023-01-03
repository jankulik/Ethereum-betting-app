//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "@openzeppelin/contracts/utils/Strings.sol";

contract StorageByHash {
    struct StoredItem  {
        string uuid;
        address owner;
        uint256 hash;
        bytes data;
    }

    mapping(address => string[]) public userItems;

    mapping(string => StoredItem) public storedItems;

    constructor() {
    }

    function storeHash(string calldata uuid,uint256 hash) public virtual{
        require(bytes(storedItems[uuid].uuid).length==0, "You shall not pass!");
        storedItems[uuid] = StoredItem({
            uuid: uuid,
            owner: msg.sender,
            data: "",
            hash: hash
        });
        userItems[msg.sender].push(uuid);
    }

    function storeHash(string calldata uuid,uint256 hash, bytes memory data) public{
        require(bytes(storedItems[uuid].uuid).length==0, "You shall not pass!");
        storedItems[uuid] = StoredItem({
            uuid: uuid,
            owner: msg.sender,
            data: data,
            hash: hash
        });
        userItems[msg.sender].push(uuid);
    }

    function uploadData(string calldata itemId, bytes calldata data) public{
        uint256 hash = uint256(keccak256(data));
        require(hash == storedItems[itemId].hash, "Data hash is not correct original:");
        storedItems[itemId].data = data;
    }

    function getUserItems(address owner) public view returns (StoredItem[] memory)
    {
        string[] memory itemIds = userItems[owner];
        StoredItem[] memory items = new StoredItem[](itemIds.length);
        for (uint i = 0; i < items.length; i++) {
          items[i] = storedItems[itemIds[i]];
        }
      return items;
    }

    function getHash(bytes calldata data) public pure returns (uint256){
        return uint256(keccak256(data));
    }
}

