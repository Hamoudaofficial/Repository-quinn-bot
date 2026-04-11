// ═══════════════════════════════════════════════
// js/firebase.js — تهيئة Firebase وتصدير المثيلات
// ═══════════════════════════════════════════════
import { initializeApp }                        from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';
import { getDatabase }                          from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js';
import { getAnalytics }                         from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js';

const firebaseConfig = {
  apiKey:            'AIzaSyDYyxW9P-_DlOEqK6FCQqqBWo5UFxGnshY',
  authDomain:        'quinnbot-9f797.firebaseapp.com',
  databaseURL:       'https://quinnbot-9f797-default-rtdb.firebaseio.com',
  projectId:         'quinnbot-9f797',
  storageBucket:     'quinnbot-9f797.firebasestorage.app',
  messagingSenderId: '592205334333',
  appId:             '1:592205334333:web:9f8a3b6ec7e7fee81fa754',
  measurementId:     'G-W5HRWB45GX'
};

const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);   // Firestore
export const rtdb = getDatabase(app);    // Realtime Database
export const analytics = getAnalytics(app);

// دعم العمل دون اتصال
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') console.warn('[Quinn] Persistence: multi-tab');
  if (err.code === 'unimplemented')       console.warn('[Quinn] Persistence: not supported');
});
