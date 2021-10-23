create extension if not exists "uuid-ossp";


create table if not exists users ( id varchar(100) primary key default uuid_generate_v4(), first_name varchar(50), last_name varchar(50), email varchar(100) not null, password_hash varchar(255) not null);


create or replace function up_user_exists ( _email varchar(100)) returns boolean as $$

select
    (case
        when count(id) >= 1 then true
        else false
    end) as exists
from users
where email = _email

$$ language sql;

-------------------------------------------------------------

create or replace function up_user_create ( _email varchar(100), _password_hash varchar(255), _first_name varchar(100), _last_name varchar(100)) returns json as $$

insert into users (
    email,
    password_hash,
    first_name,
    last_name
)
values (
    _email,
    _password_hash,
    _first_name,
    _last_name
)
returning row_to_json(row(id, first_name, last_name, email, password_hash));

$$ language sql;

-------------------------------------------------------------

create or replace function up_user_get ( _email varchar(100)) returns json as $$

select
    array_to_json(
        array_agg(
            row_to_json(u)
    ))
from ( select * from users where email = _email ) u

$$ language sql;

