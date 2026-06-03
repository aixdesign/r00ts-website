--
-- Up
--

CREATE TABLE Networks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    net_id INTEGER UNIQUE,
    network_name TEXT NOT NULL,
    organisation_name TEXT NOT NULL,
    description TEXT,
    asn INTEGER UNIQUE,
    last_update INTEGER
);

CREATE TABLE IpBlocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_start TEXT NOT NULL,
    start_int INTEGER NOT NULL,
    ip_end TEXT NOT NULL,
    end_int INTEGER NOT NULL,
    ip_cidr TEXT NOT NULL UNIQUE,
    network_id INTEGER NOT NULL,
    FOREIGN KEY (network_id) REFERENCES Networks(id)
);

CREATE TABLE Datacenters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fac_id INTEGER UNIQUE,
    name TEXT,
    lat NUMBER,
    lon NUMBER,
    precise NUMBER,
    links TEXT,
    city TEXT,
    country_code TEXT,
    last_update INTEGER
);

CREATE TABLE NetworksDatacenters (
    network_id INTEGER,
    datacenter_id INTEGER,
    FOREIGN KEY(network_id) REFERENCES Networks(id),
    FOREIGN KEY(datacenter_id) REFERENCES Datacenters(id),
    PRIMARY KEY (network_id, datacenter_id)
);

CREATE TABLE Cities (
    name TEXT,
    country_code TEXT,
    lat NUMBER,
    lon NUMBER,
    PRIMARY KEY (name, country_code)
);

CREATE INDEX idx_ip_ranges_start ON IpBlocks (start_int);
CREATE INDEX idx_ip_ranges_end ON IpBlocks (end_int);

--
-- Down
--

DROP INDEX idx_ip_ranges_start;
DROP INDEX idx_ip_ranges_end;
DROP TABLE Datacenters;
DROP TABLE Networks;
DROP TABLE IpBlocks;
DROP TABLE Cities;
DROP TABLE NetworksDatacenters;
