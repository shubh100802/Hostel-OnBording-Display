# Hostel Onboarding Display System

A real-time, Google Sheets-based digital queue and counter display system for hostel onboarding, with live audio announcements and a modern, responsive UI.

---

## 🚀 Features

- **Google Sheets as Source of Truth:** All student data is managed in Google Sheets.
- **Live Queue Management:** Only students with "Room Allotted" = No are queued for onboarding.
- **Counter Assignment:** Students are auto-assigned to available counters; supports skip and done actions.
- **Block/Sheet-wise Configuration:** Each counter or group of counters can be mapped to a different Google Sheet.
- **Big Screen Display:** Modern, responsive display for TV/monitor, showing live counter status and queue.
- **Audio Announcements:** Student names and registration numbers are called out with an attention sound.
- **Admin Panel:** Secure login for wardens/admins to manage onboarding, mark done/skip, and set counters.
- **Real-Time Updates:** All changes are instantly reflected on all connected screens via Socket.IO.
- **MongoDB Atlas Auth:** Secure admin login with JWT and hashed passwords.

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Web Speech API, Socket.IO, Font Awesome, Google Fonts
- **Backend:** Node.js, Express, Socket.IO, Google Sheets API, MongoDB Atlas, JWT, bcrypt
- **Deployment:** Ready for Render, Heroku, or any Node.js-friendly cloud

---

## 📦 Setup Instructions

### 1. Clone the Repository

```sh
git clone https://github.com/shubh100802/Hostel-OnBording-Display.git
cd Hostel-OnBording-Display
```

### 2. Backend Setup

- Go to the `backend` directory:
  ```sh
  cd backend
  ```
- Install dependencies:
  ```sh
  npm install
  ```
- Create a `.env` file with your credentials:
  ```
  MONGODB_URI=your_mongodb_atlas_uri
  JWT_SECRET=your_jwt_secret
  ```
- Place your Google service account credentials as `google-credentials.json` in the `backend` folder.

### 3. Google Sheets Setup

- Create your Google Sheets for each block/counter as needed.
- Share each sheet with your service account email.
- Update the backend mapping/config to link counters to the correct sheet IDs.

### 4. Add Admin/Warden Users

- Use the provided `addUser.js` script in the backend to add users:
  ```sh
  node addUser.js
  ```
- Example in `addUser.js`:
  ```js
  addUser('wardenbh2@vitbhopal.ac.in', 'wardenbh2@2025', 'Block 2');
  ```

### 5. Start the Backend

```sh
npm start
```

### 6. Frontend Usage

- Open `frontend/index.html` for the home page.
- Use the admin login for onboarding management.
- Open `frontend/display/index.html` on a big screen for the live display.

---

## 🎤 Audio Announcements

- Uses browser’s SpeechSynthesis API.
- Plays an attention sound (`attention.mp3`) before each announcement.
- Announces student name and registration number for each counter, twice, with a delay.

---

## 🧩 Folder Structure

```
Hostel-OnBording-Display/
├── backend/
│   ├── index.js
│   ├── auth.js
│   ├── addUser.js
│   ├── models/
│   │   └── User.js
│   ├── google-credentials.json
│   └── ...
├── frontend/
│   ├── admin/
│   │   ├── login.html
│   │   ├── index.html
│   │   └── style.css
│   ├── display/
│   │   ├── index.html
│   │   ├── display.js
│   │   ├── style.css
│   │   ├── attention.mp3
│   │   └── vit-bhopal-bg.jpg
│   └── index.html
└── README.md
```

---

## 📄 License

This project is for educational and institutional use at VIT Bhopal.  
For other use cases, please contact the repository owner.

---

## 🙏 Acknowledgements

- VIT Bhopal Hostel Administration
- Google Sheets API
- MongoDB Atlas
- Font Awesome

---

## 👤 Author & Contact

- **Instagram:** [@itsmeshubh2026](https://instagram.com/itsmeshubh2026)

---

## 💬 Questions?

For issues or feature requests, please open an issue on [GitHub](https://github.com/shubh100802/Hostel-OnBording-Display/issues). 