const expect = require('chai').expect;

const main = require('../splunk-like-time-parser');

describe('Splunk-like Time Parser', () => {
    it('parse requires a string argument and returns a (date) object', () => {
        var argsTest = main.parse;

        // if the arg is a string, no TypeError should be thrown
        expect(argsTest).to.throw(TypeError); // no arg specified
        expect(() => argsTest(123)).to.throw(TypeError); // incorrect arg type
        expect(() => argsTest('test')).to.not.throw(TypeError);

        // argument should start with modifier
        expect(() => argsTest('test')).to.throw(Error);
        expect(() => argsTest('now()')).to.not.throw(Error);

        // any spaces embedded in the argument should be ignored
        expect(() => argsTest('now ( ) + 1 d @ mon')).to.not.throw(Error);

        // if snap (@) is specified, it should be with snap-unit and at the end of the argument
        expect(() => argsTest('now()@+1m')).to.throw(Error);
        expect(() => argsTest('now()@')).to.throw(Error);
        expect(() => argsTest('now()@x')).to.throw(Error);
        expect(() => argsTest('now()@mon')).to.not.throw(Error);

        // offset/s if specified, should start with an operator (+ or -)
        expect(() => argsTest('now()1m')).to.throw(Error);
        expect(() => argsTest('now()+1m')).to.not.throw(Error);
        expect(() => argsTest('now()-1m')).to.not.throw(Error);

        // offset should contain numeric period after operator
        expect(() => argsTest('now()+xm')).to.throw(Error);
        expect(() => argsTest('now()+5mon')).to.not.throw(Error);

        // offset should support periods s, m, h, d, mon, y
        expect(() => argsTest('now()+5s')).to.not.throw(Error);
        expect(() => argsTest('now()+5m')).to.not.throw(Error);
        expect(() => argsTest('now()+5h')).to.not.throw(Error);
        expect(() => argsTest('now()+5d')).to.not.throw(Error);
        expect(() => argsTest('now()+5mon')).to.not.throw(Error);
        expect(() => argsTest('now()+5y')).to.not.throw(Error);
        expect(() => argsTest('now()+5z')).to.throw(Error);

        // snap and offset specified, should not throw error
        expect(() => argsTest('now()+5y@m')).to.not.throw(Error);
    });
});