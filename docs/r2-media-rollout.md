# Business media R2 rollout

Current implementation is dual-provider. Old ImageKit records are unchanged; new records
use R2 only when `MEDIA_STORAGE_PROVIDER=r2` is set and `BUSINESS_MEDIA` is bound.
Do not set the flag before the bucket exists. No credentials belong in this file or config.

1. Owner activates R2 subscription in Cloudflare billing (usage-based; no domain Pro required).
2. Run **Prepare R2 storage** workflow. It creates private Standard bucket
   `khonenama-business-media` using the existing deployment secret; R2 write permission is required.
3. Add `r2_buckets: [{binding: "BUSINESS_MEDIA", bucket_name: "khonenama-business-media"}]`
   and `vars.MEDIA_STORAGE_PROVIDER: "r2"` to the checked-in wrangler.jsonc.
4. Run tests, deploy, verify a real authenticated upload, owner preview, publication,
   public GET/HEAD, thumbnail, and deletion. Observe readiness via authenticated admin API.

## Processing and cost

Browser performs an initial resize. The current ImageKit server pre-transformation is
the transitional server encoder: it produces a bounded WebP master. The Worker copies
the verified processed master and a 480px thumbnail into R2, then deletes the temporary
ImageKit upload. Original raw files are not persisted to R2. ImageKit transfer costs
still apply to these one-time copies and to the existing ImageKit gallery images.
This is not a fully ImageKit-independent pipeline. A later Images binding encoder
requires its separate account subscription and can replace this step without changing
the public URLs. Failed temporary deletion is logged and needs operational cleanup.

## Access and recovery

Bucket remains private. Same-domain `/media/businesses/...` routes permit registered
public images only for published, unpaused businesses. Owners/managers can privately
preview drafts. Public browser cache is five minutes; previews are never cached.
Deleting a gallery image removes both R2 variants. Failed partial writes are cleaned up.

Changing the provider flag back to imagekit changes future uploads only. Keep the R2
binding while any existing record uses R2. Backups, a full old-image migration and a
restore drill are separate tasks and have not been performed by this rollout.

## Pre-activation checks completed

The entire multipart upload is bounded to 9 MiB before parsing (the actual file remains
limited to 8 MiB). Transfers from the transitional encoder are bounded to 8 MiB and
60 seconds, reject redirects and unknown origins, and require WebP content. Unit tests
cover oversized extra form fields and downloads, invalid request bodies, unknown
storage providers, partial writes, preview privacy, and unchanged ImageKit mode.

## Activation on 2026-10-07

R2 permission was corrected. Prepare workflow 37590393812 created the private
Standard bucket. Commit b7ece5f binds BUSINESS_MEDIA and sets the R2 provider.
Production deployment 37591800729 passed the full workflow test suite, TypeScript
check and deployment. Authenticated live test confirmed storage configured and
the fictional fixture remains paused. End-to-end live multipart upload is still
unverified: this workstation reset the outgoing connection (ECONNRESET) before
an upload result was returned. Do not report live upload as passed until it is
verified from a working client. Existing images have not been migrated.
