import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProjectImage } from '@/types';

export const createProjectImage = async (image: Omit<ProjectImage, 'id' | 'createdAt'>): Promise<string> => {
  const imageRef = doc(collection(db, 'projectImages'));
  const imageData = {
    ...image,
    createdAt: Timestamp.now(),
  };
  await setDoc(imageRef, imageData);
  return imageRef.id;
};

export const getProjectImagesByProject = async (projectId: string): Promise<ProjectImage[]> => {
  const imagesRef = collection(db, 'projectImages');
  const q = query(imagesRef, where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  const images = snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as ProjectImage[];
  return images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const deleteProjectImage = async (id: string): Promise<void> => {
  const imageRef = doc(db, 'projectImages', id);
  await deleteDoc(imageRef);
};
