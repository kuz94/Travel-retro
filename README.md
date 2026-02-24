# 🗺️ RetroTravel — Planificateur de voyages

> Interface style Windows 95 · Données OpenStreetMap · Zéro compte · Zéro API key

---

## 📁 Arborescence du projet

```
travel-retro/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml          ← config pour Netlify
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── index.ts      ← tous les types TypeScript
    ├── utils/
    │   ├── haversine.ts  ← calcul de distance
    │   ├── overpass.ts   ← requêtes OpenStreetMap
    │   ├── schedule.ts   ← génération des horaires
    │   ├── optimize.ts   ← optimisation du parcours
    │   └── share.ts      ← partage par URL compressée
    ├── hooks/
    │   └── useLocalStorage.ts
    ├── components/
    │   ├── RetroWindow.tsx
    │   ├── MapView.tsx
    │   ├── SpotCard.tsx
    │   └── AnimeShopCard.tsx
    └── pages/
        ├── HomePage.tsx
        ├── TripPage.tsx
        └── AnimeShopsPage.tsx
```

---

## 🚀 Lancer en local (copier-coller)

> **Prérequis** : Node.js installé (https://nodejs.org, version 18+)

### Étape 1 — Ouvrir le projet dans VS Code

1. Téléchargez/copiez ce dossier `travel-retro`
2. Ouvrez VS Code
3. Faites **Fichier → Ouvrir le dossier** → choisissez `travel-retro`

### Étape 2 — Ouvrir le terminal dans VS Code

Appuyez sur **Ctrl+`** (backtick, touche sous Échap) pour ouvrir le terminal intégré.

### Étape 3 — Installer les dépendances

Copiez-collez cette commande dans le terminal, puis appuyez sur Entrée :

```bash
npm install
```

⏳ Attendez 1-2 minutes (télécharge les bibliothèques).

### Étape 4 — Lancer le site

```bash
npm run dev
```

Ouvrez votre navigateur sur : **http://localhost:5173**

✅ Le site est maintenant visible localement !

---

## 🌐 Déployer sur Netlify avec GitHub

### Étape A — Pousser sur GitHub

1. Allez sur **github.com** → cliquez sur **New repository**
2. Nommez-le `travel-retro` → cliquez **Create repository**
3. Dans le terminal VS Code, copiez-collez ces 4 commandes **une par une** :

```bash
git init
git add .
git commit -m "Premier commit - RetroTravel"
git branch -M main
```

4. GitHub vous affiche une commande comme :

```bash
git remote add origin https://github.com/VOTRE-NOM/travel-retro.git
```

Copiez-collez **votre version** de cette commande, puis :

```bash
git push -u origin main
```

✅ Votre code est maintenant sur GitHub.

---

### Étape B — Connecter Netlify

1. Allez sur **netlify.com** → connectez-vous (ou créez un compte)
2. Cliquez sur **Add new site** → **Import an existing project**
3. Cliquez **GitHub** → autorisez Netlify à accéder à vos dépôts
4. Cherchez et sélectionnez `travel-retro`

---

### Étape C — Configuration du build (IMPORTANT)

Netlify vous demande ces paramètres :

| Champ | Valeur à entrer |
|-------|----------------|
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

> 💡 Le fichier `netlify.toml` à la racine configure déjà tout ça automatiquement !

---

### Étape D — Déployer

Cliquez sur **Deploy site**.

⏳ Attendez 2-3 minutes.

✅ Netlify vous donne une URL comme `https://truc-machin-123.netlify.app`

---

### Étape E — Déploiements automatiques

À chaque fois que vous modifiez le code et faites :
```bash
git add .
git commit -m "Modification"
git push
```

→ Netlify redéploie **automatiquement** en 2-3 minutes.

---

## 🔧 Checklist dépannage

| # | Problème | Solution |
|---|----------|----------|
| 1 | `npm install` échoue | Vérifiez que Node.js est installé : `node --version` (doit afficher v18+) |
| 2 | Aucun spot trouvé | La ville a peut-être peu de données OSM. Essayez un rayon plus grand, ou une autre ville (Paris, Berlin, Tokyo) |
| 3 | Carte blanche | Attendez 2-3s que Leaflet charge. Sinon, rechargez la page (F5) |
| 4 | Erreur TypeScript au build | Lancez `npm run build` localement pour voir l'erreur exacte |
| 5 | Page blanche sur Netlify | Vérifiez que le `Publish directory` est bien `dist` dans les settings Netlify |
| 6 | 404 en rechargent la page sur Netlify | Le fichier `netlify.toml` règle ça automatiquement (redirect `/*` → `/index.html`) |
| 7 | Overpass API lente | Serveur gratuit et parfois surchargé. Réessayez dans 30s. Heures creuses = meilleures performances |
| 8 | Le drag & drop ne marche pas sur mobile | Appuyez et maintenez ⠿ 500ms avant de glisser |
| 9 | Le lien de partage est trop long | Le voyage a trop de jours. Partagez un seul jour à la fois |
| 10 | Les boutiques anime sont rares | OSM est incomplet sur ce sujet. Essayez Tokyo/Akihabara ou Paris/Porte de Saint-Cloud. Augmentez le rayon à 5km |

---

## ℹ️ Fonctionnement technique

- **Données** : OpenStreetMap via Overpass API et Nominatim (géocodage) — 100% gratuit, sans clé
- **Cartes** : Leaflet + tuiles OSM
- **Distances** : Haversine (calcul géométrique direct) — estimation, pas GPS réel
- **Transport** : Bouton "Itinéraire" → ouvre Google Maps / Apple Plans avec le bon mode
- **Sauvegarde** : localStorage du navigateur (vos voyages restent sur votre machine)
- **Partage** : URL avec données compressées via lz-string (limite ~7000 caractères)
- **Hébergement** : Netlify (CDN mondial, HTTPS automatique, gratuit jusqu'à 100GB/mois)

---

## 🎨 Stack technique

- **Framework** : React 18 + TypeScript
- **Build** : Vite 5
- **Styles** : Tailwind CSS + classes rétro custom
- **Carte** : Leaflet + react-leaflet
- **Drag & drop** : @dnd-kit
- **Compression** : lz-string
- **Déploiement** : Netlify (statique, pas de serveur)
