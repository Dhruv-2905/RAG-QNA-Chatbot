export const capitalizeQuestion = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};