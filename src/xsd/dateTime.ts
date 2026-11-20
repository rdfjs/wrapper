import { XSD } from "../vocabulary/XSD.js"
import { collapse, lexicalError, lexicalPattern } from "./pattern.js"

/**
 * The IRIs of the XSD datatypes whose lexical form is a date or a date and time.
 *
 * @see
 * - [date in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#date)
 * - [dateTime in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#dateTime)
 */
export const dateDatatypes: string[] = [
    XSD.date,
    XSD.dateTime,
]

const year = /(?<year>-?(?:[1-9]\d{3,}|0\d{3}))/
const month = /(?<month>\d{2})/
const day = /(?<day>\d{2})/
const hour = /(?<hour>\d{2})/
const minute = /(?<minute>\d{2})/
const second = /(?<second>\d{2})/
const fraction = /(?<fraction>\d+)/
const timezone = /(?<timezone>Z|[+-]\d{2}:\d{2})/

const datePattern = lexicalPattern`${year}-${month}-${day}${timezone}?`
const dateTimePattern = lexicalPattern`${year}-${month}-${day}T${hour}:${minute}:${second}(?:\.${fraction})?${timezone}?`

const millisecondsPerDay = 86400000

interface DateParts {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
    fraction: string
    timezone: string | undefined
}

/**
 * Parses the lexical form of `xsd:date`.
 *
 * @param lexical - The lexical form to parse. Whitespace is collapsed before parsing.
 * @returns The instant at the start of the date. A date without a timezone is read as UTC.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseDate(lexical: string): Date {
    const parts = readParts(datePattern, lexical)

    if (parts === undefined || !isValidDate(parts) || !isValidTimezone(parts.timezone)) {
        throw lexicalError(XSD.date, lexical)
    }

    return buildDate(parts, false) ?? fail(XSD.date, lexical)
}

/**
 * Parses the lexical form of `xsd:dateTime`.
 *
 * @param lexical - The lexical form to parse. Whitespace is collapsed before parsing.
 * @returns The instant. A date and time without a timezone is read as UTC. The time `24:00:00` is the start of the next day.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseDateTime(lexical: string): Date {
    const parts = readParts(dateTimePattern, lexical)

    if (parts === undefined || !isValidDate(parts) || !isValidTime(parts) || !isValidTimezone(parts.timezone)) {
        throw lexicalError(XSD.dateTime, lexical)
    }

    return buildDate(parts, true) ?? fail(XSD.dateTime, lexical)
}

/**
 * Formats a {@link Date} as the lexical form of `xsd:date`.
 *
 * @param value - The date to format. The UTC date is used.
 * @returns The lexical form.
 */
export function formatDate(value: Date): string {
    return value.toISOString().split("T")[0]!
}

/**
 * Formats a {@link Date} as the lexical form of `xsd:dateTime`.
 *
 * @param value - The date to format.
 * @returns The lexical form in UTC.
 */
export function formatDateTime(value: Date): string {
    return value.toISOString()
}

function fail(datatype: string, lexical: string): never {
    throw lexicalError(datatype, lexical)
}

function readParts(pattern: RegExp, lexical: string): DateParts | undefined {
    const groups = pattern.exec(collapse(lexical))?.groups

    if (groups === undefined) {
        return undefined
    }

    return {
        year: Number(groups["year"]) + 0,
        month: Number(groups["month"]),
        day: Number(groups["day"]),
        hour: Number(groups["hour"] ?? 0),
        minute: Number(groups["minute"] ?? 0),
        second: Number(groups["second"] ?? 0),
        fraction: groups["fraction"] ?? "",
        timezone: groups["timezone"],
    }
}

function isLeapYear(year: number): boolean {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year: number, month: number): number {
    if (month === 2) {
        return isLeapYear(year) ? 29 : 28
    }

    return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function isValidDate({year, month, day}: DateParts): boolean {
    return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
}

function isValidTime({hour, minute, second, fraction}: DateParts): boolean {
    const isEndOfDay = hour === 24 && minute === 0 && second === 0 && /^0*$/.test(fraction)

    return minute <= 59 && second <= 59 && (hour <= 23 || isEndOfDay)
}

function isValidTimezone(timezone: string | undefined): boolean {
    if (timezone === undefined || timezone === "Z") {
        return true
    }

    const hours = Number(timezone.slice(1, 3))
    const minutes = Number(timezone.slice(4, 6))

    return minutes <= 59 && (hours < 14 || (hours === 14 && minutes === 0))
}

function isoYear(year: number): string {
    if (year >= 0 && year <= 9999) {
        return year.toString().padStart(4, "0")
    }

    return (year < 0 ? "-" : "+") + Math.abs(year).toString().padStart(6, "0")
}

function pad(value: number): string {
    return value.toString().padStart(2, "0")
}

function buildDate({year, month, day, hour, minute, second, fraction, timezone}: DateParts, hasTime: boolean): Date | undefined {
    const rollover = hour === 24
    const date = `${isoYear(year)}-${pad(month)}-${pad(day)}`
    const time = `${pad(rollover ? 0 : hour)}:${pad(minute)}:${pad(second)}.${fraction.padEnd(3, "0").slice(0, 3)}`
    const iso = !hasTime && timezone === undefined ? date : `${date}T${time}${timezone ?? ""}`

    const result = new Date(iso)

    if (rollover) {
        result.setTime(result.getTime() + millisecondsPerDay)
    }

    return Number.isNaN(result.getTime()) ? undefined : result
}
