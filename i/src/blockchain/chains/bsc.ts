const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contract = new ethers.Contract(
  process.env.BSC_AIRDROP!,
  AirdropABI,
  wallet
);

export class BscAdapter implements ChainAdapter {
  async claim(wallet, amount, proof) {
    const tx = await contract.claim(wallet, amount, proof);
    return await tx.wait();
  }
}