# psa.lib.charts

This Angular library provides components and interfaces for displaying charts in Angular applications using [Chart.js](https://www.chartjs.org/).
In addition, it provides specialized components and services for displaying feedback statistics.

## Build

Run `npm run build` to build the library. The build artifacts will be stored in the `dist/` directory.

## Development

Run `npm run watch` to build the library on changes. As the library is symlinked, the changes will be available in all PIA applications you are watching, too.

> Please keep in mind, `npm run watch` will overwrite the artifacts in `dist/` with a development version. Because we commit the artifact, ensure you do not commit the development artifact `watch` creates. Always run `npm run build` before committing.

## Start demo and in-library development

Run `npm run demo` to start a demo application and directly develop in the library.
