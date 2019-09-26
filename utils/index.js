import fetch from 'isomorphic-unfetch'
import { ethers } from "ethers"
const SAMPLE_PRIVATE_KEY = "a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563"

export function collateCred({raw, after}){
  let startIdx = 0
  if(after){
    // after = 1566691200000
    startIdx = raw[1].intervalsJSON.findIndex(interval=>interval.startTimeMs >= after)
    if(startIdx === -1) return null
  }

  console.log("startIdx", startIdx)

  const cred = []
  for (let user in raw[1].credJSON){
    let nameArr = user.split('\0')
    if(!nameArr.includes('USER')) continue
    let username = nameArr[nameArr.length-2]
    cred.push({username, points: raw[1].credJSON[user].slice(startIdx).reduce((a, b) => a + b, 0)})
  }

  let intervals = raw[1].intervalsJSON

  return {
    cred,
    start: intervals[startIdx].startTimeMs,
    end: intervals[intervals.length - 1].endTimeMs
  }
}

export async function timeout(ms){
  return await new Promise(resolve => setTimeout(resolve, ms));
}

export async function gasTopup(to){
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  let wallet = (new ethers.Wallet(SAMPLE_PRIVATE_KEY)).connect(provider)
  let value = ethers.utils.parseEther('0.1')
  let tx = await wallet.sendTransaction({ to, value })
  await tx.wait()
}

export async function ipfsFetch(hash){
  let ipfsGateway = location.hostname === 'localhost' ? 'http://localhost:8080/ipfs' : 'https://ipfs.eth.aragon.network/ipfs'
  return await fetch(`${ipfsGateway}/${hash}`)
}
