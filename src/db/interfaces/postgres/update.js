const pool = require('../../clients/postgres')
const getDoc = require('./read').getGuild
const getUser = require('./read').getUser
const aes = require('../../aes')

async function clearEventLog (guildID) {
  return await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [[], guildID])
}

async function clearEventByID (guildID, channelID) {
    const doc = await getDoc(guildID)
    const eventLogs = doc.event_logs
  Object.keys(eventLogs).forEach(event => {
    if (eventLogs[event] === channelID) {
      eventLogs[event] = ''
    }
  })
  return await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [eventLogs, guildID])
}

async function disableEvent (guildID, event) {
  const doc = await getDoc(guildID)
  let disabled = true
  if (doc.disabled_events.includes(event)) {
    doc.disabled_events.splice(doc.disabled_events.indexOf(event), 1)
    disabled = false
  } else {
    doc.disabled_events.push(event)
  }
  await pool.query('UPDATE guilds SET disabled_events=$1 WHERE id=$2', [doc.disabled_events, guildID])
  return disabled
}

async function ignoreChannel (guildID, channelID) {
  const doc = await getDoc(guildID)
  let disabled = true
  if (doc.ignored_channels.includes(channelID)) {
    doc.ignored_channels.splice(doc.ignored_channels.indexOf(channelID), 1)
    disabled = false
  } else {
    doc.ignored_channels.push(channelID)
  }
  await pool.query('UPDATE guilds SET ignored_channels=$1 WHERE id=$2', [doc.ignored_channels, guildID])
  return disabled
}

async function toggleLogBots (guildID) {
  const doc = await getDoc(guildID)
  await pool.query('UPDATE guilds SET log_bots=$1 WHERE id=$2', [!doc.log_bots, guildID])
  return !doc.log_bots
}

async function updateNames(userID, name) {
  console.log('FED ID', userID)
  const doc = await getUser(userID)
  console.log(doc)
  doc.names.push(name)
  doc.names = aes.encrypt(JSON.stringify(doc.names))
  return await pool.query('UPDATE users SET names=$1 WHERE id=$2', [doc.names, userID])
}

exports.updateNames = updateNames
exports.toggleLogBots = toggleLogBots
exports.disableEvent = disableEvent
exports.ignoreChannel = ignoreChannel
exports.clearEventLog = clearEventLog
exports.clearEventByID = clearEventByID
