import React, { Component } from "react"
import bn from "bignumber.js"
import ReactFileDownload from "react-file-download"
import TruffleContract from "truffle-contract"
import Bluebird from "bluebird"
import * as OneClickICOArtifact from "../build/contracts/OneClickICO.json"
import * as BasicTokensaleArtifact from "../build/contracts/BasicTokensale.json"
import * as ERC20InterfaceArtifact from "../build/contracts/ERC20Interface.json"
import getWeb3 from "./utils/getWeb3"


import "./css/oswald.css"
import "./css/open-sans.css"
import "./css/pure-min.css"
import "./App.css"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      account: null,
      networkID: null,
      instance: null,
      contractVersion: null,
      // available once tokensale is deployed
      tokenInstance: null,
      saleInstance: null,
    }
  }

  componentWillMount = async () => {
    let web3, networkID, account;
    try {
      web3 = await getWeb3()
      // promisify web3 functions
      Bluebird.promisifyAll(web3.eth, { suffix: "Promise" })
      Bluebird.promisifyAll(web3.version, { suffix: "Promise" })
      // check network connectivity
      networkID = await web3.version.getNetworkPromise()
      account = (await web3.eth.getAccountsPromise())[0]
    } catch (err) {
      console.error(err)
      alert("Can't load web3! Do you have metamask running?")
      return
    }

    this.setState({
      web3,
      account,
      networkID
    })
    // Instantiate contract once web3 provided.
    await this.instantiateContract()
  }

  instantiateContract = async () => {
    const OneClickICO = TruffleContract(OneClickICOArtifact)
    OneClickICO.setProvider(this.state.web3.currentProvider)
    const instance = await OneClickICO.deployed()
    const contractVersion = await instance.version()
    this.setState({
      instance,
      contractVersion
    })
  }

  handleDeployClick = async () => {
    // read all the params
    const tokenName = this.tokenName.value;
    const tokenDecimals = new bn(this.tokenDecimals.value);
    const tokenSymbol = this.tokenSymbol.value
    const tokenTradableAfter = parseInt(this.tokenTradableAfter.value, 10)
    const tokenTotalSupply = new bn(this.tokenTotalSupply.value)
      .mul(Math.pow(10, tokenDecimals))
    const saleStart = parseInt(this.saleStart.value, 10)
    const saleEnd = parseInt(this.saleEnd.value, 10)
    const salePrice = new bn(this.salePrice.value)

    console.log(saleStart, saleEnd, salePrice, tokenTotalSupply,
      tokenName, tokenDecimals, tokenSymbol, tokenTradableAfter)
    const tx = await this.state.instance.createBasicTokensale(saleStart,
      saleEnd, salePrice, tokenTotalSupply, tokenName, tokenDecimals,
      tokenSymbol, tokenTradableAfter, {
        from: this.state.account,
        // XXX: give a fuck ton of gas
        gas: 2000000
      })
    // get the token and sale addresses from the shit
    const tokenAddr = tx.logs[0].args.token;
    const saleAddr = tx.logs[0].args.tokenSale;
    // get their instances
    const ERC20Interface = TruffleContract(ERC20InterfaceArtifact)
    ERC20Interface.setProvider(this.state.web3.currentProvider)
    const BasicTokensale = TruffleContract(BasicTokensaleArtifact)
    BasicTokensale.setProvider(this.state.web3.currentProvider)
    const tokenInstance = ERC20Interface.at(tokenAddr)
    const saleInstance = BasicTokensale.at(saleAddr)
    // XXX: for debugging purposes
    window.token = tokenInstance;
    window.sale = saleInstance;

    this.setState({
      tokenInstance,
      saleInstance,
    })
    console.log(tokenAddr, saleAddr)
    alert("Your token has been deployed at " + tokenAddr +
      "\nYour tokensale has been deployed at" + saleAddr)
  }

  handleActivateClick = async () => {
    if (!this.state.tokenInstance || !this.state.saleInstance) {
      alert("deploy the shit first!")
      return
    }

    const totalToSell = await this.state.tokenInstance.balanceOf(this.state.account)
    console.log(totalToSell)
    const tx = await this.state.tokenInstance.approve(this.state.saleInstance.address,
      totalToSell, {
        from: this.state.account,
        gas: 100000,
      })
    if (tx.logs[0].event !== "Approval" ||
      tx.logs[0].args._owner !== this.state.account ||
      tx.logs[0].args._spender !== this.state.saleInstance.address ||
      tx.logs[0].args._value.toString() !== totalToSell.toString()) {
      alert("something went wrong!")
      return
    }
    alert("awesome! ICO activated")
  }

  handleConfigClick = () => {
    if (!this.state.tokenInstance || !this.state.saleInstance) {
      alert("deploy the shit first!")
      return
    }

    ReactFileDownload(JSON.stringify({
      TokenAddr: this.state.tokenInstance.address,
      SaleAddr: this.state.saleInstance.address,
    }), "ico-config.json")
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">Start My ICO!</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Disclaimers</h1>
              <p>Insert some generic bullshit disclaimer here</p>
              {this.state.instance ? (
                <div>
                  <h2>Version Info</h2>
                  <p>You are on <strong>{this.state.networkID === 1 ? "mainnet" : "testnet"}</strong>
                    {" "}({this.state.networkID}).</p>
                  <p>OneClickICO: <strong>{this.state.instance.address}</strong>
                    {" "}(v{this.state.contractVersion})</p>
                  <p>Your address: <strong>{this.state.account}</strong></p>
                </div>
              ) : <p>web3 is loading!</p>}
            </div>
            <div className="pure-u-1-1">
              <h1>Make my ICO now!</h1>
              <ol>
                <li>Fill in all the params</li>
                <li>Click <strong>Deploy!</strong></li>
                <li>Send the transaction through Metamask</li>
                <li>Click <strong>Activate Tokensale!</strong> (don't worry, it won't accept payments until the start time you defined)</li>
                <li>Send another transaction through Metamask</li>
                <li>Click <strong>Download Tokensale Website Template</strong></li>
                <li>Click <strong>Download Tokensale Config</strong></li>
                <li>Unzip, paste the tokensale config in tokensale template. Overwrite all the files</li>
                <li>`npm start` and boom you have a working ICO!</li>
              </ol>
              <p>
                NOTE: StartMyICO service is completely free. However you will have to
                pay a small fee to the network in order to deploy the contracts.
              </p>
              <div>
                <h2>ERC20 Token Params</h2>
                <div>
                  <label>Name
                    <input type="text" name="tokenName" defaultValue="Bullshit Token"
                      ref={(c) => this.tokenName = c} />
                  </label>
                </div>
                <div>
                  <label>Decimal Units
                    <input type="number" name="tokenDecimals" min="0" defaultValue="18"
                      ref={(c) => this.tokenDecimals = c} />
                  </label>
                </div>
                <div>
                  <label>Symbol
                    <input type="text" name="tokenSymbol" defaultValue="BST"
                      ref={(c) => this.tokenSymbol = c} />
                  </label>
                </div>
                <div>
                  <label>Total Supply
                    <input type="number" name="tokenTotalSupply" min="0"
                      defaultValue="1000000" ref={(c) => this.tokenTotalSupply = c} />
                  </label>
                </div>
                <div>
                  <label>Tradable After (UNIX timestamp, seconds)
                    <input type="number" name="tokenTradableAfter" min="0"
                      defaultValue={Math.round(new Date().getTime() / 1000 + 3600)}
                      ref={(c) => this.tokenTradableAfter = c} />
                  </label>
                </div>
              </div>
              <div>
                <h2>Tokensale Params</h2>
                <div>
                  <label>Start Time (UNIX timestamp, seconds)
                  <input type="number" name="saleStart" min="0"
                      defaultValue={Math.round(new Date().getTime() / 1000)}
                      ref={(c) => this.saleStart = c} />
                  </label>
                </div>
                <div>
                  <label>End Time (UNIX timestamp, seconds)
                  <input type="number" name="saleEnd" min="0"
                      defaultValue={Math.round(new Date().getTime() / 1000 + 3600)}
                      ref={(c) => this.saleEnd = c} />
                  </label>
                </div>
                <div>
                  <label>Sale Price (x wei per min unit of your token)
                  <input type="number" name="salePrice" min="0"
                      defaultValue="1"
                      ref={(c) => this.salePrice = c} />
                  </label>
                </div>
              </div>
              <div>
                <h2>All the buttons</h2>
                <p>Please click those buttons in order from left to right</p>
                <button onClick={() => this.handleDeployClick()}>Deploy!</button>
                <button onClick={() => this.handleActivateClick()}>Activate ICO!</button>
                <button>Download Tokensale Website Template</button>
                <button onClick={() => this.handleConfigClick()}>Download Tokensale Config</button>
              </div>
            </div>
          </div>
        </main>
      </div >
    )
  }
}

export default App
