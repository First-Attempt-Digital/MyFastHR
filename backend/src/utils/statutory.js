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

module.exports = { ESIC_WAGE_CEILING };
