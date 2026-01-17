# NimbusVita

Mobile health monitoring application that uses machine learning to predict disease risks based on symptoms and weather conditions.

## Overview

NimbusVita is a React Native/Expo application that combines symptom tracking with real-time weather data to provide health risk assessments. The app uses a FastAPI ML backend with a trained classifier to predict potential health conditions based on user-reported symptoms and environmental factors.

**⚠️ Educational Project:** This is a prototype for educational purposes. Predictions are not medical advice and should not replace professional healthcare consultation.

## Key Features

- **Symptom Checker**: Track and report symptoms with severity levels
- **ML-Based Predictions**: Disease risk assessment using trained classifier
- **Weather Integration**: Real-time weather data correlation with symptoms
- **Health History**: Complete symptom check-up history tracking
- **Family Monitoring**: Monitor health status of family members
- **Location Tracking**: Map-based health location monitoring
- **Smart Alerts**: Automated health risk notifications
- **User Authentication**: Secure login with Supabase

## Tech Stack

### Frontend
- React Native 0.81.4 with Expo SDK 54
- TypeScript 5.9.2
- React Navigation 7.x
- Supabase Client 2.39.0

### Backend
- Supabase (PostgreSQL, Auth, Realtime)
- FastAPI ML service (Python)
- Scikit-learn classifier (joblib)

### Key Dependencies
- `@react-navigation/native` - Navigation
- `@supabase/supabase-js` - Backend integration
- `expo-location` - GPS services
- `react-native-maps` - Map visualization
- `lottie-react-native` - Animations

## Project Structure

```
NimbusVita/
├── src/
│   ├── screens/
│   │   ├── tabs/           # Main app tabs (Home, Checkup, Alerts, Maps, Family, Profile)
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── components/         # Reusable UI components
│   ├── services/           # Business logic (Supabase, ML API)
│   ├── contexts/           # React contexts (Auth)
│   ├── config/             # App configuration
│   ├── types/              # TypeScript definitions
│   └── utils/              # Helper functions
├── ml-backend/             # FastAPI ML service
│   ├── main.py             # API endpoints
│   ├── models/             # Trained ML models
│   └── requirements.txt
├── assets/                 # Images and resources
└── App.tsx                 # Entry point
```

## Setup

### Prerequisites
- Node.js 16+
- Expo CLI
- Python 3.11+ (for ML backend)
- Supabase account (free tier)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Frankiinhu/DSI-2025.2.git
   cd DSI-2025.2/NimbusVita
   npm install
   ```

2. **Configure Supabase**
   
   Create `.env` file:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Setup ML Backend (optional)**
   ```bash
   cd ml-backend
   pip install -r requirements.txt
   python main.py
   ```
   
   Update `src/config/ml.config.ts` with your local IP if testing on physical device.

4. **Run the app**
   ```bash
   npm start
   ```
   
   Scan QR code with Expo Go app or press `a` for Android / `i` for iOS emulator.

## ML Model

The classifier predicts disease risks based on:
- **User Symptoms**: 40+ mapped symptoms
- **Weather Data**: Temperature, humidity, wind speed
- **User Context**: Age, gender, medical history

Model features include respiratory, neurological, and systemic symptoms mapped to specific health conditions.

## Development

### Available Scripts
- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run reset` - Clear cache and restart

### Architecture
- **Authentication**: Supabase Auth with JWT tokens
- **State Management**: React Context API
- **Data Persistence**: Supabase PostgreSQL + AsyncStorage cache
- **ML Integration**: REST API communication with FastAPI backend

## Deployment

### Mobile App
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### ML Backend
Configured for Render deployment (see `ml-backend/render.yaml`)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Repository

[github.com/Frankiinhu/DSI-2025.2](https://github.com/Frankiinhu/DSI-2025.2)
