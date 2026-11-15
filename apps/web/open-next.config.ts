import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Read-only cache from Workers Static Assets — no R2/D1 needed (Workers Free plan).
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
