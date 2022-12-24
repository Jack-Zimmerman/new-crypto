const crypto = require('crypto');
const MerkleTree = require("merkletreejs")
const elliptic = require("elliptic")

const {
    COIN, 
    sha256,
    checkIfSumLess,
    generateTarget,
    hexify,
    COINBASE
} = require("./crypto.js")


class Transaction{
    constructor(sender, nonce){
        this.sender = sender;
        this.timeStamp = Date.now()
        this.outputs = [];
        this.note = null;
        this.signature = null;
        this.nonce = nonce;
        this.hash = null;
    }

    addNote(note){
        note = JSON.stringify(note);
        if (note.length > 100){
            throw new Error("Note length is too long");
        }
        else{
            this.note = note;
        }
    }

    addOutput(to, amount){
        this.outputs.push(
            {
                reciever : to,
                amount : amount,
            }
        );
    }

    static sumAmount(transaction){
        let final = 0;

        for (let out of transaction.outputs){
            final += out.amount;
        }

        return final;
    }

    static verifySignature(transaction){
        let hashMessage = sha256(JSON.stringify(transaction.outputs) + transaction.timestamp + transaction.nonce + transaction.sender + transaction.note)
        let key = (new elliptic.ec('secp256k1')).keyFromPublic(transaction.sender, 'hex')
        return key.verify(hashMessage, transaction.signature)
    }


    static createCoinBaseTransaction(address, amount){
        let transac = new Transaction(COINBASE, 0)
        transac.addOutput(address, amount)
        return transac
    }
}



module.exports = {Transaction};