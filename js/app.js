import { STATES } from "./tax-data.js";
import { calculatePaycheck, grossFromHourly } from "./engine.js";

const PERIOD_LABEL = {
  52: "weekly paycheck",
  26: "biweekly paycheck",
  24: "semimonthly paycheck",
  12: "monthly paycheck",
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function money(n) {
  return usd.format(n || 0);
}

function fillStates(select, selected) {
  select.innerHTML = STATES.map((s) => `<option value="${s.code}">${s.name}</option>`).join("");
  if (selected && [...select.options].some((o) => o.value === selected)) select.value = selected;
}

function readParams() {
  return new URLSearchParams(location.search);
}

function val(id) {
  return document.getElementById(id);
}

export function readInput() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || "salary";
  let grossAnnual = Number(val("gross").value) || 0;
  if (mode === "hourly") {
    grossAnnual = grossFromHourly(val("hourly").value, val("hours").value, val("weeks").value);
  }
  return {
    mode,
    grossAnnual,
    periods: Number(val("periods").value) || 26,
    status: val("status").value,
    state: val("state").value,
    k401Percent: Number(val("k401").value) || 0,
    healthMonthly: Number(val("health").value) || 0,
    hourly: Number(val("hourly").value) || 0,
    hours: Number(val("hours").value) || 0,
    weeks: Number(val("weeks").value) || 0,
  };
}

function syncUrl(input) {
  const params = new URLSearchParams();
  params.set("mode", input.mode);
  params.set("pay", String(Math.round(input.mode === "salary" ? Number(val("gross").value) || 0 : input.grossAnnual)));
  params.set("freq", String(input.periods));
  params.set("status", input.status);
  params.set("state", input.state);
  params.set("k401", String(input.k401Percent));
  if (input.healthMonthly) params.set("health", String(input.healthMonthly));
  if (input.mode === "hourly") {
    params.set("rate", String(input.hourly));
    params.set("hours", String(input.hours));
    params.set("weeks", String(input.weeks));
  }
  const next = `${location.pathname}?${params.toString()}`;
  if (next !== location.pathname + location.search) history.replaceState(null, "", next);
}

function row(label, period, annual, kind) {
  return `<tr class="${kind || ""}"><th scope="row">${label}</th><td>${money(period)}</td><td>${money(annual)}</td></tr>`;
}

function render(result, input) {
  const stub = val("stub");
  const slices = [
    ["Take-home", result.netAnnual, "net"],
    ["Federal tax", result.federalAnnual, "fed"],
    ["Social Security", result.ssAnnual, "ss"],
    ["Medicare", result.medicareAnnual + result.addlMedicareAnnual, "med"],
    ["State tax", result.stateAnnual, "state"],
    ["401(k)", result.k401Annual, "k401"],
    ["Health", result.healthAnnual, "health"],
  ].filter((s) => s[1] > 0.004 || s[2] === "net");
  const total = slices.reduce((sum, s) => sum + s[1], 0) || 1;
  const bar = slices
    .map(([label, amount, kind]) => `<span class="slice ${kind}" style="width:${(amount / total) * 100}%" title="${label}"></span>`)
    .join("");

  const freq = PERIOD_LABEL[result.periods] || "paycheck";
  stub.innerHTML = `
    <p class="eyebrow">Estimated ${freq} · ${result.state.name} · ${result.year}</p>
    <p class="net-figure">${money(result.netPeriod)}</p>
    <p class="net-caption">take-home per paycheck · <strong>${money(result.netAnnual)}</strong> a year</p>
    <div class="bar" aria-hidden="true">${bar}</div>
    <table class="stub-table">
      <thead><tr><th scope="col">Line</th><th scope="col">This paycheck</th><th scope="col">Year</th></tr></thead>
      <tbody>
        ${row("Gross pay", result.grossPeriod, result.grossAnnual)}
        ${row("Federal income tax", result.federalPeriod, result.federalAnnual, "deduct")}
        ${row("Social Security (6.2%)", result.ssPeriod, result.ssAnnual, "deduct")}
        ${row("Medicare (1.45%)", result.medicarePeriod, result.medicareAnnual, "deduct")}
        ${result.addlMedicareAnnual ? row("Additional Medicare (0.9%)", result.addlMedicarePeriod, result.addlMedicareAnnual, "deduct") : ""}
        ${row(`${result.state.name} income tax`, result.statePeriod, result.stateAnnual, "deduct")}
        ${row("Traditional 401(k)", result.k401Period, result.k401Annual, "save")}
        ${result.healthAnnual ? row("Pre-tax health", result.healthPeriod, result.healthAnnual, "deduct") : ""}
        ${row("Net pay", result.netPeriod, result.netAnnual, "netline")}
      </tbody>
    </table>
    <dl class="facts">
      <div><dt>Effective tax</dt><dd>${(result.effectiveTax * 100).toFixed(1)}%</dd></div>
      <div><dt>Federal marginal rate</dt><dd>${(result.marginalFederal * 100).toFixed(0)}%</dd></div>
      <div><dt>Taxable income after the standard deduction</dt><dd>${money(result.federalTaxable)}</dd></div>
    </dl>
    ${result.notes.length ? `<ul class="notes">${result.notes.map((n) => `<li>${n}</li>`).join("")}</ul>` : ""}
  `;
  const annualized = val("annualized");
  if (annualized) {
    annualized.hidden = input.mode !== "hourly";
    annualized.textContent = `Annualized gross pay: ${money(input.grossAnnual)}`;
  }
}

function applyMode() {
  const hourly = document.querySelector('input[name="mode"]:checked')?.value === "hourly";
  val("salary-fields").hidden = hourly;
  val("hourly-fields").hidden = !hourly;
}

function compute() {
  applyMode();
  const input = readInput();
  val("k401-out").textContent = `${input.k401Percent}%`;
  render(calculatePaycheck(input), input);
  syncUrl(input);
}

function loadFromUrl() {
  const params = readParams();
  const preset = document.body.dataset.defaultState || "CA";
  fillStates(val("state"), params.get("state") || preset);
  if (params.get("mode") === "hourly") {
    document.querySelector('input[name="mode"][value="hourly"]').checked = true;
  }
  if (params.get("pay") && params.get("mode") !== "hourly") val("gross").value = params.get("pay");
  if (params.get("freq")) val("periods").value = params.get("freq");
  if (params.get("status")) val("status").value = params.get("status");
  if (params.get("k401")) val("k401").value = params.get("k401");
  if (params.get("health")) val("health").value = params.get("health");
  if (params.get("rate")) val("hourly").value = params.get("rate");
  if (params.get("hours")) val("hours").value = params.get("hours");
  if (params.get("weeks")) val("weeks").value = params.get("weeks");
}

function init() {
  if (!val("pay-form")) return;
  loadFromUrl();
  val("pay-form").addEventListener("input", compute);
  val("pay-form").addEventListener("change", compute);
  val("share").addEventListener("click", async () => {
    compute();
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      val("share").textContent = "Link copied";
    } catch {
      window.prompt("Copy this link:", url);
    }
    setTimeout(() => {
      val("share").textContent = "Copy link";
    }, 1600);
  });
  val("print").addEventListener("click", () => window.print());
  compute();
}

init();
