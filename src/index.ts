import ngeohash from 'ngeohash';
import { iso31661, iso31662, iso31663, ISO31661AssignedEntry, ISO31662Entry, ISO31661Entry  } from 'iso-3166';

export interface InputData {
    lat?: number;
    lon?: number;
    cityName?: string;
    countryName?: string;
    regionName?: string;
    countryCode?: string;
    continentName?: string;
    continentCode?: string;
    planetName?: string;
    [key: string]: any;
}

export interface Options {
    dedupe?: boolean;
    sort?: boolean;
    sanitize?: boolean;

    isoAsNamespace?: boolean;  
    unM49AsNamespace?: boolean;

    iso31661?: boolean,
    iso31662?: boolean, 
    iso31663?: boolean, 

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
    continent?: boolean,
    continentName?: boolean | null,
    continentCode?: boolean | null,
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
export type Geohash = [string, string];

/**
 * Represents a nostr event `L` (label) tag with a length of 2
 * 
 * @typedef {Array} LabelNamespace
 * 
 * A GeoTag is an array with either three or four elements, structured as follows:
 * - First element (string): See NIP-32, always 'L' 
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
 * - First element (string): See NIP-32, always 'l' 
 * - Second element (string): The value
 * - Second element (string): The namespace
 *  
*/
export type Label = [ string, string, string ] | [ string, string, string, string ]

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
 * - First element (string): See NIP-32, always 'l' 
 * - Second element (string): The value
 * - Second element (string): The namespace
 *  
*/
export type GeoTags = Geohash | LabelTag;

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

/**
 * Generates an array of `g` tags based on the input data and options provided.
 *
 * @param {InputData} input - The geo input data used to generate tags.
 * @param {Options} opts - Options to customize tag generation and control the output.
 * @returns {GeoTags[]} An array of generated geo tags.
 *
 * This function processes the input data and generates a series of tags based on the options.
 * It handles various types of data such as GPS coordinates, ISO-3166 country and region codes,
 * city, continent, and continentName: names. The generated tags are deduplicated by default, can be changed
 * with dedupe option. 
 */
const generateTags = (input: InputData, opts: Options): GeoTags[] => {
    const tags: GeoTags[] = [];

     // GPS
     if (opts.gps && input.lat && input.lon) {
        tags.push(['L', `dd`]);
        tags.push(['l', `${input.lat}, ${input.lon}`, 'dd']);
        
        const maxResolution = 10;
        const truncateToResolution = (num: number, resolution: number): number => {
            const multiplier = Math.pow(10, resolution);
            return Math.floor(num * multiplier) / multiplier;
        };
        const latResolution = input.lat % 1 === 0 ? 1 : Math.min(input.lat.toString().split('.')[1].length, maxResolution);
        const lonResolution = input.lon % 1 === 0 ? 1 : Math.min(input.lon.toString().split('.')[1].length, maxResolution);

        tags.push(['L', `lat`]);
        for (let i = latResolution; i > 0; i--) {
            const truncatedLat = truncateToResolution(input.lat, i);
            tags.push(['l', truncatedLat.toString(), 'lat']);
        }

        tags.push(['L', `lon`]);
        for (let i = lonResolution; i > 0; i--) {
            const truncatedLon = truncateToResolution(input.lon, i);
            tags.push(['l', truncatedLon.toString(), 'lon']);
        }
    }

    // Geohash
    if (opts.geohash && input.lat && input.lon) {
        const fullGeohash = ngeohash.encode(input.lat, input.lon);
        for (let i = fullGeohash.length; i > 0; i--) {
            const partialGeohash = fullGeohash.substring(0, i);
            tags.push(['g', partialGeohash, 'geohash']);
        }
    }

    if (opts.iso31661 && input.countryCode) {
        const countryData = iso31661.find(c => c.alpha2 === input.countryCode);
        const namespace = opts.isoAsNamespace ? 'ISO-3166-1' : 'countryCode';
        const iso31661Tags: LabelTag[] = [];
        if (countryData) {
            iso31661Tags.push(['l', countryData.alpha2, namespace, 'alpha-2']);
            iso31661Tags.push(['l', countryData.alpha3, namespace, 'alpha-3']);
            iso31661Tags.push(['l', countryData.numeric, namespace, 'numeric']);
            if(countryData.name) {
                iso31661Tags.push(['L', 'countryName']);
                iso31661Tags.push(['l', countryData.name, 'countryName']);
            }
        }    

        if(iso31661Tags.length > 0){
            iso31661Tags.unshift(['L', namespace]);
            tags.push(...iso31661Tags);
        }
        
    }

    if (opts.iso31662 && input.countryCode && input.regionName) {
        const regionData = iso31662.find(r => r.parent === input.countryCode && r.name === input.regionName);
        const namespace = opts.isoAsNamespace ? 'ISO-3166-2' : 'regionCode';
        const iso31662Tags: LabelTag[] = [];
        if (regionData) {
            iso31662Tags.push(['l', regionData.code, namespace]);
        }
        if(iso31662Tags.length > 0){
            iso31662Tags.unshift(['L', namespace]);
            tags.push(...iso31662Tags);
        }
    }

    if (opts.iso31663 && input.countryCode) {
        const countryData = iso31661.find(c => c.alpha2 === input.countryCode);
        if (countryData) {
            const iso31663Tags: LabelTag[] = [];

            const namespace = opts.isoAsNamespace ? 'ISO-3166-3' : 'countryCode';

            // Iterate over all types and check for updated values
            (['alpha2', 'alpha3', 'numeric', 'name'] as const).forEach(type => {

                const originalValue = countryData[type as keyof ISO31661Entry];
                const updatedValues = getUpdatedIso31663Values(type, originalValue);

                const typeMap = {
                    alpha2: 'alpha-2',
                    alpha3: 'alpha-3',
                    numeric: 'numeric',
                    name: 'name'
                }
    
                // Add updated values if they are different from the original
                updatedValues.forEach(updatedValue => {
                    if ( (originalValue !== updatedValue && type !== 'name'))
                        iso31663Tags.push(['l', updatedValue, namespace, typeMap[type] ]);
                });
            });
    
            // Add the ISO-3166-3 namespace label if there are any updated tags
            if (iso31663Tags.length > 0) {
                iso31663Tags.unshift(['L', namespace]);
                tags.push(...iso31663Tags);
            }
        }
    }

    if ((opts.city || opts.cityName) && input.cityName) {
        tags.push(['L', 'cityName']);
        tags.push(['l', input.cityName, 'cityName']);
    }

    if ((opts.continent || opts.continentName) && input.continentName) {
        tags.push(['L', 'continentName']);
        tags.push(['l', input.continentName, 'continentName']);
    }

    if ((opts.continent || opts.continentCode) && input.continentCode) {
        const namespace = opts.unM49AsNamespace ? 'UN M49' : 'continentCode';
        tags.push(['L', namespace]);
        tags.push(['l', input.continentCode, namespace]);
    }

    if ((opts.planet || opts.planetName) && input.planetName) {
        tags.push(['L', 'planetName']);
        tags.push(['l', input.planetName, 'planetName']);
    }

    let result = tags

    if(!opts.country && opts.countryCode !== true){
        const namespace = opts.isoAsNamespace ? 'ISO-3166-1' : 'countryCode';
        result = filterOutType(result, namespace)
    }
    if(!opts.region && opts.regionCode !== true){
        result = filterOutType(result, 'regionCode');
    }
    result = opts?.dedupe === true? dedupe(result): result;
    result = opts?.sort === true? sortTagsByKey(result): result;
    result = opts?.sanitize === true? sanitize(result): result;
    return result
};

/**
 * Deduplicates an array of tags.
 *
 * @param {GeoTags[]} tags - The array of tags to deduplicate.
 * @returns {GeoTags[]} A deduplicated array of tags.
 *
 * This function removes duplicate tags from the provided array. It checks each tag for duplication
 * against the existing tags in the deduped array. It also filters out certain tags based on specific
 * criteria, such as prioritizing ISO-3166-3 tags over ISO-3166-1 and ISO-3166-2 tags.
 */
export const dedupe = (tags: GeoTags[]): GeoTags[] => {
    let deduped: GeoTags[] = [];

    const isDuplicate = (tag: GeoTags, arr: GeoTags[]) => arr.some(item => item[1] === tag[1] && item[2] === tag[2]);

    tags.forEach(tag => {
        if (tag[0] === 'l' && tag[2] && tag[2].includes('ISO-3166-3')) {
            // For ISO-3166-3 tags, check if there's an existing ISO-3166-1 tag with the same key but different value
            const existingIso31661Tag = deduped.find(t => t[1] === tag[1] && t[2] && t[2].includes('ISO-3166-1'));
            console.log(tag[1], 'exists?', existingIso31661Tag)
            if (!existingIso31661Tag && !isDuplicate(tag, deduped)) {
                deduped.push(tag);
            }
        } else if (tag[0] === 'l' && (!tag[3] || (tag[3] && !tag[3].includes('ISO-3166-3')))) {
            // For other 'l' tags, just check for duplicates
            if (!isDuplicate(tag, deduped)) {
                deduped.push(tag);
            }
        } else if (tag[0] === 'g' || tag[0] === 'L') {
            // 'g' and 'L' tags are always added
            deduped.push(tag);
        }
    });

    // Filter out ISO-3166-2 tags if ISO-3166-1 tags are present for the same key
    const iso3166Categories = ['ISO-3166-1', 'ISO-3166-2'];
    iso3166Categories.forEach(category => {
        const hasISO31661 = deduped.some(tag => tag[2] === category && tag[3] && tag[3].includes('ISO-3166-1'));
        if (hasISO31661) {
            deduped = deduped.filter(tag => !(tag[2] === category && tag[3] && tag[3].includes('ISO-3166-2')));
        }
    });

    return deduped;
};

export const sanitize = (tags: GeoTags[]): GeoTags[] => {   
    tags = tags.filter(tag => tag[0] === 'g' || tag[0] === 'L' || tag[0] === 'l')
    tags = tags.filter(tag => tag[1] !== undefined && tag[1] !== null && tag[1] !== '')
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
 * Generates a region key based on the given type.
 * 
 * @param {string} type - The type of the tag, a ISO-3166-2 field type.
 * @returns {string} The generated tag key.
 * 
 * This function determines the key to be used in a tag array based on the type of data.
 * For the type 'name', it returns 'countryName', indicating the tag represents a country's name.
 * For the type 'parent', it returns 'countryCode', representing an ISO-3166-1 country code.
 * For any other type, it returns 'regionCode', representing an ISO-3166-2 region.
 */
export const generateRegionTagKey = (type: string): string => {
    return type === 'name'? `regionName`: type === 'parent'? `countryCode`: `regionCode`;
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
    return tags.filter(tag => tag[2]!== type);
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
function filterNonStringTags(tags: GeoTags[]): GeoTags[] {
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
 * city names, continent details, etc. The function can also deduplicate and sort the tags.
 *
 * If the input data is null, an error is thrown. The input must be an object.
 */
export default (input: InputData | null, opts?: Options): GeoTags[] => {
    if (!input) 
        throw new Error('Input is required');
    if (!(input instanceof Object) || Array.isArray(input) || typeof input!== 'object' || typeof input=== 'function' )
        throw new Error('Input must be an object');
    opts = {
        dedupe: true,
        sort: false,
        sanitize: true,

        isoAsNamespace: true,
        unM49AsNamespace: true,

        iso31661: true,
        iso31662: false, 
        iso31663: false, 
        geohash: true,

        gps: false,

        city: true,
        cityName: null,

        country: true,
        countryName: null,
        countryCode: null,

        region: true,
        regionName: null,
        regionCode: null,

        continent: true,
        continentName: null, 
        continentCode: null,

        planet: false,
        planetName: null,
        ...opts
    };

    if(opts.iso31663) 
        opts.iso31661 = true

    return generateTags(input, opts);
};
