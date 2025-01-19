import { ethers } from 'ethers';
import LoanContractABI from './config/LoanContractABI.json';
import UserContractABI from './config/UserContractABI.json';
import CommunityABI from "./config/CommunityAbi.json"
import CommunityFactoryABI from "./config/CommunityFactoryABI.json"

export const loanContractAddress = "0x85f47ED1c0eE4dCb84292AD847D423F389D0f70b";
export const userContractAddress = "0x031c06746cC854Ea487FA4b77F236Cd8d2F570cC";
export const communityFactoryAddress="0xb7B2DB540c9ae00A960825461125644FBd0B5BD0";


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