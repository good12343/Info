// src/engine/validation.ts
export class AirdropValidator {
  static validate({ user, proof, expired }: any) {
    if (expired) return { valid: false, reason: "Expired" };

    if (!proof || proof.length === 0)
      return { valid: false, reason: "Invalid proof" };

    if (user?.claimed)
      return { valid: false, reason: "Already claimed" };

    return { valid: true, reason: null };
  }
}