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
		.setDescription("schedule commands")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("create")
				.setDescription("Create a daily task list")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("schedule name")
						.setRequired(true)
				)
				.addUserOption((option) =>
					option.setName("target").setDescription("The user")
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("delete")
				.setDescription("Delete a daily task list")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("schedule name")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("subscribe")
				.setDescription("Subscribe to a daily task list")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("schedule name")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("unsubscribe")
				.setDescription("Unsubscribe from a daily task list")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("schedule name")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("list")
				.setDescription("Lists all daily task lists in this channel")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("show")
				.setDescription("Show information about a schedule")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("schedule name")
						.setRequired(true)
				)
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === "create") {
			if (
				interaction.guildId &&
				interaction.channelId &&
				interaction.options.getString("name")
			) {
				await prisma.schedule.create({
					data: {
						id: nanoid(),
						name: interaction.options.getString("name"),
						guild: interaction.guildId,
						channel: interaction.channelId,
					},
				})
				await interaction.reply({
					content: `Created a schedule for ${interaction.guild?.name} in ${interaction.channel}`,
				})
			} else {
				await interaction.reply({
					content: `Failed to create a schedule`,
				})
			}
		} else if (interaction.options.getSubcommand() === "delete") {
			if (
				interaction.guildId &&
				interaction.channelId &&
				interaction.options.getString("name")
			) {
				const response = await prisma.schedule.findFirst({
					where: {
						name: interaction.options.getString("name"),
						guild: interaction.guildId,
						channel: interaction.channelId,
					},
				})
				if (response) {
					await prisma.schedule.delete({
						where: {
							id: response.id,
						},
					})
					await interaction.reply({
						content: `Deleted schedule ${response.name} for ${interaction.guild?.name} in ${interaction.channel}`,
					})
				} else {
					await interaction.reply({
						content: `Failed to delete a schedule`,
					})
				}
			} else {
				await interaction.reply({
					content: `Failed to delete a schedule`,
				})
			}
		} else if (interaction.options.getSubcommand() === "subscribe") {
			if (
				interaction.guildId &&
				interaction.channelId &&
				interaction.options.getString("name")
			) {
				const response = await prisma.schedule.findFirst({
					where: {
						name: interaction.options.getString("name"),
						guild: interaction.guildId,
						channel: interaction.channelId,
					},
					include: {
						users: true,
					},
				})
				if (response) {
					await prisma.schedule.update({
						where: {
							id: response.id,
						},
						data: {
							users: {
								connectOrCreate: [
									{
										create: { id: interaction.user.id },
										where: { id: interaction.user.id },
									},
								],
							},
						},
					})
					await interaction.reply({
						content: `${interaction.user} subscribed to ${response.name} for ${interaction.guild?.name} in ${interaction.channel}`,
					})
				} else {
					await interaction.reply({
						content: `Failed to subscribe to schedule`,
					})
				}
			} else {
				await interaction.reply({
					content: `Failed to subscribe to schedule`,
				})
			}
		} else if (interaction.options.getSubcommand() === "unsubscribe") {
			if (
				interaction.guildId &&
				interaction.channelId &&
				interaction.options.getString("name")
			) {
				const response = await prisma.schedule.findFirst({
					where: {
						name: interaction.options.getString("name"),
						guild: interaction.guildId,
						channel: interaction.channelId,
					},
					include: {
						users: true,
					},
				})
				if (response) {
					await prisma.schedule.update({
						where: {
							id: response.id,
						},
						data: {
							users: {
								disconnect: [{ id: interaction.user.id }],
							},
						},
					})
					await interaction.reply({
						content: `${interaction.user} unsubscribed from ${response.name} for ${interaction.guild?.name} in ${interaction.channel}`,
					})
				} else {
					await interaction.reply({
						content: `Failed to unsubscribe from schedule`,
					})
				}
			} else {
				await interaction.reply({
					content: `Failed to unsubscribe from schedule`,
				})
			}
		} else if (interaction.options.getSubcommand() === "list") {
			if (interaction.guildId && interaction.channelId) {
				const response = await prisma.schedule.findMany({
					where: {
						guild: interaction.guildId,
						channel: interaction.channelId,
					},
				})
				if (response && response.length != 0) {
					let lists: string = ""
					response.forEach((list) => {
						lists += `${list.name}\n`
					})
					await interaction.reply({
						content: `${lists}`,
					})
				} else {
					await interaction.reply({
						content: `No schedules were found`,
					})
				}
			} else {
				await interaction.reply({
					content: `No schedules were found`,
				})
			}
		} else if (interaction.options.getSubcommand() === "list") {
			if (
				interaction.guildId &&
				interaction.channelId &&
				interaction.options.getString("name")
			) {
				const response = await prisma.schedule.findFirst({
					where: {
						name: interaction.options.getString("name"),
						guild: interaction.guildId,
						channel: interaction.channelId,
					},
				})
				if (response) {
					await interaction.reply({
						content: `Name: ${response.name}\nChannel: ${interaction.channel}`
					})
				} else {
					await interaction.reply({
						content: `Unable to find schedule`,
					})
				}
			} else {
				await interaction.reply({
					content: `Unable to find schedule`,
				})
			}
		}
	},
}
