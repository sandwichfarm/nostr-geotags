# nostr-geotags

> ATTENTION: Use at your own risk, this is not a widely accepted standard, and there are chances a proposed standard will differ greatly or slightly from this pattern.

[![semver](https://img.shields.io/npm/v/nostr-geotags)](https://github.com/sandwichfarm/nostr-geotags/releases/latest) 
[![Test](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/coverage.yaml/badge.svg)](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/coverage.yaml) 
[![publish](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/publish.yaml/badge.svg)](https://github.com/sandwichfarm/nostr-geotags/actions/workflows/publish.yaml) 
[![cov](https://sandwichfarm.github.io/nostr-geotags/badges/coverage.svg)](https://github.com/sandwichfarm/nostr-geotags/actions)

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
- Other properties (any): Additionally, key value pairs will be ignored but do not throw an error.

## Options Reference
The `options` object specifies which types of tags to generate. 


### ISO options
- `iso31661` (boolean): Generate ISO 3166-1 tags. Default: `true`.
- `iso31662` (boolean): Generate ISO 3166-2 tags. Default: `false`.
- `iso31663` (boolean): Generate ISO 3166-3 tags. Default: `false`. See `ISO-3166-3 Behaviors`  

### Transform options
- `dedupe` (boolean): Dedupe results with preference for ISO values. Newer ISO revisions take precedence. 
- `isoAsNamespace` (boolean): Use ISO standand (ex: `ISO-3166-1`)  as the namespace for tags. If false will use `countryCode` and `regionCode` instead of `ISO-3166-1/3` and `iso-3166-2` respectively. Default: `true`.
- `unM49AsNamespace` (boolean): Use `UN M49` as the namespace for tags. Default: `true`.

### Response Options
Please note: that these will only have an effect on the output if the input for their corresponding values were set. This is especially true for passthrough values. Some of these passthrough values may be deduped if they are not unique against ISO values. 

- `gps` (boolean): Include latitude and longitude as a 'dd' tag (de-factor GPS standards) and separate tags for lat and lon with diminishing resolution. Default: `false`.
- `geohash` (boolean): Includes geohash codes from `ngeohash`, with diminishing resolution, based on latitude and longitude. Default: `true`.
- `city` (boolean): Include a tag for the city. Default: `true`.
- `country` (boolean): Include a tag for the country. Default: `true`.
- `region` (boolean): Include a tag for the region. Default:`true`.
- `continent` (boolean): Include a tag for the continent. Default: `false`.
- `continentCode` (boolean): Include a tag for the continent code. Default: `true`.
- `planet` (boolean): Include a tag for the planet (Earth by default). Default: `false`.


## Response Reference
The function returns an array of tuples, where each tuple represents a tag and its associated data. The format of the tuples is based on `NIP-01`.

- The first element (`'g'`) is a constant indicating the type of tag.
- The second element is the `value` of the tag, which can vary based on the input and options used. 
- The third element is the `key` of the tag.
- The fourth element (optional) is the `standard`, which is serialized with a `:` where when split `standard[0]` is the the standard's identified and `standard[1]` is the standard's value. This field is only used for ISO.

### Determining tag usage
Which tags you use depend on use-case. If your concerns are namely geospacial, using only geohashes likely suffice, if your concerns around around borders, languages or laws, `ISO-3166-3` may suffice. If your concerns are mixed, a combination of standards will suffice. In most cases the defaults are good, and most likely won't need to be changed unless you are optimizing your tags array. 

### Tag Types and Their Descriptions
1. **GPS**: `[ 'l', '<latitude>, <longitude>', 'dd' ]`, `[ 'l', '<latitude>', 'lat' ]` and `[ l', '<longitude>', 'lon' ]`
   - Coordinates of diminishing resolution from the input latitude and longitude. One of each of these tags are passthrough, but the rest are progressively reduced in their precision until the final decimal point. If an integer is provided for one or both `lat` and `lon`, an integer is returned. 
   
2. **Geohash**: `[ g', '<geohash>']` (`NIP-52`)
   - Geohashes of diminishing resolution from the input latitude and longitude. These are not passthrough; they are computed using the `ngeohash` library.

3. **ISO-3166-1 Codes**: 
   - These tags represent country information derived from the `iso-3166` library and are based on the provided `countryCode` input value. They are not passthrough.
   - Examples: 
     - Alpha-2 code: `[ 'l', 'HU', 'ISO-3166-1', 'alpha2' ]`
     - Alpha-3 code: `[ 'l', 'HUN', 'ISO-3166-1', 'alpha3' ]`
     - Numeric code: `[ 'l', '348', 'ISO-3166-1', 'numeric' ]`

4. **ISO-3166-2 Codes**: 
   - These tags represent region information derived from the `iso-3166` library and are based on the `countryCode` and `regionCode` input values. They are not passthrough values. 

5. **ISO-3166-3 Codes**: 
   - These tags also represent country information, but focus on historical changes in country codes. They are not passthrough.
   - Examples mirror the ISO-3166-1 format but relate to updated country codes.

6. **City**: `[ 'l', 'Budapest', 'cityName' ]`
   - A passthrough from the input city name.

7. **Continent**: `[ 'l', 'Europe', 'continentName' ]`
   - A passthrough from the input continent name.

8. **Continent Code**: `[ 'l', 'EU', 'continentCode' ]`
   - A passthrough from the input continent code.

9. **Planet**: `[ 'l', 'Earth', 'planetName' ]`
   - A passthrough, assuming Earth as the default planet in the absence of specific planetary data.

### ISO-3166-3 Behaviors

When `iso31663` is enabled, it will affect the response contents. Any `ISO-3166-3` code found for a given `ISO-3166-1` `countryCode` that is not a duplicate of it's `ISO-3166-1` counterpart, will be appended to the tags array. Here's an example:

[
  [ 'L', 'ISO-3166-1' ],
  [ 'l', 'AI', 'ISO-3166-1', 'alpha-2' ],
  [ 'l', 'AIA', 'ISO-3166-1', 'alpha-3' ],
  [ 'l', '660', 'ISO-3166-1', 'numeric' ],
  [ 'L', 'ISO-3166-3' ],
  [ 'l', 'DJ', 'ISO-3166-3', 'alpha-2' ],
  [ 'L', 'countryName' ],
  [ 'l', 'Anguilla', 'countryName' ]
]

Here two `alpha2` codes are returned, the original `ISO-3166-1` code, and the changed `ISO-3166-3` code. Since the other `ISO-3166-3` properties for `AI` are the same as their `ISO-3166-1` counter-parts, they are not included. 


## Example Response

Here is the default response when `lat`, `lon`, `countryCode`, `regionName`, `continentCode`, `continent` **and** `planet` are provided.
```
[
  [ 'g', 'u2mwdd8q4' ],
  [ 'g', 'u2mwdd8q' ],
  [ 'g', 'u2mwdd8' ],
  [ 'g', 'u2mwdd' ],
  [ 'g', 'u2mwd' ],
  [ 'g', 'u2mw' ],
  [ 'g', 'u2m' ],
  [ 'g', 'u2' ],
  [ 'g', 'u' ],
  [ 'L', 'ISO-3166-1' ],
  [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
  [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
  [ 'l', '348', 'ISO-3166-1', 'numeric' ],
  [ 'L', 'countryName' ],
  [ 'l', 'Hungary', 'countryName' ],
  [ 'L', 'cityName' ],
  [ 'l', 'Budapest', 'cityName' ],
  [ 'L', 'continentName' ],
  [ 'l', 'Europe', 'continentName' ],
  [ 'L', 'UN M49' ],
  [ 'l', 'EU', 'UN M49' ]
]
```

This is a response with all options enabled (deduped, `dedupe: true`)

```
[
  [ 'L', 'dd' ],
  [ 'l', '47.5636, 19.0947', 'dd' ],
  [ 'L', 'lat' ],
  [ 'l', '47.5636', 'lat' ],
  [ 'l', '47.563', 'lat' ],
  [ 'l', '47.56', 'lat' ],
  [ 'l', '47.5', 'lat' ],
  [ 'L', 'lon' ],
  [ 'l', '19.0947', 'lon' ],
  [ 'l', '19.094', 'lon' ],
  [ 'l', '19.09', 'lon' ],
  [ 'l', '19', 'lon' ],
  [ 'g', 'u2mwdd8q4' ],
  [ 'g', 'u2mwdd8q' ],
  [ 'g', 'u2mwdd8' ],
  [ 'g', 'u2mwdd' ],
  [ 'g', 'u2mwd' ],
  [ 'g', 'u2mw' ],
  [ 'g', 'u2m' ],
  [ 'g', 'u2' ],
  [ 'g', 'u' ],
  [ 'L', 'ISO-3166-1' ],
  [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
  [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
  [ 'l', '348', 'ISO-3166-1', 'numeric' ],
  [ 'L', 'countryName' ],
  [ 'l', 'Hungary', 'countryName' ],
  [ 'L', 'ISO-3166-2' ],
  [ 'l', 'HU-BU', 'ISO-3166-2' ],
  [ 'L', 'cityName' ],
  [ 'l', 'Budapest', 'cityName' ],
  [ 'L', 'continentName' ],
  [ 'l', 'Europe', 'continentName' ],
  [ 'L', 'UN M49' ],
  [ 'l', 'EU', 'UN M49' ],
  [ 'L', 'planetName' ],
  [ 'l', 'Earth', 'planetName' ]
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
