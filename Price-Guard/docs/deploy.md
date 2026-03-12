# Cloudflare Pages — Deployment Notes

## Settings

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 18 |
| Root directory | *(leave blank / repository root)* |

## First deploy (new project)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **Workers & Pages → Create application → Pages → Connect to Git**.
3. Authorise Cloudflare to access the `True-Good-Craft/Price-Guard` repository.
4. Set the build settings from the table above.
5. Click **Save and Deploy**.

Cloudflare Pages will automatically redeploy on every push to the production branch (`main`).

## Environment variables

No environment variables are required for the MVP build.

## Custom domain

Add a custom domain under **Settings → Custom domains** in the Pages project after the first deploy.

## Notes

- The build output (`dist/`) is a fully static site — no server-side execution is needed.
- Do **not** add Cloudflare Workers or any paid add-ons for the MVP.
- If the Node version needs to change, set the `NODE_VERSION` environment variable in the Pages project settings.
