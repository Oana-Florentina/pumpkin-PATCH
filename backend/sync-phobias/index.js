const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const TABLE = 'phoa-data';
const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

async function getAllPhobiasFromWikidata() {
  const query = `
    SELECT ?phobia ?label ?description ?image ?nhsId ?mainSubject ?mainSubjectLabel ?subreddit ?icd10 ?tvTropes WHERE {
      ?phobia wdt:P279* wd:Q175854 .
      ?phobia rdfs:label ?label .
      OPTIONAL { ?phobia schema:description ?description . FILTER(LANG(?description) = "en") }
      OPTIONAL { ?phobia wdt:P18 ?image }
      OPTIONAL { ?phobia wdt:P7995 ?nhsId }
      OPTIONAL { ?phobia wdt:P921 ?mainSubject . ?mainSubject rdfs:label ?mainSubjectLabel . FILTER(LANG(?mainSubjectLabel) = "en") }
      OPTIONAL { ?phobia wdt:P3984 ?subreddit }
      OPTIONAL { ?phobia wdt:P494 ?icd10 }
      OPTIONAL { ?phobia wdt:P6839 ?tvTropes }
      FILTER(LANG(?label) = "en")
    }
  `;
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
  const data = await res.json();
  
  const phobias = [];
  let index = 0;
  for (const b of data.results.bindings) {
    let description = b.description?.value;
    
    if (!description || description === 'No description available') {
      description = await fetchWikipediaDescription(b.label.value);
    }
    
    const phobia = {
      '@context': 'http://schema.org/',
      '@type': 'MedicalCondition',
      '@id': b.phobia.value,
      id: b.phobia.value.split('/').pop(),
      name: b.label.value,
      description: description || 'No description available',
      image: b.image?.value || null,
      trigger: b.mainSubjectLabel?.value || null,
      possibleTreatment: await buildTreatments(b, index, data.results.bindings.length)
    };
    phobias.push(phobia);
    index++;
  }
  
  return phobias;
}

async function fetchWikipediaDescription(phobiaName) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(phobiaName)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' }, timeout: 3000 });
    const data = await res.json();
    return data.extract?.substring(0, 200) || null;
  } catch (err) {
    return null;
  }
}

async function buildTreatments(binding, index, total) {
  const treatments = [];
  
  console.log(`Checking DBpedia for phobia ${index}/${total}: ${binding.label.value}`);
  const wikidataId = binding.phobia.value.split('/').pop();
  const dbpediaTreatment = await extractTreatmentFromDBpedia(wikidataId);
  if (dbpediaTreatment) {
    treatments.push(dbpediaTreatment);
  }
  
  if (binding.tvTropes?.value) {
    treatments.push({
      '@type': 'Game',
      name: 'Media & Games Reference',
      url: `https://tvtropes.org/pmwiki/pmwiki.php/${binding.tvTropes.value}`,
      description: 'Explore how this phobia is portrayed in games, movies, and media'
    });
  }
  
  if (binding.nhsId?.value) {
    treatments.push({
      '@type': 'WebPage',
      name: 'NHS Health Guide',
      url: `https://www.nhs.uk/conditions/${binding.nhsId.value}/`
    });
  }
  
  if (binding.subreddit?.value) {
    treatments.push({
      '@type': 'WebPage',
      name: 'Support Community',
      url: `https://reddit.com/r/${binding.subreddit.value}`
    });
  }
  
  treatments.push({
    '@type': 'PsychologicalTreatment',
    name: 'Breathing & Grounding Exercise',
    description: 'Inhale 4s, hold 7s, exhale 8s. Focus on 5 things you can see.'
  });
  
  return treatments;
}

async function extractFromMedlinePlus(icd10Code) {
  try {
    const url = `https://connect.medlineplus.gov/service?mainSearchCriteria.v.cs=2.16.840.1.113883.6.90&mainSearchCriteria.v.c=${icd10Code}&knowledgeResponseType=application/json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' }, timeout: 5000 });
    const data = await res.json();
    
    if (data.feed?.entry?.[0]) {
      const entry = data.feed.entry[0];
      return {
        '@type': 'MedicalWebPage',
        name: entry.title._value,
        url: entry.link?.[0]?.href || 'https://medlineplus.gov',
        description: entry.summary?._value?.substring(0, 200) || 'Medical information'
      };
    }
  } catch (err) {
    console.error('MedlinePlus failed:', err);
  }
  return null;
}

async function extractTreatmentFromDBpedia(wikidataId) {
  try {
    const query = `PREFIX owl: <http://www.w3.org/2002/07/owl#>
SELECT ?dbpedia WHERE {
  ?dbpedia owl:sameAs <http://www.wikidata.org/entity/${wikidataId}> .
}`;
    
    const sparqlUrl = `https://dbpedia.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    const sparqlRes = await fetch(sparqlUrl, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
    const sparqlData = await sparqlRes.json();
    
    if (!sparqlData.results.bindings.length) return null;
    
    const dbpediaUri = sparqlData.results.bindings[0].dbpedia.value;
    const dataUrl = dbpediaUri.replace('/resource/', '/data/') + '.json';
    
    const dataRes = await fetch(dataUrl, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
    const data = await dataRes.json();
    const resource = data[dbpediaUri];
    if (!resource) return null;
    
    const treatmentKey = 'http://dbpedia.org/property/treatment';
    if (resource[treatmentKey] && resource[treatmentKey][0]) {
      const treatmentUri = resource[treatmentKey][0].value;
      const treatmentName = treatmentUri.split('/').pop().replace(/_/g, ' ');
      console.log(`DBpedia treatment found for ${wikidataId}: ${treatmentName}`);
      return {
        '@type': 'MedicalTherapy',
        name: treatmentName,
        url: treatmentUri,
        description: 'Evidence-based treatment from DBpedia'
      };
    }
  } catch (err) {
    console.error(`DBpedia extraction failed for ${wikidataId}:`, err.message);
  }
  return null;
}

exports.handler = async (event) => {
  try {
    console.log('Starting phobia sync...');
    const phobias = await getAllPhobiasFromWikidata();
    console.log(`Fetched ${phobias.length} phobias from Wikidata`);
    
    for (const phobia of phobias) {
      await db.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `PHOBIA#${phobia.id}`,
          SK: 'META',
          ...phobia,
          syncedAt: new Date().toISOString()
        }
      }));
    }
    
    console.log('Sync completed');
    return { statusCode: 200, body: JSON.stringify({ synced: phobias.length }) };
  } catch (err) {
    console.error('Sync failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
