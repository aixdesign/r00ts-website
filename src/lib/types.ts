export enum NoteType {
    Article,
    Image,
    Comment
};

export interface Note {
    id: number,
    type: NoteType,
    title?: string,
    url?: string,
    body?: string,
    date: number,
    datacenter_id?: number | null
};

export type NoteState = {
    data: Note[] | null;
    loading: boolean;
};

export interface Network {
    id: number,
    net_id: number,
    network_name: string,
    organisation_name: string,
    description: string,
    asn: number,
    last_update: number,
    clues?: string[],
};

export interface IpBlock {
    id: number,
    ip_start: string,
    start_int: number,
    ip_end: string,
    end_int: number,
    ip_cidr: string,
    network_id: number,
};

export interface PeeringNetwork {
    id: number,
    asn: number,
    name: string,
    website: string,
    name_long: string,
};

export interface Facility {
    id: number,
    name: string,
    name_long: string,
    city: string,
    country: string,
    website: string,
    latitude?: number,
    longitude?: number,
};

export interface Datacenter {
    id: number,
    fac_id: number,
    name: string,
    lat: number,
    lon: number,
    precise: boolean,
    links: string,
    city: string,
    country_code: string,
    last_update: number,
};

export interface City {
    id: number,
    name: string,
    country_code: string,
    lat: number,
    lon: number
};

export interface PostResult {
    success: boolean,
    code: number,
    reason?: string
};

export type Weather = {
    weatherCode: number,
    temp: number,
    timestamp: number
};
