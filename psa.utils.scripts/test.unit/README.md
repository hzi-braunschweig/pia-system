# Setup hook

This is a setup hook for mocha that can be used for unit tests.
When used on the developer machine, it creates **weak** secrets that can be used for testing.

## How to use

`mocha --require '../psa.utils.scripts/test.unit/setup.hook.js' ...`
