# VR26 data build (PC session, started 2026-10-17 13:30 UTC, M said EXECUTE)

| Part | File | State |
|---|---|---|
| Everyday foods (USDA FNDDS + Foundation + curated) | out/foods-add.json (5,408 rows, app format) | DONE, checked (out/foods-report.txt) |
| Hammer Strength machines | machines/hammer-strength.json | DONE, 95 items (to review) |
| Panatta machines | machines/panatta.json | DONE, 97 items (to review) |
| Nautilus + Life Fitness | machines/nautilus-lifefitness.json | DONE, 95 items (to review) |
| Matrix, Cybex, gym80, Prime | machines/matrix-cybex-gym80-prime.json | DONE, 141 items (to review) |
| Generic machines and cable moves | machines/generic-machines.json | DONE, 156 items (to review) |
| Chains batch 1 (McDonald's ... Hardee's) | chains/batch1.json | DONE, 834 items / 16 chains (In-N-Out, Whataburger, Carl's Jr., Hardee's via Nutritionix copies; Five Guys parts only) |
| Chains batch 2 (Starbucks ... Dairy Queen) | chains/batch2.json | DONE for 11 chains (579 items). Pending: Costa, Nando's, Jollibee (helper still running). Dairy Queen: no official data reachable |
| Chains batch 3 | chains/batch3-g5.json (Bojangles, Church's, El Pollo Loco), chains/batch3-rest.json (Jersey Mike's, Jimmy John's, Pret, Sweetgreen, CAVA, Panera, Del Taco, Cinnabon, Baskin-Robbins, Firehouse*, Arby's, Sonic) | DONE incl. chains/batch3-g4.json (Culver's, Jack in the Box, Zaxby's). *Firehouse is from a 2021 secondary copy |
| Chains batch 4 (sit-down) | chains/batch4.json (Olive Garden, Cheesecake Factory*, Applebee's, Chili's, Denny's*, IHOP) + batch4-part4 (BWW, Texas Roadhouse) + part5 (Outback, Red Lobster) + part6 (P.F. Chang's, TGI Fridays) + part7 (Johnny Rockets; Fuddruckers calories+carbs only, HOLD) ; part1-3 = pieces of batch4.json (check for duplicates) | DONE. *2021 data |
| Saudi + UAE restaurants | chains/gulf.json | DONE, 651 items / 22 chains (SA 9: Calo, Kcal, Pick, Shawarma Jalila, Shawarma House, Calofit, Herfy, Dr.Cafe, Barn's; AE 13: Kcal, Kcal Life, Calo, Lifter Life, 500 Calorie Project, Circle Cafe, Healthyfit, Meals on Me, Right Bite, Boga, Bowlife, Zaatar w Zeit, Operation Falafel). 136 calories only. Al Baik, Kudu, Maestro, Shawarmer, Al Tazaj etc. publish calories only inside their apps |
| Egypt restaurants | chains/egypt.json | DONE, 598 items / 29 places (388 full macros; big local chains publish nothing) |
| Arab home dishes | arab-dishes/dishes.json | DONE, 324 dishes (295 recipe-calculated from USDA ingredients, 29 USDA). REVIEW: a few ingredient values were typed from memory (lupini, roast chicken/lamb, medjool dates, halloumi/roumi stand-ins) and must be checked against SR in foods.json |

REVIEW DONE 2026-10-17 (node review.js -> out/review-report.md): foods, machines (584), dishes PASS (zaatar flag accepted: fibre-heavy spice). Chains 4,227 rows. Batch2 Costa/Nando's/Jollibee done. batch4-part1-3 moved to chains/_superseded (copies of batch4.json). Gulf SA/AE share chain names on purpose (separate country menus).

Held items = every row listed under "fix:" in out/review-report.md (published numbers don't add up): 16 US/intl chain items, 27 Egypt, 13 Gulf, plus Fuddruckers (no protein/fat) and the Dr Diet Saunes Burger duplicate in egypt.json. Exclude them from the VR26 hand-over.

CONVERTED to the live app format (2026-10-17, read from the live VR26 bundle in live-VR26/x): node convert.js then node verify-app.js (ALL CHECKS PASS) -> out/app/
- foods.json: drop-in, 7,092 live rows unchanged in order + 5,407 new = 12,499
- chains.json: drop-in, live 10 chains/393 items unchanged + 3,722 restaurant items + 324 Arab home dishes (as "<region> home cooking" groups, so they carry Arabic) = 109 groups / 4,439 items. Held 99 (fail 4/4/9 or Fuddruckers), 355 calories-only left out.
- exercises-add.json: 584 machines in the app exercise shape + Arabic map; needs merging into the app code (exercises are built into index.html).
Next: M approves the hand-over route (upload out/app to the reborn-app repo for the app thread).
