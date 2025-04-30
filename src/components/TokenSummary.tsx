import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
  } from "@/components/ui/tooltip";
  import { Coins, Info } from "lucide-react";
  import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
  
  interface TokenSummaryProps {
    tokens: {
      mint: string;
      amount: number;
      decimals?: number;
      programId?: string;
    }[];
  }
  
  export function TokenSummary({ tokens }: TokenSummaryProps) {
    // Count tokens by program type
    const spl = tokens.filter(
      t => t.programId === TOKEN_PROGRAM_ID.toString()
    ).length;
    
    const spl2022 = tokens.filter(
      t => t.programId === TOKEN_2022_PROGRAM_ID.toString()
    ).length;
  
    // Count tokens with non-zero balance
    const totalTokens = tokens.length;
  
    return (
      <div className="p-4 bg-muted rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-medium">Token Summary</span>
          </div>
          
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="font-medium">{totalTokens}</span> tokens found
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm">
                    <span>SPL: {spl}</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Standard SPL tokens</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm">
                    <span>SPL-2022: {spl2022}</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Token-2022 Program tokens with extended features</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  }