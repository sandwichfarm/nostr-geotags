# `nostr-geotags`

[![publish](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/publish.yaml/badge.svg)](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/publish.yaml) [![cov](https://sandwichfarm.github.io/nostr-geotags/badges/coverage.svg)](https://github.com/sandwichfarm/nostr-geotags/actions)


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
The `options` object specifies which types of tags to generate. 

- `gps` (boolean): Include latitude and longitude as a 'gps' tag. Default: `true`.
- `geohash` (boolean): Generate a Geohash code based on latitude and longitude. Default: `true`.
- `city` (boolean): Include a tag for the city. Default: `true`.
- `country` (boolean): Include a tag for the country. Default: `true`.
- `region` (boolean): Include a tag for the region. Default:`true`.
- `continent` (boolean): Include a tag for the continent. Default: `false`.
- `continentCode` (boolean): Include a tag for the continent code. Default: `true`.
- `planet` (boolean): Include a tag for the planet (Earth by default). Default: `false`.
- `iso31661` (boolean): Generate ISO 3166-1 tags. Default: `false`.
- `iso31662` (boolean): Generate ISO 3166-2 tags. Default: `true`.
- `iso31663` (boolean): Generate ISO 3166-3 tags. Default: `false`.

## Response Reference
The function returns an array of tuples, where each tuple represents a tag and its associated data. The format of the tuples is as follows:

- The first element (`'g'`) is a constant indicating the type of tag.
- The second element is the value of the tag, which can vary based on the input and options used.
- The third element is the category of the tag.
- The fourth element (optional) provides additional information or context about the tag.

### Tag Types and Their Descriptions
1. **GPS**: `[ 'g', '<latitude,longitude>', 'gps' ]`
   - This is a passthrough from the input latitude and longitude. It represents the GPS coordinates.
   
2. **Geohash**: `[ 'g', '<geohash>', 'geohash' ]`
   - Geohashes of varying lengths derived from the input latitude and longitude. These are not passthrough; they are computed using the `ngeohash` library.

3. **ISO-3166-1 Codes**: 
   - These tags represent country information derived from the `iso-3166` library and are based on the provided country code. They are not passthrough.
   - Examples: 
     - Alpha-2 code: `[ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ]`
     - Alpha-3 code: `[ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ]`
     - Numeric code: `[ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ]`
     - Country name: `[ 'g', 'Hungary', 'countryCode', 'ISO-3166-1:name' ]`

4. **ISO-3166-3 Codes**: 
   - These tags also represent country information, but focus on historical changes in country codes. They are not passthrough.
   - Examples mirror the ISO-3166-1 format but relate to updated country codes.

5. **City**: `[ 'g', 'Budapest', 'city' ]`
   - A passthrough from the input city name.

6. **Continent**: `[ 'g', 'Europe', 'continent' ]`
   - A passthrough from the input continent name.

7. **Continent Code**: `[ 'g', 'EU', 'continentCode' ]`
   - A passthrough from the input continent code.

8. **Planet**: `[ 'g', 'Earth', 'planet' ]`
   - A passthrough, assuming Earth as the default planet in the absence of specific planetary data.


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