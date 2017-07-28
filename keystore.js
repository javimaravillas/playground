const keythereum = require('keythereum')
const os = require('os')
const path = require('path')
const fs = require('fs')
const Web3 = require('web3');
const file = require('fs')
const solc = require('solc');
const secp256k1 = require('secp256k1')

const params = { keyBytes: 32, ivBytes: 16 }
const options = {
  kdf: "scrypt",
  cipher: "aes-128-ctr",
  kdfparams: {
    c: 262144,
    dklen: 32,
    prf: "hmac-sha256"
  }
};

export default class KeyStore{

  constructor(){

    this.web3 = new Web3();

    //Setting Ropsten by default
    this.web3.setProvider(new this.web3.providers.HttpProvider('https://mainnet.infura.io/'));
  }

  async createKeyStore(password){

    return new Promise((resolve, reject) => {

      try{
        keythereum.create(params, dk => {

          keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, keyObject => {

            this.getPath().then(dir => {
              keythereum.exportToFile(keyObject, path.join(dir, 'keystore'), path =>{
                console.info("Keystore created at ", path);
                resolve(path);
              });
            })

          });
        });
      } catch(error){
        console.error("Exception creating the keystore")
        reject(error);
      }
    })
  }

  async getPath(){
    const dir = path.join(os.homedir(),'.poc_electron')

    return new Promise((resolve, reject) => {

      try{

        fs.exists(dir, exist => {
          if(exist){
            resolve(dir)
          }else{
            fs.mkdir(dir, parseInt(744, 8), err=>{
              if(err){
                reject(err);
              }else{
                resolve(dir)
              }
            })
          }
        })

      } catch(error){
        console.error("I/O Exception keystore path")
        reject(error);
      }
    })

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, parseInt(744,8))
    }

    return dir;
  }

  async getBalance(address){

    console.log(address)

    return this.web3.eth.getBalance(address)
  }

  async getAccountList(){

      var files = await this.getKeyStores()
      var results = [];
      // Using ES7 async awaiy and for let of
      for (let file of files) {

          if(file.lastIndexOf('--') == 29){
              try{
                  var address = file.substring(31)
                  var balance = await this.getBalance(address)
                  var balanceEth = this.web3.fromWei(balance, 'ether');
                  console.log("Balance ETH ", balanceEth)
                  results.push({
                      'address': address,
                      'balanceEth': this.web3.fromWei(balance, 'ether').toString(),
                      'balanceFinney': this.web3.fromWei(balance, 'finney').toString(),
                      'balanceWei': this.web3.fromWei(balance, 'wei').toString()
                  })
              } catch(err){

                  console.log("Web3 error trying to get the balance")
              }
          }
      }

      return results;

      // Bellow example is using ES6
      // return await Promise.all(files.map(async (file) => {
      //     var results = []
      //     if(file.lastIndexOf('--') == 29){
      //         var address = file.substring(31)
      //         try{
      //             var balance = await this.getBalance(address)
      //             var balanceEth = this.web3.fromWei(balance, 'ether');
      //             console.log("Balance ETH ", balanceEth)
      //             results.push({
      //                 'address': address,
      //                 'balance': balanceEth
      //             })
      //         } catch(err){
      //
      //           console.log("Web3 error trying to get the balance")
      //         }
      //     }
      //
      //     return results;
      // }));

  }

  async getKeyStores(){

      var dir = await this.getPath();

      return new Promise((resolve, reject) => {

          try{

              fs.readdir(path.join(dir, 'keystore'), function(err, files) {
                if(err){

                  reject(err)
                } else{

                  resolve(files)
                }

              });

          } catch(error){
              console.error("I/O Exception keystore reading files")
              reject(error);
          }
      })
  }

  async compileContract(fileName) {

      return new Promise((resolve, reject) => {

          var contractFile = path.join(__dirname, fileName)

          try {
            var contractCode = file.readFile(contractFile, (err,data) =>{                

            
            var input = {
                fileName: data.toString()                
            };
            var output = solc.compile({sources: input}, 1);
            // for (var contractName in output.contracts){
            //     console.log(contractName + ': ' + output.contracts[contractName].bytecode);
            //     console.log(contractName + '; ' + JSON.parse(output.contracts[contractName].interface));
            // }
            
            console.log(Object.keys(output.contracts)[0])

            resolve(output.contracts[Object.keys(output.contracts)[0]])
            })
          } catch (err){
                reject(err)
          }
      })      
  }

  async getPrivateKey(keystore, password){
    
    return new Promise((resolve, reject) => {

          try{
            keythereum.recover(password, keystore, function (privateKey) {

              if(secp256k1.privateKeyVerify(privateKey)){
                resolve(privateKey)
              }                
              else{
                reject("The private key is not valid")
              }

             });
          } catch (err) {
              reject(err)
          }
          
    }) 

  }

  async openKeyStore(keystore){

    var address = keystore

    var datadir = await this.getPath()
      
    return new Promise((resolve, reject) => {

          try{
            keythereum.importFromFile(address, datadir, function (keyObject) {
              resolve(keyObject)
             });
          } catch (err) {
              reject(err)
          }
          
    }) 
    
  }

  privateKeyVerify(privateKey) {

      return secp256k1.privateKeyVerify(privateKey)

  }

  async deployContract(fileName, privateKey) {

      var compileContract = await this.compileContract(fileName)
      
      const bytecode = compileContract.bytecode
      const abi = JSON.parse(compileContract.interface)

      // Contract object
      const contract = this.web3.eth.contract(abi);

      // Get contract data
      const contractData = contract.new.getData({
          data: '0x' + bytecode
      });

      //Raw Transaction
      const rawTx = this.createRawTransaction()

      // Sign and serialize the transaction
      const tx = new Tx(rawTx);
      tx.sign(privateKey);
      const serializedTx = tx.serialize();
      
      return new Promise(function (resolve, reject){
        // Send the transaction
        this.web3.eth.sendRawTransaction(serializedTx.toString('hex'), (err, hash) => {
            if (err)
              reject(err)
            
            // Log the tx, you can explore status manually with eth.getTransaction()
            console.log('contract creation tx: ' + hash);
            resolve(hash)            
        });
      }.bind(this))    
  }

  createRawTransaction() {
      // Construct the raw transaction
      const gasPrice = this.web3.eth.gasPrice;      
      const nonce = this.web3.eth.getTransactionCount(this.web3.eth.coinbase);     

      const rawTx = {
          nonce: this.web3.toHex(nonce),
          gasPrice: this.web3.toHex(gasPrice),
          gasLimit: this.web3.toHex(300000),
          data: contractData,
          from: this.web3.eth.coinbase
      };

      console.log(rawTx);

      return rawTx
  }

  waitForTransactionReceipt(hash) {
    console.log('waiting for contract to be mined');
    const receipt = this.web3.eth.getTransactionReceipt(hash);
    
    if (!!receipt) {
        setTimeout(() => {
            this.waitForTransactionReceipt(hash);
        }, 1000);
    } else {
        // The transaction was mined, we can retrieve the contract address
        console.log('contract address: ' + receipt.contractAddress);        
    }
}
  
}
