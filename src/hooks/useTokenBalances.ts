import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  TOKEN_PROGRAM_ID, 
  TOKEN_2022_PROGRAM_ID,
  AccountLayout,
  getMint
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals?: number; 
  programId: string;
}

export function useTokenBalances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokenBalances() {
      if (!publicKey) {
        setTokenBalances([]);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch token accounts from both TOKEN and TOKEN_2022 programs
        const fetchAccounts = async (programId: PublicKey) => {
          try {
            const accounts = await connection.getTokenAccountsByOwner(
              publicKey,
              { programId }
            );
            
            const tokenAccounts = [];
            
            for (const { pubkey, account } of accounts.value) {
              // Decode the account data
              const accountInfo = AccountLayout.decode(account.data);
              
              // Only include accounts with non-zero balance
              if (accountInfo.amount > BigInt(0)) {
                // Convert data to our format
                const mintAddress = new PublicKey(accountInfo.mint);
                
                // We'll try to get decimals from the mint, but catch errors
                let decimals;
                try {
                  const mintInfo = await getMint(connection, mintAddress);
                  decimals = mintInfo.decimals;
                } catch (e) {
                  console.log('Error getting mint info:', e);
                  // Default to 9 decimals if we can't fetch the mint
                  decimals = 9;
                }
                
                tokenAccounts.push({
                  pubkey: pubkey.toString(),
                  mint: mintAddress.toString(),
                  amount: Number(accountInfo.amount),
                  decimals,
                  programId: programId.toString()
                });
              }
            }
            
            return tokenAccounts;
          } catch (e) {
            console.error(`Error fetching tokens for program ${programId.toString()}:`, e);
            return [];
          }
        };

        // Fetch from both TOKEN and TOKEN_2022 programs
        const [tokenAccounts, token2022Accounts] = await Promise.all([
          fetchAccounts(TOKEN_PROGRAM_ID),
          fetchAccounts(TOKEN_2022_PROGRAM_ID)
        ]);

        // Combine results
        const allAccounts = [...tokenAccounts, ...token2022Accounts];
        
        setTokenBalances(allAccounts as TokenBalance[]);
      } catch (err) {
        console.error('Error fetching token balances:', err);
        setError('Failed to load token balances');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokenBalances();
  }, [connection, publicKey]);

  return { tokenBalances, isLoading, error };
}