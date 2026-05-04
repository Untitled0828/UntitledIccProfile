# ICC Live Editor

Browser-based ICC VCGT curve editor and preview tool.

## Protected Build

- `node ./scripts/build-assets.mjs`
- Output is written to `build/web`
- The generated `build/web/app.js` is bundled and lightly obfuscated for distribution
- `start_server.bat`, `build_exe.bat`, and GitHub Pages deployment prefer the generated assets
- Source files in the repository remain readable; protection applies to distributed assets, not to the source tree itself

## Deploy to GitHub Pages

1. Create an empty GitHub repository.
2. Push this project to the repository's `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Set `Build and deployment` -> `Source` to `GitHub Actions`.
5. The included workflow builds protected assets and deploys the generated site with all `.icc` / `.icm` profiles from `profiles/`.

The build regenerates `profiles/manifest.json` automatically, so newly committed ICC profiles appear in the profile selector automatically.

## Notes

GitHub Pages serves the generated site from `build/web`. Local EXE packaging is also available again through `build_exe.bat`.
