const utils = require("ethereumjs-util")
const BN = require('bn.js');
const BigNumber = require('bignumber.js');

const setLengthLeft = utils.setLengthLeft
const setLengthRight = utils.setLengthRight

let num = "2.1094557728041696"
let numBN = new BN(num)
let numBigNumber = BigNumber(num)

// let addressBuffer = utils.toBuffer("0xb4124cEB3451635DAcedd11767f004d8a28c6eE7")
let numBufferBN = setLengthLeft(utils.toBuffer(numBN.toString()), 32)
let numBufferBigNumber = setLengthLeft(utils.toBuffer(numBigNumber.toFixed()), 32)
// let hashBuffer = Buffer.concat([numBuffer])

console.log(numBufferBN)
console.log(numBufferBigNumber)
// console.log("hash", utils.bufferToHex(utils.keccak256(numBuffer)))
