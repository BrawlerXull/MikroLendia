import { ethers } from 'ethers';
import LoanContractABI from './config/LoanContractABI.json';
import UserContractABI from './config/UserContractABI.json';
import CommunityABI from "./config/CommunityAbi.json"
import CommunityFactoryABI from "./config/CommunityFactoryABI.json"
export const loanContractAddress = "0x41Db0F69B149dA57F6714d1C5Ad5C2c1A69D6786";
export const userContractAddress = "0x4C136bdcE6dd54d71090aDD218b783D688d48405";
export const communityFactoryAddress="0x800d7DD3806128865055B3225e3691297fb1360E";
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