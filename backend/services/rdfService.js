function phobiaToRdf(phobia) {
  return {
    '@context': {
      '@vocab': 'http://schema.org/',
      'phoa': 'http://example.org/phoa#',
      'wd': 'http://www.wikidata.org/entity/'
    },
    '@type': 'MedicalCondition',
    '@id': `phoa:${phobia.id}`,
    'name': phobia.name,
    'description': phobia.description,
    'sameAs': `wd:${phobia.wikidataId}`,
    'phoa:symptoms': phobia.symptoms,
    'phoa:triggers': phobia.triggers
  };
}

function remedyToRdf(remedy, phobiaId) {
  const typeMap = {
    exercise: 'phoa:Exercise',
    medication: 'Drug',
    game: 'VideoGame',
    resource: 'WebPage'
  };
  return {
    '@context': {
      '@vocab': 'http://schema.org/',
      'phoa': 'http://example.org/phoa#'
    },
    '@type': typeMap[remedy.type] || 'Thing',
    '@id': `phoa:${remedy.id}`,
    'name': remedy.name,
    'description': remedy.description,
    'phoa:forPhobia': `phoa:${phobiaId}`,
    'url': remedy.url || null
  };
}

function alertToRdf(alert) {
  return {
    '@context': {
      '@vocab': 'http://schema.org/',
      'phoa': 'http://example.org/phoa#'
    },
    '@type': 'phoa:Alert',
    '@id': `phoa:${alert.id}`,
    'phoa:forPhobia': `phoa:${alert.phobiaId}`,
    'phoa:severity': alert.severity,
    'description': alert.message,
    'phoa:recommendations': alert.recommendations,
    'dateCreated': alert.createdAt
  };
}

module.exports = { phobiaToRdf, remedyToRdf, alertToRdf };
