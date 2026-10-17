import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { calculatePaycheck } from "../js/engine.js";
import { STATES, TAX_YEAR } from "../js/tax-data.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public");
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const asset of ["css", "js", "favicon.svg"]) {
  cpSync(join(root, asset), join(outDir, asset), { recursive: true });
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function write(rel, html) {
  const path = join(outDir, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
}

function layout({ title, description, body, depth = 0, defaultState = "", canonicalPath = "/", jsonLd = "" }) {
  const asset = depth ? "../".repeat(depth) : "";
  const home = `${asset}index.html`;
  const canonical = SITE_URL ? `<link rel="canonical" href="${esc(SITE_URL + canonicalPath)}">` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow">
  ${canonical}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <link rel="icon" href="${asset}favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${asset}css/site.css">
  ${jsonLd}
</head>
<body${defaultState ? ` data-default-state="${esc(defaultState)}"` : ""}>
  <a class="skip" href="#calculator">Skip to calculator</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="${home}"><span class="mark">$</span> Paycheck Stub</a>
      <nav>
        <a href="${home}">Calculator</a>
        <a href="${asset}by-state.html">By state</a>
        <a href="${asset}compare.html">Compare</a>
        <a href="${home}#guide">How pay works</a>
      </nav>
    </div>
  </header>
  <main class="wrap">
    ${body}
  </main>
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <strong>Paycheck Stub</strong>
        <p>A ${TAX_YEAR} US take-home pay estimator. Federal brackets follow IRS inflation adjustments. State brackets follow published January ${TAX_YEAR} tables. Your salary stays in the browser.</p>
      </div>
      <div>
        <strong>Tools</strong>
        <p><a href="${home}">Paycheck calculator</a><br><a href="${asset}by-state.html">Take-home by state</a><br><a href="${asset}compare.html">Compare two states</a></p>
      </div>
      <div>
        <strong>Site</strong>
        <p><a href="${asset}about.html">About</a><br><a href="${asset}privacy.html">Privacy</a><br><a href="${asset}terms.html">Terms</a><br><a href="${asset}contact.html">Contact</a></p>
      </div>
    </div>
    <div class="wrap disclaimer">
      <p>This is an educational estimate, not tax, legal, or payroll advice, and not a substitute for Form W-4 withholding under IRS Publication 15-T. Local taxes, disability insurance, paid leave, bonuses, and benefit deductions can change a real paycheck. Talk to a tax professional before you file or change withholding.</p>
      <p>© ${TAX_YEAR} Paycheck Stub.</p>
    </div>
  </footer>
  <script src="${asset}js/config.js"></script>
  <script src="${asset}js/ads.js"></script>
</body>
</html>`;
}

function calculator() {
  return `<form id="pay-form" class="panel">
      <fieldset>
        <legend>Pay</legend>
        <div class="mode">
          <label><input type="radio" name="mode" value="salary" checked> Salary</label>
          <label><input type="radio" name="mode" value="hourly"> Hourly</label>
        </div>
        <div id="salary-fields">
          <label class="field">Gross annual pay
            <input id="gross" type="number" min="0" step="1000" inputmode="decimal" value="75000">
          </label>
        </div>
        <div id="hourly-fields" hidden>
          <label class="field">Hourly rate
            <input id="hourly" type="number" min="0" step="0.25" inputmode="decimal" value="36">
          </label>
          <div class="pair">
            <label class="field">Hours per week
              <input id="hours" type="number" min="0" max="80" step="0.5" value="40">
            </label>
            <label class="field">Weeks per year
              <input id="weeks" type="number" min="1" max="52" step="1" value="52">
            </label>
          </div>
        </div>
        <p id="annualized" class="private" hidden></p>
        <label class="field">Pay frequency
          <select id="periods">
            <option value="52">Weekly (52)</option>
            <option value="26" selected>Biweekly (26)</option>
            <option value="24">Semimonthly (24)</option>
            <option value="12">Monthly (12)</option>
          </select>
        </label>
        <label class="field">Filing status
          <select id="status">
            <option value="single">Single</option>
            <option value="married">Married filing jointly</option>
            <option value="head">Head of household</option>
            <option value="separate">Married filing separately</option>
          </select>
        </label>
        <label class="field">State
          <select id="state"></select>
        </label>
        <label class="field"><span class="range-row"><span>Traditional 401(k)</span><span id="k401-out">5%</span></span>
          <input id="k401" type="range" min="0" max="30" step="1" value="5">
        </label>
        <label class="field">Pre-tax health premium, per month
          <input id="health" type="number" min="0" step="10" inputmode="decimal" value="0">
        </label>
      </fieldset>
      <div class="actions">
        <button type="button" id="share">Copy link</button>
        <button type="button" id="print" class="ghost">Print stub</button>
      </div>
      <p class="private">Numbers are calculated on this device. Nothing you type is sent to a server.</p>
    </form>`;
}

function calcBlock() {
  return `<section class="calc" id="calculator">
    ${calculator()}
    <div>
      <div id="stub" class="stub" aria-live="polite"></div>
      <div class="legend">
        <span><i class="swatch slice net"></i>Take-home</span>
        <span><i class="swatch slice fed"></i>Federal</span>
        <span><i class="swatch slice ss"></i>Social Security</span>
        <span><i class="swatch slice med"></i>Medicare</span>
        <span><i class="swatch slice state"></i>State</span>
        <span><i class="swatch slice k401"></i>401(k)</span>
      </div>
      <div class="ad-slot" data-ad-slot="afterResult"></div>
    </div>
  </section>
  <script type="module" src="js/app.js"></script>`;
}

const tx75 = calculatePaycheck({ grossAnnual: 75000, status: "single", state: "TX", periods: 26, k401Percent: 0 });
const ca75 = calculatePaycheck({ grossAnnual: 75000, status: "single", state: "CA", periods: 26, k401Percent: 0 });

const faq = [
  ["Why is this different from my pay stub?", "Employers withhold using IRS Publication 15-T and the choices on your Form W-4. This page annualizes federal tax with the standard deduction and divides it by the number of paychecks. Local tax, disability insurance, retirement match, Roth 401(k), and insurance premiums are extra lines a real stub may show."],
  ["Does a traditional 401(k) lower Social Security tax?", "No. A traditional 401(k) reduces federal and state income tax. Social Security and Medicare are still calculated on wages after pre-tax health premiums, not after the 401(k). The 2026 employee deferral cap used here is $24,500."],
  ["Which states do not tax wages?", "Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming do not tax wage income. Washington still has a long-term care payroll tax and a capital-gains tax that this estimate leaves out. New Hampshire's old interest-and-dividends tax is gone."],
  ["Is the child tax credit in these numbers?", "No. The child tax credit is usually claimed on the tax return. It changes a paycheck only if you enter it on Form W-4. Adding it here would overstate take-home pay for most people."],
  ["Do you store my salary?", "No. The calculator is JavaScript in your browser. The page does not have an account, and the salary is not uploaded. If you turn on advertising later, the ad network can set its own cookies. That is described on the privacy page."],
];

const faqLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

const stateLinks = STATES.map((s) => `<a href="states/${s.slug}.html">${esc(s.name)}</a>`).join("");

const indexBody = `
  <p class="eyebrow">${TAX_YEAR} US estimate</p>
  <h1>See what a paycheck keeps after tax</h1>
  <p class="lede">Estimate federal income tax, Social Security, Medicare, and state income tax for any state. A traditional 401(k) and pre-tax health premium are included. The result is a pay stub, not a tax return.</p>
  ${calcBlock().replace('src="js/app.js"', 'src="js/app.js"')}
  <article class="prose" id="guide">
    <h2>How this paycheck is calculated</h2>
    <p>Start with gross wages. Subtract a pre-tax health premium, because those cafeteria-plan premiums usually reduce both income tax and FICA. Subtract a traditional 401(k) only from income-tax wages. Social Security stays 6.2% until the ${TAX_YEAR} wage base of $184,500. Medicare stays 1.45% on every dollar, plus 0.9% Additional Medicare tax after $200,000 of wages from the job. Federal income tax then uses the ${TAX_YEAR} standard deduction and the seven brackets from 10% through 37%.</p>
    <div class="formula">
      <div>Income-tax wages = gross − pre-tax health − traditional 401(k)</div>
      <div>Federal tax = brackets(income-tax wages − standard deduction)</div>
      <div>Net pay = gross − federal − Social Security − Medicare − state tax − 401(k) − health</div>
    </div>
    <p>On a $75,000 salary, single, no 401(k), this estimate keeps ${usd.format(tx75.netAnnual)} in Texas and ${usd.format(ca75.netAnnual)} in California. The gap is state income tax: $0 in Texas and ${usd.format(ca75.stateAnnual)} in California. Federal tax and FICA match.</p>
    <div class="ad-slot" data-ad-slot="midGuide"></div>
    <h2>What a real stub can still add</h2>
    <ul>
      <li>City or county tax in places such as New York City, Ohio cities, Pennsylvania townships, and Maryland counties.</li>
      <li>California SDI, Washington WA Cares, and other state payroll deductions.</li>
      <li>Roth 401(k) contributions, which do not reduce current income tax.</li>
      <li>A bonus withheld at the flat supplemental rate instead of your normal bracket.</li>
      <li>Extra withholding or credits from Form W-4.</li>
    </ul>
  </article>
  <section class="split">
    <div>
      <h2>Every state</h2>
      <p>Each page uses the same federal math and that state's income-tax table, with a worked example at $60,000, $100,000, and $150,000.</p>
      <div class="state-grid">${stateLinks}</div>
    </div>
    <aside class="card">
      <h2>Use it before you accept an offer</h2>
      <p>Compare two states on the same salary if you are choosing where a remote job is based. Open the <a href="by-state.html">$75,000 ranking</a> or the <a href="compare.html">side-by-side tool</a>.</p>
      <p>Effective tax here means income tax plus FICA divided by gross pay. The 401(k) is your money, so it is not counted as tax.</p>
    </aside>
  </section>
  <section>
    <h2>Questions</h2>
    <div class="faq">
      ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
    </div>
  </section>`;

write("index.html", layout({
  title: `US Paycheck Calculator ${TAX_YEAR} | Take-Home Pay by State`,
  description: `Estimate ${TAX_YEAR} take-home pay after federal income tax, Social Security, Medicare, and state tax. All 50 states and DC. Runs privately in your browser.`,
  body: indexBody,
  defaultState: "CA",
  canonicalPath: "/",
  jsonLd: `<script type="application/ld+json">${faqLd}</script>`,
}));

const rows = STATES.map((s) => {
  const result = calculatePaycheck({ grossAnnual: 75000, status: "single", state: s.code, periods: 26, k401Percent: 0 });
  return { s, result };
}).sort((a, b) => b.result.netAnnual - a.result.netAnnual);

const rankBody = `
  <p class="eyebrow">Single filer · no 401(k) · no local tax</p>
  <h1>Take-home pay on $75,000 in every state</h1>
  <p class="lede">Same salary, same federal tax, different state income tax. States that levy city or county tax will take more than this table shows. Open a state for the calculator and more salaries.</p>
  <table class="rank">
    <thead><tr><th>#</th><th>State</th><th>State tax</th><th>Federal tax</th><th>FICA</th><th>Take-home</th><th>Effective tax</th></tr></thead>
    <tbody>
      ${rows.map(({ s, result }, i) => `<tr>
        <td>${i + 1}</td>
        <td><a href="states/${s.slug}.html">${esc(s.name)}</a></td>
        <td>${usd.format(result.stateAnnual)}</td>
        <td>${usd.format(result.federalAnnual)}</td>
        <td>${usd.format(result.ssAnnual + result.medicareAnnual)}</td>
        <td>${usd.format(result.netAnnual)}</td>
        <td>${(result.effectiveTax * 100).toFixed(1)}%</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <p class="lede">Federal tax on this example is ${usd.format(tx75.federalAnnual)}. Social Security plus Medicare is ${usd.format(tx75.ssAnnual + tx75.medicareAnnual)}. Only the state column changes.</p>`;

write("by-state.html", layout({
  title: `Take-Home Pay by State on $75,000 (${TAX_YEAR})`,
  description: `Rank of ${TAX_YEAR} take-home pay for a single filer earning $75,000 in all 50 states and DC, after federal tax, FICA, and state income tax.`,
  body: rankBody,
  canonicalPath: "/by-state.html",
}));

const compareBody = `
  <p class="eyebrow">Same salary, two states</p>
  <h1>Compare take-home pay</h1>
  <p class="lede" id="compare-lead">Pick two states.</p>
  <form id="compare-form" class="panel">
    <div class="pair">
      <label class="field">Gross annual pay
        <input id="gross" type="number" min="0" step="1000" value="75000">
      </label>
      <label class="field">Filing status
        <select id="status">
          <option value="single">Single</option>
          <option value="married">Married filing jointly</option>
          <option value="head">Head of household</option>
          <option value="separate">Married filing separately</option>
        </select>
      </label>
    </div>
    <div class="pair">
      <label class="field">First state<select id="state-a"></select></label>
      <label class="field">Second state<select id="state-b"></select></label>
    </div>
    <label class="field">Traditional 401(k), percent
      <input id="k401" type="number" min="0" max="30" value="0">
    </label>
    <label class="field">Paychecks per year
      <select id="periods">
        <option value="26" selected>26</option>
        <option value="24">24</option>
        <option value="12">12</option>
        <option value="52">52</option>
      </select>
    </label>
  </form>
  <div class="compare-grid">
    <div id="side-a" class="stub"></div>
    <div id="side-b" class="stub"></div>
  </div>
  <script type="module" src="js/compare.js"></script>`;

write("compare.html", layout({
  title: `Compare Take-Home Pay by State (${TAX_YEAR})`,
  description: `Compare ${TAX_YEAR} net pay for the same salary in two US states after federal tax, FICA, and state income tax.`,
  body: compareBody,
  canonicalPath: "/compare.html",
}));

function exampleRow(stateCode, gross) {
  const result = calculatePaycheck({ grossAnnual: gross, status: "single", state: stateCode, periods: 26, k401Percent: 0 });
  return `<tr><td>${usd.format(gross)}</td><td>${usd.format(result.federalAnnual)}</td><td>${usd.format(result.ssAnnual + result.medicareAnnual)}</td><td>${usd.format(result.stateAnnual)}</td><td>${usd.format(result.netAnnual)}</td><td>${usd.format(result.netPeriod)}</td></tr>`;
}

STATES.forEach((s, index) => {
  const at75 = calculatePaycheck({ grossAnnual: 75000, status: "single", state: s.code, periods: 26, k401Percent: 0 });
  const top = s.single[s.single.length - 1].rate;
  const structure = !s.wageTax
    ? `${s.name} does not tax wages.`
    : s.single.length <= 2 && s.single.filter((b) => b.rate > 0).length === 1
      ? `${s.name} taxes wages at a flat ${(top * 100).toFixed(2)}% after its deduction.`
      : `${s.name} uses graduated brackets. The top rate in this table is ${(top * 100).toFixed(2)}%.`;
  const prev = STATES[(index + STATES.length - 1) % STATES.length];
  const next = STATES[(index + 1) % STATES.length];
  const body = `
    <p class="eyebrow">${TAX_YEAR} ${esc(s.name)} paycheck</p>
    <h1>${esc(s.name)} take-home pay calculator</h1>
    <p class="lede">${esc(structure)} A single filer making $75,000 keeps about ${usd.format(at75.netAnnual)} in this estimate, or ${usd.format(at75.netPeriod)} on each biweekly paycheck, before local tax.</p>
    ${calcBlock().replaceAll('src="js/', 'src="../js/')}
    <article class="prose">
      <h2>What $60,000, $100,000, and $150,000 keep in ${esc(s.name)}</h2>
      <p>Single filer, no 401(k), no pre-tax health premium, biweekly pay. Federal tax uses the ${TAX_YEAR} standard deduction of $16,100.</p>
      <table class="rank">
        <thead><tr><th>Gross</th><th>Federal</th><th>FICA</th><th>${esc(s.name)}</th><th>Take-home</th><th>Per paycheck</th></tr></thead>
        <tbody>
          ${exampleRow(s.code, 60000)}
          ${exampleRow(s.code, 100000)}
          ${exampleRow(s.code, 150000)}
        </tbody>
      </table>
      ${s.note ? `<p>${esc(s.note)}</p>` : ""}
      ${s.local ? `<p>${esc(s.local)}</p>` : ""}
      <p>Texas, on the same $75,000 salary, keeps ${usd.format(tx75.netAnnual)} because it has no wage income tax. Use <a href="../compare.html">compare</a> if you want two states side by side, or the <a href="../by-state.html">full ranking</a>.</p>
      <div class="pager">
        <a href="${prev.slug}.html">${esc(prev.name)}</a>
        <a href="${next.slug}.html">${esc(next.name)}</a>
      </div>
    </article>`;
  const html = layout({
    title: `${s.name} Paycheck Calculator ${TAX_YEAR} | Take-Home Pay`,
    description: `Estimate ${TAX_YEAR} take-home pay in ${s.name} after federal income tax, Social Security, Medicare, and ${s.name} state tax.`,
    body,
    depth: 1,
    defaultState: s.code,
    canonicalPath: `/states/${s.slug}.html`,
  });
  write(`states/${s.slug}.html`, html.replace('href="#calculator"', 'href="#calculator"'));
});

function simplePage(file, title, description, inner) {
  write(file, layout({
    title,
    description,
    body: `<article class="prose">${inner}</article>`,
    canonicalPath: `/${file}`,
  }));
}

simplePage("about.html", "About Paycheck Stub", "Paycheck Stub is an independent US take-home pay estimator for the 2026 tax year.", `
  <h1>About</h1>
  <p>Paycheck Stub is an independent calculator for US employees who want a plain estimate of take-home pay. It is not a payroll company, not a CPA firm, and not affiliated with the IRS or any state revenue department.</p>
  <p>The federal figures are the ${TAX_YEAR} standard deduction, the seven income-tax brackets, the Social Security wage base, and the 401(k) employee deferral limit published by the IRS. State income-tax brackets follow the Tax Foundation's January ${TAX_YEAR} compilation of state statutes. Local taxes are called out when they are common, and they are not subtracted.</p>
  <p><strong>Before you apply for advertising, replace this sentence with your legal name and the city and country where you operate the site.</strong> Ad networks reject sites that hide who publishes them.</p>
  <p><a href="contact.html">Contact</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></p>`);

simplePage("privacy.html", "Privacy Policy | Paycheck Stub", "How Paycheck Stub handles salary figures, cookies, and advertising.", `
  <h1>Privacy policy</h1>
  <p>Last updated October 17, 2026.</p>
  <h2>Salary figures</h2>
  <p>Pay, filing status, state, 401(k) percent, and health premiums are processed in your browser to draw the estimate. The site has no account system and no database of paychecks. Those values are not transmitted to our server because the calculator does not send them anywhere.</p>
  <p>A share link stores the same inputs in the page address so you can reopen the estimate. If you send that link to someone, they can see the numbers in it.</p>
  <h2>Advertising</h2>
  <p>If advertising is enabled, Google AdSense (Google LLC) may place and read cookies, or use similar storage, to show and measure ads. Google's use of advertising cookies is described in <a href="https://policies.google.com/technologies/ads">Google's advertising policy</a>. You can opt out of personalized advertising at <a href="https://adssettings.google.com">Google ad settings</a>.</p>
  <p>Until a publisher id is added in the site configuration, the pages do not load the AdSense script.</p>
  <h2>Server logs</h2>
  <p>The host that serves these files, such as Cloudflare, may keep standard request logs: IP address, browser, and the page requested. Those logs are the host's, and they are not a record of the salary you typed.</p>
  <h2>Contact</h2>
  <p>Privacy questions go to the address on the <a href="contact.html">contact page</a>.</p>`);

simplePage("terms.html", "Terms of Use | Paycheck Stub", "Terms for using the Paycheck Stub take-home pay estimator.", `
  <h1>Terms of use</h1>
  <p>Last updated October 17, 2026.</p>
  <p>The calculator is an educational estimate of US payroll taxes for ${TAX_YEAR}. It is not tax advice, legal advice, accounting advice, or an employer withholding calculation. Your real paycheck can differ. Do not file a return or change your W-4 based only on this page. Consult a qualified tax professional for advice about your own situation.</p>
  <p>State laws change. The tables were compiled for publishing this estimate and can be wrong or out of date. You are responsible for checking figures against IRS and state sources before you rely on them.</p>
  <p>The site is provided as-is, without a warranty of accuracy or fitness for a particular purpose. To the extent the law allows, the publisher is not liable for decisions you make from these estimates.</p>
  <p>You may link to the site. You may not scrape it in a way that degrades the service, and you may not present the estimates as official IRS calculations.</p>`);

simplePage("contact.html", "Contact | Paycheck Stub", "Contact the publisher of Paycheck Stub.", `
  <h1>Contact</h1>
  <p>Questions about a number, a state, or this site go to the inbox below.</p>
  <p><strong>Email:</strong> <a href="mailto:info@takehomestub.com">info@takehomestub.com</a></p>
  <p>For a wrong number on a specific state, name the state, the salary, the filing status, and what you expected to see.</p>`);

const paths = [
  "/",
  "/by-state.html",
  "/compare.html",
  "/about.html",
  "/privacy.html",
  "/terms.html",
  "/contact.html",
  ...STATES.map((s) => `/states/${s.slug}.html`),
];

if (SITE_URL) {
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${esc(SITE_URL + (p === "/" ? "/" : p))}</loc></url>`).join("\n")}
</urlset>
`);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
} else {
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`);
  write("robots.txt", "User-agent: *\nAllow: /\n");
}

write("ads.txt", "# Replace this file after AdSense approves the site.\n# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n");

console.log(`built ${paths.length} urls${SITE_URL ? " for " + SITE_URL : " (set SITE_URL to fill sitemap)"}`);
