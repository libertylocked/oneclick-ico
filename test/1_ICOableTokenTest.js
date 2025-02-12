/* eslint-disable */
const ICOableToken = artifacts.require("./ICOableToken.sol");

const bn = require("bignumber.js")
const { assertRevert } = require("./helper")

contract("ICOableToken", (accounts) => {
  let tradableInstance, nonTradableInstance;

  beforeEach("deploy an immediately tradable token", async () => {
    let tradableAfter = new Date();
    tradableAfter.setHours(tradableAfter.getHours() - 1);
    const tradableAfterUnix = Math.round(tradableAfter.getTime() / 1000);
    tradableInstance = await ICOableToken.new(1000000000,
      "bullshit token", 3, "BST", tradableAfterUnix, accounts[0], {
        from: accounts[0]
      })
  })
  beforeEach("deploy a not yet tradable token", async () => {
    let tradableAfter = new Date();
    tradableAfter.setDate(tradableAfter.getDate() + 1);
    const tradableAfterUnix = Math.round(tradableAfter.getTime() / 1000);
    nonTradableInstance = await ICOableToken.new(1000000000,
      "bullshit token", 3, "BST", tradableAfterUnix, accounts[0], {
        from: accounts[0]
      })
  })
  describe("constructor", () => {
    it("should set all the parameters correctly", async () => {
      // tradable 1 day after token deployment
      let tradableAfter = new Date();
      tradableAfter.setDate(tradableAfter.getDate() + 1);
      const tradableAfterUnix = Math.round(tradableAfter.getTime() / 1000);
      const instance = await ICOableToken.new(1000000000,
        "bullshit token", 3, "BST", tradableAfterUnix, accounts[0], {
          from: accounts[0]
        })
      assert.equal((await instance.totalSupply()).toString(),
        new bn(1000000000).toString())
      assert.equal(await instance.name(), "bullshit token")
      assert.equal((await instance.decimals()).toString(),
        new bn(3).toString())
      assert.equal((await instance.tradableAfter()).toString(),
        new bn(tradableAfterUnix).toString())
      assert.equal(await instance.tokenSeller(), accounts[0])
      assert.equal((await instance.balanceOf(accounts[0])).toString(),
        new bn(1000000000).toString())
    })
  })
  describe("transfer", () => {
    it("should allow transfer from the seller during trade lock", async () => {
      // tradable 1 day after token deployment
      const instance = nonTradableInstance
      const tx = await instance.transfer(accounts[1], 10, { from: accounts[0] })
      assert.equal(tx.logs[0].event, "Transfer")
      assert.equal(tx.logs[0].args._from, accounts[0])
      assert.equal(tx.logs[0].args._to, accounts[1])
      assert.equal(tx.logs[0].args._value, 10)
      assert.equal((await instance.balanceOf(accounts[1])).toString(),
        new bn(10).toString())
      assert.equal((await instance.balanceOf(accounts[0])).toString(),
        new bn(1000000000 - 10).toString())
    })
    it("should not allow transfer from non-seller during trade lock", async () => {
      const instance = nonTradableInstance
      await instance.transfer(accounts[1], 10, { from: accounts[0] })
      try {
        await instance.transfer(accounts[2], 10, { from: accounts[1] })
        assert.fail()
      } catch (err) {
        assertRevert(err)
      }
    })
    it("should allow transfer from non-seller once trade is open", async () => {
      // make it immediately tradable
      const instance = tradableInstance
      await instance.transfer(accounts[1], 10, { from: accounts[0] })
      const tx = await instance.transfer(accounts[2], 10, { from: accounts[1] })
      assert.equal(tx.logs[0].event, "Transfer")
      assert.equal(tx.logs[0].args._from, accounts[1])
      assert.equal(tx.logs[0].args._to, accounts[2])
      assert.equal(tx.logs[0].args._value, 10)
      assert.equal((await instance.balanceOf(accounts[1])).toString(),
        new bn(0).toString())
      assert.equal((await instance.balanceOf(accounts[2])).toString(),
        new bn(10).toString())
    })
  })
  describe("transfer from", () => {
    it("should allow transfer from seller during trade lock, when allowance is given to seller", async () => {
      const instance = nonTradableInstance
      await instance.approve(accounts[0], 10, { from: accounts[0] });
      const tx = await instance.transferFrom(accounts[0], accounts[1], 10, { from: accounts[0] })
      assert.equal(tx.logs[0].event, "Transfer")
      assert.equal(tx.logs[0].args._from, accounts[0])
      assert.equal(tx.logs[0].args._to, accounts[1])
      assert.equal(tx.logs[0].args._value, 10)
      assert.equal((await instance.balanceOf(accounts[1])).toString(),
        new bn(10).toString())
      assert.equal((await instance.balanceOf(accounts[0])).toString(),
        new bn(1000000000 - 10).toString())
    })
    it("should allow transfer from seller during trade lock, when allowance is given to someone else", async () => {
      const instance = nonTradableInstance
      // seller gives accounts[1] permission to spend 10 coins
      // accounts[1] then sends the 10 coins to accounts[2]
      await instance.approve(accounts[1], 10, { from: accounts[0] })
      const tx = await instance.transferFrom(accounts[0], accounts[2], 10, { from: accounts[1] })
      assert.equal(tx.logs[0].event, "Transfer")
      assert.equal(tx.logs[0].args._from, accounts[0])
      assert.equal(tx.logs[0].args._to, accounts[2])
      assert.equal(tx.logs[0].args._value, 10)
      assert.equal((await instance.balanceOf(accounts[2])).toString(),
        new bn(10).toString())
      assert.equal((await instance.balanceOf(accounts[0])).toString(),
        new bn(1000000000 - 10).toString())
    })
    it("should not allow transfer from non-sellers", async () => {
      const instance = nonTradableInstance
      // seller first gives accounts[1] 10 tokens
      await instance.transfer(accounts[1], 10, { from: accounts[0] })
      // accounts[1] gives allowance to accounts[2]
      await instance.approve(accounts[2], 10, { from: accounts[1] })
      // accounts[2] attempts to move the 10 coins to him/herself, but it should fail
      try {
        await instance.transferFrom(accounts[1], accounts[2], 10, { from: accounts[2] })
        assert.fail()
      } catch (err) {
        assertRevert(err)
      }
    })
  })

})
