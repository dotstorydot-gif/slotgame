# UCL Slot Game - Professional Guide

This document provides a comprehensive guide for both **Administrators** (for inventory and lead management) and **Users** (for gameplay instructions).

---

## 👨‍💼 Administrator Guide

The Admin Dashboard is a secure area where you can track leads and manage the prize inventory in real-time.

### 1. Accessing the Dashboard
- **Location**: On the landing page, click exactly **5 times** on the main "PLAY & WIN" title.
- **Login**: Enter the administrator credentials:
  - **Username**: `admin`
  - **Password**: `123456`

### 2. Multi-Venue Management
- Use the **Venue Switcher** grid to select the specific location you are managing (e.g., *JW Marriott*, *The Tap East*, etc.).
- **Inventory Panel**: Adjust stock for each prize specifically for that venue.
- **Sync Offline**: If the touch screen was used without internet, click the **Sync Offline** button to upload all locally saved leads to Supabase.

### 3. Managing Inventory
- The stock levels for each venue are independent.
- Use the **+** and **-** buttons to adjust stock levels. Updates are saved instantly to Supabase.
- **Atomic Sync**: The system handles multiple simultaneous players safely without miscounting prizes.

### 4. Tracking Leads
- The **Leads Table** lists every participant.
- It displays their **Name**, **Phone Number**, **Venue**, **Prize Won**, and the **Date/Time**.
- Use the **Export CSV** button to download all leads for reporting.

---

## 🎮 User Gameplay Guide

Welcome to the UCL Spin & Win challenge! Follow these steps to play and win exclusive rewards.

### 1. Registration
- Enter your **Full Name** and a valid **Phone Number**.
- Agree to the Terms & Conditions and click **LET'S PLAY**.

### 2. The Slot Machine
- You will see the UCL-branded slot machine with three reels.
- Each user starts with **1 Spin**.
- Click the **SPIN** button to start the reels.

### 3. Winning
- **Match 3 Items**: If all three reels show the same premium item (e.g., three Heineken Bags), you win that prize!
- **Match 3 Stars**: A special winning combination.
- **Reward Notification**: A pop-up will appear informing you of your win.

### 4. Claiming Prizes
- Winners' details are automatically sent to our system. Our team will contact you using the phone number provided during registration to arrange prize collection.

---

## 🚀 Deployment & Maintenance

### Vercel Deployment Note
- The application is hosted at: `https://slotgame-xi.vercel.app/`
- All data is stored securely in **Supabase**.
- To ensure the app remains functional, ensure the **Inventory Stock** for "Try Again" is always above zero.

> [!IMPORTANT]
> **Data Security**: Lead information contains sensitive phone numbers. Access the Admin Dashboard only on secure devices and do not share administrator credentials.
