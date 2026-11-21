# Consignes : les faux amis (Le Truchement)

Le Truchement aide des **francophones** à apprendre l'anglais. Les faux amis sont leurs pièges
les plus coûteux : « actually » ne veut pas dire « actuellement », « library » n'est pas une
« librairie ». Tu écris la liste de référence, qui sert à une page d'étude et à un quiz.

Sortie : `src/lib/langues/faux-amis.json`, un tableau JSON de **120 à 150** entrées :

```json
{
  "en": "actually",
  "piege": "actuellement",
  "sens": "en fait, en réalité",
  "traduirePiege": "currently, at the moment",
  "exEn": "Actually, I don't like coffee very much.",
  "exFr": "En fait, je n'aime pas beaucoup le café.",
  "note": "« Actually » sert à corriger ou à préciser ; pour « actuellement », dis « currently ».",
  "niveau": "A2"
}
```

- `en` : le mot anglais (forme de dictionnaire ; « to » devant un verbe : « to attend »).
- `piege` : le mot français qui lui ressemble et qu'on croit être sa traduction.
- `sens` : ce que le mot anglais veut vraiment dire, en français (1 à 6 mots).
- `traduirePiege` : comment dire le mot français piège en anglais (1 à 6 mots).
- `exEn` / `exFr` : une phrase d'exemple naturelle avec le mot anglais, et sa traduction.
- `note` : une phrase qui aide à retenir (le piège, l'usage, une astuce de mémoire).
- `niveau` : A1 à C2, le niveau où le mot est utile.

Les grands classiques d'abord (actually, eventually, library, sensible, to attend, to assist,
chance, deception, to pretend, to realize, college, coin, journey, lecture, location,
résumé/curriculum, to rest, sympathetic, achieve, agenda, cave, comprehensive, demand,
fabric, gentle, grape, injury, issue, large, miserable, notice, petrol, phone, preservative,
prune, raisin, record, to resume, rude, sale, slip, store, sort, to supply, terrific,
ultimately, vacancy, …), puis les faux amis partiels utiles. Pas de doublon ; tout en bon
français et en anglais naturel ; contenu sain et familial.

Contrôle : `npx tsx scripts/langues/faux-amis/valider.mts` doit finir sur « 0 problème(s) ».
N'écris rien d'autre dans le dépôt, pas de git.
