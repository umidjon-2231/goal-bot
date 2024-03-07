const fnsTz = require("date-fns-tz")
const fns = require("date-fns")

const getTime = () => {
    let utcTime = fnsTz.zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return fnsTz.utcToZonedTime(utcTime, "Asia/Tashkent")
}

const getYearStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subYears(time, minus);
    }
    return {start: fns.startOfYear(time), end: fns.endOfYear(time)}
}

const getMonthStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subMonths(time, minus);
    }
    return {start: fns.startOfMonth(time), end: fns.endOfMonth(time)}
}

const getWeekStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subWeeks(time, minus);
    }
    return {start: fns.startOfWeek(time), end: fns.endOfWeek(time)}
}

const getDayStartAndEnd = (minus = 0) => {
    let time = getTime();
    if (minus > 0) {
        time = fns.subDays(time, minus);
    }
    return {start: fns.startOfDay(time), end: fns.endOfDay(time)}
}

const periodToStartAndEndDate = (period, minus = 0, goalCreatedTime = new Date()) => {
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


module.exports = {
    getTime,
    getYearStartAndEnd,
    getMonthStartAndEnd,
    getDayStartAndEnd,
    getWeekStartAndEnd,
    periodToStartAndEndDate
}