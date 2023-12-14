import ngeohash from 'ngeohash';
import { iso31661, iso31662, ISO31661Entry } from 'iso-3166';

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

const generateTags = (input: InputData): Array<[string, string, string]> => {
    const tags: Array<[string, string, string]> = [];

    tags.push([`g`, `${input.lat},${input.lon}`, 'gps']);

    // Geohash
    if (input.lat && input.lon) {
        const geohash = ngeohash.encode(input.lat, input.lon);
        tags.push(['g', geohash, 'geohash']);
    }

    // ISO-3166-1 Alpha-2 (country code)
    if (input.countryCode) {
        const countryData = iso31661.find((c: ISO31661Entry) => c.alpha2 === input.countryCode);
        if (countryData) {
            tags.push(['g', countryData.name, 'ISO-3166-1']);
        }
    }

    // ISO-3166-2 (region code)
    if (input.country && input.regionName) {
        const regionData = iso31662.find(r => r.parent === input.country && r.name === input.regionName);
        if (regionData) {
            tags.push(['g', regionData.code, 'ISO-3166-2']);
        }
    }

    // City
    if (input.city) {
        tags.push(['g', input.city, 'city']);
    }

    // Continent
    if (input.continent) {
        tags.push(['g', input.continent, 'continent']);
    }

    // Continent Code
    if (input.continentCode) {
        tags.push(['g', input.continentCode, 'continentCode']);
    }

    // Planet - Assuming Earth as there's no specific data for planet
    tags.push(['g', 'Earth', 'planet']);

    return tags;
};

export default (input: InputData | null): Array<[string, string, string]> => {
    if (!input) 
        throw new Error('Input is required');
    if (typeof input !== 'object')
        throw new Error('Input must be an object');

    return generateTags(input);
};
