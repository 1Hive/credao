import { abi as TemplateABI } from "../../1hive/airdrop/build/contracts/Template.json"
import { abi as AirdropABI } from "../../1hive/airdrop/build/contracts/Airdrop.json"
import { abi as KernelABI } from "@aragon/os/build/contracts/Kernel.json"
import { ethers } from "ethers"
import { getInstallationUser, updateInstallationDAO } from "./installation"
const templateAddress = "0xD13a7D8A728692eB2c56135B5EB5A1951b3F8395"
const SAMPLE_MNEMONIC = "explain tackle mirror kit van hammer degree position ginger unfair soup bonus"
const airdropAppId = "0x9de6599338eae7c86e73fdfe876b54eb1c3c4c67db74ee25a60bc07f72576feb"
import merklize from './merklize'
import ipfsClient from 'ipfs-http-client'
import Web3 from 'web3'
let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
let ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

export async function createDAO({userId, installationId}, createCallback){
  let { autoKey, installationByInstallationId: { name } } = await getInstallationUser({userId, installationId})

  let wallet = (new ethers.Wallet(autoKey)).connect(provider)

  let template = new ethers.Contract(templateAddress, TemplateABI, wallet)

  let deployDaoEvent = template.filters.DeployDao()
  template.on(deployDaoEvent, async (dao, e)=>{
    console.log("deployDaoEvent", dao)
    if(e.transactionHash === tx.hash){
      await updateInstallationDAO({id: installationId, dao})
      createCallback(dao)
    }
  })

  let tx = await template.newInstance({gasLimit: 7000000})
  return await tx.wait()
}

export async function airdrop({userId, installationId, cred}){
  let { autoKey, installationByInstallationId: { dao } } = await getInstallationUser({userId, installationId})
  let wallet = (new ethers.Wallet(autoKey)).connect(provider)
  let airdropper = await getAirdropper({dao, wallet})

  // let mappedToAddresses = await Promise.all(Object.keys(cred.points).map(async (name, i)=>{
  //   let address = (ethers.Wallet.fromMnemonic(SAMPLE_MNEMONIC, `m/44'/60'/${i}'/0/0`)).address
  //   let points = cred.points[name]
  //   return {address, points}
  // }))

  let merklized = merklize("some_id", cred.cred, cred.start, cred.end)

  let res = await ipfs.add(Buffer.from(JSON.stringify(merklized), 'utf8'))
  let hash = res[0].hash

  console.log(merklized, hash, airdropper)

  let tx = await airdropper.start(merklized.root, `ipfs:${hash}`, {gasLimit: 1000000})
  await tx.wait()
}

export async function getAirdropper({dao, wallet}){
  // let kernel = new ethers.Contract(dao, KernelABI, provider)
  // let proxy = await kernel.getApp(await kernel.APP_BASES_NAMESPACE(), airdropAppId)
  // return new ethers.Contract(proxy, AirdropABI, wallet || provider)

  // let kernel = new ethers.Contract(dao, KernelABI, provider)
  let kernel = new web3.eth.Contract(KernelABI, dao)
  let airdroppers = (await kernel.getPastEvents("NewAppProxy", {fromBlock: 0})).filter(e=>e.returnValues.appId===airdropAppId).map(e=>e.returnValues.proxy)
  return new ethers.Contract(airdroppers[0], AirdropABI, wallet || provider)
}
