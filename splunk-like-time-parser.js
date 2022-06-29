exports.parse = (expr) => {
    if (typeof expr !== 'string') {
        throw new Error("parse: A single argument is expected and should be a string");
    }
    return {};
}

