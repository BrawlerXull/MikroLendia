import { ethers } from 'ethers';
import LoanContractABI from './config/LoanContractABI.json';
import UserContractABI from './config/UserContractABI.json';
import CommunityABI from "./config/CommunityAbi.json"
import CommunityFactoryABI from "./config/CommunityFactoryABI.json"
export const loanContractAddress = "0x389847655F3ee20cc533D97C7144ca03a6d3d1fA";
export const userContractAddress = "0x078f2bb8cddc84267974F148Cb649102aFb50101";
export const communityFactoryAddress="0xC3bE3c10e0B249d5d31E0346e885aa8140a80Ce5";
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