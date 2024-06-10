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
		const sent = await interaction.reply({
			content: "Pinging...",
			fetchReply: true,
		})
		interaction.editReply(
			`Pong!\nRoundtrip latency: ${
				sent.createdTimestamp - interaction.createdTimestamp
			}ms`
		)
	},
} satisfies Command
