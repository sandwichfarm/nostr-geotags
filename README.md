# nostr-geotags

> ATTENTION: Use at your own risk, this is not a widely accepted standard, and there are chances a proposed standard will differ greatly or slightly from this pattern. [Find YAGT NIP here](https://github.com/nostr-protocol/nips/pull/952)

[![semver](https://img.shields.io/npm/v/nostr-geotags)](https://github.com/sandwichfarm/nostr-geotags/releases/latest) 
[![cov](https://sandwichfarm.github.io/nostr-geotags/badges/coverage.svg)](https://github.com/sandwichfarm/nostr-geotags/actions)
[![test](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/buildtest.yaml/badge.svg)](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/buildtest.yaml) 
[![publish](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/publish.yaml/badge.svg)](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/publish.yaml) 
[![docs](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/docs.yaml/badge.svg)](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/docs.yaml) 
[![covgen](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/coverage.yaml/badge.svg)](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/coverage.yaml) 
![npm bundle size](https://img.shields.io/bundlephobia/minzip/nostr-geotags)
![npm bundle size](https://img.shields.io/bundlephobia/min/nostr-geotags)


## Summary
`nostr-geotags` is a modern ESM-only package for generating nostr geo tags (`['g', ...]`) based on various inputs like latitude, longitude, city, country, etc. It uses `iso-3166` and `ngeohash` to generate geodata.  This package is alpha and the API and response formats _will_ change.

This package was derived from needs in [`@nostrwatch`](https://github.com/sandwichfarm/nostr-watch), an _OpenSats Grant Recipient_, and so was made possible by [OpenSats](https://opensats.org/).

## Installation
The package is available on npm and can be installed using npm, yarn, or pnpm.

```
npm install nostr-geotags

yarn add nostr-geotags

pnpm add nostr-geotags
```

## Usage
First, import `nostr-geotags` in your project:

```
import ngeotags from 'nostr-geotags';
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
- Any other key-value pairs

## Input Reference
The `inputData` object can contain the following properties, used to generate geo-tags:

- `lat` (number): Latitude coordinate. No default value.
- `lon` (number): Longitude coordinate. No default value.
- `geohash` (string): Geohash coordinate. No default value. Will be ignored if lat & lon are also passed as input as they take precedence.
- `city` (string): Name of the city. No default value.
- `country` (string): Name of the country. No default value.
- `regionName` (string): Name of the region or state. No default value.
- `countryCode` (string): `ISO-3166-1:alpha-2` country code. No default value.
- Other properties (any): Additionally, key value pairs will be ignored but do not throw an error.
- `planetName` (string): Name of a planet.

## Options Reference
The `options` object specifies which types of tags to generate. 


### ISO options
- `iso31661` (boolean): Generate ISO 3166-1 tags. Default: `true`.
- `iso31662` (boolean): Generate ISO 3166-2 tags. Default: `false`.
- `iso31663` (boolean): Generate ISO 3166-3 tags. Default: `true`. See `ISO-3166-3 Behaviors`  

### Transform options
- `isoAsNamespace` (boolean): Use ISO standand (ex: `ISO-3166-1`)  as the namespace for tags. If false will use `countryCode` and `regionCode` instead of `ISO-3166-1/3` and `iso-3166-2` respectively. Default: `false`.

### Response Options
Please note: that these will only have an effect on the output if the input for their corresponding values were set. This is especially true for passthrough values. Some of these passthrough values may be deduped if they are not unique against ISO values. 
- `geohash` (boolean): Includes geohash codes from `ngeohash`, with diminishing resolution, based on latitude and longitude. Default: `true`.
- `city` or `cityName` (boolean): Include a tag for the city in response **if available**. Default: `true`.
- `country` (boolean): Include a tag for the `countryCode` and `countryName` in response **if available**. Default: `true`.
- `countryCode` (boolean): Include a tag for the `countryCode` in response **if available**. Default: `true`.
- `countryName` (boolean): Include a tag for the `countryName` in response **if available**. Default: `true`.
- `region` (boolean): Include a tag for the `regionCode` and `regionName` in response **if available**. Default:`true`.
- `regionCode` (boolean): Include a tag for the `regionCode` in response **if available**. Default:`true`.
- `regionName` (boolean): Include a tag for the `regionName` in response **if available**. Default:`true`.
- `gps` (boolean): Include latitude and longitude as a 'dd' tag (de-factor GPS standards) and separate tags for lat and lon with diminishing resolution. Default: `false`.
- `planet` or `planetName` (boolean): Include a tag for the `planetName` in response **if available**. Default: `false`.

### Compatibility Options
- `legacy` (boolean) Will only return legacy `g` tags, for example: `["g", "u2mwdd"]`

## Response Reference
The function returns an array of tuples, where each tuple represents a tag and its associated data. The format of the tuples is based on `NIP-01`.

- The first element (`'g'`) is a constant indicating the type of tag.
- The second element is the `value` of the tag, which can vary based on the input and options used. 
- The third element is the `key` of the tag.
- The fourth element (optional) is the `standard`, which is serialized with a `:` where when split `standard[0]` is the the standard's identified and `standard[1]` is the standard's value. This field is only used for ISO.

### Determining tag usage
Which tags you use depend on use-case. If your concerns are namely geospacial, using only geohashes likely suffice, if your concerns around around borders, languages or laws, `ISO-3166-3` may suffice. If your concerns are mixed, a combination of standards will suffice. In most cases the defaults are good, and most likely won't need to be changed unless you are optimizing your tags array. 

### Tag Types and Their Descriptions
1. **GPS**: `[ 'g', '<latitude>, <longitude>', 'dd' ]`, `[ 'g', '<latitude>', 'lat' ]` and `[ l', '<longitude>', 'lon' ]`
   - Coordinates of diminishing resolution from the input latitude and longitude. One of each of these tags are passthrough, but the rest are progressively reduced in their precision until the final decimal point. If an integer is provided for one or both `lat` and `lon`, an integer is returned. 
   
2. **Geohash**: `[ g', '<geohash>']` (`NIP-52`)
   - Geohashes of diminishing resolution from the input latitude and longitude. These are not passthrough; they are computed using the `ngeohash` library.

3. **ISO-3166-1 Codes**: 
   - These tags represent country information derived from the `iso-3166` library and are based on the provided `countryCode` input value. They are not passthrough.
   - Examples 
    - **`isoAsNamespace==false [default]`**
      - Alpha-2 code: `[ 'g', 'HU', 'countryCode' ]`
      - Alpha-3 code: `[ 'g', 'HUN', 'countryCode']`
    - **`isoAsNamespace==true`**
      - Alpha-2 code: `[ 'g', 'HU', 'ISO-3166-1' ]`
      - Alpha-3 code: `[ 'g', 'HUN', 'ISO-3166-1']`

4. **ISO-3166-2 Codes**: 
   - These tags represent region information derived from the `iso-3166` library and are based on the `countryCode` and `regionCode` input values. They are not passthrough values. 

5. **ISO-3166-3 Codes**: 
   - These tags also represent country information, but focus on historical changes in country codes. They are not passthrough.
   - Examples mirror the ISO-3166-1 format but relate to updated country codes.

6. **City**: `[ 'g', 'Budapest', 'cityName' ]`
   - A passthrough from the input city name.

9. **Planet**: `[ 'g', 'Earth', 'planetName' ]`
   - A passthrough, assuming Earth as the default planet in the absence of specific planetary data.

### ISO-3166-3 Behaviors

When `iso31663` is enabled, it will affect the response contents. Any `ISO-3166-3` code found for a given `ISO-3166-1` `countryCode` that is not a duplicate of it's `ISO-3166-1` counterpart, will be appended to the tags array. Here's an example:

[
  [ 'G', 'countryCode' ],
  [ 'g', 'AI', 'countryCode'],
  [ 'g', 'AIA', 'countryCode' ],
  [ 'g', '660', 'countryCode'],
  [ 'G', 'countryCode' ],
  [ 'g', 'DJ', 'countryCode' ],
  [ 'G', 'countryName' ],
  [ 'g', 'Anguilla', 'countryName' ]
]

Here two `alpha2` codes are returned, the original `ISO-3166-1` code, and the changed `ISO-3166-3` code. Since the other `ISO-3166-3` properties for `AI` are the same as their `ISO-3166-1` counter-parts, they are not included. 


## Example Response

Here is the default response when `lat`, `lon`, `countryCode`, `regionName`, **and** `planet` are provided, with everything else default
```
[
  [ 'G', 'geohash' ],
  [ 'g', 'u2mwdd8q4', 'geohash' ],
  [ 'g', 'u2mwdd8q', 'geohash' ],
  [ 'g', 'u2mwdd8', 'geohash' ],
  [ 'g', 'u2mwdd', 'geohash' ],
  [ 'g', 'u2mwd', 'geohash' ],
  [ 'g', 'u2mw', 'geohash' ],
  [ 'g', 'u2m', 'geohash' ],
  [ 'g', 'u2', 'geohash' ],
  [ 'g', 'u', 'geohash' ],
  [ 'G', 'countryCode' ],
  [ 'g', 'HU', 'countryCode' ],
  [ 'g', 'HUN', 'countryCode' ],
  [ 'G', 'countryName' ],
  [ 'g', 'Hungary', 'countryName' ],
  [ 'G', 'cityName' ],
  [ 'g', 'Budapest', 'cityName' ],
]
```

This is a response with all options enabled (deduped, `dedupe: true`)

```
 [
  [ 'G', 'dd' ],
  [ 'g', '47.5636, 19.0947', 'dd' ],
  [ 'G', 'lat' ],
  [ 'g', '47.5636', 'lat' ],
  [ 'g', '47.563', 'lat' ],
  [ 'g', '47.56', 'lat' ],
  [ 'g', '47.5', 'lat' ],
  [ 'G', 'lon' ],
  [ 'g', '19.0947', 'lon' ],
  [ 'g', '19.094', 'lon' ],
  [ 'g', '19.09', 'lon' ],
  [ 'g', '19', 'lon' ],
  [ 'G', 'geohash' ],
  [ 'g', 'u2mwdd8q4', 'geohash' ],
  [ 'g', 'u2mwdd8q', 'geohash' ],
  [ 'g', 'u2mwdd8', 'geohash' ],
  [ 'g', 'u2mwdd', 'geohash' ],
  [ 'g', 'u2mwd', 'geohash' ],
  [ 'g', 'u2mw', 'geohash' ],
  [ 'g', 'u2m', 'geohash' ],
  [ 'g', 'u2', 'geohash' ],
  [ 'g', 'u', 'geohash' ],
  [ 'G', 'countryCode' ],
  [ 'g', 'HU', 'countryCode' ],
  [ 'g', 'HUN', 'countryCode' ],
  [ 'G', 'countryName' ],
  [ 'g', 'Hungary', 'countryName' ],
  [ 'G', 'regionCode' ],
  [ 'g', 'HU-BU', 'regionCode' ],
  [ 'G', 'cityName' ],
  [ 'g', 'Budapest', 'cityName' ],
  [ 'G', 'planetName' ],
  [ 'g', 'Earth', 'planetName' ]
]
```

## Example
Here's a basic usage example:

```
import ngeotags from 'nostr-geotags'

event = {}
event.kind = 1
//created_at, content etc...
event.tags = []
event.tags.push(['t', 'nostrworks'])

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

event.tags = [...event.tags, ...ngeotags(inputData, options)];
//sign and verify the event
console.log(event);
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
