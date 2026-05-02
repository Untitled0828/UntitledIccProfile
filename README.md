# ICC Live Editor

Browser-based ICC VCGT curve editor and preview tool.

## Deploy to GitHub Pages

1. Create an empty GitHub repository.
2. Push this project to the repository's `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Set `Build and deployment` -> `Source` to `GitHub Actions`.
5. The included workflow deploys `index.html`, `styles.css`, `app.js`, and all `.icc` / `.icm` profiles.

The workflow regenerates `profiles.json` during deployment, so newly committed ICC profiles appear in the profile selector automatically.

## Notes

The Windows launcher and executable build files are for local desktop packaging only. GitHub Pages serves the static web app.
