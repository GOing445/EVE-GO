const Discord = require('discord.js');
//https://discordapp.com/api/webhooks/585702224618061844/HugxTiqmBCCOWjJuHvr9iHusj1bdn6Y5dbRpMba7zKch6weVvU6hNVgV_fl-EUj-qWY0
const hook = new Discord.WebhookClient('585702224618061844', 'HugxTiqmBCCOWjJuHvr9iHusj1bdn6Y5dbRpMba7zKch6weVvU6hNVgV_fl-EUj-qWY0');

module.exports = function(body){
    hook.send(body);
    console.log(body);
}
module.exports.json = function(body){
    hook.send(JSON.stringify(body,null,4));
    console.log(JSON.stringify(body,null,4));
}