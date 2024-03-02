const fns = require("date-fns")
const {utcToZonedTime, zonedTimeToUtc} = require("date-fns-tz")

const getTime = () => {
    let utcTime = zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return utcToZonedTime(utcTime, "Asia/Tashkent")
}


module.exports={getTime}