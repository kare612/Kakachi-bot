export default {
    data: {
        name: 'ping',
        description: 'يرد عليك بـ Pong!',
    },
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};
