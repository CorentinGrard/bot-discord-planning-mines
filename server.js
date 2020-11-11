require("dotenv").config();

const Discord = require("discord.js");
const fetch = require("node-fetch");
const base64 = require("base-64");
const ical = require("node-ical");
const schedule = require("node-schedule");

const client = new Discord.Client();
global.Headers = fetch.Headers;
let activated, job;

function getPlanning(channel) {
  const date = new Date();
  const today = date.getFullYear() + date.getMonth() + date.getDay();

  const url = `http://planning-eleves.mines-ales.fr/export/promo/45/${today}/${today}`;
  const username = process.env.MINES_USERNAME;
  const password = process.env.MINES_PASSWORD;
  let headers = new Headers();
  headers.set(
    "Authorization",
    "Basic " + base64.encode(username + ":" + password)
  );

  fetch(url, {
    headers: headers,
  })
    .then((res) => res.text())
    .then((body) => {
      const cours = ical.sync.parseICS(body);
      for (const cour of Object.values(cours)) {
        if (cour.type === "VEVENT") {
          let startDate = new Date(
            new Date(cour.start).getTime() - 1000 * 60 * 5
          );
          schedule.scheduleJob(
            startDate,
            function (description, channel) {
              channel.send(
                `C'est l'heure de signer ! \n ${description} \n https://campus2.mines-ales.fr/course/view.php?id=1186`
              );
            }.bind(null, cour.description, channel)
          );
        }
      }
    });
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (msg) => {
  if (msg.content === "!planning") {
    if (!activated) {
      activated = true;
      msg.reply("Planning bot activated");
      getPlanning(msg.channel);
      job = schedule.scheduleJob(
        "0 1 * * *",
        function (channel) {
          getPlanning(channel);
        }.bind(null, msg.channel)
      );
    } else {
      activated = false;
      msg.reply("Planning bot deactivated");
      job.cancel();
    }
  }
});

client.login(process.env.DISCORD_TOKEN);