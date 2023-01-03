//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "@openzeppelin/contracts/utils/Strings.sol";

contract StorageByHash {
    struct StoredItem  {
        bytes16 uuid;
        address owner;
        uint256 hash;
        bytes data;
    }

    mapping(address => bytes16[]) public userItems;

    mapping(bytes16 => StoredItem) public storedItems;

    constructor() {
    }

    function storeHash(bytes16 uuid,uint256 hash) public virtual{
        require(storedItems[uuid].uuid==0, "The item already exists!");
        storedItems[uuid] = StoredItem({
            uuid: uuid,
            owner: msg.sender,
            data: "",
            hash: hash
        });
        userItems[msg.sender].push(uuid);
    }

    function storeHash(bytes16 uuid,uint256 hash, bytes memory data) public{
        require(storedItems[uuid].uuid==0, "The item already exists!");
        storedItems[uuid] = StoredItem({
            uuid: uuid,
            owner: msg.sender,
            data: data,
            hash: hash
        });
        userItems[msg.sender].push(uuid);
    }

    function uploadData(bytes16 itemId, bytes calldata data) public{
        uint256 hash = getHash(data);
        require(hash == storedItems[itemId].hash, "Data hash is not correct original:");
        storedItems[itemId].data = data;
    }

    function getUserItems(address owner) public view returns (StoredItem[] memory)
    {
        bytes16[] memory itemIds = userItems[owner];
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

