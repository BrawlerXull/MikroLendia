import { ethers } from 'ethers';
import LoanContractABI from './config/LoanContractABI.json';
import UserContractABI from './config/UserContractABI.json';
import CommunityABI from "./config/CommunityAbi.json"
import CommunityFactoryABI from "./config/CommunityFactoryABI.json"

export const loanContractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
export const userContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const communityFactoryAddress="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";


export const getLoanContract = (provider: ethers.providers.Provider) => {
  return new ethers.Contract(loanContractAddress, LoanContractABI, provider);
};

export const getUserContract = (provider: ethers.providers.Provider) => {
  return new ethers.Contract(userContractAddress, UserContractABI, provider);
};

export const getCommunityFactoryContract = (provider: ethers.providers.Provider) => {
  return new ethers.Contract(communityFactoryAddress, CommunityFactoryABI, provider);
};

export const getCommunityContract = (provider: ethers.providers.Provider, communityAddress: string) => {
  return new ethers.Contract(communityAddress, CommunityABI, provider);
};