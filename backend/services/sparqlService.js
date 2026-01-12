const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

async function getPhobiaFromWikidata(wikidataId) {
  const query = `
    SELECT ?label ?description WHERE {
      wd:${wikidataId} rdfs:label ?label .
      wd:${wikidataId} schema:description ?description .
      FILTER(LANG(?label) = "en")
      FILTER(LANG(?description) = "en")
    } LIMIT 1
  `;

  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
  const data = await res.json();

  if (data.results.bindings.length > 0) {
    const result = data.results.bindings[0];
    return {
      label: result.label.value,
      description: result.description.value
    };
  }
  return null;
}

async function getAllPhobiasFromWikidata() {
  const query = `
    SELECT ?phobia ?label ?description ?image ?nhsId WHERE {
      ?phobia wdt:P279* wd:Q175854 .
      ?phobia rdfs:label ?label .
      OPTIONAL { ?phobia schema:description ?description . FILTER(LANG(?description) = "en") }
      OPTIONAL { ?phobia wdt:P18 ?image }
      OPTIONAL { ?phobia wdt:P7807 ?nhsId }
      FILTER(LANG(?label) = "en")
    }
  `;
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
  const data = await res.json();
  
  return data.results.bindings.map(b => ({
    id: b.phobia.value.split('/').pop(),
    name: b.label.value || 'Unknown',
    description: b.description?.value || 'No description available',
    wikidataUrl: b.phobia.value,
    image: b.image?.value || null,
    nhsUrl: b.nhsId?.value ? `https://www.nhs.uk/conditions/${b.nhsId.value}/` : null
  }));
}

async function searchPhobiasInWikidata(searchTerm) {
  const query = `
    SELECT ?phobia ?label ?description WHERE {
      ?phobia wdt:P279* wd:Q175854 .
      ?phobia rdfs:label ?label .
      OPTIONAL { ?phobia schema:description ?description . FILTER(LANG(?description) = "en") }
      FILTER(LANG(?label) = "en")
      FILTER(CONTAINS(LCASE(?label), LCASE("${searchTerm}")))
    } LIMIT 10
  `;

  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
  const data = await res.json();

  return data.results.bindings.map(b => ({
    wikidataId: b.phobia.value.split('/').pop(),
    label: b.label.value,
    description: b.description?.value || ''
  }));
}

module.exports = { getPhobiaFromWikidata, searchPhobiasInWikidata, getAllPhobiasFromWikidata };
