import { db } from "./firebase";
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, addDoc, query, orderBy, getDocsFromServer } from "firebase/firestore";

export const getCompanies = async () => {
    const q = query(collection(db, "companies"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const saveCompany = async (data: any, id?: string) => {
    if (id) {
        await updateDoc(doc(db, "companies", id), data);
        return id;
    } else {
        const ref = await addDoc(collection(db, "companies"), data);
        return ref.id;
    }
};

export const deleteCompany = async (id: string) => {
    await deleteDoc(doc(db, "companies", id));
};

export const getContacts = async () => {
    const q = query(collection(db, "contacts"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const saveContact = async (data: any, id?: string) => {
    if (id) {
        await updateDoc(doc(db, "contacts", id), data);
        return id;
    } else {
        const ref = await addDoc(collection(db, "contacts"), data);
        return ref.id;
    }
};

export const deleteContact = async (id: string) => {
    await deleteDoc(doc(db, "contacts", id));
};

// Product CRUD
export const getProducts = async (): Promise<any[]> => {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const saveProduct = async (data: any, id?: string) => {
    if (id) {
        await updateDoc(doc(db, "products", id), data);
        return id;
    } else {
        const ref = await addDoc(collection(db, "products"), data);
        return ref.id;
    }
};

export const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
};

export const saveDocument = async (collectionName: string, data: any, id?: string) => {
    if (id) {
        data.updatedAt = new Date().toISOString();
        await updateDoc(doc(db, collectionName, id), data);
        return id;
    } else {
        data.createdAt = new Date().toISOString();
        data.updatedAt = data.createdAt;
        const ref = await addDoc(collection(db, collectionName), data);
        return ref.id;
    }
};

export const getDocuments = async (collectionName: string): Promise<any[]> => {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    const snap = await getDocsFromServer(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`DEBUG: Loaded ${docs.length} docs from ${collectionName}:`, docs.map(d => d.id));
    return docs;
};

export const getDocument = async (collectionName: string, id: string) => {
    const snap = await getDoc(doc(db, collectionName, id));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
};

export const deleteDocumentInfo = async (collectionName: string, id: string) => {
    console.log("DEBUG: deleting doc from", collectionName, "with id:", id);
    if (!collectionName || !id) {
        throw new Error("Collection name or ID is missing");
    }
    await deleteDoc(doc(db, collectionName, id));
    console.log("deleted doc from", collectionName, id);
};
