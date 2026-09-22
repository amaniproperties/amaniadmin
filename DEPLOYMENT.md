# Production deployment

Netlify: base directory repository root; build command `npm run build`; publish directory `dist`; functions directory `netlify/functions`; Node 20.

Required Netlify environment variables (Functions scope): `AMANI_BACKEND_ORIGIN` = the backend HTTPS origin, and `ADMIN_API_KEY` = the same strong secret configured on the backend. Do not prefix secrets with `VITE_` and do not put them in source files.

The browser calls same-origin `/api/*`; the Netlify function proxies to the persistent backend and adds the admin API key server-side. Admin pages are `noindex` via HTML, `robots.txt`, and `X-Robots-Tag`. Because the proxy authenticates to the backend on behalf of the site, enable Netlify site-level access protection/SSO before treating this admin UI as private. Search-engine blocking is not authentication.
