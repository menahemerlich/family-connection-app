# קשר משפחתי (Family Connection)

אפליקציית Expo חוצת־פלטפורמות (Web / iOS / Android) לניהול משפחה: צ'אט, מדיה, שיחות וידאו (LiveKit), אלבום, לוח שנה, רשימות ועץ משפחה — עם Firebase (Auth, Firestore, Storage, Functions, FCM).

## דרישות

- Node 18+ (מומלץ 20)
- חשבון [Firebase](https://console.firebase.google.com) + [LiveKit Cloud](https://cloud.livekit.io)
- לשליחת הזמנות במייל: [Resend](https://resend.com) (או התאמת הקוד ל־SendGrid)

## התקנה

```bash
cd "Family connection"
npm install
cd functions && npm install && npm run build && cd ..
```

העתק `.env.example` ל־`.env` ומלא את משתני `EXPO_PUBLIC_FIREBASE_*` ו־`EXPO_PUBLIC_LIVEKIT_URL`.

## הרצה מקומית

```bash
npx expo start
```

בחירת `w` ל־Web, או סריקה ל־Expo Go. **שיחות וידאו (LiveKit)** דורשות בדרך כלל **Development Build** (`expo run:ios` / `expo run:android`) ולא Expo Go.

### `Cannot find module '@expo/config-plugins/build/android/Manifest'`

זה קורה לפעמים כשה־hoisting של `npm` לא מעלה את `@expo/config-plugins` לנתיב שבו כלי Expo מחפש אותו. **אל תתקין `@expo/config-plugins` ידנית** (Expo מספקת אותו דרך `expo`). נסה:

```bash
rm -rf node_modules
npm install
```

ב־Windows: `rmdir /s /q node_modules` ואז `npm install`. אם עדיין נכשל, העתק את הפרויקט לנתיב ASCII קצר (למשל `C:\dev\...`).

## Firebase

1. הפעל Authentication (Email/Password; אופציונלי Google).
2. צור אפליקציית Web וייבא את מפתחות ה־SDK ל־`.env`.
3. Deploy כללי אבטחה ואינדקסים:

```bash
firebase login
firebase use --add
npm run deploy:rules
firebase deploy --only firestore:indexes
```

4. Cloud Functions (מומלץ `europe-west1` — תואם לקוד הלקוח ב־`src/lib/firebase.ts`):

```bash
# הגדרת סודות (דוגמה)
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set RESEND_FROM
firebase functions:secrets:set APP_PUBLIC_URL
firebase functions:secrets:set LIVEKIT_API_KEY
firebase functions:secrets:set LIVEKIT_API_SECRET
firebase functions:secrets:set LIVEKIT_URL

firebase deploy --only functions
```

`APP_PUBLIC_URL` — כתובת ה־Web המאוחסנת (למשל מ־Firebase Hosting אחרי `npm run build:web` + `firebase deploy --only hosting`).

## Sentry (אופציונלי)

הגדר `EXPO_PUBLIC_SENTRY_DSN` ב־`.env`. עבור סימבוליקציה בנייטיב ראה תיעוד `@sentry/react-native` עם Expo.

## בניית Web לפריסה

```bash
npm run build:web
```

הפלט מוגדר ב־`firebase.json` תחת `hosting.public` כ־`dist` (עדכן בהתאם לפלט `expo export` אם תשנה).

## מבנה עיקרי

- `app/` — מסכי Expo Router
- `src/features/` — לוגיקת דומיין (auth, family, chat, calls, …)
- `functions/` — Cloud Functions (הזמנות, LiveKit token, FCM, ימי הולדת)

## רישיון

Private / לימודי — עדכן לפי הצורך.
"# family-connection-app" 
