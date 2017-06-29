const keythereum = require('keythereum')
const os = require('os')
const path = require('path')
const fs = require('fs')

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
}
