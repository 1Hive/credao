import { abi as TemplateABI } from "../../1hive/airdrop/build/contracts/Template.json"
import { abi as AirdropABI } from "../../1hive/airdrop/build/contracts/Airdrop.json"
import { abi as KernelABI } from "@aragon/os/build/contracts/Kernel.json"
import { ethers } from "ethers"
import { getInstallationUser, getInstallationUserAddress, updateInstallationDAO } from "./query"
import { gasTopup } from './'
const templateAddress = "0xD13a7D8A728692eB2c56135B5EB5A1951b3F8395"
const SAMPLE_MNEMONIC = "explain tackle mirror kit van hammer degree position ginger unfair soup bonus"
const airdropAppId = "0x9de6599338eae7c86e73fdfe876b54eb1c3c4c67db74ee25a60bc07f72576feb"
import merklize from './merklize'
import ipfsClient from 'ipfs-http-client'
let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
let ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')

export async function create({userId, installationId}, createCallback){
  let { autoKey, installationByInstallationId: { name } } = await getInstallationUser({userId, installationId})
  let wallet = (new ethers.Wallet(autoKey)).connect(provider)

  if((await wallet.getBalance()).isZero())
    await gasTopup(wallet.address)

  let template = new ethers.Contract(templateAddress, TemplateABI, wallet)

  template.on("DeployDao", async (dao, e)=>{
    if(e.transactionHash === tx.hash){
      template.removeListener("DeployDao")
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

  cred.collated = await Promise.all(cred.collated.map(
    async c=>( { ...c, address: await getInstallationUserAddress({username: c.username, installationId}) } )
  ))

  let merklized = merklize("some_id", cred.collated, cred.start, cred.end)

  let res = await ipfs.add(Buffer.from(JSON.stringify(merklized), 'utf8'))
  let hash = res[0].hash

  let tx = await airdropper.start(merklized.root, `ipfs:${hash}`, {gasLimit: 1000000})
  await tx.wait()
}

export async function getAirdropper({dao, wallet}){
  let kernel = new ethers.Contract(dao, KernelABI, provider)

  provider.resetEventsBlock(await kernel.getInitializationBlock())

  return await new Promise((resolve, reject)=>{
    kernel.on("NewAppProxy", (proxy, upgradeable, appId, e)=>{
      if(appId === airdropAppId){
        kernel.removeListener("NewAppProxy")
        resolve(new ethers.Contract(proxy, AirdropABI, wallet || provider))
      }
    })
  })
}
