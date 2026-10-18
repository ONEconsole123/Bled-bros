# Bled Bros — Les chasseurs de ghwal

Un jeu de plateforme 16-bit à la Mario, 100 % marocain. Quatre héros du bled partent chasser les monstres des contes de grand-mère : ghouls, sorcières, djinns… jusqu'à Aïcha Kandicha.

## Le jeu

- **4 héros jouables**
  - **Youssef**, gamin du souk : il lance des babouches.
  - **Salma**, fille de Chaouen : rapide, double saut, elle lance des oranges.
  - **Hajj Moha**, le grand-père : coup de canne, il plane avec sa djellaba et revient toujours costaud.
  - **Amghar**, nomade du désert : sabre takouba et dash invincible.
- **4 mondes, 12 niveaux**
  - Fès (souk Attarine, tanneries Chouara)
  - Chefchaouen (ruelles bleues, Ras el Ma)
  - Merzouga (dunes, kasbah de nuit)
  - Atlas + Marrakech (villages berbères, Jemaa el-Fna la nuit)
- **4 boss avec 2 phases chacun** : la Shuwafa, la Ghoula, Bou Nar l'Afrit et Aïcha Kandicha.
- **Ennemis** : ghouls, chats noirs, sorcières volantes, djinns (ils n'avancent que si tu leur tournes le dos), scorpions, crânes de feu, chauves-souris, cobras de charmeur.
- **Bonus**
  - Msemen : tu grandis.
  - Khamsa : invincible.
  - Atay : +1 vie.
  - Dirhams : 100 pièces = 1 vie. Ils servent aussi d'argent au hanout de Ba Brahim.
- **Interface** : menus en français, répliques en darija.
- **Musique** : chiptune générée sur des maqams (Hijaz, Kurd, Ajam), avec percussions qraqeb et darbuka.
- **Sauvegarde automatique** : progression, porte-monnaie et inventaire.

Tout est généré par le code (pixel art et sons). Il n'y a aucun fichier image ni audio externe, donc aucun problème de droits.

## Contrôles

| | Clavier | Tactile |
|---|---|---|
| Bouger | ← → ou A/D | ◀ ▶ |
| Sauter (tenir = plus haut, Hajj Moha plane) | Espace / Z / ↑ | A |
| Attaquer (Amghar : dash en courant) | X / J | B |
| Pause | Entrée / Échap | II |

Les manettes sont aussi supportées.

## Lancer le projet

```bash
npm install
npx expo start        # puis scanne le QR code avec Expo Go (Android)
```

`npm start` reconstruit automatiquement le jeu (`game/` → `src/gameHtml.js`) avant de lancer Metro.

Pour jouer directement dans un navigateur :

```bash
npm run build:game    # génère game/dist/index.html
```

Ouvre ensuite `game/dist/index.html` dans un navigateur.

## Architecture

```
App.js              Shell Expo : WebView plein écran, paysage, sauvegarde AsyncStorage, bouton retour Android
src/gameHtml.js     Généré : le jeu complet en une seule page HTML (ne pas éditer à la main)
game/template.html  Page HTML + contrôles tactiles
game/build.js       Concatène game/src/*.js dans le template
game/src/
  00_core.js        Canvas 480×270, entrées (clavier/tactile/manette), sauvegarde, police pixel
  01_audio.js       Synthé chiptune, maqams, percussions gnaoua, effets sonores
  02_art.js         Peintre pixel + contour sélectif 16-bit
  03_chars.js       Les 4 héros (sprites procéduraux + stats)
  04_sprites.js     Ennemis, objets, boss
  05_world.js       Thèmes, tuiles, décors parallaxe
  06_levels.js      Niveaux en ASCII (chunks) — facile à modifier
  07_physics.js     Collisions tuiles, plateformes mobiles
  08_player.js      Le joueur
  09_entities.js    Ennemis, objets, projectiles, particules
  10_bosses.js      IA des boss
  11_level.js       Boucle de niveau, caméra, HUD
  12_ui.js          Dialogues, menus
  13_scenes.js      Titre, sélection, carte du Maroc, hanout, pause, fin…
  14_main.js        Boucle principale
```

Pour ajouter ou modifier un niveau, édite les `CHUNKS` et `LEVELS` dans `game/src/06_levels.js`. La légende des caractères est en haut du fichier.

## Publier sur le Play Store

1. Crée un compte développeur Google Play (25 $ une fois).
2. `npx eas-cli@latest login`, puis `npx eas-cli@latest build:configure`.
3. Pour tester sur ton téléphone, génère un APK : `npx eas-cli@latest build -p android --profile preview`.
4. Pour le Play Store, génère un AAB : `npx eas-cli@latest build -p android --profile production`.
5. Envoie-le : `npx eas-cli@latest submit -p android` (piste « internal » par défaut, voir `eas.json`).

L'identifiant Android est `com.bledbros.game` (dans `app.json`). Change-le avant la première publication si tu veux ton propre nom de domaine : il ne pourra plus être modifié ensuite.
