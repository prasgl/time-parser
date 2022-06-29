const expect = require('chai').expect;

const main = require('../splunk-like-time-parser');

describe('Splunk-like Time Parser', () => {
    it('parse requires a string argument and returns a (date) object', () => {
        var argsTest = main.parse;
        // invoke without args
        expect(argsTest).to.throw(Error);

        // invoke with non-string arg type
        expect(() => argsTest(123)).to.throw(Error);

        // if the arg is a string, no error should be thrown
        expect(() => argsTest('test')).to.not.throw(Error);

        // it should return an object 
        expect(argsTest('test')).to.be.an('object');
    });
});