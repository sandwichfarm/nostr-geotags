

import { describe, it, expect, vi} from 'vitest';
import ngeotags, { InputData, Options, Tag, logger } from './index'; // Adjust the import path as needed



// let ngeotags: (input: InputData, options?: Options) => Tag[];

describe('ngeotags', () => {
    // it('should output console.log when debug is true', () => {
    //     const input: InputData = {
    //         dedupe: true,
    //         lat: 47.5636,
    //         lon: 19.0947,
    //         city: 'Budapest',
    //         country: 'Hungary',
    //         regionName: 'Budapest',
    //         countryCode: 'HU',
    //         continent: 'Europe',
    //         continentCode: 'EU',
    //         planet: 'Earth'
    //     };
    //     const result = ngeotags(input, { iso31661: true, debug: true });
    //     expect(logSpy).toHaveBeenCalled();
    // })

    it('should not apply ISO-3166-3 changes when applyChanges is false', () => {
        const input: InputData = {
            dedupe: true,
            countryCode: 'HU',
        };
        const options: Options = {
            iso31661: true,
            iso31663: true,
            applyChanges: false,
        };

        const result = ngeotags(input, options);
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Hungary', 'country', 'ISO-3166-1:name' ],
            [ 'g', 'HU', 'countryCode', 'ISO-3166-3:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-3:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-3:numeric' ],
            [ 'g', 'Hungary', 'country', 'ISO-3166-3:name' ]
        ]));
    })

    it('should not dedupe when dedupe is false', () => {
        const input: InputData = {
            countryCode: 'HU',
        };
        const options: Options = {
            iso31661: true,
            iso31663: true,
            dedupe: false,
            applyChanges: true
        };

        const result = ngeotags(input, options);
        // console.log(result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', 'HU', 'countryCode', 'ISO-3166-1:alpha2' ],
            [ 'g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3' ],
            [ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ],
            [ 'g', 'Hungary', 'country', 'ISO-3166-1:name' ],
        ]));
    })



    it('should generate tags correctly with all options enabled', () => {
        const input: InputData = {
            dedupe: true,
            lat: 47.5636,
            lon: 19.0947,
            city: 'Budapest',
            country: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            continent: 'Europe',
            continentCode: 'EU',
            planet: 'Earth'
        };

        const options: Options = {
            dedupe: true,
            applyChanges: true,
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
            continentCode: true
        };

        const result = ngeotags(input, options);
        // console.log(result)
        expect(result).toHaveLength(28);
    });

    it('should generate tags correctly with default options', () => {
        const input: InputData = {
            dedupe: true,
            lat: 47.5636,
            lon: 19.0947,
            city: 'Budapest',
            country: 'Hungary',
            regionName: 'Budapest',
            countryCode: 'HU',
            continent: 'Europe',
            continentCode: 'EU',
            planet: 'Earth'
        };

        const result = ngeotags(input);
        console.log(result)
        // expect(result).toHaveLength(27);
    });

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
            gps: true,
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
        console.log(result)
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
            ['g', 'Hungary', 'country', 'ISO-3166-1:name']
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
            ['g', 'Budapest', 'region', 'ISO-3166-2:name'],
            ['g', 'HU', 'countryCode', 'ISO-3166-2:parent']
        ]));
    });

    it('should handle ISO-3166-3 correctly', () => {
        const input: InputData = {
            // iso31663: true,
            countryCode: 'AI' // Assuming 'AN' has an ISO-3166-3 change
        };

        const result = ngeotags(input, { iso31663: true });
        console.log(result.length, result);
        
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', 'DJ', 'countryCode', 'ISO-3166-3:alpha2' ],
            [ 'g', 'AIA', 'countryCode', 'ISO-3166-3:alpha3' ],
            [ 'g', '660', 'countryCode', 'ISO-3166-3:numeric' ],
            [ 'g', 'Anguilla', 'country', 'ISO-3166-3:name' ]
        ]));
    });

    it('should return original value if not inncluded in ISO-3166-3 changes', () => {
        const result = ngeotags({ countryCode: 'DE' }, { iso31663: true, iso31661: true }); // Assuming 'AN' has an ISO 3166-3 change
        console.log('no changes:', result)
        expect(result).toEqual(expect.arrayContaining([
            [ 'g', 'DE', 'countryCode', 'ISO-3166-3:alpha2' ],
            [ 'g', 'DEU', 'countryCode', 'ISO-3166-3:alpha3' ],
            [ 'g', '276', 'countryCode', 'ISO-3166-3:numeric' ],
            [ 'g', 'Germany', 'country', 'ISO-3166-3:name' ]
        ]))
    });



    it('should handle city name correctly', () => {
        const input: InputData = {
            city: 'Budapest'
        };

        const result = ngeotags(input, { city: true });
        expect(result).toContainEqual(['g', 'Budapest', 'city']);
    });

    it('should handle continent name correctly', () => {
        const input: InputData = {
            continent: 'Europe'
        };

        const result = ngeotags(input, { continent: true });
        expect(result).toContainEqual(['g', 'Europe', 'continent']);
    });

    it('should handle continent code correctly', () => {
        const input: InputData = {
            continentCode: 'EU'
        };

        const result = ngeotags(input, { continentCode: true });
        expect(result).toContainEqual(['g', 'EU', 'continentCode']);
    });

    it('should include Earth as planet when enabled', () => {
        const input: InputData = {};

        const result = ngeotags(input, { planet: true });
        expect(result).toContainEqual(['g', 'Earth', 'planet']);
    });

    it('should not include Earth as planet by default', () => {
        const input: InputData = {};

        const result = ngeotags(input, {});
        expect(result.some(tag => tag[2] === 'planet')).toBeFalsy();
    });
});


// import { describe, it, expect } from 'vitest';
// import ngeotags from './index'; // Adjust the import path as needed


// describe('ngeotags', () => {
//     it('should throw an error if input is null', () => {
//         expect(() => ngeotags(null)).toThrow('Input is required');
//     });

//     it('should throw an error if input is not an object', () => {
//         expect(() => ngeotags(42 as any)).toThrow('Input must be an object');
//     });

//     it('should correctly transform gps coordinates', () => {
//         const result = ngeotags({ lat: 47.5636, lon: 19.0947 });
//         expect(result).toContainEqual(['g', '47.5636,19.0947', 'gps']);
//         console.log('result:', result)
//     });

//     it('should correctly transform geohash', () => {
//         const result = ngeotags({ lat: 47.5636, lon: 19.0947 });
//         const geohash = result.find(tag => tag[2] === 'geohash');
//         expect(geohash).toBeDefined();
//     });

//     describe('ISO-3166-1', () => {

//         it('should correctly transform ISO-3166-1 country name', () => {
//             const result = ngeotags({ countryCode: 'HU' }, { iso31661: true });
//             const countryNames = result.filter(tag => tag?.[3] && tag[3].includes('ISO-3166-1'));
//         });

//         it('should correctly transform ISO-3166-1 data', () => {
//             const result = ngeotags({ countryCode: 'HU' }, { iso31661: true });
//             console.log('result', result)
//             expect(result).toContainEqual(['g', 'HU', 'countryCode', 'ISO-3166-1:alpha2']);
//             expect(result).toContainEqual(['g', 'HUN', 'countryCode', 'ISO-3166-1:alpha3']);
//             expect(result).toContainEqual([ 'g', '348', 'countryCode', 'ISO-3166-1:numeric' ]);
//             expect(result).toContainEqual([ 'g', 'Hungary', 'countryCode', 'ISO-3166-1:name' ]);
//         });
//     })

//     describe('ISO-3166-2', () => {

//         it('should correctly transform ISO-3166-2 region code', () => {
//             const result = ngeotags({ countryCode: 'HU', regionName: 'Budapest' }, {iso31662: true});
//             console.log(result)
//             const regionCodes = result.filter(tag => tag?.[3] && tag[3]?.includes('ISO-3166-2'));
//             expect(regionCodes.length).toBe(3)
//             expect(result).toContainEqual([ 'g', 'HU-BU', 'regionCode', 'ISO-3166-2:code' ])
//             expect(result).toContainEqual([ 'g', 'Budapest', 'regionCode', 'ISO-3166-2:name' ])
//             expect(result).toContainEqual([ 'g', 'HU', 'regionCode', 'ISO-3166-2:parent' ])
//         });
//     })

//     describe('ISO-3166-3', () => {
//         it('should correctly transform ISO-3166-3 changes', () => {
//             const result = ngeotags({ countryCode: 'AI' }, { iso31663: true, iso31661: false }); // Assuming 'AN' has an ISO 3166-3 change
//             // expect(result.length).toBe(4)
//             expect(result).toContainEqual([ 'g', 'DJ', 'countryCode', 'ISO-3166-3:alpha2' ]);
//             expect(result).toContainEqual( [ 'g', 'AIA', 'countryCode', 'ISO-3166-3:alpha3' ]);
//             expect(result).toContainEqual([ 'g', '660', 'countryCode', 'ISO-3166-3:numeric' ]);
//             expect(result).toContainEqual([ 'g', 'Anguilla', 'countryCode', 'ISO-3166-3:name' ]);
//             // Add checks for other fields as needed
//         });

//         it('should return original value if not inncluded in ISO-3166-3 changes', () => {
//             const result = ngeotags({ countryCode: 'DE' }, { iso31663: true, iso31661: false }); // Assuming 'AN' has an ISO 3166-3 change
//             console.log('no changes:', result)
//             // expect(result.length).toBe(4)
//             expect(result).toContainEqual([ 'g', 'DE', 'countryCode', 'ISO-3166-3:alpha2' ])
//             expect(result).toContainEqual([ 'g', 'DEU', 'countryCode', 'ISO-3166-3:alpha3' ])
//             expect(result).toContainEqual([ 'g', '276', 'countryCode', 'ISO-3166-3:numeric' ])
//             expect(result).toContainEqual([ 'g', 'Germany', 'countryCode', 'ISO-3166-3:name' ])
//         });
//     })



//     it('should correctly transform city name', () => {
//         const result = ngeotags({ city: 'Budapest' });
//         console.log('city:', result)
//         expect(result).toContainEqual(['g', 'Budapest', 'city']);
//     });

//     it('should correctly transform continent name', () => {
//         const result = ngeotags({ continent: 'Europe' });
//         expect(result).toContainEqual(['g', 'Europe', 'continent']);
//     });

//     it('should correctly transform continent code', () => {
//         const result = ngeotags({ continentCode: 'EU' });
//         expect(result).toContainEqual(['g', 'EU', 'continentCode']);
//     });

//     it('should include not include Earth as planet by default', () => {
//         const result = ngeotags({}, {}).find(tag => tag[2] === 'planet') || [];
//         expect(result.length).toBe(0);
//     });

//     it('should include should Earth when enabled', () => {
//         const result = ngeotags({}, {planet: true});
//         expect(result).toContainEqual(['g', 'Earth', 'planet']);
//     });

//     it('should correctly transform geohashes of diminishing resolution', () => {
//         const result = ngeotags({ lat: 47.5636, lon: 19.0947 });
//         const geohashTags = result.filter(tag => tag[2] === 'geohash');
//         expect(geohashTags.length).toBeGreaterThan(1); // Expect multiple geohash resolutions
//     });

//     it('should return all possible geotags', () => {
//         const input = {
//             "status": "success",
//             "continent": "Europe",
//             "continentCode": "EU",
//             "country": "Hungary",
//             "countryCode": "HU",
//             "region": "BU",
//             "regionName": "Budapest",
//             "city": "Budapest",
//             "district": "",
//             "zip": "1124",
//             "lat": 47.5636,
//             "lon": 19.0947,
//             "timezone": "Europe/Budapest",
//             "offset": 3600,
//             "currency": "HUF",
//             "isp": "Magyar Telekom",
//             "org": "",
//             "as": "AS5483 Magyar Telekom plc.",
//             "asname": "MAGYAR-TELEKOM-MAIN-AS",
//             "mobile": false,
//             "proxy": false,
//             "hosting": false
//         }
//         const result = ngeotags(input, { iso31661: true, iso31662: true, iso31663: true, planet: true });
//         console.log(result.length)
//         console.log('FULL result:', result)
//         expect(result.length).toBe(25);
//     })
// });
