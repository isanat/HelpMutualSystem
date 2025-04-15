const { JsonRpcProvider } = require('ethers');

const rpcUrl = 'https://sepolia.infura.io/v3/9b6cd6a9d7e340f4adfdd0c5e24bd537';
const provider = new JsonRpcProvider(rpcUrl);

async function testConnection() {
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`Connected to Sepolia! Current block number: ${blockNumber}`);
  } catch (error) {
    console.error(`Failed to connect to Sepolia: ${error.message}`);
  }
}

testConnection();
