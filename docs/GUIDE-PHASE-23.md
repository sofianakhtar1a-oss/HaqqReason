# Phase 23 · Modules réservés par mot de passe

« Les preuves de la véracité de l'islam » et « L'Islam authentique » ne s'ouvrent qu'avec un
mot de passe, **différent** de celui du mode créateur. Le graphe de connaissances, la recherche
(page et palette Ctrl+K), le débat express, les nouveautés, les sources et les fichiers joints
aux articles sont fermés de la même façon, car ils montrent le contenu de ces modules.

## Choisir le mot de passe

Espace créateur → **Sécurité** → section « Modules réservés ». Tant qu'aucun mot de passe
n'est choisi, les deux modules sont fermés à tout le monde.

- **Changer le mot de passe** : les visiteurs déjà entrés devront donner le nouveau.
- **Retirer l'accès à tout le monde** : même mot de passe, mais chacun doit le redonner.
- **Fermer les modules** : plus aucun mot de passe ne les ouvre.

## Côté visiteur

Une page « Module réservé » demande le mot de passe et indique où le demander :
Instagram `@haqqreason` et TikTok `@Haqq_Reason`. Le mot de passe est retenu 30 jours
sur l'appareil, tant qu'on reste connecté au même compte Google : se déconnecter
(ou changer de compte) referme les modules. Le créateur aussi doit donner ce mot de passe
pour lire les modules. Cinq essais ratés en quinze minutes bloquent l'appareil un moment.

Aucune migration de la base n'est nécessaire (le mot de passe est rangé, haché avec Argon2,
dans la table `reglages`, clé `acces_modules`).
