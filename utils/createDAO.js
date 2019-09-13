import { abi as TemplateABI } from "../../1hive/airdrop/build/contracts/Template.json"
import { abi as AirdropABI } from "../../1hive/airdrop/build/contracts/Airdrop.json"
import { ethers } from "ethers"
const templateAddress = "0xD13a7D8A728692eB2c56135B5EB5A1951b3F8395"
const SAMPLE_PRIVATE_KEY = "a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563"
const SAMPLE_MNEMONIC = "explain tackle mirror kit van hammer degree position ginger unfair soup bonus"
const airdropAppId = "0x9de6599338eae7c86e73fdfe876b54eb1c3c4c67db74ee25a60bc07f72576feb"
import merklizeDistribution from './merklizeDistribution'
import ipfsClient from 'ipfs-http-client'

async function createDAO(id, name, cred, createCallback, statusCallback){
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  let wallet = (new ethers.Wallet(SAMPLE_PRIVATE_KEY)).connect(provider)
  let template = new ethers.Contract(templateAddress, TemplateABI, wallet)

  let deployDaoEvent = template.filters.DeployDao()
  let installedAppEvent = template.filters.InstalledApp()

  statusCallback("creating dao")
  let tx = await template.newInstance({gasLimit: 7000000})

  template.on(deployDaoEvent, (dao, e)=>{
    console.log("deployDaoEvent", dao)
    if(e.transactionHash === tx.hash){
      createCallback(dao)
    }
  })
  template.on(installedAppEvent, (appProxy, appId, e)=>{
    console.log("installedAppEvent", appProxy, appId)
    if(e.transactionHash === tx.hash && appId === airdropAppId){
      let airdropper = new ethers.Contract(appProxy, AirdropABI, wallet)
      console.log("here")
      airdrop(airdropper, cred, statusCallback)
    }
  })

  await tx.wait()
}

async function airdrop(airdropper, cred, statusCallback){
  statusCallback("airdropping cred")

  let withDummyAddresses = cred.map((c,i)=>({address: (ethers.Wallet.fromMnemonic(SAMPLE_MNEMONIC, `m/44'/60'/${i}'/0/0`)).address, points: c.cred}))
  let merklized = merklizeDistribution("some_id", withDummyAddresses)

  let ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')
  let res = await ipfs.add(Buffer.from(JSON.stringify(merklized), 'utf8'))
  if(!res) {
    statusCallback("error adding to ipfs")
    return
  }

  let hash = res[0].hash

  let tx = await airdropper.start(merklized.root, `ipfs:${hash}`, {gasLimit: 1000000})
  await tx.wait()

  statusCallback()
}

export default createDAO
