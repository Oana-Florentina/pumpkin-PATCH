const axios = require('axios');

const FUSEKI_URL = 'http://54.91.118.146:3030/phoa';

async function sparqlQuery(query) {
  const response = await axios.post(`${FUSEKI_URL}/query`, query, {
    headers: {
      'Content-Type': 'application/sparql-query',
      'Accept': 'application/json'
    }
  });
  return response.data;
}

async function sparqlUpdate(update) {
  const response = await axios.post(`${FUSEKI_URL}/update`, update, {
    headers: {
      'Content-Type': 'application/sparql-update'
    }
  });
  return response.status === 204;
}

async function getUserPhobias(userId) {
  const query = `
    PREFIX schema: <http://schema.org/>
    
    SELECT ?phobiaId WHERE {
      <http://phoa.com/user/${userId}> schema:medicalCondition ?phobia .
      ?phobia schema:identifier ?phobiaId .
    }
  `;
  
  const data = await sparqlQuery(query);
  return data.results.bindings.map(b => ({
    id: b.phobiaId.value,
    addedAt: new Date().toISOString()
  }));
}

async function addUserPhobia(userId, phobiaId) {
  const update = `
    PREFIX schema: <http://schema.org/>
    
    INSERT DATA {
      <http://phoa.com/user/${userId}> schema:medicalCondition <http://phoa.com/phobia/${phobiaId}> .
    }
  `;
  
  return sparqlUpdate(update);
}

async function removeUserPhobia(userId, phobiaId) {
  const update = `
    PREFIX schema: <http://schema.org/>
    
    DELETE DATA {
      <http://phoa.com/user/${userId}> schema:medicalCondition <http://phoa.com/phobia/${phobiaId}> .
    }
  `;
  
  return sparqlUpdate(update);
}

async function createGroup(groupId, name, inviteCode, ownerId) {
  const update = `
    PREFIX schema: <http://schema.org/>
    PREFIX phoa: <http://phoa.com/>
    
    INSERT DATA {
      <http://phoa.com/group/${groupId}> a schema:Organization ;
        schema:name "${name}" ;
        schema:identifier "${groupId}" ;
        phoa:inviteCode "${inviteCode}" ;
        schema:founder <http://phoa.com/user/${ownerId}> ;
        schema:member <http://phoa.com/user/${ownerId}> .
    }
  `;
  
  await sparqlUpdate(update);
  return true;
}

async function getGroup(groupId) {
  const query = `
    PREFIX schema: <http://schema.org/>
    PREFIX phoa: <http://phoa.com/>
    
    SELECT ?name ?inviteCode ?owner WHERE {
      <http://phoa.com/group/${groupId}> a schema:Organization ;
        schema:name ?name ;
        phoa:inviteCode ?inviteCode ;
        schema:founder ?owner .
    }
  `;
  
  const data = await sparqlQuery(query);
  if (!data.results.bindings.length) return null;
  
  const result = data.results.bindings[0];
  const members = await getGroupMembers(groupId);
  
  return {
    id: groupId,
    name: result.name.value,
    inviteCode: result.inviteCode.value,
    ownerId: result.owner.value.split('/').pop(),
    members
  };
}

async function getGroupMembers(groupId) {
  const query = `
    PREFIX schema: <http://schema.org/>
    
    SELECT ?member WHERE {
      <http://phoa.com/group/${groupId}> schema:member ?member .
    }
  `;
  
  const data = await sparqlQuery(query);
  return data.results.bindings.map(b => b.member.value.split('/').pop());
}

async function addGroupMember(groupId, userId) {
  const update = `
    PREFIX schema: <http://schema.org/>
    
    INSERT DATA {
      <http://phoa.com/group/${groupId}> schema:member <http://phoa.com/user/${userId}> .
    }
  `;
  
  return sparqlUpdate(update);
}

async function getUserGroups(userId) {
  const query = `
    PREFIX schema: <http://schema.org/>
    PREFIX phoa: <http://phoa.com/>
    
    SELECT ?groupId ?name ?inviteCode WHERE {
      ?group schema:member <http://phoa.com/user/${userId}> ;
        schema:name ?name ;
        phoa:inviteCode ?inviteCode ;
        schema:identifier ?groupId .
    }
  `;
  
  const data = await sparqlQuery(query);
  return data.results.bindings.map(b => ({
    id: b.groupId.value,
    name: b.name.value,
    inviteCode: b.inviteCode.value
  }));
}

async function getGroupMessages(groupId) {
  const query = `
    PREFIX schema: <http://schema.org/>
    PREFIX phoa: <http://phoa.com/>
    
    SELECT ?text ?sender ?timestamp WHERE {
      ?message a schema:Message ;
        schema:text ?text ;
        schema:sender ?sender ;
        phoa:inGroup <http://phoa.com/group/${groupId}> .
      OPTIONAL { ?message schema:dateCreated ?timestamp }
    }
    ORDER BY DESC(?timestamp)
  `;
  
  const data = await sparqlQuery(query);
  return data.results.bindings.map(b => ({
    text: b.text.value,
    reportedBy: b.sender.value.split('/').pop(),
    timestamp: b.timestamp?.value || Date.now().toString()
  }));
}

async function addGroupMessage(groupId, userId, trigger) {
  const timestamp = Date.now().toString();
  const update = `
    PREFIX schema: <http://schema.org/>
    PREFIX phoa: <http://phoa.com/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    INSERT DATA {
      <http://phoa.com/message/${timestamp}> a schema:Message ;
        schema:text "${trigger.replace('"', '\\"')}" ;
        schema:sender <http://phoa.com/user/${userId}> ;
        schema:dateCreated "${timestamp}"^^xsd:long ;
        phoa:inGroup <http://phoa.com/group/${groupId}> .
    }
  `;
  
  return sparqlUpdate(update);
}

async function deleteGroupMessage(groupId, timestamp) {
  const update = `
    PREFIX schema: <http://schema.org/>
    
    DELETE WHERE {
      <http://phoa.com/message/${timestamp}> ?p ?o .
    }
  `;
  
  return sparqlUpdate(update);
}

module.exports = { 
  getUserPhobias, 
  addUserPhobia, 
  removeUserPhobia, 
  createGroup, 
  getGroup, 
  addGroupMember, 
  getUserGroups,
  getGroupMessages,
  addGroupMessage,
  deleteGroupMessage
};
