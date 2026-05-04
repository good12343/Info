const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contract = new ethers.Contract(
  process.env.ETH_AIRDROP!,
  AirdropABI,
  wallet
);

export class EthereumAdapter implements ChainAdapter {
  async claim(wallet, amount, proof) {
    const tx = await contract.claim(wallet, amount, proof);
    return await tx.wait();
  }
}