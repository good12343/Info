import { Request, Response } from "express";
import { 
  getCategoryStats, 
  getTierStats, 
  getUsersByCategory, 
  getUserReport,
  updateUserClassification 
} from "../services/classification.service";
import { UserCategory } from "@prisma/client";

/**
 * GET /api/reports/categories
 * Get statistics for all user categories
 */
export const categoryStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await getCategoryStats();
    res.json({
      success: true,
      data: stats,
      summary: {
        totalUsers: stats.reduce((sum, s) => sum + s.userCount, 0),
        totalTokens: stats.reduce((sum, s) => sum + BigInt(s.totalTokens), 0n).toString(),
        avgClaimRate: stats.length > 0 
          ? stats.reduce((sum, s) => sum + s.claimRate, 0) / stats.length 
          : 0,
      },
    });
  } catch (error) {
    console.error("Category stats error:", error);
    res.status(500).json({ error: "Failed to get category stats" });
  }
};

/**
 * GET /api/reports/tiers
 * Get statistics for all user tiers
 */
export const tierStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await getTierStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Tier stats error:", error);
    res.status(500).json({ error: "Failed to get tier stats" });
  }
};

/**
 * GET /api/reports/users?category=AIRDROP_ONLY&page=1&limit=100
 * Get users filtered by category
 */
export const usersByCategoryController = async (req: Request, res: Response) => {
  try {
    const { category, page = "1", limit = "100" } = req.query;
    
    if (!category || !Object.values(UserCategory).includes(category as UserCategory)) {
      return res.status(400).json({ 
        error: "Invalid category",
        validCategories: Object.values(UserCategory),
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const users = await getUsersByCategory(category as UserCategory, {
      skip,
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      category,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        count: users.length,
      },
      data: users,
    });
  } catch (error) {
    console.error("Users by category error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

/**
 * GET /api/reports/user/:wallet
 * Get detailed report for a specific user
 */
export const userReportController = async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    
    const report = await getUserReport(wallet);
    
    if (!report) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("User report error:", error);
    res.status(500).json({ error: "Failed to get user report" });
  }
};

/**
 * POST /api/reports/classify/:wallet
 * Re-classify a user manually
 */
export const classifyUserController = async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    
    const updated = await updateUserClassification(wallet);
    
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User classified successfully",
      data: {
        wallet: updated.wallet,
        category: updated.category,
        tier: updated.tier,
      },
    });
  } catch (error) {
    console.error("Classify user error:", error);
    res.status(500).json({ error: "Failed to classify user" });
  }
};

/**
 * GET /api/reports/dashboard
 * Get full dashboard data
 */
export const dashboardController = async (req: Request, res: Response) => {
  try {
    const [categories, tiers] = await Promise.all([
      getCategoryStats(),
      getTierStats(),
    ]);

    // Calculate totals
    const totalUsers = categories.reduce((sum, c) => sum + c.userCount, 0);
    const totalTokens = categories.reduce((sum, c) => sum + BigInt(c.totalTokens), 0n);
    const totalClaimed = categories.reduce((sum, c) => sum + c.claimedCount, 0);

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalTokens: totalTokens.toString(),
        totalClaimed,
        overallClaimRate: totalUsers > 0 ? (totalClaimed / totalUsers) * 100 : 0,
      },
      categories,
      tiers,
      chain: {
        name: "Sepolia",
        chainId: 11155111,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to get dashboard data" });
  }
};