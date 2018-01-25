/**
 * OneClick ICO contract
 * This contract deploys token and tokensale contracts
 */
pragma solidity ^0.4.18;

import "./HumanStandardToken.sol";
import "./ERC20Interface.sol";
import "./Owned.sol";
import "./TokensaleInterface.sol";
import "./BasicTokensale.sol";
import "./ICOableToken.sol";

contract OneClickICO is Owned {
    function OneClickICO(address _initialAdmin)
        Owned(_initialAdmin)
        public
    {
    }

    /**
     * Deploy a token contract
     * The OneClickICO contract will be the owner of all minted tokens
     */
    function createToken(
        uint initialAmount,
        string tokenName,
        uint8 decimalUnits,
        string tokenSymbol)
        public
        returns (address)
    {
        return new HumanStandardToken(initialAmount, tokenName,
            decimalUnits, tokenSymbol);
    }

    function createBasicTokensale(
        uint _saleStartTime,
        uint _saleEndTime,
        uint _salePrice,
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        uint _tradableAfter)
        public
        returns (address, address)
    {
        address tokenSeller = msg.sender;
        // deploy the coin
        ERC20Interface token = new ICOableToken(_initialAmount, _tokenName,
            _decimalUnits, _tokenSymbol, _tradableAfter, tokenSeller);
        // deploy tokensale
        BasicTokensale sale = new BasicTokensale(token, tokenSeller,
            _saleStartTime, _saleEndTime, _salePrice, tokenSeller);
        // give tokensale allowance to transfer all the tokens
        token.approve(sale, _initialAmount);
        return (sale, token);
    }
}
