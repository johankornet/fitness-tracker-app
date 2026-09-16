# StriveGen (foundation)

_Train smarter. Eat better. Evolve. All powered by AI and your dedication._

Een eerste basisversie van een MyFitnessPal-achtige app: gebruikersaccounts, een
voedingsdagboek met calorieën/macro's, handmatige invoer, een barcode-scanner
die productgegevens ophaalt via [Open Food Facts](https://world.openfoodfacts.org/),
een AI-fotoherkenning die een foto van een maaltijd analyseert en de
voedingswaarde schat, en een trainingenmenu (vaste catalogus + AI-gegenereerde
workouts) — beide AI-features via Google Gemini in een Firebase Cloud Function.

**Stack:** Expo (React Native + TypeScript) met Expo Router, Firebase (Auth + Firestore
+ Cloud Functions). Gekozen zodat je vanaf Windows kunt ontwikkelen en later zonder Mac
naar de App Store kunt uploaden via Expo's cloud build-service (EAS).

## 1. Vereisten

- Node.js (al geïnstalleerd)
- De gratis **Expo Go**-app op je eigen iPhone of Android-telefoon (App Store / Play Store)
- Een gratis [Firebase](https://console.firebase.google.com)-account

## 2. Firebase-project opzetten

1. Ga naar [console.firebase.google.com](https://console.firebase.google.com) en maak een nieuw project aan.
2. Voeg een **Web-app** toe aan het project (</> icoon) — je krijgt dan een `firebaseConfig`-object met keys.
3. Ga naar **Build → Authentication → Sign-in method** en schakel **Email/Password** in.
4. Ga naar **Build → Firestore Database** en maak een database aan (start in "production mode").
5. Kopieer de inhoud van [firestore.rules](firestore.rules) uit dit project naar het tabblad **Rules** in de Firestore-console en klik op **Publiceren**. Deze rules zorgen dat gebruikers alleen hun eigen dagboekgegevens kunnen lezen/schrijven.

## 3. Omgevingsvariabelen instellen

Kopieer `.env.example` naar `.env` en vul de waarden uit je Firebase `firebaseConfig` in:

```bash
copy .env.example .env
```

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## 4. AI-fotoherkenning instellen (Cloud Function + Gemini)

Deze functie vereist Firebase Cloud Functions, en die vereisen de betaalde **Blaze**-laag
(pay-as-you-go — je blijft binnen de gratis maandelijkse quota tenzij je veel gebruikers
krijgt) en een gratis Gemini API-sleutel.

1. **Upgrade naar Blaze**: in de Firebase-console → **Project settings** (tandwiel) →
   **Usage and billing** → **Modify plan** → kies **Blaze** en koppel een betaalmethode.
2. **Gemini API-sleutel aanmaken**: ga naar [aistudio.google.com/apikey](https://aistudio.google.com/apikey),
   log in met een Google-account en maak een nieuwe API-sleutel aan.
3. **Firebase CLI inloggen** (eenmalig, opent een browservenster):
   ```bash
   firebase login
   ```
4. **De Gemini-sleutel veilig opslaan** als Firebase-secret (vraagt om de sleutel te plakken, wordt niet in code of git opgeslagen):
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
5. **De Cloud Function deployen**:
   ```bash
   firebase deploy --only functions
   ```

Na een succesvolle deploy zijn `estimateMealFromPhoto` (foto → voedingswaarde) én
`generateWorkout` (sport + doel → training) actief. Beide hebben een ingebouwde limiet
van 20 aanroepen per gebruiker per dag om onverwacht hoge kosten te voorkomen (zie
`functions/index.js`).

## 5. App starten en testen

```bash
npm start
```

Scan de QR-code die verschijnt met de **Expo Go**-app op je telefoon (op iOS: open de
Camera-app en tik op de melding; op Android: scan direct vanuit Expo Go). Zorg dat je
telefoon en computer op hetzelfde wifinetwerk zitten.

**Test de golden path:**
1. Registreer een account (e-mail + wachtwoord).
2. Ga naar "Toevoegen" en log een maaltijd handmatig in.
3. Controleer dat het dagtotaal op "Dagboek" klopt, en test "Doel aanpassen" om het
   caloriedoel te wijzigen.
4. Tik op "Scan barcode", scan een verpakking met barcode (bv. een pak koekjes) en
   bevestig dat de productgegevens correct worden voorgevuld en opgeslagen.
5. Tik op "Foto van maaltijd", maak een foto van iets eetbaars en bevestig dat de
   AI-schatting (naam, calorieën, macro's, zekerheid) correct wordt voorgevuld.
6. Ga naar "Trainingen": filter op sport/doel, open een training uit de vaste lijst.
7. Tik op "Laat AI een training maken", kies sport + doel, genereer, en bewaar de
   training — controleer dat 'm daarna terugkomt in de trainingenlijst (met AI-label).
8. Log uit en weer in — alle gegevens (dagboek én trainingen) moeten behouden blijven.

## 6. Projectstructuur

```
app/                  Schermen (Expo Router file-based routing)
  (auth)/login.tsx     Inloggen
  (auth)/signup.tsx     Registreren
  (tabs)/diary.tsx      Dagboek: entries + totaal vs. doel + doel aanpassen
  (tabs)/add.tsx        Handmatige invoer / voorbeeld vanuit scanner of foto
  (tabs)/workouts.tsx   Trainingenlijst: filter op sport/doel, vast + AI-opgeslagen
  scanner.tsx           Camera + barcode -> Open Food Facts
  photo-scan.tsx        Camera + foto -> AI-schatting (Cloud Function)
  workout-detail.tsx    Details van één training + verwijderen (AI-workouts)
  ai-workout.tsx        Sport + doel -> AI-training (Cloud Function) + bewaren
src/
  firebase/            Firebase-init, auth-, Firestore-, Functions- en workouts-helpers
  api/openFoodFacts.ts  Barcode -> productdata
  context/AuthContext.tsx  Ingelogde gebruiker
  data/workouts.ts      Vaste trainingscatalogus (18 workouts)
  types/food.ts         Gedeelde TypeScript-types (voeding)
  types/workout.ts       Gedeelde TypeScript-types (trainingen)
functions/              Firebase Cloud Functions (estimateMealFromPhoto + generateWorkout -> Gemini)
firestore.rules         Beveiligingsregels (plak in Firebase console)
firebase.json / .firebaserc   Firebase CLI-configuratie (functions + firestore rules)
```

## 7. Wat zit er nog niet in (bewust buiten scope van deze basis)

- Uitgebreid gebruikersprofiel / persoonlijke doelen-scherm (nu: alleen het caloriedoel, aan te passen via "Doel aanpassen" op het Dagboek-scherm)
- Koppeling tussen voltooide trainingen en het caloriedagboek (bewust los gehouden — verbrande calorieën schatten is onnauwkeurig)
- Zoeken in een voedingsdatabase (naast barcode-lookup, handmatige invoer en AI-fotoherkenning)

## 8. Roadmap: publiceren naar de App Store (zonder Mac)

1. Maak een [Apple Developer-account](https://developer.apple.com/programs/) aan ($99/jaar) — dit is verplicht voordat je iets naar de App Store kunt uploaden.
2. Installeer EAS CLI: `npm install -g eas-cli` en log in met `eas login`.
3. Configureer de build: `eas build:configure`.
4. Maak een productie-build in Expo's cloud (geen lokale Mac nodig): `eas build --platform ios`.
5. Upload de build naar App Store Connect: `eas submit --platform ios`.
6. Vul in [App Store Connect](https://appstoreconnect.apple.com/) de listing aan: screenshots, beschrijving, privacybeleid (verplicht, omdat de app accountgegevens verwerkt) en dien de app in voor review.

**App Store-tekst (alvast vastgelegd voor later):**
> Train smarter. Eat better. Evolve. All powered by AI and your dedication.

## 9. Vormgeving

Donker, modern thema met paars/violet als merkkleur — zie [src/theme/colors.ts](src/theme/colors.ts)
voor de volledige kleurenpalet. Het app-icoon/logo (drie oplopende staafjes, symbool voor
groei/progressie) staat als SVG-bron niet in de repo; de gegenereerde PNG's staan in `assets/`.
