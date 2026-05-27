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
    network_name: string,
    organisation_name: string,
    description: string,
    ip_start: string,
    start_int: number,
    ip_end: string,
    end_int: number,
    ip_cidr: string,
    asn: number,
    clues: string,
};

export interface Datacenter {
    id: number,
    fac_id: number,
    identified: boolean,
    name: string,
    lat: number,
    lon: number,
    links: string,
    city: string,
    country_code: string,
    last_update: number,
};

export interface PostResult {
    success: boolean,
    code: number,
    reason?: string
};
