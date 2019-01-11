DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS food_entry;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  sex VARCHAR(255),
  age NUMERIC,
  height NUMERIC,
  activity_level NUMERIC,
  protein NUMERIC,
  fat NUMERIC,
  carbs NUMERIC,
  calories NUMERIC
);

CREATE TABLE food_entry (
  id SERIAL PRIMARY KEY,
  fk_users INTEGER REFERENCES users,
  date VARCHAR(255),
  name VARCHAR(255),
  image_url VARCHAR(255),
  protein NUMERIC,
  fat NUMERIC,
  carbs NUMERIC,
  calories NUMERIC,
  serving_size NUMERIC,
  serving_unit VARCHAR(255)
);