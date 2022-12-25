const { sha256, COINBASE, addAndHash, tryNonceHash, nonceHash, getReward} = require("./crypto");
const { Transaction } = require("./transaction");



class Block{
    constructor(miner, previousHash, height, difficulty){
        this.miner = miner;
        this.transactions = [];
        this.timestamp = null;
        this.previousHash = previousHash;
        this.difficulty = difficulty;
        this.height = height;
        this.nonce = null;
        this.hash = null;
    }

    async finish(wallet){
        return new Promise(async resolve=>{
            this.transactions = this.transactions.map(transac =>{
                JSON.stringify(JSON.parse(JSON.stringify(transac)));
            })
            this.timestamp = Date.now();
            this.header = sha256(
                this.miner + this.timestamp + this.previousHash + JSON.stringify(this.transactions)
            )

            this.addCoinbaseTransac(wallet)

            resolve(true)
        })
            
    }

    addTransaction(transac){
        this.transactions.push(transac);
    }

    addCoinbaseTransac(wallet){
        //create coinbase transaction from "0000..." with nonce of 0
        let transac = new Transaction(COINBASE, 0);
        const reward = getReward(this.height);
        transac.addOutput(this.miner, reward);

        //miner signs wallet:
        transac = wallet.signTransaction(transac);
        this.transactions.push(transac);

        return true;
    }

    tryNonce(target, nonce){
        if (tryNonceHash(target, this.header, nonce)){
            this.nonce = nonce;
            this.hash = nonceHash(this.header, this.nonce);
            return true;
        }
        else{
            return false;
        }
    }
}


module.exports = {Block}