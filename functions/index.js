const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const DAILY_PHOTO_SCAN_LIMIT = 20;
const DAILY_WORKOUT_GENERATION_LIMIT = 20;
const GEMINI_MODEL = 'gemini-3.8-flash';

async function checkAndIncrementUsage(uid, field, limit) {
  const today = new Date().toISOString().slice(0, 10);
  const usageRef = db.doc(`users/${uid}/usage/${today}`);
  const usageSnap = await usageRef.get();
  const currentCount = usageSnap.exists ? usageSnap.data()[field] ?? 0 : 0;

  if (currentCount >= limit) {
    throw new HttpsError('resource-exhausted', `Dagelijkse limiet van ${limit} bereikt.`);
  }

  await usageRef.set({ [field]: currentCount + 1 }, { merge: true });
}

async function callGemini(inputParts, schema) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'x-goog-api-key': geminiApiKey.value(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      input: inputParts,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema,
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

  try {
    return JSON.parse(textContent);
  } catch (err) {
    console.error('Kon Gemini-antwoord niet parsen', textContent);
    throw new HttpsError('internal', 'Kon AI-antwoord niet verwerken.');
  }
}

function wrapCallable(handler, fallbackMessage) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (err) {
      if (err instanceof HttpsError) {
        throw err;
      }
      console.error(fallbackMessage, err);
      throw new HttpsError('internal', fallbackMessage);
    }
  };
}

const MEAL_PHOTO_SCHEMA = {
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

const MEAL_PHOTO_PROMPT = [
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

  await checkAndIncrementUsage(request.auth.uid, 'photoScans', DAILY_PHOTO_SCAN_LIMIT);

  return callGemini(
    [
      { type: 'text', text: MEAL_PHOTO_PROMPT },
      { type: 'image', data: imageBase64, mime_type: 'image/jpeg' },
    ],
    MEAL_PHOTO_SCHEMA
  );
}

const WORKOUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    durationMinutes: { type: 'integer' },
    difficulty: { type: 'string', enum: ['beginner', 'gemiddeld', 'gevorderd'] },
    description: { type: 'string' },
    exercises: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['name', 'detail'],
      },
    },
  },
  required: ['title', 'durationMinutes', 'difficulty', 'description', 'exercises'],
};

const VALID_SPORTS = ['hardlopen', 'kracht', 'yoga', 'cardio', 'hiit', 'wandelen', 'fietsen', 'zwemmen'];
const VALID_GOALS = ['afvallen', 'spieropbouw', 'uithoudingsvermogen', 'mobiliteit', 'algemene_fitheid'];

async function generateWorkoutHandler(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Je moet ingelogd zijn om deze functie te gebruiken.');
  }

  const { sport, goal } = request.data ?? {};
  if (!VALID_SPORTS.includes(sport) || !VALID_GOALS.includes(goal)) {
    throw new HttpsError('invalid-argument', 'Ongeldige sport of doel.');
  }

  await checkAndIncrementUsage(request.auth.uid, 'workoutGenerations', DAILY_WORKOUT_GENERATION_LIMIT);

  const prompt = [
    'Je bent een personal trainer. Bedenk een concrete, uitvoerbare training.',
    `Sport/type: ${sport}. Doel: ${goal}.`,
    'Geef een titel, duur in minuten, moeilijkheidsgraad (beginner/gemiddeld/gevorderd),',
    'een korte beschrijving (1-2 zinnen), en een lijst van 3 tot 6 oefeningen.',
    'Elke oefening heeft een naam en een concreet detail (bv. "3 x 12 herhalingen" of "10 minuten").',
    'Schrijf alles in het Nederlands.',
  ].join(' ');

  const workout = await callGemini([{ type: 'text', text: prompt }], WORKOUT_SCHEMA);
  return { ...workout, sport, goal };
}

exports.estimateMealFromPhoto = onCall(
  { secrets: [geminiApiKey], region: 'europe-west1' },
  wrapCallable(estimateMealFromPhotoHandler, 'Er ging iets mis bij het analyseren van de foto.')
);

exports.generateWorkout = onCall(
  { secrets: [geminiApiKey], region: 'europe-west1' },
  wrapCallable(generateWorkoutHandler, 'Er ging iets mis bij het genereren van de training.')
);
