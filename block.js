const { sha256 } = require("./crypto");


class Block{
    constructor(miner, previousHeader, height, difficulty, ){
        this.miner = miner;
        this.transactions = [];
        this.timestamp = null;
        this.previousHeader = previousHeader;
        this.header = null;
        this.difficulty = difficulty;
        this.height = height;
        this.nonce = null;
    }

    finish(){
        this.timestamp = Date.now();
        this.header = sha256(
            this.header + this.miner + this.timestamp + this.previousHeader + JSON.stringify(this.transactions)
        )
    }
}


module.exports = {Block: Block}