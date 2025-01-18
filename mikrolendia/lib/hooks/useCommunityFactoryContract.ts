import { useCallback, useEffect, useState } from "react";
import { ethers, Contract } from "ethers";
import { toast } from "sonner";
import {  getCommunityFactoryContract, loanContractAddress  } from "../contract/contract";

type Community = {
  contractAddress: string;
  owners: string[];
  name: string;
};

const useCommunityFactory = (
) => {
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the contract instance
  const init = useCallback(() => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
  }, []);

  useEffect(()=>{
    init();
  },[])
  const fetchAllCommunities = useCallback(async () => {
    try {
    if(!provider) return
      setIsLoading(true);
      const contract = getCommunityFactoryContract(provider);
      const data: Community[] = await contract.getAllCommunities();
      setAllCommunities(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error fetching communities: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Fetch communities owned by a specific deployer
  const fetchCommunitiesByDeployer = useCallback(
    async (deployer: string) => {
      try {
        if(!provider) return
        setIsLoading(true);
        const contract = getCommunityFactoryContract(provider);
        const data: Community[] = await contract.getCommunities(deployer);
        setUserCommunities(data)
        return data
      } catch (err: any) {
        setError(err.message);
        toast.error(`Error fetching communities for deployer: ${err.message}`);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [provider]
  );

  // Deploy a new community
  const deployCommunity = async (data: any, owners: string[], name: string) => {
      try {
        console.log(owners  )
        if(!provider) return
        setIsLoading(true);
        const contract = getCommunityFactoryContract(provider);
        const signer=await provider.getSigner()
        const contractWithSigner=await contract.connect(signer)
        console.log(contractWithSigner)
        const tx = await contractWithSigner.deployContract(data, owners, name);
        await tx.wait();
        toast.success("Community deployed successfully!");
        fetchAllCommunities(); // Refresh the list of communities
      } catch (err: any) {
        console.log(err)
        setError(err.message);
        toast.error(`Error deploying community: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

  // Add owners to an existing community
  const addOwnersToCommunity =
    async (communityAddress: string, newOwners: string[]) => {
        if(!provider) return
      try {
        setIsLoading(true);
        const contract = getCommunityFactoryContract(provider);
        const signer=await provider.getSigner()
        const contractWithSigner=contract.connect(signer)
        const tx = await contractWithSigner.addOwnersToCommunity(
          communityAddress,
          newOwners
        );
        await tx.wait();
        toast.success("Owners added to the community successfully!");
      } catch (err: any) {
        setError(err.message);
        toast.error(`Error adding owners: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

  // Count the number of deployed communities for a deployer
  const countDeployedCommunities = useCallback(
    async (deployer: string) => {
      try {
        if(!provider) return
        const contract = getCommunityFactoryContract(provider);
        const count: number = await contract.countDeployed(deployer);
        return count;
      } catch (err: any) {
        setError(err.message);
        toast.error(`Error fetching community count: ${err.message}`);
        return 0;
      }
    },
    [provider]
  );

  useEffect(() => {
    fetchAllCommunities();
  }, [fetchAllCommunities]);

  return {
    allCommunities,
    isLoading,
    error,
    fetchAllCommunities,
    fetchCommunitiesByDeployer,
    deployCommunity,
    addOwnersToCommunity,
    countDeployedCommunities,
    userCommunities,
  };
};

export default useCommunityFactory;