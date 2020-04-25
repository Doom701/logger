const setEventLogs = require('../../db/interfaces/postgres/update').setEventsLogId
const setAllOneID = require('../../db/interfaces/postgres/update').setAllEventsOneId
const cacheGuild = require('../utils/cacheGuild')
const eventList = require('../utils/constants').ALL_EVENTS

module.exports = {
  func: async (message, suffix) => {
    const webhookPerm = message.channel.permissionsOf(global.bot.user.id).json.manageWebhooks
    if (!webhookPerm) {
      await message.channel.createMessage('I lack the manage webhooks permission! This is necessary for me to send messages to your configured logging channel.')
      return
    }
    let events = suffix.split(', ')
    if (events.length === 0) events = suffix.split(',')
    events = cleanArray(events)
    if (events.length === 0 && suffix) {
      message.channel.createMessage(`<@${message.author.id}>, none of the provided events are valid. Look at ${process.env.GLOBAL_BOT_PREFIX}help to see what is valid OR visit the dashboard at <https://logger.bot>`)
    } else if (events.length === 0 && !suffix) {
      await setAllOneID(message.channel.guild.id, message.channel.id)
      await cacheGuild(message.channel.guild.id)
      message.channel.createMessage(`<@${message.author.id}>, I set all events to log here! You may have to trigger these events once or twice before the bot creates a message. Visit the dashboard at <https://logger.bot> for easier configuration.`)
    } else {
      await setEventLogs(message.channel.guild.id, message.channel.id, events)
      await cacheGuild(message.channel.guild.id)
      message.channel.createMessage(`<@${message.author.id}>, it has been done. You may have to trigger these events once or twice before the bot creates a message. Visit the dashboard at <https://logger.bot> for easier configuration!`)
    }
  },
  name: 'setchannel',
  description: `Use this in a log channel to make me log to here. setchannel without any suffix will set all events to the current channel. Otherwise, you can use *${eventList.toString(', ')}* any further components being comma separated. Example: \`${process.env.GLOBAL_BOT_PREFIX}setchannel messageDelete, messageUpdate\` OR visit <https://logger.bot> for an alternative to setchannel.`,
  perm: 'manageWebhooks',
  category: 'Logging'
}

function cleanArray (events) {
  const tempEvents = []
  events.forEach(event => {
    if (!eventList.includes(event)) return []
    eventList.forEach(validEvent => {
      const lowerEvent = validEvent.toLowerCase()
      const upperEvent = validEvent.toUpperCase()
      if (event === lowerEvent || event === upperEvent || event === validEvent) {
        tempEvents.push(validEvent)
      }
    })
  })
  return tempEvents
}
