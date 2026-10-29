import { db } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection, arrayUnion } from 'firebase/firestore';
import { initialCategories, initialProducts } from '../data/defaultCatalog';
import { cleanFirestoreData } from './utils';

let isSeeding = false;

export async function ensureDefaultCatalogSeeded() {
  if (isSeeding) return;
  isSeeding = true;

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Firestore seed timeout')), 3000)
  );

  try {
    await Promise.race([
      (async () => {
        const setupDocRef = doc(db, 'configuracoes', 'app_setup');
        const setupSnap = await getDoc(setupDocRef);
        const setupData = setupSnap.exists() ? setupSnap.data() : null;
        const deletedCategoryIds: string[] = setupData?.deletedCategoryIds || [];
        const deletedProductIds: string[] = setupData?.deletedProductIds || [];

        // Check existing categories in Firestore
        const catSnap = await getDocs(collection(db, 'categorias'));
        const existingCatIds = new Set(catSnap.docs.map(d => d.id));

        // For any initial category that does not exist in Firestore and was NOT explicitly deleted, save it to Firestore
        for (const cat of initialCategories) {
          if (!existingCatIds.has(cat.id) && !deletedCategoryIds.includes(cat.id)) {
            await setDoc(doc(db, 'categorias', cat.id), cleanFirestoreData(cat), { merge: true });
          }
        }

        // Check existing products in Firestore
        const prodSnap = await getDocs(collection(db, 'produtos'));
        const existingProdIds = new Set(prodSnap.docs.map(d => d.id));

        // For any initial product that does not exist in Firestore and was NOT explicitly deleted, save it to Firestore
        for (const prod of initialProducts) {
          if (!existingProdIds.has(prod.id) && !deletedProductIds.includes(prod.id)) {
            await setDoc(doc(db, 'produtos', prod.id), cleanFirestoreData(prod), { merge: true });
          }
        }

        // Check and seed initial settings if not present
        const settingsDocRef = doc(db, 'configuracoes', 'geral');
        const settingsSnap = await getDoc(settingsDocRef);
        if (!settingsSnap.exists()) {
          await setDoc(settingsDocRef, {
            primaryColor: '#865d39',
            whatsappNumber: '',
            whatsappCountryCode: '+55',
            slug: 'donari',
            brandName: 'Donari',
            logo: 'https://i.ibb.co/d4gQxxwQ/Whats-App-Image-2026-10-22-at-12-26-48-PM.jpg',
            slogan: 'Alimentação saudável e consciente.',
            whatsappClosingMessage: 'Obrigada pelo interesse, aguarde que entraremos em contato para confirmação!',
            backgroundImage: 'https://i.ibb.co/X0vYy7L/cakes.png',
            glassColor: 'rgba(255, 255, 255, 0.4)',
            textColor: '#000000',
            language: 'pt',
            currency: 'BRL',
            introEnabled: true,
            introTitle: 'Donari',
            introSubtitle: 'Comer bem é o primeiro passo para uma vida saudável.',
            introDescription: 'Se você quer mais leveza, mais saúde e mais qualidade de vida... comece pelo básico bem feito: sua alimentação.',
            introButtonText: 'ACESSAR NOSSO CARDÁPIO',
            introBottomText: 'ALIMENTO • CORPO • ALMA',
            selectorEnabled: false,
            selectorTitle: 'Donari',
            selectorSubtitle: 'Escolha sua experiência',
            catalog1Title: 'Cardápio Principal',
            catalog1Image: 'https://i.ibb.co/d4gQxxwQ/Whats-App-Image-2026-10-22-at-12-26-48-PM.jpg',
            catalog1Desc: 'Nossas opções saudáveis e nutritivas.',
            catalog1Slogan: 'Alimentação saudável e consciente',
            catalog1Active: true
          }, { merge: true });
        } else {
          // Auto-migrate old Moriá branding if present
          const currentData = settingsSnap.data();
          const updates: any = {};
          if (!currentData?.brandName || currentData.brandName.includes('Moriá') || currentData.brandName === 'Moriá marmitaria') {
            updates.brandName = 'Donari';
          }
          if (!currentData?.introTitle || currentData.introTitle.includes('Moriá')) {
            updates.introTitle = 'Donari';
          }
          if (!currentData?.selectorTitle || currentData.selectorTitle.includes('Moriá')) {
            updates.selectorTitle = 'Donari';
          }
          if (currentData?.slug === 'moria-marmitaria') {
            updates.slug = 'donari';
          }
          if (!currentData?.logo || currentData.logo.includes('XrK36D7r')) {
            updates.logo = 'https://i.ibb.co/d4gQxxwQ/Whats-App-Image-2026-10-22-at-12-26-48-PM.jpg';
          }
          if (Object.keys(updates).length > 0) {
            await setDoc(settingsDocRef, updates, { merge: true });
          }
        }

        // Mark setup as completed
        await setDoc(setupDocRef, {
          seeded: true,
          seededAt: setupData?.seededAt || new Date().toISOString()
        }, { merge: true });
      })(),
      timeoutPromise
    ]);
  } catch (err) {
    console.warn('ensureDefaultCatalogSeeded (retrying next cycle):', err);
  } finally {
    isSeeding = false;
  }
}

export async function markCategoryAsDeleted(id: string) {
  try {
    await setDoc(doc(db, 'configuracoes', 'app_setup'), {
      deletedCategoryIds: arrayUnion(id)
    }, { merge: true });
  } catch (e) {
    console.warn('Error marking category as deleted:', e);
  }
}

export async function markProductAsDeleted(id: string) {
  try {
    await setDoc(doc(db, 'configuracoes', 'app_setup'), {
      deletedProductIds: arrayUnion(id)
    }, { merge: true });
  } catch (e) {
    console.warn('Error marking product as deleted:', e);
  }
}
