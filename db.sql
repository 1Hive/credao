CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION updated_at() RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  email VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE updated_at();

CREATE TABLE IF NOT EXISTS installations (
  id SERIAL PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  name VARCHAR,
  github_token VARCHAR,
  target VARCHAR,
  dao VARCHAR,
  creator_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER installations_updated_at BEFORE UPDATE ON installations FOR EACH ROW EXECUTE PROCEDURE updated_at();

CREATE TABLE IF NOT EXISTS installation_users (
  installation_id INTEGER REFERENCES installations(id),
  user_id INTEGER REFERENCES users(id),
  address VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT installation_users_pkey PRIMARY KEY (installation_id, user_id)
);

CREATE TRIGGER installation_users_updated_at BEFORE UPDATE ON installation_users FOR EACH ROW EXECUTE PROCEDURE updated_at();

CREATE TABLE "session" (
 "sid" varchar NOT NULL COLLATE "default",
 "sess" json NOT NULL,
 "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
