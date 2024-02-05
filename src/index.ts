import ngeohash, { GeographicPoint } from 'ngeohash';
import { iso31661, iso31662, iso31663, ISO31661AssignedEntry, ISO31662Entry, ISO31661Entry  } from 'iso-3166';

export interface InputData {
    geohash?: string,
    lat?: number;
    lon?: number;
    cityName?: string;
    countryName?: string;
    regionName?: string;
    countryCode?: string;
    planetName?: string;
    [key: string]: any;
}

export interface Options {
    sort?: boolean;

    isoAsNamespace?: boolean;  
    unM49AsNamespace?: boolean;

    ddMaxResolution?: number;

    iso31661?: boolean,
    iso31662?: boolean, 
    iso31663?: boolean, 

    legacy?: boolean,

    geohash?: boolean,
    gps?: boolean,
    city?: boolean,
    cityName?: boolean | null,
    country?: boolean,
    countryName?: boolean | null,
    countryCode?: boolean | null,
    region?: boolean,
    regionName?: boolean | null,
    regionCode?: boolean | null,
    planet?: boolean,
    planetName?: boolean | null,
}

export type ISO31663FieldType = 'alpha2' | 'alpha3' | 'numeric' | 'name';

/**
 * Represents a nostr event `g` (geo) tag with a length of 2
 * 
 * @typedef {Array} GeoTag
 * 
 * A GeoTag is an array with either three or four elements, structured as follows:
 * - First element (string): See NIP-52, always 'g' 
 * - Second element (string): The Geohash
 *  
*/
export type Geohash = [string, string] | [string, string, string];

/**
 * Represents a nostr event `L` (label) tag with a length of 2
 * 
 * @typedef {Array} LabelNamespace
 * 
 * A GeoTag is an array with either three or four elements, structured as follows:
 * - First element (string): See NIP-32, always 'G' 
 * - Second element (string): The Label's Namespace
 *  
*/
export type LabelNamespace = [ string, string ]

/**
 * Represents a nostr event `l` (geo) tag with a length of 2
 * 
 * @typedef {Array} Label
 * 
 * A GeoTag is an array with either three or four elements, structured as follows:
 * - First element (string): See NIP-32, always 'g' 
 * - Second element (string): The value
 * - Second element (string): The namespace
 *  
*/
export type Label = [ string, string, string ]

/**
 * Represents a union of LabelNamespace and Label
 * 
 * @typedef {Array} LabelTag
 * 
 * A GeoTag is either a @type Label or @type LabelNamespace
 *  
*/
export type LabelTag = LabelNamespace | Label;

/**
 * Represents a union of all possible types returned by generateTags() 
 * 
 * @typedef {Array} Label
 * 
 * A GeoTag is an array with either three or four elements, structured as follows:
 * - First element (string): See NIP-32, always 'g' 
 * - Second element (string): The value
 * - Second element (string): The namespace
 *  
*/
export type GeoTags = Geohash | LabelTag;

const DD_MAX_RES_DEFAULT = 9

/**
 * Retrieves updated ISO-3166-3 values based on a given code.
 *
 * @param {ISO31663FieldType} type - The type of the ISO-3166-3 field (alpha2, alpha3, numeric, name).
 * @param {string} code - The ISO-3166-3 code to find updated values for.
 * @returns {string[]} An array of updated ISO-3166-3 values.
 *
 * This function searches for a matched entry in the iso31663 dataset based on the provided code.
 * If a match is found and the code corresponds to a 'from' entry, it returns the updated 'to' values.
 * Otherwise, it returns the original code in an array.
 */
const getUpdatedIso31663Values = (type: ISO31663FieldType, code: string): string[] => {
    const matchedEntry = iso31663.find(entry => 
        entry.from[type] === code ||
        entry.to.some(change => change[type] === code)
    );
    if (matchedEntry) {
        if (matchedEntry.from[type] === code) {
            return matchedEntry.to.map(change => change[type]);
        } else {
            return [code];
        }
    }
    return [code];
};

export const iso31661Namespace = (opts: Options): string => opts.isoAsNamespace ? 'ISO-3166-1' : 'countryCode';

export const iso31662Namespace = (opts: Options): string  => opts.isoAsNamespace ? 'ISO-3166-2' : 'regionCode';

export const iso31663Namespace = (opts: Options): string  => opts.isoAsNamespace ? 'ISO-3166-3' : 'countryCode';

/**
 * Truncates a number (float) to a specified precision. Generally used for dd (lat and lon) values.
 *
 * @param {number} num - The float to be shortened.
 * @param {number} resolution - How many decimal places.
 * @returns {GeoTags[]} An array of generated geo tags.
 *
 * This function shortens a lat or lon to a specified precision (number of decimal places.)
 * Does nothing if whole number.
 */
const truncateToResolution = (num: number, resolution: number): number => {
  const multiplier = Math.pow(10, resolution);
  return Math.floor(num * multiplier) / multiplier;
};


export const calculateResolution = (input: number, max: number | undefined): number => {
  if(!max) max = DD_MAX_RES_DEFAULT
  return input % 1 === 0 ? 1 : Math.min(input.toString().split('.')?.[1]?.length, max);
}

/**
 * Generates an array of `g` tags based on the input data and options provided.
 *
 * @param {InputData} input - The geo input data used to generate tags.
 * @param {Options} opts - Options to customize tag generation and control the output.
 * @returns {GeoTags[]} An array of generated geo tags.
 *
 * This function processes the input data and generates a series of tags based on the options.
 * It handles various types of data such as GPS coordinates, ISO-3166 country and region codes,
 * city.
 */
const generateTags = (input: InputData, opts: Options): GeoTags[] => {
    const tags: GeoTags[] = [];
    let result

    // Geohash
    if (opts.geohash && (input.lat && input.lon) || input.geohash) {
      let fullGeohash
      if(input.lat && input.lon) {
        fullGeohash = ngeohash.encode(input.lat, input.lon);
      }
      else {
        fullGeohash = input.geohash
      }
      if(fullGeohash && fullGeohash.length > 0 && opts.legacy === false) {
        tags.push(['G', 'geohash' ]);
      }
      for (let i = fullGeohash.length; i > 0; i--) {
          const partialGeohash = fullGeohash.substring(0, i);
          const tag: Geohash = ['g', partialGeohash ]
          if(!opts.legacy) tag.push('geohash')
          tags.push(tag);
      }
    }
    
    if(opts.legacy === false) {
      // GPS
      if(opts?.gps && input.geohash && (!input?.lat || !input?.lon)) {
        const dd = ngeohash.decode(input.geohash)
        input.lat = dd.latitude
        input.lon = dd.longitude
      }
      if (opts?.gps && input.lat && input.lon) {
          tags.push(['G', `dd`]);
          tags.push(['g', `${input.lat}, ${input.lon}`, 'dd']);

          const latResolution = calculateResolution(input.lat, opts.ddMaxResolution);
          const lonResolution = calculateResolution(input.lon, opts.ddMaxResolution);

          tags.push(['G', `lat`]);
          for (let i = latResolution; i > 0; i--) {
              const truncatedLat = truncateToResolution(input.lat, i);
              tags.push(['g', truncatedLat.toString(), 'lat']);
          }

          tags.push(['G', `lon`]);
          for (let i = lonResolution; i > 0; i--) {
              const truncatedLon = truncateToResolution(input.lon, i);
              tags.push(['g', truncatedLon.toString(), 'lon']);
          }
      }

      if (opts.iso31661 && input.countryCode) {
          const countryData = iso31661.find(c => c.alpha2 === input.countryCode);
          const namespace = iso31661Namespace(opts)
          const iso31661Tags: LabelTag[] = [];
          if (countryData) {
              iso31661Tags.push(['g', countryData.alpha2, namespace]);
              iso31661Tags.push(['g', countryData.alpha3, namespace]);
              iso31661Tags.push(['g', countryData.numeric, namespace]);
              if(countryData.name) {
                  iso31661Tags.push(['G', 'countryName']);
                  iso31661Tags.push(['g', countryData.name, 'countryName']);
              }
          }    

          if(iso31661Tags.length > 0){
              iso31661Tags.unshift(['G', namespace]);
              tags.push(...iso31661Tags);
          }
          
      }

      if (opts.iso31662 && input.countryCode && input.regionName) {
          const regionData = iso31662.find(r => r.parent === input.countryCode && r.name === input.regionName);
          const namespace = iso31662Namespace(opts)
          const iso31662Tags: LabelTag[] = [];
          if (regionData) {
              iso31662Tags.push(['g', regionData.code, namespace]);
          }
          if(iso31662Tags.length > 0){
              iso31662Tags.unshift(['G', namespace]);
              tags.push(...iso31662Tags);
          }
      }

      if (opts.iso31663 && input.countryCode) {
          const countryData = iso31661.find(c => c.alpha2 === input.countryCode);
          const namespace = iso31663Namespace(opts)
          if (countryData) {
              const iso31663Tags: LabelTag[] = [];

              // Iterate over all types and check for updated values
              (['alpha2', 'alpha3', 'numeric', 'name'] as const).forEach(type => {

                  const originalValue = countryData[type as keyof ISO31661Entry];
                  const updatedValues = getUpdatedIso31663Values(type, originalValue);
      
                  // Add updated values if they are different from the original
                  updatedValues.forEach(updatedValue => {
                      if ( (originalValue !== updatedValue && type !== 'name'))
                          iso31663Tags.push(['g', updatedValue, namespace]);
                  });
              });
      
              // Add the ISO-3166-3 namespace label if there are any updated tags
              if (iso31663Tags.length > 0) {
                  iso31663Tags.unshift(['G', namespace]);
                  tags.push(...iso31663Tags);
              }
          }
      }

      if ((opts.city || opts.cityName) && input.cityName && !opts.legacy) {
          tags.push(['G', 'cityName']);
          tags.push(['g', input.cityName, 'cityName']);
      }

      if ((opts.planet || opts.planetName) && input.planetName && !opts.legacy) {
          tags.push(['G', 'planetName']);
          tags.push(['g', input.planetName, 'planetName']);
      }

    }

    result = tags

    if(!opts.country && opts.countryCode !== true){
        const namespace = iso31661Namespace(opts)
        result = filterOutType(result, namespace)
    }
    if(!opts.region && opts.regionCode !== true){
        const namespace = iso31662Namespace(opts)
        result = filterOutType(result, namespace);
    }
    result = opts?.sort === true? sortTagsByKey(result): result;
    result = sanitize(result)
    return result
};


/**
 * sanitize
 * Filters and sanitizes an array of GeoTags.
 *
 * This function processes an array of GeoTags. It first filters the array to include only those tags
 * where the first character is 'g' or 'G'. After this initial filtering, it calls the 'filterNonStringTags'
 * function to typecheck array contents. The resulting array of GeoTags is then returned.
 *
 * @param {GeoTags[]} tags - An array of GeoTags to be sanitized
 * @returns {GeoTags[]} - The sanitized array of GeoTags
 */
export const sanitize = (tags: GeoTags[]): GeoTags[] => {   
    tags = tags.filter(tag => tag[0] === 'g' || tag[0] === 'G' )
    tags = filterNonStringTags(tags)
    return tags
}

/**
 * Generates a country key based on the given type.
 * 
 * @param {string} type - The type of the tag, typically an ISO-3166 field type.
 * @returns {string} The generated tag key.
 * 
 * This function determines the key to be used in a tag array based on the type of data.
 * For the type 'name', it returns 'countryName', indicating the tag represents a country's name.
 * For any other type, it returns 'countryCode', typically representing an ISO-3166 country code.
 */
export const generateCountryTagKey = (type: string): string => {
    return type === 'name' ? `countryName` : `countryCode`;
};

/**
 * Filters out tags of a specific type from an array of tags.
 *
 * @param {GeoTags[]} tags - The array of geotags to be filtered.
 * @param {string} type - The type of tag to be filtered out.
 * @returns {GeoTags[]} A new array with the specified type of tags removed.
 *
 * This utility function filters out tags from an array based on the provided type.
 * It iterates over the array and excludes any tags where the third element (the type identifier)
 * matches the specified type. This is useful for removing specific types of geotags from
 * a list of various tags.
 */
export const filterOutType = (tags: GeoTags[], type: string): GeoTags[] => {
    return tags.filter(tag => tag[2]!== type && tag[1]!== type);
}

/**
 * Sorts an array of tags by the key (second item in each tag array).
 * 
 * @param {GeoTags[]} tags - The array of tags to be sorted.
 * @returns {GeoTags[]} The sorted array of tags.
 * 
 * This function sorts the tags based on the tag key (third element), 
 * which allows for easier processing and organization of tags.
 */
export const sortTagsByKey = (tags: GeoTags[]): GeoTags[] => {
    return tags.sort((a: GeoTags, b: GeoTags) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
    });
};


/**
 * Filters out tags that contain non-string items.
 * @param {GeoTags[]} tags - An array of tags, where each tag is an array.
 * @returns {GeoTags[]} Filtered array of tags.
 */
export function filterNonStringTags(tags: GeoTags[]): GeoTags[] {
    return tags.filter(tag => tag.every(item => typeof item === 'string'));
}

/**
 * Produces an array of nostr `g` (geo) tag arrays based on input geo data and options.
 *
 * @param {InputData | null} input - The input data for generating tags.
 * @param {Options} [opts] - Optional parameters to customize tag generation.
 * @throws {Error} Throws an error if the input data is null or not an object.
 * @returns {GeoTags[]} An array of generated tags.
 *
 * This function is the primary entry point for generating an array of nostr `g` (geo) tag arrays. 
 * It validates the input data, applies default options if not provided, and invokes the tag generation process.
 * The options can control the inclusion of various geotags like GPS, ISO-3166 country codes,
 * city names, etc. The function can also deduplicate and sort the tags.
 *
 * If the input data is null, an error is thrown. The input must be an object.
 */
export default (input: InputData | null, opts?: Options): GeoTags[] => {
    if (!input) 
        throw new Error('Input is required');
    if (!(input instanceof Object) || Array.isArray(input) || typeof input!== 'object' || typeof input=== 'function' )
        throw new Error('Input must be an object');
    opts = {
        sort: false,

        isoAsNamespace: false,
        unM49AsNamespace: true,

        ddMaxResolution: DD_MAX_RES_DEFAULT,

        iso31661: true,
        iso31662: false, 
        iso31663: false, 
        geohash: true,
        
        legacy: false,

        gps: false,

        city: true,
        cityName: null,

        country: true,
        countryName: null,
        countryCode: null,

        region: true,
        regionName: null,
        regionCode: null,

        planet: false,
        planetName: null,
        ...opts
    };

    if(opts.iso31663) 
        opts.iso31661 = true

    return generateTags(input, opts);
};
