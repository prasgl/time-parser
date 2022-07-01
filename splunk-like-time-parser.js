const modifiers = ['now()'];
const snap = '@';
const snapUnits = [
    's',
    'm',
    'h',
    'd',
    'mon',
    'y'
];
const operators = ['+', '-'];

/**
 * Validate input and return object containing 
 *  - modifier ('now()'), 
 *  - offsets (like +1mon-5d) and
 *  - snap unit (s, m, h, d, mon, y)
 * Throws error if input is not valid
 * @param {*} expr 
 * @returns 
 */
const validateInput = (expr) => {
    if (typeof expr !== 'string') {
        throw new TypeError("parse: A single argument is expected and should be a string");
    }

    const expression = expr.replace(/\s/g, '');

    const modifier = modifiers.find(m => expression.startsWith(m));
    if (!modifier) {
        throw new Error(`parse: the argument must start with ${modifiers}`);
    }

    let snapUnit;
    const snapPosition = expression.indexOf(snap);
    if (snapPosition !== -1) {
        const unit = expression.substring(snapPosition + 1); // because snap should be specified at the end
        snapUnit = snapUnits.find(u => u === unit);

        if (!snapUnit) {
            throw new Error(`parse: Can only snap to ${snapUnits}`);
        }

        if (snapUnit && !expression.endsWith(`${snap}${snapUnit}`)) {
            throw new Error(`parse: the argument must end with ${snap} and unit if specified`);
        }
    }

    let offsets = expression.substring(modifier.length);
    if (snapUnit) {
        offsets = offsets.substring(0, offsets.length - `${snap}${snapUnit}`.length);
    }

    return { modifier, snapUnit, offsets };
}

/**
 * Return array of objects containing offset data, for example, if `offsets` was +1mon-5d,
 * the returned array would be [{offsetPeriod: mon, offsetUnit: 1}, {offsetPeriod: d, offsetUnit: -5}] 
 * If offsets was not specified, the returned array will be empty
 * @param {*} offsets 
 * @returns 
 */
const getOffsets = (offsets) => {
    const set = [];
    let copy = offsets;
    while (copy) {
        let operator, offsetPeriod, offsetUnit;
        operator = operators.find(o => copy.substring(0, o.length) === o);
        if (operator) {
            copy = copy.substring(operator.length);
        } else {
            throw new Error(`invalid operator ${copy[0 - o.length]}`);
        }

        const period = copy.match(/^\d+/);
        if (period) {
            offsetPeriod = Number(`${operator}${period[0]}`);
            copy = copy.substring(period[0].length);
        } else {
            throw new Error(`invalid offset period`);
        }

        const unit = copy.match(/^mon|^[smhdy]/);
        if (unit) {
            offsetUnit = unit[0];
            copy = copy.substring(offsetUnit.length);
        } else {
            throw new Error(`invalid offset unit`);
        }

        set.push({ offsetPeriod, offsetUnit });
    }
    return set;
}

const snapDate = (baseDate, snapUnit) => {
    const baseDateParts = {
        y: baseDate.getUTCFullYear(),
        mon: baseDate.getUTCMonth(),
        d: baseDate.getUTCDate(),
        h: baseDate.getUTCHours(),
        m: baseDate.getUTCMinutes(),
        s: baseDate.getUTCSeconds(),
        ms: baseDate.getUTCMilliseconds()
    }
    switch (snapUnit) {
        case "y":
            baseDateParts.mon = 0;
        case "mon":
            baseDateParts.d = 1;
        case "d":
            baseDateParts.h = 0;
        case "h":
            baseDateParts.m = 0;
        case "m":
            baseDateParts.s = 0;
        case "s":
            baseDateParts.ms = 0;
        default:
            break;
    }

    baseDate = new Date(Date.UTC(
        baseDateParts.y,
        baseDateParts.mon,
        baseDateParts.d,
        baseDateParts.h,
        baseDateParts.m,
        baseDateParts.s,
        baseDateParts.ms));

    return baseDate;
}

exports.parse = (expr) => {
    const { modifier, snapUnit, offsets } = validateInput(expr);

    const offsetsArray = getOffsets(offsets);

    // The base value for subsequent date parts manipulation
    let baseDate;
    if (modifier === 'now()')
        baseDate = new Date();

    // get the year, month etc of the baseDate so as to add/reduce the offset 
    const baseDateParts = {
        y: baseDate.getUTCFullYear(),
        mon: baseDate.getUTCMonth(),
        d: baseDate.getUTCDate(),
        h: baseDate.getUTCHours(),
        m: baseDate.getUTCMinutes(),
        s: baseDate.getUTCSeconds(),
        ms: baseDate.getUTCMilliseconds()
    }

    offsetsArray.forEach(offset => {
        baseDateParts[offset.offsetUnit] += offset.offsetPeriod;

        // update the base date before using it further
        baseDate = new Date(Date.UTC(
            baseDateParts.y,
            baseDateParts.mon,
            baseDateParts.d,
            baseDateParts.h,
            baseDateParts.m,
            baseDateParts.s,
            baseDateParts.ms));
    })

    if (snapUnit) {
        baseDate = snapDate(baseDate, snapUnit);
    }
    return baseDate;
}