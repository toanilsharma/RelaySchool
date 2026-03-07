/** FIX #8: All download helpers use try/finally so URL is always revoked,
 *  preventing memory leaks even if link.click() throws (e.g. sandboxed environments). */

const triggerDownload = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    try {
        link.click();
    } finally {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export const downloadTextFile = (content: string, filename: string): void => {
    triggerDownload(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename);
};

export const downloadCSVFile = (content: string, filename: string): void => {
    triggerDownload(new Blob([content], { type: 'text/csv;charset=utf-8;' }), filename);
};

export const downloadJSONFile = (data: unknown, filename: string): void => {
    triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }), filename);
};
