import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { getCommunityFactoryContract } from "../contract/contract";
import { getSignerProvider } from "../utils/getSignerProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
type Community = {
  contractAddress: string;
  owners: string[];
  name: string;
};

// ─── Static read-only provider (no MetaMask needed for reads) ─────────────────
// This directly talks to the local Hardhat node so reads always succeed
// regardless of which network MetaMask is connected to.
const READ_RPC = "http://127.0.0.1:8545";
const readProvider = new ethers.providers.JsonRpcProvider(READ_RPC);


// ─── Hook ────────────────────────────────────────────────────────────────────
const useCommunityFactory = () => {
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ── Read: fetch all communities (uses static RPC, no MetaMask needed) ───────
  const fetchAllCommunities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const contract = getCommunityFactoryContract(readProvider);
      const data: Community[] = await contract.getAllCommunities();
      setAllCommunities(data);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching communities:", msg);
      setError(msg);
      // Only show toast for non-empty-data errors (suppress "no data" on first load)
      if (!msg.includes("CALL_EXCEPTION")) {
        toast.error(`Error fetching communities: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Read: fetch communities by deployer ─────────────────────────────────────
  const fetchCommunitiesByDeployer = useCallback(async (deployer: string) => {
    try {
      setIsLoading(true);
      const contract = getCommunityFactoryContract(readProvider);
      const data: Community[] = await contract.getCommunities(deployer);
      setUserCommunities(data);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching communities for deployer:", msg);
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Read: count deployed communities ────────────────────────────────────────
  const countDeployedCommunities = useCallback(async (deployer: string) => {
    try {
      const contract = getCommunityFactoryContract(readProvider);
      const count: number = await contract.countDeployed(deployer);
      return count;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching community count:", msg);
      return 0;
    }
  }, []);

  // ── Write: deploy a new community (requires MetaMask) ───────────────────────
  const deployCommunity = async (
    data: unknown,
    owners: string[],
    name: string
  ) => {
    try {
      setIsLoading(true);
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getCommunityFactoryContract(web3Provider);
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.deployContract(data, owners, name);
      await tx.wait();
      toast.success("Community deployed successfully!");
      await fetchAllCommunities();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error deploying community:", msg);
      setError(msg);
      toast.error(msg.includes("Wrong network") ? msg : `Error deploying community: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Write: add owners to a community (requires MetaMask) ────────────────────
  const addOwnersToCommunity = async (
    communityAddress: string,
    newOwners: string[]
  ) => {
    try {
      setIsLoading(true);
      const web3Provider = await getSignerProvider();
      const signer = web3Provider.getSigner();
      const contract = getCommunityFactoryContract(web3Provider);
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.addOwnersToCommunity(
        communityAddress,
        newOwners
      );
      await tx.wait();
      toast.success("Owners added to the community successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Error adding owners:", msg);
      setError(msg);
      toast.error(`Error adding owners: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auto-fetch on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllCommunities();
  }, [fetchAllCommunities]);

  return {
    allCommunities,
    userCommunities,
    isLoading,
    error,
    fetchAllCommunities,
    fetchCommunitiesByDeployer,
    deployCommunity,
    addOwnersToCommunity,
    countDeployedCommunities,
  };
};

export default useCommunityFactory;