# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

  npm install
  npm run tauri android init
  npm run tauri ios init

For Desktop development, run:
  npm run tauri dev

For Android development, run:
  npm run tauri android dev

For iOS development, run:
  npm run tauri ios dev


Before you hand it out:

Gatekeeper: ad-hoc signing isn't Apple-trusted, so other Macs will block the app on first open. Users get round it by right-clicking the app and choosing Open, or with xattr -cr "/Applications/IT Help Desk.app". To avoid that, you'd need an Apple Developer ID certificate in signingIdentity plus the APPLE_ID/APPLE_PASSWORD/APPLE_TEAM_ID environment variables; the build skipped notarization because they weren't set.

Intel Macs: this DMG only runs on Apple Silicon. For one that runs on both, run rustup target add x86_64-apple-darwin, then npm run tauri build -- --target universal-apple-darwin --bundles app,dmg.

Server address: the app doesn't bake one in, so each install needs it entered on the server setup screen. An http:// LAN address may behave differently in the packaged app than in tauri dev. Test that once; an https server such as the Render one avoids the question.

