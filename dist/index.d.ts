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
declare const _default: (input: InputData | null) => Array<[string, string, string]>;
export default _default;
