// App Store Connect: fills the version page from store/appstore/ (listing.json + screenshots).
// STEP=status only reads. STEP=fill writes text, categories, age rating, price, screenshots and the build.
// STEP=reviewer makes the review login in the app's own sign-in and sends its verification email;
// STEP=verify takes that email's code, then puts the login in the review details.
// The review password is derived from the API key secret and is never printed.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const { KEY_ID, ISSUER, BUNDLE, P8, STEP = 'status', BUILD = '', OOB = '', PLIST = '' } = process.env;
const DIR = 'store/appstore';
const L = fs.existsSync(path.join(DIR, 'listing.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'listing.json'), 'utf8')) : JSON.parse(process.env.LISTING || 'null');
const REVIEW_EMAIL = 'bettereveryday.ai+applereview@gmail.com';
const PASSWORD = 'Rr-' + crypto.createHmac('sha256', P8).update('apple-review-1').digest('base64url').slice(0, 14) + '7';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' });
  const body = b64({ iss: ISSUER, iat: now, exp: now + 1100, aud: 'appstoreconnect-v1' });
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: P8, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${head}.${body}.${sig}`;
}
let problems = 0;
async function api(p, opts = {}, soft = false) {
  const url = p.startsWith('http') ? p : 'https://api.appstoreconnect.apple.com/' + (p.startsWith('v') ? p : 'v1/' + p);
  const r = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' } });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = `${opts.method || 'GET'} ${p} ${r.status} ` + JSON.stringify((j.errors || []).map((e) => e.detail || e.title));
    if (soft) { console.log('PROBLEM ' + msg); problems++; return null; }
    throw new Error(msg);
  }
  return j;
}
const send = (method, p, data, soft = true) => api(p, { method, body: JSON.stringify(data) }, soft);
const rel = (type, id) => ({ data: { type, id } });

async function main() {
  const app = (await api('apps?filter[bundleId]=' + BUNDLE)).data[0];
  console.log('app', app.id, app.attributes.name, 'primary locale', app.attributes.primaryLocale, 'content rights', app.attributes.contentRightsDeclaration);

  const builds = (await api(`builds?filter[app]=${app.id}&sort=-uploadedDate&limit=5`)).data;
  for (const b of builds) console.log(`build ${b.attributes.version}: ${b.attributes.processingState}, expired ${b.attributes.expired}`);

  const infos = (await api(`apps/${app.id}/appInfos`)).data;
  const info = infos.find((i) => !/READY_FOR_DISTRIBUTION|REPLACED/.test(i.attributes.appStoreState || i.attributes.state)) || infos[0];
  console.log('appInfo', info.id, info.attributes.appStoreState || info.attributes.state, 'age', info.attributes.appStoreAgeRating);

  let ver = (await api(`apps/${app.id}/appStoreVersions?filter[platform]=IOS`)).data
    .find((v) => /PREPARE_FOR_SUBMISSION|DEVELOPER_REJECTED|REJECTED|METADATA_REJECTED/.test(v.attributes.appStoreState || v.attributes.appVersionState));
  console.log('version', ver ? `${ver.attributes.versionString} ${ver.attributes.appStoreState} ${ver.attributes.appVersionState || ''}` : 'none open');

  const age = (await api(`appInfos/${info.id}/ageRatingDeclaration`, {}, true))?.data;
  if (age) console.log('age rating answers', JSON.stringify(age.attributes));
  const price = await api(`apps/${app.id}/appPriceSchedule?include=manualPrices`, {}, true);
  console.log('price schedule', price ? 'set' : 'not set');
  const avail = await api(`v2/appAvailabilities/${app.id}`, {}, true) || await api(`apps/${app.id}/appAvailabilityV2`, {}, true);
  console.log('availability', avail ? JSON.stringify(avail.data.attributes) : 'not set');

  if (STEP === 'status') {
    if (ver) {
      const vl = (await api(`appStoreVersions/${ver.id}/appStoreVersionLocalizations`)).data;
      for (const l of vl) {
        const sets = (await api(`appStoreVersionLocalizations/${l.id}/appScreenshotSets?include=appScreenshots`));
        console.log('locale', l.attributes.locale, 'desc', (l.attributes.description || '').length, 'kw', (l.attributes.keywords || '').length,
          'shots', sets.data.map((s) => `${s.attributes.screenshotDisplayType}:${s.relationships.appScreenshots.data.length}`).join(' '));
      }
      const b = await api(`appStoreVersions/${ver.id}/build`, {}, true);
      console.log('attached build', b?.data?.attributes?.version || 'none');
      const rd = await api(`appStoreVersions/${ver.id}/appStoreReviewDetail`, {}, true);
      console.log('review detail', rd?.data ? JSON.stringify({ ...rd.data.attributes, demoAccountPassword: rd.data.attributes.demoAccountPassword ? 'set' : '' }) : 'none');
    }
    return;
  }

  if (STEP === 'reviewer' || STEP === 'verify') return reviewer(ver);

  // ---- fill ----
  for (const u of [L.supportUrl, L.marketingUrl, ...Object.values(L.privacyUrl)]) {
    const r = await fetch(u, { redirect: 'follow' }).catch(() => null);
    console.log('url', u, r ? r.status : 'unreachable');
  }
  if (app.attributes.contentRightsDeclaration == null)
    await send('PATCH', `apps/${app.id}`, { data: { type: 'apps', id: app.id, attributes: { contentRightsDeclaration: 'USES_THIRD_PARTY_CONTENT' } } });

  await send('PATCH', `appInfos/${info.id}`, { data: { type: 'appInfos', id: info.id, relationships: {
    primaryCategory: rel('appCategories', 'HEALTH_AND_FITNESS'), secondaryCategory: rel('appCategories', 'FOOD_AND_DRINK') } } });

  const il = (await api(`appInfos/${info.id}/appInfoLocalizations`)).data;
  for (const [loc, v] of Object.entries(L.locales)) {
    const attributes = { name: L.name, subtitle: v.subtitle, privacyPolicyUrl: L.privacyUrl[loc] };
    const have = il.find((x) => x.attributes.locale === loc);
    if (have) await send('PATCH', `appInfoLocalizations/${have.id}`, { data: { type: 'appInfoLocalizations', id: have.id, attributes } });
    else await send('POST', 'appInfoLocalizations', { data: { type: 'appInfoLocalizations', attributes: { locale: loc, ...attributes }, relationships: { appInfo: rel('appInfos', info.id) } } });
    console.log('app info', loc, 'done');
  }

  if (age) {
    // Answers from store-readiness/store-forms: medical info frequent, drug references infrequent (harms only), 18+.
    const a = {};
    for (const [k, val] of Object.entries(age.attributes)) {
      if (val !== null) continue;
      if (/Override|kidsAgeBand|developerAgeRatingInfoUrl/i.test(k)) continue;
      a[k] = typeof val === 'boolean' ? false : 'NONE';
    }
    const grade = (k, level) => { if (k in age.attributes) a[k] = level; };
    const enumOf = (s) => (/INTENSE|MILD/.test(JSON.stringify(age.attributes)) ? s : s.split('_')[0]);
    grade('medicalOrTreatmentInformation', enumOf('FREQUENT_OR_INTENSE'));
    grade('alcoholTobaccoOrDrugUseOrReferences', enumOf('INFREQUENT_OR_MILD'));
    if ('healthOrWellnessTopics' in age.attributes) a.healthOrWellnessTopics = true;
    if ('ageRatingOverrideV2' in age.attributes) a.ageRatingOverrideV2 = 'EIGHTEEN_PLUS';
    else if ('ageRatingOverride' in age.attributes) a.ageRatingOverride = 'SEVENTEEN_PLUS';
    const ok = await send('PATCH', `ageRatingDeclarations/${age.id}`, { data: { type: 'ageRatingDeclarations', id: age.id, attributes: a } });
    console.log('age rating', ok ? 'saved' : 'not saved', JSON.stringify(a));
  }

  if (!price) {
    const pts = (await api(`apps/${app.id}/appPricePoints?filter[territory]=USA&limit=200`)).data;
    const free = pts.find((p) => Number(p.attributes.customerPrice) === 0);
    const ok = free && await send('POST', 'appPriceSchedules', {
      data: { type: 'appPriceSchedules', relationships: { app: rel('apps', app.id), baseTerritory: rel('territories', 'USA'),
        manualPrices: { data: [{ type: 'appPrices', id: '${free}' }] } } },
      included: [{ type: 'appPrices', id: '${free}', attributes: { startDate: null }, relationships: { appPricePoint: rel('appPricePoints', free.id) } }] });
    console.log('price free', ok ? 'saved' : 'not saved');
  }
  if (!avail) {
    const terr = (await api('territories?limit=200')).data;
    const ok = await send('POST', 'v2/appAvailabilities', {
      data: { type: 'appAvailabilities', attributes: { availableInNewTerritories: true }, relationships: { app: rel('apps', app.id),
        territoryAvailabilities: { data: terr.map((t, i) => ({ type: 'territoryAvailabilities', id: '${t' + i + '}' })) } } },
      included: terr.map((t, i) => ({ type: 'territoryAvailabilities', id: '${t' + i + '}', attributes: { available: true },
        relationships: { territory: rel('territories', t.id) } })) });
    console.log('availability all', terr.length, 'countries', ok ? 'saved' : 'not saved');
  }

  if (!ver) {
    ver = (await send('POST', 'appStoreVersions', { data: { type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: '1.0' }, relationships: { app: rel('apps', app.id) } } }, false)).data;
    console.log('made version 1.0');
  }
  // Manual release: Android and iPhone go live together, so M releases after approval.
  await send('PATCH', `appStoreVersions/${ver.id}`, { data: { type: 'appStoreVersions', id: ver.id,
    attributes: { copyright: '2026 REBORN RISING LLC', releaseType: 'MANUAL' } } });

  const vl = (await api(`appStoreVersions/${ver.id}/appStoreVersionLocalizations`)).data;
  for (const [loc, v] of Object.entries(L.locales)) {
    const attributes = { description: v.description, keywords: v.keywords, promotionalText: v.promotionalText, supportUrl: L.supportUrl, marketingUrl: L.marketingUrl };
    let have = vl.find((x) => x.attributes.locale === loc);
    if (have) await send('PATCH', `appStoreVersionLocalizations/${have.id}`, { data: { type: 'appStoreVersionLocalizations', id: have.id, attributes } });
    else have = (await send('POST', 'appStoreVersionLocalizations', { data: { type: 'appStoreVersionLocalizations', attributes: { locale: loc, ...attributes }, relationships: { appStoreVersion: rel('appStoreVersions', ver.id) } } }))?.data;
    console.log('version text', loc, have ? 'done' : 'failed');
    if (have) await screenshots(have.id, path.join(DIR, loc));
  }

  const want = builds.find((b) => (BUILD ? b.attributes.version === BUILD : true) && b.attributes.processingState === 'VALID');
  if (want) {
    const ok = await send('PATCH', `appStoreVersions/${ver.id}/relationships/build`, rel('builds', want.id));
    console.log('attached build', want.attributes.version, ok ? 'yes' : 'no');
  } else console.log('PROBLEM no processed build', BUILD);

  const notes = { notes: L.reviewNotes, contactEmail: 'info@rebornrising.com' };
  await reviewDetail(ver, notes);
}

async function screenshots(locId, dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  const sets = (await api(`appStoreVersionLocalizations/${locId}/appScreenshotSets?include=appScreenshots`)).data;
  let set = sets.find((s) => s.attributes.screenshotDisplayType === 'APP_IPHONE_67');
  if (set && set.relationships.appScreenshots.data.length >= files.length) { console.log('  screenshots already there'); return; }
  if (set) for (const s of set.relationships.appScreenshots.data) await api(`appScreenshots/${s.id}`, { method: 'DELETE' }, true);
  else set = (await send('POST', 'appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: 'APP_IPHONE_67' },
    relationships: { appStoreVersionLocalization: rel('appStoreVersionLocalizations', locId) } } }))?.data;
  if (!set) return;
  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f));
    const shot = (await send('POST', 'appScreenshots', { data: { type: 'appScreenshots', attributes: { fileName: f, fileSize: buf.length },
      relationships: { appScreenshotSet: rel('appScreenshotSets', set.id) } } }))?.data;
    if (!shot) continue;
    for (const op of shot.attributes.uploadOperations) {
      const headers = Object.fromEntries(op.requestHeaders.map((h) => [h.name, h.value]));
      const r = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
      if (!r.ok) { console.log('PROBLEM upload', f, r.status); problems++; }
    }
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    const ok = await send('PATCH', `appScreenshots/${shot.id}`, { data: { type: 'appScreenshots', id: shot.id, attributes: { uploaded: true, sourceFileChecksum: md5 } } });
    console.log('  screenshot', f, ok ? 'uploaded' : 'failed');
  }
}

async function reviewDetail(ver, attributes) {
  if (!ver) { console.log('PROBLEM no open version'); problems++; return; }
  const users = (await api('users?limit=50')).data;
  const holder = users.find((u) => (u.attributes.roles || []).includes('ACCOUNT_HOLDER')) || users[0];
  const base = { contactFirstName: holder.attributes.firstName, contactLastName: holder.attributes.lastName, contactPhone: '+1 786 519 3342', ...attributes };
  const rd = await api(`appStoreVersions/${ver.id}/appStoreReviewDetail`, {}, true);
  const ok = rd?.data
    ? await send('PATCH', `appStoreReviewDetails/${rd.data.id}`, { data: { type: 'appStoreReviewDetails', id: rd.data.id, attributes: base } })
    : await send('POST', 'appStoreReviewDetails', { data: { type: 'appStoreReviewDetails', attributes: base, relationships: { appStoreVersion: rel('appStoreVersions', ver.id) } } });
  console.log('review details', ok ? 'saved' : 'not saved', Object.keys(base).join(','));
}

async function reviewer(ver) {
  const key = (PLIST.match(/<key>API_KEY<\/key>\s*<string>([^<]+)<\/string>/) || [])[1];
  if (!key) throw new Error('no Firebase API key in the plist secret');
  const fbx = async (method, body) => {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Ios-Bundle-Identifier': BUNDLE }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) console.log('firebase', method, r.status, j.error && j.error.message);
    return r.ok ? j : null;
  };
  if (STEP === 'reviewer') {
    let s = await fbx('signUp', { email: REVIEW_EMAIL, password: PASSWORD, returnSecureToken: true });
    if (!s) s = await fbx('signInWithPassword', { email: REVIEW_EMAIL, password: PASSWORD, returnSecureToken: true });
    if (!s) throw new Error('could not make the review login');
    const look = await fbx('lookup', { idToken: s.idToken });
    const verified = look && look.users[0].emailVerified;
    console.log('review login ready, verified', verified);
    if (!verified) console.log('verification email', (await fbx('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: s.idToken })) ? 'sent' : 'failed');
    else await reviewDetail(ver, { demoAccountName: REVIEW_EMAIL, demoAccountPassword: PASSWORD, demoAccountRequired: true });
    return;
  }
  if (OOB) console.log('verify', (await fbx('update', { oobCode: OOB })) ? 'done' : 'failed');
  const s = await fbx('signInWithPassword', { email: REVIEW_EMAIL, password: PASSWORD, returnSecureToken: true });
  const look = s && await fbx('lookup', { idToken: s.idToken });
  const verified = !!(look && look.users[0].emailVerified);
  console.log('review login verified', verified);
  if (verified) await reviewDetail(ver, { demoAccountName: REVIEW_EMAIL, demoAccountPassword: PASSWORD, demoAccountRequired: true });
}

main().then(() => { console.log(problems ? `finished with ${problems} problem(s)` : 'finished'); if (problems) process.exitCode = 1; })
  .catch((e) => { console.log(String(e.message || e)); process.exit(1); });
