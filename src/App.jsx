import React, { Component } from "react"
import * as OneClickICOArtifact from "../build/contracts/OneClickICO.json"
import * as Bluebird from "bluebird"
import getWeb3 from "./utils/getWeb3"

const TruffleContract = require("truffle-contract")

import "./css/oswald.css"
import "./css/open-sans.css"
import "./css/pure-min.css"
import "./App.css"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      instance: null,
      contractVersion: null,
      networkID: null,
      web3: null
    }
  }

  componentWillMount = async () => {
    let web3, networkID;
    try {
      web3 = await getWeb3()
      // promisify web3 functions
      Bluebird.promisifyAll(web3.eth, { suffix: "Promise" })
      Bluebird.promisifyAll(web3.version, { suffix: "Promise" })
      // check network connectivity
      networkID = await web3.version.getNetworkPromise()
    } catch (err) {
      console.error(err)
      alert("Can't load web3! Do you have metamask running?")
      return
    }

    this.setState({
      web3,
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
                </div>
              ) : <p>web3 is loading!</p>}
            </div>
          </div>
        </main>
      </div>
    )
  }
}

export default App
