const express = require('express');
const router = express.Router();
const axios = require('axios');

const FUSEKI_URL = 'http://54.91.118.146:3030/phoa';

router.get('/', async (req, res) => {
  try {
    console.log('Fetching phobias from Fuseki...');
    const query = `
      PREFIX schema: <http://schema.org/>
      PREFIX phoa: <http://phoa.com/>
      
      SELECT ?id ?name ?description ?trigger WHERE {
        ?phobia a schema:MedicalCondition ;
          schema:identifier ?id ;
          schema:name ?name ;
          schema:description ?description .
        OPTIONAL { ?phobia phoa:trigger ?trigger }
      }
    `;
    
    const response = await axios.post(`${FUSEKI_URL}/query`, query, {
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`Fuseki returned ${response.data.results.bindings.length} phobias`);
    
    const phobias = response.data.results.bindings.map(b => ({
      id: b.id.value,
      name: b.name.value,
      description: b.description.value,
      trigger: b.trigger?.value || null
    }));
    
    if (req.query.format === 'jsonld') {
      res.set('Content-Type', 'application/ld+json');
      return res.json({
        '@context': 'http://schema.org/',
        '@graph': phobias
      });
    }
    
    res.json({ success: true, data: phobias });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const query = `
      PREFIX schema: <http://schema.org/>
      PREFIX phoa: <http://phoa.com/>
      
      SELECT ?name ?description ?trigger WHERE {
        <http://phoa.com/phobia/${req.params.id}> a schema:MedicalCondition ;
          schema:name ?name ;
          schema:description ?description .
        OPTIONAL { <http://phoa.com/phobia/${req.params.id}> phoa:trigger ?trigger }
      }
    `;
    
    const response = await axios.post(`${FUSEKI_URL}/query`, query, {
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/json'
      }
    });
    
    if (!response.data.results.bindings.length) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Phobia not found' } });
    }
    
    const b = response.data.results.bindings[0];
    const phobia = {
      id: req.params.id,
      name: b.name.value,
      description: b.description.value,
      trigger: b.trigger?.value || null,
      possibleTreatment: await getTreatments(req.params.id)
    };
    
    res.json({ success: true, data: phobia });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

async function getTreatments(phobiaId) {
  try {
    const query = `
      PREFIX schema: <http://schema.org/>
      PREFIX phoa: <http://phoa.com/>
      
      SELECT ?type ?name ?desc ?url WHERE {
        ?treatment phoa:forPhobia <http://phoa.com/phobia/${phobiaId}> ;
          a ?type ;
          schema:name ?name .
        OPTIONAL { ?treatment schema:description ?desc }
        OPTIONAL { ?treatment schema:url ?url }
      }
    `;
    
    const response = await axios.post(`${FUSEKI_URL}/query`, query, {
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/json'
      }
    });
    
    return response.data.results.bindings.map(b => ({
      '@type': b.type.value.split('/').pop(),
      name: b.name.value,
      description: b.desc?.value || '',
      url: b.url?.value || ''
    }));
  } catch (err) {
    return [];
  }
}

module.exports = router;
