

export const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr || typeof dateStr !== 'string') {
        return '';
    }
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
        return dateStr; // Return original string if format is unexpected
    }
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
};
