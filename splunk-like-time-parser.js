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
 * the returned array would be [{offsetPeriod: "mon", offsetUnit: 1}, {offsetPeriod: "d", offsetUnit: -5}] 
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

/**
 * Round down the date to the specified part
 * @param {*} baseDate 
 * @param {*} snapUnit 
 * @returns 
 */
const snapDate = (baseDate, snapUnit) => {
    switch (snapUnit) {
        case "y":
            baseDate.setUTCMonth(0);
        case "mon":
            baseDate.setUTCDate(1);
        case "d":
            baseDate.setUTCHours(0);
        case "h":
            baseDate.setUTCMinutes(0);
        case "m":
            baseDate.setUTCSeconds(0);
        case "s":
            baseDate.setUTCMilliseconds(0);
        default:
            break;
    }
    return baseDate;
}

/**
 * Update the date as per the offsets
 * @param {*} baseDate The date to be updated
 * @param {*} offsets the updates to be applied
 * @returns the updated date
 */

const manipulateDate = (baseDate, offsets) => {
    const copy = baseDate;
    offsets.forEach(offset => {
        switch (offset.offsetUnit) {
            case "y":
                copy.setUTCFullYear(copy.getUTCFullYear() + offset.offsetPeriod);
                break;
            case "mon":
                copy.setUTCMonth(copy.getUTCMonth() + offset.offsetPeriod);
                break;
            case "d":
                copy.setUTCDate(copy.getUTCDate() + offset.offsetPeriod);
                break;
            case "h":
                copy.setUTCHours(copy.getUTCHours() + offset.offsetPeriod);
                break;
            case "m":
                copy.setUTCMinutes(copy.getUTCMinutes() + offset.offsetPeriod);
                break;
            case "s":
                copy.setUTCSeconds(copy.getUTCSeconds() + offset.offsetPeriod);
                break;
        }
    });
    return copy;
}

/**
 * Splunk-like-time-parser. Parses the input string and returns appropriate date object.
 * Can specify the modifier, offsets and snap instructions.
 * @param {*} expr the string to parse. Looks like 'now()+5d-13h@m', where "now()" is the 
 * modifier, "+5d-13h" is offset and "@m" is the snap instruction
 * @returns Updated date object
 */
exports.parse = (expr) => {
    const { modifier, snapUnit, offsets } = validateInput(expr);

    const offsetsArray = getOffsets(offsets);

    // The base value for subsequent date parts manipulation
    let baseDate;

    // currently the parser is implemented only for "now()", but
    // it may support other modifiers in the future
    if (modifier === 'now()')
        baseDate = new Date();

    baseDate = manipulateDate(baseDate, offsetsArray);

    if (snapUnit) {
        baseDate = snapDate(baseDate, snapUnit);
    }

    return baseDate;
}