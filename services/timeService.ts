import {
    differenceInDays,
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format, getDaysInMonth,
    getDaysInYear,
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
    return {start: startOfYear(time), end: endOfYear(time), days: getDaysInYear(time)}
}

export const getMonthStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = subMonths(time, minus);
    }
    return {start: startOfMonth(time), end: endOfMonth(time), days: getDaysInMonth(time)}
}

export const getWeekStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = subWeeks(time, minus);
    }
    return {start: startOfWeek(time), end: endOfWeek(time), days: 7}
}

export const getDayStartAndEnd = (minus = 0) => {
    let time = getTime();
    console.log(minus);
    if (minus > 0) {
        time = subDays(time, minus);
    }
    return {start: startOfDay(time), end: endOfDay(time), days: 1}
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
            return {start: goalCreatedTime, end: getTime(), days: differenceInDays(goalCreatedTime, getTime())}
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