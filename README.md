# 🪴 Smart Plant Simulator Deployment Guide

Aap is simulator ko 2 minutes mein free host kar sakte hain.

## Steps to Deploy (Netlify - Recommended)

1. **GitHub Par Upload Karein**:
   - Ek naya repository banayein aur ye saari files upload kar dein.

2. **Netlify Connect Karein**:
   - [Netlify](https://www.netlify.com/) par login karein.
   - **"Add new site"** > **"Import an existing project"** par click karein.
   - Apna GitHub repo select karein.

3. **Build Settings**:
   - **Build Command**: `sed -i "s/__API_KEY_PLACEHOLDER__/${API_KEY}/g\" index.html`
   - **Publish directory**: `.`

4. **API Key Setup (Important)**:
   - **Site configuration** > **Environment variables** mein jayein.
   - Ek naya variable create karein:
     - **Key**: `API_KEY`
     - **Value**: (Apni Google Gemini API Key yahan dalein)

5. **Deploy**:
   - "Deploy site" par click karein. Aapka simulator live ho jayega!

## Features
- **Virtual OLED**: ESP32 ki screen ka real-time preview.
- **Hardware Controls**: Soil moisture aur rain sensor ko toggle karne ki suvidha.
- **Security Audit**: AI-powered code analysis.