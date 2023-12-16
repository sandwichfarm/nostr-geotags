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
    dedupe: boolean;
    sort: boolean;

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
 * Represents a nostr event `g` (geo) tag with a length of 3 or 4
 * 
 * @typedef {Array} GeoTag
 * 
 * A GeoTag is an array with either three or four elements, structured as follows:
 * - First element (string): See NIP-01, always 'g' in this package. 
 * - Second element (string): The value of the tag, such as a country code or name.
 * - Third element (string): The key of the tag, indicating the type of data, like 'countryCode'.
 * - Fourth element (optional, string): An identifier for the standard, such as 'ISO-3166-1:alpha2'.
 * 
 * The presence of the fourth element indicates that the tag has a defined standard or is otherwise an industry standard signified with 'de facto'
 */
export type GeoTag = [string, string, string] | [string, string, string, string];


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
 * @returns {GeoTag[]} An array of generated geo tags.
 *
 * This function processes the input data and generates a series of tags based on the options.
 * It handles various types of data such as GPS coordinates, ISO-3166 country and region codes,
 * city, continent, and continentName: names. The generated tags are deduplicated by default, can be changed
 * with dedupe option. 
 */
const generateTags = (input: InputData, opts: Options): GeoTag[] => {
    let tags: GeoTag[] = [];

    // const log = logger.bind(opts)

    // GPS
    if (opts.gps && input.lat && input.lon) {
        tags.push(['g', `${input.lat}, ${input.lon}`, 'dd', 'de facto']);
        
        const maxResolution = 10;
        const truncateToResolution = (num: number, resolution: number): number => {
            const multiplier = Math.pow(10, resolution);
            return Math.floor(num * multiplier) / multiplier;
        };
        const latResolution = input.lat % 1 === 0 ? 1 : Math.min(input.lat.toString().split('.')[1].length, maxResolution);
        const lonResolution = input.lon % 1 === 0 ? 1 : Math.min(input.lon.toString().split('.')[1].length, maxResolution);

        for (let i = latResolution; i > 0; i--) {
            const truncatedLat = truncateToResolution(input.lat, i);
            tags.push(['g', truncatedLat.toString(), 'lat']);
        }
        for (let i = lonResolution; i > 0; i--) {
            const truncatedLon = truncateToResolution(input.lon, i);
            tags.push(['g', truncatedLon.toString(), 'lon']);
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
    
    // ISO-3166-1 Alpha-2 (country code)
    if (opts.iso31661 && input.countryCode) {
        const countryData = iso31661.find((c: ISO31661AssignedEntry) => c.alpha2 === input.countryCode);
        if (countryData) {
            (['alpha2', 'alpha3', 'numeric', 'name'] as const).forEach((type) => {
                const key = generateCountryTagKey(type);
                const value = countryData[type as keyof ISO31661AssignedEntry];
                const standard = `ISO-3166-1:${type}`
                tags.push(['g', value, key, standard]);
            });
        }
    }

    // ISO-3166-2 (region code)
    if (opts.iso31662 && input.countryCode && input.regionName) {
        //log("ISO-3166-2 processing started"); // Debugging statement
        const regionData = iso31662.find(r => r.parent === input.countryCode && r.name === input.regionName);
        if (regionData) {
            (['code', 'name', 'parent'] as const).forEach((type) => {
                const key = generateRegionTagKey(type)
                const value = regionData[type as keyof typeof regionData];
                const standard = `ISO-3166-2:${type}`
                //log(`Processing ${type}: ${value}`); // Debugging statement
                tags.push(['g', value, key, standard]);
            });
        }
    }

    // ISO-3166-3 (changes)
    if (opts.iso31663 && input.countryCode) {
        const countryData = iso31661.find((c: ISO31661Entry) => c.alpha2 === input.countryCode);
        if (countryData) {
            (['alpha2', 'alpha3', 'numeric', 'name'] as const).forEach((type) => {
                const originalValue = countryData[type as keyof ISO31661Entry]
                const updatedValues = getUpdatedIso31663Values(type, originalValue);

                // Only add ISO-3166-3 tags if different (when applyChanges is true)
                updatedValues.forEach((updatedValue) => {
                    if (originalValue === updatedValue) return
                    const key = generateCountryTagKey(type)
                    const standard = `ISO-3166-3:${type}`;
                    tags.push(['g', updatedValue, key, standard]);
                });
            });
        }
    }

    // City
    if ((opts.city || opts.cityName) && input.cityName) {
        tags.push(['g', input.cityName, 'cityName']);
    }

    // Continent
    if ((opts.continent || opts.continentName) && input.continentName) {
        tags.push(['g', input.continentName, 'continentName']);
    }

    // Continent Code
    if ((opts.continent || opts.continentCode) && input.continentCode) {
        tags.push(['g', input.continentCode, 'continentCode']);
    }

    // Planet
    if(opts.planet || opts.planetName === true) {
        tags.push(['g', input?.planetName? input.planetName: 'Earth', 'planetName']);
    }

    if(!opts.country && opts.countryCode !== true){
        tags = filterOutType(tags, 'countrycode')
    }

    if(!opts.country && opts.countryName !== true){
        tags = filterOutType(tags, 'countryName');
    }

    if(!opts.region && opts.regionCode !== true){
        tags = filterOutType(tags, 'regionCode');
    }

    if(!opts.region && opts.regionName !== true){
        tags = filterOutType(tags, 'regionName');
    }

    let result 
    result = opts?.dedupe === true? dedupe(tags): tags;
    result = opts?.sort === true? sortTagsByKey(result): result;
    return result
};

/**
 * Deduplicates an array of tags.
 *
 * @param {GeoTag[]} tags - The array of tags to deduplicate.
 * @returns {GeoTag[]} A deduplicated array of tags.
 *
 * This function removes duplicate tags from the provided array. It checks each tag for duplication
 * against the existing tags in the deduped array. It also filters out certain tags based on specific
 * criteria, such as prioritizing ISO-3166-3 tags over ISO-3166-1 and ISO-3166-2 tags.
 */
export const dedupe = (tags: GeoTag[]): GeoTag[] => {
    let deduped: GeoTag[] = [];

    const isDuplicate = (tag: GeoTag, arr: GeoTag[]) => arr.some(item => item[1] === tag[1] && item[2] === tag[2]);

    tags = filterNonStringTags(tags)

    tags.forEach(tag => {
        // Check if the tag is ISO-3166-3 and if it's a duplicate
        if (tag?.[3]?.startsWith('ISO-3166-3')) {
            const existingIso31661or2Tag = deduped.find(t => t[1] === tag[1] && t[2] === tag[2] && !t?.[3]?.startsWith('ISO-3166-3'));
            if (!existingIso31661or2Tag && !isDuplicate(tag, deduped)) {
                deduped.push(tag);
            }
        } else if (!isDuplicate(tag, deduped)) {
            deduped.push(tag);
        }
    });

    // Additionally, filter out ISO-3166-2 tags if ISO-3166-1 tags are present for the same category
    ['countryCode', 'country'].forEach(category => {
        const hasISO31661 = deduped.some(tag => tag[2] === category && tag[3] && tag[3].startsWith('ISO-3166-1'));
        if (hasISO31661) {
            deduped = deduped.filter(tag => !(tag[2] === category && tag[3] && tag[3].startsWith('ISO-3166-2')));
        }
    });
    return deduped
};

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
 * @param {GeoTag[]} tags - The array of geotags to be filtered.
 * @param {string} type - The type of tag to be filtered out.
 * @returns {GeoTag[]} A new array with the specified type of tags removed.
 *
 * This utility function filters out tags from an array based on the provided type.
 * It iterates over the array and excludes any tags where the third element (the type identifier)
 * matches the specified type. This is useful for removing specific types of geotags from
 * a list of various tags.
 */
export const filterOutType = (tags: GeoTag[], type: string): GeoTag[] => {
    return tags.filter(tag => tag[2]!== type);
}


/**
 * Sorts an array of tags by the key (second item in each tag array).
 * 
 * @param {GeoTag[]} tags - The array of tags to be sorted.
 * @returns {GeoTag[]} The sorted array of tags.
 * 
 * This function sorts the tags based on the tag key (third element), 
 * which allows for easier processing and organization of tags.
 */
export const sortTagsByKey = (tags: GeoTag[]): GeoTag[] => {
    return tags.sort((a: GeoTag, b: GeoTag) => {
        if (a[2] < b[2]) return -1;
        if (a[2] > b[2]) return 1;
        return 0;
    });
};


/**
 * Filters out tags that contain non-string items.
 * @param {GeoTag[]} tags - An array of tags, where each tag is an array.
 * @returns {GeoTag[]} Filtered array of tags.
 */
function filterNonStringTags(tags: GeoTag[]): GeoTag[] {
    return tags.filter(tag => tag.every(item => typeof item === 'string'));
}

/**
 * Produces an array of nostr `g` (geo) tag arrays based on input geo data and options.
 *
 * @param {InputData | null} input - The input data for generating tags.
 * @param {Options} [opts] - Optional parameters to customize tag generation.
 * @throws {Error} Throws an error if the input data is null or not an object.
 * @returns {GeoTag[]} An array of generated tags.
 *
 * This function is the primary entry point for generating an array of nostr `g` (geo) tag arrays. 
 * It validates the input data, applies default options if not provided, and invokes the tag generation process.
 * The options can control the inclusion of various geotags like GPS, ISO-3166 country codes,
 * city names, continent details, etc. The function can also deduplicate and sort the tags.
 *
 * If the input data is null, an error is thrown. The input must be an object.
 */
export default (input: InputData | null, opts?: Options): GeoTag[] => {
    if (!input) 
        throw new Error('Input is required');
    if (!(input instanceof Object) || Array.isArray(input) || typeof input!== 'object' || typeof input=== 'function' )
        throw new Error('Input must be an object');
    opts = {
        dedupe: true,
        sort: false,

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
