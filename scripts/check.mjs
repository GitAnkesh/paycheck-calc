import { calculatePaycheck, progressiveTax } from "../js/engine.js";
import { FEDERAL, STATES } from "../js/tax-data.js";

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  }
}

const singleBrackets = FEDERAL.brackets.single.map(([over, rate]) => ({ over, rate }));
const taxable = 75000 - 16100;
const federal = progressiveTax(taxable, singleBrackets);
assert(Math.abs(federal - 7670) < 0.01, `federal 75k single expected 7670 got ${federal}`);

const tx = calculatePaycheck({ grossAnnual: 75000, status: "single", state: "TX", periods: 26, k401Percent: 0 });
assert(tx.stateAnnual === 0, "Texas wage tax is 0");
assert(Math.abs(tx.federalAnnual - 7670) < 0.02, `tx federal ${tx.federalAnnual}`);
assert(Math.abs(tx.ssAnnual - 75000 * 0.062) < 0.02, "ss");
assert(Math.abs(tx.medicareAnnual - 75000 * 0.0145) < 0.02, "medicare");
assert(tx.netAnnual < tx.grossAnnual, "net below gross");

const ca = calculatePaycheck({ grossAnnual: 75000, status: "single", state: "CA", periods: 26, k401Percent: 0 });
assert(ca.stateAnnual > 2000 && ca.stateAnnual < 4000, `CA state tax plausible, got ${ca.stateAnnual}`);
assert(ca.netAnnual > 55000 && ca.netAnnual < 62000, `CA net plausible, got ${ca.netAnnual}`);

const high = calculatePaycheck({ grossAnnual: 250000, status: "single", state: "TX", periods: 26, k401Percent: 0 });
assert(Math.abs(high.ssAnnual - 184500 * 0.062) < 0.05, `SS cap ${high.ssAnnual}`);
assert(Math.abs(high.addlMedicareAnnual - 50000 * 0.009) < 0.05, `addl medicare ${high.addlMedicareAnnual}`);
assert(high.marginalFederal === 0.32 || high.marginalFederal === 0.35, `marginal ${high.marginalFederal}`);

const withK = calculatePaycheck({ grossAnnual: 100000, status: "single", state: "TX", periods: 26, k401Percent: 10 });
const noK = calculatePaycheck({ grossAnnual: 100000, status: "single", state: "TX", periods: 26, k401Percent: 0 });
assert(withK.ssAnnual === noK.ssAnnual, "401k does not reduce Social Security");
assert(withK.federalAnnual < noK.federalAnnual, "401k reduces federal tax");
assert(Math.abs(withK.k401Annual - 10000) < 0.02, "10% of 100k");

const capped = calculatePaycheck({ grossAnnual: 200000, status: "single", state: "TX", periods: 26, k401Percent: 20 });
assert(capped.k401Annual === 24500, `401k cap ${capped.k401Annual}`);

const health = calculatePaycheck({ grossAnnual: 100000, status: "single", state: "TX", periods: 12, healthMonthly: 500 });
assert(Math.abs(health.ssAnnual - 94000 * 0.062) < 0.05, "health reduces FICA wages");

const married = calculatePaycheck({ grossAnnual: 75000, status: "married", state: "TX", periods: 26 });
assert(married.federalAnnual < tx.federalAnnual, "married federal tax is lower at 75k");

for (const s of STATES) {
  const row = calculatePaycheck({ grossAnnual: 90000, status: "single", state: s.code, periods: 26, k401Percent: 5 });
  assert(row.netAnnual > 40000 && row.netAnnual < 90000, `${s.code} net out of range ${row.netAnnual}`);
  assert(row.stateAnnual >= 0, `${s.code} negative state tax`);
}

const zero = calculatePaycheck({ grossAnnual: 0, status: "single", state: "CA" });
assert(zero.netAnnual === 0 && zero.federalAnnual === 0, "zero income");

if (process.exitCode) {
  console.error("checks failed");
} else {
  console.log("checks ok");
  console.log("CA 75k single", ca);
  console.log("states", STATES.length);
}
