import { FEDERAL, STATE_BY_CODE, TAX_YEAR } from "./tax-data.js";

function asBrackets(rows) {
  return (rows || []).map((row) => (Array.isArray(row) ? { over: row[0], rate: row[1] } : row));
}

export function progressiveTax(income, brackets) {
  if (income <= 0 || !brackets?.length) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const start = brackets[i].over;
    const end = i + 1 < brackets.length ? brackets[i + 1].over : Infinity;
    if (income > start) tax += (Math.min(income, end) - start) * brackets[i].rate;
  }
  return Math.max(0, tax);
}

export function marginalRate(taxable, brackets) {
  if (!brackets?.length) return 0;
  if (taxable <= 0) return brackets[0].rate;
  let rate = brackets[0].rate;
  for (const bracket of brackets) {
    if (taxable > bracket.over) rate = bracket.rate;
  }
  return rate;
}

function money(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function filingKey(status) {
  if (status === "married" || status === "head" || status === "separate" || status === "single") return status;
  return "single";
}

/**
 * Annualized paycheck estimate.
 * Traditional 401(k) reduces income tax only. Pre-tax health premiums reduce
 * income tax and FICA. Social Security stops at the wage base. Additional
 * Medicare uses the employer withholding threshold of $200,000.
 */
export function calculatePaycheck(input) {
  const status = filingKey(input.status);
  const state = STATE_BY_CODE[input.state] || STATE_BY_CODE.TX;
  const periods = [52, 26, 24, 12].includes(Number(input.periods)) ? Number(input.periods) : 26;
  const grossAnnual = Math.max(0, Number(input.grossAnnual) || 0);
  const healthAnnual = Math.min(grossAnnual, Math.max(0, (Number(input.healthMonthly) || 0) * 12));

  const requestedK401 = grossAnnual * (Math.max(0, Number(input.k401Percent) || 0) / 100);
  const k401Annual = Math.min(requestedK401, FEDERAL.k401Limit, Math.max(0, grossAnnual - healthAnnual));
  const k401Capped = requestedK401 - k401Annual > 1;

  const ficaWages = Math.max(0, grossAnnual - healthAnnual);
  const incomeWages = Math.max(0, ficaWages - k401Annual);

  const ssAnnual = Math.min(ficaWages, FEDERAL.socialSecurityWageBase) * FEDERAL.socialSecurityRate;
  const medicareAnnual = ficaWages * FEDERAL.medicareRate;
  const addlMedicareAnnual =
    Math.max(0, ficaWages - FEDERAL.additionalMedicareWageThreshold) * FEDERAL.additionalMedicareRate;

  const federalBrackets = asBrackets(FEDERAL.brackets[status]);
  const federalTaxable = Math.max(0, incomeWages - FEDERAL.standardDeduction[status]);
  const federalAnnual = progressiveTax(federalTaxable, federalBrackets);

  const sk = status === "married" ? "married" : "single";
  const stateBrackets = asBrackets(sk === "married" ? state.married : state.single);
  const stateDeduction = (state.std[sk] || 0) + (state.deduction[sk] || 0);
  const stateTaxable = state.wageTax ? Math.max(0, incomeWages - stateDeduction) : 0;
  let stateAnnual = state.wageTax ? progressiveTax(stateTaxable, stateBrackets) : 0;
  let stateCredit = state.wageTax ? state.credit[sk] || 0 : 0;
  if (state.creditPhaseout && state.wageTax) {
    const threshold = sk === "married" ? state.creditPhaseout.married : state.creditPhaseout.single;
    stateCredit = Math.max(0, stateCredit - Math.max(0, incomeWages - threshold) * state.creditPhaseout.rate);
  }
  stateAnnual = Math.max(0, stateAnnual - stateCredit);

  const taxAnnual = federalAnnual + ssAnnual + medicareAnnual + addlMedicareAnnual + stateAnnual;
  const netAnnual = Math.max(0, grossAnnual - taxAnnual - k401Annual - healthAnnual);
  const per = (n) => n / periods;

  const notes = [];
  if (k401Capped) {
    notes.push(`Traditional 401(k) contributions are capped at $${FEDERAL.k401Limit.toLocaleString("en-US")} for ${TAX_YEAR}.`);
  }
  if (ficaWages > FEDERAL.socialSecurityWageBase) {
    notes.push(`Social Security tax stops after $${FEDERAL.socialSecurityWageBase.toLocaleString("en-US")} of wages in ${TAX_YEAR}.`);
  }
  if (addlMedicareAnnual > 0) {
    notes.push("Additional Medicare tax of 0.9% is withheld once wages from this job pass $200,000.");
  }
  if (state.local) notes.push(state.local);
  if (state.note) notes.push(state.note);
  if (status === "head") {
    notes.push("Head of household uses federal head-of-household brackets. State tax uses the single-filer state table.");
  }
  if (status === "separate") {
    notes.push("Married filing separately uses federal separate brackets. State tax uses the single-filer state table.");
  }

  return {
    year: TAX_YEAR,
    state,
    status,
    periods,
    grossAnnual: money(grossAnnual),
    grossPeriod: money(per(grossAnnual)),
    k401Annual: money(k401Annual),
    k401Period: money(per(k401Annual)),
    k401Capped,
    healthAnnual: money(healthAnnual),
    healthPeriod: money(per(healthAnnual)),
    federalAnnual: money(federalAnnual),
    federalPeriod: money(per(federalAnnual)),
    federalTaxable: money(federalTaxable),
    marginalFederal: marginalRate(federalTaxable, federalBrackets),
    ssAnnual: money(ssAnnual),
    ssPeriod: money(per(ssAnnual)),
    medicareAnnual: money(medicareAnnual),
    medicarePeriod: money(per(medicareAnnual)),
    addlMedicareAnnual: money(addlMedicareAnnual),
    addlMedicarePeriod: money(per(addlMedicareAnnual)),
    stateAnnual: money(stateAnnual),
    statePeriod: money(per(stateAnnual)),
    taxAnnual: money(taxAnnual),
    netAnnual: money(netAnnual),
    netPeriod: money(per(netAnnual)),
    effectiveTax: grossAnnual > 0 ? taxAnnual / grossAnnual : 0,
    notes,
  };
}

export function grossFromHourly(rate, hoursPerWeek, weeksPerYear) {
  return Math.max(0, Number(rate) || 0) * Math.max(0, Number(hoursPerWeek) || 0) * Math.max(0, Number(weeksPerYear) || 0);
}
