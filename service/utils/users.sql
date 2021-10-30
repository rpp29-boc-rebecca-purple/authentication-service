create extension if not exists "uuid-ossp";

drop table if exists users;
create table users ( 
    id varchar primary key default uuid_generate_v4(),
    username varchar not null,
    first_name varchar, 
    last_name varchar, 
    email varchar not null,
    age int,
    snack varchar,
    follower_count int not null default 0,
    following_count int not null default 0,
    thumbnail bytea,
    oauth boolean default false,
    password_hash varchar not null
);

-------------------------------------------------------------

drop function up_user_exists;
create function up_user_exists ( _email varchar(100)) returns boolean as $$

select
    (case
        when count(id) >= 1 then true
        else false
    end) as exists
from users
where email = _email

$$ language sql;

-------------------------------------------------------------

drop function up_user_create;
create function up_user_create ( _email varchar(100), _password_hash varchar(255), _first_name varchar(100), _last_name varchar(100), _username varchar(100), _oauth boolean) returns json as $$

insert into users (
    email,
    password_hash,
    first_name,
    last_name,
    username,
    oauth
)
values (
    _email,
    _password_hash,
    _first_name,
    _last_name,
    _username,
    _oauth
)
returning row_to_json(row(id, first_name, last_name, email, password_hash));

$$ language sql;

-------------------------------------------------------------

drop function up_user_get;
create function up_user_get ( _email varchar(100)) returns json as $$

select
    array_to_json(
        array_agg(
            row_to_json(u)
    ))
from ( select * from users where email = _email ) u

$$ language sql;

