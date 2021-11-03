create extension if not exists "uuid-ossp";

drop table if exists friendship;
drop table if exists users;

create table users ( 
    userId serial unique,
    username varchar not null unique,
    first_name varchar, 
    last_name varchar, 
    email varchar not null unique,
    age int,
    snack varchar,
    animal_type varchar,
    follower_count int not null default 0,
    following_count int not null default 0,
    thumbnail bytea,
    oauth boolean default false,
    password_hash varchar not null
);

create table friendship (
  friendshipId serial unique,
  userEmail varchar,
  friendEmail varchar,
  CreatedDateTime timestamp,
  constraint fk_friendship primary key (userEmail, friendEmail),
  constraint fk_user foreign key (userEmail) references users(email)
  on delete cascade on update cascade,
  constraint fk_friend foreign key (friendEmail) references users(email)
  on delete cascade on update cascade
);

-------------------------------------------------------------

drop function if exists up_user_exists;
create function up_user_exists ( _email varchar) returns boolean as $$

select
    (case
        when count(userId) >= 1 then true
        else false
    end) as exists
from users
where email = _email

$$ language sql;

-------------------------------------------------------------

drop function if exists up_user_create;
create function up_user_create ( _email varchar, _password_hash varchar, _first_name varchar, _last_name varchar, _username varchar, _oauth boolean) returns json as $$

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
returning row_to_json(row(userId, first_name, last_name, email, password_hash));

$$ language sql;

-------------------------------------------------------------

drop function if exists up_user_get;
create function up_user_get ( _userId int) returns json as $$

select
    array_to_json(
        array_agg(
            row_to_json(u)
    ))
from ( select * from users where userId = _userId ) u

$$ language sql;

-------------------------------------------------------------

drop function if exists up_user_get_email;
create function up_user_get_email ( _email varchar) returns json as $$

select
    array_to_json(
        array_agg(
            row_to_json(u)
    ))
from ( select * from users where email = _email ) u

$$ language sql;

-------------------------------------------------------------

drop function if exists up_user_deactivate;
create function up_user_deactivate ( _userId int) returns void as $$

delete from users where userId = _userId

$$ language sql;

