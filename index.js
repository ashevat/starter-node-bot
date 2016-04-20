var Botkit = require('botkit')
var http = require('http')

// Expect a SLACK_TOKEN environment variable
var slackToken = process.env.SLACK_TOKEN
if (!slackToken) {
  console.error('SLACK_TOKEN is required!')
  process.exit(1)
}

var controller = Botkit.slackbot()
var bot = controller.spawn({
  token: slackToken
})

bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack')
  }
})

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm here!")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'It\'s nice to talk to you directly :boom: .')
})

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'You really do care about me. :heart:')
})


controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
})

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  word  = message.text
  //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
  var options = {
    host: 'www.dictionaryapi.com',
    path: '/api/v1/references/thesaurus/xml/'+word+'?key=d08999a5-7466-4eca-8051-1b2dfd324740'
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
        'username': 'My bot' ,
        'text': resultNum+' results for `'+word+'`',
        'attachments': attachments,
        'icon_url': 'http://lorempixel.com/48/48'
      }


      bot.reply(message, reply_with_attachments);
    });
  }

  http.request(options, callback).end();



  //bot.reply(message, reply_with_attachments);

}

function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

)


//{"entry_list":{"$":{"version":"1.0"},"entry":[{"$":{"id":"fun"},"term":[{"hw":["fun"]}],"fl":["adjective"],"sens":[{"mc":["providing amusement or enjoyment"],"vi":[{"_":"there were so many things to do at summer camp that the kids really hated to leave","it":["fun"]}],"syn":["amusing, delightful, diverting, enjoyable, entertaining, pleasurable"],"rel":["agreeable, beguiling, nice, pleasant, satisfying, welcome; recreational; antic, comic, comical, droll, farcical, funny, hilarious, humorous, laughable, ludicrous, ridiculous, riotous, risible, sidesplitting, uproarious; blithesome, gay, gleeful, happy, jocose, jocund, jolly, jovial, merry, mirthful, sunny; exciting, stimulating, thrilling"],"near":["disagreeable, displeasing, distasteful, uncongenial, unlovely, unpleasant, unpleasing, unwelcome"],"ant":["boring, drab, dreary, dull, flat, heavy, humdrum, jading, leaden, monotonous, pedestrian, pleasureless, ponderous, stodgy, stuffy, tedious, tiresome, tiring, uninteresting, wearisome, weary, wearying"]}]},{"$":{"id":"fun"},"term":[{"hw":["fun"]}],"fl":["noun"],"sens":[{"sn":["1"],"mc":["someone or something that provides amusement or enjoyment"],"vi":[{"_":"theme parks with their rides, shows, and games are great for the whole family","it":["fun"]}],"syn":["delight, distraction, diversion, divertissement, entertainment, pleasure, recreation"],"rel":[{"_":"escape, pastime, time killer; binge, fling, frolic, gambol, lark, revel, rollick, romp, spree; frolicking, rollicking; carousing, conviviality, festivity, gaiety ( gayety), hilarity, jollification, jollity, merrymaking, reveling ( revelling), revelry, whoopee; picnic; laugh, riot, scream; activity, game","it":["also","or"]}],"near":["killjoy, party pooper"],"ant":["bore, bummer, downer, drag"]},{"sn":["2"],"mc":["an attitude or manner not to be taken seriously"],"vi":[{"_":"when I said that playing the piano like that could get you arrested, I only said it in ","it":["fun"]}],"syn":["game, jest, play, sport"],"rel":["facetiousness, flightiness, flippancy, frivolity, frivolousness, frothiness, levity, light-mindedness, silliness"],"near":["earnestness, gravity, seriousness, soberness, sobriety, solemnity"],"ant":["earnest"]},{"sn":["3"],"mc":["activity engaged in to amuse oneself"],"vi":[{"_":"came outside to where we were playing touch football and joined the ","it":["fun"]}],"syn":["dalliance, frolic, frolicking, fun, fun and games, recreation, relaxation, rollicking, sport"],"rel":[{"_":"gamboling ( gambolling), romping; amusement, diversion, entertainment; hobby, hobbyhorse, pastime; delight, enjoyment, pleasance, pleasure; friskiness, playfulness, sportiveness, wantonness; devilment, devilry ( deviltry), hanky-panky, hob, impishness, jinks, knavery, mischief, mischievousness, rascality, roguishness, waggery; binge, fling, kick, lark, revel, rollick, spree; hilarity, merriment, merrymaking, revelry, whoopee; buffoonery, high jinks ( hijinks), horseplay, tomfoolery","it":["or","or","also"]}],"near":["drudgery, labor, work; duty, obligation, responsibility"]},{"sn":["4"],"mc":["a state of noisy, confused activity"],"vi":[{"_":"the really began when the deer broke out of its pen and started wandering down the street","it":["fun"]}],"syn":[{"_":"ado, alarums and excursions, ballyhoo, blather, bluster, bobbery, bother, bustle, clatter, clutter [], coil, corroboree [], disturbance, do [], foofaraw, fun, furor, furore, fuss, helter-skelter, hoo-ha ( hoo-hah), hoopla, hubble-bubble, hubbub, hullabaloo, hurly, hurly-burly, hurricane, hurry, hurry-scurry ( hurry-skurry), kerfuffle [], moil, pandemonium, pother, row, ruckus, ruction, rumpus, shindy, splore [], squall, stew, stir, storm, to-do, tumult, turmoil, uproar, welter, whirl, williwaw, zoo","it":["chiefly dialect","Australian","chiefly dialect","also","or","chiefly British","Scottish"]}],"rel":[{"_":"cacophony, clamor, din, howl, hue and cry, noise, outcry, racket, roar; disorder, unrest, upheaval; eruption, flare-up, flurry, flutter, outbreak, outburst; brawl, fracas, fray, hassle, melee ( mêlée), scuffle; dither, fever, fret, lather, tizzy","it":["also"]}],"near":[{"_":"calm, hush, peace, quiet, quietude, rest, stillness, tranquillity ( tranquility); order, orderliness","it":["or"]}]}]},{"$":{"id":"fun"},"term":[{"hw":["fun"]}],"fl":["verb"],"sens":[{"mc":["to make jokes"],"vi":[{"_":"just a couple of old friends with each other","it":["funning"]}],"syn":[{"_":"banter, chaff, fool, fun, gag, jape, jest, jive, jolly, josh, kid, quip, wisecrack, yuk ( yuck) []","it":["or","slang"]}],"rel":[{"_":"gibe ( jibe), haze, jeer, mock, rag, rally, razz, rib, ridicule, tease; caricature, lampoon, parody, satirize; amuse, divert, entertain","it":["or"]}]}]},{"$":{"id":"fun and games"},"term":[{"hw":["fun and games"]}],"fl":["noun plural"],"sens":[{"sn":["1"],"mc":["a situation or state of carefree comfort"],"vi":[{"_":"soon found out that owning and maintaining a yacht wasn\'t all ","it":["fun and games"]}],"syn":["easy street, fun and games, hog heaven, picnic"],"rel":["primrose path; heaven, paradise, utopia; American dream, good life; ease, relaxation, rest"],"near":["agony, hell, horror, misery, murder, nightmare, torment, torture"]},{"sn":["2"],"mc":["activity engaged in to amuse oneself"],"vi":[{"_":"it\'s not all at the summer music camp, where students are expected to take their studies seriously","it":["fun and games"]}],"syn":["dalliance, frolic, frolicking, fun, fun and games, recreation, relaxation, rollicking, sport"],"rel":[{"_":"gamboling ( gambolling), romping; amusement, diversion, entertainment; hobby, hobbyhorse, pastime; delight, enjoyment, pleasance, pleasure; friskiness, playfulness, sportiveness, wantonness; devilment, devilry ( deviltry), hanky-panky, hob, impishness, jinks, knavery, mischief, mischievousness, rascality, roguishness, waggery; binge, fling, kick, lark, revel, rollick, spree; hilarity, merriment, merrymaking, revelry, whoopee; buffoonery, high jinks ( hijinks), horseplay, tomfoolery","it":["or","or","also"]}],"near":["drudgery, labor, work; duty, obligation, responsibility"]}]},{"$":{"id":"make"},"term":[{"hw":["make"]}],"fl":["verb"],"sens":[{"sn":["1"],"mc":["to bring into being by combining, shaping, or transforming materials"],"vi":[{"_":"will you help me the dough for the cookies?","it":["make"]}],"syn":["fabricate, fashion, form, frame, manufacture, produce"],"rel":[{"_":"assemble, build, construct, erect, make up, put up, raise, rear, set up, structure, throw up; craft, handcraft; hew; forge, mold, shape; cobble (together up), knock out, patch (together), throw up; prefabricate; create, invent, mint, originate; establish, father, institute, organize; concoct, contrive, cook (up), design, devise, imagine, think (up); conceive, envisage, picture, visualize; refashion, remake, remanufacture","it":["or"]}],"ph":["put together"],"near":["disassemble, dismantle, take apart; break up, dismember; abolish, annihilate, demolish, destroy, devastate, eradicate, exterminate, extinguish, flatten, pulverize, raze, ruin, shatter, smash, wreck; blow up, explode"]},{"sn":["2"],"mc":["to obtain (as a goal) through effort"],"vi":[{"_":"we finally it!","it":["made"]}],"syn":[{"_":"attain, bag, chalk up, clock (up) [], gain, hit, log, make, notch (up), rack up, ring up, score, win","it":["chiefly British"]}],"rel":["acquire, capture, carry, draw, garner, get, land, make, obtain, procure, realize, secure; amount (to), approach, equal, match, measure up (to), meet, rival, tie, touch; beat, excel, outdo, surpass, top"],"near":["fall short (of), miss; fail (at); lose"]},{"sn":["3"],"mc":["to be the cause of (a situation, action, or state of mind)"],"vi":[{"_":"the cats quite a disturbance when they knocked the Christmas tree over","it":["made"]}],"syn":["beget, breed, bring, bring about, bring on, catalyze, cause, create, do, draw on, effectuate, engender, generate, induce, invoke, make, occasion, produce, prompt, result (in), spawn, translate (into), work, yield"],"rel":["conduce (to), contribute (to); decide, determine; begin, establish, father, found, inaugurate, initiate, innovate, institute, introduce, launch, pioneer, set, set up, start; advance, cultivate, develop, encourage, forward, foster, further, nourish, nurture, promote; enact, render, turn out"],"near":[{"_":"impede, limit, restrict; clamp down (on), crack down (on), crush, dampen, put down, quash, quell, repress, smother, squash, squelch, stifle, subdue, suppress; arrest, check, control, curb, inhibit, rein (in), restrain, retard; can [], kill, snuff (out), still; abolish, demolish, destroy, extinguish, liquidate, quench","it":["slang"]}]},{"sn":["4"],"mc":["to carry through (as a process) to completion"],"vi":[{"_":"one person from each department will be asked to a short presentation at the meeting","it":["make"]}],"syn":[{"_":"accomplish, achieve, bring off, carry off, carry out, commit, compass, do, execute, follow through (with), fulfill ( fulfil), make, negotiate, perpetrate, prosecute, pull off, put through","it":["or"]}],"rel":[{"_":"bring about, effect, effectuate, implement; ace, nail; engage (in), practice ( practise); work (at); reduplicate, reenact, repeat; actualize, attain, realize; complete, end, finish, wind up","it":["also"]}],"near":["fail; skimp, slight, slur"]},{"sn":["5"],"mc":["to cause (a person) to give in to pressure"],"vi":[{"_":" him do all the work while everyone else just lounged around","it":["made"]}],"syn":["blackjack, coerce, compel, constrain, dragoon, drive, impel, impress, make, muscle, obligate, oblige, press, pressure, sandbag"],"rel":["browbeat, bulldoze, bully, cow, hector, intimidate; blackmail, high-pressure, menace, shame, terrorize, threaten; drag; badger, harass, hound"],"near":[{"_":"allow, let, permit; argue, convince, induce, move, persuade, prevail (on upon), satisfy, talk (into), win (over)","it":["or"]}]},{"sn":["6"],"mc":["to decide the size, amount, number, or distance of (something) without actual measurement"],"vi":[{"_":"I that to be about six feet long","it":["make"]}],"syn":[{"_":"calculate, call, conjecture, figure, gauge ( gage), guess, judge, make, place, put, reckon, suppose","it":["also"]}],"rel":["conclude, deduce, extrapolate, gather, infer, reason, understand"],"near":["calibrate, measure, scale; compute, work out"]},{"sn":["7"],"mc":["to form by putting together parts or materials"],"vi":[{"_":" a model airplane","it":["make"]}],"syn":["assemble, confect, construct, erect, fabricate, make, make up, piece, put up, raise, rear, set up"],"rel":[{"_":"carpenter, fashion, forge, frame, hammer, handcraft, manufacture, mold, produce, shape; prefabricate; begin, coin, create, generate, inaugurate, initiate, innovate, invent, originate; constitute, establish, father, found, institute, organize; conceive, concoct, contrive, cook (up), design, devise, imagine, think (up); reassemble, rebuild, reconstruct, redevelop, reedify [], retrofit; jerry-build, rig (up), throw up; combine, unite","it":["British"]}],"near":["demolish, destroy, devastate, flatten, level, pull down, pulverize, raze, ruin, ruinate, shatter, smash, wreck; blow up, explode; detach, disengage; disconnect, disjoin, disunite, divide, separate"],"ant":["demount, disassemble, dismantle, dismember, knock down, strike, take down, tear down"]},{"sn":["8"],"mc":["to give the impression of being"],"vi":[{"_":"the family merry despite their financial worries","it":["made"]}],"syn":["act, appear, come across (as), come off (as), feel, look, make, sound"],"rel":["dissemble, pretend; recall, resemble, suggest; hint, imply, insinuate"]},{"sn":["9"],"mc":["to go on a specified course or in a certain direction"],"vi":[{"_":"the baby straight for the toy lying on the rug","it":["made"]}],"syn":["bear, make"],"rel":["aim, bend, direct, point, turn; beeline, light out, put, put out, set off, set out, strike, take off; face, orient, steer; about-face, back, come about, come round, cut, incline, put about, reverse, swerve, tack, turn back, veer, wheel, yaw"]},{"sn":["10"],"mc":["to put into effect through legislative or authoritative action"],"vi":[{"_":"the legislature failed to any new laws last session","it":["make"]}],"syn":["constitute, lay down, legislate, make, ordain, pass"],"rel":["reenact, repass; bring about, effect; allow, authorize, permit, sanction; decree, dictate, proclaim; administer, execute; approve, confirm, ratify"],"near":["abolish, abrogate, annul, cancel, invalidate, kill, nullify; overturn, reverse, void"],"ant":["repeal, rescind, revoke"]},{"sn":["11"],"mc":["to receive as return for effort"],"vi":[{"_":"I considerably more money now than I did when I first started working here","it":["make"]}],"syn":["acquire, attain, bag, bring in, capture, carry, come by, draw, gain, garner, get, knock down, land, make, obtain, procure, pull down, realize, reap, secure, win"],"rel":["clear, gross, net; accomplish, achieve, notch (up), score; accumulate, amass, draw, rack up; catch, pick up; annex, occupy, take over; reacquire, reattain, recapture, regain, remake"],"near":["accord, give, grant, pay; give up, hand over, part (with), relinquish, surrender, yield"],"ant":["forfeit, lose"]},{"sn":["12"],"mc":["to have a clear idea of"],"vi":[{"_":"what do you of the latest information?","it":["make"]}],"syn":[{"_":"appreciate, apprehend, assimilate, behold, catch, catch on (to), cognize, compass, conceive, cotton (to on to), decipher, decode, dig, discern, get, grasp, grok, intuit, know, make, make out, perceive, recognize, register, savvy, see, seize, sense, tumble (to), twig, understand","it":["or"]}],"rel":["absorb, digest, take in; realize; fathom, penetrate, pierce"],"near":["misapprehend, misconceive, misconstrue, misinterpret, misperceive, misread, mistake, misunderstand"],"ant":["miss"]},{"ssl":["chiefly dialect"],"mc":["to position (something) so as to prevent passage through an opening"],"vi":[{"_":" the gate when ye leave","it":["make"]}],"syn":[{"_":"make [], shut, steek []","it":["chiefly dialect","chiefly Scottish"]}],"rel":["bar, batten (down), bolt, chain, fasten, latch, lock; plug, seal, stopper; secure; bang, clap, slam"],"near":["unbar, unbolt, unchain, unfasten, unlatch, unlock, unseal"],"ant":["open"]}]},{"$":{"id":"poke"},"term":[{"hw":["poke"]}],"fl":["verb"],"sens":[{"sn":["1"],"mc":["to extend outward beyond a usual point"],"vi":[{"_":"saw his head through the window","it":["poking"]}],"syn":[{"_":"bag, balloon, beetle, belly, billow, bunch, jut, overhang, poke, pooch [], pouch, pout, project, protrude, stand out, start, stick out, swell","it":["chiefly dialect"]}],"rel":["dome; blow up, inflate; dilate, distend, expand; mushroom, snowball; elongate, extend, lengthen, stretch"],"near":["compress, condense, constrict, contract, shrink"]},{"sn":["2"],"mc":["to interest oneself in what is not one\'s concern"],"vi":[{"_":"told him to stop into other people\'s business","it":["poking"]}],"syn":[{"_":"butt in, interlope, intermeddle, intrude, meddle, mess, muck (about around), nose, obtrude, poke, pry, snoop","it":["or"]}],"rel":["intercede, interpose, intervene; barge (in), chisel (in), encroach, infringe, invade, trespass; fiddle, fool, monkey, play, tamper"],"near":["avoid, eschew, shun; disregard, ignore, neglect, overlook"]},{"sn":["3"],"mc":["to move or act slowly"],"vi":[{"_":"just around all morning and didn\'t accomplish much","it":["poked"]}],"syn":[{"_":"crawl, creep, dally, dawdle, diddle, dillydally, drag, lag, linger, loiter, lollygag ( lallygag), mope, poke, shilly-shally, tarry","it":["also"]}],"rel":[{"_":"fiddle (around), fool around, mess around, monkey (around), play, potter (around), putter (around), trifle; hang (around out), idle, loaf, loll, lounge; amble, ease, inch, lumber, plod, saunter, shuffle, stagger, stroll; decelerate, slow (down up); filibuster, procrastinate, stall, temporize","it":["or","or"]}],"near":["bowl, breeze, dart, hump, hurtle, hustle, scramble, stampede; gallop, jog, run, sprint, trot; accelerate, quicken, speed (up); catch up, fast-forward, outpace, outrun, outstrip, overtake"],"ant":[{"_":"barrel, bolt, career, course, dash, fly, hasten, hotfoot (it), hurry, race, rip, rocket, run, rush, scoot, scud, scurry, speed, tear, whirl, whisk, whiz ( whizz), zip","it":["or"]}]},{"sn":["4"],"mc":["to move slowly"],"vi":[{"_":"they were just along home","it":["poking"]}],"syn":["creak (along), creep, drag, inch, limp, nose, ooze, plod, poke, slouch, snail"],"rel":["lumber, shamble, shuffle, tramp, trudge"],"near":["float, glide, sail; hurry, tear"],"ant":[{"_":"fly, race, speed, whiz ( whizz), zip","it":["or"]}]}]}]}}
