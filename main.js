import KeyStore from './keystore'

var keystore = new KeyStore();

// keystore.createKeyStore("master").then(function(data){
//
//     console.log("Keystore created ", data)
// })

keystore.getAccountList().then(x => {

    console.log("RESULTS", x)
})

keystore.getBalance('a11f19773d4e43bb4c37ac592d0e0a1eef25f201').then(function(balance){

    console.log(balance)
})