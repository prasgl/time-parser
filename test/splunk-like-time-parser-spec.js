const sinon = require('sinon');
const chai = require('chai');
const asserttype = require('chai-asserttype');

const expect = require('chai').expect;
chai.use(asserttype);

const main = require('../splunk-like-time-parser');

const modifiers = ['now()'];

describe('Splunk-like Time Parser', () => {
    it('parse: input & output', () => {
        // if the arg is a string, no TypeError should be thrown
        expect(main.parse).to.throw(TypeError);
        expect(() => main.parse(123)).to.throw(TypeError);
        expect(() => main.parse('test')).to.not.throw(TypeError);

        // parse should return a date object
        for (i = 0; i < modifiers.length; i++) {
            expect(main.parse(modifiers[i])).to.be.date();
        }
    });

    it('parse: input format validations', () => {
        expect(() => main.parse('test'), 'argument should start with modifier').to.throw(Error);

        expect(() => main.parse('now ( ) + 1 d @ mon'), 'ignore spaces').to.not.throw(Error);

        expect(() => main.parse('now()@+1m'), 'snap in the middle').to.throw(Error);
        expect(() => main.parse('now()@'), 'no snap unit').to.throw(Error);
        expect(() => main.parse('now()@x'), 'invalid snap unit').to.throw(Error);

        expect(() => main.parse('now()1m'), 'offset operator missing').to.throw(Error);
        expect(() => main.parse('now()x1m'), 'invalid offset operator').to.throw(Error);

        expect(() => main.parse('now()+xm'), 'invalid offset period').to.throw(Error);
    });

    it('parse: offsets arithmetic and snap', () => {
        /*
            Sample tests
            now()+1d	    2022-01-09T09:00:00.00Z 	Now plus1 day 
            now()-1d 	    2022-01-07T09:00:00.00Z 	Now minus 1 day
            now()@d 	    2022-01-08T00:00:00.00Z 	Now snapped to day 
            now()-1y@mon	2021-01-01T00:00:00.00Z 	Now minus on year snapped to month 
            now()+10d+12h	2022-01-18T21:00:00.00Z 	Now plus 10 days and 12 hour
        */

        const clock = sinon.useFakeTimers(new Date(Date.UTC(2022, 0, 8, 9, 0, 0, 0))); // 2022-01-08T09:00:00Z

        // 'now()+10d+12h' should return time after 10 and a half days 
        const expected10d12h = new Date(Date.UTC(2022, 0, 18, 21, 0, 0, 0));
        const actual10d12h = main.parse('now()+10d+12h');
        console.log('now()+10d+12h', expected10d12h.toUTCString(), actual10d12h.toUTCString());
        expect(expected10d12h, `expected: ${expected10d12h.toUTCString()}, actual: now()+10d+12h`).to.deep.equal(actual10d12h);

        const modifiers = ['now()'];
        const operators = ['+', '-'];
        const offsetUnits = ['', 's', 'm', 'h', 'd', 'mon', 'y'];
        const snapUnits = ['', '@s', '@m', '@h', '@d', '@mon', '@y'];

        for (i = 0; i < modifiers.length; i++) {
            for (j = 0; j < operators.length; j++) {
                for (k = 0; k < offsetUnits.length; k++) {
                    for (l = 0; l < snapUnits.length; l++) {

                        // format the input string for the parser
                        const expr = offsetUnits[k] === '' 
                            ? `${modifiers[i]}${snapUnits[l]}` 
                            : `${modifiers[i]}${operators[j]}1${offsetUnits[k]}${snapUnits[l]}`;

                        // set the expected date
                        let expected = new Date();

                        switch (offsetUnits[k]) {
                            case 'y':
                                expected.setUTCFullYear(operators[j] === '-' ? expected.getUTCFullYear() - 1 : expected.getUTCFullYear() + 1);
                                break;
                            case 'mon':
                                expected.setUTCMonth(operators[j] === '-' ? expected.getUTCMonth() - 1 : expected.getUTCMonth() + 1);
                                break;
                            case 'd':
                                expected.setUTCDate(operators[j] === '-' ? expected.getUTCDate() - 1 : expected.getUTCDate() + 1);
                                break;
                            case 'h':
                                expected.setUTCHours(operators[j] === '-' ? expected.getUTCHours() - 1 : expected.getUTCHours() + 1);
                                break;
                            case 'm':
                                expected.setUTCMinutes(operators[j] === '-' ? expected.getUTCMinutes() - 1 : expected.getUTCMinutes() + 1);
                                break;
                            case 's':
                                expected.setUTCSeconds(operators[j] === '-' ? expected.getUTCSeconds() - 1 : expected.getUTCSeconds() + 1);
                                break;
                            default:
                                break;
                        }

                        switch (snapUnits[l]) {
                            case "@y":
                                expected.setUTCMonth(0);
                            case "@mon":
                                expected.setUTCDate(1);
                            case "@d":
                                expected.setUTCHours(0);
                            case "@h":
                                expected.setUTCMinutes(0);
                            case "@m":
                                expected.setUTCSeconds(0);
                            case "@s":
                                expected.setUTCMilliseconds(0);
                            default:
                                break;
                        }
                        const actual = main.parse(expr);
                        console.log(expr, expected.toUTCString(), actual.toUTCString());
                        expect(expected, `expected: ${expected.toUTCString()}, actual: ${actual.toUTCString()} (${expr})`).to.deep.equal(actual);
                        }
                    }
                }
            }
        clock.restore();
    });
});