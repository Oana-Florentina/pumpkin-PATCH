const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(client);
const TABLE = 'phoa-data';

// User Phobias
async function getUserPhobias(userId) {
  const { Items } = await db.send(new QueryCommand({
    TableName: TABLE, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'PHOBIA#' }
  }));
  return Items?.map(i => ({ id: i.phobiaId, addedAt: i.addedAt })) || [];
}

async function addUserPhobia(userId, phobiaId) {
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { PK: `USER#${userId}`, SK: `PHOBIA#${phobiaId}`, phobiaId, addedAt: new Date().toISOString() }
  }));
}

async function removeUserPhobia(userId, phobiaId) {
  await db.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `USER#${userId}`, SK: `PHOBIA#${phobiaId}` } }));
}

// Groups
async function createGroup(groupId, name, inviteCode, ownerId) {
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { PK: `GROUP#${groupId}`, SK: 'META', name, inviteCode, ownerId, createdAt: new Date().toISOString() }
  }));
  await addGroupMember(groupId, ownerId);
}

async function getGroup(groupId) {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE, Key: { PK: `GROUP#${groupId}`, SK: 'META' } }));
  if (!Item) return null;
  const members = await getGroupMembers(groupId);
  return { id: groupId, ...Item, members };
}

async function getGroupMembers(groupId) {
  const { Items } = await db.send(new QueryCommand({
    TableName: TABLE, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `GROUP#${groupId}`, ':sk': 'MEMBER#' }
  }));
  return Items?.map(i => i.userId) || [];
}

async function addGroupMember(groupId, userId) {
  await db.send(new PutCommand({ TableName: TABLE, Item: { PK: `GROUP#${groupId}`, SK: `MEMBER#${userId}`, userId } }));
  await db.send(new PutCommand({ TableName: TABLE, Item: { PK: `USER#${userId}`, SK: `GROUP#${groupId}`, groupId } }));
}

async function getUserGroups(userId) {
  const { Items } = await db.send(new QueryCommand({
    TableName: TABLE, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'GROUP#' }
  }));
  const groups = [];
  for (const i of Items || []) {
    const g = await getGroup(i.groupId);
    if (g) groups.push({ id: i.groupId, name: g.name, inviteCode: g.inviteCode });
  }
  return groups;
}

module.exports = { getUserPhobias, addUserPhobia, removeUserPhobia, createGroup, getGroup, addGroupMember, getUserGroups };
