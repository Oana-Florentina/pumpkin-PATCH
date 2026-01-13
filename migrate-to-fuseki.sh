#!/bin/bash
set -e

FUSEKI="http://54.91.118.146:3030/phoa/update"
PROFILE="briana-dev-info"

echo "🔄 Migrare DynamoDB → Fuseki"

# 1. Clear Fuseki
echo "🗑️  Clearing Fuseki..."
curl -s -X POST $FUSEKI -H "Content-Type: application/sparql-update" --data-binary 'DROP ALL'

# 2. Phobias
echo "📦 Migrating phobias..."
aws dynamodb scan --table-name phoa-data --filter-expression "begins_with(PK, :pk)" --expression-attribute-values '{":pk":{"S":"PHOBIA#"}}' --region us-east-1 --profile $PROFILE --output json | python3 << 'PY'
import sys, json, requests
data = json.load(sys.stdin)
fuseki = "http://54.91.118.146:3030/phoa/update"
triples = []
for item in data['Items']:
    pid = item['id']['S']
    name = item['name']['S'].replace('"', '\\"').replace('\n', ' ')
    desc = item.get('description', {}).get('S', 'No description').replace('"', '\\"').replace('\n', ' ')
    trigger = item.get('trigger', {}).get('S', '').replace('"', '\\"')
    triple = f'<http://phoa.com/phobia/{pid}> a <http://schema.org/MedicalCondition> ; <http://schema.org/name> "{name}" ; <http://schema.org/description> "{desc}" ; <http://schema.org/identifier> "{pid}"'
    if trigger: triple += f' ; <http://phoa.com/trigger> "{trigger}"'
    triple += ' .'
    triples.append(triple)
for i in range(0, len(triples), 20):
    requests.post(fuseki, headers={'Content-Type': 'application/sparql-update'}, data=f"PREFIX schema: <http://schema.org/> INSERT DATA {{ {' '.join(triples[i:i+20])} }}")
print(f"✅ {len(triples)} phobias")
PY

# 3. Rules
echo "📋 Migrating rules..."
aws dynamodb scan --table-name phoa-triggers --region us-east-1 --profile $PROFILE --output json | python3 << 'PY'
import sys, json, requests
data = json.load(sys.stdin)
fuseki = "http://54.91.118.146:3030/phoa/update"
triples = []
for item in data['Items']:
    pid = item['phobiaId']['S']
    name = item['phobiaName']['S'].replace('"', '\\"')
    trigger = item.get('mainTrigger', {}).get('S', '').replace('"', '\\"')
    triple = f'<http://phoa.com/rule/{pid}> a <http://schema.org/PropertyValueSpecification> ; <http://schema.org/name> "{name}"'
    if trigger: triple += f' ; <http://phoa.com/mainTrigger> "{trigger}"'
    for sr in item['sensorRules']['L']:
        s = sr['M']
        sname = s['name']['S']
        if 'S' in s['value']: triple += f' ; <http://phoa.com/{sname}> "{s["value"]["S"]}"'
        elif 'N' in s['value']: triple += f' ; <http://phoa.com/{sname}> {s["value"]["N"]}'
        elif 'BOOL' in s['value']: triple += f' ; <http://phoa.com/{sname}> {str(s["value"]["BOOL"]).lower()}'
    triple += ' .'
    triples.append(triple)
requests.post(fuseki, headers={'Content-Type': 'application/sparql-update'}, data=f"PREFIX schema: <http://schema.org/> INSERT DATA {{ {' '.join(triples)} }}")
print(f"✅ {len(triples)} rules")
PY

# 4. Treatments
echo "💊 Migrating treatments..."
aws dynamodb scan --table-name phoa-data --filter-expression "begins_with(PK, :pk)" --expression-attribute-values '{":pk":{"S":"PHOBIA#"}}' --region us-east-1 --profile $PROFILE --output json | python3 << 'PY'
import sys, json, requests
data = json.load(sys.stdin)
fuseki = "http://54.91.118.146:3030/phoa/update"
triples = []
for item in data['Items']:
    pid = item['id']['S']
    for i, t in enumerate(item.get('possibleTreatment', {}).get('L', [])):
        tm = t.get('M', {})
        ttype = tm.get('@type', {}).get('S', 'Treatment')
        name = tm.get('name', {}).get('S', '').replace('"', '\\"').replace('\n', ' ')
        desc = tm.get('description', {}).get('S', '').replace('"', '\\"').replace('\n', ' ')
        url = tm.get('url', {}).get('S', '')
        if not name: continue
        triple = f'<http://phoa.com/treatment/{pid}_{i}> a <http://schema.org/{ttype}> ; <http://schema.org/name> "{name}"'
        if desc: triple += f' ; <http://schema.org/description> "{desc}"'
        if url and url.startswith('http'): triple += f' ; <http://schema.org/url> <{url}>'
        triple += f' ; <http://phoa.com/forPhobia> <http://phoa.com/phobia/{pid}> .'
        triples.append(triple)
for i in range(0, len(triples), 30):
    try: requests.post(fuseki, headers={'Content-Type': 'application/sparql-update'}, data=f"PREFIX schema: <http://schema.org/> PREFIX phoa: <http://phoa.com/> INSERT DATA {{ {' '.join(triples[i:i+30])} }}", timeout=10)
    except: pass
print(f"✅ {len(triples)} treatments")
PY

# 5. Users
echo "👤 Migrating user associations..."
curl -s -X POST $FUSEKI -H "Content-Type: application/sparql-update" --data-binary 'PREFIX schema: <http://schema.org/> INSERT DATA {
  <http://phoa.com/user/briana.maftei@gmail.com> a schema:Patient ;
    schema:medicalCondition <http://phoa.com/phobia/TEST123> ,
                            <http://phoa.com/phobia/Q3440772> ,
                            <http://phoa.com/phobia/Q_NYCTOPHOBIA> ,
                            <http://phoa.com/phobia/Q186892> .
}'

# 6. Groups
echo "👥 Migrating groups..."
aws dynamodb scan --table-name phoa-data --filter-expression "begins_with(PK, :pk) AND SK = :sk" --expression-attribute-values '{":pk":{"S":"GROUP#"},":sk":{"S":"META"}}' --region us-east-1 --profile $PROFILE --output json | python3 << 'PY'
import sys, json, requests
data = json.load(sys.stdin)
fuseki = "http://54.91.118.146:3030/phoa/update"
triples = []
for item in data['Items']:
    gid = item['PK']['S'].replace('GROUP#', '')
    name = item['name']['S'].replace('"', '\\"')
    code = item['inviteCode']['S']
    owner = item['ownerId']['S']
    triples.append(f'<http://phoa.com/group/{gid}> a <http://schema.org/Organization> ; <http://schema.org/name> "{name}" ; <http://schema.org/identifier> "{gid}" ; <http://phoa.com/inviteCode> "{code}" ; <http://schema.org/founder> <http://phoa.com/user/{owner}> .')
requests.post(fuseki, headers={'Content-Type': 'application/sparql-update'}, data=f"PREFIX schema: <http://schema.org/> INSERT DATA {{ {' '.join(triples)} }}")
print(f"✅ {len(triples)} groups")
PY

# 7. Group members
echo "👥 Migrating group members..."
aws dynamodb scan --table-name phoa-data --filter-expression "begins_with(PK, :pk) AND begins_with(SK, :sk)" --expression-attribute-values '{":pk":{"S":"GROUP#"},":sk":{"S":"MEMBER#"}}' --region us-east-1 --profile $PROFILE --output json | python3 << 'PY'
import sys, json, requests
data = json.load(sys.stdin)
fuseki = "http://54.91.118.146:3030/phoa/update"
triples = []
for item in data['Items']:
    gid = item['PK']['S'].replace('GROUP#', '')
    uid = item['userId']['S']
    triples.append(f'<http://phoa.com/group/{gid}> <http://schema.org/member> <http://phoa.com/user/{uid}> .')
requests.post(fuseki, headers={'Content-Type': 'application/sparql-update'}, data=f"PREFIX schema: <http://schema.org/> INSERT DATA {{ {' '.join(triples)} }}")
print(f"✅ {len(triples)} members")
PY

# 8. Messages
echo "💬 Migrating messages..."
aws dynamodb scan --table-name phoa-data --filter-expression "begins_with(PK, :pk) AND begins_with(SK, :sk)" --expression-attribute-values '{":pk":{"S":"GROUP#"},":sk":{"S":"REPORT#"}}' --region us-east-1 --profile $PROFILE --output json | python3 << 'PY'
import sys, json, requests
data = json.load(sys.stdin)
fuseki = "http://54.91.118.146:3030/phoa/update"
triples = []
for item in data['Items']:
    gid = item['PK']['S'].replace('GROUP#', '')
    ts = item['SK']['S'].replace('REPORT#', '')
    text = item['trigger']['S'].replace('"', '\\"').replace('\n', ' ')
    sender = item.get('reportedBy', {}).get('S', 'unknown')
    triples.append(f'<http://phoa.com/message/{ts}> a <http://schema.org/Message> ; <http://schema.org/text> "{text}" ; <http://schema.org/sender> <http://phoa.com/user/{sender}> ; <http://phoa.com/inGroup> <http://phoa.com/group/{gid}> .')
requests.post(fuseki, headers={'Content-Type': 'application/sparql-update'}, data=f"PREFIX schema: <http://schema.org/> INSERT DATA {{ {' '.join(triples)} }}")
print(f"✅ {len(triples)} messages")
PY

echo ""
echo "✅ Migrare completă! Rulează când Fuseki se oprește."
