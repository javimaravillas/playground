import KeyStore from './keystore'

var keystore = new KeyStore();

// keystore.createKeyStore("master").then(function(data){
//
//     console.log("Keystore created ", data)
// })

// keystore.getAccountList().then(x => {

//     console.log("RESULTS", x)
// })

// keystore.getBalance('a11f19773d4e43bb4c37ac592d0e0a1eef25f201').then(function(balance){

//     console.log(balance)
// })

// keystore.compileContract('test.sol').then(function(code){

//     console.log(code)
// })

keystore.getKeyStores().then(keyStoreFiles => {

    return keyStoreFiles[0]

}).then(keyStoreFileName => {
    
    console.log("then ", keyStoreFileName)

    return keystore.openKeyStore(keyStoreFileName)

}).then( keyStoreObject => {

    return keystore.getPrivateKey(keyStoreObject, "master")

}).then( privateKey => {

    console.log("Private Key ", privateKey)

    console.log("Verify Private Key ", keystore.privateKeyVerify(privateKey))

    const { StringDecoder } = require('string_decoder');
    const decoder = new StringDecoder('hex');
    
    console.log(decoder.write(privateKey));

    
    return keystore.deployContract('test.sol', privateKey)
}).then(transactionHash =>{

    keystore.waitForTransactionReceipt(transactionHash)
})
