import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import * as dotenv from "dotenv";

// .env dosyasını yükle
dotenv.config();

// Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tüm dokümanları koleksiyondan çekme
async function fetchDocs(collectionName) {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id, // Doküman ID
      ...doc.data(), // Doküman verileri
    }));
  } catch (error) {
    console.error(`Error fetching documents from ${collectionName}:`, error);
    return [];
  }
}

// Belirli bir sorguya göre doküman çekme
async function fetchDocByQuery(collectionName, fieldName, value) {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, where(fieldName, "==", value));
    // ABİ Q NE AMK??? -0xkutluer
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id, // Doküman ID
      ...snapshot.docs[0].data(), // Doküman verileri
    };
  } catch (error) {
    console.error(`Error fetching document from ${collectionName}:`, error);
    return null;
  }
}

// Dokümanı güncelleme
async function updateDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return false;
  }
}

// Yeni doküman ekleme
async function addDocument(collectionName, data) {
  try {
    const collectionRef = collection(db, collectionName);
    const result = await addDoc(collectionRef, data);
    const id = result.id;
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, { id });
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return false;
  }
}

// db ve yardımcı fonksiyonları dışa aktar
export { fetchDocs, fetchDocByQuery, updateDocument, addDocument };
