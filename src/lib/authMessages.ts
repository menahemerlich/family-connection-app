import { FirebaseError } from 'firebase/app';

function isFirebaseError(err: unknown): err is FirebaseError {
  return typeof err === 'object' && err !== null && 'code' in err && typeof (err as FirebaseError).code === 'string';
}

/** הסבר בעברית לקוד שגיאת Firebase Auth */
export function describeAuthError(err: unknown): { title: string; hint?: string } {
  if (!isFirebaseError(err)) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: msg || 'שגיאה לא ידועה באימות',
      hint: 'בדוק חיבור לרשת ואת הקונסול (F12).',
    };
  }

  const code = err.code;
  const hints: Record<string, { title: string; hint?: string }> = {
    'auth/invalid-api-key': {
      title: 'מפתח API של Firebase לא תקין או חסר',
      hint: 'בדוק את EXPO_PUBLIC_FIREBASE_API_KEY ב-.env, הפעל מחדש את Metro (--clear), וב-Google Cloud וודא שהמפתח לא מוגבל רק לאנדרואיד/אייפון.',
    },
    'auth/unauthorized-domain': {
      title: 'הדומיין לא מורשה ב-Firebase Auth',
      hint:
        'Firebase Console → Authentication → Settings → Authorized domains: הוסף localhost, 127.0.0.1, והשתמש באותו כתובת (לא לערבב localhost ו-127.0.0.1).',
    },
    'auth/operation-not-allowed': {
      title: 'שיטת ההתחברות לא מופעלת בפרויקט',
      hint: 'Firebase Console → Authentication → Sign-in method: הפעל Google (ואימייל/סיסמה אם צריך).',
    },
    'auth/account-exists-with-different-credential': {
      title: 'חשבון קיים עם אותו אימייל אבל שיטת התחברות אחרת',
      hint: 'התחבר עם אותה שיטה שבה נרשמת קודם, או קשר את החשבונות ב-Firebase.',
    },
    'auth/popup-blocked': {
      title: 'חלון קופץ נחסם',
      hint: 'לא אמור לקרות ב-flow של redirect; בדוק הרחבות דפדפן.',
    },
    'auth/network-request-failed': {
      title: 'בעיית רשת בגישה לשרתי Google/Firebase',
      hint: 'בדוק אינטרנט, VPN, או חסימת דומיינים ברשת.',
    },
    'auth/argument-error': {
      title: 'בעיה טכנית בהגדרת Auth (resolver / אתחול)',
      hint: 'עדכן את האפליקציה לגרסה האחרונה של הקוד; אם נשאר — שלח את קוד השגיאה המלא.',
    },
    'auth/missing-or-invalid-nonce': {
      title: 'בקשת OAuth לא תקינה',
      hint: 'נסה שוב התחברות Google; נקה נתוני אתר ל-localhost ונסה שוב.',
    },
    'auth/cancelled-popup-request': {
      title: 'בקשת ההתחברות בוטלה',
      hint: 'נסה שוב.',
    },
  };

  return (
    hints[code] ?? {
      title: err.message || code,
      hint: `קוד Firebase: ${code}. חיפוש בתיעוד Firebase Auth עבור הקוד הזה.`,
    }
  );
}

/** שגיאות Firestore נפוצות */
export function describeFirestoreError(err: unknown): { title: string; hint?: string } {
  if (!isFirebaseError(err)) {
    const msg = err instanceof Error ? err.message : String(err);
    return { title: msg || 'שגיאה ב-Firestore', hint: 'בדוק ש-Firestore הופעל בפרויקט ושהכללות (rules) פורסו.' };
  }

  const code = err.code;
  if (code === 'permission-denied') {
    return {
      title: 'אין הרשאה לגשת לנתונים (Firestore)',
      hint: 'הרץ firebase deploy של firestore.rules, או בדוק בקונסול שהמשתמש מחובר.',
    };
  }
  if (code === 'unavailable' || (typeof err.message === 'string' && err.message.includes('offline'))) {
    return {
      title: 'Firestore לא זמין או נראה כ"לא מקוון"',
      hint: 'בדוק רשת; ודא ש-Firestore API מופעל בפרויקט; נסה ריענון.',
    };
  }
  return {
    title: err.message || code,
    hint: `קוד: ${code}`,
  };
}

/** שגיאות httpsCallable (Firebase Functions) */
export function describeFunctionsError(err: unknown): { title: string; hint?: string } {
  if (!isFirebaseError(err)) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: msg || 'שגיאה בשרת',
      hint: 'בדוק חיבור; אם שליחת הזמנה נכשלת — ודא ש-functions פורסמו וש-Resend הוגדר.',
    };
  }

  const code = err.code;
  const hints: Record<string, { title: string; hint?: string }> = {
    'functions/unauthenticated': {
      title: 'נדרש להתחבר מחדש',
      hint: 'צא והתחבר שוב לאפליקציה.',
    },
    'functions/permission-denied': {
      title: 'אין הרשאה לפעולה הזו',
      hint: 'רק מנהלי משפחה יכולים לשלוח הזמנות.',
    },
    'functions/not-found': {
      title: 'לא נמצא',
      hint: 'ייתכן שהמשפחה נמחקה או שהפרויקט לא מסונכרן.',
    },
    'functions/invalid-argument': {
      title: 'נתונים לא תקינים',
      hint: 'בדוק שכתובת המייל תקינה.',
    },
    'functions/failed-precondition': {
      title: 'ההזמנה כבר לא תקפה',
      hint: 'ייתכן שפג התוקף או שההזמנה כבר אושרה.',
    },
    'functions/internal': {
      title: 'שגיאה בשליחת המייל',
      hint: 'בדוק ב-Firebase שפורסמו sendInvite ו-acceptInvite, ושהסודות RESEND_API_KEY, RESEND_FROM, APP_PUBLIC_URL מוגדרים.',
    },
  };

  return (
    hints[code] ?? {
      title: err.message || code,
      hint: `קוד: ${code}. בדוק יישום Cloud Functions.`,
    }
  );
}
