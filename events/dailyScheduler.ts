import { Events } from "discord.js"
import { CronJob } from "cron"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Daily scheduler`)

		const dailyMessage = CronJob.from({
			// s m h day month dayOfWeek
			cronTime: "00 * * * * *",
			onTick: async () => {
				const reminders = (await prisma.schedule.findMany()).forEach((schedule) => {
					const guild = client.guilds.cache.get(schedule.guild)
					const channel = guild.channels.cache.get(schedule.channel)
					channel.send("This is your daily reminder! <:8077chibisurprised:1248835869893328926>")
				})
			},
			start: true,
			timeZone: "America/Chicago",
		})
	},
}
