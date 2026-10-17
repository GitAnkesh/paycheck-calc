/**
 * 2026 paycheck estimate tables.
 * Federal brackets, standard deduction, Social Security wage base, and 401(k)
 * limit: IRS Rev. Proc. 2025-32, IRS Publication 15 (2026), IRS Notice on 401(k) limits.
 * State brackets: Tax Foundation, "State Individual Income Tax Rates and Brackets, 2026"
 * (tables as of January 1, 2026). Local wage taxes are not included.
 * This is an estimator, not employer withholding under IRS Publication 15-T.
 */

export const TAX_YEAR = 2026;

export const FEDERAL = {
  standardDeduction: {
    single: 16100,
    married: 32200,
    head: 24150,
    separate: 16100,
  },
  brackets: {
    single: [
      [0, 0.1],
      [12400, 0.12],
      [50400, 0.22],
      [105700, 0.24],
      [201775, 0.32],
      [256225, 0.35],
      [640600, 0.37],
    ],
    married: [
      [0, 0.1],
      [24800, 0.12],
      [100800, 0.22],
      [211400, 0.24],
      [403550, 0.32],
      [512450, 0.35],
      [768700, 0.37],
    ],
    head: [
      [0, 0.1],
      [17700, 0.12],
      [67450, 0.22],
      [105700, 0.24],
      [201775, 0.32],
      [256200, 0.35],
      [640600, 0.37],
    ],
    separate: [
      [0, 0.1],
      [12400, 0.12],
      [50400, 0.22],
      [105700, 0.24],
      [201775, 0.32],
      [256225, 0.35],
      [384350, 0.37],
    ],
  },
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 184500,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareWageThreshold: 200000,
  k401Limit: 24500,
};

const B = (rows) => rows.map(([over, rate]) => ({ over, rate }));

function state(partial) {
  const std = partial.std || [0, 0];
  const ded = partial.ded || [0, 0];
  const credit = partial.credit || [0, 0];
  return {
    wageTax: partial.wageTax !== false,
    std: { single: std[0], married: std[1], head: std[0], separate: std[0] },
    deduction: { single: ded[0], married: ded[1], head: ded[0], separate: ded[0] },
    credit: { single: credit[0], married: credit[1], head: credit[0], separate: credit[0] },
    single: B(partial.single || [[0, 0]]),
    married: B(partial.married || partial.single || [[0, 0]]),
    local: partial.local || "",
    note: partial.note || "",
    creditPhaseout: partial.creditPhaseout || null,
  };
}

const NONE = state({
  wageTax: false,
  single: [[0, 0]],
  note: "No state tax on wages.",
});

export const STATES = [
  ["AL", "Alabama", "alabama", state({
    std: [3000, 8500],
    ded: [1500, 3000],
    single: [[0, 0.02], [500, 0.04], [3000, 0.05]],
    married: [[0, 0.02], [1000, 0.04], [6000, 0.05]],
    local: "A few Alabama cities levy small occupational taxes.",
  })],
  ["AK", "Alaska", "alaska", NONE],
  ["AZ", "Arizona", "arizona", state({
    std: [8350, 16700],
    single: [[0, 0.025]],
    note: "Flat 2.5% after the state standard deduction.",
  })],
  ["AR", "Arkansas", "arkansas", state({
    std: [2470, 4940],
    credit: [29, 58],
    single: [[0, 0.02], [4600, 0.039]],
  })],
  ["CA", "California", "california", state({
    std: [5540, 11080],
    credit: [153, 306],
    single: [[0, 0.01], [11079, 0.02], [26264, 0.04], [41452, 0.06], [57542, 0.08], [72724, 0.093], [371479, 0.103], [445771, 0.113], [742953, 0.123], [1000000, 0.133]],
    married: [[0, 0.01], [22158, 0.02], [52528, 0.04], [82904, 0.06], [115084, 0.08], [145448, 0.093], [742958, 0.103], [891542, 0.113], [1000000, 0.123], [1485906, 0.133]],
    note: "Includes the 1% Mental Health Services Tax over $1 million. California SDI is not included.",
  })],
  ["CO", "Colorado", "colorado", state({
    std: [16100, 32200],
    single: [[0, 0.044]],
    note: "Flat 4.4% on income after the federal standard deduction.",
  })],
  ["CT", "Connecticut", "connecticut", state({
    ded: [15000, 24000],
    single: [[0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]],
    married: [[0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]],
    note: "Connecticut also recaptures lower brackets at higher incomes. This estimate does not apply that recapture, so high earners may owe more than shown.",
  })],
  ["DE", "Delaware", "delaware", state({
    std: [3250, 6500],
    credit: [110, 220],
    single: [[0, 0], [2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]],
  })],
  ["FL", "Florida", "florida", NONE],
  ["GA", "Georgia", "georgia", state({
    std: [12000, 24000],
    single: [[0, 0.0519]],
    note: "Flat 5.19% in the January 2026 Tax Foundation tables, after Georgia's standard deduction.",
  })],
  ["HI", "Hawaii", "hawaii", state({
    std: [4400, 8800],
    ded: [1144, 2288],
    single: [[0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.1], [325000, 0.11]],
    married: [[0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.1], [650000, 0.11]],
  })],
  ["ID", "Idaho", "idaho", state({
    std: [16100, 32200],
    single: [[0, 0], [4811, 0.053]],
    married: [[0, 0], [9622, 0.053]],
    note: "Flat 5.3% after the federal standard deduction and a small zero-rate band.",
  })],
  ["IL", "Illinois", "illinois", state({
    ded: [2925, 5850],
    single: [[0, 0.0495]],
    note: "Flat 4.95%. The personal exemption phases out at high income; this estimate keeps the base exemption.",
  })],
  ["IN", "Indiana", "indiana", state({
    ded: [1000, 2000],
    single: [[0, 0.0295]],
    local: "Most Indiana counties add a county income tax on top of the 2.95% state rate.",
  })],
  ["IA", "Iowa", "iowa", state({
    std: [16100, 32200],
    credit: [40, 80],
    single: [[0, 0.038]],
  })],
  ["KS", "Kansas", "kansas", state({
    std: [3605, 8240],
    ded: [9160, 18320],
    single: [[0, 0.052], [23000, 0.0558]],
    married: [[0, 0.052], [46000, 0.0558]],
  })],
  ["KY", "Kentucky", "kentucky", state({
    std: [3360, 3360],
    single: [[0, 0.035]],
    local: "Kentucky cities and counties often add a local occupational tax near 1%.",
  })],
  ["LA", "Louisiana", "louisiana", state({
    std: [12875, 25750],
    single: [[0, 0.03]],
  })],
  ["ME", "Maine", "maine", state({
    std: [8350, 16700],
    ded: [5300, 10600],
    single: [[0, 0.058], [27399, 0.0675], [64849, 0.0715]],
    married: [[0, 0.058], [54849, 0.0675], [129749, 0.0715]],
  })],
  ["MD", "Maryland", "maryland", state({
    std: [3350, 6700],
    ded: [3200, 6400],
    single: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575], [500000, 0.0625], [1000000, 0.065]],
    married: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575], [600000, 0.0625], [1200000, 0.065]],
    local: "Maryland counties add a local income tax, often about 2.4% of income on average.",
  })],
  ["MA", "Massachusetts", "massachusetts", state({
    ded: [4400, 8800],
    single: [[0, 0.05], [1083150, 0.09]],
    note: "5% on wages, plus the 4% surtax above about $1,083,150. Paid family leave withholding is not included.",
  })],
  ["MI", "Michigan", "michigan", state({
    ded: [5900, 11800],
    single: [[0, 0.0425]],
    local: "Some Michigan cities, including Detroit, levy a city income tax.",
  })],
  ["MN", "Minnesota", "minnesota", state({
    std: [15300, 30600],
    single: [[0, 0.0535], [33310, 0.068], [109430, 0.0785], [203150, 0.0985]],
    married: [[0, 0.0535], [48700, 0.068], [193480, 0.0785], [337930, 0.0985]],
  })],
  ["MS", "Mississippi", "mississippi", state({
    std: [2300, 4600],
    ded: [6000, 12000],
    single: [[0, 0], [10000, 0.04]],
    note: "4% on taxable income above $10,000.",
  })],
  ["MO", "Missouri", "missouri", state({
    std: [16100, 32200],
    single: [[0, 0], [1348, 0.02], [2696, 0.025], [4044, 0.03], [5392, 0.035], [6740, 0.04], [8088, 0.045], [9436, 0.047]],
  })],
  ["MT", "Montana", "montana", state({
    std: [16100, 32200],
    single: [[0, 0.047], [47500, 0.0565]],
    married: [[0, 0.047], [95000, 0.0565]],
  })],
  ["NE", "Nebraska", "nebraska", state({
    std: [8850, 17700],
    credit: [176, 352],
    single: [[0, 0.0246], [4130, 0.0351], [24760, 0.0455]],
    married: [[0, 0.0246], [8250, 0.0351], [49530, 0.0455]],
  })],
  ["NV", "Nevada", "nevada", NONE],
  ["NH", "New Hampshire", "new-hampshire", NONE],
  ["NJ", "New Jersey", "new-jersey", state({
    ded: [1000, 2000],
    single: [[0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.0553], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]],
    married: [[0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.0553], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]],
  })],
  ["NM", "New Mexico", "new-mexico", state({
    std: [16100, 32200],
    single: [[0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]],
    married: [[0, 0.015], [8000, 0.032], [25000, 0.043], [50000, 0.047], [100000, 0.049], [315000, 0.059]],
  })],
  ["NY", "New York", "new-york", state({
    std: [8000, 16050],
    single: [[0, 0.039], [8500, 0.044], [11700, 0.0515], [13900, 0.054], [80650, 0.059], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]],
    married: [[0, 0.039], [17150, 0.044], [23600, 0.0515], [27900, 0.054], [161550, 0.059], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]],
    local: "New York City and Yonkers add their own income tax. This estimate is state tax only.",
    note: "High earners can face benefit recapture that this estimate does not apply.",
  })],
  ["NC", "North Carolina", "north-carolina", state({
    std: [12750, 25500],
    single: [[0, 0.0399]],
    note: "Flat 3.99% after the state standard deduction.",
  })],
  ["ND", "North Dakota", "north-dakota", state({
    std: [16100, 32200],
    single: [[0, 0], [48475, 0.0195], [244825, 0.025]],
    married: [[0, 0], [80975, 0.0195], [298075, 0.025]],
    note: "Most wages under the first bracket are taxed at 0%.",
  })],
  ["OH", "Ohio", "ohio", state({
    ded: [2400, 4800],
    single: [[0, 0], [26050, 0.0275]],
    local: "Ohio cities commonly levy a municipal income tax around 1% to 2.5%.",
    note: "Flat 2.75% on nonbusiness income above $26,050.",
  })],
  ["OK", "Oklahoma", "oklahoma", state({
    std: [6350, 12700],
    ded: [1000, 2000],
    single: [[0, 0], [3750, 0.025], [4900, 0.035], [7200, 0.045]],
    married: [[0, 0], [7500, 0.025], [9800, 0.035], [14400, 0.045]],
  })],
  ["OR", "Oregon", "oregon", state({
    std: [2910, 5820],
    credit: [256, 512],
    single: [[0, 0.0475], [4550, 0.0675], [11400, 0.0875], [125000, 0.099]],
    married: [[0, 0.0475], [9100, 0.0675], [22800, 0.0875], [250000, 0.099]],
    note: "Oregon has no sales tax, and state income tax is high. The exemption credit phases out at higher incomes; the base credit is used here.",
  })],
  ["PA", "Pennsylvania", "pennsylvania", state({
    single: [[0, 0.0307]],
    local: "Pennsylvania local earned-income tax is often about 1% and is not included.",
    note: "Flat 3.07% on wages. Pennsylvania does not offer a standard deduction.",
  })],
  ["RI", "Rhode Island", "rhode-island", state({
    std: [11200, 22400],
    ded: [5250, 10500],
    single: [[0, 0.0375], [82050, 0.0475], [186450, 0.0599]],
  })],
  ["SC", "South Carolina", "south-carolina", state({
    std: [8350, 16700],
    single: [[0, 0], [3640, 0.03], [18230, 0.06]],
  })],
  ["SD", "South Dakota", "south-dakota", NONE],
  ["TN", "Tennessee", "tennessee", NONE],
  ["TX", "Texas", "texas", NONE],
  ["UT", "Utah", "utah", state({
    credit: [966, 1932],
    single: [[0, 0.045]],
    creditPhaseout: { rate: 0.013, single: 18213, married: 36426 },
    note: "Flat 4.5%. A taxpayer credit starts near 6% of the federal standard deduction and phases out as income rises.",
  })],
  ["VT", "Vermont", "vermont", state({
    std: [7650, 15300],
    ded: [5300, 10600],
    single: [[0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]],
    married: [[0, 0.0335], [82500, 0.066], [199450, 0.076], [304000, 0.0875]],
  })],
  ["VA", "Virginia", "virginia", state({
    std: [8750, 17500],
    ded: [930, 1860],
    single: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]],
  })],
  ["WA", "Washington", "washington", state({
    wageTax: false,
    single: [[0, 0]],
    note: "Washington does not tax wages. It does tax some capital gains, which this paycheck estimate ignores. WA Cares long-term care withholding (0.58%) is not included.",
  })],
  ["WV", "West Virginia", "west-virginia", state({
    ded: [2000, 4000],
    single: [[0, 0.0222], [10000, 0.0296], [25000, 0.0333], [40000, 0.0444], [60000, 0.0482]],
  })],
  ["WI", "Wisconsin", "wisconsin", state({
    std: [13960, 25840],
    ded: [700, 1400],
    single: [[0, 0.035], [15110, 0.044], [51950, 0.053], [332720, 0.0765]],
    married: [[0, 0.035], [20150, 0.044], [69260, 0.053], [443630, 0.0765]],
  })],
  ["WY", "Wyoming", "wyoming", NONE],
  ["DC", "District of Columbia", "district-of-columbia", state({
    std: [16100, 32200],
    single: [[0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]],
  })],
].map(([code, name, slug, rules]) => ({ code, name, slug, ...rules }));

export const STATE_BY_CODE = Object.fromEntries(STATES.map((s) => [s.code, s]));
