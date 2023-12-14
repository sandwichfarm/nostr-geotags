import { describe, it, expect } from 'vitest';
import ngeotags from './index'; // Adjust the import path as needed

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
    });

    it('should correctly transform geohash', () => {
        const result = ngeotags({ lat: 47.5636, lon: 19.0947 });
        const geohash = result.find(tag => tag[2] === 'geohash');
        expect(geohash).toBeDefined();
    });

    it('should correctly transform ISO-3166-1 country name', () => {
        const result = ngeotags({ countryCode: 'HU' });
        const countryName = result.find(tag => tag[2] === 'ISO-3166-1');
        expect(countryName).toBeDefined();
    });

    it('should correctly transform ISO-3166-2 region code', () => {
        const result = ngeotags({ country: 'HU', regionName: 'Budapest' });
        const regionCode = result.find(tag => tag[2] === 'ISO-3166-2');
        expect(regionCode).toBeDefined();
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

    it('should include Earth as planet by default', () => {
        const result = ngeotags({});
        expect(result).toContainEqual(['g', 'Earth', 'planet']);
    });
});
