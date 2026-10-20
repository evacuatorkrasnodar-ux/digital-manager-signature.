# SEYVEO M1 · corrected owner-approved Android test-build request

Requested: 2026-10-20.
This is the corrected build request after two false-negative test assertions
were discovered and fixed during the first isolated validation.

Ready for Android debug native compilation:
- 13 modeled code/security cases pass in an isolated JavaScript runner
- device tests still required and not claimed
- SQLCipher provisioning resumes after partial failure, never silently
  replaces a ready-but-missing vault with a new empty file
- Android automatic OS cloud backup is disabled
- personal files are NOT migrated or transmitted
- only Android debug APK; iOS bundle check isn't native iOS binary.

This commit is an explicit, one-time owner-approved request. Only commit
messages containing [android-build-request] trigger the expensive APK job.
Workflow result and artifacts must be independently verified.
