const fs = require('fs');
const {Transaction} = require("./transaction.js")


class Database{
    static createDatabase(){
        if (fs.existsSync("storage/data")){
            return false;
        }
        else{
            let data = {
                height : -1,
                created : Date.now(),
            }

            data = JSON.stringify(data);

            fs.writeFileSync("storage/data.dat", data, err=>{
                if (err) throw err;
            });
        }
    }

    static async addBlock(block){
        return new Promise(async resolve => {//write to file that the block's height applies to
            //floor to nearest 100
            let relheight = Math.floor(block.height / 100) * 100;


            const filestring = `storage/blocks/${relheight}.dat`

            //if the file does not exist yet, start an array
            if(!fs.existsSync(filestring)){
                const chaindata = [block];
                fs.writeFile(filestring, JSON.stringify(chaindata), err=>{
                    if (err) throw err;

                    resolve(true);
                });
            }
            else{
                fs.readFile(filestring, async (err, data)=>{
                    if(err) throw err;
    
                    let chaindata = await JSON.parse(data);
                    
                    //if the block is already in the chain, dont add again
                    if (chaindata.indexOf(block) == -1){
                        await chaindata.push(block);

                        fs.writeFile(filestring, JSON.stringify(chaindata), err=>{
                            if (err) throw err;
        
                            resolve(true);
                        });
                    }
                    else{
                        resolve(null);
                    } 
                })
            }
        })
    }

    static async getData(){
        return new Promise(resolve=>{
            fs.readFile("storage/data", (err, data)=>{
                if (err) throw err;

                resolve(JSON.parse(data));
            })
        })
    }


    static async grabBlock(height){
        return new Promise(async resolve =>{
            const relheight = Math.floor(height / 100) * 100;

            const filestring = `storage/blocks/${relheight}.dat`

            fs.readFile(filestring, (err, data) =>{
                if (err) throw err;

                let blockSet = data;

                blockSet = JSON.parse(blockSet);

                //retrieve block using height away from relheight:

                resolve(blockSet[height%100]);
            })
        })
    }


    //updates/creates accounts and makes appropiate changes to balance for everyone who was sent an output
    static async updateRecipients(transac){
        return new Promise(resolve =>{
            transac.outputs.map(async (output)=>{
                const filestring = `storage/accounts/${output.reciever.substring(0,4)}.dat`;
                if (fs.existsSync(filestring)){
                    fs.readFile(filestring, async (err, data)=>{
                        if(err) throw err;
    
                        const dataObj = await JSON.parse(data);
    
                        if (output.reciever in dataObj){
                            dataObj[output.reciever].balance += output.amount;
                        }
                        else{
                            dataObj[output.reciever] = {
                                balance: output.amount,
                                noncesUsed: []
                            };
                        }

                        fs.writeFile(filestring, JSON.stringify(dataObj), (err)=>{
                            if (err) throw err;
                        })


                    })
                }
                else{
                    const dataObj = {[output.reciever] : {
                        balance: output.amount,
                        noncesUsed: []
                    }};

                    fs.writeFile(filestring, JSON.stringify(dataObj), (err)=>{
                        if (err) throw err;
                    })
                }
                
            })

            resolve(true);
        })
    }

    //accounts are stored according to the first 2 bytes of the account, so 65535 different smaller file systems from which the account data can be pulled
    static async updateSender(transaction){
        return new Promise(resolve =>{
            const sender = transaction.sender;
            const amount = Transaction.sumAmount(transaction);
            //file starts with first 2 bytes of data
            const filestring = `storage/accounts/${sender.substring(0,4)}.dat`

            //if exists, read and add to hashmap
            if(fs.existsSync(filestring)){
                fs.readFile(filestring, (err, data)=>{
                    if (err) throw err;
                    const dataObj = JSON.parse(data);
                    
                    //is account a key
                    if (sender in dataObj){
                        const current = dataObj[sender];
                        //add transaction to nonces used
                        current.noncesUsed.push(transaction.nonce);
                        dataObj[sender] = {
                            balance: current.balance -amount,
                            noncesUsed : current
                        }
                    }
                    else{
                        dataObj[sender] = {
                            balance: amount,
                            noncesUsed: [transaction.nonce]
                        }
                    }


                    fs.writeFile(filestring, JSON.stringify(dataObj), (err) =>{
                        if (err) throw err;
                        resolve(true);
                    });

                    
                })
            }
            else{
                throw new Error("Coins cannot be send from an account that has not been created")
            }
        })
    }

    //get account data for a certain account, returns false if does not exist
    static async grabAccount(account){
        return new Promise(resolve=>{
            const filestring = `storage/accounts/${account.substring(0,4)}.dat`
            
            if (fs.existsSync(filestring)){
                fs.readFile(filestring, async (err, data)=>{
                    if(err) throw err;


                    const dataObj = await JSON.parse(data);

                    if (account in dataObj){
                        resolve(dataObj[account]);
                    }
                    else{
                        resolve(false);
                    }
                })
            }
            else{
                resolve(false);
            }
        })
    }


    //optional updates to chain data
    static async updateChainData(newheight=null){
        const obj = await this.getData();
        if (height != null){
            obj[height] = newheight;

            fs.writeFile("storage/data.dat", JSON.stringify(obj), (err)=>{
                if (err) throw err;
            });
        }
    }
}


module.exports = {Database}