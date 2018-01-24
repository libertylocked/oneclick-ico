pragma solidity ^0.4.18;

import "./ERC20Interface.sol";

contract TokensaleInterface {
    event TokenSold(address indexed buyer, uint tokenAmount, uint value);
    ERC20Interface public token;

    /**
     * Get the price of token for the buyer
     * x wei per token
     */
    function getPriceFor(address buyer) view public returns (uint);
    function isTokensaleOnFor(address buyer) view public returns (bool);
}
