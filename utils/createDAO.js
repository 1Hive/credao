import { abi as TemplateABI } from "../../1hive/airdrop/build/contracts/Template.json"
import { abi as AirdropABI } from "../../1hive/airdrop/build/contracts/Airdrop.json"
import { abi as KernelABI } from "@aragon/os/build/contracts/Kernel.json"
import { ethers } from "ethers"
import { getUserInstallation, updateInstallationDAO } from "./installation"
const templateAddress = "0xD13a7D8A728692eB2c56135B5EB5A1951b3F8395"
const SAMPLE_MNEMONIC = "explain tackle mirror kit van hammer degree position ginger unfair soup bonus"
const airdropAppId = "0x9de6599338eae7c86e73fdfe876b54eb1c3c4c67db74ee25a60bc07f72576feb"
import merklize from './merklize'
import ipfsClient from 'ipfs-http-client'

export async function createDAO({userId, installationId}, createCallback){
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")

  let { autoKey, installationByInstallationId: { name } } = await getUserInstallation({userId, installationId})

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
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  let { autoKey, installationByInstallationId: { dao } } = await getUserInstallation({userId, installationId})
  let wallet = (new ethers.Wallet(autoKey)).connect(provider)

  let kernel = new ethers.Contract(dao, KernelABI, wallet)

  let airdropInstalledEvent = kernel.filters.NewAppProxy()

  let airdropProxy = await new Promise((resolve, reject)=>{
    kernel.on(airdropInstalledEvent, (proxyAddress, upgradeable, appId)=>{
      if(appId === airdropAppId)
        resolve(proxyAddress)
    })
  })

  let airdropper = new ethers.Contract(airdropProxy, AirdropABI, wallet)

  let withDummyAddresses = cred.map((c,i)=>({address: (ethers.Wallet.fromMnemonic(SAMPLE_MNEMONIC, `m/44'/60'/${i}'/0/0`)).address, points: c.cred}))
  let merklized = merklize("some_id", withDummyAddresses)

  let ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')
  let res = await ipfs.add(Buffer.from(JSON.stringify(merklized), 'utf8'))
  let hash = res[0].hash

  let tx = await airdropper.start(merklized.root, `ipfs:${hash}`, {gasLimit: 1000000})
  await tx.wait()
}
