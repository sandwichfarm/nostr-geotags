import ngeohash from 'ngeohash';
import { iso31661, iso31662, iso31663, ISO31661AssignedEntry, ISO31662Entry, ISO31661Entry  } from 'iso-3166';

export interface InputData {
    lat?: number;
    lon?: number;
    city?: string;
    country?: string;
    regionName?: string;
    countryCode?: string;
    continent?: string;
    continentCode?: string;
    [key: string]: any;
}

export interface Options {
    applyChanges: boolean,
    dedupe: boolean;
    iso31661?: boolean,
    iso31662?: boolean, 
    iso31663?: boolean, 
    planet?: boolean,
    geohash?: boolean,
    gps?: boolean,
    city?: boolean,
    country?: boolean,
    region?: boolean,
    continent?: boolean,
    continentCode?: boolean,
    debug: boolean
}

export type ISO31663FieldType = 'alpha2' | 'alpha3' | 'numeric' | 'name';
export type Tag = [string, string, string] | [string, string, string, string];

const getUpdatedIso31663Values = (type: ISO31663FieldType, code: string): string[] => {
    const matchedEntry = iso31663.find(entry => 
        entry.from[type] === code ||
        entry.to.some(change => change[type] === code)
    );

    if (matchedEntry) {
        if (matchedEntry.from[type] === code) {
            // Return all new values from the 'to' part
            return matchedEntry.to.map(change => change[type]);
        } else {
            // If the code matches the 'to' part, return the same code as it's already the new value
            return [code];
        }
    }

    // If there's no match, return the original code in an array
    return [code];
};

const generateTags = (input: InputData, opts: Options): Tag[] => {
    const tags: Tag[] = [];

    // const log = logger.bind(opts)

    // GPS
    if (opts.gps && input.lat && input.lon) {
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
        
        // Generate geohashes of diminishing resolution
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
                const key = type === 'name'? `country`: `countryCode`;
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
                const key = type === 'name'? `region`: type === 'parent'? `countryCode`: `regionCode`;
                const value = regionData[type as keyof typeof regionData];
                const standard = `ISO-3166-2:${type}`
                //log(`Processing ${type}: ${value}`); // Debugging statement
                tags.push(['g', value, key, standard]);
            });
        }
    }

    // ISO-3166-3 (changes)
    if (opts.iso31663 && input.countryCode) {
        //log("ISO-3166-3 processing started"); // Debugging statement
        const countryData = iso31661.find((c: ISO31661Entry) => c.alpha2 === input.countryCode);
        if (countryData) {
            (['alpha2', 'alpha3', 'numeric', 'name'] as const).forEach((type) => {
                const updatedValues = getUpdatedIso31663Values(type, countryData[type as keyof ISO31661Entry]);
                updatedValues.forEach(updatedValue => {
                    const key = type === 'name' ? `country` : `countryCode`;
                    const standard = `ISO-3166-3:${type}`;
                    //log(`Processing ${type}: ${updatedValue}`); // Debugging statement
                    tags.push(['g', updatedValue, key, standard]);
                });
            });
        }
    }



    // City
    if (opts.city && input.city) {
        tags.push(['g', input.city, 'city']);
    }

    // Continent
    if (opts.continent && input.continent) {
        tags.push(['g', input.continent, 'continent']);
    }

    // Continent Code
    if (opts.continentCode && input.continentCode) {
        tags.push(['g', input.continentCode, 'continentCode']);
    }

    // Planet - Assuming Earth as there's no specific data for planet
    if(opts.planet || input?.planet) {
        tags.push(['g', input?.planet? input.planet: 'Earth', 'planet']);
    }

    return opts?.dedupe === true? dedupe(tags, opts?.applyChanges): tags;
};

const dedupe = (tags: Tag[], applyChanges: boolean): Tag[] => {
    let deduped: Tag[] = [];

    // Helper function to check if a tag already exists in the deduplicated array
    const isDuplicate = (tag: Tag, array: Tag[]): boolean => {
        // Allow all 'lat', 'lon', and 'geohash' tags
        if (['lat', 'lon', 'geohash'].includes(tag[2])) {
            return false;
        }

        // Check for duplicates only for ISO-3166 and other tags
        return array.some(
            item => item[2] === tag[2] && item.length === 4 && tag.length === 4 && item[3] === tag[3]
        );
    };

    tags.forEach(tag => {
        // ISO-3166-3 tags are always added
        if (tag.length === 4 && tag[3].startsWith('ISO-3166-3')) {
            deduped.push(tag);
        } else if (!isDuplicate(tag, deduped)) {
            // Add non-duplicate tags
            deduped.push(tag);
        }
    });

    const iso3166Categories = ['countryCode', 'country'];

    if(applyChanges) {
        // Filter out ISO-3166-1 and ISO-3166-2 tags if ISO-3166-3 tags are present for the same category
        iso3166Categories.forEach(category => {
            const hasISO31663 = deduped.some(tag => tag[2] === category && tag[3] && tag[3].startsWith('ISO-3166-3'));
            if (hasISO31663) {
                deduped = deduped.filter(tag => !(tag[2] === category && (tag[3] && (tag[3].startsWith('ISO-3166-1') || tag[3].startsWith('ISO-3166-2')))));
            }
        });
    }
    // Additionally, filter out ISO-3166-2 tags if ISO-3166-1 tags are present for the same category
    iso3166Categories.forEach(category => {
        const hasISO31661 = deduped.some(tag => tag[2] === category && tag[3] && tag[3].startsWith('ISO-3166-1'));
        if (hasISO31661) {
            deduped = deduped.filter(tag => !(tag[2] === category && tag[3] && tag[3].startsWith('ISO-3166-2')));
        }
    });
    return deduped;
};
// export function logger(...args){
//     if( this.debug === true ) 
//         console.//log(...args);
// };

export default (input: InputData | null, opts?: Options): Array<[string, string, string] | [string, string, string, string]> => {
    if (!input) 
        throw new Error('Input is required');
    if (!(input instanceof Object) || Array.isArray(input) || typeof input!== 'object' || typeof input=== 'function' )
        throw new Error('Input must be an object');
    opts = {
        applyChanges: true,
        dedupe: true,
        iso31661: true,
        iso31662: false, 
        iso31663: false, 
        planet: false,
        geohash: true,
        gps: false,
        city: true,
        country: true,
        region: true,
        continent: true,
        continentCode: true,
        debug: false,
        ...opts
    };

    return generateTags(input, opts);
};
