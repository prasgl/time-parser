# splunk format time-parser

This library tries to emulate splunk format time-parser.

Splunk uses a special format for "relative time modifiers" which allows you to take a time and modify it. The format looks like this:
```
now()-1d@d
```

`now()` is the *modifier* and indicates the current date-time (currently only `now()` is supported).

`-1d` specifies the *offset* to the modifier and could support negative (like the one shown here) or positive offset specified as seconds (`s`), minutes (`m`), hours (`h`), days (`d`), months (`mon`) and years (`y`).

`@d` specifies *snap* which indicates rounding down to the specified time-unit (same units as mentioned for offset are supported).


**Examples**

Using a date and time of 2022-01-08T09:00:00Z:

|String | Date | Description|
|-------|------|------------|
|`now()+1d` | 2022-01-09T09:00:00.00Z | Now plus 1 day|
|`now()-1d` | 2022-01-07T09:00:00.00Z | Now minus 1 day|
|`now()@d` | 2022-01-08T00:00:00.00Z | Now snapped to day|
|`now()-1y@mon` | 2021-01-01T00:00:00.00Z | Now minus on year snapped to month|
|`now()+10d+12h` | 2022-01-18T21:00:00.00Z | Now plus 10 days and 12 hour|


## Usage
```
const parser = require('./splunk-like-time-parser');
const parsedDate = parser.parse('now()+1d'); // parsedDate would be 2022-01-09T09:00:00.00Z
```

To run tests, 
```
npm run test
```

All dates and times are treated as UTC.

