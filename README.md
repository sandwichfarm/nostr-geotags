# `nostr-geotags`

![](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/publish.yaml/badge.svg)
+ [![cov](https://<you>.github.io/<repo>/badges/coverage.svg)](https://github.com/<you>/<repo>/actions)


## Summary
`nostr-geotags` is a modern ESM-only package for generating nostr geo tags (`['g', ...]`) based on various inputs like latitude, longitude, city, country, etc. It uses `iso-3166` and `ngeohash` to generate geodata. 

## Installation
The package is available on npm and can be installed using npm, yarn, or pnpm.

```
npm install ngeotags

yarn add ngeotags

pnpm add ngeotags
```

## Usage
First, import `ngeotags` in your project:

```
import ngeotags from 'ngeotags';
```

Then, use it to generate tags:

```
const tags = ngeotags(inputData, options);
```

## Input Reference
The `inputData` object can contain:

- lat (number): Latitude
- lon (number): Longitude
- city (string)
- country (string)
- regionName (string)
- countryCode (string)
- continent (string)
- continentCode (string)
- Any other key-value pairs

## Input Reference
The `inputData` object can contain the following properties, used to generate geo-tags:

- `lat` (number): Latitude coordinate. No default value.
- `lon` (number): Longitude coordinate. No default value.
- `city` (string): Name of the city. No default value.
- `country` (string): Name of the country. No default value.
- `regionName` (string): Name of the region or state. No default value.
- `countryCode` (string): ISO country code, typically alpha-2 format. No default value.
- `continent` (string): Name of the continent. No default value.
- `continentCode` (string): Code representing the continent. No default value.
- Other properties (any): You can include additional key-value pairs as needed.

## Options Reference
The `options` object specifies which types of tags to generate. Each option defaults to `false` unless specified:

- `iso31661` (boolean): Generate ISO 3166-1 tags. Default: `false`.
- `iso31662` (boolean): Generate ISO 3166-2 tags. Default: `false`.
- `iso31663` (boolean): Generate ISO 3166-3 tags. Default: `false`.
- `planet` (boolean): Include a tag for the planet (Earth by default). Default: `false`.
- `geohash` (boolean): Generate a Geohash code based on latitude and longitude. Default: `false`.
- `gps` (boolean): Include latitude and longitude as a 'gps' tag. Default: `false`.
- `city` (boolean): Include a tag for the city. Default: `false`.
- `country` (boolean): Include a tag for the country. Default: `false`.
- `region` (boolean): Include a tag for the region. Default: `false`.
- `continent` (boolean): Include a tag for the continent. Default: `false`.
- `continentCode` (boolean): Include a tag for the continent code. Default: `false`.

## Example Response

This is a response with all options enabled. 

```
[
  [ 'g', '47.5636,19.0947', 'gps' ],
  [ 'g', 'u2mwdd8q4', 'geohash' ],
  [ 'g', 'u2mwdd8q', 'geohash' ],
  [ 'g', 'u2mwdd8', 'geohash' ],
  [ 'g', 'u2mwdd', 'geohash' ],
  [ 'g', 'u2mwd', 'geohash' ],
  [ 'g', 'u2mw', 'geohash' ],
  [ 'g', 'u2m', 'geohash' ],
  [ 'g', 'u2', 'geohash' ],
  [ 'g', 'u', 'geohash' ],
  [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
  [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
  [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
  [ 'g', 'Hungary', 'countryCode', 'ISO-3166-1:name' ],
  [ 'g', 'HU', 'countryCode', 'ISO-3166-3:alpha2' ],
  [ 'g', 'HUN', 'countryCode', 'ISO-3166-3:alpha3' ],
  [ 'g', '348', 'countryCode', 'ISO-3166-3:numeric' ],
  [ 'g', 'Hungary', 'countryCode', 'ISO-3166-3:name' ],
  [ 'g', 'Budapest', 'city' ],
  [ 'g', 'Europe', 'continent' ],
  [ 'g', 'EU', 'continentCode' ],
  [ 'g', 'Earth', 'planet' ]
]
```

## Example
Here's a basic usage example:

```
const inputData = {
  lat: 52.5200,
  lon: 13.4050,
  city: 'Berlin',
  countryCode: 'DE'
};

const options = {
  geohash: true,
  gps: true,
  city: true,
  iso31661: true
};

const tags = ngeotags(inputData, options);
console.log(tags);
```

## Development
To build the package, run:

```
npm run build
```

To run tests:

```
npm test
```

## Credits
This package was developed by [Your Name] with assistance from your helper monkey.
