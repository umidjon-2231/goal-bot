import fns from "date-fns";
import fnsTz from "date-fns-tz";

export type Period="year" | "month" | "day" | "week" | "today" | "allTime";

export const getTime = () => {
    let utcTime = fnsTz.zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return fnsTz.utcToZonedTime(utcTime, "Asia/Tashkent")
}

export const getYearStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subYears(time, minus);
    }
    return {start: fns.startOfYear(time), end: fns.endOfYear(time)}
}

export const getMonthStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subMonths(time, minus);
    }
    return {start: fns.startOfMonth(time), end: fns.endOfMonth(time)}
}

export const getWeekStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subWeeks(time, minus);
    }
    return {start: fns.startOfWeek(time), end: fns.endOfWeek(time)}
}

export const getDayStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subDays(time, minus);
    }
    return {start: fns.startOfDay(time), end: fns.endOfDay(time)}
}

export const periodToStartAndEndDate = (period: Period, minus = 0, goalCreatedTime = new Date()) => {
    switch (period) {
        case "year": {
            return getYearStartAndEnd(minus)
        }
        case "month": {
            return getMonthStartAndEnd(minus)
        }
        case "week": {
            return getWeekStartAndEnd(minus)
        }
        case "today": {
            return getDayStartAndEnd(minus)
        }
        default: {
            return {start: goalCreatedTime, end: getTime()}
        }
    }
}


export default {
    getTime,
    getYearStartAndEnd,
    getMonthStartAndEnd,
    getDayStartAndEnd,
    getWeekStartAndEnd,
    periodToStartAndEndDate
}