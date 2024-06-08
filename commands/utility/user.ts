import { SlashCommandBuilder } from "discord.js"
import type { CommandInteraction } from "discord.js"

interface Command {
	data: SlashCommandBuilder
	execute: (interaction: CommandInteraction) => void
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Provides information about the user."),
	async execute(interaction) {
		await interaction.reply(
			`This command was run by ${interaction.user.username}`
		)
	},
} satisfies Command
