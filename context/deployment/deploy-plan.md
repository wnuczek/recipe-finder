Plan: RecipeFinder First Deploy (EAS — iOS)
Scope: Layer 1 only — EAS mobile distribution, iOS → TestFlight. Cloudflare Workers and Android deferred.

Phase 1: Pre-Flight Fixes
Fix app.json scaffold values — update name → RecipeFinder, slug → recipe-finder, scheme → recipefinder, add ios.bundleIdentifier: com.wnuczek.recipefinder, android.package: com.wnuczek.recipefinder
MANUAL GATE — verify Expo account exists at expo.dev
npm install -g eas-cli → verify with eas --version
Phase 2: EAS Init
eas login — browser auth flow
eas init → creates project, writes extra.eas.projectId into app.json
Create eas.json with three profiles: development (simulator), preview (internal device distribution), production (auto-increment version)
Phase 3: First Build
eas build --profile preview --platform ios
MANUAL GATE: enter Apple ID + app-specific password when prompted (EAS manages credentials)
Build runs on EAS servers ~10–20 min
MANUAL GATE — download and install the .ipa on a registered test device, verify app launches correctly
Phase 4: TestFlight
MANUAL GATE — register app in App Store Connect (appstoreconnect.apple.com): New App → com.wnuczek.recipefinder → note the numeric App ID
Fill ascAppId and appleTeamId into eas.json
eas submit --platform ios --profile production --latest — uploads to TestFlight
MANUAL GATE — add testers in App Store Connect → TestFlight → Internal Testing
Phase 5: OTA Updates
npx expo install expo-updates, add expo-updates plugin + updates.url to app.json
Future JS-only changes: eas update --channel preview --message "..."
Relevant files:

app.json — scaffold values must be replaced before Step 5
eas.json — to be created at repo root (Step 6)
infrastructure.md — operational story reference
context/deployment/deploy-plan.md — artifact to write (blocked: file creation tool is currently disabled)
Verification:

eas build:list shows status FINISHED for the iOS build
App installs and launches on a physical device without crash
TestFlight invite received by added testers
OTA update reflected on next app launch without reinstall
Decisions:

Android build deferred to a later sprint
App Store public release deferred until TestFlight validation passes
GitHub Actions auto-deploy wire-up deferred until first manual deploy succeeds
Cloudflare Workers (Layer 2) not touched in this plan
