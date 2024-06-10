import fs from "fs"

let emojiMappings: any
fs.readFile("./utility/emojiMap.json", "utf8", function (err, data) {
	if (err) throw err
	emojiMappings = JSON.parse(data)
})

export const checkDefaultEmoji = (text: string) => {
	return emojiMappings.hasOwnProperty(text)
}

export const convertDefaultEmoji = (text: string) => {
	return emojiMappings[text]
}
