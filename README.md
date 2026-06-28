# 🗺️ MiniMiles — Weekend Trip Planner

A full-stack web application for discovering and booking weekend getaway destinations around **Hyderabad, India**. Browse temples, resorts, camping spots, and popular attractions — all in one place.

![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## ✨ Features

- **🔍 Explore Destinations** — Browse categorised listings for temples, resorts, camping sites, and tourist attractions around Hyderabad.
- **📖 Detailed Pages** — View rich destination pages with descriptions, photos, location maps, pricing, and user ratings.
- **📅 Online Booking** — Book rooms/stays with check-in/check-out dates, guest count, and special notes.
- **⭐ Ratings & Reviews** — Rate and review places you've visited.
- **👤 User Accounts** — Register, log in, manage your profile, and upload a profile photo.
- **📋 Booking Management** — View and cancel your bookings from your profile dashboard.
- **📱 Responsive Design** — Fully responsive UI that works on desktops, tablets, and mobile devices.

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript   |
| Backend    | PHP                               |
| Database   | MySQL                             |
| Server     | Apache (XAMPP)                    |
| Fonts      | Google Fonts (Permanent Marker)   |

---

## 📂 Project Structure

```
minimiles/
├── css/                    # Stylesheets
│   ├── styles.css          #   Main stylesheet
│   ├── detail.css          #   Destination detail page styles
│   └── profile.css         #   User profile page styles
├── js/                     # Client-side JavaScript
│   ├── header.js           #   Dynamic header/navigation
│   ├── footer.js           #   Dynamic footer
│   ├── auth.js             #   Login/register form handling
│   ├── detail.js           #   Destination detail page logic
│   ├── profile.js          #   Profile dashboard logic
│   ├── destination-cards.js#   Destination card components
│   ├── destination-list.js #   Destination listing logic
│   ├── form-manager.js     #   Booking form management
│   ├── rating-handler.js   #   Star rating UI & submission
│   ├── image-handler.js    #   Image loading utilities
│   └── utils.js            #   Shared utility functions
├── includes/               # PHP includes
│   ├── config.php          #   App configuration & env loader
│   ├── db_connect.php      #   Database connection helper
│   └── session_header.php  #   Session management
├── models/                 # Data models
│   ├── Booking.php         #   Booking CRUD operations
│   ├── Rating.php          #   Rating CRUD operations
│   └── User.php            #   User CRUD operations
├── images/                 # Destination & UI images
├── uploads/                # User-uploaded files (profile photos)
├── index.html              # Homepage
├── detail.html             # Destination detail page
├── login.html              # Login page
├── register.html           # Registration page
├── profile.html            # User profile & bookings dashboard
├── temples.html            # Temples category page
├── resorts.html            # Resorts category page
├── camping.html            # Camping category page
├── attractions.html        # Attractions category page
├── contact-us.html         # Contact page
├── database.sql            # Database schema
├── .htaccess               # Apache URL rewriting rules
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [XAMPP](https://www.apachefriends.org/) (or any Apache + PHP + MySQL stack)
- PHP 7.4+
- MySQL 5.7+

### Installation

1. **Clone the repository** into your web server's document root:
   ```bash
   git clone https://github.com/CharanRakindi/MiniMiles.git
   ```

2. **Create the database**:
   - Open [phpMyAdmin](http://localhost/phpmyadmin) (or use the MySQL CLI).
   - Create a new database named **`minimiles_db`**.
   - Import the schema from `database.sql`:
     ```sql
     SOURCE /path/to/minimiles/database.sql;
     ```

3. **Configure the database connection** (if needed):
   - Edit `includes/db_connect.php` and update the credentials:
     ```php
     $servername = "localhost";
     $username   = "root";
     $password   = "";       // your MySQL password
     $dbname     = "minimiles_db";
     ```

4. **Start Apache & MySQL** via the XAMPP Control Panel.

5. **Visit the app** at:
   ```
   http://localhost/minimiles/
   ```

---

## 📸 Categories

| Category        | Description                                                |
|-----------------|------------------------------------------------------------|
| 🛕 Temples      | Spiritual destinations — Yadadri, Chilkur, Birla Mandir…   |
| 🏖️ Resorts      | Weekend stays — Lahari, Leonia, Palm Exotica…              |
| ⛺ Camping      | Outdoor adventures — Ananthagiri, Mallela, Pocharam…       |
| 🎢 Attractions  | Fun & sightseeing — Wonderla, Snow World, Hussain Sagar…   |

---

## 🗄️ Database Schema

The app uses four tables:

- **`users`** — User accounts (name, email, password hash, profile picture)
- **`destinations`** — Places to visit (name, type, description, image, price, coordinates)
- **`bookings`** — User reservations (dates, guest count, status)
- **`ratings`** — User reviews and star ratings per destination

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available for personal and educational use.

---

<p align="center">Made with ❤️ for weekend explorers around Hyderabad</p>
