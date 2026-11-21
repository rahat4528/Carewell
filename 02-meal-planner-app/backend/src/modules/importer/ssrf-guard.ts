import { URL } from "url";

/**
 * Carewell Meal Planner App - SSRF Protection & Recipe Importer
 * 
 * Guards against Server-Side Request Forgery:
 * - Blocks RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Blocks loopback (127.0.0.1, localhost, ::1)
 * - Blocks link-local & cloud metadata IPs (169.254.169.254, 169.254.0.0/16)
 */

export function isIpPrivateOrInternal(ip: string): boolean {
  if (ip === "localhost" || ip === "::1") return true;

  // IPv4 checks
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-local / AWS & GCP Metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0
    if (parts[0] === 0) return true;
  }

  return false;
}

export function validateRecipeUrl(urlString: string): { isValid: boolean; error?: string } {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, error: "Only HTTP and HTTPS protocols are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (isIpPrivateOrInternal(hostname)) {
      return { isValid: false, error: "Access to private or internal network addresses is forbidden (SSRF Blocked)." };
    }

    return { isValid: true };
  } catch (e: any) {
    return { isValid: false, error: "Malformed URL format." };
  }
}

export interface ParsedRecipeResult {
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  baseServings: number;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  instructions: string[];
}

/**
 * Extracts Schema.org Recipe metadata from an HTML string
 */
export function extractSchemaOrgRecipe(htmlContent: string): ParsedRecipeResult | null {
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(htmlContent)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const recipeObj = Array.isArray(data)
        ? data.find(item => item["@type"] === "Recipe")
        : data["@type"] === "Recipe"
        ? data
        : data["@graph"]?.find((item: any) => item["@type"] === "Recipe");

      if (recipeObj) {
        return {
          title: recipeObj.name || "Imported Recipe",
          description: recipeObj.description || "",
          prepTimeMinutes: 15,
          cookTimeMinutes: 25,
          baseServings: Number(recipeObj.recipeYield) || 4,
          ingredients: (recipeObj.recipeIngredient || []).map((text: string) => ({
            name: text,
            quantity: 1,
            unit: "item"
          })),
          instructions: Array.isArray(recipeObj.recipeInstructions)
            ? recipeObj.recipeInstructions.map((i: any) => typeof i === "string" ? i : i.text || "")
            : [String(recipeObj.recipeInstructions || "")]
        };
      }
    } catch (e) {
      // Continue searching
    }
  }

  return null;
}
