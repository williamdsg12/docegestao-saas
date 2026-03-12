// This file appears to be legacy and references a missing './firebase' module.
// Commenting out to unblock the build as it is currently unused.

/*
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDocs
} from "firebase/firestore";
import { db } from "./firebase";

// Generic CRUD operations
export const addDocument = (collectionName: string, data: any) => {
    if (!db) return Promise.reject("Firebase not configured");
    return addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const updateDocument = (collectionName: string, id: string, data: any) => {
    if (!db) return Promise.reject("Firebase not configured");
    const docRef = doc(db, collectionName, id);
    return updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

export const deleteDocument = (collectionName: string, id: string) => {
    if (!db) return Promise.reject("Firebase not configured");
    return deleteDoc(doc(db, collectionName, id));
};

// Real-time synchronization hooks helper
export const subscribeToCollection = (
    collectionName: string,
    callback: (data: any[]) => void,
    userUid?: string
) => {
    if (!db) {
        console.warn("Subscribe: Firebase not configured");
        return () => { }; // return empty unsubscribe
    }

    let q = query(collection(db, collectionName), orderBy("createdAt", "desc"));

    if (userUid) {
        q = query(q, where("userId", "==", userUid));
    }

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(data);
    });
};

// Specific helpers for modules
export const getPedidos = (userUid: string, callback: (data: any[]) => void) => {
    return subscribeToCollection("pedidos", callback, userUid);
};

export const getEstoque = (userUid: string, callback: (data: any[]) => void) => {
    return subscribeToCollection("estoque", callback, userUid);
};
*/
