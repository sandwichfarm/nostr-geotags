

import { describe, it, expect, vi} from 'vitest';
import ngeotags, { InputData, Option, filterNonStringTags, generateCountryTagKey, sortTagsByKey, GeoTags, filterOutType, iso31661Namespace, iso31662Namespace, iso31663Namespace  } from './index'; // Adjust the import path as needed

describe('generateTags()', () => {

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
            //dedupe: true,
            sort: false,
            iso31661: true,
            iso31662: true,
            iso31663: true,
            geohash: true,
            gps: true,
            city: true,
            continent: true,
            planet: true
        };

        const result = ngeotags(input, options);
        console.log('all defaults', result)
        expect(result).toEqual(expect.arrayContaining([
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
          ]));
    });


    it('null options should produce correct output', () => {
        const input: InputData = {
            //dedupe: true,
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
            //dedupe: true,
            iso31661: true,
            iso31662: true,
            iso31663: true,
            geohash: false,
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

            planet: true,
            planetName: null
        };

        const result = ngeotags(input, options);
        console.log('all', result) 
        // expect(result).toHaveLength(28);
    })

    it('should generate tags correctly with all high specificity options enabled', () => {
        const input: InputData = {
            //dedupe: true,
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
            //dedupe: true,
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
        console.log('all high specificity', result.length, result) 
        expect(result).toHaveLength(37);
    })

    it('should generate tags correctly when ISO-3166-1 generated properties are disabled in response', () => {
        const input: InputData = {
            //dedupe: true,
            countryCode: 'HU',
            regionName: 'Budapest'
        };

        const options: Options = {
            iso31661: false,
            iso31662: true,
        };

        const result = ngeotags(input, options);
        console.log('ISO-3166-1 disabled', result) 
        expect(result).toEqual([ [ 'L', 'ISO-3166-2' ], [ 'l', 'HU-BU', 'ISO-3166-2' ] ])
    })

    it('should generate tags correctly with default options', () => {
        const input: InputData = {
            //dedupe: true,
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
        console.log('ngeotags: sorted', result)
        expect(result).toEqual([
            [ 'L', 'dd' ],
            [ 'L', 'lat' ],
            [ 'L', 'lon' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'L', 'countryName' ],
            [ 'L', 'ISO-3166-2' ],
            [ 'l', '47, 19', 'dd' ],
            [ 'l', '47', 'lat' ],
            [ 'l', '19', 'lon' ],
            [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
            [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '348', 'ISO-3166-1', 'numeric' ],
            [ 'l', 'Hungary', 'countryName' ],
            [ 'l', 'HU-BU', 'ISO-3166-2' ]
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
            [ 'L', 'dd' ],
            [ 'l', '47, 19', 'dd' ],
            [ 'L', 'lat' ],
            [ 'l', '47', 'lat' ],
            [ 'L', 'lon' ],
            [ 'l', '19', 'lon' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
            [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '348', 'ISO-3166-1', 'numeric' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Hungary', 'countryName' ],
            [ 'L', 'ISO-3166-2' ],
            [ 'l', 'HU-BU', 'ISO-3166-2' ]
          ])
    })

    it('should throw an error if no input is provided', () => {
        expect(() => ngeotags()).toThrow();
    });

    it('should throw if input is not an object', () => {
        expect(() => ngeotags('string')).toThrow();
        expect(() => ngeotags(1)).toThrow();
        expect(() => ngeotags(1.1)).toThrow();
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
            ['l', '47.5636', 'lat'],
            ['l', '47.563', 'lat'],
            ['l', '47.56', 'lat'],
            ['l', '47.5', 'lat'],
            ['l', '19.0947', 'lon'],
            ['l', '19.094', 'lon'],
            ['l', '19.09', 'lon'],
            ['l', '19', 'lon'],
        ]));
    });

    const maxResolution = 10; // This should match the value used in your function

    it('handles maximum decimal length', () => {
        const input = { lat: 47.12345678901, lon: 19.12345678901 };
        const options = { gps: true };
        const result = ngeotags(input, options);

        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47.123456789', 'lat' ],
            [ 'l', '47.123456789', 'lat' ],
            [ 'l', '47.12345678', 'lat' ],
            [ 'l', '47.1234567', 'lat' ],
            [ 'l', '47.123456', 'lat' ],
            [ 'l', '47.12345', 'lat' ],
            [ 'l', '47.1234', 'lat' ],
            [ 'l', '47.123', 'lat' ],
            [ 'l', '47.12', 'lat' ],
            [ 'l', '47.1', 'lat' ],
            [ 'l', '19.123456789', 'lon' ],
            [ 'l', '19.123456789', 'lon' ],
            [ 'l', '19.12345678', 'lon' ],
            [ 'l', '19.1234567', 'lon' ],
            [ 'l', '19.123456', 'lon' ],
            [ 'l', '19.12345', 'lon' ],
            [ 'l', '19.1234', 'lon' ],
            [ 'l', '19.123', 'lon' ],
            [ 'l', '19.12', 'lon' ],
            [ 'l', '19.1', 'lon' ],
        ]));
    });

    it('handles shorter decimal length', () => {
        const input = { lat: 47.1234, lon: 19.1234 };
        const options = { gps: true };
        const result = ngeotags(input, options);
        
        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47.1233', 'lat' ],
            [ 'l', '47.123', 'lat' ],
            [ 'l', '47.12', 'lat' ],
            [ 'l', '47.1', 'lat' ],
            [ 'l', '19.1234', 'lon' ],
            [ 'l', '19.123', 'lon' ],
            [ 'l', '19.12', 'lon' ],
            [ 'l', '19.1', 'lon' ]
        ]));
    });

    it('handles integer values', () => {
        const input = { lat: 47, lon: 19 };
        const options = { gps: true };
        const result = ngeotags(input, options);
        //console.log(result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47', 'lat' ],
            [ 'l', '19', 'lon' ]
        ]));
    });

    it('handles exact maxResolution decimals', () => {
        const input = { lat: 47.1234567890, lon: 19.1234567890 };
        const options = { gps: true };
        const result = ngeotags(input, options);
        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47.123456789', 'lat' ],
            [ 'l', '47.12345678', 'lat' ],
            [ 'l', '47.1234567', 'lat' ],
            [ 'l', '47.123456', 'lat' ],
            [ 'l', '47.12345', 'lat' ],
            [ 'l', '47.1234', 'lat' ],
            [ 'l', '47.123', 'lat' ],
            [ 'l', '47.12', 'lat' ],
            [ 'l', '47.1', 'lat' ],
            [ 'l', '19.123456789', 'lon' ],
            [ 'l', '19.12345678', 'lon' ],
            [ 'l', '19.1234567', 'lon' ],
            [ 'l', '19.123456', 'lon' ],
            [ 'l', '19.12345', 'lon' ],
            [ 'l', '19.1234', 'lon' ],
            [ 'l', '19.123', 'lon' ],
            [ 'l', '19.12', 'lon' ],
            [ 'l', '19.1', 'lon' ]
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
        expect(result.some(tag => tag[0] === 'g')).toBeTruthy();
    });

    it('should handle ISO-3166-1 correctly with optimistic input', () => {
        const input: InputData = {
            iso31661: true,
            countryCode: 'HU'
        };

        const result = ngeotags(input, { iso31661: true });
        console.log('iso31661', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
            [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '348', 'ISO-3166-1', 'numeric' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Hungary', 'countryName' ]
        ]));
    });

    it('should handle ISO-3166-1 correctly with pessimistic input', () => {
        const input: InputData = {
            iso31661: true,
            countryCode: 'XX'
        };

        const result = ngeotags(input, { iso31661: true });
        console.log('iso31661 pessimistic', result)
        expect(result).toEqual([]);
    });

    it('should handle ISO-3166-2 correctly with optimistic input', () => {
        const input: InputData = {
            countryCode: 'HU',
            regionName: 'Budapest'
        };

        const result = ngeotags(input, { iso31661: false, iso31663:false, iso31662: true });
        console.log('iso31662', result)
        expect(result).toEqual(expect.arrayContaining([ 
            [ 'L', 'ISO-3166-2' ], 
            [ 'l', 'HU-BU', 'ISO-3166-2' ]
        ]));
    });

    it('should handle ISO-3166-2 correctly with pessimistic input', () => {
        const input: InputData = {
            countryCode: 'YY',
            regionName: 'XXX'
        };

        const result = ngeotags(input, { iso31661: false, iso31663:false, iso31662: true });
        console.log('iso31662', result)
        expect(result).toEqual([]);
    });

    it('should handle ISO-3166-3 correctly with optimistic input', () => {
        const input: InputData = {
            countryCode: 'AI' // Assuming 'AN' has an ISO-3166-3 change
        };

        const result = ngeotags(input, { iso31663: true });
        console.log('iso31663', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'AI', 'ISO-3166-1', 'alpha-2' ],
            [ 'l', 'AIA', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '660', 'ISO-3166-1', 'numeric' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Anguilla', 'countryName' ],
            [ 'L', 'ISO-3166-3' ],
            [ 'l', 'DJ', 'ISO-3166-3', 'alpha-2' ]
          ]));
    });

    it('should handle ISO-3166-3 correctly with pessimistic input', () => {
        const input: InputData = {
            countryCode: 'XX' // Assuming 'AN' has an ISO-3166-3 change
        };

        const result = ngeotags(input, { iso31663: true });
        console.log('iso31663', result)
        expect(result).toEqual([]);
    });



    it('should return original value if not included in ISO-3166-3 changes', () => {
        const result = ngeotags({ countryCode: 'DE' }, { iso31663: true, iso31661: true }); // Assuming 'AN' has an ISO 3166-3 change
        console.log('iso-3166-3 no changes:', result)
        expect(result).toEqual(expect.arrayContaining([
            ['L', 'ISO-3166-1'],
            [ 'l', 'DE', 'ISO-3166-1', 'alpha-2' ],
            [ 'l', 'DEU', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '276', 'ISO-3166-1', 'numeric' ],
        ]))
    });



    it('should handle city name correctly', () => {
        const input: InputData = {
            cityName: 'Budapest'
        };

        const result = ngeotags(input, { cityName: true });
        console.log(result)
        expect(result).toEqual(expect.arrayContaining([
            ['L', 'cityName'],
            ['l', 'Budapest', 'cityName']
        ]));
    });

    it('should handle continent name correctly', () => {
        const input: InputData = {
            continentName: 'Europe'
        };

        const result = ngeotags(input, { continentName: true });
        expect(result).toContainEqual(['l', 'Europe', 'continentName']);
    });

    it('should handle continent code correctly', () => {
        const input: InputData = {
            continentCode: 'EU'
        };

        const result = ngeotags(input, { continentCode: true });
        console.log('continentCode', result)
        expect(result).toEqual(expect.arrayContaining([ 
            [ 'L', 'UN M49' ], 
            [ 'l', 'EU', 'UN M49' ] 
        ]));
    });

    it('should include Earth as planet when enabled', () => {
        const input: InputData = { planetName: 'Earth' };

        const result = ngeotags(input, { planetName: true });
        console.log('planetName', result)
        expect(result).toContainEqual(['l', 'Earth', 'planetName']);
    });

    it('should not include Earth as planet by default', () => {
        const input: InputData = {};

        const result = ngeotags(input, {});
        expect(result.some(tag => tag[2] === 'planetName')).toBeFalsy();
    });

    it('should filter out countryCode when country and countryCode are false', () => {
        const input: InputData = {
            countryCode: 'HU'
        };

        const opts: Options = {
            country: false,
            countryCode: false
        }

        const result = ngeotags(input, opts);
        console.log('country and countryCode are false', result)
        expect(result).toEqual(expect.not.arrayContaining([
            ['L', 'ISO-3166-1'],    
            [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
            [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '348', 'ISO-3166-1', 'numeric' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Hungary', 'countryName' ]
        ]))
    })


    it('should filter out regionCode when region and regionCode are false', () => {

        const input: InputData = {
            countryCode: 'HU',
            regionName: 'Budapest'
        };

        const opts: Options = {
            region: false,
            regionCode: false
        }

        const result = ngeotags(input, opts);
        console.log('region and regionCode are false', result)
        expect(result).toEqual(expect.not.arrayContaining([
            ['L', 'ISO-3166-2'],    
            [ 'l', 'HU-BU', 'ISO-3166-2' ]
        ]))
    })

});

describe('namespace inflection', () => {

    describe('iso31661Namespace', () => {
        it('should return correct namespace for ISO-3166-1 when isoAsNameSpace is true', () => {
            const opts: Options = { isoAsNamespace: true };
            const result = iso31661Namespace(opts);
            expect(result).toBe('ISO-3166-1');
        });   
        it('should return correct namespace for ISO-3166-1 when isoAsNameSpace is false ', () => {
            const opts: Options = { isoAsNamespace: false };
            const result = iso31661Namespace(opts);
            expect(result).toBe('countryCode');
        });   
    })

    describe('iso31662Namespace', () => {
        it('should return correct namespace for ISO-3166-2 when isoAsNameSpace is true', () => {
            const opts: Options = { isoAsNamespace: true };
            const result = iso31662Namespace(opts);
            expect(result).toBe('ISO-3166-2');
        });   
        it('should return correct namespace for ISO-3166-2 when isoAsNameSpace is false ', () => {
            const opts: Options = { isoAsNamespace: false };
            const result = iso31662Namespace(opts);
            expect(result).toBe('regionCode');
        });   
    })

    describe('iso31663Namespace', () => {
        it('should return correct namespace for ISO-3166-3 when isoAsNameSpace is true', () => {
            const opts: Options = { isoAsNamespace: true };
            const result = iso31663Namespace(opts);
            expect(result).toBe('ISO-3166-3');
        });   
        it('should return correct namespace for ISO-3166-1 when isoAsNameSpace is false ', () => {
            const opts: Options = { isoAsNamespace: false };
            const result = iso31663Namespace(opts);
            expect(result).toBe('countryCode');
        });   
    })

    it('should handle countryCodes correctly when isoAsNamespace is false', () => {
        const input: InputData = {
            countryCode: 'HU',
        };

        const opts: Options = {
            continentCode: true,
            isoAsNamespace: false,
            iso31661: true,
            iso31662: true,
            iso31663: true
        }

        const result = ngeotags(input, opts);
        console.log('isoAsNamespace is false', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'L', 'countryCode' ],
            [ 'l', 'HU', 'countryCode', 'alpha-2' ],
            [ 'l', 'HUN', 'countryCode', 'alpha-3' ],
            [ 'l', '348', 'countryCode', 'numeric' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Hungary', 'countryName' ]
          ]));
    });
    it('should handle continent code correctly when unM49AsNamespace is false', () => {
        const input: InputData = {
            continentCode: 'EU',
        };

        const opts: Options = {
            continentCode: true,
            unM49AsNamespace: false,
            iso31661: true,
            iso31662: true,
            iso31663: true
        }

        const result = ngeotags(input, opts);
        console.log('unM49AsNamespace is false', result)
        expect(result).toEqual(expect.arrayContaining([ 
            [ 'L', 'continentCode' ], 
            [ 'l', 'EU', 'continentCode' ] 
        ]));
    });
    
})

// describe('dedupe()', () => {
//     it('should add a non-duplicate ISO-3166-3 tag', () => {
//         const tags = [
//             ['l', 'US', 'ISO-3166-1', 'alpha-2'],
//             ['l', 'HU', 'ISO-3166-3', 'alpha-2']
//         ];

//         const result = dedupe(tags);
//         expect(result).toContainEqual(['l', 'HU', 'ISO-3166-3', 'alpha-2']);
//     });

    // it('should not add an ISO-3166-3 tag if it duplicates an existing tag', () => {
    //     const tags = [
    //         ['l', 'US', 'ISO-3166-1', 'alpha-2'],
    //         ['l', 'US', 'ISO-3166-3', 'alpha-2']
    //     ];
    //     const result = dedupe(tags);
    //     console.log('dedupe', result)
    //     expect(result).not.toContainEqual(['l', 'US', 'ISO-3166-3', 'alpha-2']);
    // });

//     it('should correctly handle a mix of ISO-3166-1, ISO-3166-2, and ISO-3166-3 tags, including edge cases', () => {
//         const tags: GeoTags[] = [
//             ['l', 'US', 'ISO-3166-1', 'alpha-2'], // ISO-3166-1 tag
//             ['l', 'USA', 'ISO-3166-1', 'alpha-3'], // ISO-3166-1 tag
//             ['l', 'US-NY', 'ISO-3166-2'],  // ISO-3166-2 tag
//             ['l', 'US', 'ISO-3166-3', 'alpha-2'], // Duplicate ISO-3166-3 tag
//             ['l', 'XY', 'ISO-3166-3', 'alpha-2'], // Non-duplicate ISO-3166-3 tag
//             ['x'], // Edge case with unexpected tag type
//         ];

//         const result = dedupe(tags);
//         console.log('dedupe 3', result)

//         expect(result).toEqual(expect.arrayContaining([
//             [ 'l', 'US', 'ISO-3166-1', 'alpha-2' ],
//             [ 'l', 'USA', 'ISO-3166-1', 'alpha-3' ],
//             [ 'l', 'US-NY', 'ISO-3166-2' ],
//             [ 'l', 'XY', 'ISO-3166-3', 'alpha-2' ]
//         ]))
//     })
// });


describe('sortTagsByKey()', () => {

    it('should sort tags', () => {
        const tags: GeoTags[] = [
            [ 'l', 'Hungary', 'ISO-3166-1', 'name' ],
            [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '348', 'ISO-3166-1', 'numeric' ]
          ];

        console.log('before sort', tags)

        const result = sortTagsByKey(tags);
        console.log('after sort', result)
        expect(result).toEqual([
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'Hungary', 'ISO-3166-1', 'name' ],
            [ 'l', 'HU', 'ISO-3166-1', 'alpha-2' ],
            [ 'l', 'HUN', 'ISO-3166-1', 'alpha-3' ],
            [ 'l', '348', 'ISO-3166-1', 'numeric' ]
          ]);
    });
})

describe('filterOutType()', () => {
    it('should filter out tags by type', () => {
        const tags: GeoTags[] = [
            ['l', 'Hungary', 'ISO-3166-1', 'name'],
            ['l', 'HU', 'ISO-3166-1', 'alpha-2'],
            ['l', 'HUN', 'ISO-3166-1', 'alpha-3'],
            ['l', '348', 'ISO-3166-1', 'numeric'],
            ['l', 'HU-BU', 'ISO-3166-2']
        ];

        const result = filterOutType(tags, 'ISO-3166-1');
        console.log('filterOutType', result)
        expect(result).toEqual([
            ['l', 'HU-BU', 'ISO-3166-2']
        ]);
    });
})

describe('filterNonStringTags()', () => {   
    it('should filter out tags that are not strings', () => {
        const tags: GeoTags[] = [
            ['l', null, ''],
            ['l', 3, ''],
            ['l', true, ''],
            ['l', undefined, ''],
            ['l', {}, ''],
            ['l', [], ''],
            ['l', new Set(), ''],
            ['l', new Map(), '']
        ];
        const result = filterNonStringTags(tags);
        console.log('filterNonStringTags', result)
        expect(result).toEqual([]);
    })
})