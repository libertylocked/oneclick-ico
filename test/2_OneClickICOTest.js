/* eslint-disable */
const ICOableToken = artifacts.require("./ICOableToken.sol")
const BasicTokensale = artifacts.require("./BasicTokensale.sol")
const OneClickICO = artifacts.require("./OneClickICO.sol")

const bn = require("bignumber.js")
const { assertRevert, timestampWithOffset } = require("./helper")

contract("OneClickICO", (accounts) => {
  describe("create basic tokensale", () => {
    it("should create a token and a tokensale", async () => {
      const saleStartTimeUnix = timestampWithOffset(-1)
      const saleEndTimeUnix = timestampWithOffset(1)
      const tradableAfter = timestampWithOffset(2)
      const instance = await OneClickICO.new()
      const tx = await instance.createBasicTokensale(saleStartTimeUnix,
        saleEndTimeUnix, 10, 1000000000000, "bullshit token",
        3, "BST", tradableAfter, { from: accounts[1] })
      assert.equal(tx.logs[0].event, "ICOCreated")
      assert.equal(tx.logs[0].args.seller, accounts[1])
      assert.notEqual(tx.logs[0].args.token.length, 0)
      assert.notEqual(tx.logs[0].args.tokenSale.length, 0)
    })
  })
})
