DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS channels;

CREATE TABLE users (
    id int(11) not null auto_increment,
    username varchar(100) not null,

    unique key (username),
    primary key (id)
) engine=InnoDB default charset=utf8;

CREATE TABLE channels (
    id int(11) not null auto_increment,
    channel_name varchar(100) not null,

    unique key (channel_name),
    primary key (id)
) engine=InnoDB default charset=utf8;

CREATE TABLE logs (
    id int(11) not null auto_increment,
    channel_name varchar(100) not null,
    username varchar(100) not null,
    payload text not null,

    primary key (id),
    foreign key (channel_name) references channels(channel_name)
        on delete cascade
        on update cascade,
    foreign key (username) references users(username)
        on delete cascade
        on update cascade
) engine=InnoDB default charset=utf8;

INSERT INTO channels VALUES (NULL, 'testing');