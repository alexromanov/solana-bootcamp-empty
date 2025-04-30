import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { TabsContent } from "@/components/ui/tabs";
import { AlertCircle, Loader2 } from "lucide-react";
import { EnhancedTokenList } from "@/components/EnhancedTokenList";
import { TokenSummary } from "@/components/TokenSummary";
import { TokenFilter } from "@/components/TokenFilter";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useMultipleMetadata } from "@/hooks/useMetadata";

export function TokenBalancesPage({
  isWalletConnected,
  loading,
}: {
  isWalletConnected: boolean;
  loading: boolean;
}) {
  const { tokenBalances, isLoading, error } = useTokenBalances();
  const [filterQuery, setFilterQuery] = useState("");
  
  // Get metadata for all tokens to enable filtering by name/symbol
  const { data: tokensMetadata } = useMultipleMetadata(
    tokenBalances.map((t) => t.mint)
  );
  
  // Apply filtering based on the search query
  const filteredTokens = useMemo(() => {
    if (!filterQuery || !tokensMetadata) return tokenBalances;
    
    const query = filterQuery.toLowerCase();
    return tokenBalances.filter(token => {
      const metadata = tokensMetadata[token.mint];
      if (!metadata) return false;
      
      // Search by mint address, name, or symbol
      return (
        token.mint.toLowerCase().includes(query) || 
        metadata.name.toLowerCase().includes(query) || 
        metadata.symbol.toLowerCase().includes(query)
      );
    });
  }, [tokenBalances, tokensMetadata, filterQuery]);

  return (
    <TabsContent value="tokenBalances">
      <Card>
        <CardHeader>
          <CardTitle>Your Token Balances</CardTitle>
          <CardDescription>
            View all tokens in your connected wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isWalletConnected ? (
            <div className="text-center py-8">
              <p className="mb-4 text-muted-foreground">
                Connect your wallet to view your token balances
              </p>
              <WalletMultiButton style={{ backgroundColor: "black" }}>
                <Button asChild disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <div>Connect Wallet</div>
                  )}
                </Button>
              </WalletMultiButton>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading token balances...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : tokenBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tokens found in your wallet
            </div>
          ) : (
            <>
              <TokenSummary tokens={tokenBalances} />
              <TokenFilter onFilter={setFilterQuery} />
              
              {filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tokens match your search
                </div>
              ) : (
                <EnhancedTokenList tokens={filteredTokens.map(token => ({
                  mint: token.mint,
                  amount: token.amount,
                  decimals: token.decimals
                }))} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}