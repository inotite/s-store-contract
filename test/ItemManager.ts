import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ItemManager } from "typechain";

describe("ItemManager", () => {
  let itemManager: ItemManager;
  let owner: SignerWithAddress;
  let generalUser: SignerWithAddress;

  beforeEach(async () => {
    const ItemManager = await ethers.getContractFactory("ItemManager");
    const contractInstance = await ItemManager.deploy();
    itemManager = await contractInstance.deployed();
    [owner, generalUser] = await ethers.getSigners();
  });

  describe("createItem()", () => {
    it("should create an item and increase number of items", async () => {
      const identifier = "Test Item";
      const price = 100;
      await itemManager.createItem(identifier, price);

      const item = await itemManager.items(0);
      expect(item._identifier).to.eq(identifier);
      expect(item._price).to.eq(price);
      expect(item._state).to.eq(0);

      const itemCount = await itemManager.itemIndex();
      expect(itemCount).to.eq(1);
    });
  });

  describe("triggerPayment()", () => {
    beforeEach(async () => {
      await itemManager.createItem("Test Item", 100);
    });

    it("should not trigger payment if the index is out of range", async () => {
      await expect(itemManager.triggerPayment(1)).to.be.revertedWith(
        "Item is not available"
      );
    });

    it("should not trigger payment if payment is not provided", async () => {
      await expect(
        itemManager.connect(generalUser).triggerPayment(0)
      ).to.be.revertedWith("Only full payments accepted");
    });

    it("should trigger payment correctly", async () => {
      const item = await itemManager.items(0);
      await expect(
        itemManager.connect(generalUser).triggerPayment(0, {
          value: "100",
        })
      )
        .to.emit(itemManager, "SupplyChainSetup")
        .withArgs(0, 1, item._item);
    });
  });

  describe("triggerDelivery()", () => {
    beforeEach(async () => {
      await itemManager.createItem("Test Item", 100);
    });

    it("should not trigger delivery if the index is out of range", async () => {
      await expect(itemManager.triggerDelivery(1)).to.be.revertedWith(
        "Item is not available"
      );
    });

    it("should not trigger delivery if caller is not the owner", async () => {
      await expect(
        itemManager.connect(generalUser).triggerDelivery(0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not trigger delivery if item is not paid", async () => {
      await expect(itemManager.triggerDelivery(0)).to.be.revertedWith(
        "Item is further in the chain"
      );
    });

    it("should trigger delivery correctly", async () => {
      await itemManager.triggerPayment(0, {
        value: "100",
      });
      const item = await itemManager.items(0);
      await expect(itemManager.triggerDelivery(0))
        .to.emit(itemManager, "SupplyChainSetup")
        .withArgs(0, 2, item._item);
    });
  });

  describe("Item", () => {
    it("should trigger payment if you send ether to the contract", async () => {
      await itemManager.createItem("Test Item", 100);
      const item = await itemManager.items(0);
      const ItemContract = await ethers.getContractFactory("Item");
      const contract = await ItemContract.attach(item._item);

      await expect(
        contract.signer.sendTransaction({ to: item._item, value: "10" })
      ).to.be.revertedWith("Only full payments allowed");

      await contract.signer.sendTransaction({ to: item._item, value: 100 });
      const pricePaid = await contract.pricePaid();
      expect(pricePaid).to.equal(100);

      await expect(
        contract.signer.sendTransaction({ to: item._item, value: 100 })
      ).to.be.revertedWith("Item is paid already");
    });
  });
});
