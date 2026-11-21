/**
 * Statutory constants shared by the payroll paths.
 *
 * Keep these here rather than inline: the ESIC ceiling used to be a bare `35000`
 * literal duplicated across payrollService.js and payrollRoutes.js, which is how
 * one of the copies silently went missing.
 */

// ESIC wage ceiling. An employee whose gross wage exceeds this is out of the
// scheme for the period (eligibility cutoff, not a cap on the wage used).
const ESIC_WAGE_CEILING = 21000;

// PF wage ceiling. Employee and employer PF (12% each) are computed on basic
// capped at this amount (max 12% of 25000 = 3000 per side), unless the employee
// opted for excess contribution, in which case only the employer side is capped.
// Raised from 15000 to 25000 in Nov 2026.
const PF_WAGE_CEILING = 25000;

module.exports = { ESIC_WAGE_CEILING, PF_WAGE_CEILING };
