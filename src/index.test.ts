

import { describe, it, expect, vi} from 'vitest';
import ngeotags, { InputData, Options, dedupe, generateCountryTagKey, sortTagsByKey, GeoTag } from './index'; // Adjust the import path as needed

describe('ngeotags', () => {

    describe('dedupe function', () => {
        it('should add a non-duplicate ISO-3166-3 tag', () => {
            const tags = [
                ['g', 'US', 'countryCode', 'ISO-3166-1:alpha2'],
                ['g', 'UN', 'countryCode', 'ISO-3166-3:alpha2'] // non-duplicate ISO-3166-3 tag
            ];
    
            const result = dedupe(tags);
            expect(result).toContainEqual(['g', 'UN', 'countryCode', 'ISO-3166-3:alpha2']);
        });
    
        it('should not add an ISO-3166-3 tag if it duplicates an existing tag', () => {
            const tags = [
                ['g', 'US', 'countryCode', 'ISO-3166-1:alpha2'],
                ['g', 'US', 'countryCode', 'ISO-3166-3:alpha2'] // duplicate ISO-3166-3 tag
            ];
    
            const result = dedupe(tags);
            const iso31663TagCount = result.filter(tag => tag[1] === 'US' && tag[2] === 'countryCode' && tag[3].startsWith('ISO-3166-3')).length;
            expect(iso31663TagCount).toBe(0);
        });

        it('should correctly handle a mix of ISO-3166-1, ISO-3166-2, and ISO-3166-3 tags, including edge cases', () => {
            const tags = [
                ['g', 'US', 'countryCode', 'ISO-3166-1:alpha2'], // ISO-3166-1 tag
                ['g', 'USA', 'countryCode', 'ISO-3166-1:alpha3'], // ISO-3166-1 tag
                ['g', 'US-NY', 'regionCode', 'ISO-3166-2:code'],  // ISO-3166-2 tag
                ['g', 'New York', 'regionName', 'ISO-3166-2:name'], // ISO-3166-2 tag
                ['g', 'US', 'countryCode', 'ISO-3166-3:alpha2'], // Duplicate ISO-3166-3 tag
                ['g', 'XY', 'countryCode', 'ISO-3166-3:alpha2'], // Non-duplicate ISO-3166-3 tag
                ['g', null, 'countryCode', 'ISO-3166-1:alpha2'], // Edge case with null value
                ['g', 'CA', 'unknownType', 'ISO-3166-1:alpha2'], // Edge case with unexpected tag type
            ];
    
            const result = dedupe(tags);
    
            expect(result).toContainEqual(['g', 'US', 'countryCode', 'ISO-3166-1:alpha2']);
            expect(result).toContainEqual(['g', 'USA', 'countryCode', 'ISO-3166-1:alpha3']);
            expect(result).toContainEqual(['g', 'US-NY', 'regionCode', 'ISO-3166-2:code']);
            expect(result).toContainEqual(['g', 'New York', 'regionName', 'ISO-3166-2:name']);
            expect(result).toContainEqual(['g', 'XY', 'countryCode', 'ISO-3166-3:alpha2']); // Non-duplicate ISO-3166-3 should be included
            expect(result).not.toContainEqual(['g', 'US', 'countryCode', 'ISO-3166-3:alpha2']); // Duplicate ISO-3166-3 should not be included
            expect(result).not.toContainEqual(['g', null, 'countryCode', 'ISO-3166-1:alpha2']); // Null value tag should not be included
            expect(result).toContainEqual(['g', 'CA', 'unknownType', 'ISO-3166-1:alpha2']); // Unexpected tag type should be included unless explicitly excluded
        });
    });

    it('should not dedupe when dedupe is false', () => {
        const input: InputData = {
            countryCode: 'HU',
        };
        const options: Options = {
            iso31661: true,
            iso31663: true,
            dedupe: false
        };

        const result = ngeotags(input, options);
        console.log(result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Hungary', 'countryName', 'ISO-3166-1:name' ],
        ]));
    })

    it('should return countryName when type is name', () => {
        const type = 'name';
        const key = generateCountryTagKey(type);
        expect(key).toBe('countryName');
    });

    it('should return countryCode when type is not name', () => {
        const type = 'alpha2'; // or any other string that's not 'name'
        const key = generateCountryTagKey(type);
        expect(key).toBe('countryCode');
    });

    it('should generate tags correctly with all options enabled', () => {
        const input: InputData = {
            dedupe: true,
            lat: 47.5636,
            lon: 19.0947,
            cityName: 'Budapest',
            country: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            continentName: 'Europe',
            continentCode: 'EU',
            planet: 'Earth'
        };

        const options: Options = {
            dedupe: true,
            iso31661: true,
            iso31662: true,
            iso31663: true,
            planet: true,
            geohash: true,
            gps: true,
            city: true,
            country: true,
            region: true,
            continent: true,
        };

        const result = ngeotags(input, options);
        console.log('all', result) 
        expect(result).toHaveLength(28);
    });

    it('should generate tags correctly with all high-specificity options enabled', () => {
        const input: InputData = {
            dedupe: true,
            lat: 47.5636,
            lon: 19.0947,
            cityName: 'Budapest',
            countryName: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            continentName: 'Europe',
            continentCode: 'EU',
            planetName: 'Earth'
        };

        const options: Options = {
            dedupe: true,
            iso31661: true,
            iso31662: true,
            iso31663: true,
            geohash: true,
            gps: true,

            city: false, 
            cityName: true,
            
            country: false,
            countryName: true,
            countryCode: true,

            region: false, 
            regionName: true,
            regionCode: true,

            continent: false, 
            continentName: true,
            continentCode: true,

            planet: false,
            planetName: true
        };

        const result = ngeotags(input, options);
        console.log('all', result) 
        expect(result).toHaveLength(28);
    })

    it('should generate tags correctly when ISO-3166-1 generated properties are disabled in response', () => {
        const input: InputData = {
            dedupe: true,
            lat: 47.5636,
            lon: 19.0947,
            cityName: 'Budapest',
            country: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            continentName: 'Europe',
            continentCode: 'EU',
            planetName: 'Earth'
        };

        const options: Options = {
            countryName: false,
            countryCode: false,
            regionName: false,
            regionCode: false
        };

        const result = ngeotags(input, options);
        console.log('ISO-3166-1 disabled', result) 
        expect(result).toEqual(expect.not.arrayContaining([
            ['g', 'HU', 'countryCode', 'ISO-3166-1:alpha2'],
            ['g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3'],
            ['g', '348', 'countryCode', 'ISO-3166-1:numeric'],
            ['g', 'Hungary', 'countryName', 'ISO-3166-1:name'], 
            ['g', 'HU-BU', 'regionCode', 'ISO-3166-2:code'],
            ['g', 'Budapest', 'regionName', 'ISO-3166-2:name']
        ]))
    })

    it('should generate tags correctly with default options', () => {
        const input: InputData = {
            dedupe: true,
            lat: 47.5636,
            lon: 19.0947,
            cityName: 'Budapest',
            countryName: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            continentName: 'Europe',
            continentCode: 'EU',
            planetName: 'Earth'
        };

        const result = ngeotags(input);
        console.log('default', result)
        // expect(result).toHaveLength(27);
    });

    it('should sort tags when sort enabled', () => {
        const input: InputData = {
            lat: 47,
            lon: 19,
            countryCode: 'HU',
            regionName: 'Budapest'
        }
        const result = ngeotags(input, { sort: true, iso31661: true, iso31663:true, iso31662: true, geohash: false, gps: true });
        console.log('ngeotags: unsorted', result)
        expect(result).toEqual([
            [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Hungary', 'countryName', 'ISO-3166-1:name' ],
            [ 'g', '47, 19', 'dd', 'de facto' ],
            [ 'g', '47', 'lat' ],
            [ 'g', '19', 'lon' ],
            [ 'g', 'HU-BU', 'regionCode', 'ISO-3166-2:code' ],
            [ 'g', 'Budapest', 'regionName', 'ISO-3166-2:name' ]
        ])
    })

    it('should not sort tags when sort enabled', () => {
        const input: InputData = {
            lat: 47,
            lon: 19,
            countryCode: 'HU',
            regionName: 'Budapest'
        }
        const result = ngeotags(input, { sort: false, iso31661: true, iso31663:true, iso31662: true, geohash: false, gps: true });
        console.log('ngeotags: unsorted', result)
        expect(result).toEqual([
            [ 'g', '47, 19', 'dd', 'de facto' ],
            [ 'g', '47', 'lat' ],
            [ 'g', '19', 'lon' ],
            [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Hungary', 'countryName', 'ISO-3166-1:name' ],
            [ 'g', 'HU-BU', 'regionCode', 'ISO-3166-2:code' ],
            [ 'g', 'Budapest', 'regionName', 'ISO-3166-2:name' ]
        ])
    })


    

    it('should short tags when sort enabled', () => {
        const tags: GeoTag[] = [
            [ 'g', 'Hungary', 'countryName', 'ISO-3166-1:name' ],
            [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
        ]
        const result = sortTagsByKey(tags);
        console.log('unsorted', result)
        expect(result).toEqual([  
            [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Hungary', 'countryName', 'ISO-3166-1:name' ]
        ])
    })

    it('should throw an error if no input is provided', () => {
        expect(() => ngeotags()).toThrow();
    });

    it('should throw if input is not an object', () => {
        expect(() => ngeotags('string')).toThrow();
        expect(() => ngeotags(1)).toThrow();
        expect(() => ngeotags(true)).toThrow();
        expect(() => ngeotags([])).toThrow();
        expect(() => ngeotags(null)).toThrow();
        expect(() => ngeotags(undefined)).toThrow();
    });

    it('should handle gps coordinates correctly', () => {
        const input: InputData = {
            lat: 47.5636,
            lon: 19.0947
        };

        const result = ngeotags(input, { gps: true });
        expect(result).toEqual(expect.arrayContaining([
            ['g', '47.5636', 'lat'],
            ['g', '19.0947', 'lon']
        ]));
    });

    const maxResolution = 10; // This should match the value used in your function

    it('handles maximum decimal length', () => {
        const input = { lat: 47.12345678901, lon: 19.12345678901 };
        const options = { gps: true };
        const result = ngeotags(input, options);

        expect(result).toEqual(expect.arrayContaining([
            [ 'g', '47.123456789', 'lat' ],
            [ 'g', '47.123456789', 'lat' ],
            [ 'g', '47.12345678', 'lat' ],
            [ 'g', '47.1234567', 'lat' ],
            [ 'g', '47.123456', 'lat' ],
            [ 'g', '47.12345', 'lat' ],
            [ 'g', '47.1234', 'lat' ],
            [ 'g', '47.123', 'lat' ],
            [ 'g', '47.12', 'lat' ],
            [ 'g', '47.1', 'lat' ],
            [ 'g', '19.123456789', 'lon' ],
            [ 'g', '19.123456789', 'lon' ],
            [ 'g', '19.12345678', 'lon' ],
            [ 'g', '19.1234567', 'lon' ],
            [ 'g', '19.123456', 'lon' ],
            [ 'g', '19.12345', 'lon' ],
            [ 'g', '19.1234', 'lon' ],
            [ 'g', '19.123', 'lon' ],
            [ 'g', '19.12', 'lon' ],
            [ 'g', '19.1', 'lon' ],
        ]));
    });

    it('handles shorter decimal length', () => {
        const input = { lat: 47.1234, lon: 19.1234 };
        const options = { gps: true };
        const result = ngeotags(input, options);
        
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', '47.1233', 'lat' ],
            [ 'g', '47.123', 'lat' ],
            [ 'g', '47.12', 'lat' ],
            [ 'g', '47.1', 'lat' ],
            [ 'g', '19.1234', 'lon' ],
            [ 'g', '19.123', 'lon' ],
            [ 'g', '19.12', 'lon' ],
            [ 'g', '19.1', 'lon' ]
        ]));
    });

    it('handles integer values', () => {
        const input = { lat: 47, lon: 19 };
        const options = { gps: true };
        const result = ngeotags(input, options);
        //console.log(result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', '47', 'lat' ],
            [ 'g', '19', 'lon' ]
        ]));
    });

    it('handles exact maxResolution decimals', () => {
        const input = { lat: 47.1234567890, lon: 19.1234567890 };
        const options = { gps: true };
        const result = ngeotags(input, options);
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', '47.123456789', 'lat' ],
            [ 'g', '47.12345678', 'lat' ],
            [ 'g', '47.1234567', 'lat' ],
            [ 'g', '47.123456', 'lat' ],
            [ 'g', '47.12345', 'lat' ],
            [ 'g', '47.1234', 'lat' ],
            [ 'g', '47.123', 'lat' ],
            [ 'g', '47.12', 'lat' ],
            [ 'g', '47.1', 'lat' ],
            [ 'g', '19.123456789', 'lon' ],
            [ 'g', '19.12345678', 'lon' ],
            [ 'g', '19.1234567', 'lon' ],
            [ 'g', '19.123456', 'lon' ],
            [ 'g', '19.12345', 'lon' ],
            [ 'g', '19.1234', 'lon' ],
            [ 'g', '19.123', 'lon' ],
            [ 'g', '19.12', 'lon' ],
            [ 'g', '19.1', 'lon' ]
        ]));
        // Assertions to check correct handling
    });

    it('should handle geohash correctly', () => {
        const input: InputData = {
            geohash: true,
            lat: 47.5636,
            lon: 19.0947
        };

        const result = ngeotags(input, { geohash: true });
        expect(result.some(tag => tag[2] === 'geohash')).toBeTruthy();
    });

    it('should handle ISO-3166-1 correctly', () => {
        const input: InputData = {
            iso31661: true,
            countryCode: 'HU'
        };

        const result = ngeotags(input, { iso31661: true });
        expect(result).toEqual(expect.arrayContaining([
            ['g', 'HU', 'countryCode', 'ISO-3166-1:alpha2'],
            ['g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3'],
            ['g', '348', 'countryCode', 'ISO-3166-1:numeric'],
            ['g', 'Hungary', 'countryName', 'ISO-3166-1:name']
        ]));
    });

    it('should handle ISO-3166-2 correctly', () => {
        const input: InputData = {
            iso31662: true,
            countryCode: 'HU',
            regionName: 'Budapest'
        };

        const result = ngeotags(input, { iso31661: false, iso31663:false, iso31662: true });
        expect(result).toEqual(expect.arrayContaining([
            ['g', 'HU-BU', 'regionCode', 'ISO-3166-2:code'],
            ['g', 'Budapest', 'regionName', 'ISO-3166-2:name'],
            ['g', 'HU', 'countryCode', 'ISO-3166-2:parent']
        ]));
    });

    it('should handle ISO-3166-3 correctly', () => {
        const input: InputData = {
            countryCode: 'AI' // Assuming 'AN' has an ISO-3166-3 change
        };

        const result = ngeotags(input, { iso31663: true });
        console.log(result)
        expect(result.length).toBe(5)
        
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', 'AI', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'DJ', 'countryCode', 'ISO-3166-3:alpha2' ],
            [ 'g', 'AIA', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '660', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Anguilla', 'countryName', 'ISO-3166-1:name' ]
        ]));
    });

    it('should return original value if not included in ISO-3166-3 changes', () => {
        const result = ngeotags({ countryCode: 'DE' }, { iso31663: true, iso31661: true }); // Assuming 'AN' has an ISO 3166-3 change
        //console.log('no changes:', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', 'DE', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'DEU', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '276', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Germany', 'countryName', 'ISO-3166-1:name' ]
        ]))
    });



    it('should handle city name correctly', () => {
        const input: InputData = {
            cityName: 'Budapest'
        };

        const result = ngeotags(input, { cityName: true });
        expect(result).toContainEqual(['g', 'Budapest', 'cityName']);
    });

    it('should handle continent name correctly', () => {
        const input: InputData = {
            continentName: 'Europe'
        };

        const result = ngeotags(input, { continentName: true });
        expect(result).toContainEqual(['g', 'Europe', 'continentName']);
    });

    it('should handle continent code correctly', () => {
        const input: InputData = {
            continentCode: 'EU'
        };

        const result = ngeotags(input, { continentCode: true });
        expect(result).toContainEqual(['g', 'EU', 'continentCode']);
    });

    it('should include Earth as planet when enabled', () => {
        const input: InputData = { planetName: 'Earth' };

        const result = ngeotags(input, { planetName: true });
        expect(result).toContainEqual(['g', 'Earth', 'planetName']);
    });

    it('should not include Earth as planet by default', () => {
        const input: InputData = {};

        const result = ngeotags(input, {});
        expect(result.some(tag => tag[2] === 'planetName')).toBeFalsy();
    });
});