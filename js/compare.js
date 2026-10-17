import { STATES } from "./tax-data.js";
import { calculatePaycheck } from "./engine.js";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money = (n) => usd.format(n || 0);

function options(selected) {
  return STATES.map((s) => `<option value="${s.code}" ${s.code === selected ? "selected" : ""}>${s.name}</option>`).join("");
}

function renderSide(el, result) {
  el.innerHTML = `
    <h2>${result.state.name}</h2>
    <p class="net-figure">${money(result.netAnnual)}</p>
    <p class="net-caption">take-home per year · ${money(result.netPeriod)} per paycheck</p>
    <table class="stub-table">
      <tbody>
        <tr><th scope="row">Federal income tax</th><td>${money(result.federalAnnual)}</td></tr>
        <tr><th scope="row">Social Security and Medicare</th><td>${money(result.ssAnnual + result.medicareAnnual + result.addlMedicareAnnual)}</td></tr>
        <tr><th scope="row">State income tax</th><td>${money(result.stateAnnual)}</td></tr>
        <tr><th scope="row">401(k)</th><td>${money(result.k401Annual)}</td></tr>
        <tr class="netline"><th scope="row">Net pay</th><td>${money(result.netAnnual)}</td></tr>
      </tbody>
    </table>
  `;
}

function run() {
  const grossAnnual = Number(document.getElementById("gross").value) || 0;
  const status = document.getElementById("status").value;
  const k401Percent = Number(document.getElementById("k401").value) || 0;
  const periods = Number(document.getElementById("periods").value) || 26;
  const a = calculatePaycheck({ grossAnnual, status, k401Percent, periods, state: document.getElementById("state-a").value });
  const b = calculatePaycheck({ grossAnnual, status, k401Percent, periods, state: document.getElementById("state-b").value });
  renderSide(document.getElementById("side-a"), a);
  renderSide(document.getElementById("side-b"), b);
  const diff = a.netAnnual - b.netAnnual;
  const lead = document.getElementById("compare-lead");
  if (Math.abs(diff) < 1) {
    lead.textContent = `${a.state.name} and ${b.state.name} come out the same on state income tax in this estimate.`;
  } else {
    const richer = diff > 0 ? a : b;
    const poorer = diff > 0 ? b : a;
    lead.textContent = `You keep ${money(Math.abs(diff))} more per year in ${richer.state.name} than in ${poorer.state.name}, before local taxes.`;
  }
}

const a = document.getElementById("state-a");
const b = document.getElementById("state-b");
a.innerHTML = options("TX");
b.innerHTML = options("CA");
document.getElementById("compare-form").addEventListener("input", run);
run();
