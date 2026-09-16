# Fitness Tracker App (foundation)

Een eerste basisversie van een MyFitnessPal-achtige app: gebruikersaccounts, een
voedingsdagboek met calorieën/macro's, handmatige invoer en een barcode-scanner
die productgegevens ophaalt via [Open Food Facts](https://world.openfoodfacts.org/).

**Stack:** Expo (React Native + TypeScript) met Expo Router, Firebase (Auth + Firestore).
Gekozen zodat je vanaf Windows kunt ontwikkelen en later zonder Mac naar de App Store
kunt uploaden via Expo's cloud build-service (EAS).

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

## 4. App starten en testen

```bash
npm start
```

Scan de QR-code die verschijnt met de **Expo Go**-app op je telefoon (op iOS: open de
Camera-app en tik op de melding; op Android: scan direct vanuit Expo Go). Zorg dat je
telefoon en computer op hetzelfde wifinetwerk zitten.

**Test de golden path:**
1. Registreer een account (e-mail + wachtwoord).
2. Ga naar "Toevoegen" en log een maaltijd handmatig in.
3. Controleer dat het dagtotaal op "Dagboek" klopt.
4. Tik op "Scan barcode", scan een verpakking met barcode (bv. een pak koekjes) en
   bevestig dat de productgegevens correct worden voorgevuld en opgeslagen.
5. Log uit en weer in — de gegevens moeten behouden blijven (Firestore).

## 5. Projectstructuur

```
app/                  Schermen (Expo Router file-based routing)
  (auth)/login.tsx     Inloggen
  (auth)/signup.tsx     Registreren
  (tabs)/diary.tsx      Dagboek: entries + totaal vs. doel
  (tabs)/add.tsx        Handmatige invoer / voorbeeld vanuit scanner
  scanner.tsx           Camera + barcode -> Open Food Facts
src/
  firebase/            Firebase-init, auth- en Firestore-helpers
  api/openFoodFacts.ts  Barcode -> productdata
  context/AuthContext.tsx  Ingelogde gebruiker
  types/food.ts         Gedeelde TypeScript-types
firestore.rules         Beveiligingsregels (plak in Firebase console)
```

## 6. Wat zit er nog niet in (bewust buiten scope van deze basis)

- Uitgebreid gebruikersprofiel / persoonlijke doelen-scherm (nu: vast caloriedoel van 2000 kcal, aan te passen in `src/firebase/auth.ts`)
- Beweging/workout-tracking
- Zoeken in een voedingsdatabase (nu alleen barcode-lookup of handmatige invoer)

## 7. Roadmap: publiceren naar de App Store (zonder Mac)

1. Maak een [Apple Developer-account](https://developer.apple.com/programs/) aan ($99/jaar) — dit is verplicht voordat je iets naar de App Store kunt uploaden.
2. Installeer EAS CLI: `npm install -g eas-cli` en log in met `eas login`.
3. Configureer de build: `eas build:configure`.
4. Maak een productie-build in Expo's cloud (geen lokale Mac nodig): `eas build --platform ios`.
5. Upload de build naar App Store Connect: `eas submit --platform ios`.
6. Vul in [App Store Connect](https://appstoreconnect.apple.com/) de listing aan: screenshots, beschrijving, privacybeleid (verplicht, omdat de app accountgegevens verwerkt) en dien de app in voor review.
