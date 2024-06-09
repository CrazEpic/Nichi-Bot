import { SlashCommandBuilder } from "discord.js"
import type { CommandInteraction } from "discord.js"
import { nanoid } from "nanoid"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface Command {
	data: SlashCommandBuilder
	execute: (interaction: CommandInteraction) => void
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("schedule")
		.setDescription("Create a daily task list!"),
	async execute(interaction) {
		if (interaction.guildId && interaction.channelId) {
			await prisma.schedule.create({
				data: {
					id: nanoid(),
					guild: interaction.guildId,
					channel: interaction.channelId,
				},
			})
			const message = await interaction.reply({
				content: `Created a schedule for ${interaction.guild?.name} in ${interaction.channel}`,
			})
		} else {
			const message = await interaction.reply({
				content: `Failed to create a schedule`,
			})
		}
	},
} satisfies Command
