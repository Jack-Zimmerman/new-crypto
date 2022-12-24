const crypto = require('crypto');
const MerkleTree = require("merkletreejs")
const elliptic = require("elliptic")
const fileStream = require('fs');



const {
    COIN, 
    sha256,
    checkIfSumLess,
    generateTarget,
    hexify
} = require("./crypto.js")


class Wallet{
    constructor(name){
        this.name = name;
        this.path = `wallets/${this.name}.dat`
    }
    
    checkIfExists(){
        if (fileStream.existsSync(this.path)){
            return true
        }
        else{
            return false
        }
    }

    //getOldWallet if exists
    grab(){
        if(this.checkIfExists()){
            const wallet = JSON.parse(fileStream.readFileSync(this.path))
            this.created = wallet.created
            this.private = wallet.private
            this.public = wallet.public
            this.nonce = wallet.nonce
        }
        else{
            throw new Error("wallet does not exist")
        }
    }

    createNewWallet(){
        this.created = Date.now()
        this.nonce = 0;
        //create Private and Public key
        let curve = new elliptic.ec("secp256k1");
        let tempPair = curve.genKeyPair()
        this.private = tempPair.getPrivate("hex")
        this.public = tempPair.getPublic().encodeCompressed("hex")

        //writing to file
        if(fileStream.existsSync(this.path)){
            return false;
        }
        else{
            fileStream.openSync(this.path, 'w')
            fileStream.writeFileSync(this.path, JSON.stringify(this))
        }

        return true
    }

    async incrementNonce(){
        this.nonce++;
        let wallet = JSON.parse(fileStream.readFileSync(this.path))

        wallet.nonce++;
        fileStream.writeFileSync(this.path, JSON.stringify(wallet))
    }

    //mutable
    //signs transaction and adds a header(hash)
    signTransaction(transaction){
       let hash = sha256(JSON.stringify(transaction.outputs) + transaction.timestamp + transaction.nonce + transaction.sender)
       transaction.hash = hash
       this.incrementNonce()
       transaction.signature = (new elliptic.ec("secp256k1")).sign(hash, this.private, "hex").toDER("hex")
       return transaction
    }
}

module.exports = {Wallet}