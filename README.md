# Stubline: Event Ticketing & Venue Booking

A ticketing system with three roles: Administrator, Organiser and Customer.

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** PHP (REST API using PDO)
- **Database:** MySQL (`ticketing_db`)

> **Important:** the frontend cannot work on its own. It loads all of its data
> from the PHP backend and the MySQL database, so both must be running
> (see "How to run" below).

## Project structure

```
ticketing-api/            (backend, place inside htdocs)
├── config/database.php
└── api/ users.php, venues.php, events.php, bookings.php, login.php, register.php

frontend/
├── index.html
├── css/style.css
└── js/ core.js, auth.js, admin.js, organiser.js, customer.js, main.js

ticketing_db.sql          (database structure and sample data)
```

## How to run (XAMPP)

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Copy the `ticketing-api` folder into `C:\xampp\htdocs\`.
3. Open `http://localhost/phpmyadmin`, go to the **Import** tab, choose `ticketing_db.sql` and click **Go**.
4. Open `frontend/index.html` in a browser (or copy the `frontend` folder into `htdocs` and visit `http://localhost/frontend/`).
5. If your API folder has a different name, change the `API` constant at the top of `js/core.js`.

## Demo accounts

All accounts use the password `password123`.

| Role | Email |
|---|---|
| Administrator | admin1@test.com |
| Organiser | organiser1@test.com, organiser2@test.com |
| Customer | customer1@test.com |

## Main features

- **Administrator:** manage users, venues, all events and all bookings.
- **Organiser:** create, edit and delete own events; manage bookings for own events.
- **Customer:** search and book events, view ticket prices in other currencies (external exchange-rate API), cancel own bookings.

## Notes

- Currency conversion requires an internet connection.
- Deleting a user, venue or event also deletes the related events and bookings.
- To reset the data, re-import `ticketing_db.sql`.
