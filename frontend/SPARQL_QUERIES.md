# SPARQL Queries for PhoA Project

## Query 1: Get Phobia Information from DBpedia

```sparql
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbr: <http://dbpedia.org/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?phobia ?label ?abstract
WHERE {
  ?phobia a dbo:Disease ;
          rdfs:label ?label ;
          dbo:abstract ?abstract .
  FILTER(CONTAINS(LCASE(?label), "phobia"))
  FILTER(LANG(?label) = "en")
  FILTER(LANG(?abstract) = "en")
}
LIMIT 10
```

**Purpose**: Retrieve phobia definitions and descriptions from DBpedia knowledge base.

**Endpoint**: https://dbpedia.org/sparql


## Query 2: Get Medications for Anxiety/Phobias from Wikidata

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?drug ?drugLabel ?indication
WHERE {
  ?drug wdt:P31 wd:Q12140 ;           # instance of pharmaceutical drug
        wdt:P2175 ?condition ;         # medical condition treated
        rdfs:label ?drugLabel .
  ?condition rdfs:label ?indication .
  FILTER(CONTAINS(LCASE(?indication), "anxiety") || CONTAINS(LCASE(?indication), "phobia"))
  FILTER(LANG(?drugLabel) = "en")
  FILTER(LANG(?indication) = "en")
}
LIMIT 20
```

**Purpose**: Find medications used to treat phobias and anxiety disorders.

**Endpoint**: https://query.wikidata.org/sparql


## Query 3: Get Therapeutic Procedures from DBpedia

```sparql
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbr: <http://dbpedia.org/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?therapy ?label ?abstract
WHERE {
  ?therapy a dbo:MedicalSpecialty ;
           rdfs:label ?label ;
           dbo:abstract ?abstract .
  FILTER(CONTAINS(LCASE(?abstract), "therapy") || CONTAINS(LCASE(?abstract), "treatment"))
  FILTER(LANG(?label) = "en")
  FILTER(LANG(?abstract) = "en")
}
LIMIT 10
```

**Purpose**: Retrieve therapeutic approaches and treatment methods.

**Endpoint**: https://dbpedia.org/sparql


## Query 4: Get Allergy Information (Seasonal Context)

```sparql
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbr: <http://dbpedia.org/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?allergy ?label ?abstract ?season
WHERE {
  ?allergy a dbo:Disease ;
           rdfs:label ?label ;
           dbo:abstract ?abstract .
  FILTER(CONTAINS(LCASE(?label), "allergy") || CONTAINS(LCASE(?label), "pollen"))
  FILTER(LANG(?label) = "en")
  FILTER(LANG(?abstract) = "en")
}
LIMIT 10
```

**Purpose**: Get allergy information for context-aware alerts based on seasons.

**Endpoint**: https://dbpedia.org/sparql


## Query 5: Get Related Symptoms from Wikidata

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?condition ?conditionLabel ?symptom ?symptomLabel
WHERE {
  ?condition wdt:P31 wd:Q12136 ;        # instance of disease
             wdt:P780 ?symptom ;         # has symptom
             rdfs:label ?conditionLabel .
  ?symptom rdfs:label ?symptomLabel .
  FILTER(CONTAINS(LCASE(?conditionLabel), "phobia"))
  FILTER(LANG(?conditionLabel) = "en")
  FILTER(LANG(?symptomLabel) = "en")
}
LIMIT 15
```

**Purpose**: Identify symptoms associated with specific phobias for better user guidance.

**Endpoint**: https://query.wikidata.org/sparql


## Integration Notes

These SPARQL queries are used by the backend API to:
1. Populate the phobia database with semantic data
2. Retrieve medication recommendations
3. Fetch therapy and treatment information
4. Provide context-aware seasonal allergy data
5. Enhance user experience with symptom information

All data retrieved follows Linked Data principles and uses standard vocabularies (DBpedia Ontology, Wikidata properties, Schema.org).
