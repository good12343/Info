import { Request, Response, NextFunction } from "express";
import { ethers } from "ethers";
import { airdropContractRead } from "../blockchain/airdrop.contract";
import { priceOracleRead } from "../blockchain/priceOracle.contract";

// Role hashes
const GOVERNANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNANCE_ROLE"));
const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
const DEPOSITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPOSITOR_ROLE"));
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * 🔐 Check if address has a specific role
 */
export const hasRole = async (address: string, role: string): Promise<boolean> => {
  try {
    return await airdropContractRead.hasRole(role, address);
  } catch {
    return false;
  }
};

/**
 * 👑 Governance role middleware
 */
export const requireGov = async (req: Request, res: Response, next: NextFunction) => {
  const wallet = req.wallet;
  
  if (!wallet) {
    return res.status(401).json({ error: "Wallet not connected" });
  }

  const isGov = await hasRole(wallet, GOVERNANCE_ROLE);
  const isAdmin = await hasRole(wallet, DEFAULT_ADMIN_ROLE);

  if (!isGov && !isAdmin) {
    return res.status(403).json({ error: "Governance role required" });
  }

  next();
};

/**
 * 🔧 Operator role middleware
 */
export const requireOperator = async (req: Request, res: Response, next: NextFunction) => {
  const wallet = req.wallet;
  
  if (!wallet) {
    return res.status(401).json({ error: "Wallet not connected" });
  }

  const isOperator = await hasRole(wallet, OPERATOR_ROLE);
  const isGov = await hasRole(wallet, GOVERNANCE_ROLE);
  const isAdmin = await hasRole(wallet, DEFAULT_ADMIN_ROLE);

  if (!isOperator && !isGov && !isAdmin) {
    return res.status(403).json({ error: "Operator role required" });
  }

  next();
};

/**
 * 💰 Depositor role middleware
 */
export const requireDepositor = async (req: Request, res: Response, next: NextFunction) => {
  const wallet = req.wallet;
  
  if (!wallet) {
    return res.status(401).json({ error: "Wallet not connected" });
  }

  const isDepositor = await hasRole(wallet, DEPOSITOR_ROLE);
  const isGov = await hasRole(wallet, GOVERNANCE_ROLE);
  const isAdmin = await hasRole(wallet, DEFAULT_ADMIN_ROLE);

  if (!isDepositor && !isGov && !isAdmin) {
    return res.status(403).json({ error: "Depositor role required" });
  }

  next();
};

/**
 * 🛡️ Any admin role middleware
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const wallet = req.wallet;
  
  if (!wallet) {
    return res.status(401).json({ error: "Wallet not connected" });
  }

  const isAdmin = await hasRole(wallet, DEFAULT_ADMIN_ROLE);

  if (!isAdmin) {
    return res.status(403).json({ error: "Admin role required" });
  }

  next();
};