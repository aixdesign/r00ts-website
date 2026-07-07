--
-- Up
--

CREATE TABLE Entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    ip TEXT NOT NULL,
    network_id INTEGER,
    submitted INTEGER NOT NULL,
    UNIQUE (hostname, ip)
);

CREATE TABLE Sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT UNIQUE NOT NULL,
    submitted INTEGER NOT NULL
);

CREATE TABLE SessionEntries (
    session_id INTEGER,
    entry_id INTEGER,
    FOREIGN KEY(session_id) REFERENCES Sessions(id),
    FOREIGN KEY(entry_id) REFERENCES Entries(id),
    PRIMARY KEY (session_id, entry_id)
);

CREATE TABLE SessionsDatacenters (
    session_id INTEGER,
    datacenter_id INTEGER,
    FOREIGN KEY(session_id) REFERENCES Sessions(id),
    FOREIGN KEY(datacenter_id) REFERENCES Datacenters(id),
    PRIMARY KEY (session_id, datacenter_id)
);

--
-- Down
--

DROP TABLE Entries;
DROP TABLE Sessions;
DROP TABLE SessionEntries;
DROP TABLE SessionsDatacenters;
