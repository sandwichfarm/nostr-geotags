import { describe, it, expect } from 'vitest';
import ngeotags from './index'; // Adjust the import path as needed

import { iso31661, iso31662, iso31663, ISO31661AssignedEntry, ISO31661Entry  } from 'iso-3166';


describe('ngeotags', () => {
    it('should throw an error if input is null', () => {
        expect(() => ngeotags(null)).toThrow('Input is required');
    });

    it('should throw an error if input is not an object', () => {
        expect(() => ngeotags(42 as any)).toThrow('Input must be an object');
    });

    it('should correctly transform gps coordinates', () => {
        const result = ngeotags({ lat: 47.5636, lon: 19.0947 });
        expect(result).toContainEqual(['g', '47.5636,19.0947', 'gps']);
        console.log('result:', result)
    });

    it('should correctly transform geohash', () => {
        const result = ngeotags({ lat: 47.5636, lon: 19.0947 });
        const geohash = result.find(tag => tag[2] === 'geohash');
        expect(geohash).toBeDefined();
    });

    it('should correctly transform ISO-3166-1 country name', () => {
        const result = ngeotags({ countryCode: 'HU' }, { iso31661: true });
        const countryNames = result.filter(tag => tag?.[3] && tag[3].includes('ISO-3166-1'));
        // console.log('result:', result)
        // console.log('filtered:', countryNames)
        expect(countryNames.length).toBe(4);
    });

    it('should correctly transform ISO-3166-2 region code', () => {
        const result = ngeotags({ country: 'HU', regionName: 'Budapest' }, {iso31662: true});
        const regionCodes = result.filter(tag => tag?.[3] && tag[3]?.includes('ISO-3166-2'));
        expect(regionCodes.length).toBe(3)
    });

    it('should correctly transform ISO-3166-1 data', () => {
        const result = ngeotags({ countryCode: 'HU' }, { iso31661: true });
        // console.log('result', result)
        expect(result).toContainEqual(['g', 'HU', 'countryCode', 'ISO-3166-1:alpha2']);
        expect(result).toContainEqual(['g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3']);
        expect(result).toContainEqual(['g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3']);
        expect(result).toContainEqual(['g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3']);
        // Add checks for numeric and name as well
    });

    it('should correctly transform ISO-3166-3 changes', () => {
        const result = ngeotags({ countryCode: 'AI' }, { iso31663: true }); // Assuming 'AN' has an ISO 3166-3 change
        expect(result).toContainEqual([ 'g', 'DJ', 'countryCode', 'ISO-3166-3:alpha2' ]);
        expect(result).toContainEqual( [ 'g', 'AIA', 'countryCode', 'ISO-3166-3:alpha3' ]);
        expect(result).toContainEqual([ 'g', '660', 'countryCode', 'ISO-3166-3:numeric' ]);
        expect(result).toContainEqual([ 'g', 'Anguilla', 'countryCode', 'ISO-3166-3:name' ]);
        // Add checks for other fields as needed
    });

    it('should return original value if not ISO-3166-3 changes', () => {
        const result = ngeotags({ countryCode: 'DE' }, { iso31663: true }); // Assuming 'AN' has an ISO 3166-3 change
        console.log('no changes:', result)
        expect(result).toContainEqual([ 'g', 'DE', 'countryCode', 'ISO-3166-3:alpha2' ])
        expect(result).toContainEqual([ 'g', 'DEU', 'countryCode', 'ISO-3166-3:alpha3' ])
        expect(result).toContainEqual([ 'g', '276', 'countryCode', 'ISO-3166-3:numeric' ])
        expect(result).toContainEqual([ 'g', 'Germany', 'countryCode', 'ISO-3166-3:name' ])
    });

    it('should correctly transform ISO-3166-2 data', () => {
        const result = ngeotags({ country: 'HU', regionName: 'Budapest' }, { iso31662: true });
        expect(result).toContainEqual(['g', 'HU-BU', 'regionCode', 'ISO-3166-2:code']); 
        expect(result).toContainEqual(['g', 'Budapest', 'regionCode', 'ISO-3166-2:name']); 
        expect(result).toContainEqual(['g', 'HU', 'regionCode', 'ISO-3166-2:parent']); 
    });

    it('should correctly transform city name', () => {
        const result = ngeotags({ city: 'Budapest' });
        expect(result).toContainEqual(['g', 'Budapest', 'city']);
    });

    it('should correctly transform continent name', () => {
        const result = ngeotags({ continent: 'Europe' });
        expect(result).toContainEqual(['g', 'Europe', 'continent']);
    });

    it('should correctly transform continent code', () => {
        const result = ngeotags({ continentCode: 'EU' });
        expect(result).toContainEqual(['g', 'EU', 'continentCode']);
    });

    it('should include not include Earth as planet by default', () => {
        const result = ngeotags({}, {}).find(tag => tag[2] === 'planet') || [];
        expect(result.length).toBe(0);
    });

    it('should include should Earth when enabled', () => {
        const result = ngeotags({}, {planet: true});
        expect(result).toContainEqual(['g', 'Earth', 'planet']);
    });

    it('should correctly transform geohashes of diminishing resolution', () => {
        const result = ngeotags({ lat: 47.5636, lon: 19.0947 });
        const geohashTags = result.filter(tag => tag[2] === 'geohash');
        expect(geohashTags.length).toBeGreaterThan(1); // Expect multiple geohash resolutions
    });

    it('should return all possible geotags', () => {
        const input = {
            "status": "success",
            "continent": "Europe",
            "continentCode": "EU",
            "country": "Hungary",
            "countryCode": "HU",
            "region": "BU",
            "regionName": "Budapest",
            "city": "Budapest",
            "district": "",
            "zip": "1124",
            "lat": 47.5636,
            "lon": 19.0947,
            "timezone": "Europe/Budapest",
            "offset": 3600,
            "currency": "HUF",
            "isp": "Magyar Telekom",
            "org": "",
            "as": "AS5483 Magyar Telekom plc.",
            "asname": "MAGYAR-TELEKOM-MAIN-AS",
            "mobile": false,
            "proxy": false,
            "hosting": false
        }
        const result = ngeotags(input, { iso31661: true, iso31662: true, iso31663: true, planet: true });
        console.log('FULL result:', result)
        expect(result.length).toBeGreaterThan(10);
    })
});
