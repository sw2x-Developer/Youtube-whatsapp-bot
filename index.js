const venom = require("venom-bot");
const DownloadYTFile = require("yt-dl-playlist");
const fs = require("fs");
const youtubedl = require("youtube-dl");

venom
  .create({
    headless: true,
    devtools: false,
    useChrome: true,
    debug: false,
    logQR: true,
    browserArgs: [""],
    refreshQR: 15000,
    autoClose: 60000,
    disableSpins: true,
  })
  .then((client) => start(client));

async function start(client) {
  let seventy = false;
  let hundred = false;

  function hmsToSecondsOnly(str) {
    var p = str.split(":"),
      s = 0,
      m = 1;

    while (p.length > 0) {
      s += m * parseInt(p.pop(), 10);
      m *= 60;
    }

    return s;
  }

  function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return match && match[7].length == 11 ? match[7] : false;
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const generateRandom = (length) => {
    let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    let strr = "";

    for (let i = 0; i < length; i++) {
      strr = strr + alphabet[getRandomInt(0, alphabet.length - 1)];
    }

    return strr;
  };

  let downloader = null;

  client.onStateChange((state) => {
    console.log(state);
    const conflits = [
      venom.SocketState.CONFLICT,
      venom.SocketState.UNPAIRED,
      venom.SocketState.UNLAUNCHED,
    ];
    if (conflits.includes(state)) {
      client.useHere();
    }
  });

  client.onMessage((message) => {
    if (message.body === "احبكك") {
      client.reply(message.from, "حتى انا", message.id.toString());
    } else if (message.body.startsWith("!music")) {
      downloader = new DownloadYTFile({
        outputPath: process.cwd(),
        ffmpegPath: "ffmpeg.exe",
        maxParallelDownload: 1,
        fileNameGenerator: (videoTitle) => {
          return `${generateRandom(5)}.mp3`;
        },
      });
      let splitted = message.body.split("!music")[1];
      let id = youtube_parser(splitted);
      console.log(id);
      downloader.download(id);
      client.reply(
        message.from,
        "Download will start soon.",
        message.id.toString()
      );

      downloader.on("start", (fileInfo) => {
        console.log(fileInfo);
        client.reply(
          message.from,
          "Download started please wait!",
          message.id.toString()
        );
      });

      downloader.on("progress", (fileInfo) => {
        let progresss = parseInt(
          (hmsToSecondsOnly(fileInfo.progress.timemark) /
            60 /
            (fileInfo.ref.duration / 60)) *
            100,
          10
        );
        if (progresss > 75 && !seventy) {
          client.reply(message.from, `Progress: 75%`, message.id.toString());
          seventy = true;
        } else if (progresss > 95 && !hundred) {
          client.reply(message.from, `Progress: 100%`, message.id.toString());
          hundred = true;
        }
      });
      downloader.on("complete", (fileInfo) => {
        client.reply(
          message.from,
          "Download finished please wait as we are processing your video",
          message.id.toString()
        );
        client.sendFile(
          message.from,
          `${fileInfo.fileName}`,
          `${fileInfo.fileName}`,
          `${fileInfo.fileName}`
        );
        fs.unlink(`${fileInfo.fileName}`, (err) => {
          if (err) {
            throw err;
          } else {
            console.log("File removed successfully");
          }
        });

        fifty = false;
        seventy = false;
        hundred = false;
        downloader = null;
      });
      downloader.on("error", (fileInfo) =>
        client.reply(
          message.from,
          "Error ocurred, Please try again later!",
          message.id.toString()
        )
      );
    } else if (message.body.startsWith("!video")) {
      let splitted = message.body.split("!video")[1];
      const video = youtubedl(splitted, ["--format=18"], { cwd: __dirname });

      video.on("info", function (info) {
        client.reply(
          message.from,
          "Download started, please wait!",
          message.id.toString()
        );
      });
      let name = generateRandom(5);
      video.pipe(fs.createWriteStream(`${name}.mp4`));
      video.on("end", function () {
        "use strict";
        client.sendFile(message.from, `${name}.mp4`, `${name}.mp4`, ``);
        fs.unlink(`${name}.mp4`, (err) => {
          if (err) {
            throw err;
          } else {
            console.log("File removed successfully");
          }
        });
      });
    }
  });
}
