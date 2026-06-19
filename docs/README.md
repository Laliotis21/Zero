# ZERØ — Legal pages (GitHub Pages)

Static legal pages for the ZERØ app, hosted free via GitHub Pages from this `/docs` folder.

- `index.html` — landing/index of legal docs
- `privacy.html` — Privacy Policy
- `terms.html` — Terms of Service

## Enable GitHub Pages

1. Push these files to the `main` branch of `github.com/Laliotis21/Zero`.
2. On GitHub, open the repo → **Settings** → **Pages**.
3. Under **Build and deployment**:
   - **Source:** select **Deploy from a branch**.
   - **Branch:** select **main**, folder **/docs**.
4. Click **Save**.
5. Wait ~1 minute for the first deploy. The pages then go live at the URLs below.

## Live URLs

- https://laliotis21.github.io/Zero/
- https://laliotis21.github.io/Zero/privacy.html
- https://laliotis21.github.io/Zero/terms.html

Note: GitHub username is lowercase (`laliotis21`) in the URL; the repo path keeps the capital `Z` (`Zero`). These URLs are wired into the app in `utils/links.ts` (`TERMS_URL`, `PRIVACY_URL`).

## Owner action

The Privacy Policy and Terms are good-faith generic templates (see the comment at the top of each HTML file). Have them reviewed by a qualified lawyer before App Store submission.
