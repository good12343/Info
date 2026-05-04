import { getAirdropSnapshot } from "./snapshot.service";
import { buildMerkleTree } from "./tree.service";

export const generateMerkle = async (req, res) => {
  const snapshot = await getAirdropSnapshot();

  const tree = buildMerkleTree(
    snapshot.map((u) => ({
      wallet: u.wallet,
      amount: u.tokensAllocated,
    }))
  );

  res.json({
    root: tree?.root,
    totalUsers: snapshot.length,
  });
};