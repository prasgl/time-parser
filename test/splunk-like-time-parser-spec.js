const sinon = require('sinon');
const chai = require('chai');
const asserttype = require('chai-asserttype');

const expect = require('chai').expect;
chai.use(asserttype);

const main = require('../splunk-like-time-parser');

const modifiers = ['now()'];
const snapUnits = ['s', 'm', 'h', 'd', 'mon', 'y'];
const operators = ['+', '-'];

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
        // argument should start with modifier
        expect(() => main.parse('test')).to.throw(Error);
        for (i = 0; i < modifiers.length; i++) {
            expect(() => main.parse(modifiers[i])).to.not.throw(Error);
        }

        // any spaces embedded in the argument should be ignored
        expect(() => main.parse('now ( ) + 1 d @ mon')).to.not.throw(Error);

        // if snap (@) is specified, it should be with snap-unit and at the end of the argument
        expect(() => main.parse('now()@+1m'), 'snap in the middle').to.throw(Error);
        expect(() => main.parse('now()@'), 'no snap unit').to.throw(Error);
        expect(() => main.parse('now()@x'), 'invalid snap unit').to.throw(Error);

        // test for all modifiers and for all valid snapUnits
        for (i = 0; i < modifiers.length; i++) {
            for (j = 0; j < snapUnits.length; j++) {
                expect(() => main.parse(`${modifiers[i]}@${snapUnits[j]}`),
                    `${modifiers[i]}@${snapUnits[j]} is invalid?`).to.not.throw(Error);
            }
        }

        // offset/s if specified, should start with an operator (+ or -)
        expect(() => main.parse('now()1m'), 'offset operator missing').to.throw(Error);
        expect(() => main.parse('now()x1m'), 'invalid offset operator').to.throw(Error);
        for (i = 0; i < modifiers.length; i++) {
            for (j = 0; j < snapUnits.length; j++) {
                for (k = 0; k < operators.length; k++) {
                    expect(() => main.parse(`${modifiers[i]}${operators[k]}1${snapUnits[j]}`),
                        `${modifiers[i]}${operators[k]}1${snapUnits[j]} is incorrect?`).to.not.throw(Error);
                }
            }
        }

        // offset should contain numeric period after operator
        expect(() => main.parse('now()+xm'), 'invalid offset period').to.throw(Error);

        // snap and offset specified, should not throw error
        for (i = 0; i < modifiers.length; i++) {
            for (j = 0; j < snapUnits.length; j++) {
                for (k = 0; k < operators.length; k++) {
                    for (l = 0; l < snapUnits.length; l++) {
                        expect(() => main.parse(`${modifiers[i]}${operators[k]}1${snapUnits[j]}@${snapUnits[l]}`),
                            `${modifiers[i]}${operators[k]}1${snapUnits[j]}@${snapUnits[l]} is incorrect?`).to.not.throw(Error);
                    }
                }
            }
        }
    });

    it('parse: offsets arithmetic', () => {
        const clock = sinon.useFakeTimers(new Date(Date.UTC(2022, 5, 30, 1, 2, 3, 4))); // 30 Jun 2022 01:02:03.004

        // 'now()' should return current date
        let expected = new Date();
        let actual = main.parse('now()');
        expect(expected).to.deep.equal(actual);

        // 'now()+1s+1m' should return time after 61 sec 
        expected = new Date(Date.now() + (1000 * 61));
        actual = main.parse('now()+1s+1m');
        expect(expected).to.deep.equal(actual);

        // 'now()+61s' should return time after 61 sec 
        expected = new Date(Date.now() + (1000 * 61));
        actual = main.parse('now()+61s');
        expect(expected).to.deep.equal(actual);

        const add = { s: 1 * 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
        for (i = 0; i < modifiers.length; i++) {
            for (j = 0; j < snapUnits.length - 2; j++) {
                for (k = 0; k < operators.length; k++) {
                    // add 5 units (5 sec / 5 min / 5 hrs / 5 days, we are not testing mon & year for now)
                    expected = new Date(Date.now() + (5 * (operators[k] === '-' ? -1 * add[snapUnits[j]] : add[snapUnits[j]])));

                    actual = main.parse(`${modifiers[i]}${operators[k]}5${snapUnits[j]}`)
                    // console.log(`${expected.toUTCString()} | ${actual.toUTCString()}`);
                    expect(expected, `${modifiers[i]}${operators[k]}5${snapUnits[j]} ${expected - actual}`).to.deep.equal(actual);
                }
            }
        }
        clock.restore();
    });

    it('parse: snap', () => {
        const clock = sinon.useFakeTimers(new Date(Date.UTC(2022, 0, 30, 1, 2, 3, 4)));

        // '@s' should return current time rounded to seconds 
        var expected = new Date(Date.UTC(2022, 0, 30, 1, 2, 3, 0));
        var actual = main.parse('now()@s');
        expect(expected).to.deep.equal(actual);

        // '@m' should return current time rounded to min
        expected = new Date(Date.UTC(2022, 0, 30, 1, 2, 0, 0));
        actual = main.parse('now()@m');
        expect(expected).to.deep.equal(actual);

        // '@h' should return current time rounded to hours 
        expected = new Date(Date.UTC(2022, 0, 30, 1, 0, 0, 0));
        actual = main.parse('now()@h');
        expect(expected).to.deep.equal(actual);

        // '@d' should return current time rounded to days 
        expected = new Date(Date.UTC(2022, 0, 30, 0, 0, 0, 0));
        actual = main.parse('now()@d');
        expect(expected).to.deep.equal(actual);

        // '@mon' should return current time rounded to months 
        expected = new Date(Date.UTC(2022, 0, 1, 0, 0, 0, 0));
        actual = main.parse('now()@mon');
        expect(expected).to.deep.equal(actual);

        // '@y' should return current time rounded to years 
        expected = new Date(Date.UTC(2022, 0, 1, 0, 0, 0, 0));
        actual = main.parse('now()@y');
        expect(expected).to.deep.equal(actual);

        clock.restore();
    });
});