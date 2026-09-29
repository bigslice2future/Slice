# Direct HTML upload

Creator Gateway defaults to Upload HTML. Choose one .html/.htm file (300 KiB maximum) or expand Or paste HTML code. Checking does not publish. Test the sandbox preview, enter a title, confirm the main interaction, and Publish to Slice after signing in. No external hosting is needed. ZIP, project folders and GitHub builds remain Coming soon.

POST /api/import/upload accepts JSON `{html, filename?}`. acquireSource(upload) validates type/size and feeds the same detection/security/runtime pipeline as URL imports. The browser never supplies trusted preflight results: the authenticated Edge Function sends uploaded HTML to the fixed upload validation endpoint again, requires a passing result and matching SHA-256, then calls the existing service-only database transaction. All stored HTML remains untrusted. Sandbox/CSP permissions are unchanged.

Uploaded content is stored in slice_versions.html with source_type=upload and null source/resolved URLs. No object storage, user filenames or filesystem paths are persisted. Existing URL versions and records are unchanged. Localhost keeps an isolated local repository; production uses Supabase.

Verification: 19 automated tests cover URL and upload defenses, verified publication, body bounds and confirmation. scripts/upload-browser-check.cjs covers actual file selection, ZIP rejection, unsafe pasted code, repair guidance, preview interaction, confirmation, local publication and reload. The full existing browser regression also passes. Production verification is pending deployment.
