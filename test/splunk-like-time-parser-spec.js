const sinon = require('sinon');
const expect = require('chai').expect;

const main = require('../splunk-like-time-parser');

describe('Splunk-like Time Parser', () => {
    it('parse requires a string argument and returns a (date) object', () => {
        // if the arg is a string, no TypeError should be thrown
        expect(main.parse).to.throw(TypeError); // no arg specified
        expect(() => main.parse(123)).to.throw(TypeError); // incorrect arg type
        expect(() => main.parse('test')).to.not.throw(TypeError);

        // argument should start with modifier
        expect(() => main.parse('test')).to.throw(Error);
        expect(() => main.parse('now()')).to.not.throw(Error);

        // any spaces embedded in the argument should be ignored
        expect(() => main.parse('now ( ) + 1 d @ mon')).to.not.throw(Error);

        // if snap (@) is specified, it should be with snap-unit and at the end of the argument
        expect(() => main.parse('now()@+1m')).to.throw(Error);
        expect(() => main.parse('now()@')).to.throw(Error);
        expect(() => main.parse('now()@x')).to.throw(Error);
        expect(() => main.parse('now()@mon')).to.not.throw(Error);

        // offset/s if specified, should start with an operator (+ or -)
        expect(() => main.parse('now()1m')).to.throw(Error);
        expect(() => main.parse('now()+1m')).to.not.throw(Error);
        expect(() => main.parse('now()-1m')).to.not.throw(Error);

        // offset should contain numeric period after operator
        expect(() => main.parse('now()+xm')).to.throw(Error);
        expect(() => main.parse('now()+5mon')).to.not.throw(Error);

        // offset should support periods s, m, h, d, mon, y
        expect(() => main.parse('now()+5s')).to.not.throw(Error);
        expect(() => main.parse('now()+5m')).to.not.throw(Error);
        expect(() => main.parse('now()+5h')).to.not.throw(Error);
        expect(() => main.parse('now()+5d')).to.not.throw(Error);
        expect(() => main.parse('now()+5mon')).to.not.throw(Error);
        expect(() => main.parse('now()+5y')).to.not.throw(Error);
        expect(() => main.parse('now()+5z')).to.throw(Error);

        // snap and offset specified, should not throw error
        expect(() => main.parse('now()+5y@m')).to.not.throw(Error);

        // 'now()' should return current date
        let expected = Date.now();
        let actual = main.parse('now()');
        expect(expected).to.equal(actual);

        const clock = sinon.useFakeTimers(new Date(Date.UTC(2022, 5, 30, 1, 2, 3, 4)));

        // 'now()+61s' should return time after 61 sec 
        expected = Date.now() + (1000 * 61);
        actual = main.parse('now()+61s');
        expect(expected).to.equal(actual);

        // 'now()+1s+1m' should return time after 61 sec 
        actual = main.parse('now()+1s+1m');
        expect(expected).to.equal(actual);

        // 'now()@s' should return current time rounded to seconds 
        expected = new Date(Date.UTC(2022, 5, 30, 1, 2, 3, 0)).valueOf();
        actual = main.parse('now()@s');
        expect(expected).to.equal(actual);

        // 'now()@m' should return current time rounded to min
        expected = new Date(Date.UTC(2022, 5, 30, 1, 2, 0, 0)).valueOf();
        actual = main.parse('now()@m');
        expect(expected).to.equal(actual);
 
        // 'now()@h' should return current time rounded to hours 
        expected = new Date(Date.UTC(2022, 5, 30, 1, 0, 0, 0)).valueOf();
        actual = main.parse('now()@h');
        expect(expected).to.equal(actual);

        clock.restore();
    });
});