-- For development purpose only
-- creates database, username and password
-- RUN THIS SCRIPT ON LINUX WITH:
--      cat db_setup.sql | sudo -i -u postgres psql  

CREATE DATABASE game_of_lies_db;

CREATE USER developer WITH ENCRYPTED PASSWORD '123456';

GRANT ALL PRIVILEGES ON DATABASE game_of_lies_db TO developer;

ALTER DATABASE game_of_lies_db OWNER TO developer;
