const send = require('../modules/webhooksender')
const CHANNEL_TYPE_MAP = {
  0: 'Text channel',
  2: 'Voice channel',
  4: 'Category'
}

module.exports = {
  name: 'channelUpdateDisabled',
  type: 'on',
  handle: async (channel, oldChannel) => {
    console.log('channel update')
    if (channel.type === 1 || channel.type === 3 || !channel.guild.members.get(global.bot.user.id).permission.json['viewAuditLogs']) return
    const channelUpdateEvent = {
      guildID: channel.guild.id,
      eventName: 'channelUpdate',
      embed: {
        author: {
          name: 'Unknown User',
          icon_url: 'http://laoblogger.com/images/outlook-clipart-red-x-10.jpg'
        },
        description: `${CHANNEL_TYPE_MAP[channel.type]} was updated (${channel.name})`,
        fields: [{
          name: 'Name',
          value: channel.name
        }, {
          name: 'Creation date',
          value: new Date((channel.id / 4194304) + 1420070400000).toString()
        },
        {
          name: 'Position',
          value: channel.position
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = Unknown\nChannel = ${channel.id}\`\`\``
        }],
        color: 3553599
      }
    }
    if (channel.name !== oldChannel.name) channelUpdateEvent.embed.fields.push({name: 'Name', value: `Now: ${channel.name}\nWas: ${oldChannel.name}`})
    if (channel.nsfw !== oldChannel.nsfw) channelUpdateEvent.embed.fields.push({name: 'NSFW', value: `Now: ${channel.nsfw ? 'NSFW warning enabled' : 'NSFW warning disabled'}\nWas: ${oldChannel.nsfw ? 'NSFW warning enabled' : 'NSFW warning disabled'}`})
    if (channel.topic !== oldChannel.topic) channelUpdateEvent.embed.fields.push({name: 'Topic', value: `Now: ${channel.topic.substr(0, 400)}\nWas: ${oldChannel.topic.substr(0, 400)}`})
    if (channel.bitrate && (channel.bitrate !== oldChannel.bitrate)) channelUpdateEvent.embed.fields.push({name: 'Bitrate', value: `Now: ${channel.bitrate}\nWas: ${oldChannel.bitrate}`})
    let channelOverwrites = channel.permissionOverwrites.map(o => o) // convert to array
    let oldOverwrites = oldChannel.permissionOverwrites.map(o => o)
    const uniques = getDifference(channelOverwrites, oldOverwrites)
    let auditLogId
    if (channelOverwrites.length > oldOverwrites.length) {
      auditLogId = 13
      channelOverwrites = channelOverwrites.filter(val => !uniques.includes(val))
    } else if (oldOverwrites.length > channelOverwrites.length) {
      auditLogId = 15
      oldOverwrites = oldOverwrites.filter(val => !uniques.includes(val))
    } else auditLogId = 14
    channelOverwrites.forEach(newOverwrite => {
      const oldOverwrite = oldOverwrites.find(ow => ow.id === newOverwrite.id)
      const newPerms = Object.keys(newOverwrite.json)
      const oldPerms = Object.keys(oldOverwrite.json)
      console.log('DIFFERENCE', getDifference(newPerms, oldPerms))
      if (channel.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).toString() !== oldChannel.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).toString()) return
      console.log(newPerms, oldPerms)
      let overwriteName = newOverwrite.type + ' '
      if (newOverwrite.type === 'member') {
        const member = channel.guild.members.get(newOverwrite.id)
        overwriteName += member.username + member.nick ? `(${member.mention})` : ''
      } else {
        const role = channel.guild.roles.find(r => r.id === newOverwrite.id)
        overwriteName += role.name
        if (role.color) channelUpdateEvent.embed.color = role.color
      }
      let field = {
        name: overwriteName,
        value: ''
      }
      newPerms.forEach(perm => {
        if (newOverwrite.json.hasOwnProperty(perm) && oldOverwrite.json.hasOwnProperty(perm)) {
          if (newOverwrite.json[perm] === true && oldOverwrite.json[perm] === false) {
            field.value += `\n<:plus:480606882311176192> ${perm}`
          } else if (newOverwrite.json[perm] === false && oldOverwrite.json[perm] === true) {
            field.value += `\n<:fullredminus:480606882294267924> ${perm}`
          }
        } else if (newOverwrite.json.hasOwnProperty(perm) && !oldOverwrite.json.hasOwnProperty(perm)) {
          if (newOverwrite.json[perm]) {
            field.value += `\n<:plus:480606882311176192> ${perm}`
          } else {
            field.value += `\n<:fullredminus:480606882294267924> ${perm}`
          }
        } else if (!newOverwrite.json.hasOwnProperty(perm) && oldOverwrite.json.hasOwnProperty(perm)) {
          field.value += `\n😐 INHERIT ${perm}`
        }
      })
      ////////////////////
      channelUpdateEvent.embed.fields.push(field)
    })
    console.log(channelUpdateEvent.embed.fields)
    await setTimeout(async () => {
      const logs = await channel.guild.getAuditLogs(1, null, auditLogId)
      const log = logs.entries[0]
      const user = logs.users[0]
      if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() < 3000) { // if the audit log is less than 3 seconds off
        channelUpdateEvent.embed.author.name = `${user.username}#${user.discriminator}`
        channelUpdateEvent.embed.author.icon_url = user.avatarURL
        channelUpdateEvent.embed.fields[3].value = `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\``
        await send(channelUpdateEvent)
      } else {
        await send(channelUpdateEvent)
      }
    }, 1000)
  }
}

function getDifference(array1, array2) {
  return array1.filter(x => {
    return array2.indexOf(x) < 0
  })
}