import { SlashCommandBuilder } from "discord.js"
import type { CommandInteraction } from "discord.js"

interface Command {
	data: SlashCommandBuilder
	execute: (interaction: CommandInteraction) => void
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with Pong!"),
	async execute(interaction) {
		const message = await interaction.reply({
			content: "Pong!",
			fetchReply: true,
		})
		message.react("👍").then(() => message.react("👎"))

		const collectorFilter = (reaction, user) => {
			return (
				["👍", "👎"].includes(reaction.emoji.name) &&
				user.id === interaction.user.id
			)
		}
		console.log(interaction.user.username)

		message
			.awaitReactions({
				filter: collectorFilter,
				max: 1,
				time: 60_000,
				errors: ["time"],
			})
			.then((collected) => {
				const reaction: any = collected.first()

				if (reaction.emoji.name === "👍") {
					message.reply("You reacted with a thumbs up.")
				} else {
					message.reply("You reacted with a thumbs down.")
				}
			})
			.catch((collected) => {
				message.reply(
					"You reacted with neither a thumbs up, nor a thumbs down."
				)
			})

		// setInterval(async () => {
		// 	await interaction.followUp("Ponged!")
		// }, 1000)
	},
} satisfies Command
