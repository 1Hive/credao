CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE jwt_token as (
  role TEXT,
  user_id INTEGER
);

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS integer AS $$
  SELECT nullif(current_setting('jwt.claims.user_id', TRUE),'')::integer;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION updated_at() RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_key() RETURNS TRIGGER AS $$
  BEGIN
    NEW.auto_key = '0x' || right(encode(gen_random_bytes(32), 'hex'), 64);
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_target() RETURNS TRIGGER AS $$
  BEGIN
    PERFORM pg_notify('new_target', NEW.target);
    RETURN NULL;
  END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_id INTEGER UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  email VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE updated_at();

CREATE TABLE IF NOT EXISTS installations (
  id SERIAL PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  name VARCHAR NOT NULL UNIQUE,
  github_token VARCHAR,
  target VARCHAR,
  cred JSON,
  dao VARCHAR,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER installations_updated_at
  BEFORE UPDATE ON installations
  FOR EACH ROW
  EXECUTE PROCEDURE updated_at();

CREATE TRIGGER installations_new_target
  AFTER INSERT ON installations
  FOR EACH ROW
  WHEN (NEW.target IS NOT NULL)
  EXECUTE PROCEDURE notify_new_target();

CREATE TABLE IF NOT EXISTS contributors (
  installation_id INTEGER REFERENCES installations(id),
  user_id INTEGER REFERENCES users(id),
  address VARCHAR,
  auto_key VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contributors_pkey PRIMARY KEY (installation_id, user_id)
);
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER contributors_updated_at
  BEFORE UPDATE ON contributors
  FOR EACH ROW
  EXECUTE PROCEDURE updated_at();

CREATE TRIGGER contributors_auto_key
  BEFORE INSERT ON contributors
  FOR EACH ROW
  EXECUTE PROCEDURE auto_key();

CREATE OR REPLACE FUNCTION ensure_contributor_from_username(
    installation_id INTEGER,
    username VARCHAR
  ) returns contributors as $$
  DECLARE
    _user_id INTEGER;
    _contributor contributors;
    _installation_id ALIAS FOR installation_id;
    _username ALIAS FOR username;
  BEGIN
    SELECT id INTO _user_id FROM users WHERE users.username = _username;
    IF NOT FOUND THEN
      INSERT INTO users ("username") VALUES (_username) RETURNING id INTO _user_id;
    END IF;

    SELECT * INTO _contributor FROM contributors WHERE user_id = _user_id AND contributors.installation_id = _installation_id;
    IF NOT FOUND THEN
      INSERT INTO contributors ("user_id", "installation_id") VALUES (_user_id, _installation_id)
        RETURNING * INTO _contributor;
    END IF;

    RETURN _contributor;
  END;
$$ language plpgsql strict security definer;

-- INSERT INTO users(username) VALUES('peach');
-- INSERT INTO installations(github_id, name, owner_id) VALUES(123, 'anorg', 1);
-- SELECT ensure_contributor_from_username(1, 'ralph');

CREATE TABLE "session" (
 "sid" varchar NOT NULL COLLATE "default",
 "sess" json NOT NULL,
 "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

DROP ROLE IF EXISTS admin_role;
CREATE ROLE admin_role;
GRANT admin_role to postgres;

DROP ROLE IF EXISTS user_role;
CREATE ROLE user_role;
GRANT user_role to admin_role;

DROP ROLE IF EXISTS default_role;
CREATE ROLE default_role;
GRANT default_role to user_role;

CREATE POLICY admin_users ON users TO admin_role USING (true) WITH CHECK (true);
CREATE POLICY admin_installations ON installations TO admin_role USING (true) WITH CHECK (true);
CREATE POLICY admin_contributors ON contributors TO admin_role USING (true) WITH CHECK (true);

CREATE POLICY user_users ON users TO user_role USING (id = get_user_id());
CREATE POLICY user_insert_users ON users FOR INSERT TO user_role WITH CHECK (true);
CREATE POLICY user_select_installations ON installations FOR SELECT TO user_role USING (true);
CREATE POLICY user_update_installations ON installations FOR UPDATE TO user_role USING (owner_id = get_user_id());
CREATE POLICY user_select_contributors ON contributors FOR SELECT TO user_role USING (user_id = get_user_id());
CREATE POLICY user_insert_contributors ON contributors FOR INSERT TO user_role WITH CHECK (installation_id IN (SELECT id FROM installations WHERE user_id = get_user_id()));
CREATE POLICY user_update_contributors ON contributors FOR UPDATE TO user_role USING (user_id = get_user_id());

GRANT USAGE ON SCHEMA public TO default_role;
GRANT SELECT, UPDATE(email) ON users TO user_role;
GRANT SELECT, UPDATE(name, dao, owner_id) ON installations TO user_role;
GRANT SELECT, UPDATE(address) ON contributors TO user_role;
REVOKE ALL ON FUNCTION ensure_contributor_from_username(installation_id INTEGER, username VARCHAR) FROM public;
GRANT EXECUTE ON FUNCTION ensure_contributor_from_username(installation_id INTEGER, username VARCHAR) TO user_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_role;
