const {Wallet} = require("./wallet.js");
const {Transaction} = require("./transaction.js")
const {Block} = require("./block.js");
const {Database} = require("./database.js");
const {COIN, COINBASE, Hashes} = require("./crypto.js")

class Chain{
    constructor(height){
        this.height = height;
    }

    //returns promise for last block
    static async getLastBlock(){
        return new Promise(resolve=>{
            resolve(Database.grabBlock(this.height));
        })
    }


    //creates a genesis block
    static createGenesis(miner, difficulty){
        
        const difficulty = 10 * Hashes.MEGAHASH;
        const reward = this.getReward(0);
        const prevousHash = "0";
        const height = 0;
        const genesis = new Block
        (
            miner, 
            prevousHash,
            difficulty,
            height
        );

        genesis.addOutput(miner, reward);
        genesis.finish();

        return genesis;
    }


    //reward starts a 100 coins and halves every 100000 blocks
    static getReward(height){
        const epochs = Math.floor(height/100000);

        return (100 * COIN) * Math.pow(0.5, epochs);
    }

    static async verifyTransaction(transac){
        return new Promise(async resolve =>{
            const sender = transac.sender; 
            const amount = Transaction.sumAmount(transac);
            const senderinfo = await Database.grabAccount(sender);

            if (senderinfo.balance < amount){
                resolve(false)
            }
            else if (!Transaction.verifySignature(transac)){
                resolve(false)
            }
            else{
                resolve(true);
            }
        })
    }


    static async verifyAndFufillTransactions(block){
        return new Promise(async resolve=>{
            for (const transac of block.transactions){
                if ((await this.verifyTransaction(transac)) === true){
                    //fufill transaction and change data in database
                    Database.updateRecipients(transac);
                    Database.updateSender(transac);
                }
                else{
                    //remove transaction from block
                    await block.transactions.splice(block.transactions.indexOf(transac),1);
                }
            }

            resolve(true);
        })
    }


    static async verifyNewBlock(block){
        return new Promise(async resolve=>{
            const previousBlock = await this.grabLastBlock();

            if (previousBlock.header != block.previousHeader){
                resolve(false);
            }
            else{
                resolve(true);
            }
        })
           
    }
}
