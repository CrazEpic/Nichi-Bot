import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ModalActionRowComponentBuilder,
} from "discord.js"
import { CommandInteraction } from "discord.js"
import { nanoid } from "nanoid"
import {
	checkDefaultEmoji,
	convertDefaultEmoji,
} from "../../utility/emojiMap.ts"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SCHEDULE_LIMIT = 5
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

			const editTask = new ButtonBuilder()
				.setCustomId("edit-task")
				.setLabel("Edit Task")
				.setStyle(ButtonStyle.Primary)

			const addTask = new ButtonBuilder()
				.setCustomId("add-task")
				.setLabel("Add Task")
				.setStyle(ButtonStyle.Success)

			const removeTask = new ButtonBuilder()
				.setCustomId("remove-task")
				.setLabel("Remove Task")
				.setStyle(ButtonStyle.Danger)
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				editTask,
				addTask,
				removeTask
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
				if (interaction.customId === "edit-task") {
					await interaction.reply("not implemented yet")
				} else if (interaction.customId === "add-task") {
					const modal = new ModalBuilder()
						.setCustomId("modal-add-task")
						.setTitle(`Add task to ${interaction.channel.name}`)
					const taskEmojiInput = new TextInputBuilder()
						.setCustomId("task-emoji")
						.setLabel("Pick an emoji for your task!")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
						.setMinLength(1)
						.setPlaceholder("emoji name here")
					const taskDescriptionInput = new TextInputBuilder()
						.setCustomId("task-description")
						.setLabel("Describe your task! (max 30 characters)")
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
						.setMinLength(1)
						.setMaxLength(30)
						.setPlaceholder("Do my Genshin Impact daily")
					const firstActionRow =
						new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
							taskEmojiInput
						)
					const secondActionRow =
						new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
							taskDescriptionInput
						)
					modal.addComponents(firstActionRow, secondActionRow)
					await interaction.showModal(modal)
					const filter = (interaction) =>
						interaction.customId === "modal-add-task"
					interaction
						.awaitModalSubmit({ filter, time: 60_000 })
						.then(async (modalInteraction) => {
							const taskEmoji: string =
								modalInteraction.fields.getTextInputValue(
									"task-emoji"
								)
							const taskDescription: string =
								modalInteraction.fields.getTextInputValue(
									"task-description"
								)
							let taskEmojiModified: string = `:${taskEmoji}:`
							if (!checkDefaultEmoji(taskEmoji)) {
								const serverEmoji =
									interaction.guild.emojis.cache.find(
										(emoji) => emoji.name === taskEmoji
									)
								if (!serverEmoji) {
									interaction.followUp(
										"Not a default or server emoji name"
									)
									return
								}
								taskEmojiModified = `<${taskEmojiModified}${serverEmoji.id}>`
							}
							if (
								!schedule.tasks.find(
									(task) => task.emoji === taskEmojiModified
								) &&
								schedule.tasks.length < TASK_LIMIT
							) {
								await prisma.task.create({
									data: {
										id: nanoid(),
										scheduleID: schedule.id,
										description: taskDescription,
										emoji: taskEmojiModified,
									},
								})
								modalInteraction.reply(
									`Added task ${taskEmojiModified} to ${schedule.name}`
								)
							} else {
								modalInteraction.reply(
									`Too many tasks in ${schedule.name}. The limit is ${TASK_LIMIT}`
								)
							}
						})
						.catch(() => {
							console.log("error")
						})
				} else if (interaction.customId === "remove-task") {
					const tasks = schedule.tasks.map((task) => {
						return {
							label: task.emoji,
							description: task.description,
							value: task.emoji,
						}
					})
					const taskSelectMenu = new StringSelectMenuBuilder()
						.setCustomId("string-select-remove-task")
						.setPlaceholder("Make a selection")
						.setMinValues(1)
						.setMaxValues(tasks.length)
						.addOptions(
							tasks.map((task) => {
								if (task.label.charAt(0) == ":") {
									// default emoji
									return new StringSelectMenuOptionBuilder()
										.setLabel(nanoid())
										.setDescription(task.description)
										.setValue(task.value)
										.setEmoji(
											convertDefaultEmoji(
												task.label.slice(
													1,
													task.label.length - 1
												)
											)
										)
								}
								return new StringSelectMenuOptionBuilder()
									.setLabel("task")
									.setDescription(task.description)
									.setValue(task.value)
									.setEmoji(task.label)
							})
						)
					const actionRow =
						new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
							taskSelectMenu
						)
					const message = await interaction.reply({
						content: "Pick tasks to remove (removes in 30 seconds)",
						components: [actionRow],
						fetchReply: true,
					})

					const collector = message.createMessageComponentCollector({
						componentType: ComponentType.StringSelect,
						filter: (i) =>
							i.user.id === interaction.user.id &&
							i.customId === "string-select-remove-task",
						time: 30_000,
					})
					collector.on("collect", async (i) => {
						if (!i.values.length) {
							await i.reply("Emptied selection")
							return
						}
						await i.reply(`Selected ${i.values.join(", ")}!`)
					})
					collector.on("end", async (collected) => {
						const tasksEmojisToRemove = collected.at(-1).values
						await interaction.followUp(
							`Deleting ${tasksEmojisToRemove}`
						)
						await prisma.task.deleteMany({
							where: {
								scheduleID: schedule.id,
								emoji: { in: tasksEmojisToRemove },
							},
						})
					})
				}
			})

			collector.on("end", () => {
				editTask.setDisabled(true)
				addTask.setDisabled(true)
				removeTask.setDisabled(true)
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
