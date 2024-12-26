export const DEFAULT_ALPHA = 0.1;
export const DEFAULT_MARKET_SIZE = 1000;

export const calculateMarketShare = (
  playerBid: number, 
  rivalBids: number[], 
  alpha: number = DEFAULT_ALPHA
): number => {
  // If player bid is 0, they get 0% market share
  if (playerBid === 0) {
    return 0;
  }
  
  // If no rivals or all rivals bid 0, player gets 100%
  if (rivalBids.length === 0 || rivalBids.every(bid => bid === 0)) {
    return 1;
  }
  
  // Calculate shares using only non-zero bids
  const playerExp = Math.exp(-alpha * playerBid);
  const totalExp = rivalBids.reduce(
    (sum, bid) => sum + (bid === 0 ? 0 : Math.exp(-alpha * bid)), 
    playerExp
  );
  
  const share = playerExp / totalExp;
  return share;
};

export const calculateProfit = (
  bid: number, 
  marketShare: number, 
  costPerUnit: number, 
  marketSize: number = DEFAULT_MARKET_SIZE
): number => {
  // Calculate quantity sold using market share and total market size
  const quantitySold = marketSize * marketShare;
  
  // Calculate profit as quantity * (price - cost)
  const profit = quantitySold * (bid - costPerUnit);
  return profit;
};

export const calculateAllMarketShares = (
  bids: Record<string, number>,
  alpha: number = DEFAULT_ALPHA
): Record<string, number> => {
  const players = Object.keys(bids);
  const marketShares: Record<string, number> = {};

  players.forEach(playerId => {
    const playerBid = bids[playerId];
    const rivalBids = players
      .filter(id => id !== playerId)
      .map(id => bids[id]);
    
    marketShares[playerId] = calculateMarketShare(playerBid, rivalBids, alpha);
  });

  return marketShares;
};

export const calculateAllProfits = (
  bids: Record<string, number>,
  marketShares: Record<string, number>,
  costPerUnit: number,
  marketSize: number = DEFAULT_MARKET_SIZE
): Record<string, number> => {
  const profits: Record<string, number> = {};

  Object.keys(bids).forEach(playerId => {
    profits[playerId] = calculateProfit(
      bids[playerId],
      marketShares[playerId] || 0,
      costPerUnit,
      marketSize
    );
  });

  return profits;
};
