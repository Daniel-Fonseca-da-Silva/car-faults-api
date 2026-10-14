// Timestamp columns are `timestamp without time zone` holding UTC, and
// node-postgres reads and writes them in the process time zone. Pinning the
// process to UTC keeps that true wherever the API runs: a host in another
// zone would otherwise shift every value, cursors included. Import this
// first in every entry point, before any database value is handled.
process.env.TZ = 'UTC';

export {};
