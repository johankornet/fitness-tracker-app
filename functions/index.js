const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const DAILY_PHOTO_SCAN_LIMIT = 20;
const GEMINI_MODEL = 'gemini-3.8-flash';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    foodName: { type: 'string' },
    calories: { type: 'integer' },
    protein: { type: 'integer' },
    carbs: { type: 'integer' },
    fat: { type: 'integer' },
    confidence: { type: 'string', enum: ['laag', 'gemiddeld', 'hoog'] },
  },
  required: ['foodName', 'calories', 'protein', 'carbs', 'fat', 'confidence'],
};

const PROMPT = [
  'Je bent een voedingsdeskundige. Kijk naar deze foto van een maaltijd of voedingsmiddel.',
  'Schat de voedingswaarde voor de volledige afgebeelde portie.',
  'calories in kcal, protein/carbs/fat in grammen, allemaal gehele getallen.',
  'confidence geeft aan hoe zeker je bent van deze schatting gezien de foto.',
].join(' ');

async function estimateMealFromPhotoHandler(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Je moet ingelogd zijn om deze functie te gebruiken.');
  }

  const { imageBase64 } = request.data ?? {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new HttpsError('invalid-argument', 'Geen foto ontvangen.');
  }

  const uid = request.auth.uid;
  const today = new Date().toISOString().slice(0, 10);
  const usageRef = db.doc(`users/${uid}/usage/${today}`);

  const usageSnap = await usageRef.get();
  const currentCount = usageSnap.exists ? usageSnap.data().photoScans ?? 0 : 0;
  if (currentCount >= DAILY_PHOTO_SCAN_LIMIT) {
    throw new HttpsError(
      'resource-exhausted',
      `Dagelijkse limiet van ${DAILY_PHOTO_SCAN_LIMIT} foto-scans bereikt.`
    );
  }

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'x-goog-api-key': geminiApiKey.value(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      input: [
        { type: 'text', text: PROMPT },
        { type: 'image', data: imageBase64, mime_type: 'image/jpeg' },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('Gemini API error', response.status, errorBody);
    throw new HttpsError('internal', `AI-aanvraag mislukt (${response.status}).`);
  }

  const result = await response.json();
  const modelOutputStep = (result.steps || []).find((step) => step.type === 'model_output');
  const textContent = modelOutputStep?.content?.find((item) => item.type === 'text')?.text;

  if (!textContent) {
    console.error('Onverwacht Gemini-antwoord', JSON.stringify(result));
    throw new HttpsError('internal', 'Geen bruikbaar antwoord van AI ontvangen.');
  }

  let parsed;
  try {
    parsed = JSON.parse(textContent);
  } catch (err) {
    console.error('Kon Gemini-antwoord niet parsen', textContent);
    throw new HttpsError('internal', 'Kon AI-antwoord niet verwerken.');
  }

  await usageRef.set({ photoScans: currentCount + 1 }, { merge: true });

  return parsed;
}

exports.estimateMealFromPhoto = onCall(
  { secrets: [geminiApiKey], region: 'europe-west1' },
  async (request) => {
    try {
      return await estimateMealFromPhotoHandler(request);
    } catch (err) {
      if (err instanceof HttpsError) {
        throw err;
      }
      console.error('Onverwachte fout in estimateMealFromPhoto', err);
      throw new HttpsError('internal', 'Er ging iets mis bij het analyseren van de foto.');
    }
  }
);
