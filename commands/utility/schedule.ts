import { SlashCommandBuilder } from "discord.js"
import type { CommandInteraction } from "discord.js"

interface Command {
	data: SlashCommandBuilder
	execute: (interaction: CommandInteraction) => void
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("schedule")
		.setDescription("Create a daily task list!"),
	async execute(interaction) {
		const message = await interaction.reply({
			content: "Pong!",
			fetchReply: true,
		})
	},
} satisfies Command
