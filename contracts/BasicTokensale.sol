/**
 * Basic tokensale contract, no-frills
 * Deploy this before deploying your ERC20. Once your ERC20 is deployed,
 * call setTokenContract().
 */

pragma solidity ^0.4.18;

import "./Owned.sol";
import "./ERC20Interface.sol";
import "./TokensaleInterface.sol";

contract BasicTokensale is Owned, TokensaleInterface {
    ERC20Interface public token;
    uint public saleStartTime;
    uint public saleEndTime;
    uint public salePrice; // how much per token? (in wei)

    function BasicTokensale(
        uint _saleStartTime,
        uint _saleEndTime,
        uint _salePrice,
        address _initialAdmin)
        Owned(_initialAdmin)
        public
    {
        saleStartTime = _saleStartTime;
        saleEndTime = _saleEndTime;
        salePrice = _salePrice;
    }

    /**
     * fallback payable function
     * This is called by suckers who want to buy your token
     */
    function() public payable {
        // must send enough to buy at least 1 coin
        require(msg.value > salePrice);
        uint tokensBuying = (msg.value / salePrice);
        // make sure we have enough coins left to sell
        require(token.balanceOf(this) >= tokensBuying);
        // give the buyer the tokens
        token.transfer(msg.sender, tokensBuying);
        TokenSold(msg.sender, tokensBuying, msg.value);
    }

    /* All the admin stuff */

    /**
     * Set the address of the ERC20 token that this contract is selling.
     * This can only be called by admin and only be done once.
     * Please make sure the tokensale owns some coins in your ERC20
     * @param _token The address of the ERC20 token
     * @return true if the operation is successful
     */
    function setTokenContract(ERC20Interface _token)
        onlyAdmin
        public
        returns (bool)
    {
        require(token == address(0));
        require(token.balanceOf(this) > 0);
        token = _token;
        return true;
    }

    function changeSaleStartTime(uint _saleStartTime)
        onlyAdmin
        public
        returns (bool)
    {
        saleStartTime = _saleStartTime;
        return true;
    }

    function changeSaleEndTime(uint _saleEndTime)
        onlyAdmin
        public
        returns (bool)
    {
        saleEndTime = _saleEndTime;
        return true;
    }

    function changeSalePrice(uint _salePrice)
        onlyAdmin
        public
        returns (bool)
    {
        salePrice = _salePrice;
        return true;
    }

    /**
     * Cash out baby
     */
    function withdraw()
        onlyAdmin
        public
        returns (bool)
    {
        admin.transfer(this.balance);
        return true;
    }

    /* TokensaleInterface implementation */

    function getPrice(address buyer)
        view
        public
        returns (uint)
    {
        return salePrice;
    }

    function isTokensaleOn(address buyer)
        view
        public
        returns (bool)
    {
        return (block.timestamp >= saleStartTime &&
            block.timestamp <= saleEndTime);
    }

}
