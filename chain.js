const {Wallet} = require("./wallet.js");
const {Transaction} = require("./transaction.js")
const {Block} = require("./block.js")
const {Database} = require("./database.js");
const {COIN, COINBASE, Hashes, generateTarget, tryNonceHash, getReward} = require("./crypto.js");

class Chain{
    constructor(height){
        this.height = height;
    }

    //returns promise for last block
    async getLastBlock(){
        return new Promise(resolve=>{
            resolve(Database.grabBlock(this.height));
        })
    }


    //creates a genesis block
    createGenesis(miner, difficulty){
        const reward = getReward(0);
        const prevousHash = "0";
        const height = 0;
        const genesis = new Block(miner, prevousHash, 0, difficulty)

        return genesis;
    }




    async verifyTransaction(transac){
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


    async verifyAndFufillTransactions(block){
        return new Promise(async resolve=>{
            const removals = [];
            let coinbases = 0;
            for (const transac of block.transactions){
                let valid = true;
                if (transac.sender == COINBASE && coinbases === 0){
                    coinbases++;
                    const neededReward = getReward(block.height);
                    const coinbaseTransac = transac;

                    if (coinbaseTransac.outputs[0].reciever != block.miner){
                        valid = false;
                    }
                    else if(coinbaseTransac.outputs[0].amount != neededReward){
                        valid = false;
                    }
                    else{
                        Database.updateRecipients(transac);
                    }
                }
                else if (coinbases > 0){
                    //remove transaction from block
                    valid = false;
                }
                else if ((await this.verifyTransaction(transac)) === true){
                    //fufill transaction and change data in database
                    Database.updateRecipients(transac);
                    Database.updateSender(transac);
                }

                //if invalid, remove from block
                if (valid === false){
                    await block.transactions.splice(block.transactions.indexOf(transac),1);
                    removals.push(transac);
                }
            }

            resolve(removals);
        })
    }



    async verifyNewBlock(block){
        return new Promise(async resolve=>{
            const previousBlock = await this.getLastBlock();
            const target = generateTarget(block.difficulty);
            

            if (previousBlock.hash != block.previousHash){
                resolve(false);
            }
            else if (previousBlock.height + 1 != block.height){
                resolve(false);
            }
            else if (!tryNonceHash(target, block.header, block.nonce)){ //if fake difficulty, -> reject
                resolve(false);
            }
            else{
                const allowed = await block.transactions.filter(this.verifyTransaction);
                if (allowed.length < block.transactions){ //some had been removed
                    resolve(false);
                }
                else{
                    await this.verifyAndFufillTransactions(block);
                    resolve(true);
                }
                
            }
        })
           
    }


    async tryAddNewBlock(block, isGenesis=false){
        return new Promise(async resolve =>{
            if(!isGenesis){
                const valid = await this.verifyNewBlock(block);

                if (valid){
                    await Database.addBlock(block);
                    resolve(true);
                }
                else{
                    resolve(false);
                }
            }
            else{
                await this.verifyAndFufillTransactions(block);
                await Database.addBlock(block);
                resolve(true);
            }
        })
    }
}


module.exports = {Chain};