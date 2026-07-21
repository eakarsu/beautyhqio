# Credential exposure response

On 2026-07-19, plaintext account/credential inventory files and a Let’s Encrypt
backup containing ACME account material and TLS private keys were removed from
the current source tree. Deleting the files from the working tree does **not**
remove them from Git history and does **not** make exposed credentials safe.

Before any production deployment, an authorized owner must:

1. Revoke and reissue every TLS certificate and ACME account key present in the
   former `letsencrypt-backup.tar.gz` archive.
2. Rotate every password, API key, OAuth client secret, Stripe credential, and
   account credential referenced by the removed text inventories.
3. Invalidate active sessions and inspect provider/audit logs for misuse.
4. Purge the artifacts from all Git history, mirrors, caches, CI artifacts, and
   developer clones using an approved history-rewrite procedure.
5. Run the CI secret scan and obtain a security-owner sign-off before release.

Do not restore real credentials to this repository. Store runtime values in the
deployment platform’s secret manager and keep only non-sensitive names and
examples in `.env.example`.
