/**
 * ICOable token
 * Similar to HumanStandardToken, but with additional features like
 * trade locking until a timestamp.
 * Please deploy a Tokensale contract before deploying this, since the ICOable
 * token needs to know who the token seller contract is to enforce trade lock
 */

pragma solidity ^0.4.18;

import "./StandardToken.sol";

contract ICOableToken is StandardToken {

    /* Public variables of the token */
    string public name;
    uint8 public decimals;
    string public symbol;
    uint public tradableAfter;
    address public tokenSeller;

    /* Modifiers */
    modifier requireTradable() {
        // tokenseller can sell tokens anytime without restrictions
        // others can only trade after the tradable timestamp
        if (msg.sender != tokenSeller) {
            require(block.timestamp > tradableAfter);
        }
        _;
    }

    function ICOableToken(
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        uint _tradableAfter,
        address _tokenSeller)
        public
    {
        tokenSeller = _tokenSeller;
        balances[_tokenSeller] = _initialAmount;
        totalSupply = _initialAmount;
        name = _tokenName;
        decimals = _decimalUnits;
        symbol = _tokenSymbol;
        tradableAfter = _tradableAfter;
    }

    function transfer(address _to, uint256 _value)
        requireTradable
        public
        returns (bool success)
    {
        return StandardToken.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value)
        requireTradable
        public
        returns (bool success)
    {
        return StandardToken.transferFrom(_from, _to, _value);
    }

    /* Approves and then calls the receiving contract */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData)
        public
        returns (bool success)
    {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);

        //call the receiveApproval function on the contract you want to be notified. This crafts the function signature manually so one doesn't have to include a contract in here just for this.
        //receiveApproval(address _from, uint256 _value, address _tokenContract, bytes _extraData)
        //it is assumed that when does this that the call *should* succeed, otherwise one would use vanilla approve instead.
        ERC20RecipientInterface spender = ERC20RecipientInterface(_spender);
        require(spender.receiveApproval(msg.sender, _value, this, _extraData));
        return true;
    }
}
