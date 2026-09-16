const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const DAILY_PHOTO_SCAN_LIMIT = 20;
const DAILY_WORKOUT_GENERATION_LIMIT = 20;
const DAILY_INSIGHT_GENERATION_LIMIT = 5;
const GEMINI_MODEL = 'gemini-3.8-flash';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

const INSIGHT_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
};

async function generateWeeklyInsightHandler(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Je moet ingelogd zijn om deze functie te gebruiken.');
  }

  const uid = request.auth.uid;
  const today = new Date().toISOString().slice(0, 10);
  const insightRef = db.doc(`users/${uid}/insights/${today}`);

  const cached = await insightRef.get();
  if (cached.exists) {
    return cached.data();
  }

  await checkAndIncrementUsage(uid, 'insightGenerations', DAILY_INSIGHT_GENERATION_LIMIT);

  const since = Date.now() - SEVEN_DAYS_MS;

  const [profileSnap, activitySnap, entriesSnap, completionsSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.collection(`users/${uid}/activity`).where('timestamp', '>=', since).get(),
    db.collection(`users/${uid}/entries`).where('loggedAt', '>=', since).get(),
    db.collection(`users/${uid}/workoutCompletions`).where('completedAt', '>=', since).get(),
  ]);

  const profile = profileSnap.exists ? profileSnap.data() : {};
  const daysActive = activitySnap.size;
  const loggedDays = new Set(
    entriesSnap.docs.map((d) => new Date(d.data().loggedAt).toISOString().slice(0, 10))
  );
  const daysLogged = loggedDays.size;
  const workoutsCompleted = completionsSnap.size;

  const stats = { daysActive, daysLogged, workoutsCompleted };

  const prompt = [
    'Je bent een vriendelijke, motiverende personal coach binnen de app StriveGen.',
    `Gebruikersnaam: ${profile.name || 'onbekend'}.`,
    profile.sport ? `Favoriete sport: ${profile.sport}.` : '',
    profile.goal ? `Doel: ${profile.goal}.` : '',
    'Statistieken van de afgelopen 7 dagen:',
    `- Dagen actief in de app: ${daysActive} van de 7`,
    `- Dagen met voeding gelogd: ${daysLogged} van de 7`,
    `- Voltooide trainingen: ${workoutsCompleted}`,
    'Schrijf een korte, persoonlijke welkomsttekst (2-4 zinnen) in het Nederlands voor op het',
    'homescherm: benoem kort de voortgang, geef een concrete tip of bemoediging, en gebruik een',
    'positieve, motiverende toon. Gebruik de naam als die bekend is. Geen opsomming, gewoon lopende tekst.',
  ]
    .filter(Boolean)
    .join(' ');

  const result = await callGemini([{ type: 'text', text: prompt }], INSIGHT_SCHEMA);
  const payload = { message: result.message, stats, generatedAt: Date.now() };
  await insightRef.set(payload);
  return payload;
}

exports.estimateMealFromPhoto = onCall(
  { secrets: [geminiApiKey], region: 'europe-west1' },
  wrapCallable(estimateMealFromPhotoHandler, 'Er ging iets mis bij het analyseren van de foto.')
);

exports.generateWorkout = onCall(
  { secrets: [geminiApiKey], region: 'europe-west1' },
  wrapCallable(generateWorkoutHandler, 'Er ging iets mis bij het genereren van de training.')
);

exports.generateWeeklyInsight = onCall(
  { secrets: [geminiApiKey], region: 'europe-west1' },
  wrapCallable(generateWeeklyInsightHandler, 'Er ging iets mis bij het ophalen van je overzicht.')
);
