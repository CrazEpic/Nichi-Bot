import { Events } from "discord.js"
import { CronJob } from "cron"

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Daily scheduler`)
		const dailyMessage = CronJob.from({
			// s m h day month dayOfWeek
			cronTime: "* * * * * *",
			onTick: () => {
				const guild = client.guilds.cache.get("")
				const channel = guild.channels.cache.get("")
				channel.send("This is your daily reminder! <:8077chibisurprised:1248835869893328926>")
			},
			start: true,
			timeZone: "America/Chicago",
		})
	},
}
