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
            offsetPeriod = period[0];
            copy = copy.substring(offsetPeriod.length);
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

        set.push({operator, offsetPeriod, offsetUnit});
    }
    return {set}
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

    return new Date();
}

