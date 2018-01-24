/* eslint-disable */
const ICOableToken = artifacts.require("./ICOableToken.sol")
const BasicTokensale = artifacts.require("./BasicTokensale.sol")

const bn = require("bignumber.js")
const { assertRevert } = require("./helper")

contract("BasicTokensale", (accounts) => {
  let tradableToken, nonTradableToken;

  beforeEach("deploy an immediately tradable token", async () => {
    let tradableAfter = new Date()
    tradableAfter.setHours(tradableAfter.getHours() - 1)
    const tradableAfterUnix = Math.round(tradableAfter.getTime() / 1000)
    tradableToken = await ICOableToken.new(1000000000,
      "bullshit token", 3, "BST", tradableAfterUnix, accounts[0], {
        from: accounts[0]
      })
  })
  beforeEach("deploy a not yet tradable token", async () => {
    let tradableAfter = new Date()
    tradableAfter.setDate(tradableAfter.getDate() + 1)
    const tradableAfterUnix = Math.round(tradableAfter.getTime() / 1000)
    nonTradableToken = await ICOableToken.new(1000000000,
      "bullshit token", 3, "BST", tradableAfterUnix, accounts[0], {
        from: accounts[0]
      })
  })
  describe("constructor", () => {
    it("should set all params correctly", async () => {
      let saleStartTime = new Date()
      saleStartTime.setHours(saleStartTime.getHours() - 1)
      const saleStartTimeUnix = Math.round(saleStartTime.getTime() / 1000)
      let saleEndTime = new Date()
      saleEndTime.setHours(saleEndTime.getHours() + 1)
      const saleEndTimeUnix = Math.round(saleEndTime.getTime() / 1000)

      const instance = await BasicTokensale.new(tradableToken.address, accounts[0],
        saleStartTimeUnix, saleEndTimeUnix, 1, accounts[0])
      assert.equal(await instance.token(), tradableToken.address)
      assert.equal(await instance.tokenSeller(), accounts[0])
      assert.equal((await instance.saleStartTime()).toNumber(), saleStartTimeUnix)
      assert.equal((await instance.saleEndTime()).toNumber(), saleEndTimeUnix)
      assert.equal((await instance.salePrice()).toNumber(), 1)
    })
  })
  describe("fallback function (buy token)", () => {
    it("should allow contribution if the sale is on", async () => {
      let saleStartTime = new Date()
      saleStartTime.setHours(saleStartTime.getHours() - 1)
      const saleStartTimeUnix = Math.round(saleStartTime.getTime() / 1000)
      let saleEndTime = new Date()
      saleEndTime.setHours(saleEndTime.getHours() + 1)
      const saleEndTimeUnix = Math.round(saleEndTime.getTime() / 1000)
      const instance = await BasicTokensale.new(nonTradableToken.address, accounts[0],
        saleStartTimeUnix, saleEndTimeUnix, 10, accounts[0])
      // once we have the tokensale, seller must give it allowance to sell the coins
      await nonTradableToken.approve(instance.address, await nonTradableToken.totalSupply(),
        { from: accounts[0] })
      // let accounts[1] buy 1 token
      const tx = await instance.sendTransaction({ from: accounts[1], value: 10 })
      assert.equal(tx.logs[0].event, "TokenSold")
      assert.equal(tx.logs[0].args.buyer, accounts[1])
      assert.equal(tx.logs[0].args.tokenAmount, 1)
      assert.equal(tx.logs[0].args.value, 10)
    })
  })
})
