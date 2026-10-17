# Paycheck Stub

Static US take-home pay calculator for 2026. It runs in the browser, so hosting can stay on the free tier.

## Check the math and rebuild pages

```bash
npm run check
npm run build
```

Set your real domain before you launch so the sitemap is valid:

```bash
SITE_URL=https://yourdomain.com npm run build
```

## What you edit before applying for ads

1. `about.html` — your legal name and city. Rebuild from `scripts/build.mjs` if you regenerate pages, or edit the About copy in that script and rebuild.
2. `contact.html` — a real email you check. Same rule: change it in `scripts/build.mjs` under the contact page, then rebuild.
3. `js/config.js` — after AdSense approves you, set `adsenseClient` to `ca-pub-...` and the two slot ids. Leave them blank until then. The pages do not load Google’s ad script while they are blank.
4. `ads.txt` — uncomment and fill the publisher line AdSense gives you. The file must live at `https://yourdomain.com/ads.txt`.

Do not click your own ads. Invalid clicks get the account banned, which ends the income.

## Host it for the cost of a domain

The site is plain HTML, CSS, and JavaScript. A reasonable setup:

1. Buy a `.com` you can say out loud. Budget about $12 a year, roughly ₹1,000.
2. Put the domain on Cloudflare (free).
3. Deploy the folder with Cloudflare Pages, also free. Build command is empty. Output directory is the project root, after you have run `npm run build`.

Netlify or GitHub Pages work too. Do not pay for a server.

## The ₹5,000 / month target

₹5,000 is about $55–60. A finance calculator shown to US visitors often earns roughly $8–15 per 1,000 pageviews, sometimes more, sometimes less. At about $12 per 1,000 views you need around 5,000 pageviews a month. The domain is the main fixed cost, about ₹80–100 a month if you spread the annual fee out. Hosting stays ₹0.

That traffic is possible for this niche. It is not automatic, and it usually takes a few months of indexing, not the first week.

What this project already includes for that:

- One URL per state, which is how people search (“california paycheck calculator”).
- A $75,000 ranking page people can link to.
- A compare tool, so a visit lasts longer than one calculation.
- Real privacy, about, contact, and terms pages. AdSense rejects sites that are missing those.
- Ad slots that stay empty until you have a publisher id, so you are not shipping fake ad boxes.

What you still have to do:

- Publish on the real domain over HTTPS.
- Add the site in Google Search Console and submit `sitemap.xml`.
- Leave the content up and accurate. Update the tables when the IRS or a state changes a rate, then rebuild.
- Answer real questions in places you already participate, and link a relevant state page only when it answers the question. Buying traffic to click ads loses money and violates ad rules.

There is no setting in this repo that forces ₹5,000. The calculator has to be useful enough that people finish the calculation and share the state pages.
