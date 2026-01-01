export const DB_NAME = 'cnsdr.db';

export const LEGACY_DB_NAME = 'consdr.db';

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  whyText TEXT,
  feeling INTEGER NOT NULL,
  confidence INTEGER NOT NULL,
  tradeoffGains TEXT NOT NULL,
  tradeoffLosses TEXT NOT NULL,
  tags TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_decisions_createdAt ON decisions(createdAt);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(category);
`;
