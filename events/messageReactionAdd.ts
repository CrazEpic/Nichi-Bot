import { Events } from "discord.js"

module.exports = {
	name: Events.MessageReactionAdd,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client}`)
	},
}
