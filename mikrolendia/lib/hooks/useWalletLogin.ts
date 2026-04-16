import { useAppDispatch } from '../hooks/useAppDispatch';
import { setWalletAddress, disconnectWallet } from '../store/wallet/walletSlice';

export const useWalletLogin = () => {
  const dispatch = useAppDispatch(); 

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // wallet_requestPermissions always shows the account selection popup
        // even if the site was previously authorized
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });

        // After permission is granted, fetch the selected account
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });

        if (accounts.length > 0) {
          dispatch(setWalletAddress(accounts[0]));
        } else {
          console.error('No accounts found in MetaMask');
        }
      } catch (error: unknown) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask!');
    }
  };

  const disconnectWalletHandler = () => {
    dispatch(disconnectWallet());
  };

  return { connectWallet, disconnectWalletHandler };
};
