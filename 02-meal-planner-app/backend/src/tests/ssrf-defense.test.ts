import {
  isIpPrivateOrInternal,
  validateRecipeUrl,
  extractSchemaOrgRecipe
} from "../modules/importer/ssrf-guard";

describe("SSRF Defense & Recipe Importer Guard", () => {
  describe("IP Address & Subnet Blocking", () => {
    test("blocks loopback addresses (127.0.0.1, localhost, ::1)", () => {
      expect(isIpPrivateOrInternal("127.0.0.1")).toBe(true);
      expect(isIpPrivateOrInternal("localhost")).toBe(true);
      expect(isIpPrivateOrInternal("::1")).toBe(true);
    });

    test("blocks RFC 1918 private subnets (10.x.x.x, 172.16.x.x, 192.168.x.x)", () => {
      expect(isIpPrivateOrInternal("10.0.0.1")).toBe(true);
      expect(isIpPrivateOrInternal("10.254.12.5")).toBe(true);
      expect(isIpPrivateOrInternal("172.16.0.5")).toBe(true);
      expect(isIpPrivateOrInternal("172.31.255.255")).toBe(true);
      expect(isIpPrivateOrInternal("192.168.1.1")).toBe(true);
      expect(isIpPrivateOrInternal("192.168.100.254")).toBe(true);
    });

    test("blocks cloud metadata service endpoints (169.254.169.254)", () => {
      expect(isIpPrivateOrInternal("169.254.169.254")).toBe(true);
      expect(isIpPrivateOrInternal("169.254.0.1")).toBe(true);
    });

    test("allows legitimate public routable IPs", () => {
      expect(isIpPrivateOrInternal("8.8.8.8")).toBe(false);
      expect(isIpPrivateOrInternal("104.21.55.102")).toBe(false);
    });
  });

  describe("URL Validation & SSRF Guard", () => {
    test("rejects hostile SSRF target URLs", () => {
      const loopbackResult = validateRecipeUrl("http://127.0.0.1:8080/admin/secrets");
      expect(loopbackResult.isValid).toBe(false);
      expect(loopbackResult.error).toContain("SSRF Blocked");

      const metadataResult = validateRecipeUrl("http://169.254.169.254/latest/meta-data/");
      expect(metadataResult.isValid).toBe(false);
      expect(metadataResult.error).toContain("SSRF Blocked");

      const internalLanResult = validateRecipeUrl("http://192.168.1.1/router");
      expect(internalLanResult.isValid).toBe(false);
    });

    test("rejects non-HTTP protocols (e.g. file://, gopher://, ftp://)", () => {
      const fileResult = validateRecipeUrl("file:///etc/passwd");
      expect(fileResult.isValid).toBe(false);
      expect(fileResult.error).toContain("Only HTTP and HTTPS");
    });

    test("accepts valid public recipe URLs", () => {
      const validResult = validateRecipeUrl("https://example.com/recipes/healthy-quinoa-bowl");
      expect(validResult.isValid).toBe(true);
    });
  });

  describe("Schema.org Recipe Parser", () => {
    test("extracts structured recipe data from valid JSON-LD HTML fixture", () => {
      const htmlFixture = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Recipe",
                "name": "Savory Rosemary Roasted Potatoes",
                "description": "Crisp red potatoes roasted with fresh rosemary and sea salt.",
                "recipeYield": 6,
                "recipeIngredient": ["500g baby potatoes", "2 tbsp olive oil", "1 tbsp fresh rosemary"],
                "recipeInstructions": ["Cut potatoes into halves.", "Toss with olive oil and herbs.", "Roast at 200C for 30 minutes."]
              }
            </script>
          </head>
        </html>
      `;

      const parsed = extractSchemaOrgRecipe(htmlFixture);
      expect(parsed).not.toBeNull();
      expect(parsed?.title).toBe("Savory Rosemary Roasted Potatoes");
      expect(parsed?.baseServings).toBe(6);
      expect(parsed?.ingredients).toHaveLength(3);
      expect(parsed?.instructions).toHaveLength(3);
    });

    test("returns null gracefully if HTML has no Recipe JSON-LD block", () => {
      const htmlWithoutRecipe = "<html><head><title>General Page</title></head><body>No schema here</body></html>";
      expect(extractSchemaOrgRecipe(htmlWithoutRecipe)).toBeNull();
    });
  });
});
