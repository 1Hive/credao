const TemplateABI = require("../../1hive/airdrop/build/contracts/Template.json").abi
const AirdropABI = require("../../1hive/airdrop/build/contracts/Airdrop.json").abi
const KernelABI = require("@aragon/os/build/contracts/Kernel.json").abi
const { ethers } = require("ethers")
const { getContributor, getContributorAddress, updateInstallationDAO } = require("./query")
const { gasTopup } = require('./')
const merklize = require('./merklize')
const ipfsClient = require('ipfs-http-client')

let templateAddress = "0xE6D1497b94372F6A297cC084d1ec41A53Aa19179"
const SAMPLE_MNEMONIC = "explain tackle mirror kit van hammer degree position ginger unfair soup bonus"
const airdropAppId = "0x9de6599338eae7c86e73fdfe876b54eb1c3c4c67db74ee25a60bc07f72576feb"
let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
let ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')

module.exports = {
  createDAO,
  airdrop,
  getAirdropper
}

async function createDAO({jwt, userId, installationId}){
  let { autoKey, installationByInstallationId: { name, target } } = await getContributor({jwt, userId, installationId})
  let wallet = (new ethers.Wallet(autoKey)).connect(provider)

  if((await wallet.getBalance()).isZero())
    await gasTopup(wallet.address)

  const template = new ethers.Contract(templateAddress, TemplateABI, wallet)
  console.log("target", target)
  const tx = await template.newInstance(target, {gasLimit: 7000000})
  await tx.wait()

  return new Promise((resolve, reject)=>{
    template.on("DeployDao", async (dao, e)=>{
      if(e.transactionHash === tx.hash){
        template.removeListener("DeployDao")
        resolve(dao)
      }
    })
  })
}

async function airdrop({jwt, userId, installationId, diff}, droppedCallback){
  let { autoKey, installationByInstallationId: { dao } } = await getContributor({jwt, userId, installationId})
  let wallet = (new ethers.Wallet(autoKey)).connect(provider)
  let airdropper = await getAirdropper({dao, wallet})

  diff.cred = await Promise.all(diff.cred.map(
    async c=>( { ...c, address: await getContributorAddress({jwt, username: c.username, installationId}) } )
  ))

  let merklized = merklize("some_id", diff.cred, diff.start, diff.end)

  let res = await ipfs.add(Buffer.from(JSON.stringify(merklized), 'utf8'))
  let hash = res[0].hash

  let tx = await airdropper.start(merklized.root, `ipfs:${hash}`, {gasLimit: 1000000})
  await tx.wait()
  droppedCallback(true)
}

async function getAirdropper({dao, wallet}){
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
