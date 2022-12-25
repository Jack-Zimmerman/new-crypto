const crypto = require("crypto")
const COIN = 100000000

const Hashes = {
    KILOHASH : 1000,
    MEGAHASH : 1000000,
    GIGAHASH : 1000000000
}

const COINBASE = "0".repeat(64)


const sha256 = (string) => {
    let hash = crypto.createHash('sha256');
    return hash.update(string).digest('hex')
}

//takes two hex inputs and returns the sha256 of the addition
const addAndHash = (hex1, hex2) => {
   return sha256(
    BigInt(hexify(hex1)) + BigInt(hexify(hex2)).toString('16')
   ) 
}


//#DEFINE - Method to generate proof when nonce works
    //(where i = nonce) => sha256((BigInt(i) + BigInt(hexify(block.header))).toString(16))
        //returns hexidecimal string representation of proof 
//#END-DEFINE



//adds required header for BigInt constructor to recognize
const hexify = (hexString) =>{
    return "0x" + hexString
}

//takes hex1, hex2, target(hex)
//converts hex into BigInts and then calculates
const checkIfSumLess = (h1, h2, target)=>{
    const hash = addAndHash(h1, h2)
    return BigInt(hexify(hash)) <= BigInt(hexify(target))
}

//DIFFICULTY MUST BE GIVEN IN HEX FORMAT
//returns BigInt converted to hex string
const generateTarget = (difficulty)=>{
    return ((BigInt(2) ** BigInt(256)) / BigInt(hexify(difficulty))).toString(16)
}


const nonceHash = (header, nonce)=>{
    return sha256(
        BigInt(hexify(header)) + BigInt(hexify(nonce)).toString('16')
    ) 
}

const tryNonceHash = (target, header, nonce) => {
    const hash = nonceHash(header,nonce);

    return BigInt(hexify(target)) >= BigInt(hexify(hash));
}


    //reward starts a 100 coins and halves every 100000 blocks
    function getReward(height){
        const epochs = Math.floor(height/100000);

        return (100 * COIN) * Math.pow(0.5, epochs);
    }



//regenerates key object from given hex public key value and verifies signature


module.exports = {
    COIN, 
    sha256, 
    checkIfSumLess,
    generateTarget,
    hexify, 
    Hashes, 
    addAndHash,
    COINBASE,
    nonceHash,
    tryNonceHash,
    getReward
}