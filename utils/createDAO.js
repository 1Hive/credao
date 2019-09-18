import { abi as TemplateABI } from "../../1hive/airdrop/build/contracts/Template.json"
import { abi as AirdropABI } from "../../1hive/airdrop/build/contracts/Airdrop.json"
import { ethers } from "ethers"
import { getUserInstallation, updateInstallationDAO } from "./installation"
const templateAddress = "0xD13a7D8A728692eB2c56135B5EB5A1951b3F8395"
const SAMPLE_MNEMONIC = "explain tackle mirror kit van hammer degree position ginger unfair soup bonus"
const airdropAppId = "0x9de6599338eae7c86e73fdfe876b54eb1c3c4c67db74ee25a60bc07f72576feb"
import merklize from './merklize'
import ipfsClient from 'ipfs-http-client'

async function createDAO({userId, installationId}, createCallback){
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")

  let userInstallation = await getUserInstallation({userId, installationId})
  console.log("userInstallation", userInstallation)

  let wallet = (new ethers.Wallet(userInstallation.autoKey)).connect(provider)

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

export default createDAO
