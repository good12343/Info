import { Router } from "express";
import { generateMerkleTree } from "../merkle/tree.service";
import { getAirdropSnapshot } from "../merkle/snapshot.service";

const router = Router();

// Generate Merkle Root
router.get("/root", async (req, res) => {
  const snapshot = await getAirdropSnapshot();

  const tree = generateMerkleTree(snapshot);

  res.json({
    root: tree.root,
    total: snapshot.length,
  });
});

// Get snapshot
router.get("/snapshot", async (req, res) => {
  const snapshot = await getAirdropSnapshot();
  res.json(snapshot);
});

export default router;