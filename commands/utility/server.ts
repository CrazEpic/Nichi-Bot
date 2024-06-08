import { SlashCommandBuilder } from "discord.js"
import type { CommandInteraction } from "discord.js"

interface Command {
	data: SlashCommandBuilder
	execute: (interaction: CommandInteraction) => void
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Provides information about the server."),
	async execute(interaction) {
		if (interaction.guild !== null) {
			await interaction.reply(
				`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`
			)
		}
	},
} satisfies Command
