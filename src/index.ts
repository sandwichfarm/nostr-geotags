import ngeohash from 'ngeohash';
import { iso31661, iso31662, iso31663, ISO31661AssignedEntry, ISO31661Entry  } from 'iso-3166';

interface InputData {
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

interface Options {
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
}

// interface ISO31661Entry {
//     alpha2: string;
//     alpha3: string;
//     numeric: string;
//     name: string;
// }


type ISO31663FieldType = 'alpha2' | 'alpha3' | 'numeric' | 'name';

const getUpdatedIso31663Value = (type: ISO31663FieldType, code: string): string => {
    const matchedEntry = iso31663.find(entry => 
        entry.from[type] === code ||
        entry.to.some(change => change[type] === code)
    );
    if (matchedEntry) {
        if (matchedEntry.from[type] === code) {
            // If the code matches the 'from' part, return the new value ('to' part)
            return matchedEntry.to[0][type]; // Assuming there's always at least one 'to' entry
        } else {
            // If the code matches the 'to' part, return the same code as it's already the new value
            return code;
        }
    }

    // If there's no match, return the original code
    return code;
};


const generateTags = (input: InputData, opts: Options): Array<[string, string, string] | [string, string, string, string]> => {
    const tags: Array<[string, string, string] | [string, string, string, string]> = [];

    // GPS
    if (opts.gps && input.lat && input.lon) {
        tags.push([`g`, `${input.lat},${input.lon}`, 'gps']);
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
                // Make sure type is a valid key of ISO31661AssignedEntry
                tags.push(['g', countryData[type as keyof ISO31661AssignedEntry], 'countryCode', `ISO-3166-1:${type}`]);
            });
        }
    }

    // ISO-3166-2 (region code)
    if (opts.iso31662 && input.country && input.regionName) {
        const regionData = iso31662.find(r => r.parent === input.country && r.name === input.regionName);
        if (regionData) {
            ['code', 'name', 'parent'].forEach((type) => {
                tags.push(['g', regionData[type as keyof typeof regionData], 'regionCode', `ISO-3166-2:${type}`]);
            });
        }
    }

    // ISO-3166-3 (changes)
    if (opts.iso31663 && input.countryCode) {
        const countryData = iso31661.find((c: ISO31661Entry) => c.alpha2 === input.countryCode);
        if (countryData) {
            (['alpha2', 'alpha3', 'numeric', 'name'] as const).forEach((type) => {
                // Here we assert that type is a key of ISO31661Entry
                const value = countryData[type as keyof ISO31661Entry];
                tags.push(['g', getUpdatedIso31663Value(type, value), 'countryCode', `ISO-3166-3:${type}`]);
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
    if(opts.planet) {
        tags.push(['g', 'Earth', 'planet']);
    }

    return tags;
};

export default (input: InputData | null, opts?: Options): Array<[string, string, string] | [string, string, string, string]> => {
    if (!input) 
        throw new Error('Input is required');
    if (typeof input !== 'object')
        throw new Error('Input must be an object');
    opts = {
        iso31661: false,
        iso31662: true, 
        iso31663: false, 
        planet: false,
        geohash: true,
        gps: true,
        city: true,
        country: true,
        region: true,
        continent: true,
        continentCode: true,
        ...opts
    };

    return generateTags(input, opts);
};