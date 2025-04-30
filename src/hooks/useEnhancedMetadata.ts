import { useQuery } from "@tanstack/react-query";
import { Connection, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getMint } from "@solana/spl-token";
import { TokenInfo, TokenListProvider, ENV } from "@solana/spl-token-registry";

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  logoURI?: string;
}

// Local cache for token registry data to avoid multiple fetches
let tokenListCache: Map<string, TokenInfo> | null = null;

// Known tokens with custom metadata
const KNOWN_TOKENS: Record<string, Partial<TokenMetadata>> = {
  "GdHsojisNu8RH92k4JzF1ULzutZgfg8WRL5cHkoW2HCK": {
    address: "GdHsojisNu8RH92k4JzF1ULzutZgfg8WRL5cHkoW2HCK",
    icon: "🌭",
    symbol: "HOT",
    name: "Hot Dog Token",
  },
  "9NCKufE7BQrTXTang2WjXjBe2vdrfKArRMq2Nwmn4o8S": {
    address: "9NCKufE7BQrTXTang2WjXjBe2vdrfKArRMq2Nwmn4o8S",
    icon: "🍔",
    symbol: "BURGER",
    name: "Burger Token",
  },
  "So11111111111111111111111111111111111111112": {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Wrapped SOL",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
};

/**
 * Fetch and initialize the token list from Solana Token Registry
 */
async function getTokenRegistry(): Promise<Map<string, TokenInfo>> {
  if (tokenListCache) return tokenListCache;
  
  try {
    const provider = await new TokenListProvider().resolve();
    // Get tokens for both mainnet and devnet
    const tokenList = [
      ...provider.filterByChainId(ENV.MainnetBeta).getList(),
      ...provider.filterByChainId(ENV.Devnet).getList()
    ];
    
    // Create a map for faster lookups
    const tokenMap = tokenList.reduce((map, item) => {
      map.set(item.address, item);
      return map;
    }, new Map<string, TokenInfo>());
    
    tokenListCache = tokenMap;
    return tokenMap;
  } catch (error) {
    console.error("Failed to load token registry:", error);
    return new Map();
  }
}

/**
 * Fetch token metadata from multiple sources
 */
async function fetchTokenMetadata(
  connection: Connection,
  mintAddress: string
): Promise<TokenMetadata> {
  try {
    const mintKey = new PublicKey(mintAddress);
    
    // Start with default fallback values
    let metadata: TokenMetadata = {
      address: mintAddress,
      symbol: "UNKNOWN",
      name: `Token: ${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      decimals: 9,
      icon: "💰",
    };
    
    // 1. Check if it's in our known tokens list
    if (KNOWN_TOKENS[mintAddress]) {
      return {
        ...metadata,
        ...KNOWN_TOKENS[mintAddress],
      };
    }
    
    // 2. Try to get mint info for decimals
    try {
      const mintInfo = await getMint(connection, mintKey);
      metadata.decimals = mintInfo.decimals;
    } catch (e) {
      console.log("Failed to get mint info:", e);
      // Keep default decimals
    }
    
    // 3. Try to get info from token registry
    try {
      const tokenRegistry = await getTokenRegistry();
      const registryInfo = tokenRegistry.get(mintAddress);
      
      if (registryInfo) {
        metadata = {
          ...metadata,
          name: registryInfo.name,
          symbol: registryInfo.symbol,
          decimals: registryInfo.decimals,
          icon: registryInfo.logoURI || "💰",
        };
      }
    } catch (e) {
      console.log("Error fetching from token registry:", e);
    }

    // 4. If this is a widely used token, try some special handling
    if (mintAddress === "So11111111111111111111111111111111111111112") {
      metadata = {
        address: mintAddress,
        symbol: "SOL",
        name: "Wrapped SOL",
        decimals: 9,
        icon: "◎",
      };
    }
    
    return metadata;
  } catch (error) {
    console.error("Error in fetchTokenMetadata:", error);
    
    // Return a default fallback
    return {
      address: mintAddress,
      symbol: "UNKNOWN",
      name: `Token: ${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      decimals: 9,
      icon: "💰",
    };
  }
}

export function useEnhancedMetadata(mintAddress?: string) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["enhancedTokenMetadata", mintAddress],
    queryFn: async () => {
      if (!mintAddress) {
        throw new Error("Mint address is required");
      }
      return fetchTokenMetadata(connection, mintAddress);
    },
    enabled: !!mintAddress,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function useMultipleEnhancedMetadata(mintAddresses: string[]) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["multipleEnhancedTokenMetadata", mintAddresses],
    queryFn: async () => {
      const metadataPromises = mintAddresses.map(async (address) => {
        const metadata = await fetchTokenMetadata(connection, address);
        return [address, metadata] as [string, TokenMetadata];
      });

      const metadataResults = await Promise.all(metadataPromises);
      return Object.fromEntries(metadataResults);
    },
    enabled: mintAddresses.length > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function formatTokenAmount(amount: number, decimals: number = 9): string {
  return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}