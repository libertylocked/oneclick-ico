/**
 * Basic tokensale contract, no-frills.
 * To get this Takesale to work, the seller must first give allowance to
 * the tokensale contract in the ERC20
 */

pragma solidity ^0.4.18;

import "./Owned.sol";
import "./ERC20Interface.sol";
import "./TokensaleInterface.sol";

contract BasicTokensale is Owned, TokensaleInterface {
    ERC20Interface public token;
    address public tokenSeller;
    uint public saleStartTime;
    uint public saleEndTime;
    uint public salePrice; // how much wei per token?

    function BasicTokensale(
        ERC20Interface _token,
        address _tokenSeller,
        uint _saleStartTime,
        uint _saleEndTime,
        uint _salePrice,
        address _initialAdmin)
        Owned(_initialAdmin)
        public
    {
        token = _token;
        tokenSeller = _tokenSeller;
        saleStartTime = _saleStartTime;
        saleEndTime = _saleEndTime;
        salePrice = _salePrice;
    }

    /**
     * fallback payable function
     * This is called by suckers who want to buy your token
     */
    function() public payable {
        // the tokensale must be on for the buyer
        require(isTokensaleOnFor(msg.sender));
        // must send enough to buy at least 1 coin
        uint price = getPriceFor(msg.sender);
        require(msg.value >= price);
        uint tokensBuying = (msg.value / price);
        // make sure we have enough coins left to sell
        require(token.allowance(tokenSeller, this) >= tokensBuying &&
            token.balanceOf(tokenSeller) >= tokensBuying);
        // give the buyer the tokens
        token.transferFrom(tokenSeller, msg.sender, tokensBuying);
        TokenSold(msg.sender, tokensBuying, msg.value);
    }

    /* All the admin stuff */

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

    function getPriceFor(address buyer)
        view
        public
        returns (uint)
    {
        return salePrice;
    }

    function isTokensaleOnFor(address buyer)
        view
        public
        returns (bool)
    {
        return (token.allowance(tokenSeller, this) > 0 &&
            block.timestamp >= saleStartTime && block.timestamp <= saleEndTime);
    }

}
