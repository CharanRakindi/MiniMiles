
-- Table: destinations
CREATE TABLE destinations (
    destination_id INTEGER PRIMARY KEY ,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    location TEXT,
    price REAL,
    bookable BOOLEAN,
    room_capacity INTEGER,
    latitude REAL,
    longitude REAL
);

-- Table: bookings
CREATE TABLE bookings (
    booking_id INTEGER PRIMARY KEY ,
    user_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    full_name TEXT,
    email TEXT,
    check_in_date DATE,
    guests INTEGER,
    notes TEXT,
    status TEXT,
    booked_at DATETIME,
    check_out_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (destination_id) REFERENCES destinations(destination_id)
);

-- Table: ratings
CREATE TABLE ratings (
    rating_id INTEGER PRIMARY KEY ,
    resort_id INTEGER NOT NULL,
    user_name TEXT,
    rating INTEGER,
    review TEXT,
    created_at DATETIME,
    FOREIGN KEY (resort_id) REFERENCES destinations(destination_id)
);

-- Table: users
CREATE TABLE users (
    id INTEGER PRIMARY KEY ,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_pic_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
