import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    isThisYear,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subDays,
    subMonths,
    subWeeks,
    subYears
} from "date-fns";
import fnsTz from "date-fns-tz";

export type Period = "year" | "month" | "day" | "week" | "today" | "allTime";

export const getTime = () => {
    let utcTime = fnsTz.zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return fnsTz.utcToZonedTime(utcTime, "Asia/Tashkent")
}

export const getYearStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = subYears(time, minus);
    }
    return {start: startOfYear(time), end: endOfYear(time)}
}

export const getMonthStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = subMonths(time, minus);
    }
    return {start: startOfMonth(time), end: endOfMonth(time)}
}

export const getWeekStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = subWeeks(time, minus);
    }
    return {start: startOfWeek(time), end: endOfWeek(time)}
}

export const getDayStartAndEnd = (minus = 0) => {
    let time = getTime();
    console.log(minus);
    if (minus > 0) {
        time = subDays(time, minus);
    }
    return {start: startOfDay(time), end: endOfDay(time)}
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
            return getDayStartAndEnd(0)
        }
        case "day": {
            return getDayStartAndEnd(minus)
        }
        default: {
            return {start: goalCreatedTime, end: getTime()}
        }
    }
}


export const parseDate = (date: Date) => {
    return format(date, `dd.MM${isThisYear(date) ? "" : ".yyyy"}`)
}


export default {
    getTime,
    getYearStartAndEnd,
    getMonthStartAndEnd,
    getDayStartAndEnd,
    getWeekStartAndEnd,
    periodToStartAndEndDate
}