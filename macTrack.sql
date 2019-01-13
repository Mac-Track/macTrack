DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS food_entry;
DROP TABLE IF EXISTS exercise;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  sex VARCHAR(255),
  age NUMERIC,
  height NUMERIC,
  weight NUMERIC,
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

CREATE TABLE exercise (
  id SERIAL PRIMARY KEY,
  fk_users INTEGER REFERENCES users,
  date VARCHAR(255),
  name VARCHAR(255),
  calories NUMERIC,
  image_url VARCHAR(255)
);

INSERT INTO users (
  name,
  sex,
  age,
  height,
  weight,
  activity_level,
  protein,
  fat,
  carbs,
  calories
) VALUES (
  'Towanda',
  'female',
  35,
  170,
  66,
  1.4,
  52,
  43,
  336,
  1940
);

INSERT INTO food_entry (
  fk_users,
  date,
  name,
  image_url,
  protein,
  fat,
  carbs,
  calories,
  serving_size,
  serving_unit
) VALUES (
  1,
  'Jan 12,2019',
  'Banana',
  'https://proxy.duckduckgo.com/iu/?u=https%3A%2F%2Fi.ytimg.com%2Fvi%2FtqnQdN4rDWU%2Fhqdefault.jpg',
  1.3,
  0.4,
  27,
  105,
  1,
  'banana'
);

INSERT INTO food_entry (
  fk_users,
  date,
  name,
  image_url,
  protein,
  fat,
  carbs,
  calories,
  serving_size,
  serving_unit
) VALUES (
  1,
  'Jan 12,2019',
  'Appletini',
  'https://proxy.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.bunkycooks.com%2Fwp-content%2Fuploads%2F2010%2F11%2FGreen-Appletini-close-up-2.jpg&f=1',
  0,
  0,
  6.7,
  149,
  1,
  'appletini'
);