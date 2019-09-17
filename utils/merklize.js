const MerkleTree = require("merkle-tree-solidity").default
const utils = require("ethereumjs-util")
const setLengthLeft = utils.setLengthLeft
const setLengthRight = utils.setLengthRight
const csv = require('csvtojson')
const BigNumber = require('bignumber.js');

const decimals = BigNumber(10).pow(18)

export default function(id, recipients) {
  recipients = recipients.reduce((prev, curr)=>{
    let address = curr.address
    let existing = prev.find(u=>u.address===address)
    let amount = BigNumber(curr.points)
    if(existing && existing.amount) existing.amount = existing.amount.add(amount)
    else prev.push({address,amount})
    return prev
  }, [])

  const recipientHashBuffers = recipients.map(r=>{
    r.amount = r.amount.times(decimals)
    let addressBuffer = utils.toBuffer(r.address)
    let amountBuffer = setLengthLeft(utils.toBuffer("0x"+r.amount.toString(16)), 32)
    let hashBuffer = utils.keccak256(Buffer.concat([addressBuffer, amountBuffer]))
    let hash = utils.bufferToHex(hashBuffer)
    r.amount = r.amount.toFixed()

    return hashBuffer
  })

  const merkleTree = new MerkleTree(recipientHashBuffers)

  const root = utils.bufferToHex(merkleTree.getRoot())

  recipients = recipients.map((recipient,idx)=>{
    recipient.proof = merkleTree.getProof(recipientHashBuffers[idx]).map(p=>utils.bufferToHex(p))
    return recipient
  })

  console.log(`root:`, root)

  return {id, root, data: recipients}
}
