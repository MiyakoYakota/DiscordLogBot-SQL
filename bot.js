require('dotenv').config()

const Discord = require("discord.js-selfbot")
const bot = new Discord.Client()

const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USERNAME, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


bot.on("ready", async () => {
    console.log('----------------------------------------------------------')
    console.log('[Selfbot] Connected to Discord via the token successfully.')
    console.log('[Selfbot] Username: ' + bot.user.username)
    console.log('[Selfbot] Running on Discord API version ' + Discord.version)
    bot.guilds.cache.forEach(async guild => {
        let conn;
        try {
            conn = await pool.getConnection();
            conn.query(
                `INSERT INTO guilds value (?, ?, ?, ?, ?, ?)`,
                [BigInt(guild.id), guild.region, guild.icon, guild.name, guild.memberCount, guild.ownerID]
            ).then(() => {
                console.log(`[Database] Added guild ${guild.name} (ID: ${guild.id}, Member Count: ${guild.memberCount}): Owned by ${guild.ownerID}`)
            })
            .catch(() => {
                console.log(`[Database] Guild already exists ${guild.name} (ID: ${guild.id}, Member Count: ${guild.memberCount}): Owned by ${guild.ownerID}`)
            });
            guild.channels.cache.forEach(async channel => {
                conn.query("INSERT INTO channels value (?, ?, ?, ?, ?)",
                    [BigInt(channel.id), BigInt(channel.guild.id), channel.name, ((channel.nsfw || false) ? 1 : 0) || 0, channel.topic || 'Voice Channel']
                ).then(() => {
                    console.log(`[Database] Added channel ${channel.name} (${channel.id}): ${channel.topic || 'Voice Channel'}`)
                })
                .catch(() => {
                    console.log(`[Database] Channel already exists ${channel.name} (${channel.guild.id}): ${channel.topic || 'Voice Channel'}`)
                });
            })
        } catch (err) {
            throw err;
        } finally {
            if (conn) {
                return conn.end();
            }
        }
        
    });
})

bot.on('message', async message => {
    let conn;
        try {
            conn = await pool.getConnection();
            conn.query(
                `INSERT INTO users value (?, ?, ?, ?, ?)`,
                [BigInt(message.author.id), message.author.bot ? 1 : 0, message.author.username, message.author.discriminator, message.author.avatar]
            ).then(() => {
                console.log(`[Database] Added user ${message.author.username}#${message.author.discriminator} (${message.author.id})`)
            })
            .catch(() => {
                //pass
            });
            conn.query(
                `INSERT INTO messages value (?, ?, ?, ?)`,
                [BigInt(message.guild.id), BigInt(message.channel.id), BigInt(message.author.id), message.content]
            ).then(() => {
                console.log(`[Database] Added message from ${message.author.username}#${message.author.discriminator} (${message.author.id}): ${message.content.replace('\n', '')}`)
            })
            .catch(() => {
                //pass
            });
        } catch (err) {
            throw err;
        } finally {
            if (conn) {
                return conn.end();
            }
        }
        
})

bot.login(process.env.DISCORD_TOKEN);
