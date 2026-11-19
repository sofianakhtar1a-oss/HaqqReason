// Fichier produit par scripts/monde/geographie.mjs : ne pas modifier à la main.
// Sources : Natural Earth (domaine public), countries-and-timezones (MIT).

/** La géographie physique de la carte (mers, lacs, fleuves, monts, sommets) et le point où écrire chaque pays. */
export const GEOGRAPHIE_URL = "/monde/geographie-941edf11f3.json";

/** Les pays qui vivent à plusieurs heures officielles : leurs heures d'hiver (en minutes d'écart avec le temps universel), de l'ouest à l'est. */
export const FUSEAUX_PAYS: Readonly<Record<string, readonly number[]>> = {"fm":[600,660],"us":[-600,-540,-480,-420,-360,-300],"es":[0,60],"ru":[120,180,240,300,360,420,480,540,600,660,720],"pt":[-60,0],"pg":[600,660],"nz":[720,765],"mn":[420,480],"mx":[-480,-420,-360,-300],"ki":[720,780,840],"id":[420,480,540],"pf":[-600,-570,-540],"tf":[240,300],"ec":[-360,-300],"gl":[-240,-120,0],"cd":[60,120],"cl":[-360,-240,-180],"ca":[-480,-420,-360,-300,-240,-210],"br":[-300,-240,-180,-120],"au":[480,570,600,630]};
