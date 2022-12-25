const {Wallet} = require("./wallet.js");
const {Transaction} = require("./transaction.js")
const {Block} = require("./block.js");
const {Database} = require("./database.js");
const {Chain} = require("./chain.js");
const { generateTarget } = require("./crypto.js");



test()


async function test(){
    const wallet = new Wallet("jack-wallet");
    await wallet.grab();
    const chain = new Chain(0);

    const genesis = chain.createGenesis(wallet.public, 1000);
    await genesis.finish(wallet);
    const target = generateTarget(genesis.difficulty);
    let nonce = 0;
    while(!genesis.tryNonce(target, nonce)){
        nonce++;
    }

    console.log(await chain.tryAddNewBlock(genesis, isGenesis=true));
}


