import fetch from 'isomorphic-unfetch'
import { ethers } from "ethers"
const SAMPLE_PRIVATE_KEY = "a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563"

export async function getCred({installationId, githubToken, after}){
  let afterParam = after ? `&after=${after}` : ''
  let res = await fetch(`/api/cred/${installationId}?githubToken=${githubToken}${afterParam}`)
  res = await res.json()
  if(res.job){
    await timeout(10000)
    return await getCred({installationId, githubToken})
  } else
    return res.data
}

export async function timeout(ms){
  return await new Promise(resolve => setTimeout(resolve, ms));
}

export async function gasTopup(to){
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  let wallet = (new ethers.Wallet(SAMPLE_PRIVATE_KEY)).connect(provider)
  let value = ethers.utils.parseEther('0.1');
  let tx = await wallet.sendTransaction({ to, value });
  await tx.wait()
}
