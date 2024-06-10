import fs from "fs"
import { SlashCommandBuilder } from "@discordjs/builders"

module.exports = {
	data: new SlashCommandBuilder().setName("help").setDescription("Lists all available commands"),
	async execute(interaction) {
		const commandFiles = fs.readdirSync("./commands/utility").filter((file) => file.endsWith(".ts"))
		let str: string = ""
		for (const file of commandFiles) {
			const command = require(`./${file}`)
			str += `Name: ${command.data.name}, Description: ${command.data.description} \n`
		}

		return interaction.reply({
			content: str,
			ephemeral: true,
		})
	},
}
