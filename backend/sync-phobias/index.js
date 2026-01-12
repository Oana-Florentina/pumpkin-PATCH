const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const TABLE = 'phoa-data';
const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

async function getAllPhobiasFromWikidata() {
  const query = `
    SELECT ?phobia ?label ?description ?image ?nhsId ?mainSubject ?mainSubjectLabel ?subreddit ?icd10 WHERE {
      ?phobia wdt:P279* wd:Q175854 .
      ?phobia rdfs:label ?label .
      OPTIONAL { ?phobia schema:description ?description . FILTER(LANG(?description) = "en") }
      OPTIONAL { ?phobia wdt:P18 ?image }
      OPTIONAL { ?phobia wdt:P7995 ?nhsId }
      OPTIONAL { ?phobia wdt:P921 ?mainSubject . ?mainSubject rdfs:label ?mainSubjectLabel . FILTER(LANG(?mainSubjectLabel) = "en") }
      OPTIONAL { ?phobia wdt:P3984 ?subreddit }
      OPTIONAL { ?phobia wdt:P494 ?icd10 }
      FILTER(LANG(?label) = "en")
    }
  `;
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
  const data = await res.json();
  
  const phobias = [];
  for (const b of data.results.bindings) {
    const phobia = {
      '@context': 'http://schema.org/',
      '@type': 'MedicalCondition',
      '@id': b.phobia.value,
      id: b.phobia.value.split('/').pop(),
      name: b.label.value,
      description: b.description?.value || 'No description available',
      image: b.image?.value || null,
      trigger: b.mainSubjectLabel?.value || null,
      possibleTreatment: await buildTreatments(b)
    };
    phobias.push(phobia);
  }
  
  return phobias;
}

async function buildTreatments(binding) {
  const treatments = [];
  
  // NHS link
  if (binding.nhsId?.value) {
    treatments.push({
      '@type': 'WebPage',
      name: 'NHS Health Guide',
      url: `https://www.nhs.uk/conditions/${binding.nhsId.value}/`
    });
  }
  
  // Reddit community
  if (binding.subreddit?.value) {
    treatments.push({
      '@type': 'WebPage',
      name: 'Support Community',
      url: `https://reddit.com/r/${binding.subreddit.value}`
    });
  }
  
  // Generic treatment based on category
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

async function extractTreatmentFromDBpedia(phobiaName) {
  try {
    const query = `
      SELECT ?abstract WHERE {
        ?phobia rdfs:label "${phobiaName}"@en .
        ?phobia dbo:abstract ?abstract .
        FILTER(LANG(?abstract) = "en")
      } LIMIT 1
    `;
    const url = `https://dbpedia.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' }, timeout: 5000 });
    const data = await res.json();
    
    if (data.results.bindings.length > 0) {
      const abstract = data.results.bindings[0].abstract.value;
      const sentences = abstract.split('. ');
      
      for (const sentence of sentences) {
        if (sentence.match(/treatment|therapy|manage|cope|overcome/i)) {
          return {
            '@type': 'PsychologicalTreatment',
            name: 'Evidence-based approach',
            description: sentence.substring(0, 200) + '...'
          };
        }
      }
    }
  } catch (err) {
    console.error('DBpedia failed:', err);
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
