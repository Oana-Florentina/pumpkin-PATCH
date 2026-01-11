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

async function searchPhobiasInWikidata(searchTerm) {
  const query = `
    SELECT ?phobia ?label ?description WHERE {
      ?phobia wdt:P31 wd:Q175854 .
      ?phobia rdfs:label ?label .
      ?phobia schema:description ?description .
      FILTER(LANG(?label) = "en")
      FILTER(LANG(?description) = "en")
      FILTER(CONTAINS(LCASE(?label), LCASE("${searchTerm}")))
    } LIMIT 10
  `;

  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'PhoA-App/1.0' } });
  const data = await res.json();

  return data.results.bindings.map(b => ({
    wikidataId: b.phobia.value.split('/').pop(),
    label: b.label.value,
    description: b.description.value
  }));
}

module.exports = { getPhobiaFromWikidata, searchPhobiasInWikidata };
