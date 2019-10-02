import React, { useState, useEffect } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { AppBar, AppView, Button, Checkbox, EmptyStateCard, Field, IconCheck, IconFundraising, Info, Main, Modal, SidePanel, Text, TextInput, theme } from '@aragon/ui'
import { Grid, Card, Content, Label } from './components'
import { collateCred, NULL_ADDRESS } from './utils'
import csv from 'csvtojson'
import merklize from './merklize'
import ipfsClient from 'ipfs-http-client'
import BigNumber from "bignumber.js"

function App() {
  const { api, network, currentApp, appState, connectedAccount } = useAragonApi()
  // const { appAddress, kernelAddress } = currentApp
  const { distributions, source } = appState

  const [panelOpen, setPanelOpen] = useState(false)
  const [diffModalOpened, setDiffModalOpened] = useState(false)
  const [selected, setSelected] = useState({})
  const [diff, setDiff] = useState()

  useEffect(()=>{
    console.log("source", source);
    console.log("currentApp", currentApp);
    if(!currentApp || !source) return
    (async ()=>{
      let cred = await (await fetch(`http://localhost:4000/cred?dao=${currentApp.kernelAddress}&target=${source}`)).json()
      setDiff(cred)
      console.log("root", cred.data.root)
      console.log("hash", cred.hash)
    })()
  }, [currentApp, source])

  const emptyContainerStyles = {
    display: "flex",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center"
  }

  return (
    <Main>
      <AppView appBar={<AppBar title="Distribution" endContent={<Button mode="strong" onClick={()=>setPanelOpen(true)}>New distribution</Button>} />} >
        <Text>cred source: {source}</Text>
        {diff &&
        <Info background={theme.positive} icon={<IconCheck color="blue" />} title="New airdrop ready" size="mini">
          New source data is available and ready to airdrop. <Button onClick={() => setDiffModalOpened(true)}>View</Button>
        </Info>}
        <Modal visible={diffModalOpened} onClose={() => setDiffModalOpened(false)}>
          {JSON.stringify(diff)}
          <Button onClick={() => setDiffModalOpened(false)}>
            Close modal
          </Button>
        </Modal>
        {diff && <Button mode="strong" onClick={()=>api.start(diff.data.root, `ipfs:${diff.hash}`).toPromise()}>Start Airdrop</Button>}
        {distributions.length ?
        <React.Fragment>
          <Text size="xlarge">Distributions:</Text>
          <Grid>{distributions.map((d, i)=><Distribution distribution={d} selected={!!selected[d.id]} onSelect={(state, args)=>{if(state) selected[d.id]=args; else delete selected[d.id]; setSelected({...selected})}} />)}</Grid>
        </React.Fragment> :
        <div style={emptyContainerStyles}>
          <EmptyStateCard
            actionText="Create distribution"
            onActivate={()=>setPanelOpen(true)}
            text="There are no distributions."
            icon={() => <IconFundraising color="green" />}
          />
        </div>}
      </AppView>
      <SidePanel title={"New Distribution"} opened={panelOpen} onClose={()=>setPanelOpen(false)}>
        <Merklize />
      </SidePanel>
    </Main>
  )
}

function Merklize() {
  const [file, setFile] = useState()
  const [data, setData] = useState()

  useEffect(()=>{
    console.log("file", file)
    if(file){
      let reader = new FileReader()
      reader.onload = async (e)=>{
        let recipients = await csv().fromString(e.target.result)
        let merklized = merklize(file.name.replace('.csv', ''), recipients)
        setData(merklized)
      }
      reader.readAsText(file)
    } else {
      console.log("no file")
      console.log("data", data)
      setData()
    }
  }, [file])

  return (
    <Field label="Load distribution csv:">
      <input type="file" onChange={(e)=>{e.target.files && e.target.files.length && setFile(e.target.files[0])}} />
      <ValidationData data={data} />
      <Button onClick={()=>setFile()}>Clear</Button>
    </Field>
  )
}

function ValidationData({data}){
  const { api } = useAragonApi()

  const [hash, setHash] = useState()
  useEffect(()=>{
    if(!data) {
      setHash()
      return
    }
    (async function(){
      console.log("YO")
      let ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')
      let res = await ipfs.add(Buffer.from(JSON.stringify(data), 'utf8'))
      if(!res) return
      let hash = res[0].hash
      setHash(hash)
      await api.start(data.root, `ipfs:${hash}`).toPromise()
    })()
  }, [data])

  return (
    <React.Fragment>
      {data &&
        (hash ?
          <p>You're data with merkle root ({data.root}) and ipfs hash ({hash}) has been added to ipfs but may need to propagate through the network if it doesn't already appear <a href={`https://ipfs.eth.aragon.network/ipfs/${hash}`} target="_blank">here</a>.</p> :
          <p>no ipfs hash generated. missing local ipfs node?</p>
        )
      }
    </React.Fragment>
  )
}

function Distribution({distribution, username, selected, onSelect}) {
  const { id, dataURI } = distribution
  const { api, connectedAccount } = useAragonApi()

  const [data, setData] = useState()
  useEffect(()=>{
    let ipfsGateway = location.hostname === 'localhost' ? 'http://localhost:8080/ipfs' : 'https://ipfs.eth.aragon.network/ipfs'
    fetch(`${ipfsGateway}/${dataURI.split(':')[1]}`)
      .then(r=>r.json())
      .then(setData)
  }, [dataURI])

  const [received, setReceived] = useState()
  const [userData, setUserData] = useState()
  useEffect(()=>{
    connectedAccount ? api.call('received', id, connectedAccount).toPromise().then(setReceived) : setReceived()

    data && Array.isArray(data.recipients) && setUserData(data.recipients.find(d=>d.address===connectedAccount))

  }, [data, distribution, connectedAccount])

  return (
    <Card>
      <Content>
        <Label>
          <Text color={theme.textTertiary}>#{id} </Text>
        </Label>
        {!data &&
          <Info.Alert style={{"margin-bottom": "10px"}}>Retrieving distribution data...</Info.Alert>}
        {data && !userData && !received &&
          <Info.Alert style={{"margin-bottom": "10px"}}>Nothing to claim for {connectedAccount.slice(0,8)+'...'}</Info.Alert>}
        {data && received &&
          <Info style={{"margin-bottom": "10px"}}>You received from this distribution</Info>}
        {!received && userData &&
          <React.Fragment>
            <Info.Action style={{"margin-bottom": "10px"}}>You can claim <br/>{BigNumber(userData.amount).div("1e+18").toFixed()}</Info.Action>
            <Field>
              <Button mode="strong" emphasis="positive" onClick={async () => {console.log(id, connectedAccount, BigNumber(userData.amount).toFixed(), userData.proof); await api.award(id, connectedAccount, BigNumber(userData.amount).toFixed(), userData.proof).toPromise()}}>Claim</Button>
            </Field>
          </React.Fragment>}
      </Content>
    </Card>
  )
}

export default App
