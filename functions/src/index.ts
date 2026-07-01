import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// Cloud Functions가 필요한 경우 여기에 추가합니다.
// (현재 토스페이먼츠 백엔드 기능은 제거됨)
