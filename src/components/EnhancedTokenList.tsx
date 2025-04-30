import { useMultipleMetadata, formatTokenAmount } from '@/hooks/useMetadata';

interface TokenBalance {
  mint: string;
  amount: number;
  decimals?: number;
}

interface TokenListProps {
  tokens: TokenBalance[];
}

export function EnhancedTokenList({ tokens }: TokenListProps) {
  const { data: tokensMetadata, isLoading } = useMultipleMetadata(
    tokens.map((t) => t.mint),
  );

  if (isLoading) {
    return <div>Loading tokens...</div>;
  }

  if (!tokensMetadata) {
    return <div>No tokens found</div>;
  }

  return (
    <div className="space-y-3">
      {tokens.map((token) => {
        const metadata = tokensMetadata[token.mint];
        if (!metadata) return null;

        // Use provided decimals from token account if available, otherwise fallback to metadata
        const decimals = token.decimals !== undefined ? token.decimals : metadata.decimals;

        return (
          <div
            key={token.mint}
            className="flex items-center justify-between p-4 bg-card rounded-lg border"
          >
            <div className="flex items-center gap-3">
              {metadata.icon && (
                <span className="text-xl">
                  {metadata.icon.startsWith('http') ? (
                    <img
                      src={metadata.icon}
                      alt={metadata.symbol}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    metadata.icon
                  )}
                </span>
              )}
              <div>
                <div className="font-medium">{metadata.name}</div>
                <div className="text-sm text-muted-foreground">
                  {metadata.symbol}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatTokenAmount(token.amount, decimals)}
              </div>
              <div className="text-xs text-muted-foreground">
                {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}