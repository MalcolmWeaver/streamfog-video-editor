# 📹 Streamfog Video Editor

## 🚀 Getting Started

This app uses Snap Kit to apply AR filters to YouTube videos. For the demo, Snap credentials are hardcoded — this will be replaced with secure `.env` configuration in future updates.

### 1. Clone the Repository

```bash
git clone https://github.com/MalcolmWeaver/streamfog-video-editor
cd streamfog-video-editor
git checkout master
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1. Copy the example file:

```bash
cp .env.example .env.local
```

2. Fill in your Snap credentials in `.env.local`:

```env
NEXT_PUBLIC_STAGING_API_TOKEN='your-api-token'
NEXT_PUBLIC_LENS_GROUP_ID='your-lens-group-id'
```

> `NEXT_PUBLIC_` prefix is required for any variable accessed in the browser (Next.js rule).

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Snap Kit Setup Instructions

### 1. Create a Snap Kit App

1. Go to the [Snap Kit Developer Portal](https://my-lenses.snapchat.com/)
2. Log in with your Snapchat account
3. Click on the **APP** tab
    - Enable App
    - Under Select App, select **Create App** for web.
    - Accept terms and create app 
4. From Apps, select your app and go to **View in Developer Portal** (redirects you to https://kit.snapchat.com/manage/apps/<ID>)
   - Under **API Tokens** select **Staging** Environment, and then generate a token. This is your NEXT_PUBLIC_STAGING_API_TOKEN.
5. Under **Lens Scheduler**  (https://my-lenses.snapchat.com/<ID>/camera-kit/lens-scheduler/groups) go to lens groups
    - Select a **Name/ID** and **Copy Lend Group Id**. This is your NEXT_PUBLIC_LENS_GROUP_ID.
    - Note, if using Camera Kit Sample Lenses, the filters that tend to work the best are "Face Landmarks" for face and 
    "CamKit Hair" for the rest of the head
6. Paste them into your `.env.local` file

---

## ▶️ Example Usage

### 🎥 Live Demo Recording

https://github.com/user-attachments/assets/cc9b8f92-717a-4700-8f72-7677935ef0a4

### 📸 Output Result

https://github.com/user-attachments/assets/66e19080-130f-470d-b803-8918795ac77f

---


