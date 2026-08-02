// Wraps res.json for every request so that any error response accidentally carrying a raw
// DB-driver/SQL error message (e.g. Knex 3.x's compileSqlOnError enriches err.message with the
// compiled SQL + bound values) never reaches the client, regardless of which controller built it.
// Legitimate business-logic messages (e.g. "Invalid leave type selected.") never match these
// patterns and pass through unchanged.
const RAW_ERROR_PATTERNS = [
    // A SQL verb followed (within a short distance) by a backtick-quoted identifier is how
    // Knex-compiled SQL actually looks (e.g. "insert into `leaves` (`company_id`, ...)").
    // Requiring the backtick avoids matching plain English like "Invalid status update" or
    // "Unauthorized to update ticket status/assignee."
    /\b(select|update|delete\s+from|insert\s+into)\b[\s\S]{0,60}?`[a-zA-Z_0-9]+`/i,
    /^ER_[A-Z_]+/,
    /SQLSTATE/i,
    /ECONNREFUSED|ETIMEDOUT|PROTOCOL_CONNECTION_LOST|ENOTFOUND/,
    /`[a-zA-Z_0-9]+`\.`[a-zA-Z_0-9]+`/,
    /Unknown column/i,
    /Duplicate entry/i,
    /doesn't exist\b/i,
    /at \S+ \(.*:\d+:\d+\)/, // stack-trace frame line
];

function looksLikeRawDriverError(value) {
    return typeof value === 'string' && RAW_ERROR_PATTERNS.some((re) => re.test(value));
}

function errorResponseSanitizer(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (body && typeof body === 'object') {
            ['message', 'error', 'detail'].forEach((key) => {
                if (looksLikeRawDriverError(body[key])) {
                    console.error(`[sanitized-error-response] ${req.method} ${req.originalUrl} leaked raw driver error:`, body[key]);
                    body[key] = 'An internal error occurred. Please try again or contact support.';
                }
            });
        }
        return originalJson(body);
    };
    next();
}

module.exports = errorResponseSanitizer;
