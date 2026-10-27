import { getYear } from 'date-fns';

export const getYearFromDate = (date: Date | number | string) => getYear(date);
