const keythereum = require('keythereum')
const os = require('os')
const path = require('path')
const fs = require('fs')
var Web3 = require('web3');

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
              keythereum.exportToFile(keyObject, dir, path =>{
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

              fs.readdir(dir, function(err, files) {
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
}
