/**
 * Shared Utilities for client-side exporting (CSV, EPFO Payroll ECR)
 */

/**
 * Exports JSON data array to a CSV file.
 * @param {Array<Object>} data The data records array.
 * @param {string} filename The output file name.
 * @param {Object} [headers] Optional key-to-label mapping for columns. If omitted, all keys in data[0] are exported.
 */
export const exportToCSV = (data, filename, headers = null) => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
    const headerLabels = headers ? Object.values(headers) : keys;

    const csvRows = [];
    // 1. Add headers
    csvRows.push(headerLabels.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

    // 2. Add data rows
    for (const row of data) {
        const values = keys.map(key => {
            let val = row[key];

            // Handle nested objects or arrays gracefully
            if (val !== null && typeof val === 'object') {
                val = JSON.stringify(val);
            }

            const displayVal = val === null || val === undefined ? '' : val;
            return `"${String(displayVal).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Exports employee profile array in EPFO ECR #~# delimited format.
 * @param {Array<Object>} employees Array of employee records.
 * @param {string} filename Output file name.
 */
export const exportToECR = (employees, filename) => {
    if (!employees || employees.length === 0) {
        alert("No employee data available to generate EPFO ECR.");
        return;
    }

    let ecrText = '';
    employees.forEach(emp => {
        // Capping calculation rules for EPFO
        const grossWages = parseFloat(emp.base_salary || emp.salary_basis || 15000);
        const epfWages = Math.min(15000, grossWages);
        const epsWages = epfWages;
        const edliWages = epfWages;

        const epfEmployee = Math.round(epfWages * 0.12);
        const epsEmployer = Math.round(epsWages * 0.0833);
        const epfDiff = Math.max(0, epfEmployee - epsEmployer);

        const uan = emp.uan_number || emp.pf_number || emp.employee_id_number || 'UAN1000000';
        const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().substring(0, 30).toUpperCase();
        const ncpDays = 0; // Default non-contributing period days
        const refundOfAdvances = 0; // Default

        ecrText += `${uan}#~#${name}#~#${Math.round(grossWages)}#~#${Math.round(epfWages)}#~#${Math.round(epsWages)}#~#${Math.round(edliWages)}#~#${Math.round(epfEmployee)}#~#${Math.round(epsEmployer)}#~#${Math.round(epfDiff)}#~#${ncpDays}#~#${refundOfAdvances}\r\n`;
    });

    const blob = new Blob([ecrText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
