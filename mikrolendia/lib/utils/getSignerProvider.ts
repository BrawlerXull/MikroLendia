import { ethers } from 'ethers';

const LOCALHOST_CHAIN_ID = 31337;
const LOCALHOST_CHAIN_HEX = '0x7a69';

/**
 * Returns a Web3Provider connected to the correct local network.
 * Automatically prompts MetaMask to switch to Localhost 8545 if needed.
 */
export async function getSignerProvider(): Promise<ethers.providers.Web3Provider> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
  const network = await provider.getNetwork();

  if (network.chainId !== LOCALHOST_CHAIN_ID) {
    try {
      // Ask MetaMask to switch to Localhost 8545
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: LOCALHOST_CHAIN_HEX }],
      });
    } catch (switchError: unknown) {
      // Chain not added yet — add it
      if ((switchError as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: LOCALHOST_CHAIN_HEX,
            chainName: 'Localhost 8545',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['http://127.0.0.1:8545'],
          }],
        });
      } else {
        throw new Error('Please switch MetaMask to Localhost 8545 (Chain ID: 31337)');
      }
    }

    // Re-create provider after network switch
    return new ethers.providers.Web3Provider(window.ethereum, 'any');
  }

  return provider;
}
