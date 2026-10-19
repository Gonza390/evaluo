'use client';

const DB_NAME = 'evaluo_pdf_first';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'pending';

type StoredPdfFirstDraft = {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  source: string;
  selectedAt: number;
  blob: Blob;
};

export type PdfFirstDraft = {
  file: File;
  source: string;
  selectedAt: number;
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No pudimos guardar el PDF en este dispositivo.'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
) {
  const db = await openDb();

  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No pudimos acceder al PDF guardado.'));
      transaction.onerror = () => reject(transaction.error ?? new Error('No pudimos acceder al PDF guardado.'));
    });
  } finally {
    db.close();
  }
}

export async function savePdfFirstDraft(file: File, source: string) {
  const record: StoredPdfFirstDraft = {
    id: DRAFT_KEY,
    name: file.name,
    type: file.type || 'application/pdf',
    size: file.size,
    lastModified: file.lastModified,
    source,
    selectedAt: Date.now(),
    blob: file,
  };

  await withStore('readwrite', (store) => store.put(record));
}

export async function loadPdfFirstDraft(): Promise<PdfFirstDraft | null> {
  const record = await withStore<StoredPdfFirstDraft | undefined>('readonly', (store) =>
    store.get(DRAFT_KEY)
  );

  if (!record?.blob || !record.name) return null;

  return {
    file: new File([record.blob], record.name, {
      type: record.type || 'application/pdf',
      lastModified: record.lastModified || Date.now(),
    }),
    source: record.source || 'pdf-first-landing',
    selectedAt: record.selectedAt || Date.now(),
  };
}

export async function getPdfFirstDraftMeta() {
  const record = await withStore<StoredPdfFirstDraft | undefined>('readonly', (store) =>
    store.get(DRAFT_KEY)
  );

  if (!record) return null;

  return {
    name: record.name,
    size: record.size,
    source: record.source,
    selectedAt: record.selectedAt,
  };
}

export async function clearPdfFirstDraft() {
  await withStore('readwrite', (store) => store.delete(DRAFT_KEY));
}
