const fnsTz = require("date-fns-tz")

const getTime = () => {
    let utcTime = fnsTz.zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return fnsTz.utcToZonedTime(utcTime, "Asia/Tashkent")
}


module.exports = {getTime}