# 🌿 Prana Wellness — Client & Nutritionist Appointment Portal

A responsive, dual-sided appointment management web application built with **React**, **Vite**, and **Tailwind CSS**. It provides client-facing booking with focus logging alongside an operational dashboard for nutritionists with real-time analytics and reminder generation.

---

## 🚀 Live Demo
- **Live Deployment:** [wellness-appointments-portal.vercel.app](https://wellness-appointments-portal.vercel.app)
- **GitHub Repository:** [Paayas-tech/wellness-appointments-portal](https://github.com/Paayas-tech/wellness-appointments-portal)
---

## 🌟 Key Features

### 👤 Client Experience
- **Next Consultation Spotlight:** Highlight upcoming sessions with one-tap attendance confirmation.
- **Pre-Session Focus Log:** Two-point health intake (primary weekly goals & digestive concerns) that persists directly to the practitioner's view.
- **Self-Service Booking & Management:** Real-time conflict validation (double-booking prevention), slot rescheduling, and cancellation.
- **Separated Reservation Lists:** Filter upcoming versus past consultations displaying assigned clinical consultants.

### 📋 Nutritionist Portal
- **Operational Metrics Bar:** Live tallies for total consultations, daily bookings, and patient attendance rates.
- **Appointment Registry & Filters:** Search by patient name or phone number, with an instant "Today Only" toggle.
- **WhatsApp Reminder Integration:** Generate one-click formatted text reminders ready to copy to the clipboard.
- **Status Controls:** Update booking statuses (`Booked`, `Completed`, `Cancelled`) on the fly.

### ⚙️ Architecture & Persistence
- **State Persistence:** Preserves all mutations, custom appointments, and active dashboard view (`wellness_active_view`) across page reloads via `localStorage`.
- **Conflict Prevention Engine:** Strict validation ensuring identical slots cannot be double-booked.
- **Sample Reset:** Dedicated one-click restoration to default seed datasets for easy demonstrations.

---

## 🛠️ Tech Stack

- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS (v3.4.17), PostCSS, Autoprefixer
- **Icons:** Lucide React
- **Deployment:** Vercel

---

## 💻 Local Setup & Development

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Paayas-tech/wellness-appointments-portal.git](https://github.com/Paayas-tech/wellness-appointments-portal.git)
   cd wellness-appointments-portal
