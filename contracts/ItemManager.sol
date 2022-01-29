//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Item.sol";

contract ItemManager is Ownable {
    enum SupplyChainState {
        Created,
        Paid,
        Delivered
    }

    struct SupplyItem {
        Item _item;
        string _identifier;
        uint256 _price;
        ItemManager.SupplyChainState _state;
    }

    mapping(uint256 => SupplyItem) public items;
    uint256 public itemIndex;

    event SupplyChainSetup(
        uint256 _itemIndex,
        SupplyChainState _step,
        address _itemAddress
    );

    modifier itemAvailable(uint256 _itemIndex) {
        require(_itemIndex < itemIndex, "Item is not available");
        _;
    }

    function createItem(string memory _identifier, uint256 _price)
        public
        onlyOwner
    {
        Item item = new Item(this, _price, itemIndex);
        items[itemIndex]._identifier = _identifier;
        items[itemIndex]._price = _price;
        items[itemIndex]._state = SupplyChainState.Created;
        items[itemIndex]._item = item;
        itemIndex++;
    }

    function triggerPayment(uint256 _itemIndex)
        public
        payable
        itemAvailable(_itemIndex)
    {
        require(
            items[_itemIndex]._price == msg.value,
            "Only full payments accepted"
        );
        require(
            items[_itemIndex]._state == SupplyChainState.Created,
            "Item is further in the chain"
        );

        items[_itemIndex]._state = SupplyChainState.Paid;

        emit SupplyChainSetup(
            _itemIndex,
            items[_itemIndex]._state,
            address(items[_itemIndex]._item)
        );
    }

    function triggerDelivery(uint256 _itemIndex)
        public
        onlyOwner
        itemAvailable(_itemIndex)
    {
        require(
            items[_itemIndex]._state == SupplyChainState.Paid,
            "Item is further in the chain"
        );

        items[_itemIndex]._state = SupplyChainState.Delivered;

        emit SupplyChainSetup(
            _itemIndex,
            items[_itemIndex]._state,
            address(items[_itemIndex]._item)
        );
    }
}
