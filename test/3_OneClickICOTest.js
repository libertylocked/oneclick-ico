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
      const seller = accounts[1]
      const investor = accounts[2]
      const totalSupply = 1000000000000
      const instance = await OneClickICO.new()
      const tx = await instance.createBasicTokensale(saleStartTimeUnix,
        saleEndTimeUnix, 10, totalSupply, "bullshit token",
        3, "BST", tradableAfter, { from: seller })
      assert.equal(tx.logs[0].event, "ICOCreated")
      assert.equal(tx.logs[0].args.seller, accounts[1])
      assert.notEqual(tx.logs[0].args.token.length, 0)
      assert.notEqual(tx.logs[0].args.tokenSale.length, 0)
      // verify that the tokensale works
      const token = ICOableToken.at(tx.logs[0].args.token)
      const sale = BasicTokensale.at(tx.logs[0].args.tokenSale)
      // the seller should own all the supply
      assert.equal(await token.balanceOf(seller), totalSupply)
      // give allowance to the tokensale from the seller
      await token.approve(sale.address, totalSupply, { from: seller })
      assert.equal((await token.allowance(seller, sale.address)).toNumber(),
        totalSupply)
      // investor buys 10 coins from tokensale
      const txBuy = await sale.sendTransaction({ from: investor, value: 100 })
      assert.equal(txBuy.logs[0].event, "TokenSold")
      assert.equal(txBuy.logs[0].args.buyer, investor)
      assert.equal(txBuy.logs[0].args.tokenAmount.toNumber(), 10)
      assert.equal(txBuy.logs[0].args.value.toNumber(), 100)
      // investor should have 10 coins
      assert.equal((await token.balanceOf(investor)).toNumber(), 10)
      assert.equal((await token.balanceOf(seller)).toNumber(), totalSupply - 10)
    })
  })
})
