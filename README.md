# ICC Live Editor

Browser-based ICC VCGT curve editor and preview tool.

## Protected Build

- `node ./scripts/build-assets.mjs`
- Output is written to `build/web`
- The generated `build/web/app.js` is bundled and lightly obfuscated for distribution
- `start_server.bat`, `build_exe.bat`, GitHub Pages deployment, and `launcher.py` prefer the generated assets
- Source files in the repository remain readable; protection applies to distributed assets, not to the source tree itself

## Deploy to GitHub Pages

1. Create an empty GitHub repository.
2. Push this project to the repository's `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Set `Build and deployment` -> `Source` to `GitHub Actions`.
5. The included workflow builds protected assets and deploys the generated site with all `.icc` / `.icm` profiles.

The build regenerates `profiles.json` automatically, so newly committed ICC profiles appear in the profile selector automatically.

## Notes

The Windows launcher and executable build files are for local desktop packaging only. GitHub Pages serves the static web app.
