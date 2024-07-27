

import { describe, it, expect, vi} from 'vitest';
import ngeotags, { calculateResolution, InputData, Option, filterNonStringTags, generateCountryTagKey, sortTagsByKey, GeoTags, filterOutType, iso31661Namespace, iso31662Namespace, iso31663Namespace  } from './index'; // Adjust the import path as needed

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
            // continentName: 'Europe',
            // continentCode: 'EU',
            planetName: 'Earth'
        };

        const options: Options = {
            sort: false,
            iso31661: true,
            iso31662: true,
            iso31663: true,
            geohash: true,
            gps: true,
            city: true,
            // continent: true,
            planet: true
        };

        const result = ngeotags(input, options);
        // console.log('all defaults', result)
        expect(result).toEqual([
            [ 'l', 'u2mwdd8q4' ],
            [ 'l', 'u2mwdd8q' ],
            [ 'l', 'u2mwdd8' ],
            [ 'l', 'u2mwdd' ],
            [ 'l', 'u2mwd' ],
            [ 'l', 'u2mw' ],
            [ 'l', 'u2m' ],
            [ 'l', 'u2' ],
            [ 'l', 'u' ],
            [ 'l', '47.5636, 19.0947', 'dd' ],
            [ 'L', 'geo.lat' ],
            [ 'l', '47.5636', 'geo.lat' ],
            [ 'l', '47.563', 'geo.lat' ],
            [ 'l', '47.56', 'geo.lat' ],
            [ 'l', '47.5', 'geo.lat' ],
            [ 'L', 'geo.lon' ],
            [ 'l', '19.0947', 'geo.lon' ],
            [ 'l', '19.094', 'geo.lon' ],
            [ 'l', '19.09', 'geo.lon' ],
            [ 'l', '19', 'geo.lon' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'HU', 'ISO-3166-1' ],
            [ 'l', 'HUN', 'ISO-3166-1' ],
            [ 'l', '348', 'ISO-3166-1' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Hungary', 'countryName' ],
            [ 'L', 'ISO-3166-2' ],
            [ 'l', 'HU-BU', 'ISO-3166-2' ],
            [ 'L', 'cityName' ],
            [ 'l', 'Budapest', 'cityName' ],
            [ 'L', 'planetName' ],
            [ 'l', 'Earth', 'planetName' ]
          ]);
    });


    it('null options should produce correct output', () => {
        const input: InputData = {
            lat: 47.5636,
            lon: 19.0947,
            cityName: 'Budapest',
            countryName: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            // continentName: 'Europe',
            // continentCode: 'EU',
            planetName: 'Earth'
        };

        const options: Options = {
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

            // continent: true, 
            // continentName: null,
            // continentCode: null,

            planet: true,
            planetName: null
        };

        const result = ngeotags(input, options);
        //console.log('all', result) 
        // expect(result).toHaveLength(28);
    })

    it('should generate tags correctly with all high specificity options enabled', () => {
        const input: InputData = {
            lat: 47.5636,
            lon: 19.0947,
            cityName: 'Budapest',
            countryName: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            // continentName: 'Europe',
            // continentCode: 'EU',
            planetName: 'Earth'
        };

        const options: Options = {
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

            planet: false,
            planetName: true
        };

        const result = ngeotags(input, options);
        console.log('all high specificity', result.length, result) 
        expect(result).toHaveLength(32);
    })

    it('should generate tags correctly when ISO-3166-1 generated properties are disabled in response', () => {
        const input: InputData = {
            countryCode: 'HU',
            regionName: 'Budapest'
        };

        const options: Options = {
            iso31661: false,
            iso31662: true,
        };

        const result = ngeotags(input, options);
        //console.log('ISO-3166-1 disabled', result) 
        expect(result).toEqual(expect.arrayContaining([
            [ 'L', 'ISO-3166-2' ], 
            [ 'l', 'HU-BU', 'ISO-3166-2' ] 
        ]))
    })

    it('should generate tags correctly with default options', () => {
        const input: InputData = {
            lat: 47.5636,
            lon: 19.0947,
            cityName: 'Budapest',
            countryName: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            // continentName: 'Europe',
            // continentCode: 'EU',
            planetName: 'Earth'
        };

        const result = ngeotags(input);
        console.log('default', result)
        expect(result).toEqual([
            [ 'l', 'u2mwdd8q4' ],
            [ 'l', 'u2mwdd8q' ],
            [ 'l', 'u2mwdd8' ],
            [ 'l', 'u2mwdd' ],
            [ 'l', 'u2mwd' ],
            [ 'l', 'u2mw' ],
            [ 'l', 'u2m' ],
            [ 'l', 'u2' ],
            [ 'l', 'u' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'HU', 'ISO-3166-1' ],
            [ 'l', 'HUN', 'ISO-3166-1' ],
            [ 'l', '348', 'ISO-3166-1' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Hungary', 'countryName' ],
            [ 'L', 'cityName' ],
            [ 'l', 'Budapest', 'cityName' ]
          ])
    });

    it('should sort tags when sort enabled', () => {
        const input: InputData = {
            lat: 47,
            lon: 19,
            countryCode: 'HU',
            regionName: 'Budapest'
        }
        const result = ngeotags(input, { sort: true, iso31661: true, iso31663:true, iso31662: true, geohash: false, gps: true });
        // console.log('ngeotags: sorted', result)
        expect(result).toEqual([
            [ 'L', 'geo.lat' ],
            [ 'L', 'geo.lon' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'L', 'countryName' ],
            [ 'L', 'ISO-3166-2' ],
            [ 'l', '47, 19', 'dd' ],
            [ 'l', '47', 'geo.lat' ],
            [ 'l', '19', 'geo.lon' ],
            [ 'l', 'HU', 'ISO-3166-1' ],
            [ 'l', 'HUN', 'ISO-3166-1' ],
            [ 'l', '348', 'ISO-3166-1' ],
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
            [ 'l', '47, 19', 'dd' ],
            [ 'L', 'geo.lat' ],
            [ 'l', '47', 'geo.lat' ],
            [ 'L', 'geo.lon' ],
            [ 'l', '19', 'geo.lon' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'HU', 'ISO-3166-1' ],
            [ 'l', 'HUN', 'ISO-3166-1' ],
            [ 'l', '348', 'ISO-3166-1' ],
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
        console.log('should handle gps coordinates correctly', result)
        expect(result).toEqual(expect.arrayContaining([
            ['l', '47.5636', 'geo.lat'],
            ['l', '47.563', 'geo.lat'],
            ['l', '47.56', 'geo.lat'],
            ['l', '47.5', 'geo.lat'],
            ['l', '19.0947', 'geo.lon'],
            ['l', '19.094', 'geo.lon'],
            ['l', '19.09', 'geo.lon'],
            ['l', '19', 'geo.lon'], 
        ]));
    });

    const maxResolution = 9; // This should match the value used in your function

    it('handles maximum decimal length', () => {
        const input = { lat: 47.12345678901, lon: 19.12345678901 };
        const options = { gps: true, geohash: false };
        const result = ngeotags(input, options);
        console.log('handles maximum decimal length', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47.12345678901, 19.12345678901', 'dd' ],
            [ 'L', 'geo.lat' ],
            [ 'l', '47.123456789', 'geo.lat' ],
            [ 'l', '47.12345678', 'geo.lat' ],
            [ 'l', '47.1234567', 'geo.lat' ],
            [ 'l', '47.123456', 'geo.lat' ],
            [ 'l', '47.12345', 'geo.lat' ],
            [ 'l', '47.1234', 'geo.lat' ],
            [ 'l', '47.123', 'geo.lat' ],
            [ 'l', '47.12', 'geo.lat' ],
            [ 'l', '47.1', 'geo.lat' ],
            [ 'L', 'geo.lon' ],
            [ 'l', '19.123456789', 'geo.lon' ],
            [ 'l', '19.12345678', 'geo.lon' ],
            [ 'l', '19.1234567', 'geo.lon' ],
            [ 'l', '19.123456', 'geo.lon' ],
            [ 'l', '19.12345', 'geo.lon' ],
            [ 'l', '19.1234', 'geo.lon' ],
            [ 'l', '19.123', 'geo.lon' ],
            [ 'l', '19.12', 'geo.lon' ],
            [ 'l', '19.1', 'geo.lon' ]
          ]));
    });

    it('handles shorter decimal length', () => {
        const input = { lat: 47.1234, lon: 19.1234 };
        const options = { gps: true, geohash: false };
        const result = ngeotags(input, options);
        console.log('handles shorter decimal length', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47.1234, 19.1234', 'dd' ],
            [ 'L', 'geo.lat' ],
            [ 'l', '47.1233', 'geo.lat' ],
            [ 'l', '47.123', 'geo.lat' ],
            [ 'l', '47.12', 'geo.lat' ],
            [ 'l', '47.1', 'geo.lat' ],
            [ 'L', 'geo.lon' ],
            [ 'l', '19.1234', 'geo.lon' ],
            [ 'l', '19.123', 'geo.lon' ],
            [ 'l', '19.12', 'geo.lon' ],
            [ 'l', '19.1', 'geo.lon' ]
          ]));
    });

    it('handles integer values', () => {
        const input = { lat: 47, lon: 19 };
        const options = { gps: true, geohash: false };
        const result = ngeotags(input, options);
        console.log('handles integer values',result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47, 19', 'dd' ],
            [ 'L', 'geo.lat' ],
            [ 'l', '47', 'geo.lat' ],
            [ 'L', 'geo.lon' ],
            [ 'l', '19', 'geo.lon' ]
          ]));
    });

    it('handles exact maxResolution decimals', () => {
        const input = { lat: 47.1234567890, lon: 19.1234567890 };
        const options = { gps: true, geohash: false };
        const result = ngeotags(input, options);
        console.log('handles exact maxResolution decimals', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'l', '47.123456789, 19.123456789', 'dd' ],
            [ 'L', 'geo.lat' ],
            [ 'l', '47.123456789', 'geo.lat' ],
            [ 'l', '47.12345678', 'geo.lat' ],
            [ 'l', '47.1234567', 'geo.lat' ],
            [ 'l', '47.123456', 'geo.lat' ],
            [ 'l', '47.12345', 'geo.lat' ],
            [ 'l', '47.1234', 'geo.lat' ],
            [ 'l', '47.123', 'geo.lat' ],
            [ 'l', '47.12', 'geo.lat' ],
            [ 'l', '47.1', 'geo.lat' ],
            [ 'L', 'geo.lon' ],
            [ 'l', '19.123456789', 'geo.lon' ],
            [ 'l', '19.12345678', 'geo.lon' ],
            [ 'l', '19.1234567', 'geo.lon' ],
            [ 'l', '19.123456', 'geo.lon' ],
            [ 'l', '19.12345', 'geo.lon' ],
            [ 'l', '19.1234', 'geo.lon' ],
            [ 'l', '19.123', 'geo.lon' ],
            [ 'l', '19.12', 'geo.lon' ],
            [ 'l', '19.1', 'geo.lon' ]
          ]));
        // Assertions to check correct handling
    });

    it('should handle geohash correctly', () => {
        const input: InputData = {
            lat: 47.5636,
            lon: 19.0947
        };

        const result = ngeotags(input, { geohash: true });
        console.log('should handle geohash correctly', result)
        expect(result.some(tag => tag[0] === 'l')).toBeTruthy();
    });


    it('should decode geohash when geohash passed via input, either lat or lon are null, and gps is enabled', () => {
      const input: InputData = {
          geohash: 'u2mwdd8q4'
      };

      const result = ngeotags(input, { gps: true });
      //console.log('hash', result)
      expect(result.some(tag => tag[0] === 'l')).toBeTruthy();
    });

    it('should inherit default resolution when one is not set', () => {
      var result = calculateResolution(12.3456789876545345455, undefined)
      expect(result).toBe(9)
    })

    it('should ignore geohash when geohash passed via input, both lat and long are set (number) and gps is enabled', () => {
      const input: InputData = {
          geohash: 'h9xhn7y',
          lat: 47.56361246109009,
          lon: 19.094688892364502
      };

      const result = ngeotags(input, { gps: true, geohash: false });
      console.log('hash and dd passed', result)
      expect(result.some(tag => tag[0] === 'l')).toBeTruthy();
      expect(result).toEqual(expect.arrayContaining([
        [ 'l', '47.5636', 'geo.lat' ],
        [ 'l', '19.0946', 'geo.lon' ],
    ]));
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
            [ 'l', 'HU', 'ISO-3166-1'],
            [ 'l', 'HUN', 'ISO-3166-1' ],
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
        //console.log('iso31661 pessimistic', result)
        expect(result).toEqual([]);
    });

    it('should handle ISO-3166-2 correctly with optimistic input', () => {
        const input: InputData = {
            countryCode: 'HU',
            regionName: 'Budapest'
        };

        const result = ngeotags(input, { iso31661: false, iso31663:false, iso31662: true });
        //console.log('iso31662', result)
        expect(result).toEqual(expect.arrayContaining([ 
            [ 'L', 'ISO-3166-2' ], 
            [ 'l', 'HU-BU', 'ISO-3166-2' ],
        ]));
    });

    it('should handle ISO-3166-2 correctly with pessimistic input', () => {
        const input: InputData = {
            countryCode: 'YY',
            regionName: 'XXX'
        };

        const result = ngeotags(input, { iso31661: false, iso31663:false, iso31662: true });
        //console.log('iso31662', result)
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
            [ 'l', 'AI', 'ISO-3166-1'],
            [ 'l', 'AIA', 'ISO-3166-1' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Anguilla', 'countryName' ],
            [ 'L', 'ISO-3166-3' ],
            [ 'l', 'DJ', 'ISO-3166-3' ]
        ]
      ));
    })

    it('should handle ISO-3166-3 correctly with pessimistic input', () => {
        const input: InputData = {
            countryCode: 'XX' // Assuming 'AN' has an ISO-3166-3 change
        };

        const result = ngeotags(input, { iso31663: true });
        //console.log('iso31663', result)
        expect(result).toEqual([]);
    });



    it('should return original value if not included in ISO-3166-3 changes', () => {
        const result = ngeotags({ countryCode: 'DE' }, { iso31663: true, iso31661: true }); // Assuming 'AN' has an ISO 3166-3 change
        //console.log('iso-3166-3 no changes:', result)
        expect(result).toEqual(expect.arrayContaining([
            ['L', 'ISO-3166-1'],
            [ 'l', 'DE', 'ISO-3166-1' ],
            [ 'l', 'DEU', 'ISO-3166-1' ],
        ]))
    });



    it('should handle city name correctly', () => {
        const input: InputData = {
            cityName: 'Budapest'
        };

        const result = ngeotags(input, { cityName: true });
        //console.log(result)
        expect(result).toEqual(expect.arrayContaining([
            ['L', 'cityName'],
            ['l', 'Budapest', 'cityName']
        ]));
    });

    it('should include Earth as planet when enabled', () => {
        const input: InputData = { planetName: 'Earth' };

        const result = ngeotags(input, { planetName: true });
        //console.log('planetName', result)
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
        //console.log('country and countryCode are false', result)
        expect(result).toEqual(expect.not.arrayContaining([
            ['L', 'countryCode'],    
            [ 'l', 'HU', 'ISO-3166-1' ],
            [ 'l', 'HUN', 'ISO-3166-1' ],
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
        //console.log('region and regionCode are false', result)
        expect(result).toEqual(expect.not.arrayContaining([
            ['L', 'regionCode'],    
            [ 'l', 'HU-BU', 'ISO-3166-2' ]
        ]))
    })

});

describe('namespace inflection', () => {


    it('should handle countryCodes correctly when isoAsNamespace is false', () => {
        const input: InputData = {
            countryCode: 'HU',
        };

        const opts: Options = {
            // continentCode: true,
            isoAsNamespace: false,
            iso31661: true,
            iso31662: true,
            iso31663: true
        }

        const result = ngeotags(input, opts);
        //console.log('isoAsNamespace is false', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'L', 'ISO-3166-1' ],
            [ 'L', 'ISO-3166-1' ],
            [ 'l', 'HU', 'ISO-3166-1' ],
            [ 'l', 'HUN', 'ISO-3166-1' ],
            [ 'L', 'countryName' ],
            [ 'l', 'Hungary', 'countryName' ]
          ]));
    });
    // it('should handle continent code correctly when unM49AsNamespace is false', () => {
    //     const input: InputData = {
    //         continentCode: 'EU',
    //     };

    //     const opts: Options = {
    //         continentCode: true,
    //         unM49AsNamespace: false,
    //         iso31661: true,
    //         iso31662: true,
    //         iso31663: true
    //     }

    //     const result = ngeotags(input, opts);
    //     //console.log('unM49AsNamespace is false', result)
    //     expect(result).toEqual(expect.arrayContaining([ 
    //         [ 'L', 'continentCode' ], 
    //         [ 'g', 'EU', 'continentCode' ] 
    //     ]));
    // });
    
})

// describe('dedupe()', () => {
//     it('should add a non-duplicate ISO-3166-3 tag', () => {
//         const tags = [
//             ['g', 'US', 'ISO-3166-1', 'alpha-2'],
//             ['g', 'HU', 'ISO-3166-3', 'alpha-2']
//         ];

//         const result = dedupe(tags);
//         expect(result).toContainEqual(['g', 'HU', 'ISO-3166-3', 'alpha-2']);
//     });

    // it('should not add an ISO-3166-3 tag if it duplicates an existing tag', () => {
    //     const tags = [
    //         ['g', 'US', 'ISO-3166-1', 'alpha-2'],
    //         ['g', 'US', 'ISO-3166-3', 'alpha-2']
    //     ];
    //     const result = dedupe(tags);
    //     //console.log('dedupe', result)
    //     expect(result).not.toContainEqual(['g', 'US', 'ISO-3166-3', 'alpha-2']);
    // });

//     it('should correctly handle a mix of ISO-3166-1, ISO-3166-2, and ISO-3166-3 tags, including edge cases', () => {
//         const tags: GeoTags[] = [
//             ['g', 'US', 'ISO-3166-1', 'alpha-2'], // ISO-3166-1 tag
//             ['g', 'USA', 'ISO-3166-1', 'alpha-3'], // ISO-3166-1 tag
//             ['g', 'US-NY', 'ISO-3166-2'],  // ISO-3166-2 tag
//             ['g', 'US', 'ISO-3166-3', 'alpha-2'], // Duplicate ISO-3166-3 tag
//             ['g', 'XY', 'ISO-3166-3', 'alpha-2'], // Non-duplicate ISO-3166-3 tag
//             ['x'], // Edge case with unexpected tag type
//         ];

//         const result = dedupe(tags);
//         //console.log('dedupe 3', result)

//         expect(result).toEqual(expect.arrayContaining([
//             [ 'g', 'US', 'ISO-3166-1', 'alpha-2' ],
//             [ 'g', 'USA', 'ISO-3166-1', 'alpha-3' ],
//             [ 'g', 'US-NY', 'ISO-3166-2' ],
//             [ 'g', 'XY', 'ISO-3166-3', 'alpha-2' ]
//         ]))
//     })
// });


describe('sortTagsByKey()', () => {

    it('should sort tags', () => {
        const tags: GeoTags[] = [
            [ 'g', 'HU', 'countryCode'],
            [ 'L', 'countryCode' ],
            [ 'g', 'HUN', 'countryCode' ],
          ];

        //console.log('before sort', tags)

        const result = sortTagsByKey(tags);
        //console.log('after sort', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'L', 'countryCode' ],
            [ 'g', 'HU', 'countryCode' ],
            [ 'g', 'HUN', 'countryCode'],
          ]));
    });
})

describe('filterOutType()', () => {
    it('should filter out tags by type', () => {
        const tags: GeoTags[] = [
            ['g', 'HU', 'countryCode'],
            ['g', 'HUN', 'countryCode'],
            ['g', 'HU-BU', 'regionCode']
        ];

        const result = filterOutType(tags, 'countryCode');
        //console.log('filterOutType', result)
        expect(result).toEqual(expect.arrayContaining([
            ['g', 'HU-BU', 'regionCode']
        ]));
    });
})

describe('filterNonStringTags()', () => {   
    it('should filter out tags that are not strings', () => {
        const tags: GeoTags[] = [
            ['g', null, ''],
            ['g', 3, ''],
            ['g', true, ''],
            ['g', undefined, ''],
            ['g', {}, ''],
            ['g', [], ''],
            ['g', new Set(), ''],
            ['g', new Map(), '']
        ];
        const result = filterNonStringTags(tags);
        //console.log('filterNonStringTags', result)
        expect(result).toEqual([]);
    })
})