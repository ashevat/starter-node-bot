var Botkit = require('botkit')
var http = require('http')

// Expect a SLACK_TOKEN environment variable


var controller = Botkit.slackbot()
require('beepboop-botkit').start(controller)


//bot.startRTM(function (err, bot, payload) {
//  if (err) {
//    throw new Error('Could not connect to Slack')
//  }
//})


controller.setupWebserver(process.env.PORT,function(err,webserver) {
  controller.createWebhookEndpoints(webserver);
});

controller.on('slash_command', function (bot, message) {
  console.log('Here is the actual slash command used: ', message.command);

  bot.replyPublic(message, '<@' + message.user + '> is cool!');
});

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "Hello team :wave: I am your WordsBot - give me a word and I will provide you with Definition and Synonyms. \n I support direct mentions and DMs, I will not read what is in this channel,  you will need to `@wordsbot: word-you-are-looking-for` me.")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, ':wave:')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello. ')
  bot.reply(message, 'It\'s nice to talk to you directly. tell me a word and I will provide you with Definition and Synonyms')
})

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'Thanks for the mention! tell me a word (DM me or @wordsbot: word) and I will provide you with Definition and Synonyms')

})


controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`DM` me with a word.\n' +
      '`@wordsbot:` with a word.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})


controller.hears(['define.*', 'Define.*'], ['direct_message', 'direct_mention'], function (bot, message) {
  message.text = message.text.substr(7).trim();
  defineWord(bot, message);

})

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  defineWord(bot, message);
})

function defineWord(bot, message){
  word  = message.text
  //bot.reply(message, "Looking for `"+word+"`");
  safe_word = encodeURIComponent(word)
  var options = {
    host: 'www.dictionaryapi.com',
    path: '/api/v1/references/thesaurus/xml/'+safe_word+'?key=d08999a5-7466-4eca-8051-1b2dfd324740'
  };

  callback = function(response) {
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      var parseString = require('xml2js').parseString;
      var xml = str;
      var results = [];
      parseString(xml, function (err, result) {
        console.dir(JSON.stringify(result));
        results = result
        //
      });
      console.log(str);
      // check if there are results-
      if(!("entry" in results["entry_list"])){
        bot.reply(message, "Could not find a Definition or Synonyms for "+word);
        return;
      }
      var attachments = []
      var resultNum = results["entry_list"]["entry"].length;
      for(pos = 0; pos < resultNum ; pos++){
        definition  = results["entry_list"]["entry"][pos]["sens"][0]["mc"][0];
        synonyms  = results["entry_list"]["entry"][pos]["sens"][0]["syn"][0];
        synonyms_ = results["entry_list"]["entry"][pos]["sens"][0]["syn"][0]["_"]
        name = results["entry_list"]["entry"][pos]['$']["id"]
        if(synonyms_ != undefined){
          synonyms = synonyms_;
        }
        //console.log("synonyms = "+ JSON.stringify(synonyms));
        //console.log("synonyms_ = "+ JSON.stringify(synonyms_));
        color = getRandomColor();
        attachments.push(
            {
              'fallback': 'Definition  -  `'+ definition +'`',
              'title': 'Definition ('+name.replace("{ndash}", "-")+')',
              'text': definition,
              'color': color
            },
            {
              'fallback': 'Synonyms -  `'+ synonyms +'`',
              'title': 'Synonyms ('+name.replace("{ndash}", "-")+')',
              'text': synonyms,
              'color': color
            }
        )

      }



      var reply_with_attachments = {
        //'username': 'My bot' ,
        'text': resultNum+' results for `'+word+'`',
        'attachments': attachments,
       // 'icon_url': 'http://lorempixel.com/48/48'
      }


      bot.reply(message, reply_with_attachments);
    });
  }

  http.request(options, callback).end();




}

function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}