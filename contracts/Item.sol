//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ItemManager.sol";

contract Item {
    uint256 public price;
    uint256 public pricePaid;
    uint256 public index;

    ItemManager private manager;

    constructor(
        ItemManager _manager,
        uint256 _price,
        uint256 _index
    ) {
        price = _price;
        index = _index;
        manager = _manager;
    }

    receive() external payable {
        require(pricePaid == 0, "Item is paid already");
        require(price == msg.value, "Only full payments allowed");
        pricePaid += msg.value;
        (bool success, ) = address(manager).call{value: msg.value}(
            abi.encodeWithSignature("triggerPayment(uint256)", index)
        );
        require(success, "The transaction wansn't successful, canceling");
    }
}
