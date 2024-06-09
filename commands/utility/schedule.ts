import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js"
import type { CommandInteraction } from "discord.js"
import { nanoid } from "nanoid"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SCHEDULE_LIMIT = 10
const TASK_LIMIT = 10

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
				.setName("view")
				.setDescription("View information about a schedule")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("schedule name")
						.setRequired(true)
				)
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === "create") {
			await createSchedule(interaction)
		} else if (interaction.options.getSubcommand() === "delete") {
			await deleteSchedule(interaction)
		} else if (interaction.options.getSubcommand() === "subscribe") {
			await subscribeToSchedule(interaction)
		} else if (interaction.options.getSubcommand() === "unsubscribe") {
			await unsubscribeFromSchedule(interaction)
		} else if (interaction.options.getSubcommand() === "list") {
			await listSchedules(interaction)
		} else if (interaction.options.getSubcommand() === "view") {
			await viewSchedule(interaction)
		}
	},
}

const responseMessage = async (
	interaction,
	content: string,
	ephemeral: boolean = false
) => {
	await interaction.reply({
		content: content,
		ephemeral: ephemeral,
	})
}

const createSchedule = async (interaction: any) => {
	if (
		interaction.guildId &&
		interaction.channelId &&
		interaction.options.getString("name")
	) {
		const allSchedulesInChannel = await prisma.schedule.findMany({
			where: {
				guild: interaction.guildId,
				channel: interaction.channelId,
			},
		})
		const index: number = allSchedulesInChannel.findIndex((schedule) => {
			return schedule.name === interaction.options.getString("name")
		})
		if (index == -1) {
			if (allSchedulesInChannel.length < SCHEDULE_LIMIT) {
				const schedule = await prisma.schedule.create({
					data: {
						id: nanoid(),
						name: interaction.options.getString("name"),
						guild: interaction.guildId,
						channel: interaction.channelId,
					},
				})
				responseMessage(
					interaction,
					`Created schedule ${schedule.name} in ${interaction.channel}`
				)
			} else {
				responseMessage(
					interaction,
					`Too many schedules in ${interaction.channel}. The limit is ${SCHEDULE_LIMIT}`
				)
			}
		} else {
			responseMessage(
				interaction,
				"Failed to create a schedule. Already exists."
			)
		}
	} else {
		responseMessage(interaction, "Failed to create a schedule")
	}
}

const deleteSchedule = async (interaction: any) => {
	if (
		interaction.guildId &&
		interaction.channelId &&
		interaction.options.getString("name")
	) {
		const checkExists = await prisma.schedule.findFirst({
			where: {
				name: interaction.options.getString("name"),
				guild: interaction.guildId,
				channel: interaction.channelId,
			},
		})
		if (checkExists) {
			const schedule = await prisma.schedule.delete({
				where: {
					id: checkExists.id,
				},
			})
			responseMessage(
				interaction,
				`Deleted schedule ${schedule.name} in ${interaction.channel}`
			)
		} else {
			responseMessage(
				interaction,
				`Failed to delete a schedule. Does not exist in ${interaction.channel}`
			)
		}
	} else {
		responseMessage(interaction, "Failed to delete a schedule.")
	}
}

const subscribeToSchedule = async (interaction: any) => {
	if (
		interaction.guildId &&
		interaction.channelId &&
		interaction.options.getString("name")
	) {
		const schedule = await prisma.schedule.findFirst({
			where: {
				name: interaction.options.getString("name"),
				guild: interaction.guildId,
				channel: interaction.channelId,
			},
			include: {
				users: true,
			},
		})
		if (schedule) {
			await prisma.schedule.update({
				where: {
					id: schedule.id,
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
			responseMessage(
				interaction,
				`${interaction.user} subscribed to ${schedule.name} in ${interaction.channel}`
			)
		} else {
			responseMessage(
				interaction,
				"Failed to subscribe to schedule. Does not exist."
			)
		}
	} else {
		responseMessage(interaction, "Failed to subscribe to schedule")
	}
}

const unsubscribeFromSchedule = async (interaction: any) => {
	if (
		interaction.guildId &&
		interaction.channelId &&
		interaction.options.getString("name")
	) {
		const schedule = await prisma.schedule.findFirst({
			where: {
				name: interaction.options.getString("name"),
				guild: interaction.guildId,
				channel: interaction.channelId,
			},
			include: {
				users: true,
			},
		})
		if (schedule) {
			await prisma.schedule.update({
				where: {
					id: schedule.id,
				},
				data: {
					users: {
						disconnect: [{ id: interaction.user.id }],
					},
				},
			})
			responseMessage(
				interaction,
				`${interaction.user} unsubscribed from ${schedule.name} in ${interaction.channel}`
			)
		} else {
			responseMessage(
				interaction,
				"Failed to unsubscribe from schedule. Does not exist."
			)
		}
	} else {
		responseMessage(interaction, "Failed to unsubscribe from schedule.")
	}
}

const emojiNumbers = {
	"1": ":one:",
	"2": ":two:",
	"3": ":three:",
	"4": ":four:",
	"5": ":five:",
	"6": ":six:",
	"7": ":seven:",
	"8": ":eight:",
	"9": ":nine:",
	"10": ":keycap_ten:",
}

const listSchedules = async (interaction: any) => {
	if (interaction.guildId && interaction.channelId) {
		const schedules = await prisma.schedule.findMany({
			where: {
				guild: interaction.guildId,
				channel: interaction.channelId,
			},
		})
		if (schedules && schedules.length != 0) {
			const schedulesEmbed = new EmbedBuilder()
				.setColor(0xed7677)
				.setTitle("SCHEDULES VIEWER")
				.setDescription(`List of schedules in ${interaction.channel}`)
			let i = 1
			schedules.forEach((schedule) => {
				schedulesEmbed.addFields({
					name: emojiNumbers[i.toString()],
					value: schedule.name,
				})
				i++
			})
			await interaction.reply({
				embeds: [schedulesEmbed],
			})
		} else {
			responseMessage(
				interaction,
				`No schedules were found in ${interaction.channel}`
			)
		}
	} else {
		responseMessage(interaction, "Error in finding schedules")
	}
}

const viewSchedule = async (interaction: any) => {
	if (
		interaction.guildId &&
		interaction.channelId &&
		interaction.options.getString("name")
	) {
		const schedule = await prisma.schedule.findFirst({
			where: {
				name: interaction.options.getString("name"),
				guild: interaction.guildId,
				channel: interaction.channelId,
			},
			include: {
				tasks: true,
			},
		})
		if (schedule) {
			const scheduleEmbed = new EmbedBuilder()
				.setColor(0xed7677)
				.setTitle("SCHEDULE VIEWER")
				.setDescription(`${interaction.channel} ${schedule.name}\n`)
			schedule.tasks.forEach((task) => {
				scheduleEmbed.addFields({
					name: `${task.emoji}`,
					value: `${task.description}`,
				})
			})

			const edit = new ButtonBuilder()
				.setCustomId("edit-schedule")
				.setLabel("edit")
				.setStyle(ButtonStyle.Primary)

			const join = new ButtonBuilder()
				.setCustomId("join-schedule")
				.setLabel("join")
				.setStyle(ButtonStyle.Success)

			const leave = new ButtonBuilder()
				.setCustomId("leave-schedule")
				.setLabel("leave")
				.setStyle(ButtonStyle.Danger)
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				edit,
				join,
				leave
			)
			const message = await interaction.reply({
				embeds: [scheduleEmbed],
				components: [row],
			})
			const filter = (i) => i.user.id === interaction.user.id
			const collector = message.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter,
				time: 30_000,
			})

			collector.on("collect", async (interaction) => {
				if (interaction.customId === "edit-schedule") {
					await interaction.reply("edit schedule")
				} else if (interaction.customId === "join-schedule") {
					await prisma.schedule.update({
						where: {
							id: schedule.id,
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
					responseMessage(
						interaction,
						`${interaction.user} subscribed to ${schedule.name} in ${interaction.channel}`
					)
				} else if (interaction.customId === "leave-schedule") {
					await prisma.schedule.update({
						where: {
							id: schedule.id,
						},
						data: {
							users: {
								disconnect: [{ id: interaction.user.id }],
							},
						},
					})
					responseMessage(
						interaction,
						`${interaction.user} unsubscribed from ${schedule.name} in ${interaction.channel}`
					)
				}
			})

			collector.on("end", () => {
				edit.setDisabled(true)
				join.setDisabled(true)
				leave.setDisabled(true)
				message.edit({
					componenets: [row],
				})
			})
		} else {
			responseMessage(
				interaction,
				"Unable to view schedule. Does not exist."
			)
		}
	} else {
		responseMessage(interaction, "Unable to view schedule.")
	}
}
