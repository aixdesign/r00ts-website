--
-- Up
--

CREATE TABLE Notes (
    id INTEGER PRIMARY KEY,
    type INTEGER NOT NULL,
    title TEXT,
    url TEXT,
    body TEXT,
    timestamp INTEGER NOT NULL,
    datacenter_id INTEGER,
    FOREIGN KEY(datacenter_id) REFERENCES Datacenters(id)
);

CREATE TABLE Networks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network_name TEXT NOT NULL,
    organisation_name TEXT NOT NULL,
    description TEXT,
    ip_start TEXT NOT NULL,
    start_int INTEGER NOT NULL,
    ip_end TEXT NOT NULL,
    end_int INTEGER NOT NULL,
    ip_cidr TEXT NOT NULL UNIQUE,
    asn INTEGER,
    clues TEXT
);

CREATE TABLE Datacenters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fac_id INTEGER UNIQUE,
    identified INTEGER NOT NULL DEFAULT 0,
    name TEXT,
    lat NUMBER,
    lon NUMBER,
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

CREATE INDEX idx_ip_ranges_start ON Networks (start_int);
CREATE INDEX idx_ip_ranges_end ON Networks (end_int);

--
-- Down
--

DROP TABLE Notes;
DROP INDEX idx_ip_ranges_start;
DROP INDEX idx_ip_ranges_end;
DROP TABLE Datacenters;
DROP TABLE Networks;
DROP TABLE NetworksDatacenters;
