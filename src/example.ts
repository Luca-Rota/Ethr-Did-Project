import * as dotenv from 'dotenv';
import { EthrDID } from 'ethr-did';
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';
import { ethers } from 'ethers';
import { EthereumDIDRegistry } from 'ethr-did-registry';


dotenv.config();
const API_KEY = process.env.API_KEY;
const API_KEY_SECRET = process.env.API_KEY_SECRET;
const METAMASK_ADDRESS = process.env.METAMASK_ADDRESS;
const METAMASK_PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;


// To create a Ether-DID associated to a provider, a node and a network (and so able to make
// transaction over the network), it is necessary to obtain the DID, through the creation of 
// a EthrDidController inside the EthrDid's constructor. To do that, you have to pass a 
// txSigner to the EthrDid's constructor, in order to avoid the creation of a Wallet object
// without the specification of associated provider (which occur in the EthrDid's constructor).
// There are three ways to do that:

// By means BrowserProvider() - The quickest and easiest way to developing on Ethereum is to 
// use MetaMask. It can work only in a context where it is known the object window, so in a 
// Browser, using an HTML or React application.
// if (window.ethereum == null) {
// If MetaMask is not installed, we use the default provider, without private keys installed so with read-only access
// provider = ethers.getDefaultProvider();
// } else {
// Connect to the MetaMask EIP-1193 object, which have a private key and can read and write
// provider = new ethers.BrowserProvider(window.ethereum);
// signer = await provider.getSigner(); }

// By means JsonRpcProvider() - If you are running your own Ethereum node or using a custom 
// third-party service (e.g. INFURA). If no url is provided, it connects to the default
// "http://localhost:8545", which most nodes use.
// const provider = new ethers.JsonRpcProvider();
// The following getSigner() method works only if the provider was initialized with the default
// url (so working on Ganache); using the API_KEY, it return the error "invalid account".
// To resolve this problem use the Wallet object which inherits Signer and can sign transactions 
// and messages using a private key and passing the previous provider. 

// By means InfuraProvider() - It is defined over JsonRpcProvider(), but it is specific for
// Infura account, permitting also to specify the API_KEY_SECRET, useful for some operations. 
// const provider = new ethers.InfuraProvider("goerli", API_KEY, API_KEY_SECRET);
// The following getSigner() method returns the error Unauthenticated in any case. 


// The EthrDID instance can be used to perform actions such as providing your address, 
// returning the complete DID string, looking up the owner of the DID, verifying a JWT and more.
// Specifying the private key when creating EthrDID to enable operations such as transaction 
// signing and key management. The EthrDID instance can be used as a signer (txSigner) to 
// perform CRUD operations on the DID document on the Ethereum blockchain.
// OPERATION : LOCAL
console.log('Ethr-DID creation on Goerli...');
const chainNameOrId = 'goerli'; 
const provider = new ethers.JsonRpcProvider(API_KEY, "goerli");
const privateKey = METAMASK_PRIVATE_KEY ? METAMASK_PRIVATE_KEY : ethers.Wallet.createRandom().privateKey;
const wallet = new ethers.Wallet(privateKey, provider);
const txSigner = wallet.connect(provider);
console.log("Account:", await txSigner.getAddress());
const identifier = METAMASK_ADDRESS ? METAMASK_ADDRESS : ethers.Wallet.createRandom().publicKey;
const MyEthrDID = new EthrDID({ identifier: identifier, chainNameOrId: chainNameOrId, 
  rpcUrl: API_KEY, provider: provider, txSigner: txSigner });
console.log('Ethr-DID created:', MyEthrDID.did );


// Resolving a DID using EthrDID results in a DID document compliant with the ERC-1056 
// specification. The DID document contains information such as the context (@context), the ID 
// of the DID, verification and authentication methods, and other identity-related information.
// OPERATION : LOCAL 
console.log('Resolving DID...');
const rpcUrl = API_KEY ? API_KEY : "http://localhost:8545";
const didResolver = new Resolver(getResolver({ rpcUrl, name: "goerli" }));
const didDocument = (await didResolver.resolve(MyEthrDID.did)).didDocument
console.log('DID document: ', didDocument);


/*
// To sign a JWT it is necessary to add a delegate, if you create a Ethr-DID using a web3 
// providers, since they are not directly able to sign data in a way that is compliant with 
// the JWT-ES256K standard. This operation is necessary every time since also set the delegate
// that will be used for sign and verify the JWT
// OPERATION : NETWORK - REQUIRED FEE : 0.0001
const { kp, txHash } = await MyEthrDID.createSigningDelegate(); 
console.log(txHash);

// OPERATION : LOCAL 
console.log('Creation of a signed JWT...');
const payload1 = { hello: 'world' };
const signedJWT = await MyEthrDID.signJWT(payload1);
console.log('Signed JWT:', signedJWT);

// OPERATION : LOCAL
console.log('Signed JWT verification...');
const { payload, issuer } = await MyEthrDID.verifyJWT(signedJWT, didResolver);
console.log('Payload:', payload);

// You have to get the correct delegate name by the DID document in the console log, to 
// remove delagates, since "didDocument.VerificationMethod[1].blockchainAccountId" not works
// OPERATION : NETWORK - REQUIRED FEE : 0.0001
const txHash1 = await MyEthrDID.revokeDelegate("0xa1d11bF9d8Ce19c261D8b9a1C610Fa53009f4F21"); 
console.log(txHash1);
*/


// By default, an identity address is self-owned. The owner of an identity is the address 
// capable of making and publishing changes to the identity. Changing ownership is useful, 
// for instance, when switching providers and wishing to retain the same identifier. When 
// you change the ownership of a Ether-DID is alter the blockchainAccountId of the controller 
// verificationMethod, which is the real account that perfomes the transaction over the 
// blockchain and pays the fees. 
// OPERATION : NETWORK - REQUIRED FEE : 0.0001 (old account)
console.log('Changing Ethr-DID owner ...');
const newOwner = '0xe7c9C70fb1c5049AbBa97171fa3C5016a2414A53'; 
await MyEthrDID.changeOwner(newOwner);
console.log('Owner successfully changed.');
// NOTE : After the first change of ownership is not possibile rechange the ownership in any
// way, both to the previous owner or to a new one. Also "changeOwnerSigned" have the same problem.
// const messageHash = ethers.createChangeOwnerHash(newOwner);
// const signature = await wallet.signMessage(messageHash);
// const metaSignature = {
// sigV: ethers.Signature.from(signature).v,
// sigR: ethers.Signature.from(signature).r,
// sigS: ethers.Signature.from(signature).s };
// await MyEthrDID.changeOwnerSigned(newOwner, metaSignature);




const owner = await MyEthrDID.lookupOwner();
console.log("owner:",  owner);


// Assicurati di avere accesso al tuo contratto EthereumDIDRegistry ABI (Interface)
const ethereumDIDRegistryABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "name",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "value",
				"type": "bytes"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "validTo",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "previousChange",
				"type": "uint256"
			}
		],
		"name": "DIDAttributeChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "delegateType",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "validTo",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "previousChange",
				"type": "uint256"
			}
		],
		"name": "DIDDelegateChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "previousChange",
				"type": "uint256"
			}
		],
		"name": "DIDOwnerChanged",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "delegateType",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "validity",
				"type": "uint256"
			}
		],
		"name": "addDelegate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "uint8",
				"name": "sigV",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "sigR",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "sigS",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "delegateType",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "validity",
				"type": "uint256"
			}
		],
		"name": "addDelegateSigned",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "changeOwner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "uint8",
				"name": "sigV",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "sigR",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "sigS",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "changeOwnerSigned",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "changed",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "delegates",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			}
		],
		"name": "identityOwner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "nonce",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "owners",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "name",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "value",
				"type": "bytes"
			}
		],
		"name": "revokeAttribute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "uint8",
				"name": "sigV",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "sigR",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "sigS",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "name",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "value",
				"type": "bytes"
			}
		],
		"name": "revokeAttributeSigned",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "delegateType",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			}
		],
		"name": "revokeDelegate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "uint8",
				"name": "sigV",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "sigR",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "sigS",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "delegateType",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			}
		],
		"name": "revokeDelegateSigned",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "name",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "value",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "validity",
				"type": "uint256"
			}
		],
		"name": "setAttribute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "uint8",
				"name": "sigV",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "sigR",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "sigS",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "name",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "value",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "validity",
				"type": "uint256"
			}
		],
		"name": "setAttributeSigned",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "identity",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "delegateType",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			}
		],
		"name": "validDelegate",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]; // Sostituisci con l'ABI reale del tuo contratto

// Crea un'istanza di un fornitore Web3 (puoi scegliere un provider Ethereum come Infura)
const provider1 = new ethers.JsonRpcProvider('https://goerli.infura.io/v3/7947e3a1923a4103ac36bf90b251d649');

// Sostituisci con il tuo indirizzo contratto EthereumDIDRegistry
const ethereumDIDRegistryAddress = '0xdCa7EF03e98e0DC2B855bE647C39ABe984fcF21B';

// Crea un'istanza del tuo contratto EthereumDIDRegistry utilizzando l'ABI e il provider
const ethereumDIDRegistry = new ethers.Contract(
  ethereumDIDRegistryAddress,
  ethereumDIDRegistryABI,
  provider1
);

// Adesso puoi utilizzare ethereumDIDRegistry per accedere alle funzioni e alle variabili di stato del contratto
console.log('Indirizzo del proprietario del DID:', await ethereumDIDRegistry.owners('0xe7c9C70fb1c5049AbBa97171fa3C5016a2414A53'));
console.log('Numero di cambiamenti per il DID:', await ethereumDIDRegistry.changed('0xe7c9C70fb1c5049AbBa97171fa3C5016a2414A53'));
// ... Altre chiamate a funzioni o accesso a variabili di stato ...





/*
// You can set various public attributes to your DID using setAttribute(). These cannot be 
// queried within smart contracts, but they let you publish information to your DID document.
// did/pub/(Secp256k1|Rsa|Ed25519)/(veriKey|sigAuth)/(hex|base64|base58) for adding a public key
// did/svc/[ServiceName] for adding a service
// OPERATION : NETWORK - REQUIRED FEE : 0.0001
console.log('Adding a public attribute...');
const attributeName = 'did/pub/Secp256k1/sigAuth/hex';
const attributeValue = '0x034cc8162c28eb201a4b538d6915d08889296a36df34ca76ab2401e804f31cae7a';
const expiresIn = 31104000; // expires after 1 year 
await MyEthrDID.setAttribute(attributeName, attributeValue, expiresIn);
console.log('Public attribute successfully added.');
*/
