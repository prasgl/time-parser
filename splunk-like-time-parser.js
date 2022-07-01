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
            // console.log(`copy = ${copy}`);
            throw new Error(`invalid offset unit`);
        }

        set.push({offsetPeriod, offsetUnit});
    }
    return set;
}

exports.parse = (expr) => {
    if (typeof expr !== 'string') {
        throw new TypeError("parse: A single argument is expected and should be a string");
    }
    
    const expression = expr.replace(/\s/g, '');

    const modifier = modifiers.find(m => expression.startsWith(m));

    if (!modifier) {
        throw new Error(`parse: the argument must start with ${modifiers}`);
    }
    
    let snapUnit;
    const snapPosition = expression.indexOf(snap); // TODO last index of?
    if (snapPosition !== -1) {
        const unit = expression.substring(snapPosition + 1);
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
    const offsetsArray = getOffsets(offsets);

    // console.log(`${expression}: ${JSON.stringify(offsetsArray)}`);

    let baseDate = new Date();
    const baseDateParams = {
        y: baseDate.getUTCFullYear(),
        mon: baseDate.getUTCMonth(),
        d: baseDate.getUTCDate(),
        h: baseDate.getUTCHours(),
        m: baseDate.getUTCMinutes(),
        s: baseDate.getUTCSeconds(),
        ms: baseDate.getUTCMilliseconds()
    }
    // console.log(`original baseDateParams = ${JSON.stringify(baseDateParams)}`);
    // offsetPeriod, offsetUnit smhd mon y
    offsetsArray.forEach(offset => {
        // console.log(`offset = ${JSON.stringify(offset)}`);
        switch(offset.offsetUnit){
            case "s":
                baseDateParams.s += offset.offsetPeriod;
                break;
            case "m":
                baseDateParams.m += offset.offsetPeriod;
                break;
            case "h":
                baseDateParams.h += offset.offsetPeriod;
                break;
            case "d":
                baseDateParams.d += offset.offsetPeriod;
                break;
            case "mon":
                baseDateParams.mon += offset.offsetPeriod;
                break;
            case "y":
                baseDateParams.y += offset.offsetPeriod;
                break;
            default:
                break;
        }
        // console.log(`updated baseDateParams = ${JSON.stringify(baseDateParams)}`);
        baseDate = new Date(Date.UTC(
            baseDateParams.y, 
            baseDateParams.mon, 
            baseDateParams.d, 
            baseDateParams.h, 
            baseDateParams.m, 
            baseDateParams.s, 
            baseDateParams.ms));
        // console.log(`returning ${baseDate.valueOf()}`);
    })

    if (snapUnit) {
        const baseDateParams = {
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
                baseDateParams.mon = 0;
            case "mon":
                baseDateParams.d = 1;
            case "d":
                baseDateParams.h = 0;
            case "h":
                baseDateParams.m = 0;
            case "m":
                baseDateParams.s = 0;
            case "s":
                baseDateParams.ms = 0;
            default:
                break;
        }
        console.log(`baseDateParams = ${JSON.stringify(baseDateParams)}`)
        baseDate = new Date(Date.UTC(
            baseDateParams.y, 
            baseDateParams.mon, 
            baseDateParams.d, 
            baseDateParams.h, 
            baseDateParams.m, 
            baseDateParams.s, 
            baseDateParams.ms));
    }
    return baseDate.valueOf();
}