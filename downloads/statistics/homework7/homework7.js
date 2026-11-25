/*
 * Homework #7 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Data and computations: the SMS Spam Collection (5,574 SMS) and four columns plus the source bytes of NSL-KDD (KDDTest+), the four kinds of convergence
 * with their counterexamples, exact Kolmogorov distances, Berry-Esseen, Slutsky, the delta method, Glivenko-Cantelli and the MLE, sqrt(n) and alarms in bursts,
 * heavy tails, conditional probability, Bayes on alarms, a Bayesian network, Wald's sequential test, Beta posteriors on a grid, coverage of intervals,
 * naive Bayes filters, Bernstein-von Mises, birthday collisions, xoshiro128** and SplitMix64, charts with labels and toggling legends,
 * and command line (node homework7.js [options]).
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-7
 */

var Homework7 = (function () {
'use strict';

var smsspam$ = (function () {
'use strict';

// src/pages/statistics/hw7/smsspam.js
// La SMS Spam Collection v.1 (Almeida, Gomez Hidalgo e Yamakami, 2011):
// 5.574 SMS in inglese, 747 di spam e 4.827 legittimi, nell'ordine del file
// originale (SMSSpamCollection, SHA-256
// 7d039a24a6083ed9ef0f806ebad56bbb976e3aeb8de05669173bfdc4996c239d). Ogni
// messaggio e' una stringa: la prima lettera e' l'etichetta (s = spam,
// h = legittimo), il resto e' il testo.
//
// Le uniche modifiche al testo, in 42 messaggi: i trattini lunghi (i due
// caratteri Unicode e lo 0x96 di Windows-1252) sono diventati "-", e le
// virgolette rimaste come caratteri di controllo di Windows-1252 (da 0x91 a
// 0x94) sono tornate le virgolette che erano. Le entita' HTML del file
// (&lt; &gt; &amp;) restano come sono: il programma le decodifica quando
// mostra un messaggio, e il filtro non le conta come parole.
//
// Licenza: Creative Commons Attribution 4.0 International (UCI Machine
// Learning Repository, https://doi.org/10.24432/C5CC84). Il readme degli
// autori chiede di citare il loro articolo e la pagina della raccolta: la
// citazione e' in SOURCE, e la pagina e il programma la mostrano. La pagina
// della raccolta (dt.fee.unicamp.br) non e' piu' online: si cita il suo
// indirizzo e si collega la copia dell'Internet Archive del 10/08/2022.

/** Where the messages come from, as the page and the program cite them. */
const SOURCE = Object.freeze({
  dataset: 'SMS Spam Collection v.1 (UCI Machine Learning Repository)',
  url: 'https://archive.ics.uci.edu/dataset/228/sms+spam+collection',
  doi: 'https://doi.org/10.24432/C5CC84',
  page: 'http://www.dt.fee.unicamp.br/~tiago/smsspamcollection/',
  // the page above is no longer online: its copy in the Internet Archive, of 10 August 2022
  archive: 'https://web.archive.org/web/20220810124955/https://www.dt.fee.unicamp.br/~tiago/smsspamcollection/',
  paper: 'T. A. Almeida, J. M. Gómez Hidalgo, A. Yamakami, "Contributions to the Study of SMS Spam Filtering: New Collection and Results", Proceedings of the 11th ACM Symposium on Document Engineering (DocEng 2011), pp. 259-262',
  paperUrl: 'https://doi.org/10.1145/2034691.2034742',
  license: 'CC BY 4.0',
  file: 'SMSSpamCollection',
  sha256: '7d039a24a6083ed9ef0f806ebad56bbb976e3aeb8de05669173bfdc4996c239d',
  messages: 5574,
  changed: 42,
});

/** The messages in the order of the file: 's' (spam) or 'h' (legitimate), then the text. */
const MESSAGES = Object.freeze([
  "hGo until jurong point, crazy.. Available only in bugis n great world la e buffet... Cine there got amore wat...",
  "hOk lar... Joking wif u oni...",
  "sFree entry in 2 a wkly comp to win FA Cup final tkts 21st May 2005. Text FA to 87121 to receive entry question(std txt rate)T&C's apply 08452810075over18's",
  "hU dun say so early hor... U c already then say...",
  "hNah I don't think he goes to usf, he lives around here though",
  "sFreeMsg Hey there darling it's been 3 week's now and no word back! I'd like some fun you up for it still? Tb ok! XxX std chgs to send, £1.50 to rcv",
  "hEven my brother is not like to speak with me. They treat me like aids patent.",
  "hAs per your request 'Melle Melle (Oru Minnaminunginte Nurungu Vettam)' has been set as your callertune for all Callers. Press *9 to copy your friends Callertune",
  "sWINNER!! As a valued network customer you have been selected to receivea £900 prize reward! To claim call 09061701461. Claim code KL341. Valid 12 hours only.",
  "sHad your mobile 11 months or more? U R entitled to Update to the latest colour mobiles with camera for Free! Call The Mobile Update Co FREE on 08002986030",
  "hI'm gonna be home soon and i don't want to talk about this stuff anymore tonight, k? I've cried enough today.",
  "sSIX chances to win CASH! From 100 to 20,000 pounds txt> CSH11 and send to 87575. Cost 150p/day, 6days, 16+ TsandCs apply Reply HL 4 info",
  "sURGENT! You have won a 1 week FREE membership in our £100,000 Prize Jackpot! Txt the word: CLAIM to No: 81010 T&C www.dbuk.net LCCLTD POBOX 4403LDNW1A7RW18",
  "hI've been searching for the right words to thank you for this breather. I promise i wont take your help for granted and will fulfil my promise. You have been wonderful and a blessing at all times.",
  "hI HAVE A DATE ON SUNDAY WITH WILL!!",
  "sXXXMobileMovieClub: To use your credit, click the WAP link in the next txt message or click here>> http://wap. xxxmobilemovieclub.com?n=QJKGIGHJJGCBL",
  "hOh k...i'm watching here:)",
  "hEh u remember how 2 spell his name... Yes i did. He v naughty make until i v wet.",
  "hFine if that’s the way u feel. That’s the way its gota b",
  "sEngland v Macedonia - dont miss the goals/team news. Txt ur national team to 87077 eg ENGLAND to 87077 Try:WALES, SCOTLAND 4txt/ú1.20 POBOXox36504W45WQ 16+",
  "hIs that seriously how you spell his name?",
  "hI‘m going to try for 2 months ha ha only joking",
  "hSo ü pay first lar... Then when is da stock comin...",
  "hAft i finish my lunch then i go str down lor. Ard 3 smth lor. U finish ur lunch already?",
  "hFfffffffff. Alright no way I can meet up with you sooner?",
  "hJust forced myself to eat a slice. I'm really not hungry tho. This sucks. Mark is getting worried. He knows I'm sick when I turn down pizza. Lol",
  "hLol your always so convincing.",
  "hDid you catch the bus ? Are you frying an egg ? Did you make a tea? Are you eating your mom's left over dinner ? Do you feel my Love ?",
  "hI'm back &amp; we're packing the car now, I'll let you know if there's room",
  "hAhhh. Work. I vaguely remember that! What does it feel like? Lol",
  "hWait that's still not all that clear, were you not sure about me being sarcastic or that that's why x doesn't want to live with us",
  "hYeah he got in at 2 and was v apologetic. n had fallen out and she was actin like spoilt child and he got caught up in that. Till 2! But we won't go there! Not doing too badly cheers. You? ",
  "hK tell me anything about you.",
  "hFor fear of fainting with the of all that housework you just did? Quick have a cuppa",
  "sThanks for your subscription to Ringtone UK your mobile will be charged £5/month Please confirm by replying YES or NO. If you reply NO you will not be charged",
  "hYup... Ok i go home look at the timings then i msg ü again... Xuhui going to learn on 2nd may too but her lesson is at 8am",
  "hOops, I'll let you know when my roommate's done",
  "hI see the letter B on my car",
  "hAnything lor... U decide...",
  "hHello! How's you and how did saturday go? I was just texting to see if you'd decided to do anything tomo. Not that i'm trying to invite myself or anything!",
  "hPls go ahead with watts. I just wanted to be sure. Do have a great weekend. Abiola",
  "hDid I forget to tell you ? I want you , I need you, I crave you ... But most of all ... I love you my sweet Arabian steed ... Mmmmmm ... Yummy",
  "s07732584351 - Rodger Burns - MSG = We tried to call you re your reply to our sms for a free nokia mobile + free camcorder. Please call now 08000930705 for delivery tomorrow",
  "hWHO ARE YOU SEEING?",
  "hGreat! I hope you like your man well endowed. I am  &lt;#&gt;  inches...",
  "hNo calls..messages..missed calls",
  "hDidn't you get hep b immunisation in nigeria.",
  "hFair enough, anything going on?",
  "hYeah hopefully, if tyler can't do it I could maybe ask around a bit",
  "hU don't know how stubborn I am. I didn't even want to go to the hospital. I kept telling Mark I'm not a weak sucker. Hospitals are for weak suckers.",
  "hWhat you thinked about me. First time you saw me in class.",
  "hA gram usually runs like  &lt;#&gt; , a half eighth is smarter though and gets you almost a whole second gram for  &lt;#&gt;",
  "hK fyi x has a ride early tomorrow morning but he's crashing at our place tonight",
  "hWow. I never realized that you were so embarassed by your accomodations. I thought you liked it, since i was doing the best i could and you always seemed so happy about \"the cave\". I'm sorry I didn't and don't have more to give. I'm sorry i offered. I'm sorry your room was so embarassing.",
  "sSMS. ac Sptv: The New Jersey Devils and the Detroit Red Wings play Ice Hockey. Correct or Incorrect? End? Reply END SPTV",
  "hDo you know what Mallika Sherawat did yesterday? Find out now @  &lt;URL&gt;",
  "sCongrats! 1 year special cinema pass for 2 is yours. call 09061209465 now! C Suprman V, Matrix3, StarWars3, etc all 4 FREE! bx420-ip4-5we. 150pm. Dont miss out! ",
  "hSorry, I'll call later in meeting.",
  "hTell where you reached",
  "hYes..gauti and sehwag out of odi series.",
  "hYour gonna have to pick up a $1 burger for yourself on your way home. I can't even move. Pain is killing me.",
  "hHa ha ha good joke. Girls are situation seekers.",
  "hIts a part of checking IQ",
  "hSorry my roommates took forever, it ok if I come by now?",
  "hOk lar i double check wif da hair dresser already he said wun cut v short. He said will cut until i look nice.",
  "sAs a valued customer, I am pleased to advise you that following recent review of your Mob No. you are awarded with a £1500 Bonus Prize, call 09066364589",
  "hToday is \"song dedicated day..\" Which song will u dedicate for me? Send this to all ur valuable frnds but first rply me...",
  "sUrgent UR awarded a complimentary trip to EuroDisinc Trav, Aco&Entry41 Or £1000. To claim txt DIS to 87121 18+6*£1.50(moreFrmMob. ShrAcomOrSglSuplt)10, LS1 3AJ",
  "sDid you hear about the new \"Divorce Barbie\"? It comes with all of Ken's stuff!",
  "hI plane to give on this month end.",
  "hWah lucky man... Then can save money... Hee...",
  "hFinished class where are you.",
  "hHI BABE IM AT HOME NOW WANNA DO SOMETHING? XX",
  "hK..k:)where are you?how did you performed?",
  "hU can call me now...",
  "hI am waiting machan. Call me once you free.",
  "hThats cool. i am a gentleman and will treat you with dignity and respect.",
  "hI like you peoples very much:) but am very shy pa.",
  "hDoes not operate after  &lt;#&gt;  or what",
  "hIts not the same here. Still looking for a job. How much do Ta's earn there.",
  "hSorry, I'll call later",
  "hK. Did you call me just now ah? ",
  "hOk i am on the way to home hi hi",
  "hYou will be in the place of that man",
  "hYup next stop.",
  "hI call you later, don't have network. If urgnt, sms me.",
  "hFor real when u getting on yo? I only need 2 more tickets and one more jacket and I'm done. I already used all my multis.",
  "hYes I started to send requests to make it but pain came back so I'm back in bed. Double coins at the factory too. I gotta cash in all my nitros.",
  "hI'm really not up to it still tonight babe",
  "hEla kano.,il download, come wen ur free..",
  "hYeah do! Don‘t stand to close tho- you‘ll catch something!",
  "hSorry to be a pain. Is it ok if we meet another night? I spent late afternoon in casualty and that means i haven't done any of y stuff42moro and that includes all my time sheets and that. Sorry. ",
  "hSmile in Pleasure Smile in Pain Smile when trouble pours like Rain Smile when sum1 Hurts U Smile becoz SOMEONE still Loves to see u Smiling!!",
  "sPlease call our customer service representative on 0800 169 6031 between 10am-9pm as you have WON a guaranteed £1000 cash or £5000 prize!",
  "hHavent planning to buy later. I check already lido only got 530 show in e afternoon. U finish work already?",
  "sYour free ringtone is waiting to be collected. Simply text the password \"MIX\" to 85069 to verify. Get Usher and Britney. FML, PO Box 5249, MK17 92H. 450Ppw 16",
  "hWatching telugu movie..wat abt u?",
  "hi see. When we finish we have loads of loans to pay",
  "hHi. Wk been ok - on hols now! Yes on for a bit of a run. Forgot that i have hairdressers appointment at four so need to get home n shower beforehand. Does that cause prob for u?\"",
  "hI see a cup of coffee animation",
  "hPlease don't text me anymore. I have nothing else to say.",
  "hOkay name ur price as long as its legal! Wen can I pick them up? Y u ave x ams xx",
  "hI'm still looking for a car to buy. And have not gone 4the driving test yet.",
  "hAs per your request 'Melle Melle (Oru Minnaminunginte Nurungu Vettam)' has been set as your callertune for all Callers. Press *9 to copy your friends Callertune",
  "hwow. You're right! I didn't mean to do that. I guess once i gave up on boston men and changed my search location to nyc, something changed. Cuz on my signin page it still says boston.",
  "hUmma my life and vava umma love you lot dear",
  "hThanks a lot for your wishes on my birthday. Thanks you for making my birthday truly memorable.",
  "hAight, I'll hit you up when I get some cash",
  "hHow would my ip address test that considering my computer isn't a minecraft server",
  "hI know! Grumpy old people. My mom was like you better not be lying. Then again I am always the one to play jokes...",
  "hDont worry. I guess he's busy.",
  "hWhat is the plural of the noun research?",
  "hGoing for dinner.msg you after.",
  "hI'm ok wif it cos i like 2 try new things. But i scared u dun like mah. Cos u said not too loud.",
  "sGENT! We are trying to contact you. Last weekends draw shows that you won a £1000 prize GUARANTEED. Call 09064012160. Claim Code K52. Valid 12hrs only. 150ppm",
  "hWa, ur openin sentence very formal... Anyway, i'm fine too, juz tt i'm eatin too much n puttin on weight...Haha... So anythin special happened?",
  "hAs I entered my cabin my PA said, '' Happy B'day Boss !!''. I felt special. She askd me 4 lunch. After lunch she invited me to her apartment. We went there.",
  "sYou are a winner U have been specially selected 2 receive £1000 or a 4* holiday (flights inc) speak to a live operator 2 claim 0871277810910p/min (18+) ",
  "hGoodo! Yes we must speak friday - egg-potato ratio for tortilla needed! ",
  "hHmm...my uncle just informed me that he's paying the school directly. So pls buy food.",
  "sPRIVATE! Your 2004 Account Statement for 07742676969 shows 786 unredeemed Bonus Points. To claim call 08719180248 Identifier Code: 45239 Expires",
  "sURGENT! Your Mobile No. was awarded £2000 Bonus Caller Prize on 5/9/03 This is our final try to contact U! Call from Landline 09064019788 BOX42WR29C, 150PPM",
  "hhere is my new address -apples&pairs&all that malarky",
  "sTodays Voda numbers ending 7548 are selected to receive a $350 award. If you have a match please call 08712300220 quoting claim code 4041 standard rates app",
  "hI am going to sao mu today. Will be done only at 12 ",
  "hÜ predict wat time ü'll finish buying?",
  "hGood stuff, will do.",
  "hJust so that you know,yetunde hasn't sent money yet. I just sent her a text not to bother sending. So its over, you dont have to involve yourself in anything. I shouldn't have imposed anything on you in the first place so for that, i apologise.",
  "hAre you there in room.",
  "hHEY GIRL. HOW R U? HOPE U R WELL ME AN DEL R BAK! AGAIN LONG TIME NO C! GIVE ME A CALL SUM TIME FROM LUCYxx",
  "hK..k:)how much does it cost?",
  "hI'm home.",
  "hDear, will call Tmorrow.pls accomodate.",
  "hFirst answer my question.",
  "sSunshine Quiz Wkly Q! Win a top Sony DVD player if u know which country the Algarve is in? Txt ansr to 82277. £1.50 SP:Tyrone",
  "sWant 2 get laid tonight? Want real Dogging locations sent direct 2 ur mob? Join the UK's largest Dogging Network bt Txting GRAVEL to 69888! Nt. ec2a. 31p.msg@150p",
  "hI only haf msn. It's yijue@hotmail.com",
  "hHe is there. You call and meet him",
  "hNo no. I will check all rooms befor activities",
  "sYou'll not rcv any more msgs from the chat svc. For FREE Hardcore services text GO to: 69988 If u get nothing u must Age Verify with yr network & try again",
  "hGot c... I lazy to type... I forgot ü in lect... I saw a pouch but like not v nice...",
  "hK, text me when you're on the way",
  "hSir, Waiting for your mail.",
  "hA swt thought: \"Nver get tired of doing little things 4 lovable persons..\" Coz..somtimes those little things occupy d biggest part in their Hearts.. Gud ni8",
  "hI know you are. Can you pls open the back?",
  "hYes see ya not on the dot",
  "hWhats the staff name who is taking class for us?",
  "sFreeMsg Why haven't you replied to my text? I'm Randy, sexy, female and live local. Luv to hear from u. Netcollex Ltd 08700621170150p per msg reply Stop to end",
  "hUmmma.will call after check in.our life will begin from qatar so pls pray very hard.",
  "hK..i deleted my contact that why?",
  "hSindu got job in birla soft ..",
  "hThe wine is flowing and i'm i have nevering..",
  "hYup i thk cine is better cos no need 2 go down 2 plaza mah.",
  "hOk... Ur typical reply...",
  "hAs per your request 'Melle Melle (Oru Minnaminunginte Nurungu Vettam)' has been set as your callertune for all Callers. Press *9 to copy your friends Callertune",
  "hYou are everywhere dirt, on the floor, the windows, even on my shirt. And sometimes when i open my mouth, you are all that comes flowing out. I dream of my world without you, then half my chores are out too. A time of joy for me, lots of tv shows i.ll see. But i guess like all things you just must exist, like rain, hail and mist, and when my time here is done, you and i become one.",
  "hAaooooright are you at work?",
  "hI'm leaving my house now...",
  "hHello, my love. What are you doing? Did you get to that interview today? Are you you happy? Are you being a good boy? Do you think of me?Are you missing me ?",
  "sCustomer service annoncement. You have a New Years delivery waiting for you. Please call 07046744435 now to arrange delivery",
  "sYou are a winner U have been specially selected 2 receive £1000 cash or a 4* holiday (flights inc) speak to a live operator 2 claim 0871277810810",
  "hKeep yourself safe for me because I need you and I miss you already and I envy everyone that see's you in real life",
  "hNew car and house for my parents.:)i have only new job in hand:)",
  "hI'm so in love with you. I'm excited each day i spend with you. You make me so happy.",
  "s-PLS STOP bootydelious (32/F) is inviting you to be her friend. Reply YES-434 or NO-434 See her: www.SMS.ac/u/bootydelious STOP? Send STOP FRND to 62468",
  "sBangBabes Ur order is on the way. U SHOULD receive a Service Msg 2 download UR content. If U do not, GoTo wap. bangb. tv on UR mobile internet/service menu",
  "hI place all ur points on e cultures module already.",
  "sURGENT! We are trying to contact you. Last weekends draw shows that you have won a £900 prize GUARANTEED. Call 09061701939. Claim code S89. Valid 12hrs only",
  "hHi frnd, which is best way to avoid missunderstding wit our beloved one's?",
  "hGreat escape. I fancy the bridge but needs her lager. See you tomo ",
  "hYes :)it completely in out of form:)clark also utter waste.",
  "hSir, I need AXIS BANK account no and bank address.",
  "hHmmm.. Thk sure got time to hop ard... Ya, can go 4 free abt... Muz call u to discuss liao... ",
  "hWhat time you coming down later? ",
  "hBloody hell, cant believe you forgot my surname Mr . Ill give u a clue, its spanish and begins with m... ",
  "hWell, i'm gonna finish my bath now. Have a good...fine night.",
  "hLet me know when you've got the money so carlos can make the call",
  "hU still going to the mall?",
  "hTurns out my friends are staying for the whole show and won't be back til ~ &lt;#&gt; , so feel free to go ahead and smoke that $ &lt;#&gt;  worth",
  "hText her. If she doesnt reply let me know so i can have her log in",
  "hHi! You just spoke to MANEESHA V. We'd like to know if you were satisfied with the experience. Reply Toll Free with Yes or No.",
  "hYou lifted my hopes with the offer of money. I am in need. Especially when the end of the month approaches and it hurts my studying. Anyways have a gr8 weekend",
  "hLol no. U can trust me.",
  "hok. I am a gentleman and will treat you with dignity and respect.",
  "hHe will, you guys close?",
  "hGoing on nothing great.bye",
  "hHello handsome ! Are you finding that job ? Not being lazy ? Working towards getting back that net for mummy ? Where's my boytoy now ? Does he miss me ?",
  "hHaha awesome, be there in a minute",
  "sPlease call our customer service representative on FREEPHONE 0808 145 4742 between 9am-11pm as you have WON a guaranteed £1000 cash or £5000 prize!",
  "hHave you got Xmas radio times. If not i will get it now",
  "hI jus reached home. I go bathe first. But my sis using net tell u when she finishes k...",
  "sAre you unique enough? Find out from 30th August. www.areyouunique.co.uk",
  "hI'm sorry. I've joined the league of people that dont keep in touch. You mean a great deal to me. You have been a friend at all times even at great personal cost. Do have a great week.|",
  "hHi :)finally i completed the course:)",
  "hIt will stop on itself. I however suggest she stays with someone that will be able to give ors for every stool.",
  "hHow are you doing? Hope you've settled in for the new school year. Just wishin you a gr8 day",
  "hGud mrng dear hav a nice day",
  "hDid u got that persons story",
  "his your hamster dead? Hey so tmr i meet you at 1pm orchard mrt? ",
  "hHi its Kate how is your evening? I hope i can see you tomorrow for a bit but i have to bloody babyjontet! Txt back if u can. :) xxx",
  "hFound it, ENC  &lt;#&gt; , where you at?",
  "hI sent you  &lt;#&gt;  bucks",
  "hHello darlin ive finished college now so txt me when u finish if u can love Kate xxx",
  "hYour account has been refilled successfully by INR  &lt;DECIMAL&gt; . Your KeralaCircle prepaid account balance is Rs  &lt;DECIMAL&gt; . Your Transaction ID is KR &lt;#&gt; .",
  "hGoodmorning sleeping ga.",
  "hU call me alter at 11 ok.",
  "hÜ say until like dat i dun buy ericsson oso cannot oredi lar...",
  "hAs I entered my cabin my PA said, '' Happy B'day Boss !!''. I felt special. She askd me 4 lunch. After lunch she invited me to her apartment. We went there.",
  "hAight yo, dats straight dogg",
  "hYou please give us connection today itself before  &lt;DECIMAL&gt;  or refund the bill",
  "hBoth :) i shoot big loads so get ready!",
  "hWhat's up bruv, hope you had a great break. Do have a rewarding semester.",
  "hHome so we can always chat",
  "hK:)k:)good:)study well.",
  "hYup... How ü noe leh...",
  "hSounds great! Are you home now?",
  "hFinally the match heading towards draw as your prediction.",
  "hTired. I haven't slept well the past few nights.",
  "hEasy ah?sen got selected means its good..",
  "hI have to take exam with march 3",
  "hYeah you should. I think you can use your gt atm now to register. Not sure but if there's anyway i can help let me know. But when you do be sure you are ready.",
  "hOk no prob. Take ur time.",
  "hThere is os called ubandu which will run without installing in hard disk...you can use that os to copy the important files in system and give it to repair shop..",
  "hSorry, I'll call later",
  "hU say leh... Of course nothing happen lar. Not say v romantic jus a bit only lor. I thk e nite scenery not so nice leh.",
  "s500 New Mobiles from 2004, MUST GO! Txt: NOKIA to No: 89545 & collect yours today!From ONLY £1 www.4-tc.biz 2optout 087187262701.50gbp/mtmsg18",
  "hWould really appreciate if you call me. Just need someone to talk to.",
  "sWill u meet ur dream partner soon? Is ur career off 2 a flyng start? 2 find out free, txt HORO followed by ur star sign, e. g. HORO ARIES",
  "hHey company elama po mudyadhu.",
  "hLife is more strict than teacher... Bcoz Teacher teaches lesson &amp; then conducts exam, But Life first conducts Exam &amp; then teaches Lessons. Happy morning. . .",
  "hDear good morning now only i am up",
  "hGet down in gandhipuram and walk to cross cut road. Right side &lt;#&gt; street road and turn at first right.",
  "hDear we are going to our rubber place",
  "hSorry battery died, yeah I'm here",
  "hYes:)here tv is always available in work place..",
  "sText & meet someone sexy today. U can find a date or even flirt its up to U. Join 4 just 10p. REPLY with NAME & AGE eg Sam 25. 18 -msg recd@thirtyeight pence",
  "hI have printed it oh. So  &lt;#&gt;  come upstairs",
  "hOr ill be a little closer like at the bus stop on the same street",
  "hWhere are you?when wil you reach here?",
  "hNew Theory: Argument wins d SITUATION, but loses the PERSON. So dont argue with ur friends just.. . . . kick them &amp; say, I'm always correct.!",
  "sU 447801259231 have a secret admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09058094597",
  "hTomarrow final hearing on my laptop case so i cant.",
  "hPLEASSSSSSSEEEEEE TEL ME V AVENT DONE SPORTSx",
  "hOkay. No no, just shining on. That was meant to be signing, but that sounds better.",
  "hAlthough i told u dat i'm into baig face watches now but i really like e watch u gave cos it's fr u. Thanx 4 everything dat u've done today, i'm touched...",
  "hU don't remember that old commercial?",
  "hToo late. I said i have the website. I didn't i have or dont have the slippers",
  "hI asked you to call him now ok",
  "hKallis wont bat in 2nd innings.",
  "hIt didnt work again oh. Ok goodnight then. I.ll fix and have it ready by the time you wake up. You are very dearly missed have a good night sleep.",
  "sCongratulations ur awarded 500 of CD vouchers or 125gift guaranteed & Free entry 2 100 wkly draw txt MUSIC to 87066 TnCs www.Ldew.com1win150ppmx3age16",
  "hRanjith cal drpd Deeraj and deepak 5min hold",
  "hWen ur lovable bcums angry wid u, dnt take it seriously.. Coz being angry is d most childish n true way of showing deep affection, care n luv!.. kettoda manda... Have nice day da.",
  "hWhat you doing?how are you?",
  "hUps which is 3days also, and the shipping company that takes 2wks. The other way is usps which takes a week but when it gets to lag you may have to bribe nipost to get your stuff.",
  "hI'm back, lemme know when you're ready",
  "hDon't necessarily expect it to be done before you get back though because I'm just now headin out",
  "hMmm so yummy babe ... Nice jolt to the suzy",
  "hWhere are you lover ? I need you ...",
  "sWe tried to contact you re your reply to our offer of a Video Handset? 750 anytime networks mins? UNLIMITED TEXT? Camcorder? Reply or call 08000930705 NOW",
  "hI‘m parked next to a MINI!!!! When are you coming in today do you think?",
  "hYup",
  "hAnyway i'm going shopping on my own now. Cos my sis not done yet. Dun disturb u liao.",
  "hMY NO. IN LUTON 0125698789 RING ME IF UR AROUND! H*",
  "sHey I am really horny want to chat or see me naked text hot to 69698 text charged at 150pm to unsubscribe text stop 69698",
  "hWhy you Dint come with us.",
  "hSame. Wana plan a trip sometme then",
  "hNot sure yet, still trying to get a hold of him",
  "sUr ringtone service has changed! 25 Free credits! Go to club4mobiles.com to choose content now! Stop? txt CLUB STOP to 87070. 150p/wk Club4 PO Box1146 MK45 2WT",
  "hThe evo. I just had to download flash. Jealous?",
  "sRingtone Club: Get the UK singles chart on your mobile each week and choose any top quality ringtone! This message is free of charge.",
  "hCome to mu, we're sorting out our narcotics situation",
  "hNight has ended for another day, morning has come in a special way. May you smile like the sunny rays and leaves your worries at the blue blue bay.",
  "sHMV BONUS SPECIAL 500 pounds of genuine HMV vouchers to be won. Just answer 4 easy questions. Play Now! Send HMV to 86688 More info:www.100percent-real.com",
  "hUsf I guess, might as well take 1 car",
  "hNo objection. My bf not coming.",
  "hThanx...",
  "hTell rob to mack his gf in the theater",
  "hAwesome, I'll see you in a bit",
  "hJust sent it. So what type of food do you like?",
  "hAll done? All handed in? Celebrations in full swing yet?",
  "hYou got called a tool?",
  "h\"Wen u miss someone, the person is definitely special for u..... But if the person is so special, why to miss them, just Keep-in-touch\" gdeve..",
  "hOk. I asked for money how far",
  "hOkie...",
  "hYeah I think my usual guy's still passed out from last night, if you get ahold of anybody let me know and I'll throw down",
  "hK, I might come by tonight then if my class lets out early",
  "hOk..",
  "hhi baby im cruisin with my girl friend what r u up 2? give me a call in and hour at home if thats alright or fone me on this fone now love jenny xxx",
  "hMy life Means a lot to me, Not because I love my life, But because I love the people in my life, The world calls them friends, I call them my World:-).. Ge:-)..",
  "hDear,shall mail tonite.busy in the street,shall update you tonite.things are looking ok.varunnathu edukkukayee raksha ollu.but a good one in real sense.",
  "hHey you told your name to gautham ah?",
  "hHaf u found him? I feel so stupid da v cam was working.",
  "hOops. 4 got that bit.",
  "hAre you this much buzy",
  "hI accidentally deleted the message. Resend please.",
  "sT-Mobile customer you may now claim your FREE CAMERA PHONE upgrade & a pay & go sim card for your loyalty. Call on 0845 021 3680.Offer ends 28thFeb.T&C's apply",
  "hUnless it's a situation where YOU GO GURL would be more appropriate",
  "hHurt me... Tease me... Make me cry... But in the end of my life when i die plz keep one rose on my grave and say STUPID I MISS U.. HAVE A NICE DAY BSLVYL",
  "hI cant pick the phone right now. Pls send a message",
  "hNeed a coffee run tomo?Can't believe it's that time of week already",
  "hAwesome, I remember the last time we got somebody high for the first time with diesel :V",
  "hShit that is really shocking and scary, cant imagine for a second. Def up for night out. Do u think there is somewhere i could crash for night, save on taxi?",
  "hOh and by the way you do have more food in your fridge! Want to go out for a meal tonight? ",
  "hHe is a womdarfull actor",
  "sSMS. ac Blind Date 4U!: Rodds1 is 21/m from Aberdeen, United Kingdom. Check Him out http://img. sms. ac/W/icmb3cktz8r7!-4 no Blind Dates send HIDE",
  "hYup... From what i remb... I think should be can book... ",
  "hJos ask if u wana meet up?",
  "hLol yes. Our friendship is hanging on a thread cause u won't buy stuff.",
  "sTheMob> Check out our newest selection of content, Games, Tones, Gossip, babes and sport, Keep your mobile fit and funky text WAP to 82468",
  "hWhere are the garage keys? They aren't on the bookshelf",
  "hToday is ACCEPT DAY..U Accept me as? Brother Sister Lover Dear1 Best1 Clos1 Lvblefrnd Jstfrnd Cutefrnd Lifpartnr Belovd Swtheart Bstfrnd No rply means enemy",
  "sThink ur smart ? Win £200 this week in our weekly quiz, text PLAY to 85222 now!T&Cs WinnersClub PO BOX 84, M26 3UZ. 16+. GBP1.50/week",
  "hHe says he'll give me a call when his friend's got the money but that he's definitely buying before the end of the week",
  "hHi the way I was with u 2day, is the normal way&this is the real me. UR unique&I hope I know u 4 the rest of mylife. Hope u find wot was lost.",
  "hYou made my day. Do have a great day too.",
  "hK.k:)advance happy pongal.",
  "hHmmm... Guess we can go 4 kb n power yoga... Haha, dunno we can tahan power yoga anot... Thk got lo oso, forgot liao...",
  "hNot really dude, have no friends i'm afraid :(",
  "sDecember only! Had your mobile 11mths+? You are entitled to update to the latest colour camera mobile for Free! Call The Mobile Update Co FREE on 08002986906",
  "hCoffee cake, i guess...",
  "hMerry Christmas to you too babe, i love ya *kisses*",
  "hHey... Why dont we just go watch x men and have lunch... Haha ",
  "hcud u tell ppl im gona b a bit l8 cos 2 buses hav gon past cos they were full & im still waitin 4 1. Pete x",
  "hThat would be great. We'll be at the Guild. Could meet on Bristol road or somewhere - will get in touch over weekend. Our plans take flight! Have a good week",
  "hNo problem. How are you doing?",
  "hNo calls..messages..missed calls",
  "hHi da:)how is the todays class?",
  "hI'd say that's a good sign but, well, you know my track record at reading women",
  "hCool, text me when you're parked",
  "hI'm reading the text i just sent you. Its meant to be a joke. So read it in that light",
  "hK.k:)apo k.good movie.",
  "hMaybe i could get book out tomo then return it immediately ..? Or something.",
  "sCall Germany for only 1 pence per minute! Call from a fixed line via access number 0844 861 85 85. No prepayment. Direct access!",
  "hAny chance you might have had with me evaporated as soon as you violated my privacy by stealing my phone number from your employer's paperwork. Not cool at all. Please do not contact me again or I will report you to your supervisor.",
  "sValentines Day Special! Win over £1000 in our quiz and take your partner on the trip of a lifetime! Send GO to 83600 now. 150p/msg rcvd. CustCare:08718720201.",
  "hTa-Daaaaa! I am home babe, are you still up ?",
  "hCool. So how come you havent been wined and dined before?",
  "hJust sleeping..and surfing",
  "hSorry, I'll call later",
  "hU calling me right? Call my hand phone...",
  "hOk that's great thanx a lot.",
  "hI take it the post has come then! You must have 1000s of texts now! Happy reading. My one from wiv hello caroline at the end is my favourite. Bless him",
  "hWhere u been hiding stranger?",
  "hAm not interested to do like that.",
  "hMy sister cleared two round in birla soft yesterday.",
  "hGudnite....tc...practice going on",
  "hDis is yijue. I jus saw ur mail. In case huiming havent sent u my num. Dis is my num.",
  "hOne small prestige problem now.",
  "sFancy a shag? I do.Interested? sextextuk.com txt XXUK SUZY to 69876. Txts cost 1.50 per msg. TnCs on website. X",
  "hJust checking in on you. Really do miss seeing Jeremiah. Do have a great month",
  "hNah can't help you there, I've never had an iphone",
  "hIf you're not in my car in an hour and a half I'm going apeshit",
  "hTODAY is Sorry day.! If ever i was angry with you, if ever i misbehaved or hurt you? plz plz JUST SLAP URSELF Bcoz, Its ur fault, I'm basically GOOD",
  "hYo you guys ever figure out how much we need for alcohol? Jay and I are trying to figure out how much we can safely spend on weed",
  "h&lt;#&gt; ISH MINUTES WAS 5 MINUTES AGO. WTF.",
  "hThank You for calling.Forgot to say Happy Onam to you Sirji.I am fine here and remembered you when i met an insurance person.Meet You in Qatar Insha Allah.Rakhesh, ex Tata AIG who joined TISSCO,Tayseer.",
  "sCongratulations ur awarded 500 of CD vouchers or 125gift guaranteed & Free entry 2 100 wkly draw txt MUSIC to 87066 TnCs www.Ldew.com1win150ppmx3age16",
  "sUr cash-balance is currently 500 pounds - to maximize ur cash-in now send CASH to 86688 only 150p/msg. CC: 08708800282 HG/Suite342/2Lands Row/W1J6HL",
  "hI'm an actor. When i work, i work in the evening and sleep late. Since i'm unemployed at the moment, i ALWAYS sleep late. When you're unemployed, every day is saturday.",
  "hHello! Just got here, st andrews-boy its a long way! Its cold. I will keep you posted",
  "hHa ha cool cool chikku chikku:-):-DB-)",
  "hOh ok no prob..",
  "hCheck audrey's status right now",
  "hBusy here. Trying to finish for new year. I am looking forward to finally meeting you...",
  "hGood afternoon sunshine! How dawns that day ? Are we refreshed and happy to be alive? Do we breathe in the air and smile ? I think of you, my love ... As always",
  "hWell i know Z will take care of me. So no worries.",
  "sUpdate_Now - Xmas Offer! Latest Motorola, SonyEricsson & Nokia & FREE Bluetooth! Double Mins & 1000 Txt on Orange. Call MobileUpd8 on 08000839402 or call2optout/F4Q=",
  "sHere is your discount code RP176781. To stop further messages reply stop. www.regalportfolio.co.uk. Customer Services 08717205546",
  "hWat uniform? In where get?",
  "hCool, text me when you're ready",
  "hHello my boytoy ... Geeee I miss you already and I just woke up. I wish you were here in bed with me, cuddling me. I love you ...",
  "hI will spoil you in bed as well :)",
  "hI'm going for bath will msg you next  &lt;#&gt;  min..",
  "hI cant keep talking to people if am not sure i can pay them if they agree to price. So pls tell me what you want to really buy and how much you are willing to pay",
  "sThanks for your Ringtone Order, Reference T91. You will be charged GBP 4 per week. You can unsubscribe at anytime by calling customer services on 09057039994",
  "hCan you say what happen",
  "hYou could have seen me..i did't recognise you Face.:)",
  "hWell there's not a lot of things happening in Lindsay on New years *sighs* Some bars in Ptbo and the blue heron has something going",
  "hKeep my payasam there if rinu brings",
  "hI taught that Ranjith sir called me. So only i sms like that. Becaus hes verifying about project. Prabu told today so only pa dont mistake me..",
  "hI guess that's why you re worried. You must know that there's a way the body repairs itself. And i'm quite sure you shouldn't worry. We'll take it slow. First the tests, they will guide when your ovulation is then just relax. Nothing you've said is a reason to worry but i.ll keep on followin you up.",
  "hYeah sure, give me a couple minutes to track down my wallet",
  "hHey leave it. not a big deal:-) take care.",
  "hHey i will be late ah... Meet you at 945+",
  "sDouble mins and txts 4 6months FREE Bluetooth on Orange. Available on Sony, Nokia Motorola phones. Call MobileUpd8 on 08000839402 or call2optout/N9DX",
  "hIt took Mr owl 3 licks",
  "hCustomer place i will call you.",
  "hMm that time you dont like fun",
  "s4mths half price Orange line rental & latest camera phones 4 FREE. Had your phone 11mths ? Call MobilesDirect free on 08000938767 to update now! or2stoptxt",
  "hYup having my lunch buffet now.. U eat already?",
  "hHuh so late... Fr dinner?",
  "hHey so this sat are we going for the intro pilates only? Or the kickboxing too? ",
  "hMorning only i can ok.",
  "hYes i think so. I am in office but my lap is in room i think thats on for the last few days. I didnt shut that down",
  "hPick you up bout 7.30ish? What time are  and that going?",
  "hFrom here after The performance award is calculated every two month.not for current one month period..",
  "hWas actually sleeping and still might when u call back. So a text is gr8. You rock sis. Will send u a text wen i wake.",
  "hYou are always putting your business out there. You put pictures of your ass on facebook. You are one of the most open people i've ever met. Why would i think a picture of your room would hurt you, make you feel violated.",
  "hGood evening Sir, Al Salam Wahleykkum.sharing a happy news.By the grace of God, i got an offer from Tayseer,TISSCO and i joined.Hope you are fine.Inshah Allah,meet you sometime.Rakhesh,visitor from India.",
  "hHmmm...k...but i want to change the field quickly da:-)i wanna get system administrator or network administrator..",
  "sFREE RINGTONE text FIRST to 87131 for a poly or text GET to 87131 for a true tone! Help? 0845 2814032 16 after 1st free, tones are 3x£150pw to e£nd txt stop",
  "hDear how is chechi. Did you talk to her",
  "hThe hair cream has not been shipped.",
  "hNone of that's happening til you get here though",
  "hYep, the great loxahatchee xmas tree burning of  &lt;#&gt;  starts in an hour",
  "hHaha get used to driving to usf man, I know a lot of stoners",
  "hAll was well until slightly disastrous class this pm with my fav darlings! Hope day off ok. Coffee wld be good as can't stay late tomorrow. Same time + place as always?",
  "hHello! Good week? Fancy a drink or something later?",
  "hHeadin towards busetop",
  "hMessage:some text missing* Sender:Name Missing* *Number Missing *Sent:Date missing *Missing U a lot thats y everything is missing sent via fullonsms.com",
  "hCome by our room at some point so we can iron out the plan for this weekend",
  "hCos i want it to be your thing",
  "hOkies... I'll go yan jiu too... We can skip ard oso, go cine den go mrt one, blah blah blah... ",
  "hBring home some Wendy =D",
  "s100 dating service cal;l 09064012103 box334sk38ch",
  "hWhatsup there. Dont u want to sleep",
  "hAlright i have a new goal now",
  "sFREE entry into our £250 weekly competition just text the word WIN to 80086 NOW. 18 T&C www.txttowin.co.uk",
  "hAlright, I'll head out in a few minutes, text me where to meet you",
  "sSend a logo 2 ur lover - 2 names joined by a heart. Txt LOVE NAME1 NAME2 MOBNO eg LOVE ADAM EVE 07123456789 to 87077 Yahoo! POBox36504W45WQ TxtNO 4 no ads 150p",
  "hYes:)from last week itself i'm taking live call.",
  "sSomeone has contacted our dating service and entered your phone because they fancy you! To find out who it is call from a landline 09111032124 . PoBox12n146tf150p",
  "hSiva is in hostel aha:-.",
  "sURGENT! Your Mobile number has been awarded with a £2000 prize GUARANTEED. Call 09058094455 from land line. Claim 3030. Valid 12hrs only",
  "hSend this to ur friends and receive something about ur voice..... How is my speaking expression? 1.childish 2.naughty 3.Sentiment 4.rowdy 5.ful of attitude 6.romantic 7.shy 8.Attractive 9.funny  &lt;#&gt; .irritating  &lt;#&gt; .lovable. reply me..",
  "hOk. She'll be ok. I guess",
  "haathi..where are you dear..",
  "hAny pain on urination any thing else?",
  "h7 at esplanade.. Do ü mind giving me a lift cos i got no car today..",
  "hI wnt to buy a BMW car urgently..its vry urgent.but hv a shortage of  &lt;#&gt; Lacs.there is no source to arng dis amt. &lt;#&gt; lacs..thats my prob",
  "hAt home watching tv lor.",
  "hDoes she usually take fifteen fucking minutes to respond to a yes or no question",
  "sCongrats! Nokia 3650 video camera phone is your Call 09066382422 Calls cost 150ppm Ave call 3mins vary from mobiles 16+ Close 300603 post BCM4284 Ldn WC1N3XX",
  "hBooked ticket for pongal?",
  "hYou available now? I'm like right around hillsborough &amp;  &lt;#&gt; th",
  "hThe message sent is askin for  &lt;#&gt; dollars. Shoul i pay  &lt;#&gt;  or  &lt;#&gt; ?",
  "hAsk g or iouri, I've told the story like ten times already",
  "hHow long does applebees fucking take",
  "hHi hope u get this txt~journey hasnt been gd,now about 50 mins late I think.",
  "hBut i have to. I like to have love and arrange.",
  "hYes..he is really great..bhaji told kallis best cricketer after sachin in world:).very tough to get out.",
  "hYou were supposed to wake ME up &gt;:(",
  "hOic... I saw him too but i tot he din c me... I found a group liao...",
  "hSorry, I'll call later",
  "h\"HEY HEY WERETHE MONKEESPEOPLE SAY WE MONKEYAROUND! HOWDY GORGEOUS, HOWU DOIN? FOUNDURSELF A JOBYET SAUSAGE?LOVE JEN XXX\"",
  "hSorry, my battery died, I can come by but I'm only getting a gram for now, where's your place?",
  "hWell done, blimey, exercise, yeah, i kinda remember wot that is, hmm. ",
  "hI wont get concentration dear you know you are my mind and everything :-)",
  "hLOL ... Have you made plans for new years?",
  "h10 min later k...",
  "hhanks lotsly!",
  "hThanks for this hope you had a good day today",
  "hK:)k:)what are detail you want to transfer?acc no enough?",
  "hOk i will tell her to stay out. Yeah its been tough but we are optimistic things will improve this month.",
  "sLoan for any purpose £500 - £75,000. Homeowners + Tenants welcome. Have you been previously refused? We can still help. Call Free 0800 1956669 or text back 'help'",
  "hSi si. I think ill go make those oreo truffles.",
  "hLOOK AT AMY URE A BEAUTIFUL, INTELLIGENT WOMAN AND I LIKE U A LOT. I KNOW U DON’T LIKE ME LIKE THAT SO DON’T WORRY.",
  "hI hope you that's the result of being consistently intelligent and kind. Start asking him about practicum links and keep your ears open and all the best. ttyl",
  "h1.20 that call cost. Which i guess isnt bad. Miss ya, need ya, want ya, love ya",
  "hGoing thru a very different feeling.wavering decisions and coping up with the same is the same individual.time will heal everything i believe.",
  "hWhere did u go? My phone is gonna die you have to stay in here",
  "hGreat. Never been better. Each day gives even more reasons to thank God",
  "sUpgrdCentre Orange customer, you may now claim your FREE CAMERA PHONE upgrade for your loyalty. Call now on 0207 153 9153. Offer ends 26th July. T&C's apply. Opt-out available",
  "hSorry, I'll call later ok bye",
  "hOk i am on the way to railway",
  "hgreat princess! I love giving and receiving oral. Doggy style is my fave position. How about you? I enjoy making love  &lt;#&gt;  times per night :)",
  "hThey don't put that stuff on the roads to keep it from getting slippery over there?",
  "hWhen are you going to ride your bike?",
  "hYup, no need. I'll jus wait 4 e rain 2 stop.",
  "hThere are many company. Tell me the language.",
  "sokmail: Dear Dave this is your final notice to collect your 4* Tenerife Holiday or #5000 CASH award! Call 09061743806 from landline. TCs SAE Box326 CW25WX 150ppm",
  "hHow long has it been since you screamed, princess?",
  "hNothing. I meant that once the money enters your account here, the bank will remove its flat rate. Someone transfered  &lt;#&gt;  to my account and  &lt;#&gt; dollars got removed. So the banks differ and charges also differ.be sure you trust the 9ja person you are sending account details to cos...",
  "sWant 2 get laid tonight? Want real Dogging locations sent direct 2 ur Mob? Join the UK's largest Dogging Network by txting MOAN to 69888Nyt. ec2a. 31p.msg@150p",
  "hNice line said by a broken heart- Plz don't cum 1 more times infront of me... Other wise once again I ll trust U... Good 9t:)",
  "hOk I'm gonna head up to usf in like fifteen minutes",
  "hLove you aathi..love u lot..",
  "hTension ah?what machi?any problem?",
  "hK, can I pick up another 8th when you're done?",
  "hWhen're you guys getting back? G said you were thinking about not staying for mcr",
  "hAlmost there, see u in a sec",
  "hYo carlos, a few friends are already asking me about you, you working at all this weekend?",
  "hWatching tv lor...",
  "hThank you baby! I cant wait to taste the real thing...",
  "hYou should change your fb to jaykwon thuglyfe falconerf",
  "hIf we win its really no 1 side for long time.",
  "sFREE MESSAGE Activate your 500 FREE Text Messages by replying to this message with the word FREE For terms & conditions, visit www.07781482378.com",
  "hDear reached railway. What happen to you",
  "hDepends on quality. If you want the type i sent boye, faded glory, then about 6. If you want ralphs maybe 2",
  "hI think i've fixed it can you send a test message?",
  "hSorry man my account's dry or I would, if you want we could trade back half or I could buy some shit with my credit card",
  "sCongrats! 1 year special cinema pass for 2 is yours. call 09061209465 now! C Suprman V, Matrix3, StarWars3, etc all 4 FREE! bx420-ip4-5we. 150pm. Dont miss out!",
  "hSorry,in meeting I'll call later",
  "hWhat class of  &lt;#&gt;  reunion?",
  "hAre you free now?can i call now?",
  "hGot meh... When?",
  "hNope... Think i will go for it on monday... Sorry i replied so late",
  "hSome of them told accenture is not confirm. Is it true.",
  "hKate jackson rec center before 7ish, right?",
  "hDear i have reache room",
  "hFighting with the world is easy, u either win or lose bt fightng with some1 who is close to u is dificult if u lose - u lose if u win - u still lose.",
  "hWhen can ü come out?",
  "hCheck with nuerologist.",
  "hLolnice. I went from a fish to ..water.?",
  "s+123 Congratulations - in this week's competition draw u have won the £1450 prize to claim just call 09050002311 b4280703. T&Cs/stop SMS 08718727868. Over 18 only 150ppm",
  "hNo it's waiting in e car dat's bored wat. Cos wait outside got nothing 2 do. At home can do my stuff or watch tv wat.",
  "hMaybe westshore or hyde park village, the place near my house?",
  "hYou should know now. So how's anthony. Are you bringing money. I've school fees to pay and rent and stuff like that. Thats why i need your help. A friend in need....|",
  "hWhat's the significance?",
  "hYour opinion about me? 1. Over 2. Jada 3. Kusruthi 4. Lovable 5. Silent 6. Spl character 7. Not matured 8. Stylish 9. Simple Pls reply..",
  "h8 at the latest, g's still there if you can scrounge up some ammo and want to give the new ak a try",
  "hPrabha..i'm soryda..realy..frm heart i'm sory",
  "hLol ok your forgiven :)",
  "hNo..jst change tat only..",
  "sYou are guaranteed the latest Nokia Phone, a 40GB iPod MP3 player or a £500 prize! Txt word: COLLECT to No: 83355! IBHltd LdnW15H 150p/Mtmsgrcvd18+",
  "hS:)no competition for him.",
  "sBoltblue tones for 150p Reply POLY# or MONO# eg POLY3 1. Cha Cha Slide 2. Yeah 3. Slow Jamz 6. Toxic 8. Come With Me or STOP 4 more tones txt MORE",
  "sYour credits have been topped up for http://www.bubbletext.com Your renewal Pin is tgxxrz",
  "hThat way transport is less problematic than on sat night. By the way, if u want to ask  n  to join my bday, feel free. But need to know definite nos as booking on fri. ",
  "hUsually the person is unconscious that's in children but in adults they may just behave abnormally. I.ll call you now",
  "hBut that's on ebay it might be less elsewhere.",
  "hShall i come to get pickle",
  "hWere gonna go get some tacos",
  "hThat's very rude, you on campus?",
  "sURGENT!: Your Mobile No. was awarded a £2,000 Bonus Caller Prize on 02/09/03! This is our 2nd attempt to contact YOU! Call 0871-872-9755 BOX95QU",
  "hHi i won't b ard 4 christmas. But do enjoy n merry x'mas.",
  "sToday's Offer! Claim ur £150 worth of discount vouchers! Text YES to 85023 now! SavaMob, member offers mobile! T Cs 08717898035. £3.00 Sub. 16 . Unsub reply X",
  "hYes! How is a pretty lady like you single?",
  "sYou will recieve your tone within the next 24hrs. For Terms and conditions please see Channel U Teletext Pg 750",
  "hJay says that you're a double-faggot",
  "sPRIVATE! Your 2003 Account Statement for 07815296484 shows 800 un-redeemed S.I.M. points. Call 08718738001 Identifier Code 41782 Expires 18/11/04 ",
  "hWhat Today-sunday..sunday is holiday..so no work..",
  "hGudnite....tc...practice going on",
  "hI'll be late...",
  "hI've not called you in a while. This is hoping it was l8r malaria and that you know that we miss you guys. I miss Bani big, so pls give her my love especially. Have a great day.",
  "hGood afternoon, my love! How goes that day ? I hope maybe you got some leads on a job. I think of you, boytoy and send you a passionate kiss from across the sea",
  "hProbably gonna be here for a while, see you later tonight &lt;)",
  "hOr maybe my fat fingers just press all these buttons and it doesn't know what to do.",
  "hUmmmmmaah Many many happy returns of d day my dear sweet heart.. HAPPY BIRTHDAY dear",
  "hI am in tirupur da, once you started from office call me.",
  "sfrom www.Applausestore.com MonthlySubscription@50p/msg max6/month T&CsC web age16 2stop txt stop",
  "hA famous quote : when you develop the ability to listen to 'anything' unconditionally without losing your temper or self confidence, it means you are ......... 'MARRIED'",
  "hBut am going to college pa. What to do. are else ill come there it self. Pa.",
  "h4 oclock at mine. Just to bash out a flat plan.",
  "hThis girl does not stay in bed. This girl doesn't need recovery time. Id rather pass out while having fun then be cooped up in bed",
  "hThen any special there?",
  "hI know but you need to get hotel now. I just got my invitation but i had to apologise. Cali is to sweet for me to come to some english bloke's weddin",
  "hSorry that took so long, omw now",
  "hWait  &lt;#&gt;  min..",
  "hOk give me 5 minutes I think I see her. BTW you're my alibi. You were cutting my hair the whole time.",
  "hImagine you finally get to sink into that bath after I have put you through your paces, maybe even having you eat me for a while before I left ... But also imagine the feel of that cage on your cock surrounded by the bath water, reminding you always who owns you ... Enjoy, my cuck",
  "hHurry up, I've been weed-deficient for like three days",
  "hSure, if I get an acknowledgement from you that it's astoundingly tactless and generally faggy to demand a blood oath fo",
  "hOk. Every night take a warm bath drink a cup of milk and you'll see a work of magic. You still need to loose weight. Just so that you know",
  "hI‘ll have a look at the frying pan in case it‘s cheap or a book perhaps. No that‘s silly a frying pan isn‘t likely to be a book",
  "hO. Well uv causes mutations. Sunscreen is like essential thesedays",
  "hHaving lunch:)you are not in online?why?",
  "hI know that my friend already told that.",
  "hHi Princess! Thank you for the pics. You are very pretty. How are you?",
  "hAiyo... U always c our ex one... I dunno abt mei, she haven reply... First time u reply so fast... Y so lucky not workin huh, got bao by ur sugardad ah...gee.. ",
  "hHi msg me:)i'm in office..",
  "hThanx 4 e brownie it's v nice...",
  "hGeeeee ... I love you so much I can barely stand it",
  "sGENT! We are trying to contact you. Last weekends draw shows that you won a £1000 prize GUARANTEED. Call 09064012160. Claim Code K52. Valid 12hrs only. 150ppm ",
  "hFuck babe ... I miss you already, you know ? Can't you let me send you some money towards your net ? I need you ... I want you ... I crave you ...",
  "hIll call u 2mrw at ninish, with my address that icky American freek wont stop callin me 2 bad Jen k eh?",
  "hOooh bed ridden ey? What are YOU thinking of?",
  "hSo anyways, you can just go to your gym or whatever, my love *smiles* I hope your ok and having a good day babe ... I miss you so much already",
  "hLove it! Daddy will make you scream with pleasure! I am going to slap your ass with my dick!",
  "hWOT U WANNA DO THEN MISSY?",
  "hYar lor wait 4 my mum 2 finish sch then have lunch lor... I whole morning stay at home clean my room now my room quite clean... Hee...",
  "hDo you know where my lab goggles went",
  "hCan you open the door?",
  "hWaiting for your call.",
  "hNope i waiting in sch 4 daddy... ",
  "sYou have won ?1,000 cash or a ?2,000 prize! To claim, call09050000327",
  "hI'm tired of arguing with you about this week after week. Do what you want and from now on, i'll do the same.",
  "hÜ wait 4 me in sch i finish ard 5..",
  "sour mobile number has won £5000, to claim calls us back or ring the claims hot line on 09050005321.",
  "hArngd marriage is while u r walkin unfortuntly a snake bites u. bt love marriage is dancing in frnt of d snake &amp; sayin Bite me, bite me.",
  "hHuh so early.. Then ü having dinner outside izzit?",
  "hOk anyway no need to change with what you said",
  "sWe tried to contact you re your reply to our offer of 750 mins 150 textand a new video phone call 08002988890 now or reply for free delivery tomorrow",
  "hmy ex-wife was not able to have kids. Do you want kids one day?",
  "hSo how's scotland. Hope you are not over showing your JJC tendencies. Take care. Live the dream",
  "hTell them u have a headache and just want to use 1 hour of sick time.",
  "hI dun thk i'll quit yet... Hmmm, can go jazz ? Yogasana oso can... We can go meet em after our lessons den... ",
  "h\"Pete can you please ring meive hardly gotany credit\"",
  "hYa srsly better than yi tho",
  "hI'm in a meeting, call me later at",
  "sFor ur chance to win a £250 wkly shopping spree TXT: SHOP to 80878. T's&C's www.txt-2-shop.com custcare 08715705022, 1x150p/wk",
  "sYou have been specially selected to receive a 2000 pound award! Call 08712402050 BEFORE the lines close. Cost 10ppm. 16+. T&Cs apply. AG Promo",
  "sPRIVATE! Your 2003 Account Statement for 07753741225 shows 800 un-redeemed S. I. M. points. Call 08715203677 Identifier Code: 42478 Expires 24/10/04",
  "hYou still at grand prix?",
  "hI met you as a stranger and choose you as my friend. As long as the world stands, our friendship never ends. Lets be Friends forever!!! Gud nitz...",
  "hI am great! How are you?",
  "hGud mrng dear have a nice day",
  "sYou have an important customer service announcement. Call FREEPHONE 0800 542 0825 now!",
  "hWill do. Was exhausted on train this morning. Too much wine and pie. You sleep well too",
  "hI'm going out to buy mum's present ar.",
  "hMind blastin.. No more Tsunamis will occur from now on.. Rajnikant stopped swimming in Indian Ocean..:-D",
  "hIf u sending her home first it's ok lor. I'm not ready yet.",
  "hSpeaking of does he have any cash yet?",
  "hBe happy there. I will come after noon",
  "hMeet after lunch la...",
  "hTaKe CaRE n gET WeLL sOOn",
  "sXCLUSIVE@CLUBSAISAI 2MOROW 28/5 SOIREE SPECIALE ZOUK WITH NICHOLS FROM PARIS.FREE ROSES 2 ALL LADIES !!! info: 07946746291/07880867867 ",
  "hwhat I meant to say is cant wait to see u again getting bored of this bridgwater banter",
  "hNeva mind it's ok..",
  "hIt's fine, imma get a drink or somethin. Want me to come find you?",
  "s22 days to kick off! For Euro2004 U will be kept up to date with the latest news and results daily. To be removed send GET TXT STOP to 83222",
  "hIts a valentine game. . . Send dis msg to all ur friends. .. If 5 answers r d same then someone really loves u. Ques- which colour suits me the best?rply me",
  "hI have many dependents",
  "hTHANX4 TODAY CER IT WAS NICE 2 CATCH UP BUT WE AVE 2 FIND MORE TIME MORE OFTEN OH WELL TAKE CARE C U SOON.C",
  "hI called and said all to him:)then he have to choose this future.",
  "h\"Happy valentines day\" I know its early but i have hundreds of handsomes and beauties to wish. So i thought to finish off aunties and uncles 1st...",
  "hHe like not v shock leh. Cos telling shuhui is like telling leona also. Like dat almost all know liao. He got ask me abt ur reaction lor.",
  "hFor my family happiness..",
  "hI come n pick ü up... Come out immediately aft ur lesson...",
  "hLet there be snow. Let there be snow. This kind of weather brings ppl together so friendships can grow.",
  "hDear we got  &lt;#&gt;  dollars hi hi",
  "hGood words.... But words may leave u in dismay many times.",
  "hMAKE SURE ALEX KNOWS HIS BIRTHDAY IS OVER IN FIFTEEN MINUTES AS FAR AS YOU'RE CONCERNED",
  "hsorry, no, have got few things to do. may be in pub later.",
  "hNah it's straight, if you can just bring bud or drinks or something that's actually a little more useful than straight cash",
  "hHaha good to hear, I'm officially paid and on the market for an 8th",
  "hHow many licks does it take to get to the center of a tootsie pop?",
  "hYup i thk they r e teacher said that will make my face look longer. Darren ask me not 2 cut too short.",
  "sNew TEXTBUDDY Chat 2 horny guys in ur area 4 just 25p Free 2 receive Search postcode or at gaytextbuddy.com. TXT ONE name to 89693",
  "sTodays Vodafone numbers ending with 4882 are selected to a receive a £350 award. If your number matches call 09064019014 to receive your £350 award.",
  "hPlease dont say like that. Hi hi hi",
  "hThank u!",
  "hOh that was a forwarded message. I thought you send that to me",
  "hGot it. Seventeen pounds for seven hundred ml - hope ok.",
  "sDear Voucher Holder, 2 claim this weeks offer, at your PC go to http://www.e-tlp.co.uk/expressoffer Ts&Cs apply.2 stop texts txt STOP to 80062.",
  "hMe n him so funny...",
  "hSweetheart, hope you are not having that kind of day! Have one with loads of reasons to smile. Biola",
  "hWhen ü login dat time... Dad fetching ü home now?",
  "hWhat will we do in the shower, baby?",
  "hI had askd u a question some hours before. Its answer",
  "hWell imma definitely need to restock before thanksgiving, I'll let you know when I'm out",
  "h said kiss, kiss, i can't do the sound effects! He is a gorgeous man isn't he! Kind of person who needs a smile to brighten his day! ",
  "hProbably gonna swing by in a wee bit",
  "hYa very nice. . .be ready on thursday",
  "hAllo! We have braved the buses and taken on the trains and triumphed. I mean we‘re in b‘ham. Have a jolly good rest of week",
  "hWatching cartoon, listening music &amp; at eve had to go temple &amp; church.. What about u?",
  "hDo you mind if I ask what happened? You dont have to say if it is uncomfortable.",
  "sPRIVATE! Your 2003 Account Statement for shows 800 un-redeemed S. I. M. points. Call 08715203694 Identifier Code: 40533 Expires 31/10/04",
  "hNo prob. I will send to your email.",
  "sYou have won ?1,000 cash or a ?2,000 prize! To claim, call09050000327. T&C: RSTM, SW7 3SS. 150ppm",
  "hThats cool! Sometimes slow and gentle. Sonetimes rough and hard :)",
  "hI'm gonna say no. Sorry. I would but as normal am starting to panic about time. Sorry again! Are you seeing on Tuesday?",
  "hWait, do you know if wesleys in town? I bet she does hella drugs!",
  "hFine i miss you very much.",
  "hDid u got that persons story",
  "hTell them the drug dealer's getting impatient",
  "hSun cant come to earth but send luv as rays. cloud cant come to river but send luv as rain. I cant come to meet U, but can send my care as msg to U. Gud evng",
  "hYou will be in the place of that man",
  "hIt doesnt make sense to take it there unless its free. If you need to know more, wikipedia.com",
  "s88800 and 89034 are premium phone services call 08718711108",
  "hUnder the sea, there lays a rock. In the rock, there is an envelope. In the envelope, there is a paper. On the paper, there are 3 words... '",
  "hThen mum's repent how?",
  "hSorry me going home first... Daddy come fetch ü later...",
  "hLeave it de:-). Start Prepare for next:-)..",
  "hYes baby! We can study all the positions of the kama sutra ;)",
  "hEn chikku nange bakra msg kalstiya..then had tea/coffee?",
  "hCarlos'll be here in a minute if you still need to buy",
  "hThis pay is  &lt;DECIMAL&gt;  lakhs:)",
  "hHave a good evening! Ttyl",
  "hDid u receive my msg?",
  "hHo ho - big belly laugh! See ya tomo",
  "sSMS. ac sun0819 posts HELLO:\"You seem cool, wanted to say hi. HI!!!\" Stop? Send STOP to 62468",
  "sGet ur 1st RINGTONE FREE NOW! Reply to this msg with TONE. Gr8 TOP 20 tones to your phone every week just £1.50 per wk 2 opt out send STOP 08452810071 16",
  "hDitto. And you won't have to worry about me saying ANYTHING to you anymore. Like i said last night, you do whatever you want and i'll do the same. Peace.",
  "hI've got  &lt;#&gt; , any way I could pick up?",
  "hI dont knw pa, i just drink milk..",
  "hMaybe?! Say hi to  and find out if  got his card. Great escape or wetherspoons? ",
  "hPiggy, r u awake? I bet u're still sleeping. I'm going 4 lunch now...",
  "hCause I'm not freaky lol",
  "hMissed your call cause I was yelling at scrappy. Miss u. Can't wait for u to come home. I'm so lonely today.",
  "hWhat is this 'hex' place you talk of? Explain!",
  "hÜ log off 4 wat. It's sdryb8i",
  "hIs xy going 4 e lunch?",
  "sHi I'm sue. I am 20 years old and work as a lapdancer. I love sex. Text me live - I'm i my bedroom now. text SUE to 89555. By TextOperator G2 1DA 150ppmsg 18+",
  "hI wanted to ask ü to wait 4 me to finish lect. Cos my lect finishes in an hour anyway.",
  "hHave you finished work yet? :)",
  "hEvery King Was Once A Crying Baby And Every Great Building Was Once A Map.. Not Imprtant Where U r TODAY, BUT Where U Wil Reach TOMORW. Gud ni8",
  "hDear,Me at cherthala.in case u r coming cochin pls call bfore u start.i shall also reach accordingly.or tell me which day u r coming.tmorow i am engaged ans its holiday.",
  "hThanks love. But am i doing torch or bold.",
  "s<Forwarded from 448712404000>Please CALL 08712404000 immediately as there is an urgent message waiting for you.",
  "hWas the farm open?",
  "hSorry to trouble u again. Can buy 4d for my dad again? 1405, 1680, 1843. All 2 big 1 small, sat n sun. Thanx.",
  "hMy sister in law, hope you are having a great month. Just saying hey. Abiola",
  "hWill purchase d stuff today and mail to you. Do you have a po box number?",
  "hAh poop. Looks like ill prob have to send in my laptop to get fixed cuz it has a gpu problem",
  "hGood. Good job. I like entrepreneurs",
  "hAight, you close by or still down around alex's place?",
  "hmeet you in corporation st outside gap … you can see how my mind is working!",
  "hMum ask ü to buy food home...",
  "hK..u also dont msg or reply to his msg..",
  "hHow much r ü willing to pay?",
  "hSorry, I'll call later",
  "hWhat is important is that you prevent dehydration by giving her enough fluids",
  "hThats a bit weird, even ?- where is the do supposed to be happening? But good idea, sure they will be in pub!",
  "hTrue dear..i sat to pray evening and felt so.so i sms'd you in some time...",
  "hI don't think I can get away for a trek that long with family in town, sorry",
  "hSo when do you wanna gym harri",
  "hQuite late lar... Ard 12 anyway i wun b drivin...",
  "sTo review and KEEP the fantastic Nokia N-Gage game deck with Club Nokia, go 2 www.cnupdates.com/newsletter. unsubscribe from alerts reply with the word OUT",
  "s4mths half price Orange line rental & latest camera phones 4 FREE. Had your phone 11mths+? Call MobilesDirect free on 08000938767 to update now! or2stoptxt T&Cs",
  "hHeight of Confidence: All the Aeronautics professors wer calld &amp; they wer askd 2 sit in an aeroplane. Aftr they sat they wer told dat the plane ws made by their students. Dey all hurried out of d plane.. Bt only 1 didnt move... He said:\"if it is made by my students,this wont even start........ Datz confidence..",
  "hIt just seems like weird timing that the night that all you and g want is for me to come smoke is the same day as when a shitstorm is attributed to me always coming over and making everyone smoke",
  "s08714712388 between 10am-7pm Cost 10p",
  "hSave yourself the stress. If the person has a dorm account, just send your account details and the money will be sent to you.",
  "hHe also knows about lunch menu only da. . I know",
  "hWhen i have stuff to sell i.ll tell you",
  "s+449071512431 URGENT! This is the 2nd attempt to contact U!U have WON £1250 CALL 09071512433 b4 050703 T&CsBCM4235WC1N3XX. callcost 150ppm mobilesvary. max£7. 50",
  "hBook which lesson? then you msg me... I will call up after work or sth... I'm going to get specs. My membership is PX3748",
  "sYou have WON a guaranteed £1000 cash or a £2000 prize. To claim yr prize call our customer service representative on 08714712394 between 10am-7pm",
  "hMacha dont feel upset.i can assume your mindset.believe me one evening with me and i have some wonderful plans for both of us.LET LIFE BEGIN AGAIN.call me anytime",
  "hOh is it? Send me the address",
  "hS'fine. Anytime. All the best with it.",
  "hThat is wondar full flim.",
  "hYa even those cookies have jelly on them",
  "hThe world is running and i am still.maybe all are feeling the same,so be it.or i have to admit,i am mad.then where is the correction?or let me call this is life.and keep running with the world,may be u r also running.lets run.",
  "hGot it! It looks scrumptious... daddy wants to eat you all night long!",
  "hOf cos can lar i'm not so ba dao ok... 1 pm lor... Y u never ask where we go ah... I said u would ask on fri but he said u will ask today...",
  "hAlright omw, gotta change my order to a half8th",
  "hExactly. Anyways how far. Is jide her to study or just visiting",
  "hDunno y u ask me.",
  "sEmail AlertFrom: Jeri StewartSize: 2KBSubject: Low-cost prescripiton drvgsTo listen to email call 123",
  "hNo he didn't. Spring is coming early yay!",
  "hLol you won't feel bad when I use her money to take you out to a steak dinner =D",
  "hEven u dont get in trouble while convincing..just tel him once or twice and just tel neglect his msgs dont c and read it..just dont reply",
  "hLeaving to qatar tonite in search of an opportunity.all went fast.pls add me in ur prayers dear.Rakhesh",
  "hThen why no one talking to me",
  "hThanks for looking out for me. I really appreciate.",
  "sHi. Customer Loyalty Offer:The NEW Nokia6650 Mobile from ONLY £10 at TXTAUCTION! Txt word: START to No: 81151 & get yours Now! 4T&Ctxt TC 150p/MTmsg",
  "hWish i were with you now!",
  "hHaha mayb u're rite... U know me well. Da feeling of being liked by someone is gd lor. U faster go find one then all gals in our group attached liao.",
  "hYes i will be there. Glad you made it.",
  "hDo well :)all will for little time. Thing of good times ahead:",
  "hJust got up. have to be out of the room very soon. …. i hadn't put the clocks back til at 8 i shouted at everyone to get up and then realised it was 7. wahay. another hour in bed.",
  "hOk. There may be a free gym about.",
  "hMen like shorter ladies. Gaze up into his eyes.",
  "hDunno he jus say go lido. Same time 930.",
  "hI promise to take good care of you, princess. I have to run now. Please send pics when you get a chance. Ttyl!",
  "sU are subscribed to the best Mobile Content Service in the UK for £3 per 10 days until you send STOP to 82324. Helpline 08706091795",
  "hIs there a reason we've not spoken this year? Anyways have a great week and all the best in your exam",
  "hBy monday next week. Give me the full gist",
  "sDo you realize that in about 40 years, we'll have thousands of old ladies running around with tattoos?",
  "sYou have an important customer service announcement from PREMIER.",
  "hDont gimme that lip caveboy",
  "hWhen did you get to the library",
  "hRealy sorry-i don't recognise this number and am now confused :) who r u please?! ",
  "hSo why didnt you holla?",
  "hCant think of anyone with * spare room off * top of my head",
  "hFaith makes things possible,Hope makes things work,Love makes things beautiful,May you have all three this Christmas!Merry Christmas!",
  "hU should have made an appointment",
  "hCall me when you/carlos is/are here, my phone's vibrate is acting up and I might not hear texts",
  "sRomantic Paris. 2 nights, 2 flights from £79 Book now 4 next year. Call 08704439680Ts&Cs apply.",
  "hWe are at grandmas. Oh dear, u still ill? I felt Shit this morning but i think i am just hungover! Another night then. We leave on sat.",
  "sUrgent Ur £500 guaranteed award is still unclaimed! Call 09066368327 NOW closingdate04/09/02 claimcode M39M51 £1.50pmmorefrommobile2Bremoved-MobyPOBox734LS27YF",
  "hNothing but we jus tot u would ask cos u ba gua... But we went mt faber yest... Yest jus went out already mah so today not going out... Jus call lor...",
  "hWishing you and your family Merry \"X\" mas and HAPPY NEW Year in advance..",
  "sUR awarded a City Break and could WIN a £200 Summer Shopping spree every WK. Txt STORE to 88039 . SkilGme. TsCs087147403231Winawk!Age16 £1.50perWKsub",
  "hI'm nt goin, got somethin on, unless they meetin 4 dinner lor... Haha, i wonder who will go tis time...",
  "hSorry, I'll call later",
  "hI cant pick the phone right now. Pls send a message",
  "hLol I know! They're so dramatic. Schools already closed for tomorrow. Apparently we can't drive in the inch of snow were supposed to get.",
  "hNot getting anywhere with this damn job hunting over here!",
  "hLol! U drunkard! Just doing my hair at d moment. Yeah still up 4 tonight. Wats the plan? ",
  "hidc get over here, you are not weaseling your way out of this shit twice in a row",
  "hI wil be there with in  &lt;#&gt;  minutes. Got any space",
  "hJust sleeping..and surfing",
  "hThanks for picking up the trash.",
  "hWhy don't you go tell your friend you're not sure you want to live with him because he smokes too much then spend hours begging him to come smoke",
  "h\"Hi its Kate it was lovely to see you tonight and ill phone you tomorrow. I got to sing and a guy gave me his card! xxx\"",
  "hHappy New year my dear brother. I really do miss you. Just got your number and decided to send you this text wishing you only happiness. Abiola",
  "hThat means get the door",
  "hYour opinion about me? 1. Over 2. Jada 3. Kusruthi 4. Lovable 5. Silent 6. Spl character 7. Not matured 8. Stylish 9. Simple Pls reply..",
  "hHmmm ... I thought we said 2 hours slave, not 3 ... You are late ... How should I punish you ?",
  "hBeerage?",
  "sYou have an important customer service announcement from PREMIER. Call FREEPHONE 0800 542 0578 now!",
  "hDont think so. It turns off like randomlly within 5min of opening",
  "hShe was supposed to be but couldn't make it, she's still in town though",
  "hIt does it on its own. Most of the time it fixes my spelling. But sometimes it gets a completely diff word. Go figure",
  "sEver thought about living a good life with a perfect partner? Just txt back NAME and AGE to join the mobile community. (100p/SMS)",
  "s5 Free Top Polyphonic Tones call 087018728737, National Rate. Get a toppoly tune sent every week, just text SUBPOLY to 81618, £3 per pole. UnSub 08718727870.",
  "hGud mrng dear hav a nice day",
  "hThis is hoping you enjoyed your game yesterday. Sorry i've not been in touch but pls know that you are fondly bein thot off. Have a great week. Abiola",
  "hAll e best 4 ur driving tmr :-)",
  "hY?WHERE U AT DOGBREATH? ITS JUST SOUNDING LIKE JAN C THAT’S AL!!!!!!!!!",
  "hOmg I want to scream. I weighed myself and I lost more weight! Woohoo!",
  "hThere generally isn't one. It's an uncountable noun - u in the dictionary. pieces of research?",
  "hit's really getting me down just hanging around.",
  "sOrange customer, you may now claim your FREE CAMERA PHONE upgrade for your loyalty. Call now on 0207 153 9996. Offer ends 14thMarch. T&C's apply. Opt-out availa",
  "h\"Petey boy whereare you me and all your friendsare in theKingshead come down if you canlove Nic\"",
  "hOk i msg u b4 i leave my house.",
  "h\"Gimme a few\" was  &lt;#&gt;  minutes ago",
  "sLast Chance! Claim ur £150 worth of discount vouchers today! Text SHOP to 85023 now! SavaMob, offers mobile! T Cs SavaMob POBOX84, M263UZ. £3.00 Sub. 16",
  "hAppt is at &lt;TIME&gt; am. Not my fault u don't listen. I told u twice",
  "sFREE for 1st week! No1 Nokia tone 4 ur mobile every week just txt NOKIA to 8077 Get txting and tell ur mates. www.getzed.co.uk POBox 36504 W45WQ 16+ norm150p/tone",
  "sYou have won a guaranteed £200 award or even £1000 cashto claim UR award call free on 08000407165 (18+) 2 stop getstop on 88222 PHP. RG21 4JX",
  "hK I'll be there before 4.",
  "hI dled 3d its very imp",
  "hsure, but make sure he knows we ain't smokin yet",
  "hBoooo you always work. Just quit.",
  "hI am taking half day leave bec i am not well",
  "hUgh I don't wanna get out of bed. It's so warm.",
  "hS:)s.nervous  &lt;#&gt; :)",
  "hSo there's a ring that comes with the guys costumes. It's there so they can gift their future yowifes. Hint hint",
  "sCongratulations ur awarded either £500 of CD gift vouchers & Free entry 2 our £100 weekly draw txt MUSIC to 87066 TnCs www.Ldew.com1win150ppmx3age16",
  "hI borrow ur bag ok.",
  "sU were outbid by simonwatson5120 on the Shinco DVD Plyr. 2 bid again, visit sms. ac/smsrewards 2 end bid notifications, reply END OUT",
  "hWhere's my boytoy? I miss you ... What happened?",
  "hHe has lots of used ones babe, but the model doesn't help. Youi have to bring it over and he'll match it up",
  "hAlso are you bringing galileo or dobby",
  "hThen why you not responding",
  "h\"BOO BABE! U ENJOYIN YOURJOB? U SEEMED 2 B GETTIN ON WELL HUNNY!HOPE URE OK?TAKE CARE & I’LLSPEAK 2U SOONLOTS OF LOVEME XXXX.\"",
  "hGood afternoon starshine! How's my boytoy? Does he crave me yet? Ache to fuck me ? *sips cappuccino* I miss you babe *teasing kiss*",
  "hOn the road so cant txt",
  "sSMSSERVICES. for yourinclusive text credits, pls goto www.comuk.net login= 3qxj9 unsubscribe with STOP, no extra charge. help 08702840625.COMUK. 220-CM2 9AE",
  "s25p 4 alfie Moon's Children in need song on ur mob. Tell ur m8s. Txt Tone charity to 8007 for Nokias or Poly charity for polys: zed 08701417012 profit 2 charity.",
  "hHave a good evening! Ttyl",
  "hHmm .. Bits and pieces lol ... *sighs* ...",
  "hHahaha..use your brain dear",
  "hHey. You got any mail?",
  "hSorry light turned green, I meant another friend wanted  &lt;#&gt;  worth but he may not be around",
  "hThanks for yesterday sir. You have been wonderful. Hope you enjoyed the burial. MojiBiola",
  "sU have a secret admirer. REVEAL who thinks U R So special. Call 09065174042. To opt out Reply REVEAL STOP. 1.50 per msg recd. Cust care 07821230901",
  "hHi mate its RV did u hav a nice hol just a message 3 say hello coz haven’t sent u 1 in ages started driving so stay off roads!RVx",
  "sDear Voucher Holder, To claim this weeks offer, at you PC please go to http://www.e-tlp.co.uk/expressoffer Ts&Cs apply. To stop texts, txt STOP to 80062",
  "hThank you so much. When we skyped wit kz and sura, we didnt get the pleasure of your company. Hope you are good. We've given you ultimatum oh! We are countin down to aburo. Enjoy! This is the message i sent days ago",
  "hSurely result will offer:)",
  "hGood Morning my Dear........... Have a great &amp; successful day.",
  "sDo you want 750 anytime any network mins 150 text and a NEW VIDEO phone for only five pounds per week call 08002888812 or reply for delivery tomorrow",
  "hSir, I have been late in paying rent for the past few months and had to pay a $ &lt;#&gt;  charge. I felt it would be inconsiderate of me to nag about something you give at great cost to yourself and that's why i didnt speak up. I however am in a recession and wont be able to pay the charge this month hence my askin well ahead of month's end. Can you please help. Thanks",
  "sWe tried to contact you re our offer of New Video Phone 750 anytime any network mins HALF PRICE Rental camcorder call 08000930705 or reply for delivery Wed",
  "sLast chance 2 claim ur £150 worth of discount vouchers-Text YES to 85023 now!SavaMob-member offers mobile T Cs 08717898035. £3.00 Sub. 16 . Remove txt X or STOP",
  "hI luv u soo much u don’t understand how special u r 2 me ring u 2morrow luv u xxx",
  "hPls send me a comprehensive mail about who i'm paying, when and how much.",
  "hOur Prashanthettan's mother passed away last night. pray for her and family.",
  "sUrgent! call 09066350750 from your landline. Your complimentary 4* Ibiza Holiday or 10,000 cash await collection SAE T&Cs PO BOX 434 SK3 8WP 150 ppm 18+ ",
  "hK.k:)when are you going?",
  "hMeanwhile in the shit suite: xavier decided to give us  &lt;#&gt;  seconds of warning that samantha was coming over and is playing jay's guitar to impress her or some shit. Also I don't think doug realizes I don't live here anymore",
  "hMy stomach has been thru so much trauma I swear I just can't eat. I better lose weight.",
  "hI am in office:)whats the matter..msg me now.i will call you at break:).",
  "hYeah there's barely enough room for the two of us, x has too many fucking shoes. Sorry man, see you later",
  "sToday's Offer! Claim ur £150 worth of discount vouchers! Text YES to 85023 now! SavaMob, member offers mobile! T Cs 08717898035. £3.00 Sub. 16 . Unsub reply X",
  "hU reach orchard already? U wan 2 go buy tickets first?",
  "hI am real, baby! I want to bring out your inner tigress...",
  "hNo da if you run that it activate the full version da.",
  "h\"AH POOR BABY!HOPE URFEELING BETTERSN LUV! PROBTHAT OVERDOSE OF WORK HEY GO CAREFUL SPK 2 U SN LOTS OF LOVEJEN XXX.\"",
  "hStop the story. I've told him i've returned it and he's saying i should not re order it.",
  "sTalk sexy!! Make new friends or fall in love in the worlds most discreet text dating service. Just text VIP to 83110 and see who you could meet.",
  "hGoing to take your babe out ?",
  "hHai ana tomarrow am coming on morning.  &lt;DECIMAL&gt;  ill be there in sathy then we ll go to RTO office. Reply me after came to home.",
  "hSpoons it is then okay?",
  "hDid he just say somebody is named tampa",
  "hIn work now. Going have in few min.",
  "hYour brother is a genius",
  "hSorry, I guess whenever I can get a hold of my connections, maybe an hour or two? I'll text you",
  "hDid u find out what time the bus is at coz i need to sort some stuff out.",
  "hDude ive been seeing a lotta corvettes lately",
  "sCongratulations ur awarded either a yrs supply of CDs from Virgin Records or a Mystery Gift GUARANTEED Call 09061104283 Ts&Cs www.smsco.net £1.50pm approx 3mins",
  "hSame here, but I consider walls and bunkers and shit important just because I never play on peaceful but I guess your place is high enough that it don't matter",
  "sPRIVATE! Your 2003 Account Statement for 07808 XXXXXX shows 800 un-redeemed S. I. M. points. Call 08719899217 Identifier Code: 41685 Expires 07/11/04",
  "sHello. We need some posh birds and chaps to user trial prods for champneys. Can i put you down? I need your address and dob asap. Ta r",
  "sWhat do U want for Xmas? How about 100 free text messages & a new video phone with half price line rental? Call free now on 0800 0721072 to find out more!",
  "hWell am officially in a philosophical hole, so if u wanna call am at home ready to be saved!",
  "hIts going good...no problem..but still need little experience to understand american customer voice...",
  "hI'll text you when I drop x off",
  "hUgh its been a long day. I'm exhausted. Just want to cuddle up and take a nap",
  "hTalk With Yourself Atleast Once In A Day...!!! Otherwise You Will Miss Your Best FRIEND In This WORLD...!!! -Shakespeare- SHESIL  &lt;#&gt;",
  "sShop till u Drop, IS IT YOU, either 10K, 5K, £500 Cash or £100 Travel voucher, Call now, 09064011000. NTT PO Box CR01327BT fixedline Cost 150ppm mobile vary",
  "hAre you in castor? You need to see something",
  "sSunshine Quiz Wkly Q! Win a top Sony DVD player if u know which country Liverpool played in mid week? Txt ansr to 82277. £1.50 SP:Tyrone",
  "sU have a secret admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09058094565",
  "sU have a Secret Admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09065171142-stopsms-08",
  "sReminder: You have not downloaded the content you have already paid for. Goto http://doit. mymoby. tv/ to collect your content.",
  "hsee, i knew giving you a break a few times woul lead to you always wanting to miss curfew. I was gonna gibe you 'til one, but a MIDNIGHT movie is not gonna get out til after 2. You need to come home. You need to getsleep and, if anything, you need to b studdying ear training.",
  "hI love to give massages. I use lots of baby oil... What is your fave position?",
  "hDude we should go sup again",
  "hYoyyooo u know how to change permissions for a drive in mac. My usb flash drive",
  "hGibbs unsold.mike hussey",
  "hI like to talk pa but am not able to. I dont know y.",
  "hY dun cut too short leh. U dun like ah? She failed. She's quite sad.",
  "hYou unbelievable faglord",
  "hWife.how she knew the time of murder exactly",
  "hWhy do you ask princess?",
  "hI am great princess! What are you thinking about me? :)",
  "hNutter. Cutter. Ctter. Cttergg. Cttargg. Ctargg. Ctagg. ie you",
  "hIt's ok i noe u're busy but i'm really too bored so i msg u. I oso dunno wat colour she choose 4 me one.",
  "hDoesn't g have class early tomorrow and thus shouldn't be trying to smoke at  &lt;#&gt;",
  "hSuperb Thought- \"Be grateful that u dont have everything u want. That means u still have an opportunity to be happier tomorrow than u are today.\":-)",
  "hHope you are having a good week. Just checking in",
  "hI'm used to it. I just hope my agents don't drop me since i've only booked a few things this year. This whole me in boston, them in nyc was an experiment.",
  "hThursday night? Yeah, sure thing, we'll work it out then",
  "sYour free ringtone is waiting to be collected. Simply text the password \"MIX\" to 85069 to verify. Get Usher and Britney. FML, PO Box 5249, MK17 92H. 450Ppw 16",
  "hProbably money worries. Things are coming due and i have several outstanding invoices for work i did two and three months ago.",
  "hHow is it possible to teach you. And where.",
  "hI wonder if your phone battery went dead ? I had to tell you, I love you babe",
  "hLovely smell on this bus and it ain't tobacco... ",
  "hWe're all getting worried over here, derek and taylor have already assumed the worst",
  "hHey what's up charles sorry about the late reply.",
  "sall the lastest from Stereophonics, Marley, Dizzee Racal, Libertines and The Strokes! Win Nookii games with Flirt!! Click TheMob WAP Bookmark or text WAP to 82468",
  "hI.ll give her once i have it. Plus she said grinule greet you whenever we speak",
  "hWHITE FUDGE OREOS ARE IN STORES",
  "sJanuary Male Sale! Hot Gay chat now cheaper, call 08709222922. National rate from 1.5p/min cheap to 7.8p/min peak! To stop texts call 08712460324 (10p/min)",
  "hMy love ! How come it took you so long to leave for Zaher's? I got your words on ym and was happy to see them but was sad you had left. I miss you",
  "hI am sorry it hurt you.",
  "hCan't. I feel nauseous. I'm so pissed. I didn't eat any sweets all week cause today I was planning to pig out. I was dieting all week. And now I'm not hungry :/",
  "hOk lor but not too early. Me still having project meeting now.",
  "hCall me da, i am waiting for your call.",
  "hI could ask carlos if we could get more if anybody else can chip in",
  "hWas actually about to send you a reminder today. Have a wonderful weekend",
  "hWhen people see my msgs, They think Iam addicted to msging... They are wrong, Bcoz They don\\'t know that Iam addicted to my sweet Friends..!! BSLVYL",
  "hHey you gave them your photo when you registered for driving ah? Tmr wanna meet at yck? ",
  "hDont talk to him ever ok its my word.",
  "hWhen u wana see it then",
  "hOn ma way to school. Can you pls send me ashley's number",
  "hIt shall be fine. I have avalarr now. Will hollalater",
  "hShe went to attend another two rounds today..but still did't reach home..",
  "hActually i deleted my old website..now i m blogging at magicalsongs.blogspot.com",
  "hK, wait chikku..il send aftr  &lt;#&gt; mins",
  "hBut I'm on a diet. And I ate 1 too many slices of pizza yesterday. Ugh I'm ALWAYS on a diet.",
  "hK:)i will give my kvb acc details:)",
  "hOh all have to come ah?",
  "smoney!!! you r a lucky winner ! 2 claim your prize text money 2 88600 over £1million to give away ! ppt150x3+normal text rate box403 w1t1jy",
  "hI'm really sorry i won't b able 2 do this friday.hope u can find an alternative.hope yr term's going ok:-)",
  "hCongratulations ore mo owo re wa. Enjoy it and i wish you many happy moments to and fro wherever you go",
  "hSo do you have samus shoulders yet",
  "hWhat time you think you'll have it? Need to know when I should be near campus",
  "sDear Matthew please call 09063440451 from a landline, your complimentary 4*Lux Tenerife holiday or £1000 CASH await collection. ppm150 SAE T&Cs Box334 SK38XH.",
  "hThen dun wear jeans lor...",
  "hSince when, which side, any fever, any vomitin.",
  "hK:)k.are you in college?",
  "sUrgent! call 09061749602 from Landline. Your complimentary 4* Tenerife Holiday or £10,000 cash await collection SAE T&Cs BOX 528 HP20 1YF 150ppm 18+",
  "hBetter. Made up for Friday and stuffed myself like a pig yesterday. Now I feel bleh. But at least its not writhing pain kind of bleh.",
  "hNo we sell it all so we'll have tons if coins. Then sell our coins to someone thru paypal. Voila! Money back in life pockets:)",
  "hTheyre doing it to lots of places. Only hospitals and medical places are safe.",
  "sHow about getting in touch with folks waiting for company? Just txt back your NAME and AGE to opt in! Enjoy the community (150p/SMS)",
  "hAnd also I've sorta blown him off a couple times recently so id rather not text him out of the blue looking for weed",
  "hI sent my scores to sophas and i had to do secondary application for a few schools. I think if you are thinking of applying, do a research on cost also. Contact joke ogunrinde, her school is one me the less expensive ones",
  "hI cant wait to see you! How were the photos were useful? :)",
  "sUr cash-balance is currently 500 pounds - to maximize ur cash-in now send GO to 86688 only 150p/msg. CC: 08718720201 PO BOX 114/14 TCR/W1",
  "hHey i booked the kb on sat already... what other lessons are we going for ah? Keep your sat night free we need to meet and confirm our lodging ",
  "hChk in ur belovd ms dict",
  "hIs that what time you want me to come?",
  "hAwesome, lemme know whenever you're around",
  "hShb b ok lor... Thanx...",
  "hBeautiful Truth against Gravity.. Read carefully: \"Our heart feels light when someone is in it.. But it feels very heavy when someone leaves it..\" GOOD NIGHT",
  "hAlso remember to get dobby's bowl from your car",
  "sFilthy stories and GIRLS waiting for your",
  "hSorry i now then c ur msg... Yar lor so poor thing... But only 4 one night... Tmr u'll have a brand new room 2 sleep in...",
  "hLove isn't a decision, it's a feeling. If we could decide who to love, then, life would be much simpler, but then less magical",
  "hWelp apparently he retired",
  "hMy sort code is  and acc no is . The bank is natwest. Can you reply to confirm i've sent this to the right person!",
  "hWhere @",
  "hU sure u can't take any sick time?",
  "sURGENT! We are trying to contact U. Todays draw shows that you have won a £800 prize GUARANTEED. Call 09050001808 from land line. Claim M95. Valid12hrs only",
  "hWatching cartoon, listening music &amp; at eve had to go temple &amp; church.. What about u?",
  "hYo chad which gymnastics class do you wanna take? The site says Christians class is full..",
  "hAre you this much buzy",
  "hOr better still can you catch her and let ask her if she can sell  &lt;#&gt;  for me.",
  "hI am not sure about night menu. . . I know only about noon menu",
  "hWhat do u want when i come back?.a beautiful necklace as a token of my heart for you.thats what i will give but ONLY to MY WIFE OF MY LIKING.BE THAT AND SEE..NO ONE can give you that.dont call me.i will wait till i come.",
  "hAre you willing to go for aptitude class.",
  "hIt wont b until 2.15 as trying 2 sort house out, is that ok?",
  "hYar lor he wan 2 go c horse racing today mah, so eat earlier lor. I ate chicken rice. U?",
  "hHaha awesome, omw back now then",
  "hYup i thk so until e shop closes lor.",
  "hwhat is your account number?",
  "hEh u send wrongly lar...",
  "hHey no I ad a crap nite was borin without ya 2 boggy with me u boring biatch! Thanx but u wait til nxt time il ave ya ",
  "hOk i shall talk to him",
  "hDont hesitate. You know this is the second time she has had weakness like that. So keep i notebook of what she eat and did the day before or if anything changed the day before so that we can be sure its nothing",
  "hHey you can pay. With salary de. Only  &lt;#&gt; .",
  "hAnother month. I need chocolate weed and alcohol.",
  "hIf he started searching he will get job in few days.he have great potential and talent.",
  "hReckon need to be in town by eightish to walk from * carpark.",
  "sCongrats! 2 mobile 3G Videophones R yours. call 09063458130 now! videochat wid your mates, play java games, Dload polyPH music, noline rentl.",
  "hLOOK AT THE FUCKIN TIME. WHAT THE FUCK YOU THINK IS UP",
  "hYo guess what I just dropped",
  "hCarlos says he'll be at mu in  &lt;#&gt;  minutes",
  "hI'm in office now . I will call you  &lt;#&gt;  min:)",
  "hGeeee ... I miss you already, you know ? Your all I can think about. Fuck, I can't wait till next year when we will be together ... *loving kiss*",
  "hYun ah.the ubi one say if ü wan call by tomorrow.call 67441233 look for irene.ere only got bus8,22,65,61,66,382. Ubi cres,ubi tech park.6ph for 1st 5wkg days.èn",
  "hUgh. Gotta drive back to sd from la. My butt is sore.",
  "h26th OF JULY",
  "hHi im having the most relaxing time ever! we have to get up at 7am every day! was the party good the other night? I get home tomorrow at 5ish.",
  "hUp to ü... Ü wan come then come lor... But i din c any stripes skirt...",
  "hThe Xmas story is peace.. The Xmas msg is love.. The Xmas miracle is jesus.. Hav a blessed month ahead &amp; wish U Merry Xmas...",
  "hI can't, I don't have her number!",
  "hChange again... It's e one next to escalator...",
  "hYetunde i'm in class can you not run water on it to make it ok. Pls now.",
  "hNot a lot has happened here. Feels very quiet. Beth is at her aunts and charlie is working lots. Just me and helen in at the mo. How have you been? ",
  "hThen ü wait 4 me at bus stop aft ur lect lar. If i dun c ü then i go get my car then come back n pick ü.",
  "hAight will do, thanks again for comin out",
  "hNo..but heard abt tat..",
  "sPlease call our customer service representative on FREEPHONE 0808 145 4742 between 9am-11pm as you have WON a guaranteed £1000 cash or £5000 prize!",
  "hYes..he is really great..bhaji told kallis best cricketer after sachin in world:).very tough to get out.",
  "h&lt;#&gt;  am I think? Should say on syllabus",
  "hUmma. Did she say anything",
  "hGive me a sec to think think about it",
  "sPanasonic & BluetoothHdset FREE. Nokia FREE. Motorola FREE & DoubleMins & DoubleTxt on Orange contract. Call MobileUpd8 on 08000839402 or call 2optout",
  "hI don't quite know what to do. I still can't get hold of anyone. I cud pick you up bout 7.30pm and we can see if they're in the pub?",
  "hPoyyarikatur,kolathupalayam,unjalur post,erode dis, &lt;#&gt; .",
  "hDear Hero,i am leaving to qatar tonite for an apt opportunity.pls do keep in touch at  &lt;EMAIL&gt; ,kerala",
  "hLol I would but my mom would have a fit and tell the whole family how crazy and terrible I am",
  "hI just got home babe, are you still awake ?",
  "hI dunno they close oredi not... Ü v ma fan...",
  "hJust buy a pizza. Meat lovers or supreme. U get to pick.",
  "hYa, told..she was asking wats matter?",
  "hDear,regret i cudnt pick call.drove down frm ctla now at cochin home.left mobile in car..ente style ishtamayoo?happy bakrid!",
  "sFREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 8007 Get txting and tell ur mates www.getzed.co.uk POBox 36504 W45WQ norm150p/tone 16+",
  "hShall i send that exe to your mail id.",
  "hNope watching tv at home... Not going out. V bored...",
  "hDon know..wait i will check it.",
  "hGood afternoon on this glorious anniversary day, my sweet J !! I hope this finds you happy and content, my Prey. I think of you and send a teasing kiss from across the sea coaxing images of fond souveniers ... You Cougar-Pen",
  "sGuess what! Somebody you know secretly fancies you! Wanna find out who it is? Give us a call on 09065394514 From Landline DATEBox1282EssexCM61XN 150p/min 18",
  "hWe still on for tonight?",
  "hMay i call You later Pls",
  "hHasn't that been the pattern recently crap weekends?",
  "hI have a sore throat. It's scratches when I talk",
  "hYes da. Any plm at ur office",
  "hAre you not around or just still asleep? :V",
  "hLol you forgot it eh ? Yes, I'll bring it in babe",
  "hIts good, we'll find a way",
  "hCan not use foreign stamps in this country. Good lecture .",
  "hYup bathe liao...",
  "hHAPPY NEW YEAR MY NO.1 MAN",
  "hOH MR SHEFFIELD! You wanna play THAT game, okay. You're the boss and I'm the nanny. You give me a raise and I'll give YOU one!!",
  "hZOE IT JUST HIT ME 2 IM FUCKING SHITIN MYSELF IL DEFO TRY MY HARDEST 2 CUM 2MOROW LUV U MILLIONS LEKDOG",
  "hHello baby, did you get back to your mom's ? Are you setting up the computer now ? Filling your belly ? How goes it loverboy ? I miss you already ... *sighs*",
  "hNo my blankets are sufficient, thx",
  "hnaughty little thought: 'its better to flirt, flirt n flirt, rather than loving someone n gettin hurt, hurt n hurt...:-) Gud nyt",
  "hEdison has rightly said, \"A fool can ask more questions than a wise man can answer\" Now you know why all of us are speechless during ViVa.. GM,GN,GE,GNT:-)",
  "hThey just talking thats it de. They wont any other.",
  "hToday am going to college so am not able to atten the class.",
  "hI'm in class. Will holla later",
  "hEasy ah?sen got selected means its good..",
  "hMmm thats better now i got a roast down me! i’d b better if i had a few drinks down me 2! Good indian?",
  "sWe know someone who you know that fancies you. Call 09058097218 to find out who. POBox 6, LS15HB 150p",
  "hCome round, it's . ",
  "hDo 1 thing! Change that sentence into: \"Because i want 2 concentrate in my educational career im leaving here..\"",
  "s1000's flirting NOW! Txt GIRL or BLOKE & ur NAME & AGE, eg GIRL ZOE 18 to 8007 to join and get chatting!",
  "hI walked an hour 2 c u! doesn’t that show I care y wont u believe im serious?",
  "s18 days to Euro2004 kickoff! U will be kept informed of all the latest news and results daily. Unsubscribe send GET EURO STOP to 83222.",
  "hAre you available for soiree on June 3rd?",
  "hDo u noe wat time e place dat sells 4d closes?",
  "hI got another job! The one at the hospital doing data analysis or something, starts on monday! Not sure when my thesis will got finished",
  "hJay's getting really impatient and belligerent",
  "hHIYA COMIN 2 BRISTOL 1 ST WEEK IN APRIL. LES GOT OFF + RUDI ON NEW YRS EVE BUT I WAS SNORING.THEY WERE DRUNK! U BAK AT COLLEGE YET? MY WORK SENDS INK 2 BATH.",
  "hI'm at work. Please call",
  "hThen u drive lor.",
  "hArd 515 like dat. Y?",
  "hTell me they're female :V how're you throwing in? We're deciding what all to get now",
  "sEASTENDERS TV Quiz. What FLOWER does DOT compare herself to? D= VIOLET E= TULIP F= LILY txt D E or F to 84025 NOW 4 chance 2 WIN £100 Cash WKENT/150P16+",
  "hI'm working technical support :)voice process.networking field.",
  "hI might come to kerala for 2 days.so you can be prepared to take a leave once i finalise .dont plan any travel during my visit.need to finish urgent works.",
  "hOk. Not sure what time tho as not sure if can get to library before class. Will try. See you at some point! Have good eve.",
  "sWe have new local dates in your area - Lots of new people registered in YOUR AREA. Reply DATE to start now! 18 only www.flirtparty.us REPLYS150",
  "hThat's fine, I'll bitch at you about it later then",
  "hNo my mum went 2 dentist.",
  "hOnce free call me sir. I am waiting for you.",
  "hMeeting u is my work. . . Tel me when shall i do my work tomorrow",
  "sSomeone U know has asked our dating service 2 contact you! Cant Guess who? CALL 09058091854 NOW all will be revealed. PO BOX385 M6 6WU",
  "hJus finish bathing...",
  "halright, I'll make sure the car is back tonight",
  "sURGENT! We are trying to contact U. Todays draw shows that you have won a £800 prize GUARANTEED. Call 09050003091 from land line. Claim C52. Valid12hrs only",
  "sDear U've been invited to XCHAT. This is our final attempt to contact u! Txt CHAT to 86688",
  "hLul im gettin some juicy gossip at the hospital. Two nurses are talking about how fat they are gettin. And one thinks shes obese. Oyea.",
  "hAight ill get on fb in a couple minutes",
  "hOi. Ami parchi na re. Kicchu kaaj korte iccha korche na. Phone ta tul na. Plz. Plz.",
  "hWhere can download clear movies. Dvd copies.",
  "hYep, by the pretty sculpture",
  "hConvey my regards to him",
  "hMe too watching surya movie only. . .after 6 pm vijay movie POKKIRI",
  "hYou tell what happen dont behave like this to me. Ok no need to say",
  "hCan u get pic msgs to your phone?",
  "hSend to someone else :-)",
  "hWat makes some people dearer is not just de happiness dat u feel when u meet them but de pain u feel when u miss dem!!!",
  "hFor me the love should start with attraction.i should feel that I need her every time around me.she should be the first thing which comes in my thoughts.I would start the day and end it with her.she should be there every time I dream.love will be then when my every breath has her name.my life should happen around her.my life will be named to her.I would cry for her.will give all my happiness and take all her sorrows.I will be ready to fight with anyone for her.I will be in love when I will be doing the craziest things for her.love will be when I don't have to proove anyone that my girl is the most beautiful lady on the whole planet.I will always be singing praises for her.love will be when I start up making chicken curry and end up makiing sambar.life will be the most beautiful then.will get every morning and thank god for the day because she is with me.I would like to say a lot..will tell later..",
  "hFR'NDSHIP is like a needle of a clock. Though V r in d same clock, V r nt able 2 met. Evn if V meet,itz only 4few seconds. Bt V alwys stay conected. Gud 9t;-)",
  "hI don't think he has spatula hands!",
  "hYou can never do NOTHING",
  "sYou are awarded a SiPix Digital Camera! call 09061221061 from landline. Delivery within 28days. T Cs Box177. M221BP. 2yr warranty. 150ppm. 16 . p p£3.99",
  "hGoodmorning today i am late for  &lt;DECIMAL&gt; min.",
  "sWIN URGENT! Your mobile number has been awarded with a £2000 prize GUARANTEED call 09061790121 from land line. claim 3030 valid 12hrs only 150ppm ",
  "hPlease da call me any mistake from my side sorry da. Pls da goto doctor.",
  "hWhere r we meeting?",
  "hWell the weather in cali's great. But its complexities are great. You need a car to move freely, its taxes are outrageous. But all in all its a great place. The sad part is i missing home.",
  "hNow only i reached home. . . I am very tired now. . I will come tomorro",
  "hRyder unsold.now gibbs.",
  "sDear Subscriber ur draw 4 £100 gift voucher will b entered on receipt of a correct ans. When was Elvis Presleys Birthday? TXT answer to 80062",
  "hDon't fret. I'll buy the ovulation test strips and send them to you. You wont get them til like march. Can you send me your postal address.u'll be alright.Okay.",
  "hNO GIFTS!! You trying to get me to throw myself off a cliff or something?",
  "hBeen up to ne thing interesting. Did you have a good birthday? When are u wrking nxt? I started uni today.",
  "hYou busy or can I come by at some point and figure out what we're doing tomorrow",
  "hYeah go on then, bored and depressed sittin waitin for phone to ring... Hope the wind drops though, scary",
  "hBlack shirt n blue jeans... I thk i c ü...",
  "hAiyah sorry lor... I watch tv watch until i forgot 2 check my phone.",
  "sMessage Important information for O2 user. Today is your lucky day! 2 find out why log onto http://www.urawinner.com there is a fantastic surprise awaiting you",
  "hon hen night. Going with a swing",
  "hGood afternoon, my love. How goes your day ? What are you up to ? I woke early and am online waiting for you ... Hmmm ... Italian boy is online I see . *grins*",
  "hFrom someone not to smoke when every time I've smoked in the last two weeks is because of you calling or texting me that you wanted to smoke",
  "hNo you'll just get a headache trying to figure it out. U can trust me to do the math. I promise. O:-)",
  "hS s..first time..dhoni rocks...",
  "hOk ill tell the company",
  "hAwesome, think we can get an 8th at usf some time tonight?",
  "hSo that means you still think of teju",
  "hNo I'm good for the movie, is it ok if I leave in an hourish?",
  "hNo no:)this is kallis home ground.amla home town is durban:)",
  "hSo lets make it saturday or monday as per convenience.",
  "hHey... What time is your driving on fri? We go for evaluation on fri?",
  "s449050000301 You have won a £2,000 price! To claim, call 09050000301.",
  "hI'm going 4 lunch now wif my family then aft dat i go str 2 orchard lor.",
  "sBored of speed dating? Try SPEEDCHAT, txt SPEEDCHAT to 80155, if you don't like em txt SWAP and get a new chatter! Chat80155 POBox36504W45WQ 150p/msg rcd 16",
  "hCancel cheyyamo?and get some money back?",
  "sDo you want 750 anytime any network mins 150 text and a NEW video phone for only five pounds per week call 08000776320 now or reply for delivery Tomorrow",
  "hOk.ok ok..then..whats ur todays plan",
  "hGood morning princess! How are you?",
  "hAiyar sorry lor forgot 2 tell u...",
  "sFor taking part in our mobile survey yesterday! You can now have 500 texts 2 use however you wish. 2 get txts just send TXT to 80160 T&C www.txt43.com 1.50p",
  "hNot tonight mate. Catching up on some sleep. This is my new number by the way. ",
  "hHeight of \"Oh shit....!!\" situation: A guy throws a luv letter on a gal but falls on her brothers head whos a gay,.;-):-D",
  "sUr HMV Quiz cash-balance is currently £500 - to maximize ur cash-in now send HMV1 to 86688 only 150p/msg",
  "hSo check your errors and if you had difficulties, do correction.",
  "hHowz pain?hope u r fine..",
  "hSorry, I'll call later",
  "hGood morning princess! How are you?",
  "hAs I entered my cabin my PA said, '' Happy B'day Boss !!''. I felt special. She askd me 4 lunch. After lunch she invited me to her apartment. We went there.",
  "hU wake up already? Thanx 4 e tau sar piah it's quite nice.",
  "hK do I need a login or anything",
  "sDont forget you can place as many FREE Requests with 1stchoice.co.uk as you wish. For more Information call 08707808226.",
  "hLOL ... No just was busy",
  "hWhat * u wearing?",
  "hMessage:some text missing* Sender:Name Missing* *Number Missing *Sent:Date missing *Missing U a lot thats y everything is missing sent via fullonsms.com",
  "hOh:)as usual vijay film or its different?",
  "sI don't know u and u don't know me. Send CHAT to 86688 now and let's find each other! Only 150p/Msg rcvd. HG/Suite342/2Lands/Row/W1J6HL LDN. 18 years or over.",
  "hHave you had a good day? Mine was really busy are you up to much tomorrow night?",
  "hAnd is there a way you can send shade's stuff to her. And she has been wonderful too.",
  "hReally... I tot ur paper ended long ago... But wat u copied jus now got use? U happy lar... I still haf 2 study :-(",
  "sThank you, winner notified by sms. Good Luck! No future marketing reply STOP to 84122 customer services 08450542832",
  "hBabe ? I lost you ... :-(",
  "hOk... Help me ask if she's working tmr a not?",
  "hI'm not driving... Raining! Then i'll get caught at e mrt station lor.",
  "hNot a drop in the tank",
  "h(That said can you text him one more time?)",
  "hSorry, I'll call later",
  "hOk i go change also...",
  "s1000's of girls many local 2 u who r virgins 2 this & r ready 2 4fil ur every sexual need. Can u 4fil theirs? text CUTE to 69911(£1.50p. m)",
  "hDid u find a sitter for kaitlyn? I was sick and slept all day yesterday.",
  "hSorry man, accidentally left my phone on silent last night and didn't check it til I got up",
  "hHey.. Something came up last min.. Think i wun be signing up tmr.. Hee",
  "hHe's an adult and would learn from the experience. There's no real danger. I just dont like peeps using drugs they dont need. But no comment",
  "hHey! There's veggie pizza... :/",
  "hYun buying... But school got offer 2000 plus only...",
  "hYou sure your neighbors didnt pick it up",
  "hK. I will sent it again",
  "sFree entry in 2 a wkly comp to win FA Cup final tkts 21st May 2005. Text FA to 87121 to receive entry question(std txt rate)T&C's apply 08452810075over18's",
  "hNew Theory: Argument wins d SITUATION, but loses the PERSON. So dont argue with ur friends just.. . . . kick them &amp; say, I'm always correct.!",
  "hWell. Im computerless. Time to make some oreo truffles",
  "hHaha yeah I see that now, be there in a sec",
  "hI am not having her number sir",
  "hLol now I'm after that hot air balloon!",
  "hOk . . now i am in bus. . If i come soon i will come otherwise tomorrow",
  "hMsgs r not time pass.They silently say that I am thinking of U right now and also making U think of me at least 4 a moment. Gd nt.swt drms @Shesil",
  "hYeah, we can probably swing by once my roommate finishes up with his girl",
  "sGot what it takes 2 take part in the WRC Rally in Oz? U can with Lucozade Energy! Text RALLY LE to 61200 (25p), see packs or lucozade.co.uk/wrc & itcould be u!",
  "hHappy new years melody!",
  "hÜ dun need to pick ur gf?",
  "hYay! You better not have told that to 5 other girls either.",
  "hHorrible u eat macs eat until u forgot abt me already rite... U take so long 2 reply. I thk it's more toot than b4 so b prepared. Now wat shall i eat?",
  "hDid he say how fantastic I am by any chance, or anything need a bigger life lift as losing the will 2 live, do you think I would be the first person 2 die from N V Q? ",
  "hJust nw i came to hme da..",
  "hI'm outside islands, head towards hard rock and you'll run into me",
  "hTo day class is there are no class.",
  "hI'm in chennai velachery:)",
  "hYou flippin your shit yet?",
  "hK give me a sec, breaking a  &lt;#&gt;  at cstore",
  "hAm i that much bad to avoid like this?",
  "hYo, you around? Just got my car back",
  "hAnnoying isn't it.",
  "hGoodmorning, Today i am late for  &lt;#&gt; min.",
  "hThere's no point hangin on to mr not right if he's not makin u happy",
  "hAll will come alive.better correct any good looking figure there itself..",
  "hIn that case I guess I'll see you at campus lodge",
  "hWe're done...",
  "hCome to my home for one last time i wont do anything. Trust me.",
  "hI was up all night too worrying about this appt. It's a shame we missed a girls night out with quizzes popcorn and you doing my hair.",
  "sSex up ur mobile with a FREE sexy pic of Jordan! Just text BABE to 88600. Then every wk get a sexy celeb! PocketBabe.co.uk 4 more pics. 16 £3/wk 087016248",
  "hOk... C ya...",
  "sYou have 1 new voicemail. Please call 08719181503",
  "hWhat he said is not the matter. My mind saying some other matter is there.",
  "hHe also knows about lunch menu only da. . I know",
  "hAl he does is moan at me if n e thin goes wrong its my fault&al de arguments r my fault&fed up of him of himso y bother? Hav 2go, thanx.xx",
  "hNEFT Transaction with reference number  &lt;#&gt;  for Rs. &lt;DECIMAL&gt;  has been credited to the beneficiary account on  &lt;#&gt;  at  &lt;TIME&gt; : &lt;#&gt;",
  "hOtherwise had part time job na-tuition..",
  "hI know she called me",
  "hMe also da, i feel yesterday night  wait til 2day night dear.",
  "hThanks for understanding. I've been trying to tell sura that.",
  "sWIN a year supply of CDs 4 a store of ur choice worth £500 & enter our £100 Weekly draw txt MUSIC to 87066 Ts&Cs www.Ldew.com.subs16+1win150ppmx3",
  "hThe whole car appreciated the last two! Dad and are having a map reading semi argument but apart from that things are going ok. P.",
  "sAs a SIM subscriber, you are selected to receive a Bonus! Get it delivered to your door, Txt the word OK to No: 88600 to claim. 150p/msg, EXP. 30Apr",
  "hI need you to be in my strong arms...",
  "hAlso maaaan are you missing out",
  "hHis bday real is in april .",
  "hGuessin you ain't gonna be here before 9?",
  "hOk then i will come to ur home after half an hour",
  "hYo, the game almost over? Want to go to walmart soon",
  "hYeah, probably but not sure. Ilol let u know, but personally I wuldnt bother, then again if ur goin to then I mite as well!!",
  "hI'll text now! All creepy like so he won't think that we forgot",
  "hthat would be good … I'll phone you tomo lunchtime, shall I, to organise something?",
  "sYou have 1 new voicemail. Please call 08719181513.",
  "hDamn, can you make it tonight or do you want to just wait til tomorrow",
  "hK..k..i'm also fine:)when will you complete the course?",
  "hTrue. It is passable. And if you get a high score and apply for phd, you get 5years of salary. So it makes life easier.",
  "sNo. 1 Nokia Tone 4 ur mob every week! Just txt NOK to 87021. 1st Tone FREE ! so get txtin now and tell ur friends. 150p/tone. 16 reply HL 4info",
  "hPrakesh is there know.",
  "hTeach me apps da. When you come to college.",
  "hRofl betta invest in some  anti aging products",
  "sYou are a winner U have been specially selected 2 receive £1000 cash or a 4* holiday (flights inc) speak to a live operator 2 claim 0871277810810",
  "hsir, you will receive the account no another 1hr time. Sorry for the delay.",
  "sReply with your name and address and YOU WILL RECEIVE BY POST a weeks completely free accommodation at various global locations www.phb1.com ph:08700435505150p",
  "hSo ü'll be submitting da project tmr rite?",
  "sFREE entry into our £250 weekly comp just send the word ENTER to 84128 NOW. 18 T&C www.textcomp.com cust care 08712405020.",
  "hJus ans me lar. U'll noe later.",
  "hI want to send something that can sell fast.  &lt;#&gt; k is not easy money.",
  "hhave got * few things to do. may be in * pub later.",
  "h1's finish meeting call me.",
  "hLol ok. I'll snatch her purse too.",
  "h\"Hello-/@drivby-:0quit edrunk sorry iff pthis makes no senrd-dnot no how ^ dancce 2 drum n basq!ihave fun 2nhite x ros xxxxxxx\"",
  "hYour opinion about me? 1. Over 2. Jada 3. Kusruthi 4. Lovable 5. Silent 6. Spl character 7. Not matured 8. Stylish 9. Simple Pls reply..",
  "hHow much are we getting?",
  "hIs ur paper in e morn or aft tmr?",
  "hDear relieved of westonzoyland, all going to plan this end too!",
  "hHope you are having a great new semester. Do wish you the very best. You are made for greatness.",
  "hOh yes I can speak txt 2 u no! Hmm. Did u get  email?",
  "hI want to show you the world, princess :) how about europe?",
  "hNobody can decide where to eat and dad wants Chinese",
  "hNo shoot me. I'm in the docs waiting room. :/",
  "hNow? I'm going out 4 dinner soon..",
  "hHello which the site to download songs its urgent pls",
  "hI do know what u mean,  is the king of not havin credit! I'm goin2bed now. Night night sweet! Only1more sleep! ",
  "hHorrible gal. Me in sch doing some stuff. How come u got mc?",
  "hHI HUN! IM NOT COMIN 2NITE-TELL EVERY1 IM SORRY 4 ME, HOPE U AVA GOODTIME!OLI RANG MELNITE IFINK IT MITE B SORTED,BUT IL EXPLAIN EVERYTHIN ON MON.L8RS.x",
  "hI call you later, don't have network. If urgnt, sms me.",
  "hUmmmmmaah Many many happy returns of d day my dear sweet heart.. HAPPY BIRTHDAY dear",
  "sPlease CALL 08712402779 immediately as there is an urgent message waiting for you",
  "hYeah like if it goes like it did with my friends imma flip my shit in like half an hour",
  "hMum say we wan to go then go... Then she can shun bian watch da glass exhibition... ",
  "hWhat your plan for pongal?",
  "hJust wait till end of march when el nino gets himself. Oh.",
  "hNot yet chikku..going to room nw, i'm in bus..",
  "hAm also doing in cbe only. But have to pay.",
  "hHoney boo I'm missing u.",
  "hWe have sent JD for Customer Service cum Accounts Executive to ur mail id, For details contact us",
  "hYo, I'm at my parents' gettin cash. Good news: we picked up a downstem",
  "hThank you so much. When we skyped wit kz and sura, we didnt get the pleasure of your company. Hope you are good. We've given you ultimatum oh! We are countin down to aburo. Enjoy!",
  "sHungry gay guys feeling hungry and up 4 it, now. Call 08718730555 just 10p/min. To stop texts call 08712460324 (10p/min)",
  "hOk. No wahala. Just remember that a friend in need ...",
  "hI will see in half an hour",
  "hIm in inperialmusic listening2the weirdest track ever by”leafcutter john”-sounds like insects being molested&someone plumbing,remixed by evil men on acid!",
  "h\"Hey sorry I didntgive ya a a bellearlier hunny,just been in bedbut mite go 2 thepub l8tr if uwana mt up?loads a luv Jenxxx.\"",
  "hSERIOUSLY. TELL HER THOSE EXACT WORDS RIGHT NOW.",
  "sCan U get 2 phone NOW? I wanna chat 2 set up meet Call me NOW on 09096102316 U can cum here 2moro Luv JANE xx Calls£1/minmoremobsEMSPOBox45PO139WA",
  "hTee hee. Off to lecture, cheery bye bye.",
  "hSorry chikku, my cell got some problem thts y i was nt able to reply u or msg u..",
  "hIf you still havent collected the dough pls let me know so i can go to the place i sent it to get the control number",
  "hOk...",
  "snetwork operator. The service is free. For T & C's visit 80488.biz",
  "hLet me know how to contact you. I've you settled in a room. Lets know you are ok.",
  "hWot u up 2 u weirdo?",
  "hCan do lor...",
  "hDont put your phone on silent mode ok",
  "hCan i meet ü at 5.. As 4 where depends on where ü wan 2 in lor..",
  "hWaiting 4 my tv show 2 start lor... U leh still busy doing ur report?",
  "hOh ho. Is this the first time u use these type of words",
  "hAm I the only one who doesn't stalk profiles?",
  "hEver green quote ever told by Jerry in cartoon \"A Person Who Irritates u Always Is the one Who Loves u Vry Much But Fails to Express It...!..!! :-) :-) gud nyt",
  "hYes i thought so. Thanks.",
  "hBut if she.s drinkin i'm ok.",
  "hJust wondering, the others just took off",
  "hNight has ended for another day, morning has come in a special way. May you smile like the sunny rays and leaves your worries at the blue blue bay. Gud mrng",
  "hWhat do you do, my dog ? Must I always wait till the end of your day to have word from you ? Did you run out of time on your cell already?",
  "hHappy new year to u too!",
  "hHey...Great deal...Farm tour 9am to 5pm $95/pax, $50 deposit by 16 May",
  "hEat jap done oso aft ur lect wat... Ü got lect at 12 rite... ",
  "hHey babe! I saw you came online for a second and then you disappeared, what happened ?",
  "hDa my birthdate in certificate is in april but real date is today. But dont publish it. I shall give you a special treat if you keep the secret. Any way thanks for the wishes",
  "hHappy birthday... May all ur dreams come true...",
  "hAiyah u did ok already lar. E nydc at wheellock?",
  "hTELL HER I SAID EAT SHIT.",
  "hSure! I am driving but will reach my destination soon.",
  "hK so am I, how much for an 8th? Fifty?",
  "hYour daily text from me - a favour this time",
  "hGreat to hear you are settling well. So what's happenin wit ola?",
  "hThose cocksuckers. If it makes you feel better ipads are worthless garbage novelty items and you should feel bad for even wanting one",
  "hI tot u reach liao. He said t-shirt.",
  "hFRAN I DECIDED 2 GO N E WAY IM COMPLETELY BROKE AN KNACKERED I GOT UP BOUT 3 C U 2MRW LOVE JANX P.S THIS IS MY DADS FONE, -NO CREDIT",
  "hI cant pick the phone right now. Pls send a message",
  "hYour right! I'll make the appointment right now.",
  "hDesignation is software developer and may be she get chennai:)",
  "sEnjoy the jamster videosound gold club with your credits for 2 new videosounds+2 logos+musicnews! get more fun from jamster.co.uk! 16+only Help? call: 09701213186 ",
  "sGet 3 Lions England tone, reply lionm 4 mono or lionp 4 poly. 4 more go 2 www.ringtones.co.uk, the original n best. Tones 3GBP network operator rates apply",
  "hI jokin oni lar.. Ü busy then i wun disturb ü.",
  "hOk, be careful ! Don't text and drive !",
  "hI.ll always be there, even if its just in spirit. I.ll get a bb soon. Just trying to be sure i need it.",
  "hU r too much close to my heart. If u go away i will be shattered. Plz stay with me.",
  "hI love u 2 babe! R u sure everything is alrite. Is he being an idiot? Txt bak girlie",
  "hHow abt making some of the pics bigger?",
  "hGot but got 2 colours lor. One colour is quite light n e other is darker lor. Actually i'm done she's styling my hair now.",
  "hWhenevr ur sad, Whenevr ur gray, Remembr im here 2 listn 2 watevr u wanna say, Jus walk wid me a little while,&amp; I promise I'll bring back ur smile.:-)",
  "hWhy nothing. Ok anyway give me treat",
  "sWin the newest “Harry Potter and the Order of the Phoenix (Book 5) reply HARRY, answer 5 questions - chance to be the first among readers!",
  "hOk...",
  "hCorrect. So how was work today",
  "hJust sent again. Do you scream and moan in bed, princess?",
  "hI wake up long ago already... Dunno, what other thing?",
  "hOh just getting even with u.... u?",
  "hI thk 50 shd be ok he said plus minus 10.. Did ü leave a line in between paragraphs?",
  "hCan you call me plz. Your number shows out of coveragd area. I have urgnt call in vasai &amp; have to reach before 4'o clock so call me plz",
  "hYeah jay's sort of a fucking retard",
  "hSorry, was in the bathroom, sup",
  "sUr balance is now £500. Ur next question is: Who sang 'Uptown Girl' in the 80's ? 2 answer txt ur ANSWER to 83600. Good luck!",
  "hMy exam is for february 4. Wish you a great day.",
  "hI dont know what to do to come out of this so only am ask questions like this dont mistake me.",
  "hAight no rush, I'll ask jay",
  "hGood Morning plz call me sir",
  "hIt's ok lar. U sleep early too... Nite...",
  "hOh... Icic... K lor, den meet other day...",
  "hOh ! A half hour is much longer in Syria than Canada, eh ? Wow you must get SO much more work done in a day than us with all that extra time ! *grins*",
  "hSometimes we put walls around our hearts,not just to be safe from getting hurt.. But to find out who cares enough to break the walls &amp; get closer.. GOODNOON:)",
  "hSweet, we may or may not go to 4U to meet carlos so gauge patty's interest in that",
  "hThen she buying today? Ü no need to c meh...",
  "hAight sorry I take ten years to shower. What's the plan?",
  "hEvery monday..nxt week vl be completing..",
  "hMight ax well im there.",
  "hJust chill for another 6hrs. If you could sleep the pain is not a surgical emergency so see how it unfolds. Okay",
  "hYeah I'll try to scrounge something up",
  "hCrazy ar he's married. Ü like gd looking guys not me. My frens like say he's korean leona's fave but i dun thk he is. Aft some thinking mayb most prob i'll go.",
  "hWere somewhere on Fredericksburg",
  "hQue pases un buen tiempo or something like that",
  "hIs it ok if I stay the night here? Xavier has a sleeping bag and I'm getting tired",
  "hShe doesnt need any test.",
  "hNothing much, chillin at home. Any super bowl plan?",
  "sFREE2DAY sexy St George's Day pic of Jordan!Txt PIC to 89080 dont miss out, then every wk a saucy celeb!4 more pics c PocketBabe.co.uk 0870241182716 £3/wk",
  "hBugis oso near wat... ",
  "hYo theres no class tmrw right?",
  "hLet Ur Heart Be Ur Compass Ur Mind Ur Map Ur Soul Ur Guide And U Will Never loose in world....gnun - Sent via WAY2SMS.COM",
  "hGoodnight, sleep well da please take care pa. Please.",
  "hBaaaaabe! I misss youuuuu ! Where are you ? I have to go and teach my class at 5 ...",
  "hConvey my regards to him",
  "hU ned to convince him tht its not possible witot hurting his feeling its the main",
  "hGood afternoon loverboy ! How goes you day ? Any luck come your way? I think of you, sweetie and send my love across the sea to make you smile and happy",
  "hIf i start sending blackberry torch to nigeria will you find buyer for me?like 4a month. And tell dad not to buy bb from anyone oh.",
  "h&lt;#&gt; %of pple marry with their lovers... becz they hav gud undrstndng dat avoids problems. i sent dis 2 u, u wil get gud news on friday by d person you like. And tomorrow will be the best day of your life. Dont break this chain. If you break you will suffer. send this to  &lt;#&gt;  frnds in &lt;#&gt;  mins whn u read...",
  "hYo dude guess who just got arrested the other day",
  "hShuhui say change 2 suntec steamboat? U noe where? Where r u now?",
  "hWhat does the dance river do?",
  "hYetunde, i'm sorry but moji and i seem too busy to be able to go shopping. Can you just please find some other way to get what you wanted us to get. Please forgive me. You can reply free via yahoo messenger.",
  "hHey i will be really pretty late... You want to go for the lesson first? I will join you. I'm only reaching tp mrt",
  "sHOT LIVE FANTASIES call now 08707509020 Just 20p per min NTT Ltd, PO Box 1327 Croydon CR9 5WB 0870..k",
  "hBbq this sat at mine from 6ish. Ur welcome 2 come",
  "hI don't know, same thing that's wrong everyso often, he panicks starts goin on bout not bein good enough …",
  "hAlright. I'm out--have a good night!",
  "hDid you try making another butt.",
  "hHope you are feeling great. Pls fill me in. Abiola",
  "hI though we shd go out n have some fun so bar in town or something - sound ok?",
  "h1) Go to write msg 2) Put on Dictionary mode 3)Cover the screen with hand, 4)Press  &lt;#&gt; . 5)Gently remove Ur hand.. Its interesting..:)",
  "sBears Pic Nick, and Tom, Pete and ... Dick. In fact, all types try gay chat with photo upload call 08718730666 (10p/min). 2 stop texts call 08712460324",
  "s500 New Mobiles from 2004, MUST GO! Txt: NOKIA to No: 89545 & collect yours today!From ONLY £1 www.4-tc.biz 2optout 087187262701.50gbp/mtmsg18 TXTAUCTION",
  "hWe're finally ready fyi",
  "hAuntie huai juan never pick up her phone",
  "sDouble Mins & Double Txt & 1/2 price Linerental on Latest Orange Bluetooth mobiles. Call MobileUpd8 for the very latest offers. 08000839402 or call2optout/LF56",
  "hYa tel, wats ur problem..",
  "sNo. 1 Nokia Tone 4 ur mob every week! Just txt NOK to 87021. 1st Tone FREE ! so get txtin now and tell ur friends. 150p/tone. 16 reply HL 4info",
  "hi dnt wnt to tlk wid u",
  "hWe spend our days waiting for the ideal path to appear in front of us.. But what we forget is.. \"paths are made by walking.. not by waiting..\" Goodnight!",
  "hIts ok my arm is feeling weak cuz i got a shot so we can go another time",
  "hPlease reserve ticket on saturday eve from chennai to thirunelvali and again from tirunelvali to chennai on sunday eve...i already see in net..no ticket available..i want to book ticket through tackle ..",
  "hStorming msg: Wen u lift d phne, u say \"HELLO\" Do u knw wt is d real meaning of HELLO?? . . . It's d name of a girl..! . . . Yes.. And u knw who is dat girl?? \"Margaret Hello\" She is d girlfrnd f Grahmbell who invnted telphone... . . . . Moral:One can 4get d name of a person, bt not his girlfrnd... G o o d n i g h t . . .@",
  "hThat's ok. I popped in to ask bout something and she said you'd been in. Are you around tonght wen this girl comes?",
  "hAll e best 4 ur exam later.",
  "hHope ur head doesn't hurt 2 much ! Am ploughing my way through a pile of ironing ! Staying in with a chinky tonight come round if you like.",
  "hOh k.i think most of wi and nz players unsold.",
  "hHaha... Where got so fast lose weight, thk muz go 4 a month den got effect... Gee,later we go aust put bk e weight.",
  "hI wonder how you got online, my love ? Had you gone to the net cafe ? Did you get your phone recharged ? Were you on a friends net ? I think of you, boytoy",
  "hHaha just kidding, papa needs drugs",
  "hThk shld b can... Ya, i wana go 4 lessons... Haha, can go for one whole stretch...",
  "hOh ok..",
  "hR we still meeting 4 dinner tonight?",
  "hThats cool! I am a gentleman and will treat you with dignity and respect.",
  "hShall i start from hear.",
  "hThen we wait 4 u lor... No need 2 feel bad lar...",
  "hNo did you check? I got his detailed message now",
  "hYou have registered Sinco as Payee. Log in at icicibank.com and enter URN  &lt;#&gt;  to confirm. Beware of frauds. Do NOT share or disclose URN to anyone.",
  "hNo, I decided that only people who care about stuff vote and caring about stuff is for losers",
  "hKaiez... Enjoy ur tuition... Gee... Thk e second option sounds beta... I'll go yan jiu den msg u...",
  "hYou have registered Sinco as Payee. Log in at icicibank.com and enter URN  &lt;#&gt;  to confirm. Beware of frauds. Do NOT share or disclose URN to anyone.",
  "hcool. We will have fun practicing making babies!",
  "hActually getting ready to leave the house.",
  "hK..k..any special today?",
  "sURGENT, IMPORTANT INFORMATION FOR O2 USER. TODAY IS YOUR LUCKY DAY! 2 FIND OUT WHY LOG ONTO HTTP://WWW.URAWINNER.COM THERE IS A FANTASTIC SURPRISE AWAITING FOR YOU",
  "hThen we gotta do it after that",
  "hI've got ten bucks, jay is being noncomittal",
  "hWhere at were hungry too",
  "hPls speak to that customer machan.",
  "hsomewhere out there beneath the pale moon light someone think in of u some where out there where dreams come true... goodnite &amp; sweet dreams",
  "hWen ur lovable bcums angry wid u, dnt take it seriously.. Coz being angry is d most childish n true way of showing deep affection, care n luv!.. kettoda manda... Have nice day da.",
  "sDear U've been invited to XCHAT. This is our final attempt to contact u! Txt CHAT to 86688 150p/MsgrcvdHG/Suite342/2Lands/Row/W1J6HL LDN 18 yrs",
  "hSo wats ur opinion abt him and how abt is character?",
  "hJay is snickering and tells me that x is totally fucking up the chords as we speak",
  "hNo..few hours before.went to hair cut .",
  "hNo wonder... Cos i dun rem seeing a silver car... But i thk i saw a black one...",
  "hLmao. Take a pic and send it to me.",
  "h\"Speak only when you feel your words are better than the silence...\" Gud mrng:-)",
  "hNo. She's currently in scotland for that.",
  "hDo you work all this week ?",
  "sCongratulations ur awarded either £500 of CD gift vouchers & Free entry 2 our £100 weekly draw txt MUSIC to 87066 TnCs www.Ldew.com 1 win150ppmx3age16",
  "hLol great now im getting hungry.",
  "hYes.. now only saw your message..",
  "hI'll be at mu in like  &lt;#&gt;  seconds",
  "hOk...",
  "hTHING R GOOD THANX GOT EXAMS IN MARCH IVE DONE NO REVISION? IS FRAN STILL WITH BOYF? IVE GOTTA INTERVIW 4 EXETER BIT WORRIED!x",
  "hTell you what, if you make a little spreadsheet and track whose idea it was to smoke to determine who \"smokes too much\" for the entire month of february, I'll come up",
  "sFor sale - arsenal dartboard. Good condition but no doubles or trebles!",
  "hDon't look back at the building because you have no coat and i don't want you to get more sick. Just hurry home and wear a coat to the gym!!!",
  "hMy painful personal thought- \"I always try to keep everybody happy all the time. But nobody recognises me when i am alone\"",
  "hThanks for ve lovely wisheds. You rock",
  "hYou intrepid duo you! Have a great time and see you both soon. ",
  "hI asked sen to come chennai and search for job.",
  "hDad went out oredi... ",
  "hI jus hope its true that  missin me cos i'm really missin him! You haven't done anything to feel guilty about, yet.",
  "hWat so late still early mah. Or we juz go 4 dinner lor. Aiya i dunno...",
  "hArms fine, how's Cardiff and uni? ",
  "hIn fact when do you leave? I think addie goes back to school tues or wed",
  "hCool breeze... Bright sun... Fresh flower... Twittering birds... All these waiting to wish u: \"GOODMORNING &amp; HAVE A NICE DAY\" :)",
  "hYa:)going for restaurant..",
  "hIts ok., i just askd did u knw tht no?",
  "sFree 1st week entry 2 TEXTPOD 4 a chance 2 win 40GB iPod or £250 cash every wk. Txt POD to 84128 Ts&Cs www.textpod.net custcare 08712405020.",
  "hThose ducking chinchillas",
  "hI am in a marriage function",
  "hLooks like u wil b getting a headstart im leaving here bout 2.30ish but if u r desperate for my company I could head in earlier-we were goin to meet in rummer.",
  "hDon‘t give a flying monkeys wot they think and I certainly don‘t mind. Any friend of mine and all that!",
  "sAs a registered optin subscriber ur draw 4 £100 gift voucher will be entered on receipt of a correct ans to 80062 Whats No1 in the BBC charts",
  "hsay thanks2. ",
  "hMsg me when rajini comes.",
  "hYa! when are ü taking ure practical lessons? I start in june..  ",
  "hThat's good, because I need drugs",
  "hStupid.its not possible",
  "hCan ü all decide faster cos my sis going home liao..",
  "sSummers finally here! Fancy a chat or flirt with sexy singles in yr area? To get MATCHED up just reply SUMMER now. Free 2 Join. OptOut txt STOP Help08714742804",
  "hU sleeping now.. Or you going to take? Haha.. I got spys wat.. Me online checking n replying mails lor..",
  "sCLAIRE here am havin borin time & am now alone U wanna cum over 2nite? Chat now 09099725823 hope 2 C U Luv CLAIRE xx Calls£1/minmoremobsEMSPOBox45PO139WA",
  "hFighting with the world is easy, u either win or lose bt fightng with some1 who is close to u is dificult if u lose - u lose if u win - u still lose.",
  "sBought one ringtone and now getting texts costing 3 pound offering more tones etc",
  "hYalru lyfu astne chikku.. Bt innu mundhe lyf ali halla ke bilo (marriage)program edhae, so lyf is nt yet ovr chikku..ali vargu lyfu meow meow:-D",
  "hKinda. First one gets in at twelve! Aah. Speak tomo",
  "s09066362231 URGENT! Your mobile No 07xxxxxxxxx won a £2,000 bonus caller prize on 02/06/03! this is the 2nd attempt to reach YOU! call 09066362231 ASAP!",
  "hOk good then i later come find ü... C lucky i told ü to go earlier... Later pple take finish ü no more again...",
  "hWat makes u thk i'll fall down. But actually i thk i'm quite prone 2 falls. Lucky my dad at home i ask him come n fetch me already.",
  "sYOU 07801543489 are guaranteed the latests Nokia Phone, a 40GB iPod MP3 player or a £500 prize! Txt word:COLLECT to No:83355! TC-LLC NY-USA 150p/Mt msgrcvd18+",
  "hYour account has been refilled successfully by INR  &lt;DECIMAL&gt; . Your KeralaCircle prepaid account balance is Rs  &lt;DECIMAL&gt; . Your Transaction ID is KR &lt;#&gt; .",
  "hI wont touch you with out your permission.",
  "sHi its LUCY Hubby at meetins all day Fri & I will B alone at hotel U fancy cumin over? Pls leave msg 2day 09099726395 Lucy x Calls£1/minMobsmoreLKPOBOX177HP51FL",
  "h7 wonders in My WORLD 7th You 6th Ur style 5th Ur smile 4th Ur Personality 3rd Ur Nature 2nd Ur SMS and 1st \"Ur Lovely Friendship\"... good morning dear",
  "hTake some small dose tablet for fever",
  "hOh. U must have taken your REAL Valentine out shopping first.",
  "hJust sent you an email - to an address with incomm in it, is that right?",
  "hWill do, you gonna be at blake's all night? I might be able to get out of here a little early",
  "hFriendship is not a game to play, It is not a word to say, It doesn\\'t start on March and ends on May, It is tomorrow, yesterday, today and e",
  "hNice. Wait...should you be texting right now? I'm not gonna pay your ticket, ya know!",
  "hI'm watching lotr w my sis dis aft. So u wan 2 meet me 4 dinner at nite a not?",
  "hWhy you keeping me away like this",
  "hI think its far more than that but find out. Check google maps for a place from your dorm.",
  "hMy trip was ok but quite tiring lor. Uni starts today but it's ok 4 me cos i'm not taking any modules but jus concentrating on my final yr project.",
  "hHave you always been saying welp?",
  "hI'm a guy, browsin is compulsory",
  "hOk...",
  "hPurity of friendship between two is not about smiling after reading the forwarded message..Its about smiling just by seeing the name. Gud evng musthu",
  "hSorry, I'll call later",
  "h(I should add that I don't really care and if you can't I can at least get this dude to fuck off but hey, your money if you want it)",
  "hHello lover! How goes that new job? Are you there now? Are you happy? Do you think of me? I wake, my slave and send you a teasing kiss from across the sea",
  "hI told your number to gautham..",
  "hTell them no need to investigate about me anywhere.",
  "hOk i juz receive..",
  "hCant believe i said so many things to you this morning when all i really wanted to say was good morning, i love you! Have a beautiful morning. See you in the library later.",
  "sYour account has been credited with 500 FREE Text Messages. To activate, just txt the word: CREDIT to No: 80488 T&Cs www.80488.biz",
  "hIn the end she might still vomit but its okay. Not everything will come out.",
  "hHow are you with moneY...as in to you...money aint a thing....how are you sha!",
  "hIt has everything to do with the weather. Keep extra warm. Its a cold but nothing serious. Pls lots of vitamin c",
  "hHey gals.. Anyone of u going down to e driving centre tmr?",
  "hI'm always on yahoo messenger now. Just send the message to me and i.ll get it you may have to send it in the mobile mode sha but i.ll get it. And will reply.",
  "hI'm putting it on now. It should be ready for  &lt;TIME&gt; ",
  "hTime n Smile r the two crucial things in our life. Sometimes time makes us to forget smile, and sometimes someone's smile makes us to forget time gud noon",
  "sSMS. ac JSco: Energy is high, but u may not know where 2channel it. 2day ur leadership skills r strong. Psychic? Reply ANS w/question. End? Reply END JSCO",
  "hHost-based IDPS for linux systems.",
  "sHOT LIVE FANTASIES call now 08707509020 Just 20p per min NTT Ltd, PO Box 1327 Croydon CR9 5WB 0870 is a national rate call",
  "hDon no da:)whats you plan?",
  "hIll be there on  &lt;#&gt;  ok.",
  "hOh my God. I'm almost home",
  "hTotal video converter free download type this in google search:)",
  "sThanks for the Vote. Now sing along with the stars with Karaoke on your mobile. For a FREE link just reply with SING now.",
  "hWen ur lovable bcums angry wid u, dnt take it seriously.. Coz being angry is d most childish n true way of showing deep affection, care n luv!.. kettoda manda... Have nice day da.",
  "hSounds like something that someone testing me would sayy",
  "hWhen u love someone Dont make them to love u as much as u do. But Love them so much that they dont want to be loved by anyone except you... Gud nit.",
  "hPete,is this your phone still? Its Jenny from college and Leanne.what are you up to now?:)",
  "hOops sorry. Just to check that you don't mind picking me up tomo at half eight from station. Would that be ok?",
  "hHey sweet, I was wondering when you had a moment if you might come to me ? I want to send a file to someone but it won't go over yahoo for them because their connection sucks, remember when you set up that page for me to go to and download the format disc ? Could you tell me how to do that ? Or do you know some other way to download big files ? Because they can download stuff directly from the internet. Any help would be great, my prey ... *teasing kiss*",
  "hHows the champ just leaving glasgow!",
  "hK:)all the best:)congrats...",
  "hI wonder if you'll get this text?",
  "hI need to come home and give you some good lovin...",
  "sOur brand new mobile music service is now live. The free music player will arrive shortly. Just install on your phone to browse content from the top artists.",
  "hShall i ask one thing if you dont mistake me.",
  "hCheck wid corect speling i.e. Sarcasm",
  "sURGENT! Your Mobile No was awarded a £2,000 Bonus Caller Prize on 1/08/03! This is our 2nd attempt to contact YOU! Call 0871-4719-523 BOX95QU BT National Rate",
  "hAre you angry with me. What happen dear",
  "hI thk u dun haf 2 hint in e forum already lor... Cos i told ron n darren is going 2 tell shuhui.",
  "hYup ok thanx...",
  "hHi:)cts employee how are you?",
  "hPls pls find out from aunt nike.",
  "hWow ... I love you sooo much, you know ? I can barely stand it ! I wonder how your day goes and if you are well, my love ... I think of you and miss you",
  "hNo screaming means shouting..",
  "hHey what happen de. Are you alright.",
  "hShould I have picked up a receipt or something earlier",
  "hI think chennai well settled?",
  "hOh dang! I didn't mean o send that to you! Lol!",
  "hUnfortunately i've just found out that we have to pick my sister up from the airport that evening so don't think i'll be going out at all. We should try to go out one of th",
  "hHorrible bf... I now v hungry...",
  "hRemember on that day..",
  "sYou have won a Nokia 7250i. This is what you get when you win our FREE auction. To take part send Nokia to 86021 now. HG/Suite342/2Lands Row/W1JHL 16+",
  "hHow's it feel? Mr. Your not my real Valentine just my yo Valentine even tho u hardly play!!",
  "hAll sounds good. Fingers . Makes it difficult to type",
  "hMidnight at the earliest",
  "hYou're not sure that I'm not trying to make xavier smoke because I don't want to smoke after being told I smoke too much?",
  "hK come to nordstrom when you're done",
  "hDo u konw waht is rael FRIENDSHIP Im gving yuo an exmpel: Jsut ese tihs msg.. Evrey splleing of tihs msg is wrnog.. Bt sitll yuo can raed it wihtuot ayn mitsake.. GOODNIGHT &amp; HAVE A NICE SLEEP..SWEET DREAMS..",
  "hNow press conference da:)",
  "sHello from Orange. For 1 month's free access to games, news and sport, plus 10 free texts and 20 photo messages, reply YES. Terms apply: www.orange.co.uk/ow",
  "hAfter completed degree. There is no use in joining finance.",
  "hGood afternoon, my love ! Any job prospects ? Are you missing me ? What do you do ? Are you being lazy and bleak, hmmm ? Or happy and filled with my love ?",
  "hShant disturb u anymore... Jia you...",
  "hBishan lar nearer... No need buy so early cos if buy now i gotta park my car...",
  "hMe, i dont know again oh",
  "hDude sux for snake. He got old and raiden got buff",
  "hHe says hi and to get your ass back to south tampa (preferably at a kegger)",
  "hIn e msg jus now. U said thanks for gift.",
  "hU too...",
  "hOk how you dear. Did you call chechi",
  "hYeah we do totes. When u wanna?",
  "hOk i found dis pierre cardin one which looks normal costs 20 its on sale.",
  "hGood sleep is about rhythm. The person has to establish a rhythm that the body will learn and use. If you want to know more :-)",
  "hWat r u doing?",
  "hMessage from . I am at Truro Hospital on ext. You can phone me here. as I have a phone by my side",
  "hSingle line with a big meaning::::: \"Miss anything 4 ur \"Best Life\" but, don't miss ur best life for anything... Gud nyt...",
  "hJust got some gas money, any chance you and the gang want to go on a grand nature adventure?",
  "hDnt worry...use ice pieces in a cloth pack.also take 2 tablets.",
  "hDude just saw a parked car with its sunroof popped up. Sux",
  "hGet ready to put on your excellent sub face :)",
  "hTmrw. Im finishing 9 doors",
  "hThe  &lt;#&gt; g that i saw a few days ago, the guy wants sell wifi only for  &lt;#&gt;  and with 3g for  &lt;#&gt; . That's why i blanked him.",
  "hI am late. I will be there at",
  "hwhatever, im pretty pissed off.",
  "hToday is ACCEPT DAY..U Accept me as? Brother Sister Lover Dear1 Best1 Clos1 Lvblefrnd Jstfrnd Cutefrnd Lifpartnr Belovd Swtheart Bstfrnd No rply means enemy",
  "hI dont have that much image in class.",
  "hNo:-)i got rumour that you going to buy apartment in chennai:-)",
  "hNear kalainar tv office.thenampet",
  "sUr cash-balance is currently 500 pounds - to maximize ur cash-in now send GO to 86688 only 150p/msg. CC 08718720201 HG/Suite342/2Lands Row/W1J6HL",
  "sSMS AUCTION - A BRAND NEW Nokia 7250 is up 4 auction today! Auction is FREE 2 join & take part! Txt NOKIA to 86021 now! HG/Suite342/2Lands Row/W1J6HL",
  "hMy sis is catching e show in e afternoon so i'm not watching w her. So c u wan 2 watch today or tmr lor.",
  "hSounds gd... Haha... Can... Wah, u yan jiu so fast liao...",
  "hNo. To be nosy I guess. Idk am I over reacting if I'm freaked?",
  "hRemember all those whom i hurt during days of satanic imposter in me.need to pay a price,so be it.may destiny keep me going and as u said pray that i get the mind to get over the same.",
  "hHow to Make a girl Happy? It's not at all difficult to make girls happy. U only need to be... 1. A friend 2. Companion 3. Lover 4. Chef . . .  &lt;#&gt; . Good listener  &lt;#&gt; . Organizer  &lt;#&gt; . Good boyfriend  &lt;#&gt; . Very clean  &lt;#&gt; . Sympathetic  &lt;#&gt; . Athletic  &lt;#&gt; . Warm . . .  &lt;#&gt; . Courageous  &lt;#&gt; . Determined  &lt;#&gt; . True  &lt;#&gt; . Dependable  &lt;#&gt; . Intelligent . . .  &lt;#&gt; . Psychologist  &lt;#&gt; . Pest exterminator  &lt;#&gt; . Psychiatrist  &lt;#&gt; . Healer . .  &lt;#&gt; . Stylist  &lt;#&gt; . Driver . . Aaniye pudunga venaam..",
  "hWhy is that, princess? I bet the brothas are all chasing you!",
  "hI shall book chez jules for half eight, if that's ok with you?",
  "hHhahhaahahah rofl wtf nig was leonardo in your room or something",
  "hYep, at derek's house now, see you Sunday &lt;3",
  "hIt's cool, let me know before it kicks off around  &lt;#&gt; , I'll be out and about all day",
  "hSorry, I'll call later",
  "hI was wondering if it would be okay for you to call uncle john and let him know that things are not the same in nigeria as they r here. That  &lt;#&gt;  dollars is 2years sent and that you know its a strain but i plan to pay back every dime he gives. Every dime so for me to expect anything from you is not practical. Something like that.",
  "hThere are no other charges after transfer charges and you can withdraw anyhow you like",
  "hDont search love, let love find U. Thats why its called falling in love, bcoz U dont force yourself, U just fall and U know there is smeone to hold U... BSLVYL",
  "hAt 4. Let's go to bill millers",
  "hI love you. You set my soul on fire. It is not just a spark. But it is a flame. A big rawring flame. XoXo",
  "hSomewhr someone is surely made 4 u. And God has decided a perfect time to make u meet dat person. . . . till den, . . . . . Enjoy ur crushes..!!!;-)",
  "hThat's my honeymoon outfit. :)",
  "hWill it help if we propose going back again tomorrow",
  "sPRIVATE! Your 2003 Account Statement for shows 800 un-redeemed S. I. M. points. Call 08719899230 Identifier Code: 41685 Expires 07/11/04",
  "hNever blame a day in ur life. Good days give u happiness. Bad days give u experience. Both are essential in life! All are Gods blessings! good morning.:",
  "hPls confirm the time to collect the cheque.",
  "sAs a Registered Subscriber yr draw 4 a £100 gift voucher will b entered on receipt of a correct ans. When are the next olympics. Txt ans to 80062",
  "sURGENT! Your Mobile number has been awarded with a £2000 prize GUARANTEED. Call 09061790121 from land line. Claim 3030. Valid 12hrs only 150ppm",
  "hDaddy will take good care of you :)",
  "hYeah probably, I still gotta check out with leo",
  "hK.then any other special?",
  "hCarlos is taking his sweet time as usual so let me know when you and patty are done/want to smoke and I'll tell him to haul ass",
  "hOk pa. Nothing problem:-)",
  "hHave you heard about that job? I'm going to that wildlife talk again tonight if u want2come. Its that2worzels and a wizzle or whatever it is?! ",
  "hGod picked up a flower and dippeditinaDEW, lovingly touched itwhichturnedinto u, and the he gifted tomeandsaid,THIS FRIEND IS 4U",
  "hWhen you came to hostel.",
  "hOk no prob... I'll come after lunch then...",
  "hJus telling u dat i'll b leaving 4 shanghai on 21st instead so we'll haf more time 2 meet up cya...",
  "hAre your freezing ? Are you home yet ? Will you remember to kiss your mom in the morning? Do you love me ? Do you think of me ? Are you missing me yet ?",
  "hYou all ready for * big day tomorrow?",
  "hI'll probably be around mu a lot",
  "h645",
  "sRT-KIng Pro Video Club>> Need help? info@ringtoneking.co.uk or call 08701237397 You must be 16+ Club credits redeemable at www.ringtoneking.co.uk! Enjoy!",
  "hThnx dude. u guys out 2nite?",
  "hMe sef dey laugh you. Meanwhile how's my darling anjie!",
  "hMm i had my food da from out",
  "hK, makes sense, btw carlos is being difficult so you guys are gonna smoke while I go pick up the second batch and get gas",
  "hDid u download the fring app?",
  "hThe 2 oz guy is being kinda flaky but one friend is interested in picking up $ &lt;#&gt;  worth tonight if possible",
  "hFriends that u can stay on fb chat with",
  "hFuck babe, I miss you sooooo much !! I wish you were here to sleep with me ... My bed is so lonely ... I go now, to sleep ... To dream of you, my love ...",
  "hLiving is very simple.. Loving is also simple.. Laughing is too simple.. Winning is tooo simple.. But, being 'SIMPLE' is very difficult.. Gud nte.:-",
  "sU have a secret admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09058094599",
  "hAh, well that confuses things, doesn‘t it?",
  "s500 free text msgs. Just text ok to 80488 and we'll credit your account",
  "hHi Dear Call me its urgnt. I don't know whats your problem. You don't want to work or if you have any other problem at least tell me. Wating for your reply.",
  "hDear how you. Are you ok?",
  "sYou have been selected to stay in 1 of 250 top British hotels - FOR NOTHING! Holiday Worth £350! To Claim, Call London 02072069400. Bx 526, SW73SS",
  "hYes princess! I want to make you happy...",
  "hSounds like you have many talents! would you like to go on a dinner date next week?",
  "hI am going to film 2day da. At 6pm. Sorry da.",
  "hWe not watching movie already. Xy wants 2 shop so i'm shopping w her now.",
  "hHello my little party animal! I just thought I'd buzz you as you were with your friends ...*grins*... Reminding you were loved and send a naughty adoring kiss",
  "hYesterday its with me only . Now am going home.",
  "sEerie Nokia tones 4u, rply TONE TITLE to 8007 eg TONE DRACULA to 8007 Titles: GHOST, ADDAMSFA, MUNSTERS, EXORCIST, TWILIGHT www.getzed.co.uk POBox36504W45WQ 150p",
  "hYou have come into my life and brought the sun ..Shiny down on me, warming my heart. Putting a constant smile on my face ... Making me feel loved and cared for",
  "hNo shit, but I wasn't that surprised, so I went and spent the evening with that french guy I met in town here and we fooled around a bit but I didn't let him fuck me",
  "s0A$NETWORKS allow companies to bill for SMS, so they are responsible for their \"suppliers\", just as a shop has to give a guarantee on what they sell. B. G.",
  "hGreat comedy..cant stop laughing da:)",
  "sFreeMsg:Feelin kinda lnly hope u like 2 keep me company! Jst got a cam moby wanna c my pic?Txt or reply DATE to 82242 Msg150p 2rcv Hlp 08712317606 stop to 82242",
  "hAlright, we're all set here, text the man",
  "hHi , where are you? We're at  and they're not keen to go out i kind of am but feel i shouldn't so can we go out tomo, don't mind do you?",
  "hSleeping nt feeling well",
  "hU WILL SWITCH YOUR FONE ON DAMMIT!!",
  "hIndia have to take lead:)",
  "hI.ll post her out l8r. In class",
  "hThts wat Wright Brother did to fly..",
  "hEvening * v good if somewhat event laden. Will fill you in, don't you worry … Head * ok but throat * wrecked. See you at six then!",
  "hIf u laugh really loud.. If u talk spontaneously.. If u dont care what others feel.. U are probably with your dear &amp; best friends.. GOODEVENING Dear..:)",
  "hITS A LAPTOP TAKE IT WITH YOU.",
  "hI dont have any of your file in my bag..i was in work when you called me.i 'll tell you if i find anything in my room.",
  "hI wan but too early lei... Me outside now wun b home so early... Neva mind then...",
  "sFor ur chance to win a £250 cash every wk TXT: ACTION to 80608. T's&C's www.movietrivia.tv custcare 08712405022, 1x150p/wk",
  "hI was at bugis juz now wat... But now i'm walking home oredi... Ü so late then reply... I oso saw a top dat i like but din buy... Where r ü now? ",
  "hWishing you and your family Merry \"X\" mas and HAPPY NEW Year in advance..",
  "hAt 7 we will go ok na.",
  "hYes I posted a couple of pics on fb. There's still snow outside too. I'm just waking up :)",
  "hS:-)if we have one good partnership going we will take lead:)",
  "sRGENT! This is the 2nd attempt to contact U!U have WON £1250 CALL 09071512433 b4 050703 T&CsBCM4235WC1N3XX. callcost 150ppm mobilesvary. max£7. 50",
  "hYeah, where's your class at?",
  "hNo just send to you. Bec you in temple na.",
  "hYou aren't coming home between class, right? I need to work out and shower!",
  "sHi if ur lookin 4 saucy daytime fun wiv busty married woman Am free all next week Chat now 2 sort time 09099726429 JANINExx Calls£1/minMobsmoreLKPOBOX177HP51FL",
  "hS but mostly not like that.",
  "hÜ v ma fan...",
  "hDunno cos i was v late n when i reach they inside already... But we ate spageddies lor... It's e gals who r laughing at me lor...",
  "hGuess who spent all last night phasing in and out of the fourth dimension",
  "hSo now my dad is gonna call after he gets out of work and ask all these crazy questions.",
  "hYes..but they said its IT.,",
  "hVery hurting n meaningful lines ever: \"I compromised everything for my love, But at d end my love compromised me for everything:-(\".. Gud mornin:-)",
  "hLmao!nice 1",
  "hGlad to see your reply.",
  "sURGENT! We are trying to contact U. Todays draw shows that you have won a £800 prize GUARANTEED. Call 09050001295 from land line. Claim A21. Valid 12hrs only",
  "sMonthly password for wap. mobsi.com is 391784. Use your wap phone not PC.",
  "hNah dub but je still buff",
  "hPainful words- \"I thought being Happy was the most toughest thing on Earth... But, the toughest is acting Happy with all unspoken pain inside..\"",
  "hYeah, that's fine! It's £6 to get in, is that ok? ",
  "hLol where do u come up with these ideas?",
  "hSo many people seems to be special at first sight, But only very few will remain special to you till your last sight.. Maintain them till life ends.. Sh!jas",
  "hToday is \"song dedicated day..\" Which song will u dedicate for me? Send this to all ur valuable frnds but first rply me...",
  "hOkay... We wait ah",
  "hY lei?",
  "hHI BABE U R MOST LIKELY TO BE IN BED BUT IM SO SORRY ABOUT TONIGHT! I REALLY WANNA SEE U TOMORROW SO CALL ME AT 9. LOVE ME XXX",
  "hAlready am squatting is the new way of walking",
  "hDo you want bold 2 or bb torch",
  "hCramps stopped. Going back to sleep",
  "stodays vodafone numbers ending with 0089(my last four digits) are selected to received a £350 award. If your number matches please call 09063442151 to claim your £350 award",
  "sFree Top ringtone -sub to weekly ringtone-get 1st week free-send SUBPOLY to 81618-?3 per week-stop sms-08718727870",
  "hNan sonathaya soladha. Why boss?",
  "hBring tat cd don forget",
  "sSunshine Quiz Wkly Q! Win a top Sony DVD player if u know which country the Algarve is in? Txt ansr to 82277. £1.50 SP:Tyrone",
  "hI don't know but I'm raping dudes at poker",
  "hWeightloss! No more girl friends. Make loads of money on ebay or something. And give thanks to God.",
  "hWas gr8 to see that message. So when r u leaving? Congrats dear. What school and wat r ur plans.",
  "hÜ eatin later but i'm eatin wif my frens now lei... Ü going home first? ",
  "hFinish already... Yar they keep saying i mushy... I so embarrassed ok...",
  "hSorry man, my stash ran dry last night and I can't pick up more until sunday",
  "hHai priya are you right. What doctor said pa. Where are you.",
  "sFree msg. Sorry, a service you ordered from 81303 could not be delivered as you do not have sufficient credit. Please top up to receive the service.",
  "hOk...",
  "hPlease ask mummy to call father",
  "hCan come my room but cannot come my house cos my house still messy... Haha...",
  "hI have lost 10 kilos as of today!",
  "hJust taste fish curry :-P",
  "hWhat can i do? Might accidant tookplace between somewhere ghodbandar rd. Traffic moves slovely. So plz slip &amp; don't worry.",
  "hYun ah.now ü wkg where?btw if ü go nus sc. Ü wana specialise in wad?",
  "hYes! I am a one woman man! Please tell me your likes and dislikes in bed...",
  "hWas doing my test earlier. I appreciate you. Will call you tomorrow.",
  "hHow's my loverboy doing ? What does he do that keeps him from coming to his Queen, hmmm ? Doesn't he ache to speak to me ? Miss me desparately ?",
  "hU meet other fren dun wan meet me ah... Muz b a guy rite...",
  "h(No promises on when though, haven't even gotten dinner yet)",
  "hI got your back! Do you have any dislikes in bed?",
  "ho turns out i had stereo love on mi phone under the unknown album.",
  "sHard LIVE 121 chat just 60p/min. Choose your girl and connect LIVE. Call 09094646899 now! Cheap Chat UK's biggest live service. VU BCM1896WC1N3XX",
  "hYeah I don't see why not",
  "hAsking do u knw them or nt? May be ur frnds or classmates?",
  "hSorry about earlier. Putting out fires.Are you around to talk after 9? Or do you actually have a life, lol!",
  "sWOW! The Boys R Back. TAKE THAT 2007 UK Tour. Win VIP Tickets & pre-book with VIP Club. Txt CLUB to 81303. Trackmarque Ltd info@vipclub4u.",
  "hAs in missionary hook up, doggy hook up, standing...|",
  "hThen u better go sleep.. Dun disturb u liao.. U wake up then msg me lor..",
  "hFighting with the world is easy, u either win or lose bt fightng with some1 who is close to u is dificult if u lose - u lose if u win - u still lose.",
  "hAm watching house - very entertaining - am getting the whole hugh laurie thing - even with the stick - indeed especially with the stick.",
  "hThought praps you meant another one. Goodo! I'll look tomorrow ",
  "hHi Jon, Pete here, Ive bin 2 Spain recently & hav sum dinero left, Bill said u or ur ‘rents mayb interested in it, I hav 12,000pes, so around £48, tb, James.",
  "hThere bold 2  &lt;#&gt; . Is that yours",
  "hYou know there is. I shall speak to you in  &lt;#&gt;  minutes then",
  "h\"ALRITE HUNNY!WOT U UP 2 2NITE? DIDNT END UP GOIN DOWN TOWN JUS DA PUB INSTEAD! JUS CHILLIN AT DA MO IN ME BEDROOM!LOVE JEN XXX.\"",
  "hI went to project centre",
  "hAs per your request 'Maangalyam (Alaipayuthe)' has been set as your callertune for all Callers. Press *9 to copy your friends Callertune",
  "hLol yeah at this point I guess not",
  "hDoing project w frens lor. ",
  "hLol. Well quality aint bad at all so i aint complaining",
  "hK, can that happen tonight?",
  "sHi, this is Mandy Sullivan calling from HOTMIX FM...you are chosen to receive £5000.00 in our Easter Prize draw.....Please telephone 09041940223 to claim before 29/03/05 or your prize will be transferred to someone else....",
  "hI think we're going to finn's now, come",
  "hWhy tired what special there you had",
  "hI will come tomorrow di",
  "hI cant pick the phone right now. Pls send a message",
  "hK go and sleep well. Take rest:-).",
  "hU guys never invite me anywhere :(",
  "sUR GOING 2 BAHAMAS! CallFREEFONE 08081560665 and speak to a live operator to claim either Bahamas cruise of£2000 CASH 18+only. To opt out txt X to 07786200117",
  "hI can do that! I want to please you both inside and outside the bedroom...",
  "h\"EY! CALM DOWNON THEACUSATIONS.. ITXT U COS IWANA KNOW WOTU R DOIN AT THEW/END... HAVENTCN U IN AGES..RING ME IF UR UP4 NETHING SAT.LOVE J XXX.\"",
  "hI love to wine and dine my lady!",
  "sSomeone has conacted our dating service and entered your phone because they fancy you!To find out who it is call from landline 09111030116. PoBox12n146tf15",
  "hI’m cool ta luv but v.tired 2 cause i have been doin loads of planning all wk, we have got our social services inspection at the nursery! Take care & spk sn x.",
  "hI don know account details..i will ask my mom and send you.my mom is out of reach now.",
  "hI think u have the wrong number.",
  "hFeel Yourself That You Are Always Happy.. Slowly It Becomes Your Habit &amp; Finally It Becomes Part Of Your Life.. Follow It.. Happy Morning &amp; Have A Happy Day:)",
  "hDO NOT B LATE LOVE MUM",
  "hGot it..mail panren paru..",
  "h* Was thinking about chuckin ur red green n black trainners 2 save carryin them bac on train",
  "hGive one miss from that number please",
  "hJus came back fr lunch wif my sis only. U leh?",
  "hHow is your schedule next week? I am out of town this weekend.",
  "hReally good:)dhanush rocks once again:)",
  "hLmao ok I wont be needing u to do my hair anymore.",
  "hMiss ya, need ya, want ya, love ya.",
  "hSorry i'm not free...",
  "hDo u ever get a song stuck in your head for no reason and it won't go away til u listen to it like 5 times?",
  "hNt yet chikku..simple habba..hw abt u?",
  "hGot ur mail Dileep.thank you so muchand look forward to lots of support...very less contacts here,remember one venugopal you mentioned.tomorrow if not late,i shall try to come up till there.goodnight dear.",
  "hSometimes Heart Remembrs someone Very much... Forgets someone soon... Bcoz Heart will not like everyone. But liked ones will be Remembered Everytime... BSLVYL",
  "hJoy's father is John. Then John is the NAME of Joy's father. Mandan",
  "sHi 07734396839 IBH Customer Loyalty Offer: The NEW NOKIA6600 Mobile from ONLY £10 at TXTAUCTION!Txt word:START to No:81151 & get Yours Now!4T&",
  "hHi this is yijue... It's regarding the 3230 textbook it's intro to algorithms second edition... I'm selling it for $50...",
  "sSMS AUCTION You have won a Nokia 7250i. This is what you get when you win our FREE auction. To take part send Nokia to 86021 now. HG/Suite342/2Lands Row/W1JHL 16+",
  "hK, want us to come by now?",
  "hHow. Its a little difficult but its a simple way to enter this place",
  "hHa... Both of us doing e same thing. But i got tv 2 watch. U can thk of where 2 go tonight or u already haf smth in mind...",
  "hDont show yourself. How far. Put new pictures up on facebook.",
  "hWatching tv now. I got new job :)",
  "hGood afternoon sexy buns! How goes the job search ? I wake and you are my first thought as always, my love. I wish your fine and happy and know I adore you!",
  "hI'm not coming over, do whatever you want",
  "hIts ok chikku, and its my 1 of favourite song..:-)",
  "hDid u see what I posted on your Facebook?",
  "sCall FREEPHONE 0800 542 0578 now!",
  "sBuy Space Invaders 4 a chance 2 win orig Arcade Game console. Press 0 for Games Arcade (std WAP charge) See o2.co.uk/games 4 Terms + settings. No purchase",
  "h7 wonders in My WORLD 7th You 6th Ur style 5th Ur smile 4th Ur Personality 3rd Ur Nature 2nd Ur SMS and 1st \"Ur Lovely Friendship\"... good morning dear",
  "sLoan for any purpose £500 - £75,000. Homeowners + Tenants welcome. Have you been previously refused? We can still help. Call Free 0800 1956669 or text back 'help'",
  "sBIG BROTHER ALERT! The computer has selected u for 10k cash or #150 voucher. Call 09064018838. NTT PO Box CRO1327 18+ BT Landline Cost 150ppm mobiles vary",
  "h;-( oh well, c u later",
  "hMy uncles in Atlanta. Wish you guys a great semester.",
  "hNo dear i do have free messages without any recharge. Hi hi hi",
  "hDont search love, let love find U. Thats why its called falling in love, bcoz U dont force yourself, U just fall and U know there is smeone to hold U... BSLVYL",
  "hI dun believe u. I thk u told him.",
  "hDo you know why god created gap between your fingers..? So that, One who is made for you comes &amp; fills those gaps by holding your hand with LOVE..!",
  "hYes:)sura in sun tv.:)lol.",
  "hArun can u transfr me d amt",
  "hTakin a shower now but yeah I'll leave when I'm done",
  "hAm not working but am up to eyes in philosophy so will text u later when a bit more free for chat...",
  "hU haven’t lost me ill always b here 4u.i didn’t intend 2 hurt u but I never knew how u felt about me when Iwas+marine&that’s what itried2tell urmom.i careabout u",
  "sWIN: We have a winner! Mr. T. Foley won an iPod! More exciting prizes soon, so keep an eye on ur mobile or visit www.win-82050.co.uk",
  "hYou bad girl. I can still remember them",
  "hHow much i gave to you. Morning.",
  "hI hope your alright babe? I worry that you might have felt a bit desparate when you learned the job was a fake ? I am here waiting when you come back, my love",
  "hHey, can you tell me blake's address? Carlos wanted me to meet him there but I got lost and he's not answering his phone",
  "hCan i get your opinion on something first?",
  "hThat one week leave i put know that time. Why.",
  "hIf we hit it off, you can move in with me :)",
  "hexcellent. I spent  &lt;#&gt;  years in the Air Force. Iraq and afghanistan. I am stable and honest. do you like traveling?",
  "hI wanna watch that movie",
  "hOk lor thanx... Ü in school?",
  "hI'm in class. Did you get my text.",
  "hThe bus leaves at  &lt;#&gt; ",
  "hGod bless.get good sleep my dear...i will pray!",
  "sTodays Voda numbers ending 1225 are selected to receive a £50award. If you have a match please call 08712300220 quoting claim code 3100 standard rates app ",
  "hDo have a nice day today. I love you so dearly.",
  "hAiyo a bit pai seh ü noe... Scared he dun rem who i am then die... Hee... But he become better lookin oredi leh...",
  "hAight, I'll ask a few of my roommates",
  "hNow, whats your house # again ? And do you have any beer there ?",
  "hDo ü all wan 2 meet up n combine all the parts? How's da rest of da project going?",
  "h\"Getting tickets 4 walsall tue 6 th march. My mate is getting me them on sat. ill pay my treat. Want 2 go. Txt bak .Terry\"",
  "hYes we are chatting too.",
  "hHI ITS JESS I DONT KNOW IF YOU ARE AT WORK BUT CALL ME WHEN U CAN IM AT HOME ALL EVE. XXX",
  "hSian... Aft meeting supervisor got work 2 do liao... U working now?",
  "hAre you going to write ccna exam this week??",
  "hWell i will watch shrek in 3D!!B)",
  "hAm i that much dirty fellow?",
  "hDunno dat's wat he told me. Ok lor...",
  "hI'll probably be by tomorrow (or even later tonight if something's going on)",
  "hI couldn't say no as he is a dying man and I feel sad for him so I will go and I just wanted you to know I would probably be gone late into your night",
  "hIf you're thinking of lifting me one then no.",
  "hSame as u... Dun wan... Y u dun like me already ah... Wat u doing now? Still eating?",
  "hSent me ur email id soon",
  "hWat makes some people dearer is not just de happiness dat u feel when u meet them but de pain u feel when u miss dem!!!",
  "hDude. What's up. How Teresa. Hope you have been okay. When i didnt hear from these people, i called them and they had received the package since dec  &lt;#&gt; . Just thot you'ld like to know. Do have a fantastic year and all the best with your reading. Plus if you can really really Bam first aid for Usmle, then your work is done.",
  "hHey gorgeous man. My work mobile number is. Have a good one babe. Squishy Mwahs.",
  "hMay i call You later Pls",
  "sHottest pics straight to your phone!! See me getting Wet and Wanting, just for you xx Text PICS to 89555 now! txt costs 150p textoperator g696ga 18 XxX",
  "hThat's the way you should stay oh.",
  "hHello- thanx for taking that call. I got a job! Starts on monday!",
  "hWhat time is ur flight tmr?",
  "hWhen should I come over?",
  "hI have a rather prominent bite mark on my right cheek",
  "h* Will be september by then!",
  "hAre you wet right now?",
  "hAnd how's your husband.",
  "sHack Chat. Get backdoor entry into 121 chat rooms at a fraction of the cost. Reply NEO69 or call 09050280520, to subscribe 25p pm. DPS, Bcm box 8027 Ldn, wc1n3xx",
  "hAre we doing the norm tomorrow? I finish just a 4.15 cos of st tests. Need to sort library stuff out at some point tomo - got letter from today - access til end march so i better get move on!",
  "hYeah. I got a list with only u and Joanna if I'm feeling really anti social",
  "hI am in your office na.",
  "h\"Are you comingdown later?\"",
  "hSuper da:)good replacement for murali",
  "hDa is good good player.why he is unsold.",
  "hHi. || Do u want | to join me with sts later? || Meeting them at five. || Call u after class.",
  "hIts on in engalnd! But telly has decided it won't let me watch it and mia and elliot were kissing! Damn it!",
  "sFREE NOKIA Or Motorola with upto 12mths 1/2price linerental, 500 FREE x-net mins&100txt/mth FREE B'tooth*. Call Mobileupd8 on 08001950382 or call 2optout/D3WV",
  "hI dont want to hear philosophy. Just say what happen",
  "hYou got job in wipro:)you will get every thing in life in 2 or 3 years.",
  "hThen cant get da laptop? My matric card wif ü lei... ",
  "hDunno da next show aft 6 is 850. Toa payoh got 650.",
  "sThis is the 2nd time we have tried 2 contact u. U have won the 750 Pound prize. 2 claim is easy, call 08718726970 NOW! Only 10p per min. BT-national-rate ",
  "hI just made some payments so dont have that much. Sorry. Would you want it fedex or the other way.",
  "hThey did't play one day last year know even though they have very good team.. Like india.",
  "hK.:)you are the only girl waiting in reception ah?",
  "hSay this slowly.? GOD,I LOVE YOU &amp; I NEED YOU,CLEAN MY HEART WITH YOUR BLOOD.Send this to Ten special people &amp; u c miracle tomorrow, do it,pls,pls do it...",
  "hI hate when she does this. She turns what should be a fun shopping trip into an annoying day of how everything would look in her house.",
  "hSir, i am waiting for your call.",
  "hWhat's up. Do you want me to come online?",
  "hIt could work, we'll reach a consensus at the next meeting",
  "hAiyah then i wait lor. Then u entertain me. Hee...",
  "hThe last thing i ever wanted to do was hurt you. And i didn't think it would have. You'd laugh, be embarassed, delete the tag and keep going. But as far as i knew, it wasn't even up. The fact that you even felt like i would do it to hurt you shows you really don't know me at all. It was messy wednesday, but it wasn't bad. The problem i have with it is you HAVE the time to clean it, but you choose not to. You skype, you take pictures, you sleep, you want to go out. I don't mind a few things here and there, but when you don't make the bed, when you throw laundry on top of it, when i can't have a friend in the house because i'm embarassed that there's underwear and bras strewn on the bed, pillows on the floor, that's something else. You used to be good about at least making the bed.",
  "hI'll let you know when it kicks in",
  "hYou call him now ok i said call him",
  "hCall to the number which is available in appointment. And ask to connect the call to waheed fathima.",
  "hOr ü go buy wif him then i meet ü later can?",
  "hMmmm ... Fuck ... Not fair ! You know my weaknesses ! *grins* *pushes you to your knee's* *exposes my belly and pulls your head to it* Don't forget ... I know yours too *wicked smile*",
  "hToday my system sh get ready.all is well and i am also in the deep well",
  "hMom wants to know where you at",
  "hAight, I'll text you when I'm back",
  "hDont know supports ass and srt i thnk. I think ps3 can play through usb too",
  "hOh ok i didnt know what you meant. Yep i am baby jontin",
  "sYou have WON a guaranteed £1000 cash or a £2000 prize.To claim yr prize call our customer service representative on",
  "sWould you like to see my XXX pics they are so hot they were nearly banned in the uk!",
  "sHMV BONUS SPECIAL 500 pounds of genuine HMV vouchers to be won. Just answer 4 easy questions. Play Now! Send HMV to 86688 More info:www.100percent-real.com",
  "hWatching tv now. I got new job :)",
  "hThis pen thing is beyond a joke. Wont a Biro do? Don't do a masters as can't do this ever again! ",
  "hI AM AT A PARTY WITH ALEX NICHOLS",
  "sU have a secret admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09058094594",
  "hJust seeing your missed call my dear brother. Do have a gr8 day.",
  "hOk.. Ü finishing soon?",
  "hSorry, I can't help you on this.",
  "hCome to me, slave. Your doing it again ... Going into your shell and unconsciously avoiding me ... You are making me unhappy :-(",
  "hI love your ass! Do you enjoy doggy style? :)",
  "hI think asking for a gym is the excuse for lazy people. I jog.",
  "sDear 0776xxxxxxx U've been invited to XCHAT. This is our final attempt to contact u! Txt CHAT to 86688 150p/MsgrcvdHG/Suite342/2Lands/Row/W1J6HL LDN 18yrs ",
  "sUrgent! Please call 09061743811 from landline. Your ABTA complimentary 4* Tenerife Holiday or £5000 cash await collection SAE T&Cs Box 326 CW25WX 150ppm",
  "hNo. On the way home. So if not for the long dry spell the season would have been over",
  "hI gotta collect da car at 6 lei.",
  "hOk but knackered. Just came home and went to sleep! Not good at this full time work lark.",
  "hProbably earlier than that if the station's where I think it is",
  "sCALL 09090900040 & LISTEN TO EXTREME DIRTY LIVE CHAT GOING ON IN THE OFFICE RIGHT NOW TOTAL PRIVACY NO ONE KNOWS YOUR [sic] LISTENING 60P MIN 24/7MP 0870753331018+",
  "hGood Morning plz call me sir",
  "sFreeMsg Hey U, i just got 1 of these video/pic fones, reply WILD to this txt & ill send U my pics, hurry up Im so bored at work xxx (18 150p/rcvd STOP2stop)",
  "hUh, heads up we don't have THAT much left",
  "hI tot u outside cos darren say u come shopping. Of course we nice wat. We jus went sim lim look at mp3 player.",
  "hAight, sounds good. When do you want me to come down?",
  "hWat would u like 4 ur birthday?",
  "hI love working from home :)",
  "hAnd miss vday the parachute and double coins??? U must not know me very well...",
  "hSorry, I'll call later",
  "hMy sister got placed in birla soft da:-)",
  "sFree entry in 2 a weekly comp for a chance to win an ipod. Txt POD to 80182 to get entry (std txt rate) T&C's apply 08452810073 for details 18+",
  "hWah... Okie okie... Muz make use of e unlimited... Haha... ",
  "hThere're some people by mu, I'm at the table by lambda",
  "hAnd stop being an old man. You get to build snowman snow angels and snowball fights.",
  "hELLO BABE U OK?",
  "hHello beautiful r u ok? I've kinda ad a row wiv and he walked out the pub?? I wanted a night wiv u Miss u ",
  "hThen u going ikea str aft dat?",
  "hBecoz its  &lt;#&gt;  jan whn al the post ofice is in holiday so she cn go fr the post ofice...got it duffer",
  "hLol grr my mom is taking forever with my prescription. Pharmacy is like 2 minutes away. Ugh.",
  "hFor real tho this sucks. I can't even cook my whole electricity is out. And I'm hungry.",
  "hYou want to go? ",
  "sNew TEXTBUDDY Chat 2 horny guys in ur area 4 just 25p Free 2 receive Search postcode or at gaytextbuddy.com. TXT ONE name to 89693. 08715500022 rpl Stop 2 cnl",
  "hIts not that time of the month nor mid of the time?",
  "hFffff. Can you text kadeem or are you too far gone",
  "hWe not leaving yet. Ok lor then we go elsewhere n eat. U thk...",
  "hIs fujitsu s series lifebook good?",
  "hYar i wanted 2 scold u yest but late already... I where got zhong se qing you? If u ask me b4 he ask me then i'll go out w u all lor. N u still can act so real.",
  "hDont know you bring some food",
  "hNo current and food here. I am alone also",
  "hI'll be in sch fr 4-6... I dun haf da book in sch... It's at home...",
  "hHello. They are going to the village pub at 8 so either come here or there accordingly. Ok?",
  "hOk",
  "hWe don call like  &lt;#&gt;  times oh. No give us hypertension oh.",
  "hDont give a monkeys wot they think and i certainly don't mind. Any friend of mine&all that! Just don't sleep wiv , that wud be annoyin!",
  "hOmg it could snow here tonite!",
  "sCall from 08702490080 - tells u 2 call 09066358152 to claim £5000 prize. U have 2 enter all ur mobile & personal details @ the prompts. Careful!",
  "sFree 1st week entry 2 TEXTPOD 4 a chance 2 win 40GB iPod or £250 cash every wk. Txt VPOD to 81303 Ts&Cs www.textpod.net custcare 08712405020.",
  "hCarry on not disturbing both of you",
  "hWhat pa tell me.. I went to bath:-)",
  "hJus finished avatar nigro",
  "hR u over scratching it?",
  "hHope you are having a great day.",
  "hDid either of you have any idea's? Do you know of anyplaces doing something?",
  "hMy planning usually stops at \"find hella weed, smoke hella weed\"",
  "hThe fact that you're cleaning shows you know why i'm upset. Your priority is constantly \"what i want to do,\" not \"what i need to do.\"",
  "hExcellent! Are you ready to moan and scream in ecstasy?",
  "sMore people are dogging in your area now. Call 09090204448 and join like minded guys. Why not arrange 1 yourself. There's 1 this evening. A£1.50 minAPN LS278BB",
  "hDude avatar 3d was imp. At one point i thought there were actually flies in the room and almost tried hittng one as a reflex",
  "sWELL DONE! Your 4* Costa Del Sol Holiday or £5000 await collection. Call 09050090044 Now toClaim. SAE, TCs, POBox334, Stockport, SK38xh, Cost£1.50/pm, Max10mins",
  "hK...k:)why cant you come here and search job:)",
  "hI got lousy sleep. I kept waking up every 2 hours to see if my cat wanted to come in. I worry about him when its cold :(",
  "hYeah, I'll leave in a couple minutes &amp; let you know when I get to mu",
  "hCan ü call me at 10:10 to make sure dat i've woken up...",
  "hHey we can go jazz power yoga hip hop kb and yogasana ",
  "hThe battery is for mr adewale my uncle. Aka Egbon",
  "hI cant pick the phone right now. Pls send a message",
  "hWait 2 min..stand at bus stop",
  "hOh ic. I thought you meant mary jane.",
  "hHaha... Really oh no... How? Then will they deduct your lesson tmr?",
  "hNah im goin 2 the wrks with j wot bout u?",
  "hThen just eat a shit and wait for ur monkey face bitch.......... U asshole..................",
  "hGood night. Am going to sleep.",
  "hAight I'll grab something to eat too, text me when you're back at mu",
  "hK...k:)why cant you come here and search job:)",
  "hTake something for pain. If it moves however to any side in the next 6hrs see a doctor.",
  "hLol ... Oh no babe, I wont be sliding into your place after midnight, but thanks for the invite",
  "hHowz that persons story",
  "sGuess what! Somebody you know secretly fancies you! Wanna find out who it is? Give us a call on 09065394973 from Landline DATEBox1282EssexCM61XN 150p/min 18",
  "hLOL that would be awesome payback.",
  "sit to 80488. Your 500 free text messages are valid until 31 December 2005.",
  "hYes :)it completely in out of form:)clark also utter waste.",
  "hHoneybee Said: *I'm d Sweetest in d World* God Laughed &amp; Said: *Wait,U Havnt Met d Person Reading This Msg* MORAL: Even GOD Can Crack Jokes! GM+GN+GE+GN:)",
  "hThanks. It was only from tescos but quite nice. All gone now. Speak soon ",
  "hWhat's a feathery bowa? Is that something guys have that I don't know about?",
  "hEven i cant close my eyes you are in me our vava playing umma :-D",
  "h2 laptop... I noe infra but too slow lar... I wan fast one",
  "sYou have won a guaranteed £200 award or even £1000 cashto claim UR award call free on 08000407165 (18+) 2 stop getstop on 88222 PHP",
  "hNvm it's ok...",
  "hEnjoy ur life. . Good night",
  "hYes but can we meet in town cos will go to gep and then home. You could text at bus stop. And don't worry we'll have finished by march … ish!",
  "hI had askd u a question some hours before. Its answer",
  "hThats cool. Where should i cum? On you or in you? :)",
  "hDelhi and chennai still silent.",
  "hLol alright i was thinkin that too haha",
  "sReply to win £100 weekly! Where will the 2006 FIFA World Cup be held? Send STOP to 87239 to end service",
  "hNo I'm in the same boat. Still here at my moms. Check me out on yo. I'm half naked.",
  "hShhhhh nobody is supposed to know!",
  "hSorry, I'll call later",
  "hSorry, I'll call later in meeting any thing related to trade please call Arul. &lt;#&gt; ",
  "hHey i will be late... i'm at amk. Need to drink tea or coffee",
  "hI wnt to buy a BMW car urgently..its vry urgent.but hv a shortage of  &lt;#&gt; Lacs.there is no source to arng dis amt. &lt;#&gt; lacs..thats my prob",
  "sUrgent! Please call 09061743810 from landline. Your ABTA complimentary 4* Tenerife Holiday or #5000 cash await collection SAE T&Cs Box 326 CW25WX 150 ppm",
  "hThe length is e same but e top shorter n i got a fringe now. I thk i'm not going liao. Too lazy. Dun wan 2 distract u also.",
  "hS..antha num corrct dane",
  "hNo calls..messages..missed calls",
  "hSorry, I'll call later",
  "hThe basket's gettin full so I might be by tonight",
  "hHI DARLIN IVE JUST GOT BACK AND I HAD A REALLY NICE NIGHT AND THANKS SO MUCH FOR THE LIFT SEE U TOMORROW XXX",
  "hNo other Valentines huh? The proof is on your fb page. Ugh I'm so glad I really DIDN'T watch your rupaul show you TOOL!",
  "sFree tones Hope you enjoyed your new content. text stop to 61610 to unsubscribe. help:08712400602450p Provided by tones2you.co.uk",
  "hEh den sat u book e kb liao huh...",
  "hHave you been practising your curtsey?",
  "hShall i come to get pickle",
  "hLol boo I was hoping for a laugh",
  "h\"YEH I AM DEF UP4 SOMETHING SAT,JUST GOT PAYED2DAY & I HAVBEEN GIVEN A£50 PAY RISE 4MY WORK & HAVEBEEN MADE PRESCHOOLCO-ORDINATOR 2I AM FEELINGOOD LUV\"",
  "hWell, I have to leave for my class babe ... You never came back to me ... :-( ... Hope you have a nice sleep, my love",
  "hLMAO where's your fish memory when I need it?",
  "hBut i'll b going 2 sch on mon. My sis need 2 take smth.",
  "hIdea will soon get converted to live:)",
  "sTheMob>Yo yo yo-Here comes a new selection of hot downloads for our members to get for FREE! Just click & open the next link sent to ur fone...",
  "hS....s...india going to draw the series after many years in south african soil..",
  "hGoodmorning, today i am late for  &lt;DECIMAL&gt; min.",
  "hCan't take any major roles in community outreach. You rock mel",
  "hShopping lor. Them raining mah hard 2 leave orchard.",
  "hHi here. have birth at on the  to  at 8lb 7oz. Mother and baby doing brilliantly.",
  "hSee the forwarding message for proof",
  "hI can't keep going through this. It was never my intention to run you out, but if you choose to do that rather than keep the room clean so *I* don't have to say no to visitors, then maybe that's the best choice. Yes, I wanted you to be embarassed, so maybe you'd feel for once how I feel when i have a friend who wants to drop buy and i have to say no, as happened this morning. I've tried everything. I don't know what else to do.",
  "hDunno lei... I thk mum lazy to go out... I neva ask her yet...",
  "hDo whatever you want. You know what the rules are. We had a talk earlier this week about what had to start happening, you showing responsibility. Yet, every week it's can i bend the rule this way? What about that way? Do whatever. I'm tired of having thia same argument with you every week. And a  &lt;#&gt;  movie DOESNT inlude the previews. You're still getting in after 1.",
  "hBeautiful Truth against Gravity.. Read carefully: \"Our heart feels light when someone is in it.. But it feels very heavy when someone leaves it..\" GOODMORNING",
  "sGreat News! Call FREEFONE 08006344447 to claim your guaranteed £1000 CASH or £2000 gift. Speak to a live operator NOW!",
  "hAmbrith..madurai..met u in arun dha marrge..remembr?",
  "hJust re read it and I have no shame but tell me how he takes it and if he runs I will blame u 4 ever!! Not really 4 ever just a long time ",
  "hPrincess, is your kitty shaved or natural?",
  "hBetter than bb. If he wont use it, his wife will or them doctor",
  "hYa it came a while ago",
  "hFrom tomorrow onwards eve 6 to 3 work.",
  "hAnything lor but toa payoh got place 2 walk meh...",
  "hI don't have anybody's number, I still haven't thought up a tactful way to ask alex",
  "sU can WIN £100 of Music Gift Vouchers every week starting NOW Txt the word DRAW to 87066 TsCs www.ldew.com SkillGame,1Winaweek, age16.150ppermessSubscription",
  "hIs there any movie theatre i can go to and watch unlimited movies and just pay once?",
  "hU having lunch alone? I now so bored...",
  "hYes obviously, but you are the eggs-pert and the potato head… Speak soon! ",
  "hNah man, my car is meant to be crammed full of people",
  "hNo got new job at bar in airport on satsgettin 4.47per hour but means no lie in! keep in touch",
  "hKallis is ready for bat in 2nd innings",
  "hThanx but my birthday is over already.",
  "hUgh y can't u just apologize, admit u were wrong and ask me to take u back?",
  "hI noe la... U wana pei bf oso rite... K lor, other days den...",
  "hYes, i'm small kid.. And boost is the secret of my energy..",
  "hIM GONNA MISS U SO MUCH",
  "hIs avatar supposed to have subtoitles",
  "hSimply sitting and watching match in office..",
  "hYou can jot down things you want to remember later.",
  "hOh sorry please its over",
  "hHey are we going for the lo lesson or gym? ",
  "hDont pack what you can buy at any store.like cereals. If you must pack food, pack gari or something 9ja that you will miss.",
  "hYou always make things bigger than they are",
  "hÜ dun wan to watch infernal affair?",
  "hMe not waking up until 4 in the afternoon, sup",
  "s4mths half price Orange line rental & latest camera phones 4 FREE. Had your phone 11mths ? Call MobilesDirect free on 08000938767 to update now! or2stoptxt",
  "hI can send you a pic if you like :)",
  "hOkay... I booked all already... Including the one at bugis.",
  "hAight fuck it, I'll get it later",
  "hNo de. But call me after some time. Ill tell you k",
  "hSo dont use hook up any how",
  "hHow much is blackberry bold2 in nigeria.",
  "hHi where you. You in home or calicut?",
  "hHey darlin.. i can pick u up at college if u tell me wen & where 2 mt.. love Pete xx",
  "sCall 09094100151 to use ur mins! Calls cast 10p/min (mob vary). Service provided by AOM, just GBP5/month. AOM Box61,M60 1ER until u stop. Ages 18+ only!",
  "hOh... I was thkin of goin yogasana at 10 den no nd to go at 3 den can rush to parco 4 nb... Okie lor, u call me when ready...",
  "hY so late but i need to go n get da laptop...",
  "hSir, I am waiting for your mail.",
  "h.Please charge my mobile when you get up in morning.",
  "hNothing, i got msg frm tht unknown no..",
  "hUgh fuck it I'm resubbing to eve",
  "hHe didn't see his shadow. We get an early spring yay",
  "hI did. One slice and one breadstick. Lol",
  "hHey ! I want you ! I crave you ! I miss you ! I need you ! I love you, Ahmad Saeed al Hallaq ...",
  "hIs there any training tomorrow?",
  "sURGENT! Your mobile No *********** WON a £2,000 Bonus Caller Prize on 02/06/03! This is the 2nd attempt to reach YOU! Call 09066362220 ASAP! BOX97N7QP, 150ppm",
  "hPass dis to all ur contacts n see wat u get! Red;i'm in luv wid u. Blue;u put a smile on my face. Purple;u r realy hot. Pink;u r so swt. Orange;i thnk i lyk u. Green;i realy wana go out wid u. Yelow;i wnt u bck. Black;i'm jealous of u. Brown;i miss you Nw plz giv me one color",
  "hCos daddy arranging time c wat time fetch ü mah...",
  "hThen. You are eldest know.",
  "hWho's there say hi to our drugdealer",
  "hIts hard to believe things like this. All can say lie but think twice before saying anything to me.",
  "sEerie Nokia tones 4u, rply TONE TITLE to 8007 eg TONE DRACULA to 8007 Titles: GHOST, ADDAMSFA, MUNSTERS, EXORCIST, TWILIGHT www.getzed.co.uk POBox36504W45WQ 150p ",
  "sSexy Singles are waiting for you! Text your AGE followed by your GENDER as wither M or F E.G.23F. For gay men text your AGE followed by a G. e.g.23G.",
  "hGood night my dear.. Sleepwell&amp;Take care",
  "hThat is wondarfull song",
  "sFreeMsg: Claim ur 250 SMS messages-Text OK to 84025 now!Use web2mobile 2 ur mates etc. Join Txt250.com for 1.50p/wk. T&C BOX139, LA32WU. 16 . Remove txtX or stop",
  "hYar lor actually we quite fast... Cos da ge slow wat... Haha...",
  "hMust come later.. I normally bathe him in da afternoon mah..",
  "hTrust me. Even if isn't there, its there.",
  "hHey hun-onbus goin 2 meet him. He wants 2go out 4a meal but I donyt feel like it cuz have 2 get last bus home!But hes sweet latelyxxx",
  "s85233 FREE>Ringtone!Reply REAL",
  "hI can take you at like noon",
  "hWhere is it. Is there any opening for mca.",
  "hI'm aight. Wat's happening on your side.",
  "hI'm done oredi...",
  "hyou are sweet as well, princess. Please tell me your likes and dislikes in bed...",
  "hHow are you. Wish you a great semester",
  "hMoji i love you more than words. Have a rich day",
  "hDude how do you like the buff wind.",
  "h\"alright babe, justthought i’d sayhey! how u doin?nearly the endof me wk offdam nevamind!We will have 2Hook up sn if uwant m8? loveJen x.\"",
  "sWell done ENGLAND! Get the official poly ringtone or colour flag on yer mobile! text TONE or FLAG to 84199 NOW! Opt-out txt ENG STOP. Box39822 W111WX £1.50",
  "hNo i'm not. I can't give you everything you want and need. You actually could do better for yourself on yor own--you've got more money than i do. I can't get work, i can't get a man, i can't pay the rent, i can't even fill my fucking gas tank. yes, i'm stressed and depressed. I didn't even call home for thanksgiving cuz i'll have to tell them i,m up to nothing.",
  "hS:-)kallis wont play in first two odi:-)",
  "hThen get some cash together and I'll text jason",
  "hOh, my love, it's soooo good to hear from you. Omg I missed you so much today. I'm sorry your having problems with the provider but thank you for tming me",
  "sFinal Chance! Claim ur £150 worth of discount vouchers today! Text YES to 85023 now! SavaMob, member offers mobile! T Cs SavaMob POBOX84, M263UZ. £3.00 Subs 16",
  "sPRIVATE! Your 2004 Account Statement for 07742676969 shows 786 unredeemed Bonus Points. To claim call 08719180248 Identifier Code: 45239 Expires",
  "hProbably, want to pick up more?",
  "hI'm done...",
  "hAre you the cutest girl in the world or what",
  "hNo dice, art class 6 thru 9 :( thanks though. Any idea what time I should come tomorrow?",
  "sSMS SERVICES. for your inclusive text credits, pls goto www.comuk.net login= ***** unsubscribe with STOP. no extra charge. help:08700469649. PO BOX420. IP4 5WE",
  "hOh Howda gud gud.. Mathe en samachara chikku:-)",
  "hI thk 530 lor. But dunno can get tickets a not. Wat u doing now?",
  "hAudrie lousy autocorrect",
  "hIts a site to simulate the test. It just gives you very tough questions to test your readiness.",
  "hAnyway seriously hit me up when you're back because otherwise I have to light up with armand and he always has shit and/or is vomiting",
  "hI fetch yun or u fetch?",
  "hThank you. I like you as well...",
  "hHmmm ... And imagine after you've come home from that having to rub my feet, make me dinner and help me get ready for my date ! Are you sure your ready for that kind of life ?",
  "sFREE2DAY sexy St George's Day pic of Jordan!Txt PIC to 89080 dont miss out, then every wk a saucy celeb!4 more pics c PocketBabe.co.uk 0870241182716 £3/wk",
  "hLara said she can loan me  &lt;#&gt; .",
  "hDo we have any spare power supplies",
  "hYar he quite clever but aft many guesses lor. He got ask me 2 bring but i thk darren not so willing 2 go. Aiya they thk leona still not attach wat.",
  "sYou are a winner you have been specially selected to receive £1000 cash or a £2000 award. Speak to a live operator to claim call 087123002209am-7pm. Cost 10p",
  "hYeah, don't go to bed, I'll be back before midnight",
  "sSunshine Hols. To claim ur med holiday send a stamped self address envelope to Drinks on Us UK, PO Box 113, Bray, Wicklow, Eire. Quiz Starts Saturday! Unsub Stop",
  "hWell I wasn't available as I washob nobbing with last night so they had to ask Nickey Platt instead of me!;",
  "hIt's that time of the week again, ryan",
  "hWish u many many returns of the day.. Happy birthday vikky..",
  "sU can WIN £100 of Music Gift Vouchers every week starting NOW Txt the word DRAW to 87066 TsCs www.Idew.com SkillGame, 1Winaweek, age16. 150ppermessSubscription",
  "hI hope you know I'm still mad at you.",
  "hArgh my 3g is spotty, anyway the only thing I remember from the research we did was that province and sterling were the only problem-free places we looked at",
  "hIn xam hall boy asked girl Tell me the starting term for dis answer I can den manage on my own After lot of hesitation n lookin around silently she said THE! intha ponnungale ipaditan;)",
  "hDo you know when the result.",
  "s+123 Congratulations - in this week's competition draw u have won the £1450 prize to claim just call 09050002311 b4280703. T&Cs/stop SMS 08718727868. Over 18 only 150ppm",
  "hBeautiful Truth against Gravity.. Read carefully: \"Our heart feels light when someone is in it.. But it feels very heavy when someone leaves it..\" GOOD NIGHT",
  "hSorry im getting up now, feel really bad- totally rejected that kinda me thing.",
  "hYou do got a shitload of diamonds though",
  "hTessy..pls do me a favor. Pls convey my birthday wishes to Nimya..pls dnt forget it. Today is her birthday Shijas",
  "hWell I'm going to be an aunty!",
  "hMine here like all fr china then so noisy.",
  "hLater i guess. I needa do mcat study too.",
  "hS...from the training manual it show there is no tech process:)its all about password reset and troubleshooting:)",
  "sYour B4U voucher w/c 27/03 is MARSMS. Log onto www.B4Utele.com for discount credit. To opt out reply stop. Customer care call 08717168528",
  "hSpoke with uncle john today. He strongly feels that you need to sacrifice to keep me here. He's going to call you. When he does, i beg you to just listen. Dont make any promises or make it clear things are not easy. And i need you to please let us work things out. As long as i keep expecting help, my creativity will be stifled so pls just keep him happy, no promises on your part.",
  "hIf he started searching he will get job in few days.he have great potential and talent.",
  "hCarlos took a while (again), we leave in a minute",
  "hWell done and ! luv ya all ",
  "hThen why you came to hostel.",
  "hK still are you loving me.",
  "hBut i juz remembered i gotta bathe my dog today..",
  "hAfter the drug she will be able to eat.",
  "hAlright took the morphine. Back in yo.",
  "hYou see the requirements please",
  "hYou stayin out of trouble stranger!!saw Dave the other day he’s sorted now!still with me bloke when u gona get a girl MR!ur mum still Thinks we will get 2GETHA! ",
  "sFreeMsg: Hey - I'm Buffy. 25 and love to satisfy men. Home alone feeling randy. Reply 2 C my PIX! QlynnBV Help08700621170150p a msg Send stop to stop txts",
  "sSunshine Hols. To claim ur med holiday send a stamped self address envelope to Drinks on Us UK, PO Box 113, Bray, Wicklow, Eire. Quiz Starts Saturday! Unsub Stop",
  "hSo can collect ur laptop?",
  "hOk. Can be later showing around 8-8:30 if you want + cld have drink before. Wld prefer not to spend money on nosh if you don't mind, as doing that nxt wk.",
  "hI will once i get home",
  "hWaaaat?? Lololo ok next time then!",
  "hThe table's occupied, I'm waiting by the tree",
  "hI surely dont forgot to come:)i will always be in touch in with you:-)",
  "hHi kindly give us back our documents which we submitted for loan from STAPATI",
  "hI dont have i shall buy one dear",
  "hOh god i am happy to see your message after 3 days",
  "hWhat year. And how many miles.",
  "hHey cutie. How goes it? Here in WALES its kinda ok. There is like hills and shit but i still avent killed myself. ",
  "hSad story of a Man - Last week was my b'day. My Wife did'nt wish me. My Parents forgot n so did my Kids . I went to work. Even my Colleagues did not wish. As I entered my cabin my PA said, '' Happy B'day Boss !!''. I felt special. She askd me 4 lunch. After lunch she invited me to her apartment. We went there. She said,'' do u mind if I go into the bedroom for a minute ? '' ''OK'', I sed in a sexy mood. She came out 5 minuts latr wid a cake...n My Wife, My Parents, My Kidz, My Friends n My Colleagues. All screaming.. SURPRISE !! and I was waiting on the sofa.. ... ..... ' NAKED...!",
  "hI think you should go the honesty road. Call the bank tomorrow. Its the tough decisions that make us great people.",
  "sFREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 87077 Get txting and tell ur mates. zed POBox 36504 W45WQ norm150p/tone 16+",
  "hNo. Its not specialisation. Can work but its slave labor. Will look for it this month sha cos no shakara 4 beggar.",
  "hIs she replying. Has boye changed his phone number",
  "h1) Go to write msg 2) Put on Dictionary mode 3)Cover the screen with hand, 4)Press  &lt;#&gt; . 5)Gently remove Ur hand.. Its interesting..:)",
  "hhi my darlin im on my way to London and we have just been smashed into by another driver! and have a big dent! im really missing u what have u been up to? xxx",
  "hNothing really, just making sure everybody's up to speed",
  "hI'm not coming home 4 dinner.",
  "hThank you. And by the way, I just lost.",
  "hYes.he have good crickiting mind",
  "hThx. All will be well in a few months",
  "sShop till u Drop, IS IT YOU, either 10K, 5K, £500 Cash or £100 Travel voucher, Call now, 09064011000. NTT PO Box CR01327BT fixedline Cost 150ppm mobile vary",
  "h\"CAN I PLEASE COME UP NOW IMIN TOWN.DONTMATTER IF URGOIN OUTL8R,JUST REALLYNEED 2DOCD.PLEASE DONTPLEASE DONTIGNORE MYCALLS,U NO THECD ISV.IMPORTANT TOME 4 2MORO\"",
  "hI wont. So wat's wit the guys",
  "hYavnt tried yet and never played original either",
  "hHiya, had a good day? Have you spoken to since the weekend?",
  "hSee? I thought it all through",
  "hI'm at work. Please call",
  "hget ready to moan and scream :)",
  "hOh k :)why you got job then whats up?",
  "hI don,t think so. You don't need to be going out that late on a school night. ESPECIALLY when the one class you have is the one you missed last wednesday and probably failed a test in on friday",
  "hAnd popping &lt;#&gt; ibuprofens was no help.",
  "hBabe ! How goes that day ? What are you doing ? Where are you ? I sip my cappuccino and think of you, my love ... I send a kiss to you from across the sea",
  "hOk.",
  "hPS U no ur a grown up now right?",
  "hChinatown got porridge, claypot rice, yam cake, fishhead beehoon... Either we eat cheap den go cafe n tok or go nydc or somethin...",
  "hI know a few people I can hit up and fuck to the yes",
  "hPurity of friendship between two is not about smiling after reading the forwarded message..Its about smiling just by seeing the name. Gud evng",
  "hSo is there anything specific I should be doing with regards to jaklin or what because idk what the fuck",
  "hOh god. I'm gonna Google nearby cliffs now.",
  "sFREE camera phones with linerental from 4.49/month with 750 cross ntwk mins. 1/2 price txt bundle deals also avble. Call 08001950382 or call2optout/J MF",
  "hYup i shd haf ard 10 pages if i add figures... Ü all got how many pages?",
  "hOoh, 4got, i'm gonna start belly dancing in moseley weds 6.30 if u want 2 join me, they have a cafe too. ",
  "hThankyou so much for the call. I appreciate your care.",
  "hCongrats ! Treat pending.i am not on mail for 2 days.will mail once thru.Respect mother at home.check mails.",
  "hI called but no one pick up e phone. I ask both of them already they said ok.",
  "hHi my email address has changed now it is ",
  "hV-aluable. A-ffectionate. L-oveable. E-ternal. N-oble. T-ruthful. I-ntimate. N-atural. E-namous. Happy \"VALENTINES DAY\" in advance",
  "hNot much, just some textin'. How bout you?",
  "hBring it if you got it",
  "hI'm in a movie. Call me 4 wat?",
  "hNot sure I have the stomach for it ...",
  "hHaha... can... But i'm having dinner with my cousin...",
  "hA boy was late 2 home. His father: \"POWER OF FRNDSHIP\"",
  "h(And my man carlos is definitely coming by mu tonight, no excuses)",
  "hsoon you will have the real thing princess! Do i make you wet? :)",
  "hRaji..pls do me a favour. Pls convey my Birthday wishes to Nimya. Pls. Today is her birthday.",
  "hHaha, my legs and neck are killing me and my amigos are hoping to end the night with a burn, think I could swing by in like an hour?",
  "sURGENT! Your mobile No 07xxxxxxxxx won a £2,000 bonus caller prize on 02/06/03! this is the 2nd attempt to reach YOU! call 09066362231 ASAP! BOX97N7QP, 150PPM",
  "hUsually the body takes care of it buy making sure it doesnt progress. Can we pls continue this talk on saturday.",
  "sURGENT!! Your 4* Costa Del Sol Holiday or £5000 await collection. Call 09050090044 Now toClaim. SAE, TC s, POBox334, Stockport, SK38xh, Cost£1.50/pm, Max10mins",
  "hHmm well, night night ",
  "hJust wanted to say holy shit you guys weren't kidding about this bud",
  "hJust gettin a bit arty with my collages at the mo, well tryin 2 ne way! Got a roast in a min lovely i shall enjoy that!",
  "hThis is one of the days you have a billion classes, right?",
  "hGoodmorning, today i am late for 2hrs. Because of back pain.",
  "hOk then i'll let him noe later n ask him call u tmr...",
  "hPrabha..i'm soryda..realy..frm heart i'm sory",
  "hOK i'm waliking ard now... Do u wan me 2 buy anything go ur house?",
  "h* Will have two more cartons off u and is very pleased with shelves",
  "hNice talking to you! please dont forget my pix :) i want to see all of you...",
  "sYou have WON a guaranteed £1000 cash or a £2000 prize. To claim yr prize call our customer service representative on 08714712379 between 10am-7pm Cost 10p",
  "hBut really quite funny lor wat... Then u shd haf run shorter distance wat...",
  "hI notice you like looking in the shit mirror youre turning into a right freak",
  "hGreat. I was getting worried about you. Just know that a wonderful and caring person like you will have only the best in life. Know that u r wonderful and God's love is yours.",
  "sThanks for your ringtone order, ref number K718. Your mobile will be charged £4.50. Should your tone not arrive please call customer services on 09065069120",
  "hI prefer my free days... Tues, wed, fri oso can... Ü ask those workin lor...",
  "hAlrite jod hows the revision goin? Keris bin doin a smidgin. N e way u wanna cum over after college?xx",
  "hIf you have belive me. Come to my home.",
  "hOh k.k..where did you take test?",
  "hThose were my exact intentions",
  "hhaha but no money leh... Later got to go for tuition... Haha and looking for empty slots for driving lessons",
  "hHey... Thk we juz go accordin to wat we discussed yest lor, except no kb on sun... Cos there's nt much lesson to go if we attend kb on sat...",
  "hK, wen ur free come to my home and also tel vikky i hav sent mail to him also.. Better come evening il be free today aftr 6pm..:-)",
  "hNothing just getting msgs by dis name wit different no's..",
  "hGood Morning plz call me sir",
  "hWhat's your room number again? Wanna make sure I'm knocking on the right door",
  "h\"Si.como no?!listened2the plaid album-quite gd&the new air1 which is hilarious-also bought”braindance”a comp.ofstuff on aphex’s ;abel,u hav2hear it!c u sn xxxx\"",
  "hPls tell nelson that the bb's are no longer comin. The money i was expecting aint coming",
  "hGive her something to drink, if she takes it and doesn't vomit then you her temp might drop. If she unmits however let me know.",
  "hThink you sent the text to the home phone. That cant display texts. If you still want to send it his number is",
  "hEvery day i use to sleep after  &lt;#&gt;  so only.",
  "hK I'll call you when I'm close",
  "hU buy newspapers already?",
  "hNope wif my sis lor... Aft bathing my dog then i can bathe... Looks like it's going 2 rain soon.",
  "hBoo I'm on my way to my moms. She's making tortilla soup. Yummmm",
  "hNo management puzzeles.",
  "hHow did you find out in a way that didn't include all of these details",
  "sHi ya babe x u 4goten bout me?' scammers getting smart..Though this is a regular vodafone no, if you respond you get further prem rate msg/subscription. Other nos used also. Beware!",
  "sBack 2 work 2morro half term over! Can U C me 2nite 4 some sexy passion B4 I have 2 go back? Chat NOW 09099726481 Luv DENA Calls £1/minMobsmoreLKPOBOX177HP51FL",
  "hwill you like to be spoiled? :)",
  "sThanks for your ringtone order, ref number R836. Your mobile will be charged £4.50. Should your tone not arrive please call customer services on 09065069154",
  "hI am getting threats from your sales executive Shifad as i raised complaint against him. Its an official message.",
  "hhope things went well at 'doctors' ;) reminds me i still need 2go.did u c d little thing i left in the lounge?",
  "hDen wat will e schedule b lk on sun?",
  "hLol enjoy role playing much?",
  "hOk. Me watching tv too.",
  "hI just lov this line: \"Hurt me with the truth, I don't mind,i wil tolerat.bcs ur my someone..... But, Never comfort me with a lie\" gud ni8 and sweet dreams",
  "hJust checked out, heading out to drop off my stuff now",
  "hHere got lots of hair dresser fr china.",
  "hSad story of a Man - Last week was my b'day. My Wife did'nt wish me. My Parents forgot n so did my Kids . I went to work. Even my Colleagues did not wish.",
  "hIll call you evening ill some ideas.",
  "sSplashMobile: Choose from 1000s of gr8 tones each wk! This is a subscrition service with weekly tones costing 300p. U have one credit - kick back and ENJOY",
  "hDid you show him and wot did he say or could u not c him 4 dust?",
  "hIt should take about  &lt;#&gt;  min",
  "sNot heard from U4 a while. Call 4 rude chat private line 01223585334 to cum. Wan 2C pics of me gettin shagged then text PIX to 8552. 2End send STOP 8552 SAM xxx",
  "hOk . . now i am in bus. . If i come soon i will come otherwise tomorrow",
  "hI cant pick the phone right now. Pls send a message",
  "s<Forwarded from 88877>FREE entry into our £250 weekly comp just send the word ENTER to 88877 NOW. 18 T&C www.textcomp.com",
  "hFinish liao... U?",
  "s88066 FROM 88066 LOST 3POUND HELP",
  "hHaha i think i did too",
  "hU know we watchin at lido?",
  "hLife spend with someone for a lifetime may be meaningless but a few moments spent with someone who really love you means more than life itself..",
  "hHaha awesome, I've been to 4u a couple times. Who all's coming?",
  "hCold. Dont be sad dear",
  "hThink I could stop by in like an hour or so? My roommate's looking to stock up for a trip",
  "hIs that on the telly? No its Brdget Jones!",
  "hLove you aathi..love u lot..",
  "hHello! How r u? Im bored. Inever thought id get bored with the tv but I am. Tell me something exciting has happened there? Anything! =/",
  "hHmm...Bad news...Hype park plaza $700 studio taken...Only left 2 bedrm-$900...",
  "hSorry, I'll call later in meeting",
  "hR ü comin back for dinner?",
  "hI hav almost reached. Call, i m unable to connect u.",
  "hWhom you waited for yesterday",
  "hI reach home safe n sound liao...",
  "hVelly good, yes please!",
  "hHi, wkend ok but journey terrible. Wk not good as have huge back log of marking to do",
  "hI have had two more letters from . I will copy them for you cos one has a message for you. Speak soon",
  "hAlex knows a guy who sells mids but he's down in south tampa and I don't think I could set it up before like 8",
  "hDont you have message offer",
  "sHad your mobile 11mths ? Update for FREE to Oranges latest colour camera mobiles & unlimited weekend calls. Call Mobile Upd8 on freefone 08000839402 or 2StopTx",
  "hHEY THERE BABE, HOW U DOIN? WOT U UP 2 2NITE LOVE ANNIE X.",
  "hRemind me how to get there and I shall do so",
  "h:-( that's not v romantic!",
  "hHello. Damn this christmas thing. I think i have decided to keep this mp3 that doesnt work.",
  "sYou have 1 new message. Please call 08718738034.",
  "hHI DARLIN IM MISSIN U HOPE YOU ARE HAVING A GOOD TIME. WHEN ARE U BACK AND WHAT TIME IF U CAN GIVE ME A CALL AT HOME. JESS XX",
  "s<Forwarded from 21870000>Hi - this is your Mailbox Messaging SMS alert. You have 4 messages. You have 21 matches. Please call back on 09056242159 to retrieve your messages and matches",
  "hDraw va?i dont think so:)",
  "hDont pick up d call when something important is There to tell. Hrishi",
  "sCongrats! 1 year special cinema pass for 2 is yours. call 09061209465 now! C Suprman V, Matrix3, StarWars3, etc all 4 FREE! bx420-ip4-5we. 150pm. Dont miss out!",
  "hNothin comes to my mind. Ü help me buy hanger lor. Ur laptop not heavy?",
  "h&lt;#&gt; , that's all? Guess that's easy enough",
  "hWe can make a baby in yo tho",
  "hShould I tell my friend not to come round til like  &lt;#&gt; ish?",
  "hFriendship poem: Dear O Dear U R Not Near But I Can Hear Dont Get Fear Live With Cheer No More Tear U R Always my Dear. Gud ni8",
  "hStill in the area of the restaurant. Ill try to come back soon",
  "hAight that'll work, thanks",
  "sWIN a year supply of CDs 4 a store of ur choice worth £500 & enter our £100 Weekly draw txt MUSIC to 87066 Ts&Cs www.Ldew.com.subs16+1win150ppmx3",
  "sMoby Pub Quiz.Win a £100 High Street prize if u know who the new Duchess of Cornwall will be? Txt her first name to 82277.unsub STOP £1.50 008704050406 SP Arrow",
  "hI have 2 sleeping bags, 1 blanket and paper and  phone details. Anything else?",
  "sYou have won a Nokia 7250i. This is what you get when you win our FREE auction. To take part send Nokia to 86021 now. HG/Suite342/2Lands Row/W1JHL 16+ ",
  "sCongratulations! Thanks to a good friend U have WON the £2,000 Xmas prize. 2 claim is easy, just call 08718726971 NOW! Only 10p per minute. BT-national-rate.",
  "stddnewsletter@emc1.co.uk (More games from TheDailyDraw) Dear Helen, Dozens of Free Games - with great prizesWith..",
  "hSo what do you guys do.",
  "hAlso that chat was awesome but don't make it regular unless you can see her in person",
  "hThat's significant but dont worry.",
  "hThat's cause your old. I live to be high.",
  "hWaqt se pehle or naseeb se zyada kisi ko kuch nahi milta,Zindgi wo nahi he jo hum sochte hai Zindgi wo hai jo ham jeetey hai..........",
  "hOn the way to office da..",
  "hIn which place do you want da.",
  "hThis pain couldn't have come at a worse time.",
  "hOk...",
  "hShould I be stalking u?",
  "hSorry dude. Dont know how i forgot. Even after Dan reminded me. Sorry. Hope you guys had fun.",
  "hOk lor.",
  "hApps class varaya elaya.",
  "hThe Xmas story is peace.. The Xmas msg is love.. The Xmas miracle is jesus.. Hav a blessed month ahead &amp; wish U Merry Xmas...",
  "sURGENT! Your mobile number *************** WON a £2000 Bonus Caller prize on 10/06/03! This is the 2nd attempt to reach you! Call 09066368753 ASAP! Box 97N7QP, 150ppm",
  "hThat day you asked about anand number. Why:-)",
  "hAm surfing online store. For offers do you want to buy any thing.",
  "hLong beach lor. Expected... U having dinner now?",
  "hAt home by the way",
  "hWe are both fine. Thanks",
  "hWhat happen to her tell the truth",
  "hDo you like Italian food?",
  "hWhich is weird because I know I had it at one point",
  "h\"Aww you must be nearly dead!Well Jez isComing over toDo some workAnd that whillTake forever!\"",
  "hTell your friends what you plan to do on Valentines day @ &lt;URL&gt;",
  "hAlright, see you in a bit",
  "hCheers for the message Zogtorius. I’ve been staring at my phone for an age deciding whether to text or not.",
  "hI will take care of financial problem.i will help:)",
  "hTell dear what happen to you. Why you talking to me like an alian",
  "sDouble your mins & txts on Orange or 1/2 price linerental - Motorola and SonyEricsson with B/Tooth FREE-Nokia FREE Call MobileUpd8 on 08000839402 or2optout/HV9D",
  "h1) Go to write msg 2) Put on Dictionary mode 3)Cover the screen with hand, 4)Press  &lt;#&gt; . 5)Gently remove Ur hand.. Its interesting..:)",
  "hOkie...",
  "hHi this is yijue, can i meet u at 11 tmr?",
  "hIts posible dnt live in  &lt;#&gt; century cm frwd n thnk different",
  "hBut i dint slept in afternoon.",
  "hThat seems unnecessarily affectionate",
  "hYar else i'll thk of all sorts of funny things.",
  "hYou will be in the place of that man",
  "sDownload as many ringtones as u like no restrictions, 1000s 2 choose. U can even send 2 yr buddys. Txt Sir to 80082 £3 ",
  "hThats cool. How was your day?",
  "sPlease CALL 08712402902 immediately as there is an urgent message waiting for you.",
  "hR we going with the  &lt;#&gt;  bus?",
  "hHello, my love ! How went your day ? Are you alright ? I think of you, my sweet and send a jolt to your heart to remind you ... I LOVE YOU! Can you hear it ? I screamed it across the sea for all the world to hear. Ahmad al Hallaq is loved ! and owned ! *possessive passionate kiss*",
  "hNo..he joined today itself.",
  "hOkay same with me. Well thanks for the clarification",
  "hI'll talk to the others and probably just come early tomorrow then",
  "sSpook up your mob with a Halloween collection of a logo & pic message plus a free eerie tone, txt CARD SPOOK to 8007 zed 08701417012150p per logo/pic",
  "hHad the money issue weigh me down but thanks to you, I can breathe easier now. I.ll make sure you dont regret it. Thanks.",
  "hHi. I'm sorry i missed your call. Can you pls call back.",
  "hHow are you doing? Hope you've settled in for the new school year. Just wishin you a gr8 day",
  "sFantasy Football is back on your TV. Go to Sky Gamestar on Sky Active and play £250k Dream Team. Scoring starts on Saturday, so register now!SKY OPT OUT to 88088",
  "hOk then no need to tell me anything i am going to sleep good night",
  "hOk try to do week end course in coimbatore.",
  "sTone Club: Your subs has now expired 2 re-sub reply MONOC 4 monos or POLYC 4 polys 1 weekly @ 150p per week Txt STOP 2 stop This msg free Stream 0871212025016",
  "hV nice! Off 2 sheffield tom 2 air my opinions on categories 2 b used 2 measure ethnicity in next census. Busy transcribing. :-)",
  "hIf you r @ home then come down within 5 min",
  "hA Boy loved a gal. He propsd bt she didnt mind. He gv lv lttrs, Bt her frnds threw thm. Again d boy decided 2 aproach d gal , dt time a truck was speeding towards d gal. Wn it was about 2 hit d girl,d boy ran like hell n saved her. She asked 'hw cn u run so fast?' D boy replied \"Boost is d secret of my energy\" n instantly d girl shouted \"our energy\" n Thy lived happily 2gthr drinking boost evrydy Moral of d story:- I hv free msgs:D;): gud ni8",
  "hThat day ü say ü cut ur hair at paragon, is it called hair sense? Do ü noe how much is a hair cut? ",
  "hHmm, too many of them unfortunately... Pics obviously arent hot cakes. Its kinda fun tho",
  "hWatching tv lor... Y she so funny we bluff her 4 wat. Izzit because she thk it's impossible between us?",
  "sXMAS Prize draws! We are trying to contact U. Todays draw shows that you have won a £2000 prize GUARANTEED. Call 09058094565 from land line. Valid 12hrs only",
  "hDunno lei he neva say...",
  "hThanx 4 2day! U r a goodmate I THINK UR RITE SARY! ASUSUAL!1 U CHEERED ME UP! LOVE U FRANYxxxxx",
  "hI'm on my way home. Went to change batt 4 my watch then go shop a bit lor.",
  "sYES! The only place in town to meet exciting adult singles is now in the UK. Txt CHAT to 86688 now! 150p/Msg.",
  "hHi, Mobile no.  &lt;#&gt;  has added you in their contact list on www.fullonsms.com It s a great place to send free sms to people For more visit fullonsms.com",
  "hGood evening Sir, hope you are having a nice day. I wanted to bring it to your notice that I have been late in paying rent for the past few months and have had to pay a $ &lt;#&gt;  charge. I felt it would be inconsiderate of me to nag about something you give at great cost to yourself and that's why i didnt speak up. I however am in a recession and wont be able to pay the charge this month hence my askin well ahead of month's end. Can you please help. Thank you for everything.",
  "hIf i let you do this, i want you in the house by 8am.",
  "hBest line said in Love: . \"I will wait till the day I can forget u Or The day u realize that u cannot forget me.\"... Gn",
  "hI will reach before ten morning",
  "hYour pussy is perfect!",
  "hSorry, I'll call later",
  "sSomeone has contacted our dating service and entered your phone becausethey fancy you! To find out who it is call from a landline 09058098002. PoBox1, W14RG 150p",
  "hNo message..no responce..what happend?",
  "hAlso where's the piece",
  "hwiskey Brandy Rum Gin Beer Vodka Scotch Shampain Wine \"KUDI\"yarasu dhina vaazhthukkal. ..",
  "hBoo. How's things? I'm back at home and a little bored already :-(",
  "hFirst has she gained more than  &lt;#&gt; kg since she took in. Second has she done the blood sugar tests. If she has and its ok and her blood pressure is within normal limits then no worries",
  "hPICK UR FONE UP NOW U DUMB?",
  "hThanks da thangam, i feel very very happy dear. I also miss you da.",
  "hOkey doke. I'm at home, but not dressed cos laying around ill! Speak to you later bout times and stuff. ",
  "hI don't run away frm u... I walk slowly &amp; it kills me that u don't care enough to stop me...",
  "hBabe, I'm back ... Come back to me ...",
  "hWell you told others you'd marry them...",
  "hNeshanth..tel me who r u?",
  "hYO YO YO BYATCH WHASSUP?",
  "hOh... Kay... On sat right?",
  "hHi! This is Roger from CL. How are you?",
  "sBabe: U want me dont u baby! Im nasty and have a thing 4 filthyguys. Fancy a rude time with a sexy bitch. How about we go slo n hard! Txt XXX SLO(4msgs)",
  "hOh oh... Wasted... Den muz chiong on sat n sun liao...",
  "hJesus christ bitch I'm trying to give you drugs answer your fucking phone",
  "hPlease give it 2  or i will pick it up on Tuesday evening about 8 if that is ok.",
  "hI'm meeting Darren...",
  "hOne of best dialogue in cute reltnship..!! \"Wen i Die, Dont Come Near My Body..!! Bcoz My Hands May Not Come 2 Wipe Ur Tears Off That Time..!Gud ni8",
  "hSolve d Case : A Man Was Found Murdered On  &lt;DECIMAL&gt; . &lt;#&gt;  AfterNoon. 1,His wife called Police. 2,Police questioned everyone. 3,Wife: Sir,I was sleeping, when the murder took place. 4.Cook: I was cooking. 5.Gardener: I was picking vegetables. 6.House-Maid: I went 2 d post office. 7.Children: We went 2 play. 8.Neighbour: We went 2 a marriage. Police arrested d murderer Immediately. Who's It? Reply With Reason, If U r Brilliant.",
  "hDear where you will be when i reach there",
  "hAww that's the first time u said u missed me without asking if I missed u first. You DO love me! :)",
  "hOk... Thanx... Gd nite 2 ü too...",
  "hCome to me right now, Ahmad",
  "sI don't know u and u don't know me. Send CHAT to 86688 now and let's find each other! Only 150p/Msg rcvd. HG/Suite342/2Lands/Row/W1J6HL LDN. 18 years or over.",
  "hLol please do. Actually send a pic of yourself right now. I wanna see. Pose with a comb and hair dryer or something.",
  "hO was not into fps then.",
  "hHuh means computational science... Y they like dat one push here n there...",
  "hCould you not read me, my Love ? I answered you",
  "hOh... Lk tt den we take e one tt ends at cine lor... Dun wan yogasana oso can... ",
  "hMadam,regret disturbance.might receive a reference check from DLF Premarica.kindly be informed.Rgds,Rakhesh,Kerala.",
  "sSMS SERVICES For your inclusive text credits pls gotto www.comuk.net login 3qxj9 unsubscribe with STOP no extra charge help 08702840625 comuk.220cm2 9AE",
  "hOic... Then better quickly go bathe n settle down...",
  "hErr... Cud do. I'm going to  at 8pm. I haven't got a way to contact him until then.",
  "hA bloo bloo bloo I'll miss the first bowl",
  "hLmao but its so fun...",
  "hOh k k:)but he is not a big hitter.anyway good",
  "hHey!!! I almost forgot ... Happy B-day babe ! I love ya!!",
  "sValentines Day Special! Win over £1000 in our quiz and take your partner on the trip of a lifetime! Send GO to 83600 now. 150p/msg rcvd. CustCare:08718720201",
  "hDo you think i can move  &lt;#&gt;  in a week",
  "hShe.s find. I sent you an offline message to know how anjola's now.",
  "sGuess who am I?This is the first time I created a web page WWW.ASJESUS.COM read all I wrote. I'm waiting for your opinions. I want to be your friend 1/1",
  "hHow was txting and driving",
  "hThat's good. Lets thank God. Please complete the drug. Have lots of water. And have a beautiful day.",
  "hReally dun bluff me leh... U sleep early too. Nite...",
  "hIndians r poor but India is not a poor country. Says one of the swiss bank directors. He says that \" &lt;#&gt;  lac crore\" of Indian money is deposited in swiss banks which can be used for 'taxless' budget for  &lt;#&gt;  yrs. Can give  &lt;#&gt;  crore jobs to all Indians. From any village to Delhi 4 lane roads. Forever free power suply to more than  &lt;#&gt;  social projects. Every citizen can get monthly  &lt;#&gt; /- for  &lt;#&gt;  yrs. No need of World Bank &amp; IMF loan. Think how our money is blocked by rich politicians. We have full rights against corrupt politicians. Itna forward karo ki pura INDIA padhe.g.m.\"",
  "hUncle boye. I need movies oh. Guide me. Plus you know torrents are not particularly legal here. And the system is slowing down. What should i do. Have a gr8 day. Plus have you started cos i dont meet you online. How was the honey moon.",
  "hOh ya ya. I remember da. .",
  "hBtw regarding that we should really try to see if anyone else can be our 4th guy before we commit to a random dude",
  "sFor ur chance to win £250 cash every wk TXT: PLAY to 83370. T's&C's www.music-trivia.net custcare 08715705022, 1x150p/wk.",
  "hI not busy juz dun wan 2 go so early.. Hee.. ",
  "hRightio. 11.48 it is then. Well arent we all up bright and early this morning.",
  "hGreat. I'm in church now, will holla when i get out",
  "hBack in brum! Thanks for putting us up and keeping us all and happy. See you soon ",
  "hI donno if they are scorable",
  "h&lt;#&gt;  great loxahatchee xmas tree burning update: you can totally see stars here",
  "hYes but i dont care! I need you bad, princess!",
  "hThe guy (kadeem) hasn't been selling since the break, I know one other guy but he's paranoid as fuck and doesn't like selling without me there and I can't be up there til late tonight",
  "hSorry, I'll call later",
  "hTmr then ü brin lar... Aiya later i come n c lar... Mayb ü neva set properly ü got da help sheet wif ü...",
  "hDo u knw dis no. &lt;#&gt; ?",
  "hThen she dun believe wat?",
  "hK..give back my thanks.",
  "hI know complain num only..bettr directly go to bsnl offc nd apply for it..",
  "hOkay. I've seen it. So i should pick it on friday?",
  "hHow much she payed. Suganya.",
  "hLeft dessert. U wan me 2 go suntec look 4 u?",
  "hAbeg, make profit. But its a start. Are you using it to get sponsors for the next event?",
  "hOnum ela pa. Normal than.",
  "hK.k..how is your sister kids?",
  "hCool, I'll text you when I'm on the way",
  "hNope. Meanwhile she talk say make i greet you.",
  "hi cant talk to you now.i will call when i can.dont keep calling.",
  "hAnything lar...",
  "hRose needs water, season needs change, poet needs imagination..My phone needs ur sms and i need ur lovely frndship forever....",
  "hGood afternoon, babe. How goes that day ? Any job prospects yet ? I miss you, my love ... *sighs* ... :-(",
  "hThey will pick up and drop in car.so no problem..",
  "hS.i think he is waste for rr..",
  "hHe is world famamus....",
  "hIs there coming friday is leave for pongal?do you get any news from your work place.",
  "hLol well don't do it without me. We could have a big sale together.",
  "h* Am on my way",
  "hEat at old airport road... But now 630 oredi... Got a lot of pple...",
  "hsry can't talk on phone, with parents",
  "sFinal Chance! Claim ur £150 worth of discount vouchers today! Text YES to 85023 now! SavaMob, member offers mobile! T Cs SavaMob POBOX84, M263UZ. £3.00 Subs 16",
  "hOk lor wat time ü finish?",
  "hPrincess, i like to make love  &lt;#&gt;  times per night. Hope thats not a problem!",
  "hMm i am on the way to railway",
  "hi dnt wnt to tlk wid u",
  "hI'm done. I'm sorry. I hope your next space gives you everything you want. Remember all the furniture is yours. If i'm not around when you move it, just lock all the locks and leave the key with jenne.",
  "hNot yet. Just i'd like to keep in touch and it will be the easiest way to do that from barcelona. By the way how ru and how is the house?",
  "sSppok up ur mob with a Halloween collection of nokia logo&pic message plus a FREE eerie tone, txt CARD SPOOK to 8007",
  "sUrgent! call 09066612661 from landline. Your complementary 4* Tenerife Holiday or £10,000 cash await collection SAE T&Cs PO Box 3 WA14 2PX 150ppm 18+ Sender: Hol Offer",
  "hK.:)do it at evening da:)urgent:)",
  "hPansy! You've been living in a jungle for two years! Its my driving you should be more worried about!",
  "hMm have some kanji dont eat anything heavy ok",
  "hOnly if you promise your getting out as SOON as you can. And you'll text me in the morning to let me know you made it in ok.",
  "hLol that's different. I don't go trying to find every real life photo you ever took.",
  "hI dont thnk its a wrong calling between us",
  "hK ill drink.pa then what doing. I need srs model pls send it to my mail id pa.",
  "hAiyah e rain like quite big leh. If drizzling i can at least run home.",
  "hI have 2 docs appointments next week.:/ I'm tired of them shoving stuff up me. Ugh why couldn't I have had a normal body?",
  "hDun b sad.. It's over.. Dun thk abt it already. Concentrate on ur other papers k.",
  "hGreetings me, ! Consider yourself excused.",
  "hNo drama Pls.i have had enough from you and family while i am struggling in the hot sun in a strange place.No reason why there should be an ego of not going 'IF NOT INVITED' when actually its necessity to go.wait for very serious reppurcussions.",
  "hthey released another Italian one today and it has a cosign option",
  "hYou at mu? You should try to figure out how much money everyone has for gas and alcohol, jay and I are trying to figure out our weed budget",
  "sWINNER! As a valued network customer you hvae been selected to receive a £900 reward! To collect call 09061701444. Valid 24 hours only. ACL03530150PM",
  "hHCL chennai requires FRESHERS for voice process.Excellent english needed.Salary upto  &lt;#&gt; .Call Ms.Suman  &lt;#&gt;  for Telephonic interview -via Indyarocks.com",
  "hDai what this da.. Can i send my resume to this id.",
  "hI know where the  &lt;#&gt;  is, I'll be there around 5",
  "hYup i've finished c ü there...",
  "hRemember to ask alex about his pizza",
  "hNo da..today also i forgot..",
  "hOla would get back to you maybe not today but I ve told him you can be his direct link in the US in getting cars he bids for online, you arrange shipping and you get a cut. Or U????? For a partnership where U????? Invest money for shipping and he takes care of the rest!U??Wud b self reliant soon dnt worry",
  "hFwiw the reason I'm only around when it's time to smoke is that because of gas I can only afford to be around when someone tells me to be and that apparently only happens when somebody wants to light up",
  "hHello, my boytoy! I made it home and my constant thought is of you, my love. I hope your having a nice visit but I can't wait till you come home to me ...*kiss*",
  "hCongrats kano..whr s the treat maga?",
  "hWho u talking about?",
  "hYup...",
  "hOk...",
  "hU wake up already? Wat u doing? U picking us up later rite? I'm taking sq825, reaching ard 7 smth 8 like dat. U can check e arrival time. C ya soon...",
  "hYunny i'm walking in citylink now ü faster come down... Me very hungry...",
  "hEr yep sure. Props?",
  "hHiya , have u been paying money into my account? If so, thanks. Got a pleasant surprise when i checked my balance -u c, i don't get statements 4 that acc",
  "sU have won a nokia 6230 plus a free digital camera. This is what u get when u win our FREE auction. To take part send NOKIA to 83383 now. POBOX114/14TCR/W1 16",
  "hOk ill send you with in  &lt;DECIMAL&gt;  ok.",
  "hBognor it is! Should be splendid at this time of year.",
  "hYes.i'm in office da:)",
  "hSorry, I'll call later",
  "hJoy's father is John. Then John is the NAME of Joy's father. Mandan",
  "hOk. I only ask abt e movie. U wan ktv oso?",
  "hMisplaced your number and was sending texts to your old number. Wondering why i've not heard from you this year. All the best in your mcat. Got this number from my atlanta friends",
  "hSorry, I'll call later",
  "hDunno lei... I might b eatin wif my frens... If ü wan to eat then i wait 4 ü lar",
  "hSorry, I'll call later",
  "sFREE entry into our £250 weekly comp just send the word WIN to 80086 NOW. 18 T&C www.txttowin.co.uk",
  "hSay this slowly.? GOD,I LOVE YOU &amp; I NEED YOU,CLEAN MY HEART WITH YOUR BLOOD.Send this to Ten special people &amp; u c miracle tomorrow, do it,pls,pls do it...",
  "hDo u noe how 2 send files between 2 computers?",
  "hMmmmm ... I loved waking to your words this morning ! I miss you too, my Love. I hope your day goes well and you are happy. I wait for us to be together again",
  "hjay says he'll put in  &lt;#&gt;",
  "hCan you just come in for a sec? There's somebody here I want you to see",
  "hSo the sun is anti sleep medicine.",
  "hWhat's happening with you. Have you gotten a job and have you begun registration for permanent residency",
  "hYup ok...",
  "hGlad it went well :) come over at 11 then we'll have plenty of time before claire goes to work.",
  "hOk enjoy . R u there in home.",
  "hCan you pls pls send me a mail on all you know about relatives coming to deliver here? All you know about costs, risks, benefits and anything else. Thanks.",
  "hYou do what all you like",
  "hThat's y we haf to combine n c how lor...",
  "hThe monthly amount is not that terrible and you will not pay anything till 6months after finishing school.",
  "hHmmm:)how many players selected?",
  "hThey said if its gonna snow, it will start around 8 or 9 pm tonite! They are predicting an inch of accumulation.",
  "hI dont. Can you send it to me. Plus how's mode.",
  "hAiyo please ü got time meh.",
  "hPackage all your programs well",
  "hShe is our sister.. She belongs 2 our family.. She is d hope of tomorrow.. Pray 4 her,who was fated 4 d Shoranur train incident. Lets hold our hands together &amp; fuelled by love &amp; concern prior 2 her grief &amp; pain. Pls join in dis chain &amp; pass it. STOP VIOLENCE AGAINST WOMEN.",
  "hSo are you guys asking that i get that slippers again or its gone with last year",
  "hCompany is very good.environment is terrific and food is really nice:)",
  "sText82228>> Get more ringtones, logos and games from www.txt82228.com. Questions: info@txt82228.co.uk",
  "hHonestly i've just made a lovely cup of tea and promptly dropped my keys in it and then burnt my fingers getting them out!",
  "hYup but not studying surfing lor. I'm in e lazy mode today.",
  "hPlease sen :)my kind advice :-)please come here and try:-)",
  "hI'm done. C ü there.",
  "hOh fine, I'll be by tonight",
  "hÜ give me some time to walk there.",
  "hI'll reach in ard 20 mins ok...",
  "sFreeMSG You have been awarded a FREE mini DIGITAL CAMERA, just reply SNAP to collect your prize! (quizclub Opt out? Stop 80122300p/wk SP:RWM Ph:08704050406)",
  "hFuck babe ... What happened to you ? How come you never came back?",
  "sThis message is brought to you by GMW Ltd. and is not connected to the",
  "hSome friends want me to drive em someplace, probably take a while",
  "hI also thk too fast... Xy suggest one not me. U dun wan it's ok. Going 2 rain leh where got gd.",
  "hAre you still getting the goods.",
  "hAnd maybe some pressies",
  "hYeah I am, so I'll leave maybe 7ish?",
  "hK..k..i'm also fine:)when will you complete the course?",
  "hUnder the sea, there lays a rock. In the rock, there is an envelope. In the envelope, there is a paper. On the paper, there are 3 words... '",
  "hI told her I had a Dr appt next week. She thinks I'm gonna die. I told her its just a check. Nothing to be worried about. But she didn't listen.",
  "hYou in your room? I need a few",
  "hI dont want to hear anything",
  "hHey. For me there is no leave on friday. Wait i will ask my superior and tell you..",
  "hUltimately tor motive tui achieve korli.",
  "hFrom 5 to 2 only my work timing.",
  "h… and don‘t worry we‘ll have finished by march … ish!",
  "hThe house is on the water with a dock, a boat rolled up with a newscaster who dabbles in jazz flute behind the wheel",
  "sCongrats 2 mobile 3G Videophones R yours. call 09063458130 now! videochat wid ur mates, play java games, Dload polypH music, noline rentl. bx420. ip4. 5we. 150p",
  "sYour next amazing xxx PICSFREE1 video will be sent to you enjoy! If one vid is not enough for 2day text back the keyword PICSFREE1 to get the next video.",
  "hNow thats going to ruin your thesis!",
  "hIn sch but neva mind u eat 1st lor..",
  "hHey whats up? U sleeping all morning?",
  "hErm. I thought the contract ran out the4th of october.",
  "hI dunno until when... Lets go learn pilates...",
  "sU are subscribed to the best Mobile Content Service in the UK for £3 per ten days until you send STOP to 83435. Helpline 08706091795.",
  "hYup i'm elaborating on the safety aspects and some other issues..",
  "s3 FREE TAROT TEXTS! Find out about your love life now! TRY 3 FOR FREE! Text CHANCE to 85555 16 only! After 3 Free, Msgs £1.50 each",
  "hGoodmorning, today i am late for 1hr.",
  "hHi happy birthday. Hi hi hi hi hi hi hi",
  "hI will be outside office take all from there",
  "hIf you don't respond imma assume you're still asleep and imma start calling n shit",
  "hAight, see you in a bit",
  "hMy superior telling that friday is leave for all other department except ours:)so it will be leave for you:)any way call waheed fathima hr and conform it:)",
  "sJoin the UK's horniest Dogging service and u can have sex 2nite!. Just sign up and follow the instructions. Txt ENTRY to 69888 now! Nyt.EC2A.3LP.msg@150p",
  "hLol I have to take it. member how I said my aunt flow didn't visit for 6 months? It's cause I developed ovarian cysts. Bc is the only way to shrink them.",
  "hStill work going on:)it is very small house.",
  "hMy friend just got here and says he's upping his order by a few grams (he's got $ &lt;#&gt; ), when can you get here?",
  "hTmr timin still da same wat cos i got lesson until 6...",
  "hThat‘s the thing with apes, u can fight to the death to keep something, but the minute they have it when u let go, thats it!",
  "sSunshine Quiz Wkly Q! Win a top Sony DVD player if u know which country Liverpool played in mid week? Txt ansr to 82277. £1.50 SP:Tyrone",
  "hNo i'm not gonna be able to. || too late notice. || i'll be home in a few weeks anyway. || what are the plans",
  "hGot fujitsu, ibm, hp, toshiba... Got a lot of model how to say...",
  "hOkie... Thanx...",
  "hGosh that , what a pain. Spose I better come then.",
  "hAs usual..iam fine, happy &amp; doing well..:)",
  "hOkie",
  "hSo when you gonna get rimac access ",
  "h\"Im at arestaurant eating squid! i will be out about 10:30 wanna dosomething or is that to late?\"",
  "hYou call times job today ok umma and ask them to speed up",
  "h\"HELLO U.CALL WEN U FINISH WRK.I FANCY MEETIN UP WIV U ALL TONITE AS I NEED A BREAK FROM DABOOKS. DID 4 HRS LAST NITE+2 TODAY OF WRK!\"",
  "hR U &SAM P IN EACHOTHER. IF WE MEET WE CAN GO 2 MY HOUSE",
  "h:-) yeah! Lol. Luckily i didn't have a starring role like you!",
  "hHello madam how are you ?",
  "hAwesome, text me when you're restocked",
  "hAs usual..iam fine, happy &amp; doing well..:)",
  "sKnock Knock Txt whose there to 80082 to enter r weekly draw 4 a £250 gift voucher 4 a store of yr choice. T&Cs www.tkls.com age16 to stoptxtstop£1.50/week",
  "hYes. It's all innocent fun. O:-)",
  "hThanks for sending this mental ability question..",
  "hSir, hope your day is going smoothly. i really hoped i wont have to bother you about this. I have some bills that i can't settle this month. I am out of all extra cash. I know this is a challenging time for you also but i have to let you know.",
  "h2marrow only. Wed at  &lt;#&gt;  to 2 aha.",
  "hI went to ur hon lab but no one is there.",
  "hI cant pick the phone right now. Pls send a message",
  "hHey pple...$700 or $900 for 5 nights...Excellent location wif breakfast hamper!!!",
  "s<Forwarded from 21870000>Hi - this is your Mailbox Messaging SMS alert. You have 40 matches. Please call back on 09056242159 to retrieve your messages and matches cc100p/min",
  "hHow come?",
  "hLol! Nah wasn't too bad thanks. Its good to b home but its been quite a reality check. Hows ur day been? Did u do anything with website?",
  "hOk lor...",
  "hI'm coming home 4 dinner.",
  "hS da..al r above  &lt;#&gt;",
  "sFREE RING TONE just text \"POLYS\" to 87131. Then every week get a new tone. 0870737910216yrs only £1.50/wk.",
  "hUnni thank you dear for the recharge..Rakhesh",
  "hI know I'm lacking on most of this particular dramastorm's details but for the most part I'm not worried about that",
  "hHaha... They cant what... At the most tmr forfeit... haha so how?",
  "hHey there! Glad u r better now. I hear u treated urself to a digi cam, is it good? We r off at 9pm. Have a fab new year, c u in coupla wks!",
  "hNo way I'm going back there!",
  "sURGENT! Your mobile No 077xxx WON a £2,000 Bonus Caller Prize on 02/06/03! This is the 2nd attempt to reach YOU! Call 09066362206 ASAP! BOX97N7QP, 150ppm",
  "hI WILL CAL YOU SIR. In meeting",
  "hThat's what I love to hear :V see you sundayish, then",
  "hSorry da thangam, very very sorry i am held up with prasad.",
  "hTiwary to rcb.battle between bang and kochi.",
  "hThank god they are in bed!",
  "hNo I don't have cancer. Moms making a big deal out of a regular checkup aka pap smear",
  "hAm in gobi arts college",
  "hWhy she wants to talk to me",
  "hPandy joined 4w technologies today.he got job..",
  "sYou are guaranteed the latest Nokia Phone, a 40GB iPod MP3 player or a £500 prize! Txt word: COLLECT to No: 83355! IBHltd LdnW15H 150p/Mtmsgrcvd18",
  "hThey can try! They can get lost, in fact. Tee hee",
  "hHi! You just spoke to MANEESHA V. We'd like to know if you were satisfied with the experience. Reply Toll Free with Yes or No.",
  "hMy friends use to call the same.",
  "hSorry, I'll call later",
  "hEm, its olowoyey@ usc.edu have a great time in argentina. Not sad about secretary, everything is a blessing",
  "hIt,,s a taxt massage....tie-pos argh ok! Lool!",
  "hHi, can i please get a  &lt;#&gt;  dollar loan from you. I.ll pay you back by mid february. Pls.",
  "hYou might want to pull out more just in case and just plan on not spending it if you can, I don't have much confidence in derek and taylor's money management",
  "hDo you like shaking your booty on the dance floor?",
  "hText me when you get off, don't call, my phones having problems",
  "hNo need for the drug anymore.",
  "hSorry da:)i was thought of calling you lot of times:)lil busy.i will call you at noon..",
  "hIts sarcasm.. .nt scarcasim",
  "hGreat! I have to run now so ttyl!",
  "hFeel like trying kadeem again? :V",
  "hDai  &lt;#&gt;  naal eruku.",
  "hNot yet chikku..wat abt u?",
  "hOk...",
  "hWant to finally have lunch today?",
  "hDo you know when dad will be back?",
  "sHello darling how are you today? I would love to have a chat, why dont you tell me what you look like and what you are in to sexy?",
  "s8007 FREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 8007 Get txting and tell ur mates www.getzed.co.uk POBox 36504 W4 5WQ norm 150p/tone 16+",
  "hHe remains a bro amongst bros",
  "hR u meeting da ge at nite tmr?",
  "h* Was a nice day and, impressively, i was sensible, went home early and now feel fine. Or am i just boring?! When's yours, i can't remember.",
  "hWhy de. You looking good only:-)..",
  "sWanna get laid 2nite? Want real Dogging locations sent direct to ur mobile? Join the UK's largest Dogging Network. Txt PARK to 69696 now! Nyt. ec2a. 3lp £1.50/msg",
  "swe tried to contact you re your response to our offer of a new nokia fone and camcorder hit reply or call 08000930705 for delivery",
  "hYes. They replied my mail. I'm going to the management office later. Plus will in to bank later also.or on wednesday.",
  "hThat's cool, I'll come by like  &lt;#&gt; ish",
  "hSuper msg da:)nalla timing.",
  "hGood afternoon, my boytoy ... How are you feeling today ? Better I hope? Are you being my good boy? Are you my obedient, slave? Do you please your Queen?",
  "hI am 6 ft. We will be a good combination!",
  "hI'm sick !! I'm needy !! I want you !! *pouts* *stomps feet* Where are you ?! *pouts* *stomps feet* I want my slave !! I want him now !!",
  "h* Am on a train back from northampton so i'm afraid not!",
  "hWhere in abj are you serving. Are you staying with dad or alone.",
  "hWas playng 9 doors game and gt racing on phone lol",
  "sNew Tones This week include: 1)McFly-All Ab.., 2) Sara Jorge-Shock.. 3) Will Smith-Switch.. To order follow instructions on next message",
  "hSolve d Case : A Man Was Found Murdered On  &lt;DECIMAL&gt; . &lt;#&gt;  AfterNoon. 1,His wife called Police. 2,Police questioned everyone. 3,Wife: Sir,I was sleeping, when the murder took place. 4.Cook: I was cooking. 5.Gardener: I was picking vegetables. 6.House-Maid: I went 2 d post office. 7.Children: We went 2 play. 8.Neighbour: We went 2 a marriage. Police arrested d murderer Immediately. Who's It? Reply With Reason, If U r Brilliant.",
  "hI'm on da bus going home...",
  "hI got a call from a landline number. . . I am asked to come to anna nagar . . . I will go in the afternoon",
  "hI'm okay. Chasing the dream. What's good. What are you doing next.",
  "hYupz... I've oredi booked slots 4 my weekends liao... ",
  "sURGENT! We are trying to contact U. Todays draw shows that you have won a £800 prize GUARANTEED. Call 09050003091 from land line. Claim C52. Valid 12hrs only",
  "hThere r many model..sony ericson also der.. &lt;#&gt; ..it luks good bt i forgot modl no",
  "hOkie",
  "hYes I know the cheesy songs from frosty the snowman :)",
  "hYa ok, vikky vl c witin  &lt;#&gt; mins and il reply u..",
  "ssports fans - get the latest sports news str* 2 ur mobile 1 wk FREE PLUS a FREE TONE Txt SPORT ON to 8007 www.getzed.co.uk 0870141701216+ norm 4txt/120p ",
  "hHey tmr meet at bugis 930 ?",
  "sUrgent Urgent! We have 800 FREE flights to Europe to give away, call B4 10th Sept & take a friend 4 FREE. Call now to claim on 09050000555. BA128NNFWFLY150ppm",
  "hAll these nice new shirts and the only thing I can wear them to is nudist themed ;_; you in mu?",
  "hHey sexy buns! What of that day? No word from you this morning on YM ... :-( ... I think of you",
  "hAnd whenever you and i see we can still hook up too.",
  "hNope but i'm going home now then go pump petrol lor... Like going 2 rain soon...",
  "hCan you use foreign stamps for whatever you send them off for? ",
  "sFROM 88066 LOST £12 HELP",
  "hOh baby of the house. How come you dont have any new pictures on facebook",
  "hFeb  &lt;#&gt;  is \"I LOVE U\" day. Send dis to all ur \"VALUED FRNDS\" evn me. If 3 comes back u'll gt married d person u luv! If u ignore dis u will lose ur luv 4 Evr",
  "hHiya, sorry didn't hav signal. I haven't seen or heard from and neither has, which is unusual in itself! I'll put on the case and get him to sort it out! Hugs and snogs.",
  "hOmw back to tampa from west palm, you hear what happened?",
  "hYup no more already... Thanx 4 printing n handing it up.",
  "sFreeMsg: Fancy a flirt? Reply DATE now & join the UKs fastest growing mobile dating service. Msgs rcvd just 25p to optout txt stop to 83021. Reply DATE now!",
  "hWhat i mean is do they come chase you out when its over or is it stated you can watch as many movies as you want.",
  "hS now only i took tablets . Reaction morning only.",
  "sGreat NEW Offer - DOUBLE Mins & DOUBLE Txt on best Orange tariffs AND get latest camera phones 4 FREE! Call MobileUpd8 free on 08000839402 NOW! or 2stoptxt T&Cs",
  "hNah, I'm a perpetual DD",
  "hSorry de i went to shop.",
  "sHope you enjoyed your new content. text stop to 61610 to unsubscribe. help:08712400602450p Provided by tones2you.co.uk",
  "hWen ur lovable bcums angry wid u, dnt take it seriously.. Coz being angry is d most childish n true way of showing deep affection, care n luv!.. kettoda manda... Have nice day da.",
  "hHey you still want to go for yogasana? Coz if we end at cine then can go bathe and hav the steam bath",
  "hNope i'm not drivin... I neva develop da photos lei...",
  "hI am thinking of going down to reg for pract lessons.. Flung my advance.. Haha wat time u going?",
  "hCool. I am  &lt;#&gt;  inches long. hope you like them big!",
  "hHouse-Maid is the murderer, coz the man was murdered on  &lt;#&gt; th January.. As public holiday all govt.instituitions are closed,including post office..understand?",
  "hOkie.. Thanx..",
  "s18 days to Euro2004 kickoff! U will be kept informed of all the latest news and results daily. Unsubscribe send GET EURO STOP to 83222.",
  "hGo where n buy? Juz buy when we get there lar.",
  "hOk lor...",
  "hI'm working technical support :)voice process.",
  "hIt's justbeen overa week since we broke up and already our brains are going to mush!",
  "hTunde, how are you doing. This is just wishing you a great day. Abiola.",
  "hNope... C ü then...",
  "hNo. But we'll do medical missions to nigeria",
  "hNo i am not having not any movies in my laptop",
  "hWhatsup there. Dont u want to sleep",
  "sUrgent Please call 09066612661 from landline. £5000 cash or a luxury 4* Canary Islands Holiday await collection. T&Cs SAE award. 20M12AQ. 150ppm. 16+ “",
  "sUrgent! Please call 09066612661 from your landline, your complimentary 4* Lux Costa Del Sol holiday or £1000 CASH await collection. ppm 150 SAE T&Cs James 28, EH74RR",
  "hI havent lei.. Next mon can?",
  "hMm feeling sleepy. today itself i shall get that dear",
  "hHow dare you stupid. I wont tell anything to you. Hear after i wont talk to you:-.",
  "hDo ü noe if ben is going?",
  "hCan you do a mag meeting this avo at some point?",
  "hI meant middle left or right?",
  "hReally? I crashed out cuddled on my sofa.",
  "hHi Chachi tried calling u now unable to reach u .. Pl give me a missed cal once u c tiz msg  Kanagu",
  "hI sent you the prices and do you mean the  &lt;#&gt; g,",
  "hAre you this much buzy",
  "hNothing. Can...",
  "sI don't know u and u don't know me. Send CHAT to 86688 now and let's find each other! Only 150p/Msg rcvd. HG/Suite342/2Lands/Row/W1J6HL LDN. 18 years or over.",
  "hNo * am working on the ringing u thing but have whole houseful of screaming brats so * am pulling my hair out! Loving u",
  "hBut my family not responding for anything. Now am in room not went to home for diwali but no one called me and why not coming. It makes me feel like died.",
  "hTick, tick, tick ... Babe",
  "hR ü going 4 today's meeting?",
  "hK da:)how many page you want?",
  "hYa had just now.onion roast.",
  "hSend his number and give reply tomorrow morning for why you said that to him like that ok",
  "hYou said not now. No problem. When you can. Let me know.",
  "hOk but tell me half an hr b4 u come i need 2 prepare.",
  "hPlay w computer? Aiyah i tok 2 u lor?",
  "hSat right? Okay thanks... ",
  "hDerp. Which is worse, a dude who always wants to party or a dude who files a complaint about the three drug abusers he lives with",
  "hOk Chinese food on its way. When I get fat you're paying for my lipo.",
  "hWe r outside already.",
  "hHave a good trip. Watch out for . Remember when you get back we must decide about easter.",
  "hYo we are watching a movie on netflix",
  "hWhat time. I‘m out until prob 3 or so",
  "hCan meh? Thgt some will clash... Really ah, i dun mind... I dun seen to have lost any weight... Gee...",
  "hI dont thnk its a wrong calling between us",
  "hI am not sure about night menu. . . I know only about noon menu",
  "hARR birthday today:) i wish him to get more oscar.",
  "hSay this slowly.? GOD,I LOVE YOU &amp; I NEED YOU,CLEAN MY HEART WITH YOUR BLOOD.Send this to Ten special people &amp; u c miracle tomorrow, do it,pls,pls do it...",
  "hOpen rebtel with firefox. When it loads just put plus sign in the user name place, and it will show you two numbers. The lower number is my number. Once you pick that number the pin will display okay!",
  "h and  picking them up from various points",
  "sMarried local women looking for discreet action now! 5 real matches instantly to your phone. Text MATCH to 69969 Msg cost 150p 2 stop txt stop BCMSFWC1N3XX",
  "hWow v v impressed. Have funs shopping!",
  "hI am on the way to ur home",
  "sBurger King - Wanna play footy at a top stadium? Get 2 Burger King before 1st Sept and go Large or Super with Coca-Cola and walk out a winner",
  "hNo problem. Talk to you later",
  "hThen ur sis how?",
  "hStill in customer place",
  "sHow come it takes so little time for a child who is afraid of the dark to become a teenager who wants to stay out all night?",
  "hDude u knw also telugu..thts gud..k, gud nyt..",
  "hWe confirm eating at esplanade?",
  "hSend me your id and password",
  "hKind of. Took it to garage. Centre part of exhaust needs replacing. Part ordered n taking it to be fixed tomo morning.",
  "sFor ur chance to win a £250 cash every wk TXT: ACTION to 80608. T's&C's www.movietrivia.tv custcare 08712405022, 1x150p/wk.",
  "hWell I might not come then...",
  "hLong after I quit. I get on only like 5 minutes a day as it is.",
  "hThen its most likely called Mittelschmertz. Google it. If you dont have paracetamol dont worry it will go.",
  "hWell at this right I'm gonna have to get up and check today's steam sales/pee so text me when you want me to come get you",
  "hJust arrived, see you in a couple days &lt;3",
  "hK, wat s tht incident?",
  "hYeah get the unlimited",
  "hcThen i thk shd b enuff.. Still got conclusion n contents pg n references.. I'll b doing da contents pg n cover pg..",
  "hForgot it takes me 3 years to shower, sorry. Where you at/your phone dead yet?",
  "hÜ got wat to buy tell us then ü no need to come in again.",
  "hWhen you are big..| God will bring success.",
  "sU’ve Bin Awarded £50 to Play 4 Instant Cash. Call 08715203028 To Claim. EVERY 9th Player Wins Min £50-£500. OptOut 08718727870",
  "h… we r stayin here an extra week, back next wed. How did we do in the rugby this weekend? Hi to and and , c u soon \"",
  "hWell there's still a bit left if you guys want to tonight",
  "hNot from this campus. Are you in the library?",
  "hThe affidavit says  &lt;#&gt;  E Twiggs St, division g, courtroom  &lt;#&gt; , &lt;TIME&gt;  AM. I'll double check and text you again tomorrow",
  "hHow will I creep on you now? ;_;",
  "hTell your friends what you plan to do on Valentines day @ &lt;URL&gt;",
  "hIf I get there before you after your ten billion calls and texts so help me god",
  "hPurity of friendship between two is not about smiling after reading the forwarded message..Its about smiling just by seeing the name. Gud evng musthu",
  "hI've told him that i've returned it. That should i re order it.",
  "hHouse-Maid is the murderer, coz the man was murdered on  &lt;#&gt; th January.. As public holiday all govt.instituitions are closed,including post office..",
  "hDepends on where u going lor.",
  "hAnd smile for me right now as you go and the world will wonder what you are smiling about and think your crazy and keep away from you ... *grins*",
  "sFreeMsg>FAV XMAS TONES!Reply REAL",
  "hLil fever:) now fine:)",
  "hI think it's all still in my car",
  "hCan a not?",
  "sDecember only! Had your mobile 11mths+? You are entitled to update to the latest colour camera mobile for Free! Call The Mobile Update Co FREE on 08002986906 ",
  "hYes princess! I want to catch you with my big strong hands...",
  "hOh yeah I forgot. U can only take 2 out shopping at once.",
  "hMm so you asked me not to call radio",
  "hThinkin about someone is all good. No drugs for that",
  "hSay this slowly.? GOD,I LOVE YOU &amp; I NEED YOU,CLEAN MY HEART WITH YOUR BLOOD.Send this to Ten special people &amp; u c miracle tomorrow, do it,pls,pls do it...",
  "hEnjoy the showers of possessiveness poured on u by ur loved ones, bcoz in this world of lies, it is a golden gift to be loved truly..",
  "hAlright if you're sure, let me know when you're leaving",
  "hSome are lasting as much as 2 hours. You might get lucky.",
  "hGenius what's up. How your brother. Pls send his number to my skype.",
  "sGr8 Poly tones 4 ALL mobs direct 2u rply with POLY TITLE to 8007 eg POLY BREATHE1 Titles: CRAZYIN, SLEEPINGWITH, FINEST, YMCA :getzed.co.uk POBox365O4W45WQ 300p",
  "hThk some of em find wtc too far... Weiyi not goin... E rest i dunno yet... R ur goin 4 dinner den i might b able to join...",
  "hDon't forget who owns you and who's private property you are ... And be my good boy always .. *passionate kiss*",
  "sINTERFLORA - “It's not too late to order Interflora flowers for christmas call 0800 505060 to place your order before Midnight tomorrow.",
  "hOh god..taken the teeth?is it paining",
  "sROMCAPspam Everyone around should be responding well to your presence since you are so warm and outgoing. You are bringing in a real breath of sunshine.",
  "hThen u ask darren go n pick u lor... But i oso sian tmr haf 2 meet lect...",
  "hNo need to buy lunch for me.. I eat maggi mee..",
  "sCongratulations - Thanks to a good friend U have WON the £2,000 Xmas prize. 2 claim is easy, just call 08712103738 NOW! Only 10p per minute. BT-national-rate",
  "hOk lor...",
  "hOh right, ok. I'll make sure that i do loads of work during the day!  got a really nasty cough today and is dry n shot so that should really help it!",
  "hWife.how she knew the time of murder exactly",
  "sSend a logo 2 ur lover - 2 names joined by a heart. Txt LOVE NAME1 NAME2 MOBNO eg LOVE ADAM EVE 07123456789 to 87077 Yahoo! POBox36504W45WQ TxtNO 4 no ads 150p.",
  "hHowz that persons story",
  "hThanx 4 sending me home...",
  "hIts normally hot mail. Com you see!",
  "sYou've won tkts to the EURO2004 CUP FINAL or £800 CASH, to collect CALL 09058099801 b4190604, POBOX 7876150ppm",
  "hU sick still can go shopping?",
  "hYa they are well and fine., BBD(pooja) full pimples..even she become quite black..and ur rite here its too cold, wearing sweatter..",
  "hNice.nice.how is it working?",
  "h1's reach home call me.",
  "hWere trying to find a Chinese food place around here",
  "hEasy mate, * guess the quick drink was bit ambitious.",
  "hBABE !!! I miiiiiiissssssssss you ! I need you !!! I crave you !!! :-( ... Geeee ... I'm so sad without you babe ... I love you ...",
  "hOk thanx...",
  "haathi..where are you dear..",
  "hTunji, how's the queen? how are you doing. This is just wishing you a great day. Abiola.",
  "hToday iZ Yellow rose day. If u love my frndship give me 1 misscall &amp; send this to ur frndZ &amp; See how many miss calls u get. If u get 6missed U marry ur Lover.",
  "hWill be out of class in a few hours. Sorry",
  "hWat time u finish ur lect today?",
  "sFree-message: Jamster!Get the crazy frog sound now! For poly text MAD1, for real text MAD2 to 88888. 6 crazy sounds for just 3 GBP/week! 16+only! T&C's apply",
  "hSad story of a Man - Last week was my b'day. My Wife did'nt wish me. My Parents forgot n so did my Kids . I went to work. Even my Colleagues did not wish. As I entered my cabin my PA said, '' Happy B'day Boss !!''. I felt special. She askd me 4 lunch. After lunch she invited me to her apartment. We went there. She said,'' do u mind if I go into the bedroom for a minute ? '' ''OK'', I sed in a sexy mood. She came out 5 minuts latr wid a cake...n My Wife, My Parents, My Kidz, My Friends n My Colleagues. All screaming.. SURPRISE !! and I was waiting on the sofa.. ... ..... ' NAKED...!",
  "sYOUR CHANCE TO BE ON A REALITY FANTASY SHOW call now = 08707509020 Just 20p per min NTT Ltd, PO Box 1327 Croydon CR9 5WB 0870 is a national = rate call",
  "hShe's fine. Good to hear from you. How are you my dear? Happy new year oh.",
  "hAre you going to wipro interview today?",
  "hhow tall are you princess?",
  "hI doubt you could handle 5 times per night in any case...",
  "hHaha... Hope ü can hear the receipt sound... Gd luck!",
  "hYour gonna be the death if me. I'm gonna leave a note that says its all robs fault. Avenge me.",
  "hJapanese Proverb: If one Can do it, U too Can do it, If none Can do it,U must do it Indian version: If one Can do it, LET HIM DO it.. If none Can do it,LEAVE it!! And finally Kerala version: If one can do it, Stop him doing it.. If none can do it, Make a strike against it ...",
  "hToday i'm not workin but not free oso... Gee... Thgt u workin at ur fren's shop ? ",
  "hIn life when you face choices Just toss a coin not becoz its settle the question But while the coin in the air U will know what your heart is hoping for. Gudni8",
  "hDo you know why god created gap between your fingers..? So that, One who is made for you comes &amp; fills those gaps by holding your hand with LOVE..!",
  "hI want to be there so i can kiss you and feel you next to me",
  "hI am not at all happy with what you saying or doing",
  "sAdult 18 Content Your video will be with you shortly",
  "hOk that would b lovely, if u r sure. Think about wot u want to do, drinkin, dancin, eatin, cinema, in, out, about... Up to u! Wot about ? ",
  "hWhat I'm saying is if you haven't explicitly told nora I know someone I'm probably just not gonna bother",
  "hHe says hi and to get your ass back to south tampa (preferably at a kegger)",
  "hSmith waste da.i wanna gayle.",
  "hMum, i've sent you many many messages since i got here. I just want to know that you are actually getting them. Do enjoy the rest of your day.",
  "hAight, tomorrow around  &lt;#&gt;  it is",
  "hHouse-Maid is the murderer, coz the man was murdered on  &lt;#&gt; th January.. As public holiday all govt.instituitions are closed,including post office..understand?",
  "sYOUR CHANCE TO BE ON A REALITY FANTASY SHOW call now = 08707509020 Just 20p per min NTT Ltd, PO Box 1327 Croydon CR9 5WB 0870 is a national = rate call.",
  "hI actually did for the first time in a while. I went to bed not too long after i spoke with you. Woke up at 7. How was your night?",
  "hSee you there! ",
  "hI dont understand your message.",
  "hCrucify is c not s. You should have told me earlier.",
  "hIdk. You keep saying that you're not, but since he moved, we keep butting heads over freedom vs. responsibility. And i'm tired. I have so much other shit to deal with that i'm barely keeping myself together once this gets added to it.",
  "hFuck cedar key and fuck her (come over anyway tho)",
  "htwenty past five he said will this train have been to durham already or not coz i am in a reserved seat",
  "sHey Boys. Want hot XXX pics sent direct 2 ur phone? Txt PORN to 69855, 24Hrs free and then just 50p per day. To stop text STOPBCM SF WC1N3XX",
  "hU still painting ur wall?",
  "sLast Chance! Claim ur £150 worth of discount vouchers today! Text SHOP to 85023 now! SavaMob, offers mobile! T Cs SavaMob POBOX84, M263UZ. £3.00 Sub. 16",
  "hPrinter is cool. I mean groovy. Wine is groovying",
  "hHi Harish's rent has been transfred to ur Acnt.",
  "hAnything lor is she coming?",
  "hCbe is really good nowadays:)lot of shop and showrooms:)city is shaping good.",
  "hÜ still attending da talks?",
  "hNo probs hon! How u doinat the mo?",
  "hK I'll take care of it",
  "hI take it we didn't have the phone callon Friday. Can we assume we won't have it this year now?",
  "hMy battery is low babe",
  "hShuhui has bought ron's present it's a swatch watch...",
  "hYeah there's quite a bit left, I'll swing by tomorrow when I get up",
  "hBabe? You said 2 hours and it's been almost 4 ... Is your internet down ?",
  "hK I'll be sure to get up before noon and see what's what",
  "hK...k...yesterday i was in cbe .",
  "hWent to ganesh dress shop",
  "spdate_Now - Double mins and 1000 txts on Orange tariffs. Latest Motorola, SonyEricsson & Nokia & Bluetooth FREE! Call MobileUpd8 on 08000839402 or call2optout/!YHL",
  "hÜ collecting ur laptop then going to configure da settings izzit?",
  "hIf you r @ home then come down within 5 min",
  "hAight, I should be there by 8 at the latest, probably closer to 7. Are jay and tyler down or should we just do two trips?",
  "hCome aftr  &lt;DECIMAL&gt; ..now i m cleaning the house",
  "sUr cash-balance is currently 500 pounds - to maximize ur cash-in now send CASH to 86688 only 150p/msg. CC: 08718720201 PO BOX 114/14 TCR/W1",
  "hBill, as in: Are there any letters for me. i’m expecting one from orange that isn’t a bill but may still say orange on it.",
  "hTell me pa. How is pain de.",
  "hHI DARLIN I HOPE YOU HAD A NICE NIGHT I WISH I HAD COME CANT WAIT TO SEE YOU LOVE FRAN PS I WANT DIRTY ANAL SEX AND I WANT A 10 MAN GANG BANG",
  "hHa. You don‘t know either. I did a a clever but simple thing with pears the other day, perfect for christmas.",
  "hHelloooo... Wake up..! \"Sweet\" \"morning\" \"welcomes\" \"You\" \"Enjoy\" \"This Day\" \"with full of joy\".. \"GUD MRNG\".",
  "hALRITE",
  "hWhy must we sit around and wait for summer days to celebrate. Such a magical sight when the worlds dressed in white. Oooooh let there be snow.",
  "sURGENT! Your Mobile number has been awarded with a £2000 prize GUARANTEED. Call 09058094454 from land line. Claim 3030. Valid 12hrs only",
  "hHow do you guys go to see movies on your side.",
  "hSorry,in meeting I'll call later",
  "hYou didn't have to tell me that...now i'm thinking. Plus he's going to stop all your runs",
  "hKindly send some one to our flat before  &lt;DECIMAL&gt;  today.",
  "sSorry! U can not unsubscribe yet. THE MOB offer package has a min term of 54 weeks> pls resubmit request after expiry. Reply THEMOB HELP 4 more info",
  "hNothing lor... A bit bored too... Then y dun u go home early 2 sleep today...",
  "hWhat time should I tell my friend to be around?",
  "hYes. that will be fine. Love you. Be safe.",
  "hThanks chikku..:-) gud nyt:-*",
  "hIs xy in ur car when u picking me up?",
  "hThanx 4 the time we’ve spent 2geva, its bin mint! Ur my Baby and all I want is u!xxxx",
  "hYo, any way we could pick something up tonight?",
  "hI've not sent it. He can send me.",
  "hFine am simply sitting.",
  "hThts god's gift for birds as humans hav some natural gift frm god..",
  "hAre you coming to day for class.",
  "hIm done. Just studyn in library",
  "hOk... U enjoy ur shows...",
  "hAnything...",
  "hWhere wuld I be without my baby? The thought alone mite break me and I don’t wanna go crazy but everyboy needs his lady xxxxxxxx",
  "hWat's my dear doing? Sleeping ah?",
  "hHi' Test on  &lt;#&gt; rd ....",
  "hOnly 2% students solved this CAT question in 'xam... 5+3+2= &lt;#&gt;  9+2+4= &lt;#&gt;  8+6+3= &lt;#&gt;  then 7+2+5=????? Tell me the answer if u r brilliant...1thing.i got d answr.",
  "hYo do you know anyone  &lt;#&gt;  or otherwise able to buy liquor? Our guy flaked and right now if we don't get a hold of somebody its just 4 loko all night",
  "hYup n her fren lor. I'm meeting my fren at 730.",
  "hYeah, we got one lined up for us",
  "hAnd stop wondering \"wow is she ever going to stop tm'ing me ?!\" because I will tm you whenever I want because you are MINE ... *laughs*",
  "hLol yep did that yesterday. Already got my fireplace. Now its just another icon sitting there for me.",
  "hHey i've booked the pilates and yoga lesson already... Haha",
  "hAre you ok. What happen to behave like this",
  "sYou have 1 new message. Please call 08712400200.",
  "hMy supervisor find 4 me one lor i thk his students. I havent ask her yet. Tell u aft i ask her.",
  "hHello. No news on job, they are making me wait a fifth week! Yeah im up for some woozles and weasels... In exeter still, but be home about 3. ",
  "hNo message..no responce..what happend?",
  "sWe currently have a message awaiting your collection. To collect your message just call 08718723815.",
  "hHey babe, sorry i didn't get sooner. Gary can come and fix it cause he thinks he knows what it is but he doesn't go as far a Ptbo and he says it will cost  &lt;#&gt;  bucks. I don't know if it might be cheaper to find someone there ? We don't have any second hand machines at all right now, let me know what you want to do babe",
  "hmake that 3! 4 fucks sake?! x",
  "hLeave it. U will always be ignorant.",
  "hNope but i'll b going 2 sch on fri quite early lor cos mys sis got paper in da morn :-)",
  "hat bruce b downs &amp; fletcher now",
  "hWhere are you ? You said you would be here when I woke ... :-(",
  "hHey now am free you can call me.",
  "hTell me whos this pls:-)",
  "sURGENT! Your mobile was awarded a £1,500 Bonus Caller Prize on 27/6/03. Our final attempt 2 contact U! Call 08714714011",
  "hThink i might have to give it a miss. Am teaching til twelve, then have lecture at two. Damn this working thing.",
  "hId have to check but there's only like 1 bowls worth left",
  "hYes there were many sweets",
  "hI would but I'm still cozy. And exhausted from last night.nobody went to school or work. Everything is closed.",
  "sU have a secret admirer. REVEAL who thinks U R So special. Call 09065174042. To opt out Reply REVEAL STOP. 1.50 per msg recd. Cust care 07821230901",
  "hBuzzzz! *grins* Did I buzz your ass? Buzz your chest ? Buzz your cock ? Where do you keep your phone ? Is the vibrator on ? Did you feel it shake ?",
  "hSir send to group mail check it.",
  "hI'm doing da intro covers energy trends n pros n cons... Brief description of nuclear fusion n oso brief history of iter n jet got abt 7 n half pages..",
  "h\"NONE!NOWHERE IKNO DOESDISCOUNT!SHITINNIT\"",
  "hYou dont know you jabo me abi.",
  "sDo you ever notice that when you're driving, anyone going slower than you is an idiot and everyone driving faster than you is a maniac?",
  "hNot yet had..ya sapna aunty manege y'day hogidhe..chinnu full weak and swalpa black agidhane..",
  "hAre you being good, baby? :)",
  "hNEFT Transaction with reference number  &lt;#&gt;  for Rs. &lt;DECIMAL&gt;  has been credited to the beneficiary account on  &lt;#&gt;  at  &lt;TIME&gt; : &lt;#&gt;",
  "hMostly sports type..lyk footbl,crckt..",
  "hMa head dey swell oh. Thanks for making my day",
  "hU should make a fb list",
  "hHeight of Confidence: All the Aeronautics professors wer calld &amp; they wer askd 2 sit in an aeroplane. Aftr they sat they wer told dat the plane ws made by their students. Dey all hurried out of d plane.. Bt only 1 didnt move... He said:\"if it is made by my students,this wont even start........ Datz confidence..",
  "hSary just need Tim in the bollox &it hurt him a lot so he tol me!",
  "hHappy New Year Princess!",
  "hI'll text carlos and let you know, hang on",
  "hDon't worry, * is easy once have ingredients!",
  "hI love u 2 my little pocy bell I am sorry but I love u",
  "hOk omw now, you at castor?",
  "hYar lor... Keep raining non stop... Or u wan 2 go elsewhere?",
  "sXmas Offer! Latest Motorola, SonyEricsson & Nokia & FREE Bluetooth or DVD! Double Mins & 1000 Txt on Orange. Call MobileUpd8 on 08000839402 or call2optout/4QF2",
  "hWhat u mean u almost done? Done wif sleeping? But i tot u going to take a nap.. Yup i send her liao so i'm picking her up at ard 4 smth lor..",
  "h7 wonders in My WORLD 7th You 6th Ur style 5th Ur smile 4th Ur Personality 3rd Ur Nature 2nd Ur SMS and 1st \"Ur Lovely Friendship\"... good morning dear",
  "hTonight? Yeah, I'd be down for that",
  "hWhat should i eat fo lunch senor",
  "hHe said that he had a right giggle when he saw u again! You would possibly be the first person2die from NVQ, but think how much you could for! ",
  "hNo break time one... How... I come out n get my stuff fr ü?",
  "sReply to win £100 weekly! What professional sport does Tiger Woods play? Send STOP to 87239 to end service",
  "hI'm there and I can see you, but you can't see me ? Maybe you should reboot ym ? I seen the buzz",
  "hDo you still have the grinder?",
  "sNo 1 POLYPHONIC tone 4 ur mob every week! Just txt PT2 to 87575. 1st Tone FREE ! so get txtin now and tell ur friends. 150p/tone. 16 reply HL 4info",
  "hLove isn't a decision, it's a feeling. If we could decide who to love, then, life would be much simpler, but then less magical",
  "sHOT LIVE FANTASIES call now 08707509020 Just 20p per min NTT Ltd, PO Box 1327 Croydon CR9 5WB 0870 is a national rate call",
  "hK.i did't see you.:)k:)where are you now?",
  "hSo i'm doing a list of buyers.",
  "hNo idea, I guess we'll work that out an hour after we're supposed to leave since as usual nobody has any interest in figuring shit out before the last second",
  "hMm not entirely sure i understood that text but hey. Ho. Which weekend?",
  "hThey released vday shirts and when u put it on it makes your bottom half naked instead of those white underwear.",
  "hDon know..he is watching film in computer..",
  "hNo b4 Thursday",
  "hOh, then your phone phoned me but it disconnected",
  "hId onluy matters when getting on from offcampus",
  "sThis message is free. Welcome to the new & improved Sex & Dogging club! To unsubscribe from this service reply STOP. msgs@150p 18+only",
  "hExcellent, I'll see what riley's plans are",
  "hI will see in half an hour",
  "sYou've won tkts to the EURO2004 CUP FINAL or £800 CASH, to collect CALL 09058099801 b4190604, POBOX 7876150ppm",
  "hEw are you one of them?",
  "hAlso hi wesley how've you been",
  "hAh you see. You have to be in the lingo. I will let you know wot on earth it is when has finished making it!",
  "sLoan for any purpose £500 - £75,000. Homeowners + Tenants welcome. Have you been previously refused? We can still help. Call Free 0800 1956669 or text back 'help'",
  "sUpdate_Now - 12Mths Half Price Orange line rental: 400mins...Call MobileUpd8 on 08000839402 or call2optout=J5Q",
  "hImagine Life WITHOUT ME... see.. How fast u are searching me?Don't worry.. l'm always there To disturb U.. Goodnoon..:)",
  "hHm good morning, headache anyone? :-)",
  "hYeah no probs - last night is obviously catching up with you... Speak soon ",
  "sFREE UNLIMITED HARDCORE PORN direct 2 your mobile Txt PORN to 69200 & get FREE access for 24 hrs then chrgd@50p per day txt Stop 2exit. This msg is free",
  "hI might go 2 sch. Yar at e salon now v boring.",
  "h &lt;#&gt;  mins but i had to stop somewhere first.",
  "h&lt;#&gt;  is fast approaching. So, Wish u a very Happy New Year Happy Sankranti Happy republic day Happy Valentines Day Happy Shivratri Happy Ugadi Happy Fools day Happy May Day Happy Independence Day, Happy Friendship,Mother,Father,Teachers,Childrens Day, &amp; HAPPY BIRTHDAY 4 U. Happy Ganesh festival Happy Dasara Happy Diwali Happy Christmas  &lt;#&gt;  Good Mornings Afternoons, Evenings Nights. RememberI AM the first to WISHING U ALL THESE...your's Raj",
  "hOne of the joys in lifeis waking up each daywith thoughts that somewhereSomeone cares enough tosend a warm morning greeting.. -",
  "hI didn't get the second half of that message",
  "hWat time do u wan 2 meet me later?",
  "hI thank you so much for all you do with selflessness. I love you plenty.",
  "hAm in film ill call you later.",
  "hHow dare you change my ring",
  "hYou are a very very very very bad girl. Or lady.",
  "hI love ya too but try and budget your money better babe. Gary would freak on me if he knew",
  "hWhat part of \"don't initiate\" don't you understand",
  "hI finished my lunch already. U wake up already?",
  "hYou still at the game?",
  "hYou have got tallent but you are wasting.",
  "hWhat is your record for one night? :)",
  "hAlso sir, i sent you an email about how to log into the usc payment portal. I.ll send you another message that should explain how things are back home. Have a great weekend.",
  "h gonna let me know cos comes bak from holiday that day.  is coming. Don't4get2text me  number. ",
  "hJokin only lar... :-) depends on which phone my father can get lor...",
  "hAight, lemme know what's up",
  "hGet ready for  &lt;#&gt;  inches of pleasure...",
  "hRaji..pls do me a favour. Pls convey my Birthday wishes to Nimya. Pls. Today is her birthday.",
  "h;-) ok. I feel like john lennon.",
  "hCos darren say ü considering mah so i ask ü...",
  "hYou are not bothering me but you have to trust my answers. Pls.",
  "hWishing you and your family Merry \"X\" mas and HAPPY NEW Year in advance..",
  "hOne day a crab was running on the sea shore..The waves came n cleared the footprints of the crab.. Crab asked: being my frnd y r u clearing my beautiful footprints? Waves replied: A fox was following ur footprints to catch you! thats y i cleared it off:) frndsship never lets u dwn :-) GUD nyt..",
  "hAight what time you want me to come up?",
  "hSlaaaaave ! Where are you ? Must I summon you to me all the time now ? Don't you wish to come to me on your own anymore?",
  "hYour bill at 3 is £33.65 so thats not bad!",
  "hLet me know how it changes in the next 6hrs. It can even be appendix but you are out of that age range. However its not impossible. So just chill and let me know in 6hrs",
  "hHello, yeah i've just got out of the bath and need to do my hair so i'll come up when i'm done, yeah?",
  "hSo how's the weather over there?",
  "hOk. Not much to do here though. H&M Friday, cant wait. Dunno wot the hell im gonna do for another 3 weeks! Become a slob- oh wait, already done that! ",
  "hDie... Now i have e toot fringe again...",
  "hLol they don't know about my awesome phone. I could click delete right now if I want.",
  "hOk",
  "hAwesome question with a cute answer: Someone asked a boy \"how is ur life?\" . . He smiled &amp; answered: . . \"She is fine!\" Gudnite",
  "hPlease leave this topic..sorry for telling that..",
  "hPls send me the correct name da.",
  "hWhat happened to our yo date?",
  "sEASTENDERS TV Quiz. What FLOWER does DOT compare herself to? D= VIOLET E= TULIP F= LILY txt D E or F to 84025 NOW 4 chance 2 WIN £100 Cash WKENT/150P16+",
  "hWebpage s not available!",
  "hJust woke up. Yeesh its late. But I didn't fall asleep til &lt;#&gt; am :/",
  "sYou are now unsubscribed all services. Get tons of sexy babes or hunks straight to your phone! go to http://gotbabes.co.uk. No subscriptions.",
  "hDear all, as we know  &lt;#&gt; th is the  &lt;#&gt; th birthday of our loving Gopalettan. We are planning to give a small gift on that day. Those who like to participate in that you are welcome. Please contact our admin team for more details",
  "hK..k...from tomorrow onwards started ah?",
  "hWhat u talking bout early morning? It's almost noon where your at!",
  "hFine. Do you remember me.",
  "sHi babe its Jordan, how r u? Im home from abroad and lonely, text me back if u wanna chat xxSP visionsms.com Text stop to stopCost 150p 08712400603",
  "hOk. How many should i buy.",
  "hSounds good, keep me posted",
  "sGet a brand new mobile phone by being an agent of The Mob! Plus loads more goodies! For more info just text MAT to 87021.",
  "hOk. So april. Cant wait",
  "hBoy you best get yo ass out here quick",
  "hAy wana meet on sat?ü wkg on sat?",
  "hI'm now but have to wait till 2 for the bus to pick me.",
  "hApart from the one i told you about yesterday?",
  "hOk lor... But buy wat?",
  "hSomebody should go to andros and steal ice",
  "hDon know. I did't msg him recently.",
  "hTake us out shopping and Mark will distract Isaiah.=D",
  "hMum, hope you are having a great day. Hoping this text meets you well and full of life. Have a great day. Abiola",
  "hThere is no sense in my foot and penis.",
  "hOkay but i thought you were the expert",
  "h*deep sigh* ... I miss you :-( ... I am really surprised you haven't gone to the net cafe yet to get to me ... Don't you miss me?",
  "hS.s:)i thinl role is like sachin.just standing. Others have to hit.",
  "hHave a great trip to India. And bring the light to everyone not just with the project but with everyone that is lucky to see you smile. Bye. Abiola",
  "hAnd very importantly, all we discuss is between u and i only.",
  "hK..k:)how about your training process?",
  "hOk lor. I ned 2 go toa payoh 4 a while 2 return smth u wan 2 send me there or wat?",
  "hIn da car park ",
  "hI wish that I was with you. Holding you tightly. Making you see how important you are. How much you mean to me ... How much I need you ... In my life ...",
  "hSo i asked how's anthony. Dad. And your bf",
  "h'Wnevr i wana fal in luv vth my books, My bed fals in luv vth me..!'' . Yen madodu, nav pretsorginta, nammanna pretsovru important alwa....!!:) Gud eveB-).",
  "hWhat Today-sunday..sunday is holiday..so no work..",
  "hAm going to take bath ill place the key in window:-)",
  "sLORD OF THE RINGS:RETURN OF THE KING in store NOW!REPLY LOTR by 2 June 4 Chance 2 WIN LOTR soundtrack CDs StdTxtRate. Reply STOP to end txts",
  "hDear, take care. I am just reaching home.love u a lot.",
  "hstaff.science.nus.edu.sg/~phyhcmk/teaching/pc1323",
  "hHave you emigrated or something? Ok maybe 5.30 was a bit hopeful...",
  "hOlol i printed out a forum post by a guy with the exact same  prob which was fixed with a gpu replacement. Hopefully they dont ignore that.",
  "hWe walked from my moms. Right on stagwood pass right on winterstone left on victors hill. Address is &lt;#&gt;",
  "hYo, you at jp and hungry like a mofo?",
  "hThis is all just creepy and crazy to me.",
  "hOk... I din get ur msg...",
  "hTessy..pls do me a favor. Pls convey my birthday wishes to Nimya..pls dnt forget it. Today is her birthday Shijas",
  "hPathaya enketa maraikara pa'",
  "hEven if he my friend he is a priest call him now",
  "hU so lousy, run already come back then half dead... Hee...",
  "hThat's y i said it's bad dat all e gals know u... Wat u doing now?",
  "hOr remind me in a few hrs.",
  "hI had been hoping i would not have to send you this message. My rent is due and i dont have enough for it. My reserves are completely gone. Its a loan i need and was hoping you could her. The balance is  &lt;#&gt; . Is there a way i could get that from you, till mid march when i hope to pay back.",
  "hHi. Happy New Year. I dont mean to intrude but can you pls let me know how much tuition you paid last semester and how much this semester is. Thanks",
  "hHello hun how ru? Its here by the way. Im good. Been on 2 dates with that guy i met in walkabout so far. We have to meet up soon. Hows everyone else?",
  "hLol I was gonna last month. I cashed some in but I left &lt;#&gt; just in case. I was collecting more during the week cause they announced it on the blog.",
  "sGood Luck! Draw takes place 28th Feb 06. Good Luck! For removal send STOP to 87239 customer services 08708034412",
  "hShort But Cute : \" Be a good person , but dont try to prove\" ..... Gud mrng...",
  "hJust haven't decided where yet eh ?",
  "hWat time liao, where still got.",
  "hYes watching footie but worried we're going to blow it - Phil Neville?",
  "hI wait 4 ü inside da car park...",
  "hUncle Abbey! Happy New Year. Abiola",
  "hNow am free call me pa.",
  "hR u saying i should re order the slippers cos i had to pay for returning it.",
  "hStop knowing me so well!",
  "hGood evening! this is roger. How are you?",
  "hSmall problem in auction:)punj now asking tiwary",
  "sFree entry in 2 a weekly comp for a chance to win an ipod. Txt POD to 80182 to get entry (std txt rate) T&C's apply 08452810073 for details 18+",
  "hHe telling not to tell any one. If so treat for me hi hi hi",
  "hMy uncles in Atlanta. Wish you guys a great semester.",
  "s1st wk FREE! Gr8 tones str8 2 u each wk. Txt NOKIA ON to 8007 for Classic Nokia tones or HIT ON to 8007 for Polys. Nokia/150p Poly/200p 16+",
  "hU coming 2 pick me?",
  "hThats cool. i liked your photos. You are very sexy!",
  "hwould u fuckin believe it they didnt know i had thurs pre booked off so they re cancelled me AGAIN! that needs to b sacked",
  "hHaha better late than ever, any way I could swing by?",
  "hOk. But i finish at 6.",
  "sLookAtMe!: Thanks for your purchase of a video clip from LookAtMe!, you've been charged 35p. Think you can do better? Why not send a video in a MMSto 32323.",
  "hI've been barred from all B and Q stores for life!?This twat in orange dungerees came up to me and asked if I wanted decking? So I got the first punch in!!",
  "hSo no messages. Had food?",
  "hOk going to sleep. Hope i can meet her.",
  "hWat makes some people dearer is not just de happiness dat u feel when u meet them but de pain u feel when u miss dem!!!",
  "hCan you let me know details of fri when u find out cos I'm not in tom or fri. mentionned chinese. Thanks",
  "hYou're right I have now that I think about it",
  "hWat r u doing now?",
  "hIs ur lecture over?",
  "ssexy sexy cum and text me im wet and warm and ready for some porn! u up for some fun? THIS MSG IS FREE RECD MSGS 150P INC VAT 2 CANCEL TEXT STOP",
  "hCustomer place i will call you",
  "hNot planned yet :)going to join company on jan 5 only.don know what will happen after that.",
  "hBoy; I love u Grl: Hogolo Boy: gold chain kodstini Grl: Agalla Boy: necklace madstini Grl: agalla Boy: Hogli 1 mutai eerulli kodthini! Grl: I love U kano;-)",
  "hHaha I heard that, text me when you're around",
  "hI.ll get there tomorrow and send it to you",
  "h\"SHIT BABE.. THASA BIT MESSED UP.YEH, SHE SHUDVETOLD U. DID URGRAN KNOW?NEWAY, ILLSPEAK 2 U2MORO WEN IM NOT ASLEEP...\"",
  "hOh thats late! Well have a good night and i will give u a call tomorrow. Iam now going to go to sleep night night",
  "h\"CHEERS U TEX MECAUSE U WEREBORED! YEAH OKDEN HUNNY R UIN WK SAT?SOUND’S LIKEYOUR HAVIN GR8FUN J! KEEP UPDAT COUNTINLOTS OF LOVEME XXXXX.\"",
  "hSorry,  in meeting I'll call you later",
  "hYo! Howz u? girls never rang after india. L",
  "hYeah but which is worse for i",
  "sHard LIVE 121 chat just 60p/min. Choose your girl and connect LIVE. Call 09094646899 now! Cheap Chat UK's biggest live service. VU BCM1896WC1N3XX",
  "hI tagged MY friends that you seemed to count as YOUR friends.",
  "sNot heard from U4 a while. Call 4 rude chat private line 01223585334 to cum. Wan 2C pics of me gettin shagged then text PIX to 8552. 2End send STOP 8552 SAM xxx",
  "hOk...",
  "hLong time. You remember me today.",
  "hHavent shopping now lor i juz arrive only",
  "hThank u. IT BETTER WORK OUT CAUSE I WILL FEEL USED OTHERWISE",
  "hAre you up for the challenge? I know i am :)",
  "hHow much did ur hdd casing cost.",
  "hMystery solved! Just opened my email and he's sent me another batch! Isn't he a sweetie",
  "hI can't describe how lucky you are that I'm actually awake by noon",
  "sThis is the 2nd time we have tried to contact u. U have won the £1450 prize to claim just call 09053750005 b4 310303. T&Cs/stop SMS 08718725756. 140ppm",
  "hTODAY is Sorry day.! If ever i was angry with you, if ever i misbehaved or hurt you? plz plz JUST SLAP URSELF Bcoz, Its ur fault, I'm basically GOOD",
  "hCheers for the card ... Is it that time of year already?",
  "sHOT LIVE FANTASIES call now 08707509020 Just 20p per min NTT Ltd, PO Box 1327 Croydon CR9 5WB 0870..k",
  "hWhen people see my msgs, They think Iam addicted to msging... They are wrong, Bcoz They don\\'t know that Iam addicted to my sweet Friends..!! BSLVYL",
  "hUgh hopefully the asus ppl dont randomly do a reformat.",
  "hHaven't seen my facebook, huh? Lol!",
  "hMah b, I'll pick it up tomorrow",
  "hStill otside le..u come 2morrow maga..",
  "hDo u still have plumbers tape and a wrench we could borrow?",
  "sDear Voucher Holder, To claim this weeks offer, at you PC please go to http://www.e-tlp.co.uk/reward. Ts&Cs apply.",
  "hIt vl bcum more difficult..",
  "sUR GOING 2 BAHAMAS! CallFREEFONE 08081560665 and speak to a live operator to claim either Bahamas cruise of£2000 CASH 18+only. To opt out txt X to 07786200117",
  "hHavent still waitin as usual... Ü come back sch oredi?",
  "hIn meeting da. I will call you",
  "hK k :-):-) then watch some films.",
  "hDoes cinema plus drink appeal tomo? * Is a fr thriller by director i like on at mac at 8.30.",
  "hThere the size of elephant tablets & u shove um up ur ass!!",
  "hSo many people seems to be special at first sight, But only very few will remain special to you till your last sight.. Maintain them till life ends.. take cr da",
  "hMy Parents, My Kidz, My Friends n My Colleagues. All screaming.. SURPRISE !! and I was waiting on the sofa.. ... ..... ' NAKED...!",
  "hDunno i juz askin cos i got a card got 20% off 4 a salon called hair sense so i tot it's da one ü cut ur hair. ",
  "hGood morning pookie pie! Lol hope I didn't wake u up",
  "hMAYBE IF YOU WOKE UP BEFORE FUCKING 3 THIS WOULDN'T BE A PROBLEM.",
  "hHappy birthday to you....dear.with lots of love.rakhesh NRI",
  "hHowz that persons story",
  "sThis is the 2nd time we have tried 2 contact u. U have won the 750 Pound prize. 2 claim is easy, call 08712101358 NOW! Only 10p per min. BT-national-rate",
  "hX2  &lt;#&gt; . Are you going to get that",
  "hHi neva worry bout da truth coz the truth will lead me 2 ur heart. It’s the least a unique person like u deserve. Sleep tight or morning",
  "sUR awarded a City Break and could WIN a £200 Summer Shopping spree every WK. Txt STORE to 88039.SkilGme.TsCs087147403231Winawk!Age16+£1.50perWKsub",
  "hIs ur paper today in e morn or aft?",
  "hI will lick up every drop :) are you ready to use your mouth as well?",
  "hAnd you! Will expect you whenever you text! Hope all goes well tomo ",
  "hGreat. P diddy is my neighbor and comes for toothpaste every morning",
  "hI av a new number,  . Wil u only use this one,ta.",
  "hSo its to be poking man everyday that they teach you in canada abi! How are you. Just saying hi.",
  "h7 lor... Change 2 suntec... Wat time u coming?",
  "hNo de.am seeing in online shop so that i asked.",
  "hJust curious because my cuz asked what I was up to",
  "hNice.nice.how is it working?",
  "hOkay lor... Wah... like that def they wont let us go... Haha... What did they say in the terms and conditions?",
  "hHaha... Yup hopefully  we will lose a few kg by mon. after hip hop can go orchard and weigh again",
  "hShe's good. How are you. Where r u working now",
  "hOh, yes, I've just been a little under the weather so i've kind of been coccooning at home",
  "hAt home also.",
  "hThis phone has the weirdest auto correct.",
  "hOops my phone died and I didn't even know. Yeah I like it better.",
  "hHavent mus ask if u can 1st wat. Of meet 4 lunch den u n him meet can already lor. Or u wan 2 go ask da ge 1st then confirm w me asap?",
  "hShe said,'' do u mind if I go into the bedroom for a minute ? '' ''OK'', I sed in a sexy mood. She came out 5 minuts latr wid a cake...n My Wife,",
  "hOH YEAH,AND HAV A GREAT TIME IN NEWQUAY-SEND ME A POSTCARD !1 LOOK AFTER ALL THE GIRLS WHILE IM GONE(U KNOW THE 1IM TALKIN BOUT!)xx",
  "hWe got a divorce. Lol. She.s here",
  "hWhat's ur pin?",
  "hBabe, have you got enough money to pick up bread and milk ? And I'll give you it back when you get home ?",
  "hI want snow. It's just freezing and windy.",
  "sURGENT! We are trying to contact U. Todays draw shows that you have won a £2000 prize GUARANTEED. Call 09066358361 from land line. Claim Y87. Valid 12hrs only",
  "hCome to mahal bus stop.. &lt;DECIMAL&gt;",
  "hDon know:)this week i'm going to tirunelvai da.",
  "hMe too baby! I promise to treat you well! I bet you will take good care of me...",
  "hIts like that hotel dusk game i think. You solve puzzles in a area thing",
  "sThanks for your ringtone order, reference number X29. Your mobile will be charged 4.50. Should your tone not arrive please call customer services 09065989180",
  "hHi, my love! How goes that day? Fuck, this morning I woke and dropped my cell on the way down the stairs but it seems alright ... *phews* I miss you !",
  "hWell that must be a pain to catch",
  "hSorry da thangam.it's my mistake.",
  "hI need... Coz i never go before ",
  "hRose for red,red for blood,blood for heart,heart for u. But u for me.... Send tis to all ur friends.. Including me.. If u like me.. If u get back, 1-u r poor in relation! 2-u need some 1 to support 3-u r frnd 2 many 4-some1 luvs u 5+- some1 is praying god to marry u.:-) try it....",
  "hWife.how she knew the time of murder exactly",
  "sSIX chances to win CASH! From 100 to 20,000 pounds txt> CSH11 and send to 87575. Cost 150p/day, 6days, 16+ TsandCs apply Reply HL 4 info",
  "sUr cash-balance is currently 500 pounds - to maximize ur cash-in now send COLLECT to 83600 only 150p/msg. CC: 08718720201 PO BOX 114/14 TCR/W1",
  "hI feel like a dick because I keep sleeping through your texts and facebook messages. Sup, you in town?",
  "hNo plm i will come da. On the way.",
  "hGuess he wants alone time. We could just show up and watch when they do..",
  "hHeight of recycling: Read twice- People spend time for earning money and the same money is spent for spending time!;-) Good morning.. keep smiling:-)",
  "hYup ü not comin :-(",
  "hYes, princess. Toledo.",
  "hAight text me when you're back at mu and I'll swing by, need somebody to get the door for me",
  "hRon say fri leh. N he said ding tai feng cant make reservations. But he said wait lor.",
  "hGood. No swimsuit allowed :)",
  "hAm okay. Will soon be over. All the best",
  "hA cute thought for friendship: \"Its not necessary to share every secret with ur close Frnd, but watever u shared should be true\"....",
  "hOk i've sent u da latest version of da project.",
  "hGood Morning my Dear........... Have a great &amp; successful day.",
  "hPls accept me for one day. Or am begging you change the number.",
  "hSqueeeeeze!! This is christmas hug.. If u lik my frndshp den hug me back.. If u get 3 u r cute:) 6 u r luvd:* 9 u r so lucky;) None? People hate u:",
  "hIts ok, if anybody asks abt me, u tel them..:-P",
  "hFunny fact Nobody teaches volcanoes 2 erupt, tsunamis 2 arise, hurricanes 2 sway aroundn no 1 teaches hw 2 choose a wife Natural disasters just happens",
  "h* You gonna ring this weekend or wot?",
  "hAlso track down any lighters you can find",
  "hSorry, I can't help you on this.",
  "hBabe, I need your advice",
  "hI‘ll leave around four, ok?",
  "hCome to medical college at 7pm ......forward it da",
  "hK:)k..its good:)when are you going?",
  "hI can make lasagna for you... vodka...",
  "hHI ITS KATE CAN U GIVE ME A RING ASAP XXX",
  "hWho were those people ? Were you in a tour ? I thought you were doing that sofa thing you sent me ? Your curious sugar",
  "hNo, but you told me you were going, before you got drunk!",
  "hHe fucking chickened out. He messaged me he would be late and woould buzz me and then I didn't hear a word from him",
  "sCongratulations! Thanks to a good friend U have WON the £2,000 Xmas prize. 2 claim is easy, just call 08718726978 NOW! Only 10p per minute. BT-national-rate",
  "hI'm always looking for an excuse to be in the city.",
  "hYup i'm still having coffee wif my frens... My fren drove she'll give me a lift...",
  "hO shore are you takin the bus",
  "hSo u gonna get deus ex?",
  "hI will send them to your email. Do you mind  &lt;#&gt;  times per night?",
  "s44 7732584351, Do you want a New Nokia 3510i colour phone DeliveredTomorrow? With 300 free minutes to any mobile + 100 free texts + Free Camcorder reply or call 08000930705.",
  "htap & spile at seven. * Is that pub on gas st off broad st by canal. Ok?",
  "hOk then i come n pick u at engin?",
  "hWhich is why i never wanted to tell you any of this. Which is why i'm so short with you and on-edge as of late.",
  "hRaviyog Peripherals bhayandar east",
  "hK actually can you guys meet me at the sunoco on howard? It should be right on the way",
  "sYou have 1 new voicemail. Please call 08719181513.",
  "hMOON has come to color your dreams, STARS to make them musical and my SMS to give you warm and Peaceful Sleep. Good Night",
  "hJust finished eating. Got u a plate. NOT leftovers this time.",
  "hThanx a lot...",
  "hHurry home u big butt. Hang up on your last caller if u have to. Food is done and I'm starving. Don't ask what I cooked.",
  "hLol your right. What diet? Everyday I cheat anyway. I'm meant to be a fatty :(",
  "hIts a great day. Do have yourself a beautiful one.",
  "hWhat happened in interview?",
  "hSolve d Case : A Man Was Found Murdered On  &lt;DECIMAL&gt; . &lt;#&gt;  AfterNoon. 1,His wife called Police. 2,Police questioned everyone. 3,Wife: Sir,I was sleeping, when the murder took place. 4.Cook: I was cooking. 5.Gardener: I was picking vegetables. 6.House-Maid: I went 2 d post office. 7.Children: We went 2 play. 8.Neighbour: We went 2 a marriage. Police arrested d murderer Immediately. Who's It? Reply With Reason, If U r Brilliant.",
  "hBadrith is only for chennai:)i will surely pick for us:)no competition for him.",
  "hI tot it's my group mate... Lucky i havent reply... Wat time do ü need to leave... ",
  "hHey you around? I've got enough for a half + the ten I owe you",
  "hHey tmr maybe can meet you at yck",
  "hALRITE SAM ITS NIC JUST CHECKIN THAT THIS IS UR NUMBER-SO IS IT?T.B*",
  "hThey are just making it easy to pay back. I have  &lt;#&gt; yrs to say but i can pay back earlier. You get?",
  "hNot to worry. I'm sure you'll get it.",
  "hThe gas station is like a block away from my house, you'll drive right by it since armenia ends at swann and you have to take howard",
  "sSomeone U know has asked our dating service 2 contact you! Cant Guess who? CALL 09058097189 NOW all will be revealed. POBox 6, LS15HB 150p ",
  "sCamera - You are awarded a SiPix Digital Camera! call 09061221066 fromm landline. Delivery within 28 days",
  "hMy tuition is at 330. Hm we go for the 1120 to 1205 one? Do you mind?",
  "hI'm not smoking while people use \"wylie smokes too much\" to justify ruining my shit",
  "hDear good morning how you feeling dear",
  "hA little. Meds say take once every 8 hours. It's only been 5 but pain is back. So I took another. Hope I don't die",
  "hBeautiful tomorrow never comes.. When it comes, it's already TODAY.. In the hunt of beautiful tomorrow don't waste your wonderful TODAY.. GOODMORNING:)",
  "hDunno lei ü all decide lor. How abt leona? Oops i tot ben is going n i msg him.",
  "hHi there. We have now moved in2 our pub . Would be great 2 c u if u cud come up.",
  "sTodays Voda numbers ending 5226 are selected to receive a ?350 award. If you hava a match please call 08712300220 quoting claim code 1131 standard rates app ",
  "sThis message is free. Welcome to the new & improved Sex & Dogging club! To unsubscribe from this service reply STOP. msgs@150p 18 only",
  "hHoneybee Said: *I'm d Sweetest in d World* God Laughed &amp; Said: *Wait,U Havnt Met d Person Reading This Msg* MORAL: Even GOD Can Crack Jokes! GM+GN+GE+GN:)",
  "hJust do what ever is easier for you",
  "sRCT' THNQ Adrian for U text. Rgds Vatian",
  "hStop calling everyone saying I might have cancer. My throat hurts to talk. I can't be answering everyones calls. If I get one more call I'm not babysitting on Monday",
  "hIt'll be tough, but I'll do what I have to",
  "hIM GONNAMISSU SO MUCH!!I WOULD SAY IL SEND U A POSTCARD BUTTHERES ABOUTAS MUCH CHANCE OF MEREMEMBERIN ASTHERE IS OFSI NOT BREAKIN HIS CONTRACT!! LUV Yaxx",
  "hEe msg na poortiyagi odalebeku: Hanumanji 7 name 1-Hanuman 2-Bajarangabali 3-Maruti 4-Pavanaputra 5-Sankatmochan 6-Ramaduth 7-Mahaveer ee 7 name  &lt;#&gt;  janarige ivatte kalisidare next saturday olage ondu good news keluviri...! Maretare inde 1 dodda problum nalli siguviri idu matra  &lt;#&gt; % true.. Don't neglet.",
  "hHI DARLIN I FINISH AT 3 DO U 1 2 PICK ME UP OR MEET ME? TEXT BACK ON THIS NUMBER LUV KATE XXX",
  "hSet a place for me in your heart and not in your mind, as the mind easily forgets but the heart will always remember. Wish you Happy Valentines Day!",
  "hBut i'm surprised she still can guess right lor...",
  "hOkie ü wan meet at bishan? Cos me at bishan now. I'm not driving today.",
  "hOh ho. Is this the first time u use these type of words",
  "hHI DARLIN HOW WAS WORK DID U GET INTO TROUBLE? IJUST TALKED TO YOUR MUM ALL MORNING! I HAD A REALLY GOOD TIME LAST NIGHT IM GOIN OUT SOON BUT CALL ME IF U CAN",
  "hI know you are serving. I mean what are you doing now.",
  "hHuh... Hyde park not in mel ah, opps, got confused... Anyway, if tt's e best choice den we juz have to take it...",
  "hOh gei. That happend to me in tron. Maybe ill dl it in 3d when its out",
  "sFREE MESSAGE Activate your 500 FREE Text Messages by replying to this message with the word FREE For terms & conditions, visit www.07781482378.com",
  "hI know girls always safe and selfish know i got it pa. Thank you. good night.",
  "hNo worries, hope photo shoot went well. have a spiffing fun at workage. ",
  "hI'm freezing and craving ice. Fml",
  "hKay... Since we are out already ",
  "hEh sorry leh... I din c ur msg. Not sad already lar. Me watching tv now. U still in office?",
  "hYo im right by yo work",
  "hOk darlin i supose it was ok i just worry too much.i have to do some film stuff my mate and then have to babysit again! But you can call me there.xx",
  "hShe said,'' do u mind if I go into the bedroom for a minute ? '' ''OK'', I sed in a sexy mood. She came out 5 minuts latr wid a cake...n My Wife,",
  "hI don wake since. I checked that stuff and saw that its true no available spaces. Pls call the embassy or send a mail to them.",
  "hNope... Juz off from work...",
  "hHuh so fast... Dat means u havent finished painting?",
  "h what number do u live at? Is it 11?",
  "hNo we put party 7 days a week and study lightly, I think we need to draw in some custom checkboxes so they know we're hardcore",
  "hSac will score big hundred.he is set batsman:-)",
  "hSend me yetty's number pls.",
  "hHow much it will cost approx . Per month.",
  "hOk... The theory test? when are ü going to book? I think it's on 21 may. Coz thought wanna go out with jiayin. But she isnt free",
  "sYou are being contacted by our dating service by someone you know! To find out who it is, call from a land line 09050000928. PoBox45W2TG150P",
  "hThat's fine, have him give me a call if he knows what he wants or has any questions",
  "hSorry, got a late start, we're on the way",
  "hThen u go back urself lor...",
  "hI AM AT THE GAS STATION. GO THERE.",
  "hK, if u bored up just come to my home..",
  "hBabe !!!! I LOVE YOU !!!! *covers your face in kisses*",
  "hLike I made him throw up when we were smoking in our friend's car one time, it was awesome",
  "hStill i have not checked it da. . .",
  "hYou will go to walmart. I.ll stay.",
  "hI haven't forgotten you, i might have a couple bucks to send you tomorrow, k? I love ya too",
  "hOh great. I.ll disturb him more so that we can talk.",
  "hReverse is cheating. That is not mathematics.",
  "hU're welcome... Caught u using broken english again...",
  "hNo problem baby. Is this is a good time to talk? I called and left a message.",
  "hSorry, I'll call later",
  "hOh is it! Which brand?",
  "hSorry i cant take your call right now. It so happens that there r 2waxsto do wat you want. She can come and ill get her medical insurance. And she'll be able to deliver and have basic care. I'm currently shopping for the right medical insurance for her. So just give me til friday morning. Thats when i.ll see the major person that can guide me to the right insurance.",
  "hAt what time are you coming.",
  "hCall him and say you not coming today ok and tell them not to fool me like this ok",
  "hI emailed yifeng my part oredi.. Can ü get it fr him..",
  "hR u sure they'll understand that! Wine * good idea just had a slurp!",
  "hMinimum walk is 3miles a day.",
  "hOk not a problem will get them a taxi. C ing  tomorrow and tuesday. On tuesday think we r all going to the cinema. ",
  "hBrainless Baby Doll..:-D;-), vehicle sariyag drive madoke barolla..",
  "hI don't run away frm u... I walk slowly &amp; it kills me that u don't care enough to stop me...",
  "sSorry I missed your call let's talk when you have the time. I'm on 07090201529",
  "hPlease attend the phone:)",
  "hYou only hate me. You can call any but you didnt accept even a single call of mine. Or even you messaged",
  "hNo messages on her phone. I'm holding it now",
  "hCan... I'm free...",
  "hYo my trip got postponed, you still stocked up?",
  "hSorry, I'll call later",
  "hI am waiting for your call sir.",
  "hHey what are you doing. Y no reply pa..",
  "hHey elaine, is today's meeting still on?",
  "hSorry i've not gone to that place. I.ll do so tomorrow. Really sorry.",
  "hMost of the tiime when i don't let you hug me it's so i don't break into tears.",
  "hTomorrow i am not going to theatre. . . So i can come wherever u call me. . . Tell me where and when to come tomorrow",
  "hAnd now electricity just went out fml.",
  "hLooks like you found something to do other than smoke, great job!",
  "hAlso andros ice etc etc",
  "h:) ",
  "hGood afternon, my love. How are today? I hope your good and maybe have some interviews. I wake and miss you babe. A passionate kiss from across the sea",
  "hYup. Wun believe wat? U really neva c e msg i sent shuhui?",
  "hHows that watch resizing",
  "hDear umma she called me now :-)",
  "hJust finished. Missing you plenty",
  "scomplimentary 4 STAR Ibiza Holiday or £10,000 cash needs your URGENT collection. 09066364349 NOW from Landline not to lose out! Box434SK38WP150PPM18+",
  "hWell, I meant as opposed to my drunken night of before",
  "hK... Must book a not huh? so going for yoga basic on sunday?",
  "sFREE MSG:We billed your mobile number by mistake from shortcode 83332.Please call 08081263000 to have charges refunded.This call will be free from a BT landline",
  "hOk can...",
  "hOops - am at my mum's in somerset... Bit far! Back tomo, see you soon x",
  "hSo u workin overtime nigpun?",
  "hSame as kallis dismissial in 2nd test:-).",
  "hO. Guess they both got screwd",
  "sPlease CALL 08712402972 immediately as there is an urgent message waiting for you",
  "hI'm in a meeting, call me later at",
  "hWhat r u cooking me for dinner?",
  "hOk thanx...",
  "hBull. Your plan was to go floating off to IKEA with me without a care in the world. So i have to live with your mess another day.",
  "hThen i buy.",
  "sURGENT! Your Mobile number has been awarded with a £2000 Bonus Caller Prize. Call 09058095201 from land line. Valid 12hrs only",
  "hHeehee that was so funny tho",
  "hIt only does simple arithmetic not percentages.",
  "hYeah we wouldn't leave for an hour at least, how's 4 sound?",
  "sAs a valued customer, I am pleased to advise you that following recent review of your Mob No. you are awarded with a £1500 Bonus Prize, call 09066364589",
  "hThanks honey. Have a great day.",
  "h'An Amazing Quote'' - \"Sometimes in life its difficult to decide whats wrong!! a lie that brings a smile or the truth that brings a tear....\"",
  "hGood night my dear.. Sleepwell&amp;Take care",
  "hThen ü ask dad to pick ü up lar... Ü wan 2 stay until 6 meh...",
  "hJus chillaxin, what up",
  "h\"HEY DAS COOL... IKNOW ALL 2 WELLDA PERIL OF STUDENTFINANCIAL CRISIS!SPK 2 U L8R.\"",
  "hBeautiful Truth against Gravity.. Read carefully: \"Our heart feels light when someone is in it.. But it feels very heavy when someone leaves it..\" GOODMORNING",
  "sDo you want a New Nokia 3510i colour phone DeliveredTomorrow? With 300 free minutes to any mobile + 100 free texts + Free Camcorder reply or call 08000930705",
  "hWhats that coming over the hill..... Is it a monster! Hope you have a great day. Things r going fine here, busy though! ",
  "hJoy's father is John. Then John is the ____ of Joy's father. If u ans ths you hav  &lt;#&gt;  IQ. Tis s IAS question try to answer.",
  "hOnly once then after ill obey all yours.",
  "hNo she didnt. I will search online and let you know.",
  "hWhere do you need to go to get it?",
  "hNo pic. Please re-send.",
  "hHe remains a bro amongst bros",
  "hUhhhhrmm isnt having tb test bad when youre sick",
  "hBut i haf enuff space got like 4 mb...",
  "sLIFE has never been this much fun and great until you came in. You made it truly special for me. I won't forget you! enjoy @ one gbp/sms",
  "sDo you want a new Video phone? 600 anytime any network mins 400 Inclusive Video calls AND downloads 5 per week Free delTOMORROW call 08002888812 or reply NOW",
  "sAs a valued customer, I am pleased to advise you that following recent review of your Mob No. you are awarded with a £1500 Bonus Prize, call 09066368470",
  "sWelcome! Please reply with your AGE and GENDER to begin. e.g 24M",
  "sFreemsg: 1-month unlimited free calls! Activate SmartCall Txt: CALL to No: 68866. Subscriptn3gbp/wk unlimited calls Help: 08448714184 Stop?txt stop landlineonly",
  "sHad your mobile 10 mths? Update to latest Orange camera/video phones for FREE. Save £s with Free texts/weekend calls. Text YES for a callback orno to opt out",
  "sAm new 2 club & dont fink we met yet Will B gr8 2 C U Please leave msg 2day wiv ur area 09099726553 reply promised CARLIE x Calls£1/minMobsmore LKPOBOX177HP51FL",
  "hTrue. Its easier with her here.",
  "hSure but since my parents will be working on Tuesday I don't really need a cover story",
  "hHaha okay... Today weekend leh... ",
  "h\"Hi darlin did youPhone me? Im atHome if youwanna chat.\"",
  "hI don't know jack shit about anything or i'd say/ask something helpful but if you want you can pretend that I did and just text me whatever in response to the hypotheticalhuagauahahuagahyuhagga",
  "hYou've always been the brainy one.",
  "hYeah if we do have to get a random dude we need to change our info sheets to PARTY  &lt;#&gt; /7 NEVER STUDY just to be safe",
  "sCamera - You are awarded a SiPix Digital Camera! call 09061221066 fromm landline. Delivery within 28 days.",
  "hChristmas is An occasion that is Celebrated as a Reflection of UR... Values..., Desires..., Affections...&amp; Traditions.... Have an ideal Christmas...",
  "hSending you greetings of joy and happiness. Do have a gr8 evening",
  "h\"Hi darlin i cantdo anythingtomorrow as myparents aretaking me outfor a meal. when are u free? Katexxx\"",
  "hIf india win or level series means this is record:)",
  "hThen what about further plan?",
  "hIts good to hear from you",
  "hawesome, how do I deal with the gate? Charles told me last night but, uh, yeah",
  "hWhat time you thinkin of goin?",
  "sGet a FREE mobile video player FREE movie. To collect text GO to 89105. Its free! Extra films can be ordered t's and c's apply. 18 yrs only",
  "sSave money on wedding lingerie at www.bridal.petticoatdreams.co.uk Choose from a superb selection with national delivery. Brought to you by WeddingFriend",
  "hYour board is working fine. The issue of overheating is also reslove. But still software inst is pending. I will come around 8'o clock.",
  "hYes but I don't care cause I know its there!",
  "hwiskey Brandy Rum Gin Beer Vodka Scotch Shampain Wine \"KUDI\"yarasu dhina vaazhthukkal. ..",
  "hMon okie lor... Haha, best is cheap n gd food la, ex oso okie... Depends on whether wana eat western or chinese food... Den which u prefer... ",
  "hSitting ard nothing to do lor. U leh busy w work?",
  "hIts  &lt;#&gt; k here oh. Should i send home for sale.",
  "hSorry. || mail? || ",
  "hYa just telling abt tht incident..",
  "hYes we were outside for like 2 hours. And I called my whole family to wake them up cause it started at 1 am",
  "hUgh just got outta class",
  "hNowadays people are notixiquating the laxinorficated opportunity for bambling of entropication.... Have you ever oblisingately opted ur books for the masteriastering amplikater of fidalfication? It is very champlaxigating, i think it is atrocious.. Wotz Ur Opinion???? Junna",
  "hI dont have any of your file in my bag..i was in work when you called me.i 'll tell you if i find anything in my room.",
  "hNo need lar. Jus testing e phone card. Dunno network not gd i thk. Me waiting 4 my sis 2 finish bathing so i can bathe. Dun disturb u liao u cleaning ur room.",
  "hOk. I.ll do you right later.",
  "hFriendship poem: Dear O Dear U R Not Near But I Can Hear Dont Get Fear Live With Cheer No More Tear U R Always my Dear. Gud ni8",
  "hHave your lunch and come quickly and open the door:)",
  "sNot heard from U4 a while. Call me now am here all night with just my knickers on. Make me beg for it like U did last time 01223585236 XX Luv Nikiyu4.net",
  "hI am back. Bit long cos of accident on a30. Had to divert via wadebridge.I had a brilliant weekend thanks. Speak soon. Lots of love",
  "hK.. I yan jiu liao... Sat we can go 4 bugis vill one frm 10 to 3 den hop to parco 4 nb. Sun can go cine frm 1030 to 2, den hop to orc mrt 4 hip hop at 4...",
  "sBloomberg -Message center +447797706009 Why wait? Apply for your future http://careers. bloomberg.com",
  "hi am seeking a lady in the street and a freak in the sheets. Is that you?",
  "hMy phone",
  "hHaha figures, well I found the piece and priscilla's bowl",
  "hActually fuck that, just do whatever, do find an excuse to be in tampa at some point before january though",
  "sURGENT! We are trying to contact U. Todays draw shows that you have won a £800 prize GUARANTEED. Call 09050001808 from land line. Claim M95. Valid12hrs only",
  "hyay! finally lol. i missed our cinema trip last week :-(",
  "hAll day working day:)except saturday and sunday..",
  "haathi..where are you dear..",
  "hHeart is empty without love.. Mind is empty without wisdom.. Eyes r empty without dreams &amp; Life is empty without frnds.. So Alwys Be In Touch. Good night &amp; sweet dreams",
  "hI think I‘m waiting for the same bus! Inform me when you get there, if you ever get there.",
  "hYou getting back any time soon?",
  "h, how's things? Just a quick question.",
  "hNight has ended for another day, morning has come in a special way. May you smile like the sunny rays and leaves your worries at the blue blue bay. Gud mrng",
  "hI can probably come by, everybody's done around  &lt;#&gt;  right?",
  "hI got it before the new year cos yetunde said she wanted to surprise you with it but when i didnt see money i returned it mid january before the  &lt;#&gt; day return period ended.",
  "hI can ask around but there's not a lot in terms of mids up here",
  "hBe sure to check your yahoo email. We sent photos yesterday",
  "hWhat was she looking for?",
  "hWherre's my boytoy ? :-(",
  "sDo you want a NEW video phone750 anytime any network mins 150 text for only five pounds per week call 08000776320 now or reply for delivery tomorrow",
  "hHello, my love! How goes that day ? I wish your well and fine babe and hope that you find some job prospects. I miss you, boytoy ... *a teasing kiss*",
  "hTell my  bad character which u Dnt lik in me. I'll try to change in  &lt;#&gt; . I ll add tat 2 my new year resolution. Waiting for ur reply.Be frank...good morning.",
  "hNo:-)i got rumour that you going to buy apartment in chennai:-)",
  "hYeah, probably earlier than that",
  "hChange windows logoff sound..",
  "hStill i have not checked it da. . .",
  "hI'm also came to room.",
  "hHuh but i got lesson at 4 lei n i was thinkin of going to sch earlier n i tot of parkin at kent vale...  ",
  "hOk.",
  "hI will reach office around  &lt;DECIMAL&gt; . &amp; my mobile have problem. You cann't get my voice. So call you asa i'll free",
  "hCool, text me when you head out",
  "sYou are being contacted by our dating service by someone you know! To find out who it is, call from a land line 09050000878. PoBox45W2TG150P",
  "sWan2 win a Meet+Greet with Westlife 4 U or a m8? They are currently on what tour? 1)Unbreakable, 2)Untamed, 3)Unkempt. Text 1,2 or 3 to 83049. Cost 50p +std text",
  "hHappy birthday... May u find ur prince charming soon n dun work too hard...",
  "hOh, the grand is having a bit of a party but it doesn't mention any cover charge so it's probably first come first served",
  "hYou said to me before i went back to bed that you can't sleep for anything.",
  "hI hope you arnt pissed off but id would really like to see you tomorrow. Love me xxxxxxxxxxxxxX",
  "sDorothy@kiefer.com (Bank of Granite issues Strong-Buy) EXPLOSIVE PICK FOR OUR MEMBERS *****UP OVER 300% *********** Nasdaq Symbol CDGT That is a $5.00 per..",
  "hsays the  &lt;#&gt;  year old with a man and money. I'm down to my last  &lt;#&gt; . Still waiting for that check.",
  "hI will come to ur home now",
  "hFree any day but i finish at 6 on mon n thurs...",
  "hWill you be here for food",
  "hlife alle mone,eppolum oru pole allalo",
  "hNite...",
  "hTwo fundamentals of cool life: \"Walk, like you are the KING\"...! OR \"Walk like you Dont care,whoever is the KING\"!... Gud nyt",
  "hCamera quite good, 10.1mega pixels, 3optical and 5digital dooms. Have a lovely holiday, be safe and i hope you hav a good journey! Happy new year to you both! See you in a couple of weeks! ",
  "hHi Petey!noi’m ok just wanted 2 chat coz avent spoken 2 u 4 a long time-hope ur doin alrite.have good nit at js love ya am.x",
  "hI just saw ron burgundy captaining a party boat so yeah",
  "hI'm serious. You are in the money base",
  "hAlready one guy loving you:-.",
  "hStaff of placement training in Amrita college.",
  "hI always chat with you. In fact i need money can you raise me?",
  "hI'm job profile seems like bpo..",
  "hWell, I was about to give up cos they all said no they didn‘t do one nighters. I persevered and found one but it is very cheap so i apologise in advance. It is just somewhere to sleep isnt it?",
  "hSo you think i should actually talk to him? Not call his boss in the morning? I went to this place last year and he told me where i could go and get my car fixed cheaper. He kept telling me today how much he hoped i would come back in, how he always regretted not getting my number, etc.",
  "hAre you willing to go for apps class.",
  "hHanging out with my brother and his family",
  "hNo it will reach by 9 only. She telling she will be there. I dont know",
  "hHey... are you going to quit soon? Xuhui and i working till end of the month ",
  "hIm sorry bout last nite it wasn’t ur fault it was me, spouse it was pmt or sumthin! U 4give me? I think u shldxxxx",
  "hTry neva mate!!",
  "hYeah that'd pretty much be the best case scenario",
  "hI not free today i haf 2 pick my parents up tonite...",
  "h\"HEY BABE! FAR 2 SPUN-OUT 2 SPK AT DA MO... DEAD 2 DA WRLD. BEEN SLEEPING ON DA SOFA ALL DAY, HAD A COOL NYTHO, TX 4 FONIN HON, CALL 2MWEN IM BK FRMCLOUD 9! J X\"",
  "hShould i send you naughty pix? :)",
  "sYou are a £1000 winner or Guaranteed Caller Prize, this is our Final attempt to contact you! To Claim Call 09071517866 Now! 150ppmPOBox10183BhamB64XE",
  "sXmas & New Years Eve tickets are now on sale from the club, during the day from 10am till 8pm, and on Thurs, Fri & Sat night this week. They're selling fast!",
  "hTyler (getting an 8th) has to leave not long after 9, can you get here in like an hour?",
  "hPrepare to be pounded every night...",
  "hActually, my mobile is full of msg. And i m doing a work online, where i need to send them  &lt;#&gt;  sent msg i wil explain u later.",
  "hSorry, I'll call later",
  "hGood evening! How are you?",
  "hI'm at home. Please call",
  "hOic cos me n my sis got no lunch today my dad went out... So dunno whether 2 eat in sch or wat...",
  "hMmmmm ... It was sooooo good to wake to your words this morning, my Love!! Mmmm fuck ... I love you too, my Lion ... *devouring kiss from across the sea*",
  "hWe are pleased to inform that your application for Airtel Broadband is processed successfully. Your installation will happen within 3 days.",
  "hWhat happen dear. Why you silent. I am tensed",
  "hI'll get there at 3, unless you guys want me to come some time sooner",
  "hIf you are not coughing then its nothing",
  "hÜ come lt 25 n pass to me lar",
  "hI'm e person who's doing e sms survey...",
  "hLol ok ill try to send. Be warned Sprint is dead slow. You'll prolly get it tomorrow",
  "hThank You meet you monday",
  "hSO IS TH GOWER MATE WHICH IS WHERE I AM!?! HOW R U MAN? ALL IS GOOD IN WALES ILL B BACK ‘MORROW. C U THIS WK? WHO WAS THE MSG 4? - RANDOM!",
  "sRock yr chik. Get 100's of filthy films &XXX pics on yr phone now. rply FILTH to 69669. Saristar Ltd, E14 9YT 08701752560. 450p per 5 days. Stop2 cancel",
  "hSingle line with a big meaning::::: \"Miss anything 4 ur \"Best Life\" but, don't miss ur best life for anything... Gud nyt...",
  "hI got like $ &lt;#&gt; , I can get some more later though. Get whatever you feel like",
  "hDad wanted to talk about the apartment so I got a late start, omw now",
  "hI love you both too :-)",
  "hLol u still feeling sick?",
  "hDin i tell u jus now 420",
  "ham up to my eyes in philosophy",
  "sFrom next month get upto 50% More Calls 4 Ur standard network charge 2 activate Call 9061100010 C Wire3.net 1st4Terms PoBox84 M26 3UZ Cost £1.50 min MobcudB more",
  "hOk lor. I'm in town now lei.",
  "hI had it already..sabarish asked me to go..",
  "hNo da. . Vijay going to talk in jaya tv",
  "sURGENT! We are trying to contact U Todays draw shows that you have won a £800 prize GUARANTEED. Call 09050000460 from land line. Claim J89. po box245c2150pm",
  "hLol I know! Hey someone did a great inpersonation of flea on the forums. I love it!",
  "sText BANNEDUK to 89555 to see! cost 150p textoperator g696ga 18+ XXX",
  "hStill chance there. If you search hard you will get it..let have a try :)",
  "sAuction round 4. The highest bid is now £54. Next maximum bid is £71. To bid, send BIDS e. g. 10 (to bid £10) to 83383. Good luck.",
  "hDo you always celebrate NY's with your family ?",
  "hWe know TAJ MAHAL as symbol of love. But the other lesser known facts 1. Mumtaz was Shahjahan's 4th wife, out of his 7 wifes. 2. Shahjahan killed Mumtaz's husband to marry her. 3. Mumtaz died in her  &lt;#&gt; th delivery. 4. He then married Mumtaz's sister. Question arises where the Hell is the LOVE?:-| -The Great Hari-",
  "hIts ok..come to my home it vl nice to meet and v can chat..",
  "sCollect your VALENTINE'S weekend to PARIS inc Flight & Hotel + £200 Prize guaranteed! Text: PARIS to No: 69101. www.rtf.sphosting.com",
  "hSent me de webadres for geting salary slip",
  "hShe's fine. Sends her greetings",
  "sCustomer Loyalty Offer:The NEW Nokia6650 Mobile from ONLY £10 at TXTAUCTION! Txt word: START to No: 81151 & get yours Now! 4T&Ctxt TC 150p/MTmsg",
  "hBut you dint in touch with me.",
  "hYup, leaving right now, be back soon",
  "sYou won't believe it but it's true. It's Incredible Txts! Reply G now to learn truly amazing things that will blow your mind. From O2FWD only 18p/txt",
  "hYeah sure I'll leave in a min",
  "hAnd do you have any one that can teach me how to ship cars.",
  "hThe sign of maturity is not when we start saying big things.. But actually it is, when we start understanding small things... *HAVE A NICE EVENING* BSLVYL",
  "hYeah confirmed for you staying at  that weekend",
  "hThey said ü dun haf passport or smth like dat.. Or ü juz send to my email account..  ",
  "hMultiply the numbers independently and count decimal points then, for the division, push the decimal places like i showed you.",
  "hHave a lovely night and when you wake up to see this message, i hope you smile knowing all is as should be. Have a great morning",
  "hArd 4 lor...",
  "hYou are right. Meanwhile how's project twins comin up",
  "hI sent your maga that money yesterday oh.",
  "sHi 07734396839 IBH Customer Loyalty Offer: The NEW NOKIA6600 Mobile from ONLY £10 at TXTAUCTION!Txt word:START to No:81151 & get Yours Now!4T&",
  "hHeart is empty without love.. Mind is empty without wisdom.. Eyes r empty without dreams &amp; Life is empty without frnds.. So Alwys Be In Touch. Good night &amp; sweet dreams",
  "sI am hot n horny and willing I live local to you - text a reply to hear strt back from me 150p per msg Netcollex LtdHelpDesk: 02085076972 reply Stop to end",
  "hOur ride equally uneventful - not too many of those pesky cyclists around at that time of night ;).",
  "hIf you were/are free i can give. Otherwise nalla adi entey nattil kittum",
  "hI've sent my wife your text. After we buy them she'll tell you what to do. So just relax. We should go get them this wkend.",
  "hI am in escape theatre now. . Going to watch KAVALAN in a few minutes",
  "hHow much would it cost to hire a hitman",
  "hI anything lor...",
  "hSorry, I'll call later",
  "sDo you want a New Nokia 3510i Colour Phone Delivered Tomorrow? With 200 FREE minutes to any mobile + 100 FREE text + FREE camcorder Reply or Call 08000930705",
  "hHuh but i cant go 2 ur house empty handed right?",
  "hGood morning princess! Happy New Year!",
  "sCongratulations YOU'VE Won. You're a Winner in our August £1000 Prize Draw. Call 09066660100 NOW. Prize Code 2309.",
  "hAight, we'll head out in a few",
  "hThen wat r u doing now? Busy wif work?",
  "hI know you mood off today",
  "hJay told me already, will do",
  "hCps is causing the outages to conserve energy.",
  "hI'm not sure, I was just checking out what was happening around the area",
  "hHey morning what you come to ask:-) pa...",
  "hJordan got voted out last nite!",
  "hThat means you got an A in epi, she.s fine. She.s here now.",
  "hI have no idea where you are",
  "hPls come quick cant bare this.",
  "hJoy's father is John. Then John is the ____ of Joy's father. If u ans ths you hav  &lt;#&gt;  IQ. Tis s IAS question try to answer.",
  "hCall me. I m unable to cal. Lets meet bhaskar, and deep",
  "hNo. I.ll meet you in the library",
  "hK, my roommate also wants a dubsack and another friend may also want some so plan on bringing extra, I'll tell you when they know for sure",
  "hDepends on individual lor e hair dresser say pretty but my parents say look gong. U kaypoh.. I also dunno wat she collecting.",
  "hOk c ü then.",
  "hI enjoy watching and playing football and basketball. Anything outdoors. And you?",
  "hCan you please ask macho what his price range is, does he want something new or used plus it he only interfued in the blackberry bold  &lt;#&gt;  or any bb",
  "hSorry sent blank msg again. Yup but trying 2 do some serious studying now.",
  "hHey check it da. I have listed da.",
  "s8007 25p 4 Alfie Moon's Children in Need song on ur mob. Tell ur m8s. Txt TONE CHARITY to 8007 for nokias or POLY CHARITY for polys :zed 08701417012 profit 2 charity ",
  "hI meant as an apology from me for texting you to get me drugs at  &lt;#&gt; at night",
  "hThat means from february to april i'll be getting a place to stay down there so i don't have to hustle back and forth during audition season as i have since my sister moved away from harlem.",
  "hGoin to workout lor... Muz lose e fats... ",
  "hDamn, poor zac doesn't stand a chance",
  "hNo message..no responce..what happend?",
  "hI want to tel u one thing u should not mistake me k THIS IS THE MESSAGE THAT YOU SENT:)",
  "hYeah right! I'll bring my tape measure fri!",
  "hStill chance there. If you search hard you will get it..let have a try :)",
  "hMeeting u is my work. . . Tel me when shall i do my work tomorrow",
  "hShould I head straight there or what",
  "sGet the official ENGLAND poly ringtone or colour flag on yer mobile for tonights game! Text TONE or FLAG to 84199. Optout txt ENG STOP Box39822 W111WX £1.50",
  "hThank you princess! You are so sexy...",
  "hOooh I got plenty of those!",
  "hHui xin is in da lib.",
  "hIts a big difference.  &lt;#&gt;  versus  &lt;#&gt;  every  &lt;#&gt; hrs",
  "hIt's not that you make me cry. It's just that when all our stuff happens on top of everything else, it pushes me over the edge. You don't underdtand how often i cry over my sorry, sorry life.",
  "h\"ME 2 BABE I FEEL THE SAME LETS JUST 4GET ABOUT IT+BOTH TRY +CHEER UP+NOT FIT SOO MUCHXXLOVE U LOCAXX\"",
  "hYou know what hook up means right?",
  "sCustomer service announcement. We recently tried to make a delivery to you but were unable to do so, please call 07090298926 to re-schedule. Ref:9307622",
  "hWat's da model num of ur phone?",
  "hHe's really into skateboarding now despite the fact that he gets thrown off of it and winds up with bandages and shit all over his arms every five minutes",
  "sYou can stop further club tones by replying \"STOP MIX\" See my-tone.com/enjoy. html for terms. Club tones cost GBP4.50/week. MFL, PO Box 1146 MK45 2WT (2/3)",
  "hMy house here e sky quite dark liao... If raining then got excuse not 2 run already rite... Hee...",
  "hSorry, left phone upstairs. OK, might be hectic but would be all my birds with one fell swoop. It's a date.",
  "h* Thought I didn't see you.",
  "swamma get laid?want real doggin locations sent direct to your mobile? join the UKs largest dogging network. txt dogs to 69696 now!nyt. ec2a. 3lp £1.50/msg.",
  "hCarlos says we can pick up from him later so yeah we're set",
  "hHey babe, my friend had to cancel, still up for a visit ?",
  "hAs per your request 'Maangalyam (Alaipayuthe)' has been set as your callertune for all Callers. Press *9 to copy your friends Callertune",
  "hHmm ill have to think about it... ok you're forgiven! =D",
  "hWe are hoping to get away by 7, from Langport. You still up for town tonight?",
  "hWant to send me a virtual hug?... I need one",
  "hProbably not, still going over some stuff here",
  "hIt has issues right now. Ill fix for her by tomorrow.",
  "hWhy i come in between you people",
  "hSenthil group company Apnt 5pm.",
  "hOh really?? Did you make it on air? What's your talent?",
  "hStudying. But i.ll be free next weekend.",
  "hR u here yet? I'm wearing blue shirt n black pants.",
  "hWait.i will come out.. &lt;#&gt;  min:)",
  "hI will reach ur home in  &lt;#&gt;  minutes",
  "hWell then you have a great weekend!",
  "hWhat are you doing in langport? Sorry, but I'll probably be in bed by 9pm. It sucks being ill at xmas! When do you and go2sri lanka? ",
  "hFrnd s not juz a word.....not merely a relationship.....its a silent promise which says ... \" I will be with YOU \" Wherevr.. Whenevr.. Forevr... Gudnyt dear..",
  "hHuh? 6 also cannot? Then only how many mistakes?",
  "hHa... U jus ate honey ar? So sweet...",
  "hI'm turning off my phone. My moms telling everyone I have cancer. And my sister won't stop calling. It hurts to talk. Can't put up with it. See u when u get home. Love u",
  "hHoney ? Sweetheart ? Darling ? Sexy buns ? Sugar plum ? Loverboy ? I miss you, boytoy ... *smacks your ass* Did you go to the gym too ?",
  "hThanks for loving me so. You rock",
  "hYeah imma come over cause jay wants to do some drugs",
  "hOk thanx... Take care then...",
  "hYup. Thk of u oso boring wat.",
  "h came to look at the flat, seems ok, in his 50s? * Is away alot wiv work. Got woman coming at 6.30 too.",
  "hMoji just informed me that you saved our lives. Thanks.",
  "sYou have won a Nokia 7250i. This is what you get when you win our FREE auction. To take part send Nokia to 86021 now. HG/Suite342/2Lands Row/W1JHL 16+",
  "hWhos this am in class:-)",
  "hHey r ü still online? I've finished the formatting...",
  "hGreat! So what attracts you to the brothas?",
  "sPromotion Number: 8714714 - UR awarded a City Break and could WIN a £200 Summer Shopping spree every WK. Txt STORE to 88039 . SkilGme. TsCs087147403231Winawk!Age16 £1.50perWKsub",
  "hStupid.its not possible",
  "hI cant pick the phone right now. Pls send a message",
  "hLOL what happens in Vegas stays in vegas",
  "hHello, hello, hi lou sorry it took so long 2 reply- I left mobile at friends in Lancaster, just got it bak Neway im sorry I couldn’t make ur b’day 2 hun!",
  "hWhen did i use soc... I use it only at home... Ü dunno how 2 type it in word ar...",
  "hDad says hurry the hell up",
  "hWake me up at  &lt;#&gt;  am morning:)",
  "hI get out of class in bsn in like  &lt;#&gt;  minutes, you know where advising is?",
  "hGreat! I shoot big loads so get ready!",
  "hI'll meet you in the lobby",
  "hYou still coming tonight?",
  "hWhat happen dear tell me",
  "hSir, i am waiting for your call, once free please call me.",
  "hNo i am not having not any movies in my laptop",
  "hI was about to do it when i texted. I finished a long time ago and showered and er'ything!",
  "hOk im not sure what time i finish tomorrow but i wanna spend the evening with you cos that would be vewy vewy lubly! Love me xxx",
  "hHello, As per request from  &lt;#&gt;  Rs.5 has been transfered to you",
  "hI am in tirupur.  call you da.",
  "sYou are a winner you have been specially selected to receive £1000 cash or a £2000 award. Speak to a live operator to claim call 087147123779am-7pm. Cost 10p",
  "hS:)but he had some luck.2 catches put down:)",
  "hHow i noe... Did ü specify da domain as nusstu... Ü still in sch...",
  "hOh...i asked for fun. Haha...take care. ü",
  "hShall i get my pouch?",
  "hHey loverboy! I love you !! I had to tell ... I look at your picture and ache to feel you between my legs ... Fuck I want you ... I need you ... I crave you .",
  "hHow is my boy? No sweet words left for me this morning ... *sighs* ... How goes you day, my love ? Did you start your studying?",
  "hKent vale lor... Ü wait 4 me there ar?",
  "hOk. Very good. Its all about making that money.",
  "hReading gud habit.. Nan bari hudgi yorge pataistha ertini kano:-)",
  "hAight do you still want to get money",
  "sFree Top ringtone -sub to weekly ringtone-get 1st week free-send SUBPOLY to 81618-?3 per week-stop sms-08718727870",
  "hOk.ok ok..then..whats ur todays plan",
  "hARE YOU IN TOWN? THIS IS V. IMPORTANT",
  "hSorry pa, i dont knw who ru pa?",
  "hWat u doing there?",
  "hIf i not meeting ü all rite then i'll go home lor. If ü dun feel like comin it's ok.",
  "hOh, i will get paid. The most outstanding one is for a commercial i did for Hasbro...in AUGUST! They made us jump through so many hoops to get paid. Still not.",
  "hI am late,so call you tomorrow morning.take care sweet dreams....u and me...ummifying...bye.",
  "hNetworking technical support associate.",
  "hI'm gonna rip out my uterus.",
  "hCool. Do you like swimming? I have a pool and jacuzzi at my house.",
  "sThanks for your ringtone order, reference number X49. Your mobile will be charged 4.50. Should your tone not arrive please call customer services 09065989182. From: [colour=red]text[/colour]TXTstar",
  "hYeah why not, is the gang all ready",
  "hBlank is Blank. But wat is blank? Lol",
  "hI'm in a movie... Collect car oredi...",
  "hWe left already we at orchard now.",
  "sHi there, 2nights ur lucky night! Uve been invited 2 XCHAT, the Uks wildest chat! Txt CHAT to 86688 now! 150p/MsgrcvdHG/Suite342/2Lands/Row/W1J6HL LDN 18yrs",
  "hNothing spl..wat abt u and whr ru?",
  "hNo chikku nt yet.. Ya i'm free",
  "hAldrine, rakhesh ex RTM here.pls call.urgent.",
  "hThe search 4 happiness is 1 of d main sources of unhappiness! Accept life the way it comes! U will find happiness in every moment u live.",
  "hI'm at home. Please call",
  "hI guess you could be as good an excuse as any, lol.",
  "hIsn't frnd a necesity in life? imagine urself witout a frnd.. hw'd u feel at ur colleg? wat'll u do wth ur cell? wat abt functions? thnk abt events espe'll cared, missed &amp; irritated u? 4wrd it to all those dear-loving frnds wthout whom u cant live.. I jst did it.. Takecare..:) GOODMORNING",
  "hGud mrng dear hav a nice day",
  "hOld Orchard near univ. How about you?",
  "h4 tacos + 1 rajas burrito, right?",
  "hIt‘s £6 to get in, is that ok?",
  "hHows the street where the end of library walk is?",
  "hPlz note: if anyone calling from a mobile Co. &amp; asks u to type # &lt;#&gt;  or # &lt;#&gt; . Do not do so. Disconnect the call,coz it iz an attempt of 'terrorist' to make use of the sim card no. Itz confirmd by nokia n motorola n has been verified by CNN IBN.",
  "hWe stopped to get ice cream and will go back after",
  "hDid you stitch his trouser",
  "hNo da. . Vijay going to talk in jaya tv",
  "s2/2 146tf150p",
  "hHey i'm bored... So i'm thinking of u... So wat r u doing?",
  "hNah, Wednesday. When should I bring the mini cheetos bag over?",
  "hNobody names their penis a girls name this story doesn't add up at all",
  "hAight, let me know when you're gonna be around usf",
  "hI'm not. She lip synced with shangela.",
  "hÜ neva tell me how i noe... I'm not at home in da aft wat... ",
  "hA bit of Ur smile is my hppnss, a drop of Ur tear is my sorrow, a part of Ur heart is my life, a heart like mine wil care for U, forevr as my GOODFRIEND",
  "sDear Voucher Holder 2 claim your 1st class airport lounge passes when using Your holiday voucher call 08704439680. When booking quote 1st class x 2",
  "hBuzz! Hey, my Love ! I think of you and hope your day goes well. Did you sleep in ? I miss you babe. I long for the moment we are together again*loving smile*",
  "hHaha... Sounds crazy, dunno can tahan anot...",
  "hWhy are u up so early?",
  "hYa that one is slow as poo",
  "sBloomberg -Message center +447797706009 Why wait? Apply for your future http://careers. bloomberg.com",
  "h\"Im on gloucesterroad what are uup to later?\"",
  "hYes:)here tv is always available in work place..",
  "sYES! The only place in town to meet exciting adult singles is now in the UK. Txt CHAT to 86688 now! 150p/Msg.",
  "hLol no ouch but wish i'd stayed out a bit longer",
  "hGOD ASKED, \"What is forgiveness?\" A little child gave lovely reply, \"It is d wonderful fruit that a tree gives when it is being hurt by a stone.. Good night......",
  "hWe'll join the  &lt;#&gt;  bus",
  "hWas just about to ask. Will keep this one. Maybe that's why you didn't get all the messages we sent you on glo",
  "sFREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 8007 Get txting and tell ur mates www.getzed.co.uk POBox 36504 W45WQ norm150p/tone 16+",
  "hK.i will send in  &lt;#&gt;  min:)",
  "hWould me smoking you out help us work through this difficult time",
  "sSomeone U know has asked our dating service 2 contact you! Cant guess who? CALL 09058095107 NOW all will be revealed. POBox 7, S3XY 150p ",
  "hYes.mum lookin strong:)",
  "hSir Goodmorning, Once free call me.",
  "hWhere are you call me.",
  "hWas gr8 to see that message. So when r u leaving? Congrats dear. What school and wat r ur plans.",
  "hLove it! The girls at the office may wonder why you are smiling but sore...",
  "hHi, wlcome back, did wonder if you got eaten by a lion or something, nothing much",
  "hDoes uncle timi help in clearing cars",
  "hI came hostel. I m going to sleep. Plz call me up before class. Hrishi.",
  "hOk... But bag again..",
  "hHi! You just spoke to MANEESHA V. We'd like to know if you were satisfied with the experience. Reply Toll Free with Yes or No.",
  "hOk lor. Msg me b4 u call.",
  "sMila, age23, blonde, new in UK. I look sex with UK guys. if u like fun with me. Text MTALK to 69866.18 . 30pp/txt 1st 5free. £1.50 increments. Help08718728876",
  "hOnce a fishrman woke early in d mrng. It was very dark. He waited a while &amp; found a sack ful of stones. He strtd throwin thm in2 d sea 2 pass time. Atlast he had jus 1stone, sun rose up &amp; he found out tht those r nt stones, those were diamonds. Moral:\"Dont wake up early in d mrng'' GOOD night",
  "sClaim a 200 shopping spree, just call 08717895698 now! Have you won! MobStoreQuiz10ppm",
  "hThen ur physics get a-?",
  "hDear friends, sorry for the late information. Today is the birthday of our loving Ar.Praveesh. for more details log on to face book and see. Its his number + &lt;#&gt; . Dont miss a delicious treat.",
  "hHow r ü going to send it to me?",
  "hCan you do online transaction?",
  "hDear got train and seat mine lower seat",
  "hLet me know if you need anything else. Salad or desert or something... How many beers shall i get?",
  "hWat r u doing?",
  "hWHORE YOU ARE UNBELIEVABLE.",
  "sWant to funk up ur fone with a weekly new tone reply TONES2U 2 this text. www.ringtones.co.uk, the original n best. Tones 3GBP network operator rates apply",
  "hAre you sure you don't mean \"get here, we made you hold all the weed\"",
  "hI love you !!! You know? Can you feel it? Does it make your belly warm? I wish it does, my love ... I shall meet you in your dreams, Ahmad ... *adoring kiss*",
  "sTwinks, bears, scallies, skins and jocks are calling now. Don't miss the weekend's fun. Call 08712466669 at 10p/min. 2 stop texts call 08712460324(nat rate)",
  "hLove it! I want to flood that pretty pussy with cum...",
  "hHey are you angry with me. Reply me dr.",
  "hShort But Cute: \"Be a good person, but dont try to prove it..\" .Gud noon....",
  "hAlso remember the beads don't come off. Ever.",
  "hThey have a thread on the wishlist section of the forums where ppl post nitro requests. Start from the last page and collect from the bottom up.",
  "hFor The First Time In The History 'Need' 'Comfort' And 'Luxury' Are Sold At Same Price In India..!! Onion-Rs. &lt;#&gt;  Petrol-Rs. &lt;#&gt;  Beer-Rs. &lt;#&gt;  SHESIL  &lt;#&gt;",
  "hFeb  &lt;#&gt;  is \"I LOVE U\" day. Send dis to all ur \"VALUED FRNDS\" evn me. If 3 comes back u'll gt married d person u luv! If u ignore dis u will lose ur luv 4 Evr",
  "hActually nvm, got hella cash, we still on for  &lt;#&gt; ish?",
  "sWe tried to contact you re your reply to our offer of a Video Handset? 750 anytime any networks mins? UNLIMITED TEXT? Camcorder? Reply or call 08000930705 NOW",
  "hIt's ok, at least armand's still around",
  "hNo da. I am happy that we sit together na",
  "hYup song bro. No creative. Neva test quality. He said check review online.",
  "hNo dude, its not fake..my frnds got money, thts y i'm reffering u..if u member wit my mail link, u vl be credited  &lt;#&gt; rs and il be getiing  &lt;#&gt; rs..i can draw my acc wen it is  &lt;#&gt; rs..",
  "hDude while were makin those weirdy brownies my sister made awesome cookies. I took pics.",
  "sURGENT! We are trying to contact you. Last weekends draw shows that you have won a £900 prize GUARANTEED. Call 09061701851. Claim code K61. Valid 12hours only",
  "hPls dont restrict her from eating anythin she likes for the next two days.",
  "hMm you ask him to come its enough :-)",
  "hAt the funeral home with Audrey and dad",
  "hAight, can you text me the address?",
  "hExcellent! Wish we were together right now!",
  "hYep then is fine 7.30 or 8.30 for ice age.",
  "hPls i wont belive god.not only jesus.",
  "hCan. Dunno wat to get 4 her...",
  "hNot yet chikku..k, then wat abt tht guy did he stopped irritating or msging to u..",
  "hHow long does it take to get it.",
  "hThis is my number by vivek..",
  "s74355 XMAS iscoming & ur awarded either £500 CD gift vouchers & free entry 2 r £100 weekly draw txt MUSIC to 87066 TnC",
  "hsorry brah, just finished the last of my exams, what up",
  "hI got arrested for possession at, I shit you not,  &lt;TIME&gt;  pm",
  "hYou are right though. I can't give you the space you want and need. This is really starting to become an issue. I was going to suggest setting a definite move out--if i'm still there-- after greece. But maybe you are ready and should do it now.",
  "hJust normal only here :)",
  "hPlease protect yourself from e-threats. SIB never asks for sensitive information like Passwords,ATM/SMS PIN thru email. Never share your password with anybody.",
  "hI miss you so much I'm so desparate I have recorded the message you left for me the other day and listen to it just to hear the sound of your voice. I love you",
  "hHi. I'm always online on yahoo and would like to chat with you someday",
  "hGoodmorning,my grandfather expired..so am on leave today.",
  "sCongratulations U can claim 2 VIP row A Tickets 2 C Blu in concert in November or Blu gift guaranteed Call 09061104276 to claim TS&Cs www.smsco.net cost£3.75max ",
  "hWhere are you ? What are you doing ? Are yuou working on getting the pc to your mom's ? Did you find a spot that it would work ? I need you",
  "hSure, I'll see if I can come by in a bit",
  "hI agree. So i can stop thinkin about ipad. Can you please ask macho the same question.",
  "hLet's pool our money together and buy a bunch of lotto tickets. If we win I get &lt;#&gt; % u get &lt;#&gt; %. Deal?",
  "hOk.",
  "hI had askd u a question some hours before. Its answer",
  "hWatching tv lor. Nice one then i like lor.",
  "hI'm thinking that chennai forgot to come for auction..",
  "hThen ü come n pick me at 530 ar?",
  "hEarly bird! Any purchases yet?",
  "hWent to pay rent. So i had to go to the bank to authorise the payment.",
  "hErm … ill pick you up at about 6.45pm. That'll give enough time to get there, park and that.",
  "hHEY MATE! HOWS U HONEY?DID U AVE GOOD HOLIDAY? GIMMI DE GOSS!x",
  "hHowz pain.it will come down today.do as i said ystrday.ice and medicine.",
  "hchile, please! It's only a  &lt;DECIMAL&gt;  hour drive for me. I come down all the time and will be subletting feb-april for audition season.",
  "hYes ammae....life takes lot of turns you can only sit and try to hold the steering...",
  "hYeah that's what I thought, lemme know if anything's goin on later",
  "hMmmm.... I cant wait to lick it!",
  "hPls go there today  &lt;#&gt; . I dont want any excuses",
  "sFantasy Football is back on your TV. Go to Sky Gamestar on Sky Active and play £250k Dream Team. Scoring starts on Saturday, so register now!SKY OPT OUT to 88088",
  "hCan you plz tell me the ans. BSLVYL sent via fullonsms.com",
  "hU in town alone?",
  "hI to am looking forward to all the sex cuddling.. Only two more sleeps ",
  "hWe have all rounder:)so not required:)",
  "hNo, its true..k,Do u knw dis no. &lt;#&gt; ?",
  "hDont worry, 1 day very big lambu ji vl come..til then enjoy batchlor party:-)",
  "hoh ya... Got hip hop open. Haha i was thinking can go for jazz then zoom to cine... Actually tonight i'm free leh... And there's a kb lesson tonight",
  "sFree msg: Single? Find a partner in your area! 1000s of real people are waiting to chat now!Send CHAT to 62220Cncl send STOPCS 08717890890£1.50 per msg",
  "hI'm ok. Will do my part tomorrow",
  "hNo! But we found a diff farm shop to buy some cheese. On way back now, can i call in?",
  "hR u still working now?",
  "sWin the newest “Harry Potter and the Order of the Phoenix (Book 5) reply HARRY, answer 5 questions - chance to be the first among readers!",
  "hYep. I do like the pink furniture tho.",
  "sFree Msg: Ringtone!From: http://tms. widelive.com/index. wml?id=1b6a5ecef91ff9*37819&first=true18:0430-JUL-05",
  "hCustomer place, i wil cal u sir.",
  "sOh my god! I've found your number again! I'm so glad, text me back xafter this msgs cst std ntwk chg £1.50",
  "hA pure hearted person can have a wonderful smile that makes even his/her enemies to feel guilty for being an enemy.. So catch the world with your smile..:) GOODMORNING &amp; HAVE A SMILEY SUNDAY..:)",
  "hTHAT’S ALRITE GIRL, U KNOW GAIL IS NEVA WRONG!!TAKE CARE SWEET AND DON’T WORRY.C U L8TR HUN!LOVE Yaxxx",
  "hTheoretically yeah, he could be able to come",
  "hAlright we're hooked up, where you guys at",
  "hnot that I know of, most people up here are still out of town",
  "hNo let me do the math. Your not good at it.",
  "hOh ok wait 4 me there... My lect havent finish",
  "hYeah my usual guy's out of town but there're definitely people around I know",
  "hI am joining today formally.Pls keep praying.will talk later.",
  "hHappy or sad , one thing about past is- \"Its no more\" GOOD MORNING :-):-).",
  "hNo. Did you multimedia message them or e-mail?",
  "hOkie but i scared u say i fat... Then u dun wan me already...",
  "hdid u get that message",
  "hSorry sir, i will call you tomorrow.  senthil.hsbc",
  "hWhat you need. You have a person to give na.",
  "hShe left it very vague. She just said she would inform the person in accounting about the delayed rent and that i should discuss with the housing agency about my renting another place. But checking online now and all places around usc are  &lt;#&gt;  and up",
  "hHi juan. Im coming home on fri hey. Of course i expect a welcome party and lots of presents. Ill phone u when i get back. Loads of love nicky x x x x x x x x x",
  "hCan you plz tell me the ans. BSLVYL sent via fullonsms.com",
  "hShort But Cute: \"Be a good person, but dont try to prove it..\" .Gud noon....",
  "hGumby's has a special where a  &lt;#&gt; \" cheese pizza is $2 so I know what we're doin tonight",
  "sA link to your picture has been sent. You can also use http://alto18.co.uk/wave/wave.asp?o=44345",
  "hLike a personal sized or what",
  "hSame, I'm at my great aunts anniversary party in tarpon springs",
  "hCab is available.they pick up and drop at door steps.",
  "hok....take care.umma to you too...",
  "hUnlimited texts. Limited minutes.",
  "sDouble Mins & 1000 txts on Orange tariffs. Latest Motorola, SonyEricsson & Nokia with Bluetooth FREE! Call MobileUpd8 on 08000839402 or call2optout/HF8",
  "hNo problem. We will be spending a lot of quality time together...",
  "sURGENT This is our 2nd attempt to contact U. Your £900 prize from YESTERDAY is still awaiting collection. To claim CALL NOW 09061702893. ACL03530150PM",
  "hHave you heard from this week?",
  "sDear Dave this is your final notice to collect your 4* Tenerife Holiday or #5000 CASH award! Call 09061743806 from landline. TCs SAE Box326 CW25WX 150ppm",
  "hYes. Last  practice",
  "stells u 2 call 09066358152 to claim £5000 prize. U have 2 enter all ur mobile & personal details @ the prompts. Careful!",
  "hNo. Thank you. You've been wonderful",
  "hOtherwise had part time job na-tuition..",
  "hÜ mean it's confirmed... I tot they juz say oni... Ok then... ",
  "hOkie",
  "hThat depends. How would you like to be treated? :)",
  "hRight on brah, see you later",
  "hWaiting in e car 4 my mum lor. U leh? Reach home already?",
  "sYour 2004 account for 07XXXXXXXXX shows 786 unredeemed points. To claim call 08719181259 Identifier code: XXXXX Expires 26.03.05",
  "sDo you want a new video handset? 750 anytime any network mins? Half Price Line Rental? Camcorder? Reply or call 08000930705 for delivery tomorrow",
  "hWent fast asleep dear.take care.",
  "hNo that just means you have a fat head",
  "hSounds like a plan! Cardiff is still here and still cold! I'm sitting on the radiator!",
  "hSerious? What like proper tongued her",
  "hShe.s good. She was wondering if you wont say hi but she.s smiling now. So how are you coping with the long distance",
  "hHow i noe... She's in da car now... Later then c lar... I'm wearing shorts...",
  "sYou have an important customer service announcement. Call FREEPHONE 0800 542 0825 now!",
  "hYeah whatever lol",
  "hToday is ACCEPT DAY..U Accept me as? Brother Sister Lover Dear1 Best1 Clos1 Lvblefrnd Jstfrnd Cutefrnd Lifpartnr Belovd Swtheart Bstfrnd No rply means enemy",
  "hArd 530 lor. I ok then message ü lor.",
  "hOk. C u then.",
  "hEh ur laptop got no stock lei... He say mon muz come again to take a look c got a not...",
  "hNo need to ke qi... Ü too bored izzit y suddenly thk of this...",
  "hI wish! I don't think its gonna snow that much. But it will be more than those flurries we usually get that melt before they hit the ground. Eek! We haven't had snow since &lt;#&gt; before I was even born!",
  "sFREE>Ringtone! Reply REAL or POLY eg REAL1 1. PushButton 2. DontCha 3. BabyGoodbye 4. GoldDigger 5. WeBeBurnin 1st tone FREE and 6 more when u join for £3/wk",
  "hDo 1 thing! Change that sentence into: \"Because i want 2 concentrate in my educational career im leaving here..\"",
  "hOh really? perform, write a paper, go to a movie AND be home by midnight, huh?",
  "hOkay lor... Will they still let us go a not ah? Coz they will not know until later. We drop our cards into the box right?",
  "hHow? Izzit still raining?",
  "hAs if i wasn't having enough trouble sleeping.",
  "hI havent add ü yet right.. ",
  "hLol ... I really need to remember to eat when I'm drinking but I do appreciate you keeping me company that night babe *smiles*",
  "hBabe ? I lost you ... Will you try rebooting ?",
  "hYes. Nigh you cant aha.",
  "hI thk ü gotta go home by urself. Cos i'll b going out shopping 4 my frens present. ",
  "hNooooooo I'm gonna be bored to death all day. Cable and internet outage.",
  "hSos! Any amount i can get pls.",
  "hPlayin space poker, u?",
  "hHow come guoyang go n tell her? Then u told her?",
  "hYou need to get up. Now.",
  "hThey r giving a second chance to rahul dengra.",
  "hYeah, in fact he just asked if we needed anything like an hour ago. When and how much?",
  "hWHEN THE FIRST STRIKE IS A RED ONE. THE BIRD + ANTELOPE BEGIN TOPLAY IN THE FIELDOF SELFINDEPENDENCE BELIEVE THIS + THE FLOWER OF CONTENTION WILL GROW.RANDOM!",
  "hY ü wan to go there? C doctor?",
  "hDoes daddy have a bb now.",
  "sFree Msg: get Gnarls Barkleys \"Crazy\" ringtone TOTALLY FREE just reply GO to this message right now!",
  "hShe's borderline but yeah whatever.",
  "hI got a call from a landline number. . . I am asked to come to anna nagar . . . I will go in the afternoon",
  "hUntil 545 lor... Ya, can go 4 dinner together...",
  "hI will be gentle princess! We will make sweet gentle love...",
  "hHow u doin baby girl ?? hope u are okay every time I call ure phone is off! I miss u get in touch",
  "hSorry, went to bed early, nightnight",
  "hI like to think there's always the possibility of being in a pub later.",
  "hHMM yeah if your not too grooved out! And im looking forward to my pound special :)",
  "hI got to video tape pple type in message lor. U so free wan 2 help me? Hee... Cos i noe u wan 2 watch infernal affairs so ask u along. Asking shuhui oso.",
  "hHi dude hw r u da realy mising u today",
  "hMe hungry buy some food good lei... But mum n yun dun wan juz buy a little bit... ",
  "sRefused a loan? Secured or Unsecured? Can't get credit? Call free now 0800 195 6669 or text back 'help' & we will!",
  "hI probably won't eat at all today. I think I'm gonna pop. How was your weekend? Did u miss me?",
  "hI knew it... U slept v late yest? Wake up so late...",
  "hHaha... dont be angry with yourself... Take it as a practice for the real thing. =) ",
  "hWhere is that one day training:-)",
  "hSo i could kiss and feel you next to me...",
  "hHave a nice day my dear.",
  "hI sent lanre fakeye's Eckankar details to the mail box",
  "hYour dad is back in ph?",
  "sYou have been specially selected to receive a \"3000 award! Call 08712402050 BEFORE the lines close. Cost 10ppm. 16+. T&Cs apply. AG Promo",
  "hIf you ask her or she say any please message.",
  "hIf e timing can, then i go w u lor...",
  "hLove you aathi..love u lot..",
  "hI was just callin to say hi. Take care bruv!",
  "sYOU HAVE WON! As a valued Vodafone customer our computer has picked YOU to win a £150 prize. To collect is easy. Just call 09061743386",
  "hDid u turn on the heater? The heater was on and set to &lt;#&gt; degrees.",
  "hThanks for your message. I really appreciate your sacrifice. I'm not sure of the process of direct pay but will find out on my way back from the test tomorrow. I'm in class now. Do have a wonderful day.",
  "hThat's the trouble with classes that go well - you're due a dodgey one … Expecting mine tomo! See you for recovery, same time, same place ",
  "sFree video camera phones with Half Price line rental for 12 mths and 500 cross ntwk mins 100 txts. Call MobileUpd8 08001950382 or Call2OptOut/674&",
  "hWOT U UP 2 J?",
  "hNight night, see you tomorrow",
  "hRoger that. We‘re probably going to rem in about 20",
  "hdo u think that any girl will propose u today by seing ur bloody funky shit fucking face...............asssssholeeee................",
  "hI wish u were here. I feel so alone",
  "sGreat NEW Offer - DOUBLE Mins & DOUBLE Txt on best Orange tariffs AND get latest camera phones 4 FREE! Call MobileUpd8 free on 08000839402 NOW! or 2stoptxt T&Cs",
  "hReason is if the team budget is available at last they buy the unsold players for at base rate..",
  "hCERI U REBEL! SWEET DREAMZ ME LITTLE BUDDY!! C YA 2MORO! WHO NEEDS BLOKES",
  "sringtoneking 84484",
  "hHuh i cant thk of more oredi how many pages do we have?",
  "hHis frens go then he in lor. Not alone wif my mum n sis lor.",
  "hNationwide auto centre (or something like that) on Newport road. I liked them there",
  "hHey, I missed you tm of last night as my phone was on the charge ... *smiles* ... I am meeting a friend shortly",
  "hWhatever, juliana. Do whatever you want.",
  "hFriendship is not a game to play, It is not a word to say, It doesn\\'t start on March and ends on May, It is tomorrow, yesterday, today and e",
  "sRingtone Club: Gr8 new polys direct to your mobile every week !",
  "hHello. Sort of out in town already. That . So dont rush home, I am eating nachos. Will let you know eta.",
  "hOk lor. Anyway i thk we cant get tickets now cos like quite late already. U wan 2 go look 4 ur frens a not? Darren is wif them now...",
  "s(Bank of Granite issues Strong-Buy) EXPLOSIVE PICK FOR OUR MEMBERS *****UP OVER 300% *********** Nasdaq Symbol CDGT That is a $5.00 per..",
  "hI am on the way to ur home",
  "hDizzamn, aight I'll ask my suitemates when I get back",
  "hNimbomsons. Yep phone knows that one. Obviously, cos thats a real word",
  "hI love to cuddle! I want to hold you in my strong arms right now...",
  "hR u in this continent?",
  "hWe'll you pay over like  &lt;#&gt; yrs so its not too difficult",
  "sBored housewives! Chat n date now! 0871750.77.11! BT-national rate 10p/min only from landlines!",
  "sWe tried to call you re your reply to our sms for a video mobile 750 mins UNLIMITED TEXT free camcorder Reply or call now 08000930705 Del Thurs",
  "hK...k...when will you give treat?",
  "sThis is the 2nd time we have tried to contact u. U have won the £400 prize. 2 claim is easy, just call 087104711148 NOW! Only 10p per minute. BT-national-rate",
  "hHe's just gonna worry for nothing. And he won't give you money its no use.",
  "hDid you get any gift? This year i didnt get anything. So bad",
  "hsomewhere out there beneath the pale moon light someone think in of u some where out there where dreams come true... goodnite &amp; sweet dreams",
  "hWell there's a pattern emerging of my friends telling me to drive up and come smoke with them and then telling me that I'm a weed fiend/make them smoke too much/impede their doing other things so you see how I'm hesitant",
  "h, ow u dey.i paid 60,400thousad.i told  u would call . ",
  "hIM FINE BABES AINT BEEN UP 2 MUCH THO! SAW SCARY MOVIE YEST ITS QUITE FUNNY! WANT 2MRW AFTERNOON? AT TOWN OR MALL OR SUMTHIN?xx",
  "hI'm reaching home in 5 min.",
  "hForgot you were working today! Wanna chat, but things are ok so drop me a text when you're free / bored etc and i'll ring. Hope all is well, nose essay and all xx",
  "hHa... Then we must walk to everywhere... Cannot take tram. My cousin said can walk to vic market from our hotel ",
  "sWan2 win a Meet+Greet with Westlife 4 U or a m8? They are currently on what tour? 1)Unbreakable, 2)Untamed, 3)Unkempt. Text 1,2 or 3 to 83049. Cost 50p +std text",
  "sPlease call our customer service representative on FREEPHONE 0808 145 4742 between 9am-11pm as you have WON a guaranteed £1000 cash or £5000 prize!",
  "hDiscussed with your mother ah?",
  "hOk.",
  "hSorry, I can't text &amp; drive coherently, see you in twenty",
  "sYou will be receiving this week's Triple Echo ringtone shortly. Enjoy it!",
  "hIn which place i can get rooms cheap:-)",
  "hEek that's a lot of time especially since American Pie is like 8 minutes long. I can't stop singing it.",
  "h\"GRAN ONLYFOUND OUT AFEW DAYS AGO.CUSOON HONI\"",
  "sU've been selected to stay in 1 of 250 top British hotels - FOR NOTHING! Holiday valued at £350! Dial 08712300220 to claim - National Rate Call. Bx526, SW73SS",
  "hUniversity of southern california.",
  "hWe have to pick rayan macleran there.",
  "hU gd lor go shopping i got stuff to do. U wan 2 watch infernal affairs a not? Come lar...",
  "hWell. Balls. Time to make calls",
  "hWat time ü wan today?",
  "h &lt;#&gt;  in mca. But not conform.",
  "hOh ok.. Wat's ur email?",
  "hYes, princess. Are you going to make me moan?",
  "hLol its ok I didn't remember til last nite",
  "h[…] anyway, many good evenings to u! s",
  "hCool, I'll text you in a few",
  "hSorry vikky, i'm Watching olave mandara movie kano in trishul theatre wit my frnds..",
  "hI'm very happy for you babe ! Woo hoo party on dude!",
  "hI am taking you for italian food. How about a pretty dress with no panties? :)",
  "hWot u up 2? Thout u were gonna call me!! Txt bak luv K",
  "sYOU ARE CHOSEN TO RECEIVE A £350 AWARD! Pls call claim number 09066364311 to collect your award which you are selected to receive as a valued mobile customer.",
  "hHow are you holding up?",
  "hDont flatter yourself... Tell that man of mine two pints of carlin in ten minutes please.... ",
  "hHope you are not scared!",
  "hI cant pick the phone right now. Pls send a message",
  "hI'm at home n ready...",
  "sPlease call our customer service representative on FREEPHONE 0808 145 4742 between 9am-11pm as you have WON a guaranteed £1000 cash or £5000 prize!",
  "hWhat time do u get out?",
  "hI am literally in bed and have been up for like  &lt;#&gt;  hours",
  "hYes, my reg is  Ciao!",
  "hIf You mean the website. Yes.",
  "sWin a £1000 cash prize or a prize worth £5000",
  "sThanks for your ringtone order, reference number X49.Your mobile will be charged 4.50. Should your tone not arrive please call customer services 09065989182",
  "hLol or I could just starve and lose a pound by the end of the day.",
  "hYeah that's the impression I got",
  "hOk ok take care. I can understand.",
  "hMotivate Behind every darkness, there is a shining light waiting for you to find it... Behind every best friend, there is always trust and love... BSLVYL",
  "hYa ok, then had dinner?",
  "hI was slept that time.you there?",
  "hdont make ne plans for nxt wknd coz she wants us to come down then ok",
  "hWhen is school starting. Where will you stay. What's the weather like. And the food. Do you have a social support system like friends in the school. All these things are important.",
  "hHa ha nan yalrigu heltini..Iyo kothi chikku, u shared many things wit me..so far i didn't told any body and even uttered a word abt u.. If ur trusting me so much how can i tell these to others.. Plz nxt time dont use those words to me..ok, chikku:-);-)B-)",
  "hNoice. Text me when you're here",
  "hHi di is yijue we're meeting at 7 pm at esaplanade tonight.",
  "sMoby Pub Quiz.Win a £100 High Street prize if u know who the new Duchess of Cornwall will be? Txt her first name to 82277.unsub STOP £1.50 008704050406 SP",
  "sThis weeks SavaMob member offers are now accessible. Just call 08709501522 for details! SavaMob, POBOX 139, LA3 2WU. Only £1.50/week. SavaMob - offers mobile!",
  "hAight I've been set free, think you could text me blake's address? It occurs to me I'm not quite as sure what I'm doing as I thought I was",
  "hHi dear we saw dear. We both are happy. Where you my battery is low",
  "hHow are you. Its been ages. How's abj",
  "hProf: you have passed in all the papers in this sem congrats . . . . Student: Enna kalaachutaarama..!! Prof:???? Gud mrng!",
  "hDont kick coco when he's down",
  "hFyi I'm gonna call you sporadically starting at like  &lt;#&gt;  bc we are not not doin this shit",
  "sYou are being contacted by our Dating Service by someone you know! To find out who it is, call from your mobile or landline 09064017305 PoBox75LDNS7 ",
  "sTBS/PERSOLVO. been chasing us since Sept for£38 definitely not paying now thanks to your information. We will ignore them. Kath. Manchester.",
  "hHope you’re not having too much fun without me!! see u tomorrow love jess x",
  "hOk i wont call or disturb any one. I know all are avoiding me. I am a burden for all",
  "hI've reached home n i bathe liao... U can call me now...",
  "sLoans for any purpose even if you have Bad Credit! Tenants Welcome. Call NoWorriesLoans.com on 08717111821",
  "hWas the actual exam harder than NBME",
  "hA lot of this sickness thing going round. Take it easy. Hope u feel better soon. Lol",
  "hGod picked up a flower and dippeditinaDEW, lovingly touched itwhichturnedinto u, and the he gifted tomeandsaid,THIS FRIEND IS 4U",
  "s87077: Kick off a new season with 2wks FREE goals & news to ur mobile! Txt ur club name to 87077 eg VILLA to 87077",
  "hHey sathya till now we dint meet not even a single time then how can i saw the situation sathya.",
  "hGam gone after outstanding innings.",
  "hO i played smash bros  &lt;#&gt;  religiously.",
  "hSir, good morning. Hope you had a good weekend. I called to let you know that i was able to raise  &lt;#&gt;  from my dad. He however said he would make the rest available by mid feb. This amount is still quite short and i was hoping you would help. Do have a good day. Abiola",
  "hHurry home. Soup is DONE!",
  "hNo no. I will check all rooms befor activities",
  "hGood afternoon, my love. It was good to see your words on YM and get your tm. Very smart move, my slave ... *smiles* ... I drink my coffee and await you.",
  "hQuite ok but a bit ex... U better go eat smth now else i'll feel guilty...",
  "sOrange brings you ringtones from all time Chart Heroes, with a free hit each week! Go to Ringtones & Pics on wap. To stop receiving these tips reply STOP.",
  "hLemme know when you're here",
  "sPRIVATE! Your 2003 Account Statement for 07973788240 shows 800 un-redeemed S. I. M. points. Call 08715203649 Identifier Code: 40533 Expires 31/10/04",
  "hHe needs to stop going to bed and make with the fucking dealing",
  "hHow are you, my Love ? Are you with your brother ? Time to talk english with him ? *grins* Say : Hey Muhommad, Penny says hello from across the sea",
  "sWe tried to call you re your reply to our sms for a video mobile 750 mins UNLIMITED TEXT + free camcorder Reply of call 08000930705 Now",
  "hHey doc pls I want to get nice t shirt for my hubby nice fiting ones my budget is  &lt;#&gt; k help pls I will load d card abi hw,keep me posted luv. 2 mj",
  "hI remain unconvinced that this isn't an elaborate test of my willpower",
  "h\"Life is nothing wen v get everything\". But \"life is everything wen v miss something \". Real value of people wil be realized only in their absence.... gud mrng",
  "hhow are you? I miss you!",
  "hI ain't answerin no phone at what is actually a pretty reasonable hour but I'm sleepy",
  "hHey , is * rite u put »10 evey mnth is that all?",
  "hi am going to bed now prin",
  "hI think just yourself …Thanks and see you tomo",
  "hIf u dun drive then how i go 2 sch.",
  "hI not at home now lei...",
  "sGSOH? Good with SPAM the ladies?U could b a male gigolo? 2 join the uk's fastest growing mens club reply ONCALL. mjzgroup. 08714342399.2stop reply STOP. msg@£1.50rcvd",
  "hOk then i will come to ur home after half an hour",
  "sU have a secret admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09058094599",
  "hDo u hav any frnd by name ashwini in ur college?",
  "hJus finish my lunch on my way home lor... I tot u dun wan 2 stay in sch today...",
  "hK then 2marrow are you coming to class.",
  "sHOT LIVE FANTASIES call now 08707500020 Just 20p per min NTT Ltd, PO Box 1327 Croydon CR9 5WB 0870 is a national rate call",
  "hPls send me your address sir.",
  "hI want to lick your pussy now...",
  "hYo, you gonna still be in stock tomorrow/today? I'm trying to get a dubsack",
  "sURGENT! Your Mobile number has been awarded a <UKP>2000 prize GUARANTEED. Call 09061790125 from landline. Claim 3030. Valid 12hrs only 150ppm",
  "hI'll see, but prolly yeah",
  "hThought we could go out for dinner. I'll treat you! Seem ok?",
  "hWhere are you ? What do you do ? How can you stand to be away from me ? Doesn't your heart ache without me ? Don't you wonder of me ? Don't you crave me ?",
  "hSorry. You never hear unless you book it. One was kinda a joke--thet were really looking for skinny white girls. The other was one line--you can only do so much on camera with that. Something like that they're casting on the look.",
  "hWhat you doing?how are you?",
  "hSure thing big man. i have hockey elections at 6, shouldn‘t go on longer than an hour though",
  "hWatch lor. I saw a few swatch one i thk quite ok. Ard 116 but i need 2nd opinion leh...",
  "hHiya do u like the hlday pics looked horrible in them so took mo out! Hows the camp Amrca thing? Speak soon Serena:)",
  "hBabe! How goes that day ? What are you up to ? I miss you already, my Love ... * loving kiss* ... I hope everything goes well.",
  "hYunny... I'm goin to be late",
  "hDoc prescribed me morphine cause the other pain meds aren't enough. Waiting for my mom to bring it. That med should kick in fast so I'm gonna try to be on later",
  "hCool, want me to go to kappa or should I meet you outside mu",
  "hHey sexy buns ! Have I told you ? I adore you, loverboy. I hope you remember to thank your sister in law for those meatballs *grins* ... i love you, babe",
  "hMay b approve panalam...but it should have more posts..",
  "sSPJanuary Male Sale! Hot Gay chat now cheaper, call 08709222922. National rate from 1.5p/min cheap to 7.8p/min peak! To stop texts call 08712460324 (10p/min)",
  "hSorry, I'll call later",
  "hI dont thnk its a wrong calling between us",
  "hMe i'm not workin. Once i get job...",
  "hAnd by when you're done I mean now",
  "h\"Its Ur luck to Love someone. Its Ur fortune to Love the one who Loves U. But, its a miracle to Love a person who can't Love anyone except U...\" Gud nyt...",
  "hHi baby ive just got back from work and i was wanting to see u allday! I hope i didnt piss u off on the phone today. If u are up give me a call xxx",
  "sFreeMsg Today's the day if you are ready! I'm horny & live in your town. I love sex fun & games! Netcollex Ltd 08700621170150p per msg reply Stop to end",
  "hIs it your yahoo boys that bring in the perf? Or legal.",
  "hNo need to say anything to me. I know i am an outsider",
  "hhave you ever had one foot before?",
  "hJust got to  &lt;#&gt;",
  "hGood! No, don‘t need any receipts-well done! (…) Yes, please tell . What‘s her number, i could ring her",
  "hEver green quote ever told by Jerry in cartoon \"A Person Who Irritates u Always Is the one Who Loves u Vry Much But Fails to Express It...!..!! :-) :-) gud nyt",
  "hLeave it wif me lar... Ü wan to carry meh so heavy... Is da num 98321561 familiar to ü?",
  "hBeautiful truth : Expression of the face could Be seen by everyone... But the depression of heart Could be understood only By the Loved ones.. Gud Ni8;-)",
  "hInfact happy new year. How are you where are you when are we seeing",
  "sIn The Simpsons Movie released in July 2007 name the band that died at the start of the film? A-Green Day, B-Blue Day, C-Red Day. (Send A, B or C)",
  "hThat's a shame! Maybe cld meet for few hrs tomo?",
  "hLol I would but despite these cramps I like being a girl.",
  "hI can’t wait for cornwall. Hope tonight isn’t too bad as well but it’s rock night shite. Anyway i’m going for a kip now have a good night. Speak to you soon.",
  "hPls help me tell sura that i'm expecting a battery from hont. And that if should pls send me a message about how to download movies. Thanks",
  "sPlease call Amanda with regard to renewing or upgrading your current T-Mobile handset free of charge. Offer ends today. Tel 0845 021 3680 subject to T's and C's",
  "hHaven't found a way to get another app for your phone, eh ? Will you go to the net cafe ? Did you take that job? Geeee I need you babe. I crave to see you ...",
  "hI only work from mon to thurs but Sat i cant leh... Booked liao... Which other day u free?",
  "hÜ comin to fetch us oredi...",
  "hWhat's nannys address?",
  "sURGENT!! Your 4* Costa Del Sol Holiday or £5000 await collection. Call 09050090044 Now toClaim. SAE, TC s, POBox334, Stockport, SK38xh, Cost£1.50/pm, Max10mins",
  "hHaf u eaten? Wat time u wan me 2 come?",
  "sWant a new Video Phone? 750 anytime any network mins? Half price line rental free text for 3 months? Reply or call 08000930705 for free delivery",
  "hYo, call me when you get the chance, a friend of mine wanted me to ask you about a big order",
  "hThis single single answers are we fighting? Plus i said am broke and you didnt reply",
  "hIt certainly puts things into perspective when something like this happens",
  "hNow got tv 2 watch meh? U no work today?",
  "hi felt so...not any conveying reason.. Ese he... What about me?",
  "sHad your mobile 11 months or more? U R entitled to Update to the latest colour mobiles with camera for Free! Call The Mobile Update Co FREE on 08002986030",
  "hHow's it going? Got any exciting karaoke type activities planned? I'm debating whether to play football this eve. Feeling lazy though.",
  "hI told that am coming on wednesday.",
  "hIts ok, called mom instead have fun",
  "sDear Voucher Holder, To claim this weeks offer, at your PC please go to http://www.wtlp.co.uk/text. Ts&Cs apply.",
  "hWell if I'm that desperate I'll just call armand again",
  "hAre you at work right now ?",
  "sCongrats! Nokia 3650 video camera phone is your Call 09066382422 Calls cost 150ppm Ave call 3mins vary from mobiles 16+ Close 300603 post BCM4284 Ldn WC1N3XX",
  "hHaven't heard anything and he's not answering my texts so I'm guessing he flaked. That said the jb is fantastic",
  "hMmmmmm ... I love you,so much, Ahmad ... I can't wait for this year to begin as every second takes me closer to being at your side. Happy New Year, my love!!",
  "hPls what's the full name of joke's school cos fees in university of florida seem to actually be  &lt;#&gt; k. Pls holla back",
  "hSorry, I'll call later",
  "hOk... But they said i've got wisdom teeth hidden inside n mayb need 2 remove.",
  "hAnd pls pls drink plenty plenty water",
  "hHow are you doing. How's the queen. Are you going for the royal wedding",
  "hHe's in lag. That's just the sad part but we keep in touch thanks to skype",
  "hOk lor then we go tog lor...",
  "hTwo teams waiting for some players",
  "hCan ü send me a copy of da report?",
  "hswhrt how u dey,hope ur ok, tot about u 2day.love n miss.take care.",
  "hOk da, i already planned. I wil pick you.",
  "sUrgent! Please call 0906346330. Your ABTA complimentary 4* Spanish Holiday or £10,000 cash await collection SAE T&Cs BOX 47 PO19 2EZ 150ppm 18+",
  "hSorry, I'll call later in meeting",
  "hI just really need shit before tomorrow and I know you won't be awake before like 6",
  "hI'm good. Have you registered to vote?",
  "hHmm ok, i'll stay for like an hour cos my eye is really sore!",
  "hDear got bus directly to calicut",
  "hMm umma ask vava also to come tell him can play later together",
  "hWell the general price is  &lt;#&gt; /oz, let me know if/when/how much you want",
  "hSorry, I'll call later",
  "hEach Moment in a day,has its own value-Morning brings hope,afternoon brings faith,Evening brings luv,Night brings rest,Wish u find them all today.Good Morning",
  "h&lt;#&gt;  w jetton ave if you forgot",
  "hOk i'm coming home now.",
  "hCan not use foreign stamps in this country.",
  "sDouble mins and txts 4 6months FREE Bluetooth on Orange. Available on Sony, Nokia Motorola phones. Call MobileUpd8 on 08000839402 or call2optout/N9DX",
  "hSorry, it's a lot of friend-of-a-friend stuff, I'm just now about to talk to the actual guy who wants to buy",
  "sFREE for 1st week! No1 Nokia tone 4 ur mob every week just txt NOKIA to 8007 Get txting and tell ur mates www.getzed.co.uk POBox 36504 W45WQ norm150p/tone 16+",
  "sWant to funk up ur fone with a weekly new tone reply TONES2U 2 this text. www.ringtones.co.uk, the original n best. Tones 3GBP network operator rates apply",
  "scmon babe, make me horny, *turn* me on! Txt me your fantasy now babe -) Im hot, sticky and need you now. All replies cost £1.50. 2 cancel send STOP",
  "hI will come tomorrow di",
  "hWylie update: my weed dealer carlos went to freedom and had a class with lunsford",
  "hAre you happy baby ? Are you alright ? Did you take that job ? I hope your fine. I send you a kiss to make you smile from across the sea ... *kiss* *kiss*",
  "hC movie is juz last minute decision mah. Juz watch 2 lar but i tot ü not interested.",
  "hHow are you enjoying this semester? Take care brother.",
  "sIMPORTANT INFORMATION 4 ORANGE USER 0796XXXXXX. TODAY IS UR LUCKY DAY!2 FIND OUT WHY LOG ONTO http://www.urawinner.com THERE'S A FANTASTIC PRIZEAWAITING YOU!",
  "hGet the door, I'm here",
  "hLets use it next week, princess :)",
  "hOr i go home first lar ü wait 4 me lor.. I put down my stuff first..",
  "hI want kfc its Tuesday. Only buy 2 meals ONLY 2. No gravy. Only 2 Mark. 2!",
  "hNo da:)he is stupid da..always sending like this:)don believe any of those message.pandy is a mental:)",
  "hOi when you gonna ring",
  "sMissed call alert. These numbers called but left no message. 07008009200",
  "hI attended but nothing is there.",
  "hArd 530 like dat lor. We juz meet in mrt station then ü dun haf to come out.",
  "hNo dear i was sleeping :-P",
  "hEr mw im filled tuth is aight",
  "hWill be office around 4 pm. Now i am going hospital.",
  "hActually i'm waiting for 2 weeks when they start putting ad.",
  "hAnything lor if they all go then i go lor...",
  "hU free on sat rite? U wan 2 watch infernal affairs wif me n darren n mayb xy?",
  "hPlz note: if anyone calling from a mobile Co. &amp; asks u to type # &lt;#&gt;  or # &lt;#&gt; . Do not do so. Disconnect the call,coz it iz an attempt of 'terrorist' to make use of the sim card no. Itz confirmd by nokia n motorola n has been verified by CNN IBN.",
  "hYo you around? A friend of mine's lookin to pick up later tonight",
  "hStupid auto correct on my phone",
  "hDouble eviction this week - Spiral and Michael and good riddance to them!",
  "h\"The world suffers a lot... Not because of the violence of bad people. But because of the silence of good people!\", Gud night....",
  "hOk thats cool. Its , just off either raglan rd or edward rd. Behind the cricket ground. Gimme ring when ur closeby see you tuesday.",
  "hBuy one egg for me da..please:)",
  "hHave you started in skye",
  "hHave you bookedthe hut? And also your time off? How are you by the way?",
  "hAnd several to you sir.",
  "hU really pig leh sleep so much. My dad wake me up at 10 smth 2 eat lunch today.",
  "hI'm at home. Please call",
  "hMy love ... I hope your not doing anything drastic. Don't you dare sell your pc or your phone ...",
  "hNow only i reached home. . . I am very tired now. . I will come tomorro",
  "sFREEMSG: Our records indicate you may be entitled to 3750 pounds for the Accident you had. To claim for free reply with YES to this msg. To opt out text STOP",
  "sU can WIN £100 of Music Gift Vouchers every week starting NOW Txt the word DRAW to 87066 TsCs www.Idew.com SkillGame, 1Winaweek, age16. 150ppermessSubscription",
  "hLife style garments account no please.",
  "hLol wtf random. Btw is that your lunch break",
  "hSez, hows u & de arab boy? Hope u r all good give my love 2 evry1 love ya eshxxxxxxxxxxx",
  "hThe LAY MAN! Just to let you know you are missed and thought off. Do have a great day. And if you can send me bimbo and ugo's numbers, ill appreciate. Safe",
  "hDetroit. The home of snow. Enjoy it.",
  "sShow ur colours! Euro 2004 2-4-1 Offer! Get an England Flag & 3Lions tone on ur phone! Click on the following service message for info!",
  "hOkie...",
  "hAight, I'm chillin in a friend's room so text me when you're on the way",
  "hIs toshiba portege m100 gd?",
  "hWell welp is sort of a semiobscure internet thing",
  "sText PASS to 69669 to collect your polyphonic ringtones. Normal gprs charges apply only. Enjoy your tones",
  "saccordingly. I repeat, just text the word ok on your mobile phone and send",
  "hLoosu go to hospital. De dont let it careless.",
  "hHow much for an eighth?",
  "hOmg Joanna is freaking me out. She's looked thru all my friends to find photos of me. And then she's asking about stuff on my MySpace which I haven't even logged on in like a year. :/",
  "hSend ur birthdate with month and year, I will tel u ur LIFE PARTNER'S name. and the method of calculation. Reply must.",
  "hJuz now havent woke up so a bit blur blur... Can? Dad went out liao... I cant cum now oso...",
  "hHow about clothes, jewelry, and trips?",
  "sBlock Breaker now comes in deluxe format with new features and great graphics from T-Mobile. Buy for just £5 by replying GET BBDELUXE and take the challenge",
  "hAah! A cuddle would be lush! I'd need lots of tea and soup before any kind of fumbling!",
  "simportant information 4 orange user . today is your lucky day!2find out why log onto http://www.urawinner.com THERE'S A FANTASTIC SURPRISE AWAITING YOU!",
  "hI am late. I will be there at",
  "hSad story of a Man - Last week was my b'day. My Wife did'nt wish me. My Parents forgot n so did my Kids . I went to work. Even my Colleagues did not wish.",
  "hAre you plans with your family set in stone ?",
  "hPls dont forget to study",
  "hYou'll never believe this but i have actually got off at taunton. Wow",
  "hDen only weekdays got special price... Haiz... Cant eat liao... Cut nails oso muz wait until i finish drivin wat, lunch still muz eat wat... ",
  "hShe just broke down a list of reasons why nobody's in town and I can't tell if she's being sarcastic or just faggy",
  "h &lt;DECIMAL&gt; m but its not a common car here so its better to buy from china or asia. Or if i find it less expensive. I.ll holla",
  "hThe greatest test of courage on earth is to bear defeat without losing heart....gn tc",
  "hSORRY IM STIL FUCKED AFTER LAST NITE WENT TOBED AT 430 GOT UP 4 WORK AT 630",
  "hHey so whats the plan this sat? ",
  "hBeauty sleep can help ur pimples too.",
  "hGreat. Hope you are using your connections from mode men also cos you can never know why old friends can lead you to today",
  "sNatalja (25/F) is inviting you to be her friend. Reply YES-440 or NO-440 See her: www.SMS.ac/u/nat27081980 STOP? Send STOP FRND to 62468",
  "hWhere to get those?",
  "hKind of. Just missed train cos of asthma attack, nxt one in half hr so driving in. not sure where to park.",
  "hBall is moving a lot.will spin in last :)so very difficult to bat:)",
  "hHaiyoh... Maybe your hamster was jealous of million",
  "hCan you please send me my aunty's number",
  "hI'm glad. You are following your dreams.",
  "hI've reached home finally...",
  "sURGENT. Important information for 02 user. Today is your lucky day! 2 find out why , log onto http://www.urawinner.com there is a fantastic surprise awaiting you !",
  "sWINNER!! As a valued network customer you have been selected to receivea £900 prize reward! To claim call 09061701461. Claim code KL341. Valid 12 hours only.",
  "hWn u r hurt by d prsn who s close 2 u, do fight wit dem. Coz somtimes dis fight saves a relation bt being quiet leaves nothin in a relation.. Gud eveB-)",
  "hU can call now...",
  "hScience tells that chocolate will melt under the sunlight. Please don't walk under the sunlight. BCoz,I don't want to loss a sweet friend.",
  "hYes. I come to nyc for audiitions and am trying to relocate.",
  "hI pocked you up there before",
  "hCongrats. That's great. I wanted to tell you not to tell me your score cos it might make me relax. But its motivating me so thanks for sharing",
  "hI wud never mind if u dont miss me or if u dont need me.. But u wil really hurt me wen u need me &amp; u dont tell me......... Take care:-)",
  "hHey mr whats the name of that bill brison book the one about language and words ",
  "hOkay, good, no problem, and thanx!",
  "hFor you information, IKEA is spelled with all caps. That is not yelling. when you thought i had left you, you were sitting on the bed among the mess when i came in. i said we were going after you got home from class. please don't try and bullshit me. It makes me want to listen to you less.",
  "hCall me when u're done...",
  "hG.W.R",
  "hYou best watch what you say cause I get drunk as a motherfucker",
  "sKit Strip - you have been billed 150p. Netcollex Ltd. PO Box 1013 IG11 OJA",
  "sHMV BONUS SPECIAL 500 pounds of genuine HMV vouchers to be won. Just answer 4 easy questions. Play Now! Send HMV to 86688 More info:www.100percent-real.com",
  "sPlease CALL 08712402578 immediately as there is an urgent message waiting for you",
  "sthesmszone.com lets you send free anonymous and masked messages..im sending this message from there..do you see the potential for abuse???",
  "sWELL DONE! Your 4* Costa Del Sol Holiday or £5000 await collection. Call 09050090044 Now toClaim. SAE, TCs, POBox334, Stockport, SK38xh, Cost£1.50/pm, Max10mins",
  "hHurt me... Tease me... Make me cry... But in the end of my life when i die plz keep one rose on my grave and say STUPID I MISS U.. HAVE A NICE DAY BSLVYL",
  "hErm... Woodland avenue somewhere. Do you get the parish magazine, his telephone number will be in there.",
  "hAre there TA jobs available? Let me know please cos i really need to start working",
  "hAiyar hard 2 type. U later free then tell me then i call n scold n tell u.",
  "hYup i'm free...",
  "hGood good, billy mates all gone. Just been jogging, again! Did enjoy concert?",
  "hYo come over carlos will be here soon",
  "hAwww dat is sweet! We can think of something to do he he! Have a nice time tonight ill probably txt u later cos im lonely :( xxx.",
  "hI guess it is useless calling u 4 something important.",
  "hHa ha - had popped down to the loo when you hello-ed me. Hello!",
  "hHe dint tell anything. He is angry on me that why you told to abi.",
  "sSomeone U know has asked our dating service 2 contact you! Cant Guess who? CALL 09058091854 NOW all will be revealed. PO BOX385 M6 6WU",
  "hIt so happens that there r 2waxsto do wat you want. She can come and ill get her medical insurance. And she'll be able to deliver and have basic care. I'm currently shopping for the right medical insurance for her. So just give me til friday morning. Thats when i.ll see the major person that can guide me to the right insurance.",
  "hI keep ten rs in my shelf:) buy two egg.",
  "hI wasn't well babe, i have swollen glands at my throat ... What did you end up doing ?",
  "hIs ur changes 2 da report big? Cos i've already made changes 2 da previous report.",
  "hCaptain is in our room:)",
  "hI can't speak, bcaz mobile have problem. I can listen you but you cann't listen my voice. So i calls you later.",
  "hHIYA STU WOT U UP 2.IM IN SO MUCH TRUBLE AT HOME AT MOMENT EVONE HATES ME EVEN U! WOT THE HELL AV I DONE NOW? Y WONT U JUST TELL ME TEXT BCK PLEASE LUV DAN ",
  "hS...i will take mokka players only:)",
  "hAre you still playing with gautham?",
  "hHey mr  and I are going to the sea view and having a couple of gays I mean games! Give me a bell when ya finish ",
  "hK, jason says he's gonna be around so I'll be up there around  &lt;#&gt;",
  "hSorry . I will be able to get to you. See you in the morning.",
  "hAight well keep me informed",
  "hI am not having her number sir",
  "hAm only searching for good dual sim mobile pa.",
  "hThat seems unnecessarily hostile",
  "hDude got a haircut. Now its breezy up there",
  "sCongrats! 2 mobile 3G Videophones R yours. call 09061744553 now! videochat wid ur mates, play java games, Dload polyH music, noline rentl. bx420. ip4. 5we. 150pm",
  "h1Apple/Day=No Doctor. 1Tulsi Leaf/Day=No Cancer. 1Lemon/Day=No Fat. 1Cup Milk/day=No Bone Problms 3 Litres Watr/Day=No Diseases Snd ths 2 Whom U Care..:-)",
  "hi thought we were doing a king of the hill thing there.",
  "hNope i'll come online now..",
  "hALSO TELL HIM I SAID HAPPY BIRTHDAY",
  "hY bishan lei... I tot ü say lavender? ",
  "hBoo what time u get out? U were supposed to take me shopping today. :(",
  "hNow u sound like manky scouse boy steve,like! I is travelling on da bus home.wot has u inmind 4 recreation dis eve?",
  "hFyi I'm taking a quick shower, be at epsilon in like  &lt;#&gt;  min",
  "hon a Tuesday night r u 4 real",
  "hYes when is the appt again?",
  "hJust got outta class gonna go gym.",
  "hI want to sent  &lt;#&gt; mesages today. Thats y. Sorry if i hurts",
  "hÜ all write or wat..",
  "hHa! I wouldn't say that I just didn't read anything into way u seemed. I don't like 2 be judgemental....i save that for fridays in the pub!",
  "hIts a valentine game. . . send dis msg to all ur friends. . If 5 answers r d same then someone really loves u. . Ques- which colour suits me the best?",
  "hHi:)did you asked to waheeda fathima about leave?",
  "hEnjoy urself tmr...",
  "hYou still around? I could use a half-8th",
  "sU 447801259231 have a secret admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09058094597",
  "hYou give us back my id proof and  &lt;#&gt;  rs. We wont allow you to work. We will come to your home within days",
  "hÜ bot notes oredi... Cos i juz rem i got...",
  "hYes. Rent is very expensive so its the way we save.",
  "hNight has ended for another day, morning has come in a special way. May you smile like the sunny rays and leaves your worries at the blue blue bay. Gud mrng",
  "hHows the pain dear?y r u smiling?",
  "hFun fact: although you would think armand would eventually build up a tolerance or some shit considering how much he smokes, he gets fucked up in like 2 hits",
  "simportant information 4 orange user 0789xxxxxxx. today is your lucky day!2find out why log onto http://www.urawinner.com THERE'S A FANTASTIC SURPRISE AWAITING YOU!",
  "hSorry, I can't help you on this.",
  "hGreat. So should i send you my account number.",
  "hHELLOGORGEOUS, HOWS U? MY FONE WAS ON CHARGE LST NITW WEN U TEXD ME. HOPEU AD A NICE WKEND AS IM SURE U DID LOOKIN 4WARD 2 C-IN U 2MRW LUV JAZ",
  "sOur dating service has been asked 2 contact U by someone shy! CALL 09058091870 NOW all will be revealed. POBox84, M26 3UZ 150p",
  "hÜ only send me the contents page...",
  "hNight sweet, sleep well! I've just been to see The Exorcism of Emily Rose and may never sleep again! Hugs and snogs! ",
  "hDon't Think About \"What u Have Got\" Think About \"How to Use It That You Have Got\" gooD ni8",
  "hI can't right this second, gotta hit people up first",
  "hEvry Emotion dsn't hav Words.Evry Wish dsn't hav Prayrs.. If u Smile,D World is wit u.Othrwise even d Drop of Tear dsn't lik 2 Stay wit u.So b happy.. Good morning, keep smiling:-)",
  "hSo what about you. What do you remember",
  "hUjhhhhhhh computer shipped out with address to sandiago and parantella lane. Wtf. Poop.",
  "hMm yes dear look how i am hugging you both. :-P",
  "hI like dis sweater fr mango but no more my size already so irritating.",
  "h1 I don't have her number and 2 its gonna be a massive pain in the ass and i'd rather not get involved if that's possible",
  "hAnytime lor...",
  "sDo you want a new Video handset? 750 any time any network mins? UNLIMITED TEXT? Camcorder? Reply or Call now 08000930705 for del Sat AM",
  "hPurity of friendship between two is not about smiling after reading the forwarded message..Its about smiling just by seeing the name. Gud evng",
  "sUr balance is now £600. Next question: Complete the landmark, Big, A. Bob, B. Barry or C. Ben ?. Text A, B or C to 83738. Good luck!",
  "hMe fine..absolutly fine",
  "hK and you're sure I don't have to have consent forms to do it :V",
  "sUr TONEXS subscription has been renewed and you have been charged £4.50. You can choose 10 more polys this month. www.clubzed.co.uk *BILLING MSG*",
  "sIf you don't, your prize will go to another customer. T&C at www.t-c.biz 18+ 150p/min Polo Ltd Suite 373 London W1J 6HL Please call back if busy",
  "hHow much is torch in 9ja.",
  "hDoing nothing, then u not having dinner w us?",
  "hHow are you. Just checking up on you",
  "hDone it but internet connection v slow and can‘t send it. Will try again later or first thing tomo.",
  "hMathews or tait or edwards or anderson",
  "hyeah sure thing mate haunt got all my stuff sorted but im going sound anyway promoting hex for .by the way who is this? dont know number. Joke",
  "hNo need lar i go engin? Cos my sis at arts today...",
  "hThanks honey but still haven't heard anything I will leave it a bit longer so not 2 crowd him and will try later - great advice thanks hope cardiff is still there!",
  "sDo you want a New Nokia 3510i Colour Phone Delivered Tomorrow? With 200 FREE minutes to any mobile + 100 FREE text + FREE camcorder Reply or Call 8000930705",
  "h, im .. On the snowboarding trip. I was wondering if your planning to get everyone together befor we go..a meet and greet kind of affair? Cheers, ",
  "hS.i'm watching it in live..",
  "hsee you then, we're all christmassy here!",
  "hK I'm ready,  &lt;#&gt; ?",
  "hDo you know why god created gap between your fingers..? So that, One who is made for you comes &amp; fills those gaps by holding your hand with LOVE..!",
  "hThe greatest test of courage on earth is to bear defeat without losing heart....gn tc",
  "hwhat are your new years plans?",
  "sRECPT 1/3. You have ordered a Ringtone. Your order is being processed...",
  "hBaaaaaaaabe! Wake up ! I miss you ! I crave you! I need you!",
  "hOnly just got this message, not ignoring you. Yes, i was. Shopping that is",
  "hDear :-/ why you mood off. I cant drive so i brother to drive",
  "hWhen did dad get back.",
  "hCan you tell Shola to please go to college of medicine and visit the academic department, tell the academic secretary what the current situation is and ask if she can transfer there. She should ask someone to check Sagamu for the same thing and lautech. Its vital she completes her medical education in Nigeria. Its less expensive much less expensive. Unless she will be getting citizen rates in new zealand.",
  "hYes just finished watching days of our lives. I love it.",
  "hJuz go google n search 4 qet...",
  "hMany times we lose our best ones bcoz we are ",
  "hGood FRIENDS CaRE for each Other.. CLoSE Friends UNDERSTaND each Other... and TRUE Friends STaY forever beyond words, beyond time. Gud ni8",
  "hJust getting back home",
  "hSorry, I'll call later  &lt;#&gt; mins",
  "hDun need to use dial up juz open da browser n surf...",
  "sAs one of our registered subscribers u can enter the draw 4 a 100 G.B. gift voucher by replying with ENTER. To unsubscribe text STOP",
  "hAwesome, plan to get here any time after like  &lt;#&gt; , I'll text you details in a wee bit",
  "hTake care and sleep well.you need to learn to change in life.you only need to get CONVINCED on that.i will wait but no more conversations between us.GET CONVINCED by that time.Your family is over for you in many senses.respect them but not overemphasise.or u have no role in my life.",
  "sFor your chance to WIN a FREE Bluetooth Headset then simply reply back with \"ADP\"",
  "hYou also didnt get na hi hi hi hi hi",
  "hYa but it cant display internal subs so i gotta extract them",
  "hIf i said anything wrong sorry de:-)",
  "hSad story of a Man - Last week was my b'day. My Wife did'nt wish me. My Parents forgot n so did my Kids . I went to work. Even my Colleagues did not wish.",
  "hHow stupid to say that i challenge god.You dont think at all on what i write instead you respond immed.",
  "hYeah I should be able to, I'll text you when I'm ready to meet up",
  "hV skint too but fancied few bevies.waz gona go meet &othrs in spoon but jst bin watchng planet earth&sofa is v comfey; If i dont make it hav gd night",
  "h says that he's quitting at least5times a day so i wudn't take much notice of that. Nah, she didn't mind. Are you gonna see him again? Do you want to come to taunton tonight? U can tell me all about !",
  "hWhen you get free, call me",
  "hHow have your little darlings been so far this week? Need a coffee run tomo?Can't believe it's that time of week already …",
  "hOk i msg u b4 i leave my house.",
  "hStill at west coast... Haiz... Ü'll take forever to come back...",
  "hMMM ... Fuck .... Merry Christmas to me",
  "halright. Thanks for the advice. Enjoy your night out. I'ma try to get some sleep...",
  "hUpdate your face book status frequently :)",
  "hJust now saw your message.it k da:)",
  "hWas it something u ate?",
  "hSo what did the bank say about the money?",
  "hAiyar dun disturb u liao... Thk u have lots 2 do aft ur cupboard come...",
  "hHey they r not watching movie tonight so i'll prob b home early...",
  "hYar lor... How u noe? U used dat route too?",
  "h2mro i am not coming to gym machan. Goodnight.",
  "hDont think you need yellow card for uk travel. Ask someone that has gone before. If you do its just  &lt;#&gt; bucks",
  "hCan u look 4 me in da lib i got stuff havent finish yet.",
  "hSounds great! Im going to sleep now. Have a good night!",
  "sDon't b floppy... b snappy & happy! Only gay chat service with photo upload call 08718730666 (10p/min). 2 stop our texts call 08712460324",
  "hHouse-Maid is the murderer, coz the man was murdered on  &lt;#&gt; th January.. As public holiday all govt.instituitions are closed,including post office..understand?",
  "hHow come u got nothing to do?",
  "hNothing will ever be easy. But don't be looking for a reason not to take a risk on life and love",
  "hi want to grasp your pretty booty :)",
  "hI've got it down to a tea. not sure which flavour",
  "hI'm going 2 orchard now laready me reaching soon. U reaching?",
  "hDear i am not denying your words please",
  "hYou know my old Dom I told you about yesterday ? His name is Roger? He got in touch with me last night and wants me to meet him today at 2 pm",
  "hCOME BACK TO TAMPA FFFFUUUUUUU",
  "h2 celebrate my b’day, y else?",
  "hMerry christmas to u too annie!",
  "hPlease tell me you have some of that special stock you were talking about",
  "hI sent them. Do you like?",
  "sUrgent UR awarded a complimentary trip to EuroDisinc Trav, Aco&Entry41 Or £1000. To claim txt DIS to 87121 18+6*£1.50(moreFrmMob. ShrAcomOrSglSuplt)10, LS1 3AJ",
  "hAwesome, be there in a minute",
  "hAnd that is the problem. You walk around in \"julianaland\" oblivious to what is going on around you. I say the same things constantly and they go in one ear and out the other while you go off doing whatever you want to do. It's not that you don't know why I'm upset--it's that you don't listen when i tell you WHAT is going to upset me. Then you want to be surprised when I'm mad.",
  "hI've told you everything will stop. Just dont let her get dehydrated.",
  "hOr I guess  &lt;#&gt;  min",
  "hI'm home. Ard wat time will u reach?",
  "hStorming msg: Wen u lift d phne, u say \"HELLO\" Do u knw wt is d real meaning of HELLO?? . . . It's d name of a girl..! . . . Yes.. And u knw who is dat girl?? \"Margaret Hello\" She is d girlfrnd f Grahmbell who invnted telphone... . . . . Moral:One can 4get d name of a person, bt not his girlfrnd... G o o d n i g h t . . .@",
  "hIf you want to mapquest it or something look up \"usf dogwood drive\", that's the tiny street where the parking lot is",
  "hAight should I just plan to come up later tonight?",
  "hDie... I accidentally deleted e msg i suppose 2 put in e sim archive. Haiz... I so sad...",
  "sWelcome to UK-mobile-date this msg is FREE giving you free calling to 08719839835. Future mgs billed at 150p daily. To cancel send \"go stop\" to 89123",
  "hThis is wishing you a great day. Moji told me about your offer and as always i was speechless. You offer so easily to go to great lengths on my behalf and its stunning. My exam is next friday. After that i will keep in touch more. Sorry.",
  "hThanks again for your reply today. When is ur visa coming in. And r u still buying the gucci and bags. My sister things are not easy, uncle john also has his own bills so i really need to think about how to make my own money. Later sha.",
  "hSorry I flaked last night, shit's seriously goin down with my roommate, what you up to tonight?",
  "hHe said i look pretty wif long hair wat. But i thk he's cutting quite short 4 me leh.",
  "hRanjith cal drpd Deeraj and deepak 5min hold",
  "h\"CHEERS FOR CALLIN BABE.SOZI CULDNT TALKBUT I WANNATELL U DETAILS LATER WENWECAN CHAT PROPERLY X\"",
  "hHey u still at the gym?",
  "hShe said,'' do u mind if I go into the bedroom for a minute ? '' ''OK'', I sed in a sexy mood. She came out 5 minuts latr wid a cake...n My Wife,",
  "hMuch better now thanks lol",
  "hNothing, smsing u n xy lor. Sorry lor da guys neva c u in person but they sort of know u lor. So u wan 2 meet them xy ask me 2 bring u along 4 our next meeting.",
  "hLemme know when I can swing by and pick up, I'm free basically any time after 1 all this semester",
  "hWa... U so efficient... Gee... Thanx...",
  "s3. You have received your mobile content. Enjoy",
  "hS but not able to sleep.",
  "sWant explicit SEX in 30 secs? Ring 02073162414 now! Costs 20p/min",
  "hWe will meet soon princess! Ttyl!",
  "hI'll pick you up at about 5.15pm to go to taunton if you still want to come.",
  "hOh :-)only 4 outside players allowed to play know",
  "hI anything lor.",
  "hErutupalam thandiyachu",
  "hY cant u try new invention to fly..i'm not joking.,",
  "hNo..its ful of song lyrics..",
  "hWhat do u reckon as need 2 arrange transport if u can't do it, thanks",
  "hTrue lov n care wil nevr go unrecognized. though somone often makes mistakes when valuing it. but they will definitly undrstnd once when they start missing it.",
  "hShopping? Eh ger i toking abt syd leh...Haha",
  "hWhat not under standing.",
  "hhave * good weekend.",
  "hMiss call miss call khelate kintu opponenter miss call dhorte lage. Thats d rule. One with great phone receiving quality wins.",
  "hCall me when you get the chance plz &lt;3",
  "hThe new deus ex game comin early next yr",
  "hMy computer just fried the only essential part we don't keep spares of because my fucking idiot roommates looovvve leaving the thing running on full  &lt;#&gt; /7",
  "hMy friend, she's studying at warwick, we've planned to go shopping and to concert tmw, but it may be canceled, havn't seen  for ages, yeah we should get together sometime!",
  "hProbably a couple hours tops",
  "hLOL .. *grins* .. I'm not babe, but thanks for thinking of me!",
  "hMan this bus is so so so slow. I think you're gonna get there before me",
  "hHope this text meets you smiling. If not then let this text give you a reason to smile. Have a beautiful day.",
  "hIn case you wake up wondering where I am, I forgot I have to take care of something for grandma today, should be done before the parade",
  "hOk",
  "sLatest Nokia Mobile or iPOD MP3 Player +£400 proze GUARANTEED! Reply with: WIN to 83355 now! Norcorp Ltd.£1,50/Mtmsgrcvd18+",
  "sSMS SERVICES. for your inclusive text credits, pls goto www.comuk.net login= 3qxj9 unsubscribe with STOP, no extra charge. help 08702840625.COMUK. 220-CM2 9AE",
  "hNvm take ur time.",
  "hSo wat's da decision?",
  "hWot is u up 2 then bitch?",
  "hStupid.its not possible",
  "hShe told to hr that he want posting in chennai:)because i'm working here:)",
  "sMobile Club: Choose any of the top quality items for your mobile. 7cfca1a",
  "hWhen are you guys leaving?",
  "hHe neva grumble but i sad lor... Hee... Buy tmr lor aft lunch. But we still meetin 4 lunch tmr a not. Neva hear fr them lei. Ü got a lot of work ar?",
  "hNot able to do anything.",
  "hÜ takin linear algebra today?",
  "hThis weekend is fine (an excuse not to do too much decorating)",
  "hSorry I missed you babe. I was up late and slept in. I hope you enjoy your driving lesson, boytoy. I miss you too ... *teasing kiss*",
  "hNow project pa. After that only i can come.",
  "sMoney i have won wining number 946 wot do i do next",
  "hSure, whenever you show the fuck up &gt;:(",
  "hThat was random saw my old roomate on campus. He graduated",
  "sCongrats! 2 mobile 3G Videophones R yours. call 09061744553 now! videochat wid ur mates, play java games, Dload polyH music, noline rentl. bx420. ip4. 5we. 150pm",
  "hMen always needs a beautiful, intelligent, caring, loving, adjustable, cooperative wife. But the law allows only one wife....",
  "hThat sucks. So what do you got planned for your yo valentine? I am your yo valentine aren't I?",
  "hJust got part Nottingham - 3 hrs 63miles. Good thing i love my man so much, but only doing 40mph. Hey ho",
  "hWhat to think no one saying clearly. Ok leave no need to ask her. I will go if she come or not",
  "hHi good mornin.. Thanku wish u d same..",
  "hDO U WANT 2 MEET UP 2MORRO",
  "hActually I decided I was too hungry so I haven't left yet :V",
  "hI've sent ü my part..",
  "hCos i was out shopping wif darren jus now n i called him 2 ask wat present he wan lor. Then he started guessing who i was wif n he finally guessed darren lor.",
  "sI want some cock! My hubby's away, I need a real man 2 satisfy me. Txt WIFE to 89938 for no strings action. (Txt STOP 2 end, txt rec £1.50ea. OTBox 731 LA1 7WS. )",
  "hUnderstand. his loss is my gain :) so do you work? School?",
  "hHOW ARE U? I HAVE MISSED U! I HAVENT BEEN UP 2 MUCH A BIT BORED WITH THE HOLIDAY WANT 2 GO BAK 2 COLLEGE! SAD ISNT IT?xx",
  "hHiya, probably coming home * weekend after next",
  "hDon't forget though that I love you .... And I walk beside you. Watching over you and keeping your heart warm.",
  "hI wish things were different. I wonder when i will be able to show you how much i value you. Pls continue the brisk walks no drugs without askin me please and find things to laugh about. I love you dearly.",
  "hOk both our days. So what are you making for dinner tonite? Am I invited?",
  "sGr8 new service - live sex video chat on your mob - see the sexiest dirtiest girls live on ur phone - 4 details text horny to 89070 to cancel send STOP to 89070",
  "hI have no money 4 steve mate! !",
  "hIM LATE TELLMISS IM ON MY WAY",
  "hNever blame a day in ur life. Good days give u happiness. Bad days give u experience. Both are essential in life! All are Gods blessings! good morning.:",
  "hNormally i use to drink more water daily:)",
  "hDare i ask... Any luck with sorting out the car?",
  "hParty's at my place at usf, no charge (but if you can contribute in any way it is greatly appreciated) and yeah, we got room for one more",
  "hUrgh, coach hot, smells of chip fat! Thanks again, especially for the duvet (not a predictive text word).",
  "hHiya. How was last night? I've been naughty and bought myself clothes and very little ... Ready for more shopping tho! What kind of time do you wanna meet?",
  "sFreeMsg Hi baby wow just got a new cam moby. Wanna C a hot pic? or Fancy a chat?Im w8in 4uTxt / rply CHAT to 82242 Hlp 08712317606 Msg150p 2rcv",
  "hI've been trying to reach him without success",
  "hwhen you and derek done with class?",
  "hNever y lei... I v lazy... Got wat? Dat day ü send me da url cant work one...",
  "hNever try alone to take the weight of a tear that comes out of ur heart and falls through ur eyes... Always remember a STUPID FRIEND is here to share... BSLVYL",
  "hHey mate. Spoke to the mag people. We‘re on.  the is deliver by the end of the month. Deliver on the 24th sept. Talk later. ",
  "hHope you are having a good week. Just checking in",
  "hHaha, my friend tyler literally just asked if you could get him a dubsack",
  "h\"Hey! do u fancy meetin me at 4 at cha - hav a lil beverage on me. if not txt or ring me and we can meet up l8r. quite tired got in at 3 v.pist ;) love Pete x x x\"",
  "hGreat. Have a safe trip. Dont panic surrender all.",
  "h\"SYMPTOMS\" when U are in love: \"1.U like listening songs 2.U get stopped where u see the name of your beloved 3.U won't get angry when your",
  "hSun ah... Thk mayb can if dun have anythin on... Thk have to book e lesson... E pilates is at orchard mrt u noe hor...  ",
  "hTry to do something dear. You read something for exams",
  "h7 wonders in My WORLD 7th You 6th Ur style 5th Ur smile 4th Ur Personality 3rd Ur Nature 2nd Ur SMS and 1st \"Ur Lovely Friendship\"... good morning dear",
  "hGettin rdy to ship comp",
  "hI am in hospital da. . I will return home in evening",
  "hPISS IS TALKING IS SOMEONE THAT REALISE U THAT POINT THIS AT IS IT.(NOW READ IT BACKWARDS)",
  "hThink + da. You wil do.",
  "hI'm awake oh. What's up.",
  "hGood afternoon my boytoy. How goes that walking here and there day ? Did you get that police abstract? Are you still out and about? I wake and miss you babe",
  "hHow much u trying to get?",
  "hCome around  &lt;DECIMAL&gt; pm vikky..i'm otside nw, il come by tht time",
  "hTell me again what your address is",
  "hHoneybee Said: *I'm d Sweetest in d World* God Laughed &amp; Said: *Wait,U Havnt Met d Person Reading This Msg* MORAL: Even GOD Can Crack Jokes! GM+GN+GE+GN:)",
  "hShould i buy him a blackberry bold 2 or torch. Should i buy him new or used. Let me know. Plus are you saying i should buy the  &lt;#&gt; g wifi ipad. And what are you saying about the about the  &lt;#&gt; g?",
  "hBut you were together so you should be thinkin about him",
  "hhiya hows it going in sunny africa? hope u r avin a good time. give that big old silver back a big kiss from me.",
  "hAt WHAT TIME should i come tomorrow",
  "sWanna have a laugh? Try CHIT-CHAT on your mobile now! Logon by txting the word: CHAT and send it to No: 8883 CM PO Box 4217 London W1A 6ZF 16+ 118p/msg rcvd",
  "h\"CHA QUITEAMUZING THAT’SCOOL BABE,PROBPOP IN & CU SATTHEN HUNNY 4BREKKIE! LOVE JEN XXX. PSXTRA LRG PORTIONS 4 ME PLEASE \"",
  "hOmg how did u know what I ate?",
  "s\"URGENT! This is the 2nd attempt to contact U!U have WON £1000CALL 09071512432 b4 300603t&csBCM4235WC1N3XX.callcost150ppmmobilesvary. max£7. 50\"",
  "h:( but your not here....",
  "hNot directly behind... Abt 4 rows behind ü...",
  "sCongratulations ur awarded 500 of CD vouchers or 125gift guaranteed & Free entry 2 100 wkly draw txt MUSIC to 87066",
  "sHad your contract mobile 11 Mnths? Latest Motorola, Nokia etc. all FREE! Double Mins & Text on Orange tariffs. TEXT YES for callback, no to remove from records",
  "sUrgent! call 09066350750 from your landline. Your complimentary 4* Ibiza Holiday or 10,000 cash await collection SAE T&Cs PO BOX 434 SK3 8WP 150 ppm 18+",
  "hNo plans yet. What are you doing ?",
  "hHi ....My engagement has been fixd on  &lt;#&gt; th of next month. I know its really shocking bt....hmm njan vilikkam....t ws al of a sudn;-(.",
  "hNot course. Only maths one day one chapter with in one month we can finish.",
  "hWow didn't think it was that common. I take it all back ur not a freak! Unless u chop it off:-)",
  "sFor ur chance to win a £250 wkly shopping spree TXT: SHOP to 80878. T's&C's www.txt-2-shop.com custcare 08715705022, 1x150p/wk",
  "hNoooooooo please. Last thing I need is stress. For once in your life be fair.",
  "sU have a Secret Admirer who is looking 2 make contact with U-find out who they R*reveal who thinks UR so special-call on 09065171142-stopsms-08718727870150ppm",
  "sMila, age23, blonde, new in UK. I look sex with UK guys. if u like fun with me. Text MTALK to 69866.18 . 30pp/txt 1st 5free. £1.50 increments. Help08718728876",
  "hI'll see if I can swing by in a bit, got some things to take care of here firsg",
  "hI wanted to wish you a Happy New Year and I wanted to talk to you about some legal advice to do with when Gary and I split but in person. I'll make a trip to Ptbo for that. I hope everything is good with you babe and I love ya :)",
  "hHave you not finished work yet or something?",
  "hTomorrow i am not going to theatre. . . So i can come wherever u call me. . . Tell me where and when to come tomorrow",
  "sWell done ENGLAND! Get the official poly ringtone or colour flag on yer mobile! text TONE or FLAG to 84199 NOW! Opt-out txt ENG STOP. Box39822 W111WX £1.50",
  "hRight it wasnt you who phoned it was someone with a number like yours!",
  "hIt's ok i wun b angry. Msg u aft i come home tonight.",
  "hI had a good time too. Its nice to do something a bit different with my weekends for a change. See ya soon",
  "hYo sorry was in the shower sup",
  "hCarlos is down but I have to pick it up from him, so I'll swing by usf in a little bit",
  "hFull heat pa:-) i have applyed oil pa.",
  "hI'm stuck in da middle of da row on da right hand side of da lt... ",
  "hHave you laid your airtel line to rest?",
  "hHi did u decide wot 2 get 4 his bday if not ill prob jus get him a voucher frm virgin or sumfing ",
  "sFreeMsg: Txt: CALL to No: 86888 & claim your reward of 3 hours talk time to use from your phone now! Subscribe6GBP/mnth inc 3hrs 16 stop?txtStop",
  "h\"Hey j! r u feeling any better, hopeSo hunny. i amnow feelin ill & ithink i may have tonsolitusaswell! damn iam layin in bedreal bored. lotsof luv me xxxx\"",
  "hAnd I don't plan on staying the night but I prolly won't be back til late",
  "hTHANX 4 PUTTIN DA FONE DOWN ON ME!!",
  "hI need an 8th but I'm off campus atm, could I pick up in an hour or two?",
  "hOh... Haha... Den we shld had went today too... Gee, nvm la... Kaiez, i dun mind goin jazz oso... Scared hiphop open cant catch up... ",
  "hBeen running but only managed 5 minutes and then needed oxygen! Might have to resort to the roller option!",
  "hWe live in the next  &lt;#&gt; mins",
  "hY de asking like this.",
  "hJust glad to be talking to you.",
  "hWat time ü finish?",
  "hSorry da. I gone mad so many pending works what to do.",
  "hHow much you got for cleaning",
  "hhows my favourite person today? r u workin hard? couldn't sleep again last nite nearly rang u at 4.30",
  "sSunshine Quiz! Win a super Sony DVD recorder if you canname the capital of Australia? Text MQUIZ to 82277. B",
  "hÜ called dad oredi...",
  "hGood. do you think you could send me some pix? I would love to see your top and bottom...",
  "hNvm... I'm going to wear my sport shoes anyway... I'm going to be late leh.",
  "hSorry, I'll call later In meeting.",
  "hTHIS IS A LONG FUCKIN SHOWR",
  "hReceived, understood n acted upon!",
  "hThey finally came to fix the ceiling.",
  "hU need my presnts always bcz U cant mis love. \"jeevithathile irulinae neekunna prakasamanu sneham\" prakasam ennal prabha 'That mns prabha is'LOVE' Got it. Dont mis me....",
  "hJus finish blowing my hair. U finish dinner already?",
  "hI'm on the bus. Love you",
  "hLol ... I knew that .... I saw him in the dollar store",
  "sPlease call our customer service representative on 0800 169 6031 between 10am-9pm as you have WON a guaranteed £1000 cash or £5000 prize!",
  "sTodays Voda numbers ending with 7634 are selected to receive a £350 reward. If you have a match please call 08712300220 quoting claim code 7684 standard rates apply.",
  "hOnly saturday and sunday holiday so its very difficult:)",
  "hEverybody had fun this evening. Miss you.",
  "hGot hella gas money, want to go on a grand nature adventure with galileo in a little bit?",
  "hI'm in a meeting, call me later at",
  "hOh wow thats gay. Will firmware update help",
  "hThese won't do. Have to move on to morphine",
  "hHow come i din c ü... Yup i cut my hair...",
  "hK k pa Had your lunch aha.",
  "hOh ho. Is this the first time u use these type of words",
  "hCaptain vijaykanth is doing comedy in captain tv..he is drunken :)",
  "hOf course. I guess god's just got me on hold right now.",
  "hDo you hide anythiing or keeping distance from me",
  "hHavent.",
  "sYou are being ripped off! Get your mobile content from www.clubmoby.com call 08717509990 poly/true/Pix/Ringtones/Games six downloads for only 3",
  "hSorry i din lock my keypad.",
  "hDid u got that persons story",
  "hAre you planning to come chennai?",
  "sWe tried to contact you re your reply to our offer of a Video Phone 750 anytime any network mins Half Price Line Rental Camcorder Reply or call 08000930705",
  "hGod created gap btwn ur fingers so dat sum1 vry special will fill those gaps by holding ur hands.. Now plz dont ask y he created so much gap between legs !!!",
  "hWe are okay. Going to sleep now. Later",
  "hPlease protect yourself from e-threats. SIB never asks for sensitive information like Passwords,ATM/SMS PIN thru email. Never share your password with anybody.",
  "hFinally it has happened..! Aftr decades..! BEER is now cheaper than PETROL! The goverment expects us to \"DRINK\". . . But don't \"DRIVE \"",
  "sA £400 XMAS REWARD IS WAITING FOR YOU! Our computer has randomly picked you from our loyal mobile customers to receive a £400 reward. Just call 09066380611 ",
  "hWhere r e meeting tmr?",
  "hLol yes. But it will add some spice to your day.",
  "hHope you are having a great day.",
  "hOur Prasanth ettans mother passed away last night. Just pray for her and family.",
  "hK, I'll work something out",
  "sPRIVATE! Your 2003 Account Statement for shows 800 un-redeemed S. I. M. points. Call 08718738002 Identifier Code: 48922 Expires 21/11/04",
  "hThis message is from a great Doctor in India:-): 1) Do not drink APPY FIZZ. It contains Cancer causing age",
  "hI cant pick the phone right now. Pls send a message",
  "hYou call him and tell now infront of them. Call him now.",
  "hOk no prob...",
  "hLadies first and genus second k .",
  "hNo. Yes please. Been swimming?",
  "hMum not going robinson already.",
  "hOk set let u noe e details later...",
  "hNot..tel software name..",
  "hI send the print  outs da.",
  "hIM REALY SOZ IMAT MY MUMS 2NITE WHAT ABOUT 2MORO ",
  "hWhen I was born, GOD said, \"Oh No! Another IDIOT\". When you were born, GOD said, \"OH No! COMPETITION\". Who knew, one day these two will become FREINDS FOREVER!",
  "hI didnt get ur full msg..sometext is missing, send it again",
  "hProbably not, I'm almost out of gas and I get some cash tomorrow",
  "sCustomer service announcement. We recently tried to make a delivery to you but were unable to do so, please call 07099833605 to re-schedule. Ref:9280114",
  "hI forgot 2 ask ü all smth.. There's a card on da present lei... How? Ü all want 2 write smth or sign on it?",
  "hI'm leaving my house now.",
  "sHi babe its Chloe, how r u? I was smashed on saturday night, it was great! How was your weekend? U been missing me? SP visionsms.com Text stop to stop 150p/text",
  "hÜ ready then call me...",
  "hWewa is 130. Iriver 255. All 128 mb.",
  "hIt is a good thing I'm now getting the connection to bw",
  "hSry da..jst nw only i came to home..",
  "hThat's cool he'll be here all night, lemme know when you're around",
  "hAre you staying in town ?",
  "hHaha yeah, 2 oz is kind of a shitload",
  "hOk u can take me shopping when u get paid =D",
  "hMy life Means a lot to me, Not because I love my life, But because I love the people in my life, The world calls them friends, I call them my World:-).. Ge:-)..",
  "hAlright we'll bring it to you, see you in like  &lt;#&gt;  mins",
  "hBut pls dont play in others life.",
  "hEatin my lunch...",
  "hHmmm.but you should give it on one day..",
  "hDidn't try, g and I decided not to head out",
  "hOk no prob",
  "hSurly ill give it to you:-) while coming to review.",
  "hBy march ending, i should be ready. But will call you for sure. The problem is that my capital never complete. How far with you. How's work and the ladies",
  "hTessy..pls do me a favor. Pls convey my birthday wishes to Nimya..pls dnt forget it. Today is her birthday Shijas",
  "hPls give her the food preferably pap very slowly with loads of sugar. You can take up to an hour to give it. And then some water. Very very slowly.",
  "sURGENT! Your Mobile No 07808726822 was awarded a £2,000 Bonus Caller Prize on 02/09/03! This is our 2nd attempt to contact YOU! Call 0871-872-9758 BOX95QU",
  "hA guy who gets used but is too dumb to realize it.",
  "hOkey dokey, i‘ll be over in a bit just sorting some stuff out.",
  "hDon no da:)whats you plan?",
  "hYes fine ",
  "sWIN: We have a winner! Mr. T. Foley won an iPod! More exciting prizes soon, so keep an eye on ur mobile or visit www.win-82050.co.uk",
  "hI liked the new mobile",
  "hAnytime...",
  "hMmmmmmm *snuggles into you* ...*deep contented sigh* ... *whispers* ... I fucking love you so much I can barely stand it ...",
  "hYar but they say got some error.",
  "hHey anyway i have to :-)",
  "hWow so healthy. Old airport rd lor. Cant thk of anything else. But i'll b bathing my dog later.",
  "hWif my family booking tour package.",
  "hDid you say bold, then torch later. Or one torch and 2bold?",
  "hHaha awesome, I might need to take you up on that, what you doin tonight?",
  "hYa i knw u vl giv..its ok thanks kano..anyway enjoy wit ur family wit 1st salary..:-);-)",
  "hHuh so slow i tot u reach long ago liao... U 2 more days only i 4 more leh...",
  "hThats cool princess! I will cover your face in hot sticky cum :)",
  "hBig brother‘s really scraped the barrel with this shower of social misfits",
  "hOops i thk i dun haf enuff... I go check then tell ü..",
  "hS:)8 min to go for lunch:)",
  "hHey. What happened? U switch off ur cell d whole day. This isnt good. Now if u do care, give me a call tomorrow.",
  "hK will do, addie &amp; I are doing some art so I'll be here when you get home",
  "hMy uncles in Atlanta. Wish you guys a great semester.",
  "hAiyo... Her lesson so early... I'm still sleepin, haha... Okie, u go home liao den confirm w me lor...",
  "hForgot to tell ü smth.. Can ü like number the sections so that it's clearer..",
  "hYup. Anything lor, if u dun wan it's ok...",
  "hI'm home, my love ... If your still awake ... *loving kiss*",
  "hHELLO PEACH! MY CAKE TASTS LUSH!",
  "sFREE GAME. Get Rayman Golf 4 FREE from the O2 Games Arcade. 1st get UR games settings. Reply POST, then save & activ8. Press 0 key for Arcade. Termsapply",
  "hThere'll be a minor shindig at my place later tonight, you interested?",
  "hJason says it's cool if we pick some up from his place in like an hour",
  "sHad your mobile 10 mths? Update to the latest Camera/Video phones for FREE. KEEP UR SAME NUMBER, Get extra free mins/texts. Text YES for a call",
  "hI (Career Tel) have added u as a contact on INDYAROCKS.COM to send FREE SMS. To remove from phonebook - sms NO to  &lt;#&gt;",
  "hI've reached already.",
  "hI dont know ask to my brother. Nothing problem some thing that. Just i told .",
  "hK:)eng rocking in ashes:)",
  "hWat time r ü going to xin's hostel?",
  "hGood Morning my Dear Shijutta........... Have a great &amp; successful day.",
  "sBuy Space Invaders 4 a chance 2 win orig Arcade Game console. Press 0 for Games Arcade (std WAP charge) See o2.co.uk/games 4 Terms + settings. No purchase",
  "hOh k:)after that placement there ah?",
  "hNot for possession, especially not first offense",
  "hNt only for driving even for many reasons she is called BBD..thts it chikku, then hw abt dvg cold..heard tht vinobanagar violence hw is the condition..and hw ru ? Any problem?",
  "hI bought the test yesterday. Its something that lets you know the exact day u ovulate.when will get 2u in about 2 to 3wks. But pls pls dont fret. I know u r worried. Pls relax. Also is there anything in ur past history u need to tell me?",
  "hWe have pizza if u want",
  "hI keep seeing weird shit and bein all \"woah\" then realising it's actually reasonable and I'm all \"oh\"",
  "hMany more happy returns of the day. I wish you happy birthday.",
  "hYa very nice. . .be ready on thursday",
  "hI am in hospital da. . I will return home in evening",
  "h\"Thinking of u ;) x\"",
  "sCamera - You are awarded a SiPix Digital Camera! call 09061221066 fromm landline. Delivery within 28 days.",
  "hOrh i tot u say she now still dun believe.",
  "hWhen you just put in the + sign, choose my number and the pin will show. Right?",
  "hThe beauty of life is in next second.. which hides thousands of secrets. I wish every second will be wonderful in ur life...!! gud n8",
  "hThanx u darlin!im cool thanx. A few bday drinks 2 nite. 2morrow off! Take care c u soon.xxx",
  "hIf you're still up, maybe leave the credit card so I can get gas when I get back like he told me to",
  "sYour weekly Cool-Mob tones are ready to download !This weeks new Tones include: 1) Crazy Frog-AXEL F>>> 2) Akon-Lonely>>> 3) Black Eyed-Dont P >>>More info in n",
  "hWell boy am I glad G wasted all night at applebees for nothing",
  "sCashbin.co.uk (Get lots of cash this weekend!) www.cashbin.co.uk Dear Welcome to the weekend We have got our biggest and best EVER cash give away!! These..",
  "hOk lor... Or u wan me go look 4 u?",
  "hU wan 2 haf lunch i'm in da canteen now.",
  "hDon't make life too stressfull.. Always find time to Laugh.. It may not add years to your Life! But surely adds more life to ur years!! Gud ni8..swt dreams..",
  "hhey, looks like I was wrong and one of the kappa guys numbers is still on my phone, if you want I can text him and see if he's around",
  "sURGENT! Your Mobile number has been awarded with a £2000 prize GUARANTEED. Call 09061790121 from land line. Claim 3030. Valid 12hrs only 150ppm",
  "sThanks 4 your continued support Your question this week will enter u in2 our draw 4 £100 cash. Name the NEW US President? txt ans to 80082",
  "hI'm home. Doc gave me pain meds says everything is fine.",
  "hIt's é only $140 ard...É rest all ard $180 at least...Which is é price 4 é 2 bedrm ($900)",
  "hMe too! Have a lovely night xxx",
  "hPrepare to be pleasured :)",
  "hHi.:)technical support.providing assistance to us customer through call and email:)",
  "hif you text on your way to cup stop that should work. And that should be BUS",
  "hWhens your radio show?",
  "sYour unique user ID is 1172. For removal send STOP to 87239 customer services 08708034412",
  "hI'm not sure if its still available though",
  "hwatever reLation u built up in dis world only thing which remains atlast iz lonlines with lotz n lot memories! feeling..",
  "hCHEERS LOU! YEAH WAS A GOODNITE SHAME U NEVA CAME! C YA GAILxx",
  "hHi..i got the money da:)",
  "hHi, Mobile no.  &lt;#&gt;  has added you in their contact list on www.fullonsms.com It s a great place to send free sms to people For more visit fullonsms.com",
  "hOk then u tell me wat time u coming later lor.",
  "hU repeat e instructions again. Wat's e road name of ur house?",
  "hSo many people seems to be special at first sight, But only very few will remain special to you till your last sight.. Maintain them till life ends.. Sh!jas",
  "hQuite lor. But dun tell him wait he get complacent...",
  "hSorry completely forgot * will pop em round this week if your still here?",
  "hU R THE MOST BEAUTIFUL GIRL IVE EVER SEEN. U R MY BABY COME AND C ME IN THE COMMON ROOM",
  "hO we cant see if we can join denis and mina? Or does denis want alone time",
  "hSen told that he is going to join his uncle finance in cbe",
  "hYup... Hey then one day on fri we can ask miwa and jiayin take leave go karaoke ",
  "hCall me, i am senthil from hsbc.",
  "hEspecially since i talk about boston all up in my personal statement, lol! I woulda changed that if i had realized it said nyc! It says boston now.",
  "hIndeed and by the way it was either or - not both !",
  "sUrgent -call 09066649731from Landline. Your complimentary 4* Ibiza Holiday or £10,000 cash await collection SAE T&Cs PO BOX 434 SK3 8WP 150ppm 18+",
  "hHoly living christ what is taking you so long",
  "hÜ thk of wat to eat tonight.",
  "hThanx. Yup we coming back on sun. Finish dinner going back 2 hotel now. Time flies, we're tog 4 exactly a mth today. Hope we'll haf many more mths to come...",
  "hWe're on the opposite side from where we dropped you off",
  "hYup. Izzit still raining heavily cos i'm in e mrt i can't c outside.",
  "hSend me your resume:-)",
  "hGd luck 4 ur exams :-)",
  "hOr u ask they all if next sat can a not. If all of them can make it then i'm ok lor.",
  "hSorry that was my uncle. I.ll keep in touch",
  "hSaw Guys and Dolls last night with Patrick Swayze it was great",
  "sURGENT This is our 2nd attempt to contact U. Your £900 prize from YESTERDAY is still awaiting collection. To claim CALL NOW 09061702893",
  "sSanta calling! Would your little ones like a call from Santa Xmas Eve? Call 09077818151 to book you time. Calls1.50ppm last 3mins 30s T&C www.santacalling.com",
  "hJust come home. I don't want u to be miserable",
  "hI dont know why she.s not getting your messages",
  "hits cool but tyler had to take off so we're gonna buy for him and drop it off at his place later tonight. Our total order is a quarter, you got enough?",
  "hThe guy at the car shop who was flirting with me got my phone number from the paperwork and called and texted me. I'm nervous because of course now he may have my address. Should i call his boss and tell him, knowing this may get him fired?",
  "hReverse is cheating. That is not mathematics.",
  "hHow do you plan to manage that",
  "hEr, hello, things didn‘t quite go to plan - is limping slowly home followed by aa and with exhaust hanging off",
  "hSorry for the delay. Yes masters",
  "hCall me when u finish then i come n pick u.",
  "sPRIVATE! Your 2004 Account Statement for 078498****7 shows 786 unredeemed Bonus Points. To claim call 08719180219 Identifier Code: 45239 Expires 06.05.05",
  "hWhat's up my own oga. Left my phone at home and just saw ur messages. Hope you are good. Have a great weekend.",
  "hDon't worry though, I understand how important it is that I be put in my place with a poorly thought out punishment in the face of the worst thing that has ever happened to me. Brb gonna go kill myself",
  "hHoney, can you pls find out how much they sell Predicte in Nigeria. And how many times can it be used. Its very important to have a reply before monday",
  "hE admin building there? I might b slightly earlier... I'll call u when i'm reaching...",
  "hfyi I'm at usf now, swing by the room whenever",
  "hi can call in  &lt;#&gt;  min if thats ok",
  "hUmmmmmaah Many many happy returns of d day my dear sweet heart.. HAPPY BIRTHDAY dear",
  "hÜ no home work to do meh... ",
  "hAnything is valuable in only 2 situations: First- Before getting it... Second- After loosing it...",
  "hMe too. Mark is taking forever to pick up my prescription and the pain is coming back.",
  "hHow's ur paper?",
  "hGot smaller capacity one? Quite ex...",
  "sCheck Out Choose Your Babe Videos @ sms.shsex.netUN fgkslpoPW fgkslpo",
  "hIm good! I have been thinking about you...",
  "su r a winner U ave been specially selected 2 receive £1000 cash or a 4* holiday (flights inc) speak to a live operator 2 claim 0871277810710p/min (18 )",
  "h:-) :-)",
  "hNot thought bout it... || Drink in tap & spile at seven. || Is that pub on gas st off broad st by canal. || Ok?",
  "hI am going to sleep. I am tired of travel.",
  "hHaha, just what I was thinkin",
  "hYup but it's not giving me problems now so mayb i'll jus leave it...",
  "hLol no. Just trying to make your day a little more interesting",
  "hHow long before you get reply, just defer admission til next semester",
  "hThe word \"Checkmate\" in chess comes from the Persian phrase \"Shah Maat\" which means; \"the king is dead..\" Goodmorning.. Have a good day..:)",
  "hPo de :-):):-):-):-). No need job aha.",
  "hRats. Hey did u ever vote for the next themes?",
  "sNew Mobiles from 2004, MUST GO! Txt: NOKIA to No: 89545 & collect yours today! From ONLY £1. www.4-tc.biz 2optout 087187262701.50gbp/mtmsg18 TXTAUCTION.",
  "hI hope your pee burns tonite.",
  "hOH RITE. WELL IM WITH MY BEST MATE PETE, WHO I WENT OUT WITH 4 A WEEK+ NOW WERE 2GEVA AGAIN. ITS BEEN LONGER THAN A WEEK.",
  "hYay can't wait to party together!",
  "h....photoshop makes my computer shut down.",
  "hAll boys made fun of me today. Ok i have no problem. I just sent one message just for fun",
  "hThat's one of the issues but california is okay. No snow so its manageable",
  "sPRIVATE! Your 2003 Account Statement for shows 800 un-redeemed S. I. M. points. Call 08715203652 Identifier Code: 42810 Expires 29/10/0",
  "hHmmm.... Mayb can try e shoppin area one, but forgot e name of hotel...",
  "hAwesome, that gonna be soon or later tonight?",
  "hI need details about that online job.",
  "sYOU HAVE WON! As a valued Vodafone customer our computer has picked YOU to win a £150 prize. To collect is easy. Just call 09061743386 ",
  "hMissing you too.pray inshah allah",
  "hPls help me tell Ashley that i cant find her number oh",
  "hI am in escape theatre now. . Going to watch KAVALAN in a few minutes",
  "hS.this will increase the chance of winning.",
  "heither way works for me. I am  &lt;#&gt;  years old. Hope that doesnt bother you.",
  "hMaybe you should find something else to do instead???",
  "hGain the rights of a wife.dont demand it.i am trying as husband too.Lets see",
  "hI liked your new house",
  "hI'm fine. Hope you are also",
  "hAlso north carolina and texas atm, you would just go to the gre site and pay for the test results to be sent.",
  "hSame to u...",
  "hyes baby! I need to stretch open your pussy!",
  "hThanks  and ! Or bomb and date as my phone wanted to say! ",
  "hOk...",
  "hHey, a guy I know is breathing down my neck to get him some bud, anyway you'd be able to get a half track to usf tonight?",
  "h\"Response\" is one of d powerful weapon 2 occupy a place in others 'HEART'... So, always give response 2 who cares 4 U\"... Gud night..swt dreams..take care",
  "hNokia phone is lovly..",
  "s**FREE MESSAGE**Thanks for using the Auction Subscription Service. 18 . 150p/MSGRCVD 2 Skip an Auction txt OUT. 2 Unsubscribe txt STOP CustomerCare 08718726270",
  "sBored housewives! Chat n date now! 0871750.77.11! BT-national rate 10p/min only from landlines!",
  "hSorry da..today i wont come to play..i have driving clas..",
  "hI'm really sorry I lit your hair on fire",
  "hOh! Shit, I thought that was your trip! Loooooool ... That just makes SO much more sense now ... *grins* and the sofa reference was ... The \"sleep on a couch\" link you sent me ... Wasn't that how you went on your trip ? Oh ... And didn't your babe go with you for that celebration with your rents?",
  "hOkey dokey swashbuckling stuff what oh.",
  "hWatching cartoon, listening music &amp; at eve had to go temple &amp; church.. What about u?",
  "h1. Tension face 2. Smiling face 3. Waste face 4. Innocent face 5.Terror face 6.Cruel face 7.Romantic face 8.Lovable face 9.decent face  &lt;#&gt; .joker face.",
  "hDip's cell dead. So i m coming with him. U better respond else we shall come back.",
  "hWell. You know what i mean. Texting",
  "hHi dis is yijue i would be happy to work wif ü all for gek1510...",
  "hLol! Oops sorry! Have fun. ",
  "hWat happened to the cruise thing",
  "hI know dat feelin had it with Pete! Wuld get with em , nuther place nuther time mayb?",
  "slyricalladie(21/F) is inviting you to be her friend. Reply YES-910 or NO-910. See her: www.SMS.ac/u/hmmross STOP? Send STOP FRND to 62468",
  "hThe world's most happiest frnds never have the same characters... Dey just have the best understanding of their differences...",
  "sNo 1 POLYPHONIC tone 4 ur mob every week! Just txt PT2 to 87575. 1st Tone FREE ! so get txtin now and tell ur friends. 150p/tone. 16 reply HL 4info",
  "hYeah just open chat and click friend lists. Then make the list. Easy as pie",
  "halright tyler's got a minor crisis and has to be home sooner than he thought so be here asap",
  "hWhen/where do I pick you up",
  "hAs usual u can call me ard 10 smth.",
  "hNew Theory: Argument wins d SITUATION, but loses the PERSON. So dont argue with ur friends just.. . . . kick them &amp; say, I'm always correct.!",
  "hFor many things its an antibiotic and it can be used for chest abdomen and gynae infections even bone infections.",
  "hPoor girl can't go one day lmao",
  "hOr just do that 6times",
  "sTodays Vodafone numbers ending with 4882 are selected to a receive a £350 award. If your number matches call 09064019014 to receive your £350 award.",
  "hYou have to pls make a note of all she.s exposed to. Also find out from her school if anyone else was vomiting. Is there a dog or cat in the house? Let me know later.",
  "hJapanese Proverb: If one Can do it, U too Can do it, If none Can do it,U must do it Indian version: If one Can do it, LET HIM DO it.. If none Can do it,LEAVE it!! And finally Kerala version: If one can do it, Stop him doing it.. If none can do it, Make a strike against it ...",
  "hSounds like there could be a lot of time spent in that chastity device boy ... *grins* ... Or take your beatings like a good dog. Going to lounge in a nice long bath now ?",
  "hIts worse if if uses half way then stops. Its better for him to complete it.",
  "hMiserable. They don't tell u that the side effects of birth control are massive gut wrenching cramps for the first 2 months. I didn't sleep at all last night.",
  "hSend me the new number",
  "hConvey my regards to him",
  "sWant the latest Video handset? 750 anytime any network mins? Half price line rental? Reply or call 08000930705 for delivery tomorrow",
  "h2 and half years i missed your friendship:-)",
  "hI cant pick the phone right now. Pls send a message",
  "hOh for fuck's sake she's in like tallahassee",
  "hHaha, that was the first person I was gonna ask",
  "sou are guaranteed the latest Nokia Phone, a 40GB iPod MP3 player or a £500 prize! Txt word: COLLECT to No: 83355! IBHltd LdnW15H 150p/Mtmsgrcvd18",
  "hTaka lor. Wat time u wan 2 come n look 4 us?",
  "s* FREE* POLYPHONIC RINGTONE Text SUPER to 87131 to get your FREE POLY TONE of the week now! 16 SN PoBox202 NR31 7ZS subscription 450pw",
  "h\"I;m reaching in another 2 stops.\"",
  "hno, i *didn't* mean to post it. I wrote it, and like so many other times i've ritten stuff to you, i let it sit there. it WAS what i was feeling at the time. I was angry. Before i left, i hit send, then stop. It wasn't there. I checked on my phone when i got to my car. It wasn't there. You said you didn't sleep, you were bored. So why wouldn't THAT be the time to clean, fold laundry, etc.? At least make the bed?",
  "sWarner Village 83118 C Colin Farrell in SWAT this wkend @Warner Village & get 1 free med. Popcorn!Just show msg+ticket@kiosk.Valid 4-7/12. C t&c @kiosk. Reply SONY 4 mre film offers",
  "hWill you come online today night",
  "hThen anything special?",
  "hI'm in solihull, | do you want anything?",
  "hWill do. Have a good day",
  "hWE REGRET TO INFORM U THAT THE NHS HAS MADE A MISTAKE.U WERE NEVER ACTUALLY BORN.PLEASE REPORT 2 YOR LOCAL HOSPITAL 2B TERMINATED.WE R SORRY 4 THE INCONVENIENCE",
  "hLove that holiday Monday feeling even if I have to go to the dentists in an hour",
  "hI am on the way to tirupur.",
  "sGoal! Arsenal 4 (Henry, 7 v Liverpool 2 Henry scores with a simple shot from 6 yards from a pass by Bergkamp to give Arsenal a 2 goal margin after 78 mins.",
  "hYou've already got a flaky parent. It'snot supposed to be the child's job to support the parent...not until they're The Ride age anyway. I'm supposed to be there to support you. And now i've hurt you. unintentional. But hurt nonetheless.",
  "hWe took hooch for a walk toaday and i fell over! Splat! Grazed my knees and everything! Should have stayed at home! See you tomorrow! ",
  "hJust dropped em off, omw back now",
  "sThis is the 2nd time we have tried 2 contact u. U have won the 750 Pound prize. 2 claim is easy, call 08712101358 NOW! Only 10p per min. BT-national-rate",
  "hSitting in mu waiting for everyone to get out of my suite so I can take a shower",
  "hRe your call; You didn't see my facebook huh?",
  "hG says you never answer your texts, confirm/deny",
  "hIts so common hearin How r u? Wat r u doing? How was ur day? So let me ask u something different. Did u smile today? If not, do it now.... Gud evng.",
  "hHi Dear Call me its urgnt. I don't know whats your problem. You don't want to work or if you have any other problem at least tell me. Wating for your reply.",
  "hOh yah... We never cancel leh... Haha ",
  "hWe can go 4 e normal pilates after our intro...  ",
  "hOk... Let u noe when i leave my house.",
  "hOh yes, why is it like torture watching england?",
  "hWanna do some art?! :D",
  "hJust hopeing that wasn‘t too pissed up to remember and has gone off to his sisters or something!",
  "sGot what it takes 2 take part in the WRC Rally in Oz? U can with Lucozade Energy! Text RALLY LE to 61200 (25p), see packs or lucozade.co.uk/wrc & itcould be u!",
  "sHi, the SEXYCHAT girls are waiting for you to text them. Text now for a great night chatting. send STOP to stop this service",
  "hGood morning, my boytoy! How's those yummy lips ? Where's my sexy buns now ? What do you do ? Do you think of me ? Do you crave me ? Do you need me ?",
  "hMatch started.india  &lt;#&gt;  for 2",
  "hOnce free call me sir.",
  "hHey do you want anything to buy:)",
  "hHey babe, how's it going ? Did you ever figure out where your going for New Years ?",
  "hK..k.:)congratulation ..",
  "hG wants to know where the fuck you are",
  "hNo it was cancelled yeah baby! Well that sounds important so i understand my darlin give me a ring later on this fone love Kate x",
  "hTomarrow i want to got to court. At  &lt;DECIMAL&gt; . So you come to bus stand at 9.",
  "hÜ go home liao? Ask dad to pick me up at 6...",
  "hOmg you can make a wedding chapel in frontierville? Why do they get all the good stuff?",
  "hI'm eatin now lor, but goin back to work soon... E mountain deer show huh... I watch b4 liao, very nice...",
  "hCheck mail.i have mailed varma and kept copy to you regarding membership.take care.insha allah.",
  "hWrong phone! This phone! I answer this one but assume the other is people i don't well",
  "hAnyway I don't think I can secure anything up here, lemme know if you want me to drive down south and chill",
  "hI'm already back home so no probably not",
  "sGreat News! Call FREEFONE 08006344447 to claim your guaranteed £1000 CASH or £2000 gift. Speak to a live operator NOW!",
  "sHi this is Amy, we will be sending you a free phone number in a couple of days, which will give you an access to all the adult parties...",
  "hI am in bus on the way to calicut",
  "hHi its me you are probably having too much fun to get this message but i thought id txt u cos im bored! and james has been farting at me all night",
  "hhi baby im sat on the bloody bus at the mo and i wont be home until about 7:30 wanna do somethin later? call me later ortxt back jess xx",
  "sWelcome to Select, an O2 service with added benefits. You can now call our specially trained advisors FREE from your mobile by dialling 402.",
  "hI lost 4 pounds since my doc visit last week woot woot! Now I'm gonna celebrate by stuffing my face!",
  "hU coming back 4 dinner rite? Dad ask me so i re confirm wif u...",
  "hDoing my masters. When will you buy a bb cos i have for sale and how's bf",
  "hAhhhh...just woken up!had a bad dream about u tho,so i dont like u right now :) i didnt know anything about comedy night but i guess im up for it.",
  "hI'm vivek:)i got call from your number.",
  "hWhy didn't u call on your lunch?",
  "hWhat i mean was i left too early to check, cos i'm working a 9-6.",
  "hI want  &lt;#&gt;  rs da:)do you have it?",
  "hA bit of Ur smile is my hppnss, a drop of Ur tear is my sorrow, a part of Ur heart is my life, a heart like mine wil care for U, forevr as my GOODFRIEND",
  "hYup ok...",
  "hI want to see your pretty pussy...",
  "sDear Voucher holder Have your next meal on us. Use the following link on your pc 2 enjoy a 2 4 1 dining experiencehttp://www.vouch4me.com/etlp/dining.asp",
  "hA few people are at the game, I'm at the mall with iouri and kaila",
  "sURGENT! We are trying to contact U. Todays draw shows that you have won a £2000 prize GUARANTEED. Call 09058094507 from land line. Claim 3030. Valid 12hrs only",
  "sYou can donate £2.50 to UNICEF's Asian Tsunami disaster support fund by texting DONATE to 864233. £2.50 will be added to your next bill",
  "hFuture is not what we planned for tomorrow.....! it is the result of what we do today...! Do the best in present... enjoy the future.",
  "hI will cme i want to go to hos 2morow. After that i wil cme. This what i got from her dear what to do. She didnt say any time",
  "hWe are supposed to meet to discuss abt our trip... Thought xuhui told you? In the afternoon. Thought we can go for lesson after that",
  "hHey come online! Use msn... We are all there",
  "hI'm fine. Hope you are good. Do take care.",
  "hOops I was in the shower when u called. Hey a parking garage collapsed at university hospital. See I'm not crazy. Stuff like that DOES happen.",
  "hAiyo u so poor thing... Then u dun wan 2 eat? U bathe already?",
  "hYar... I tot u knew dis would happen long ago already.",
  "hYou are gorgeous! keep those pix cumming :) thank you!",
  "hA boy was late 2 home. His father: \"POWER OF FRNDSHIP\"",
  "hJADE ITS PAUL. Y DIDN’T U TXT ME? DO U REMEMBER ME FROM BARMED? I WANT 2 TALK 2 U! TXT ME",
  "hSpending new years with my brother and his family. Lets plan to meet next week. Are you ready to be spoiled? :)",
  "hSo what u doing today?",
  "hI said its okay. Sorry",
  "hSlept? I thinkThis time ( &lt;#&gt;  pm) is not dangerous",
  "hNetworking job is there.",
  "sgoldviking (29/M) is inviting you to be his friend. Reply YES-762 or NO-762 See him: www.SMS.ac/u/goldviking STOP? Send STOP FRND to 62468",
  "hDont let studying stress you out. L8r.",
  "hThat's y u haf 2 keep me busy...",
  "hNo rushing. I'm not working. I'm in school so if we rush we go hungry.",
  "hWhich channel:-):-):):-).",
  "hSo your telling me I coulda been your real Valentine and I wasn't? U never pick me for NOTHING!!",
  "sPhony £350 award - Todays Voda numbers ending XXXX are selected to receive a £350 award. If you have a match please call 08712300220 quoting claim code 3100 standard rates app",
  "hWe made it! Eta at taunton is 12:30 as planned, hope that‘s still okday?! Good to see you! :-xx",
  "hI'm hungry buy smth home...",
  "h\"HEY KATE, HOPE UR OK... WILL GIVE U A BUZ WEDLUNCH. GO OUTSOMEWHERE 4 ADRINK IN TOWN..CUD GO 2WATERSHD 4 A BIT? PPL FROMWRK WILL BTHERE. LOVE PETEXXX.\"",
  "hMy drive can only be read. I need to write",
  "hJust looked it up and addie goes back Monday, sucks to be her",
  "hHappy new year. Hope you are having a good semester",
  "hEsplanade lor. Where else...",
  "hCan you talk with me..",
  "hHmph. Go head, big baller.",
  "hWell its not like you actually called someone a punto. That woulda been worse.",
  "hNope. Since ayo travelled, he has forgotten his guy",
  "hYou still around? Looking to pick up later",
  "sCDs 4u: Congratulations ur awarded £500 of CD gift vouchers or £125 gift guaranteed & Freeentry 2 £100 wkly draw xt MUSIC to 87066 TnCs www.ldew.com1win150ppmx3age16 ",
  "hThere's someone here that has a year  &lt;#&gt;  toyota camry like mr olayiwola's own. Mileage is  &lt;#&gt; k.its clean but i need to know how much will it sell for. If i can raise the dough for it how soon after landing will it sell. Holla back.",
  "hGuess which pub im in? Im as happy as a pig in clover or whatever the saying is! ",
  "hILL B DOWN SOON",
  "hOh k. . I will come tomorrow",
  "hGo fool dont cheat others ok",
  "hMy mobile number.pls sms ur mail id.convey regards to achan,amma.Rakhesh.Qatar",
  "hBy the way, 'rencontre' is to meet again. Mountains dont....",
  "sYou have WON a guaranteed £1000 cash or a £2000 prize. To claim yr prize call our customer service representative on 08714712412 between 10am-7pm Cost 10p",
  "hU attend ur driving lesson how many times a wk n which day?",
  "hUncle G, just checking up on you. Do have a rewarding month",
  "hHello boytoy ! Geeee ... I'm missing you today. I like to send you a tm and remind you I'm thinking of you ... And you are loved ... *loving kiss*",
  "hI think the other two still need to get cash but we can def be ready by 9",
  "hHey gals...U all wanna meet 4 dinner at nìte? ",
  "sDear 0776xxxxxxx U've been invited to XCHAT. This is our final attempt to contact u! Txt CHAT to 86688 150p/MsgrcvdHG/Suite342/2Lands/Row/W1J6HL LDN 18yrs",
  "hBabe ! What are you doing ? Where are you ? Who are you talking to ? Do you think of me ? Are you being a good boy? Are you missing me? Do you love me ?",
  "hGreat! How is the office today?",
  "hIt's cool, we can last a little while. Getting more any time soon?",
  "h:-( sad puppy noise",
  "hYes its possible but dint try. Pls dont tell to any one k",
  "hAnyway holla at me whenever you're around because I need an excuse to go creep on people in sarasota",
  "hWhere you. What happen",
  "hI was gonna ask you lol but i think its at 7",
  "sUr cash-balance is currently 500 pounds - to maximize ur cash-in now send GO to 86688 only 150p/meg. CC: 08718720201 HG/Suite342/2lands Row/W1j6HL",
  "sPRIVATE! Your 2003 Account Statement for shows 800 un-redeemed S.I.M. points. Call 08715203685 Identifier Code:4xx26 Expires 13/10/04",
  "hGo chase after her and run her over while she's crossing the street",
  "sI'd like to tell you my deepest darkest fantasies. Call me 09094646631 just 60p/min. To stop texts call 08712460324 (nat rate)",
  "hIs there coming friday is leave for pongal?do you get any news from your work place.",
  "hHey... Very inconvenient for your sis a not huh?",
  "hOk i vl..do u know i got adsense approved..",
  "h* Was really good to see you the other day dudette, been missing you!",
  "hI want to go to perumbavoor",
  "hHow many times i told in the stage all use to laugh. You not listen aha.",
  "sYou won't believe it but it's true. It's Incredible Txts! Reply G now to learn truly amazing things that will blow your mind. From O2FWD only 18p/txt",
  "h(You didn't hear it from me)",
  "hThanks for being there for me just to talk to on saturday. You are very dear to me. I cherish having you as a brother and role model.",
  "hPls clarify back if an open return ticket that i have can be preponed for me to go back to kerala.",
  "sNatalie (20/F) is inviting you to be her friend. Reply YES-165 or NO-165 See her: www.SMS.ac/u/natalie2k9 STOP? Send STOP FRND to 62468",
  "hShe ran off with a younger man. we will make pretty babies together :)",
  "sJamster! To get your free wallpaper text HEART to 88888 now! T&C apply. 16 only. Need Help? Call 08701213186.",
  "hO ic lol. Should play 9 doors sometime yo",
  "hDunno, my dad said he coming home 2 bring us out 4 lunch. Yup i go w u lor. I call u when i reach school lor...",
  "hWe have sent JD for Customer Service cum Accounts Executive to ur mail id, For details contact us",
  "hDesires- u going to doctor 4 liver. And get a bit stylish. Get ur hair managed. Thats it.",
  "hHmmm.still we dont have opener?",
  "hYeah so basically any time next week you can get away from your mom &amp; get up before 3",
  "hEdison has rightly said, \"A fool can ask more questions than a wise man can answer\" Now you know why all of us are speechless during ViVa.. GM,GN,GE,GNT:-)",
  "hI will vote for wherever my heart guides me",
  "hWith my sis lor... We juz watched italian job.",
  "hTick, tick, tick .... Where are you ? I could die of loneliness you know ! *pouts* *stomps feet* I need you ...",
  "hLmao you know me so well...",
  "sDouble Mins & Double Txt & 1/2 price Linerental on Latest Orange Bluetooth mobiles. Call MobileUpd8 for the very latest offers. 08000839402 or call2optout/LF56",
  "hAm on a train back from northampton so i'm afraid not! I'm staying skyving off today ho ho! Will be around wednesday though. Do you fancy the comedy club this week by the way?",
  "hGoodnight da thangam I really miss u dear.",
  "hHey next sun 1030 there's a basic yoga course... at bugis... We can go for that... Pilates intro next sat.... Tell me what time you r free",
  "hGeeeee ... Your internet is really bad today, eh ?",
  "sFree video camera phones with Half Price line rental for 12 mths and 500 cross ntwk mins 100 txts. Call MobileUpd8 08001950382 or Call2OptOut/674",
  "hI think i am disturbing her da",
  "hSorry, I'll call you  later. I am in meeting sir.",
  "hHavent stuck at orchard in my dad's car. Going 4 dinner now. U leh? So r they free tonight?",
  "hOk i also wan 2 watch e 9 pm show...",
  "hI dunno lei... Like dun haf...",
  "hBut your brother transfered only  &lt;#&gt;  +  &lt;#&gt; . Pa.",
  "hI calls you later. Afternoon onwords mtnl service get problem in south mumbai. I can hear you but you cann't listen me.",
  "s83039 62735=£450 UK Break AccommodationVouchers terms & conditions apply. 2 claim you mustprovide your claim number which is 15541 ",
  "hTalk to g and x about that",
  "hHai dear friends... This is my new &amp; present number..:) By Rajitha Raj (Ranju)",
  "s5p 4 alfie Moon's Children in need song on ur mob. Tell ur m8s. Txt Tone charity to 8007 for Nokias or Poly charity for polys: zed 08701417012 profit 2 charity.",
  "hAs in different styles?",
  "sWIN a £200 Shopping spree every WEEK Starting NOW. 2 play text STORE to 88039. SkilGme. TsCs08714740323 1Winawk! age16 £1.50perweeksub.",
  "hGud ni8 dear..slp well..take care..swt dreams..Muah..",
  "hI want to sent  &lt;#&gt; mesages today. Thats y. Sorry if i hurts",
  "sThis is the 2nd attempt to contract U, you have won this weeks top prize of either £1000 cash or £200 prize. Just call 09066361921",
  "hWell, i'm glad you didn't find it totally disagreeable ... Lol",
  "hGuy, no flash me now. If you go call me, call me. How madam. Take care oh.",
  "sDo you want a New Nokia 3510i colour phone DeliveredTomorrow? With 300 free minutes to any mobile + 100 free texts + Free Camcorder reply or call 08000930705.",
  "hMark works tomorrow. He gets out at 5. His work is by your house so he can meet u afterwards.",
  "h\"Keep ur problems in ur heart, b'coz nobody will fight for u. Only u &amp; u have to fight for ur self &amp; win the battle. -VIVEKANAND- G 9t.. SD..",
  "hYeah, give me a call if you've got a minute",
  "h\"HI BABE UAWAKE?FEELLIKW SHIT.JUSTFOUND OUT VIA ALETTER THATMUM GOTMARRIED 4thNOV.BEHIND OURBACKS - FUCKINNICE!SELFISH,DEVIOUSBITCH.ANYWAY,I’L CALL U\"",
  "hAmazing : If you rearrange these letters it gives the same meaning... Dormitory = Dirty room Astronomer = Moon starer The eyes = They see Election results = Lies lets recount Mother-in-law = Woman Hitler Eleven plus two =Twelve plus one Its Amazing... !:-)",
  "hAiya we discuss later lar... Pick ü up at 4 is it?",
  "hHey happy birthday...",
  "hSorry i missed your call. Can you please call back.",
  "hOmg if its not one thing its another. My cat has worms :/ when does this bad day end?",
  "hGood morning, im suffering from fever and dysentry ..will not be able to come to office today.",
  "hI wont do anything de.",
  "hWhat type of stuff do you sing?",
  "hSt andre, virgil's cream",
  "hNo no. I will check all rooms befor activities",
  "hMy fri ah... Okie lor,goin 4 my drivin den go shoppin after tt...",
  "hGokila is talking with you aha:)",
  "hHi Shanil,Rakhesh here.thanks,i have exchanged the uncut diamond stuff.leaving back. Excellent service by Dino and Prem.",
  "hK.k.this month kotees birthday know?",
  "hBut i'm really really broke oh. No amount is too small even  &lt;#&gt; ",
  "hSorry about that this is my mates phone and i didnt write it love Kate",
  "sTheMob>Hit the link to get a premium Pink Panther game, the new no. 1 from Sugababes, a crazy Zebra animation or a badass Hoody wallpaper-all 4 FREE!",
  "hAh, well that confuses things, doesnt it? I thought was friends with now. Maybe i did the wrong thing but i already sort of invited -tho he may not come cos of money.",
  "hAight, call me once you're close",
  "hNope thats fine. I might have a nap tho! ",
  "sThis msg is for your mobile content order It has been resent as previous attempt failed due to network error Queries to customersqueries@netvision.uk.com",
  "hIn other news after hassling me to get him weed for a week andres has no money. HAUGHAIGHGTUJHYGUJ",
  "hA Boy loved a gal. He propsd bt she didnt mind. He gv lv lttrs, Bt her frnds threw thm. Again d boy decided 2 aproach d gal , dt time a truck was speeding towards d gal. Wn it was about 2 hit d girl,d boy ran like hell n saved her. She asked 'hw cn u run so fast?' D boy replied \"Boost is d secret of my energy\" n instantly d girl shouted \"our energy\" n Thy lived happily 2gthr drinking boost evrydy Moral of d story:- I hv free msgs:D;): gud ni8",
  "hI wnt to buy a BMW car urgently..its vry urgent.but hv a shortage of  &lt;#&gt; Lacs.there is no source to arng dis amt. &lt;#&gt; lacs..thats my prob",
  "hDing me on ya break fassyole! Blacko from londn",
  "hI REALLY NEED 2 KISS U I MISS U MY BABY FROM UR BABY 4EVA",
  "hThe sign of maturity is not when we start saying big things.. But actually it is, when we start understanding small things... *HAVE A NICE EVENING* BSLVYL",
  "hOh you got many responsibilities.",
  "sYou have 1 new message. Please call 08715205273",
  "hI've reached sch already...",
  "sDecember only! Had your mobile 11mths+? You are entitled to update to the latest colour camera mobile for Free! Call The Mobile Update VCo FREE on 08002986906 ",
  "hU definitely need a module from e humanities dis sem izzit? U wan 2 take other modules 1st?",
  "hArgh why the fuck is nobody in town ;_;",
  "sGet 3 Lions England tone, reply lionm 4 mono or lionp 4 poly. 4 more go 2 www.ringtones.co.uk, the original n best. Tones 3GBP network operator rates apply.",
  "hThanks. Fills me with complete calm and reassurance! ",
  "hAslamalaikkum....insha allah tohar beeen muht albi mufti mahfuuz...meaning same here....",
  "hAre you driving or training?",
  "hLol for real. She told my dad I have cancer",
  "sPRIVATE! Your 2003 Account Statement for 078",
  "hOops I did have it,  &lt;#&gt; ?",
  "h\"NOT ENUFCREDEIT TOCALL.SHALL ILEAVE UNI AT 6 +GET A BUS TO YOR HOUSE?\"",
  "hHi Chikku, send some nice msgs",
  "hHe is impossible to argue with and he always treats me like his sub, like he never released me ... Which he did and I will remind him of that if necessary",
  "hAfter my work ah... Den 6 plus lor... U workin oso rite... Den go orchard lor, no other place to go liao...",
  "hTo the wonderful Okors, have a great month. We cherish you guys and wish you well each day. MojiBiola",
  "hCuz ibored. And don wanna study",
  "hWot about on wed nite I am 3 then but only til 9!",
  "hRose for red,red for blood,blood for heart,heart for u. But u for me.... Send tis to all ur friends.. Including me.. If u like me.. If u get back, 1-u r poor in relation! 2-u need some 1 to support 3-u r frnd 2 many 4-some1 luvs u 5+- some1 is praying god to marry u.:-) try it....",
  "hAny way where are you and what doing.",
  "hThat sucks. I'll go over so u can do my hair. You'll do it free right?",
  "hit's still not working. And this time i also tried adding zeros. That was the savings. The checking is  &lt;#&gt; ",
  "hHmm... Dunno leh, mayb a bag 4 goigng out dat is not too small. Or jus anything except perfume, smth dat i can keep.",
  "hSday only joined.so training we started today:)",
  "hSorry * was at the grocers.",
  "hThere are some nice pubs near here or there is Frankie n Bennys near the warner cinema?",
  "sYOU VE WON! Your 4* Costa Del Sol Holiday or £5000 await collection. Call 09050090044 Now toClaim. SAE, TC s, POBox334, Stockport, SK38xh, Cost£1.50/pm, Max10mins",
  "hYup... I havent been there before... You want to go for the yoga? I can call up to book ",
  "hOh shut it. Omg yesterday I had a dream that I had 2 kids both boys. I was so pissed. Not only about the kids but them being boys. I even told mark in my dream that he was changing diapers cause I'm not getting owed in the face.",
  "hYeah I imagine he would be really gentle. Unlike the other docs who treat their patients like turkeys.",
  "sFREE for 1st week! No1 Nokia tone 4 ur mobile every week just txt NOKIA to 8077 Get txting and tell ur mates. www.getzed.co.uk POBox 36504 W45WQ 16+ norm150p/tone",
  "hNow that you have started dont stop. Just pray for more good ideas and anything i see that can help you guys i.ll forward you a link.",
  "hHi darlin im on helens fone im gonna b up the princes 2 nite please come up tb love Kate",
  "hI'm in office now da:)where are you?",
  "hAiyar u so poor thing... I give u my support k... Jia you! I'll think of u...",
  "hOh unintentionally not bad timing. Great. Fingers  the trains play along! Will give fifteen min warning.",
  "sGet your garden ready for summer with a FREE selection of summer bulbs and seeds worth £33:50 only with The Scotsman this Saturday. To stop go2 notxt.co.uk",
  "hK..then come wenever u lik to come and also tel vikky to come by getting free time..:-)",
  "hPls call me da. What happen.",
  "hHappy new year to u and ur family...may this new year bring happiness , stability and tranquility to ur vibrant colourful life:):)",
  "hNo problem with the renewal. I.ll do it right away but i dont know his details.",
  "hIdk. I'm sitting here in a stop and shop parking lot right now bawling my eyes out because i feel like i'm a failure in everything. Nobody wants me and now i feel like i'm failing you.",
  "hHaven't left yet so probably gonna be here til dinner",
  "hLike  &lt;#&gt; , same question",
  "hMY NEW YEARS EVE WAS OK. I WENT TO A PARTY WITH MY BOYFRIEND. WHO IS THIS SI THEN HEY",
  "hSir, I need Velusamy sir's date of birth and company bank facilities details.",
  "hK k:) sms chat with me.",
  "hI will come with karnan car. Please wait till 6pm will directly goto doctor.",
  "hNo but the bluray player can",
  "hOk... Then r we meeting later?",
  "hLol no. I just need to cash in my nitros. Hurry come on before I crash out!",
  "hJust send a text. We'll skype later.",
  "hOk leave no need to ask",
  "sCongrats 2 mobile 3G Videophones R yours. call 09063458130 now! videochat wid ur mates, play java games, Dload polypH music, noline rentl. bx420. ip4. 5we. 150p",
  "hÜ still got lessons?  Ü in sch?",
  "hY she dun believe leh? I tot i told her it's true already. I thk she muz c us tog then she believe.",
  "hOh did you charge camera",
  "hI‘ve got some salt, you can rub it in my open wounds if you like!",
  "hNow i'm going for lunch.",
  "hI'm in school now n i'll be in da lab doing some stuff give me a call when ü r done.",
  "hOh k. . I will come tomorrow",
  "hAight, text me tonight and we'll see what's up",
  "hU 2.",
  "hWater logging in desert. Geoenvironmental implications.",
  "hRaji..pls do me a favour. Pls convey my Birthday wishes to Nimya. Pls. Today is her birthday.",
  "hCompany is very good.environment is terrific and food is really nice:)",
  "hVery strange.  and  are watching the 2nd one now but i'm in bed. Sweet dreams, miss u ",
  "sSMS AUCTION - A BRAND NEW Nokia 7250 is up 4 auction today! Auction is FREE 2 join & take part! Txt NOKIA to 86021 now!",
  "hHi hope u r both ok, he said he would text and he hasn't, have u seen him, let me down gently please ",
  "hBabe! I fucking love you too !! You know? Fuck it was so good to hear your voice. I so need that. I crave it. I can't get enough. I adore you, Ahmad *kisses*",
  "hK sure am in my relatives home. Sms me de. Pls:-)",
  "hI sent them. Do you like?",
  "hFuuuuck I need to stop sleepin, sup",
  "hI'm in town now so i'll jus take mrt down later.",
  "hI just cooked a rather nice salmon a la you",
  "hI uploaded mine to Facebook",
  "hWHAT TIME U WRKIN?",
  "hOkie",
  "sree entry in 2 a weekly comp for a chance to win an ipod. Txt POD to 80182 to get entry (std txt rate) T&C's apply 08452810073 for details 18+",
  "sOur records indicate u maybe entitled to 5000 pounds in compensation for the Accident you had. To claim 4 free reply with CLAIM to this msg. 2 stop txt STOP",
  "hSorry, I'll call later",
  "hOh oh... Den muz change plan liao... Go back have to yan jiu again...",
  "hIt's wylie, you in tampa or sarasota?",
  "hOk... Take ur time n enjoy ur dinner...",
  "hDarren was saying dat if u meeting da ge den we dun meet 4 dinner. Cos later u leave xy will feel awkward. Den u meet him 4 lunch lor.",
  "sSpook up your mob with a Halloween collection of a logo & pic message plus a free eerie tone, txt CARD SPOOK to 8007 zed 08701417012150p per logo/pic ",
  "hI like cheap! But i‘m happy to splash out on the wine if it makes you feel better..",
  "hShe.s fine. I have had difficulties with her phone. It works with mine. Can you pls send her another friend request.",
  "hUgh my leg hurts. Musta overdid it on mon.",
  "sCall Germany for only 1 pence per minute! Call from a fixed line via access number 0844 861 85 85. No prepayment. Direct access! www.telediscount.co.uk",
  "sYOU VE WON! Your 4* Costa Del Sol Holiday or £5000 await collection. Call 09050090044 Now toClaim. SAE, TC s, POBox334, Stockport, SK38xh, Cost£1.50/pm, Max10mins",
  "hWOT STUDENT DISCOUNT CAN U GET ON BOOKS?",
  "hMe fine..absolutly fine",
  "hHow come she can get it? Should b quite diff to guess rite...",
  "sHad your mobile 11mths ? Update for FREE to Oranges latest colour camera mobiles & unlimited weekend calls. Call Mobile Upd8 on freefone 08000839402 or 2StopTxt",
  "hI will reach ur home in  &lt;#&gt;  minutes",
  "hBabe, I'm answering you, can't you see me ? Maybe you'd better reboot YM ... I got the photo ... It's great !",
  "hHi.what you think about match?",
  "hI know you are thinkin malaria. But relax, children cant handle malaria. She would have been worse and its gastroenteritis. If she takes enough to replace her loss her temp will reduce. And if you give her malaria meds now she will just vomit. Its a self limiting illness she has which means in a few days it will completely stop",
  "hDai i downloaded but there is only exe file which i can only run that exe after installing.",
  "hIt is only yesterday true true.",
  "hK.k.how is your business now?",
  "h3 pa but not selected.",
  "sNatalja (25/F) is inviting you to be her friend. Reply YES-440 or NO-440 See her: www.SMS.ac/u/nat27081980 STOP? Send STOP FRND to 62468",
  "hI keep ten rs in my shelf:) buy two egg.",
  "hI am late. I will be there at",
  "hWell thats nice. Too bad i cant eat it",
  "hI accidentally brought em home in the box",
  "hPls she needs to dat slowly or she will vomit more.",
  "hI have to take exam with in march 3",
  "hJane babes not goin 2 wrk, feel ill after lst nite. Foned in already cover 4 me chuck.:-)",
  "h5 nights...We nt staying at port step liao...Too ex",
  "hIf I die I want u to have all my stuffs.",
  "h\"OH FUCK. JUSWOKE UP IN A BED ON A BOATIN THE DOCKS. SLEPT WID 25 YEAR OLD. SPINOUT! GIV U DA GOSSIP L8R. XXX\"",
  "hSmile in Pleasure Smile in Pain Smile when trouble pours like Rain Smile when sum1 Hurts U Smile becoz SOMEONE still Loves to see u Smiling!!",
  "hPrabha..i'm soryda..realy..frm heart i'm sory",
  "hI re-met alex nichols from middle school and it turns out he's dealing!",
  "sPRIVATE! Your 2003 Account Statement for <fone no> shows 800 un-redeemed S. I. M. points. Call 08715203656 Identifier Code: 42049 Expires 26/10/04",
  "hIt means u could not keep ur words.",
  "hNope, I'm still in the market",
  "hI realise you are a busy guy and i'm trying not to be a bother. I have to get some exams outta the way and then try the cars. Do have a gr8 day",
  "sYOU ARE CHOSEN TO RECEIVE A £350 AWARD! Pls call claim number 09066364311 to collect your award which you are selected to receive as a valued mobile customer.",
  "hHey what how about your project. Started aha da.",
  "hOk cool. See ya then.",
  "hAm on the uworld site. Am i buying the qbank only or am i buying it with the self assessment also?",
  "hYour opinion about me? 1. Over 2. Jada 3. Kusruthi 4. Lovable 5. Silent 6. Spl character 7. Not matured 8. Stylish 9. Simple Pls reply..",
  "sSomeonone you know is trying to contact you via our dating service! To find out who it could be call from your mobile or landline 09064015307 BOX334SK38ch ",
  "hYeah I can still give you a ride",
  "hJay wants to work out first, how's 4 sound?",
  "hGud gud..k, chikku tke care.. sleep well gud nyt",
  "hIts a part of checking IQ",
  "hHmm thinking lor...",
  "hOf course ! Don't tease me ... You know I simply must see ! *grins* ... Do keep me posted my prey ... *loving smile* *devouring kiss*",
  "hthanks for the temales it was wonderful. Thank. Have a great week.",
  "hThank you princess! I want to see your nice juicy booty...",
  "hHaven't eaten all day. I'm sitting here staring at this juicy pizza and I can't eat it. These meds are ruining my life.",
  "hGud ni8 dear..slp well..take care..swt dreams..Muah..",
  "hU come n search tat vid..not finishd..",
  "hK I'm leaving soon, be there a little after 9",
  "sUrgent! Please call 09061213237 from a landline. £5000 cash or a 4* holiday await collection. T &Cs SAE PO Box 177 M227XY. 16+",
  "hYeah work is fine, started last week, all the same stuff as before, dull but easy and guys are fun!",
  "hYou do your studies alone without anyones help. If you cant no need to study.",
  "hPlease tell me not all of my car keys are in your purse",
  "hI didnt get anything da",
  "hOk... Sweet dreams...",
  "hWell she's in for a big surprise!",
  "hAs usual..iam fine, happy &amp; doing well..:)",
  "h1 in cbe. 2 in chennai.",
  "hCan help u swoop by picking u up from wherever ur other birds r meeting if u want.",
  "hIf anyone calls for a treadmill say you'll buy it. Make sure its working. I found an ad on Craigslist selling for $ &lt;#&gt; .",
  "hI absolutely LOVE South Park! I only recently started watching the office.",
  "hDid you see that film:)",
  "hPls speak with me. I wont ask anything other then you friendship.",
  "hStorming msg: Wen u lift d phne, u say \"HELLO\" Do u knw wt is d real meaning of HELLO?? . . . It's d name of a girl..! . . . Yes.. And u knw who is dat girl?? \"Margaret Hello\" She is d girlfrnd f Grahmbell who invnted telphone... . . . . Moral:One can 4get d name of a person, bt not his girlfrnd... G o o d n i g h t . . .@",
  "hGud ni8.swt drms.take care",
  "hHI DARLIN ITS KATE ARE U UP FOR DOIN SOMETHIN TONIGHT? IM GOING TO A PUB CALLED THE SWAN OR SOMETHING WITH MY PARENTS FOR ONE DRINK SO PHONE ME IF U CAN",
  "hAnything lar then ü not going home 4 dinner?",
  "h\"ER, ENJOYIN INDIANS AT THE MO..yeP. SaLL gOoD HehE ;> hows bout u shexy? Pete Xx\"",
  "sIf you don't, your prize will go to another customer. T&C at www.t-c.biz 18+ 150p/min Polo Ltd Suite 373 London W1J 6HL Please call back if busy ",
  "hDid u fix the teeth?if not do it asap.ok take care.",
  "hSo u wan 2 come for our dinner tonight a not?",
  "hHello.How u doing?What u been up 2?When will u b moving out of the flat, cos I will need to arrange to pick up the lamp, etc. Take care. Hello caroline!",
  "hIts too late:)but its k.wish you the same.",
  "hHi. Hope ur day * good! Back from walk, table booked for half eight. Let me know when ur coming over.",
  "hOh yeah clearly it's my fault",
  "hDunno leh cant remember mayb lor. So wat time r we meeting tmr?",
  "hBest msg: It's hard to be with a person, when u know that one more step foward will make u fall in love.. &amp; One step back can ruin ur friendship.. good night:-) ...",
  "sURGENT! Your Mobile number has been awarded with a £2000 prize GUARANTEED. Call 09061790126 from land line. Claim 3030. Valid 12hrs only 150ppm",
  "hHelloooo... Wake up..! \"Sweet\" \"morning\" \"welcomes\" \"You\" \"Enjoy\" \"This Day\" \"with full of joy\".. \"GUD MRNG\".",
  "hVikky, come around  &lt;TIME&gt; ..",
  "hAnd how you will do that, princess? :)",
  "hI have gone into get info bt dont know what to do",
  "hYeah, probably here for a while",
  "hSent me ur email id soon",
  "sURGENT! You have won a 1 week FREE membership in our £100,000 Prize Jackpot! Txt the word: CLAIM to No: 81010 T&C www.dbuk.net LCCLTD POBOX 4403LDNW1A7RW18",
  "hI'm still pretty weak today .. Bad day ?",
  "hHey ! Don't forget ... You are MINE ... For ME ... My possession ... MY property ... MMM ... *childish smile* ...",
  "hAn excellent thought by a misundrstud frnd: I knw u hate me bt the day wen u'll knw the truth u'll hate urself:-( Gn:-)",
  "hHey! Congrats 2u2. id luv 2 but ive had 2 go home!",
  "hDear where you. Call me",
  "hXy trying smth now. U eat already? We havent...",
  "sUrgent! Please call 09061213237 from landline. £5000 cash or a luxury 4* Canary Islands Holiday await collection. T&Cs SAE PO Box 177. M227XY. 150ppm. 16+",
  "hI donno its in your genes or something",
  "sXMAS iscoming & ur awarded either £500 CD gift vouchers & free entry 2 r £100 weekly draw txt MUSIC to 87066 TnC www.Ldew.com1win150ppmx3age16subscription ",
  "hAlex says he's not ok with you not being ok with it",
  "hAre u coming to the funeral home",
  "hMy darling sister. How are you doing. When's school resuming. Is there a minimum wait period before you reapply? Do take care",
  "hI.ll hand her my phone to chat wit u",
  "hWell good morning mr . Hows london treatin' ya treacle?",
  "hI can't make it tonight",
  "hAt WHAT TIME should i come tomorrow",
  "hAbout  &lt;#&gt; bucks. The banks fees are fixed. Better to call the bank and find out.",
  "hI can. But it will tell quite long, cos i haven't finish my film yet...",
  "hPls ask macho how much is budget for bb bold 2 is cos i saw a new one for  &lt;#&gt;  dollars.",
  "h\"Hi missed your Call and my mumHas beendropping red wine all over theplace! what is your adress?\"",
  "hIll be at yours in about 3 mins but look out for me",
  "hWhat you did in  leave.",
  "hI'm coming back on Thursday. Yay. Is it gonna be ok to get the money. Cheers. Oh yeah and how are you. Everything alright. Hows school. Or do you call it work now",
  "hJolly good! By the way,  will give u tickets for sat eve 7.30. Speak before then x",
  "hyeah, that's what I was thinking",
  "hK.k:)i'm going to tirunelvali this week to see my uncle ..i already spend the amount by taking dress .so only i want money.i will give it on feb 1",
  "hHere got ur favorite oyster... N got my favorite sashimi... Ok lar i dun say already... Wait ur stomach start rumbling...",
  "hMy sister going to earn more than me da.",
  "sGet the official ENGLAND poly ringtone or colour flag on yer mobile for tonights game! Text TONE or FLAG to 84199. Optout txt ENG STOP Box39822 W111WX £1.50",
  "hHahaha..use your brain dear",
  "hJus finish watching tv... U?",
  "hK, fyi I'm back in my parents' place in south tampa so I might need to do the deal somewhere else",
  "hGood morning, my Love ... I go to sleep now and wish you a great day full of feeling better and opportunity ... You are my last thought babe, I LOVE YOU *kiss*",
  "hKothi print out marandratha.",
  "hBut we havent got da topic yet rite?",
  "hOk no problem... Yup i'm going to sch at 4 if i rem correctly...",
  "hThanks, I'll keep that in mind",
  "hAah bless! How's your arm?",
  "hDear Sir,Salam Alaikkum.Pride and Pleasure meeting you today at the Tea Shop.We are pleased to send you our contact number at Qatar.Rakhesh an Indian.Pls save our Number.Respectful Regards.",
  "hGal n boy walking in d park. gal-can i hold ur hand? boy-y? do u think i would run away? gal-no, jst wana c how it feels walking in heaven with an prince..GN:-)",
  "hWhat makes you most happy?",
  "hWishing you a wonderful week.",
  "hSweet heart how are you?",
  "hSir, waiting for your letter.",
  "hDude im no longer a pisces. Im an aquarius now.",
  "hX course it 2yrs. Just so her messages on messenger lik you r sending me",
  "hI think steyn surely get one wicket:)",
  "hNeither [in sterm voice] - i'm studying. All fine with me! Not sure the  thing will be resolved, tho. Anyway. Have a fab hols",
  "hGarbage bags, eggs, jam, bread, hannaford wheat chex",
  "hNo. It's not pride. I'm almost  &lt;#&gt;  years old and shouldn't be takin money from my kid. You're not supposed to have to deal with this stuff. This is grownup stuff--why i don't tell you.",
  "hSounds better than my evening im just doing my costume. Im not sure what time i finish tomorrow but i will txt you at the end.",
  "hMy birthday is on feb  &lt;#&gt;  da. .",
  "hSo when do you wanna gym?",
  "hYou'd like that wouldn't you? Jerk!",
  "hAre u awake? Is there snow there?",
  "hAnd of course you should make a stink!",
  "su r subscribed 2 TEXTCOMP 250 wkly comp. 1st wk?s free question follows, subsequent wks charged@150p/msg.2 unsubscribe txt STOP 2 84128,custcare 08712405020",
  "hNo go. No openings for that room 'til after thanksgiving without an upcharge.",
  "hWhen you guys planning on coming over?",
  "hWat ü doing now?",
  "hMy Parents, My Kidz, My Friends n My Colleagues. All screaming.. SURPRISE !! and I was waiting on the sofa.. ... ..... ' NAKED...!",
  "hNo sir. That's why i had an 8-hr trip on the bus last week. Have another audition next wednesday but i think i might drive this time.",
  "hDo I? I thought I put it back in the box",
  "hI'm home...",
  "hNo one interested. May be some business plan.",
  "hYup it's at paragon... I havent decided whether 2 cut yet... Hee...",
  "hGood morning princess! Have a great day!",
  "hGuai... Ü shd haf seen him when he's naughty... Ü so free today? Can go jogging...",
  "hAiyo cos i sms ü then ü neva reply so i wait 4 ü to reply lar. I tot ü havent finish ur lab wat.",
  "hLiving is very simple.. Loving is also simple.. Laughing is too simple.. Winning is tooo simple.. But, Being 'SIMPLE' is very difficult...;-) :-)",
  "hTell me something. Thats okay.",
  "hOk",
  "hHmm. Shall i bring a bottle of wine to keep us amused? Just joking! I'll still bring a bottle. Red or white? See you tomorrow",
  "hThis is ur face test ( 1 2 3 4 5 6 7 8 9  &lt;#&gt;  ) select any number i will tell ur face astrology.... am waiting. quick reply...",
  "hHey, iouri gave me your number, I'm wylie, ryan's friend",
  "hYep get with the program. You're slacking.",
  "hI'm in inside office..still filling forms.don know when they leave me.",
  "hI think your mentor is , but not 100 percent sure.",
  "sCall 09095350301 and send our girls into erotic ecstacy. Just 60p/min. To stop texts call 08712460324 (nat rate)",
  "sCamera - You are awarded a SiPix Digital Camera! call 09061221066 fromm landline. Delivery within 28 days.",
  "sA £400 XMAS REWARD IS WAITING FOR YOU! Our computer has randomly picked you from our loyal mobile customers to receive a £400 reward. Just call 09066380611",
  "hJust trying to figure out when I'm suppose to see a couple different people this week. We said we'd get together but I didn't set dates",
  "sIMPORTANT MESSAGE. This is a final contact attempt. You have important messages waiting out our customer claims dept. Expires 13/4/04. Call 08717507382 NOW!",
  "hHi mom we might be back later than  &lt;#&gt; ",
  "sdating:i have had two of these. Only started after i sent a text to talk sport radio last week. Any connection do you think or coincidence?",
  "hLol, oh you got a friend for the dog ?",
  "hOk., is any problem to u frm him? Wats matter?",
  "hK I'll head out in a few mins, see you there",
  "hDo u konw waht is rael FRIENDSHIP Im gving yuo an exmpel: Jsut ese tihs msg.. Evrey splleing of tihs msg is wrnog.. Bt sitll yuo can raed it wihtuot ayn mitsake.. GOODNIGHT &amp; HAVE A NICE SLEEP..SWEET DREAMS..",
  "hI cant pick the phone right now. Pls send a message",
  "hI don't want you to leave. But i'm barely doing what i can to stay sane. fighting with you constantly isn't helping.",
  "sThe current leading bid is 151. To pause this auction send OUT. Customer Care: 08718726270",
  "sFree entry to the gr8prizes wkly comp 4 a chance to win the latest Nokia 8800, PSP or £250 cash every wk.TXT GREAT to 80878 http//www.gr8prizes.com 08715705022",
  "hSomebody set up a website where you can play hold em using eve online spacebucks",
  "hIts sunny in california. The weather's just cool",
  "sYou have 1 new message. Call 0207-083-6089",
  "hI can make it up there, squeezed  &lt;#&gt;  bucks out of my dad",
  "hGood day to You too.Pray for me.Remove the teeth as its painful maintaining other stuff.",
  "hHow are you babes. Hope your doing ok. I had a shit nights sleep. I fell asleep at 5.I’m knackered and i’m dreading work tonight. What are thou upto tonight. X",
  "hHow do friends help us in problems? They give the most stupid suggestion that Lands us into another problem and helps us forgt the previous problem",
  "hI'm at work. Please call",
  "hI will be gentle baby! Soon you will be taking all  &lt;#&gt;  inches deep inside your tight pussy...",
  "hNOT MUCH NO FIGHTS. IT WAS A GOOD NITE!!",
  "hOk.ok ok..then..whats ur todays plan",
  "hNt joking seriously i told",
  "hWatching ajith film ah?",
  "hOoooooh I forgot to tell u I can get on yoville on my phone",
  "hAll done, all handed in. Don't know if mega shop in asda counts as celebration but thats what i'm doing!",
  "hI dont know exactly could you ask chechi.",
  "hDunno lei shd b driving lor cos i go sch 1 hr oni.",
  "hAs in i want custom officer discount oh.",
  "hThat's necessarily respectful",
  "hHi. Hope you had a good day. Have a better night.",
  "hAnd he's apparently bffs with carly quick now",
  "hHARD BUT TRUE: How much you show &amp;  express your love to someone....that much it will hurt when they leave you or you get seperated...!鈥┾??〨ud evening...",
  "hBabes I think I got ur brolly I left it in English wil bring it in 2mrw 4 u luv Franxx",
  "hHi babe its me thanks for coming even though it didnt go that well!i just wanted my bed! Hope to see you soon love and kisses xxx",
  "hSo gd got free ice cream... I oso wan...",
  "hPls give her prometazine syrup. 5mls then  &lt;#&gt; mins later feed.",
  "hSo how many days since then?",
  "hDear are you angry i was busy dear",
  "hYup he msg me: is tat yijue? Then i tot it's my group mate cos we meeting today mah... I'm askin if ü leaving earlier or wat mah cos mayb ü haf to walk v far...",
  "h... Are you in the pub?",
  "hThere is a first time for everything :)",
  "hDaddy, shu shu is looking 4 u... U wan me 2 tell him u're not in singapore or wat?",
  "hI ask if u meeting da ge tmr nite...",
  "hGr8. So how do you handle the victoria island traffic. Plus when's the album due",
  "hNite nite pocay wocay luv u more than n e thing 4eva I promise ring u 2morrowxxxx",
  "hEast coast",
  "hYou should get more chicken broth if you want ramen unless there's some I don't know about",
  "hMy slave! I want you to take 2 or 3 pictures of yourself today in bright light on your cell phone! Bright light!",
  "hNope. I just forgot. Will show next week",
  "hSo how are you really. What are you up to. How's the masters. And so on.",
  "hI'm at bruce &amp; fowler now but I'm in my mom's car so I can't park (long story)",
  "hI dont know oh. Hopefully this month.",
  "hHi elaine, is today's meeting confirmed?",
  "hOk k..sry i knw 2 siva..tats y i askd..",
  "hSorry, I'll call later",
  "hU horrible gal... U knew dat i was going out wif him yest n u still come n ask me...",
  "hOtherwise had part time job na-tuition..",
  "hOh yeah! And my diet just flew out the window",
  "sSanta Calling! Would your little ones like a call from Santa Xmas eve? Call 09058094583 to book your time.",
  "hYou didnt complete your gist oh.",
  "hEr yeah, i will b there at 15:26, sorry! Just tell me which pub/cafe to sit in and come wen u can",
  "hIf you can make it any time tonight or whenever you can it's cool, just text me whenever you're around",
  "hIf I was I wasn't paying attention",
  "hThanx a lot 4 ur help!",
  "hYou're gonna have to be way more specific than that",
  "hJesus armand really is trying to tell everybody he can find",
  "hI'm wif him now buying tix lar...",
  "hMode men or have you left.",
  "hAm slow in using biola's fne",
  "h\"What are youdoing later? Sar xxx\"",
  "hHey i've booked the 2 lessons on sun liao...",
  "hThank you. do you generally date the brothas?",
  "hBy the way, make sure u get train to worc foregate street not shrub hill. Have fun night x",
  "hI thought i'd get him a watch, just cos thats the kind of thing u get4an18th. And he loves so much!",
  "sYou have won a guaranteed 32000 award or maybe even £1000 cash to claim ur award call free on 0800 ..... (18+). Its a legitimat efreefone number wat do u think???",
  "hGood morning. At the repair shop--the ONLY reason i'm up at this hour.",
  "hAnd that's fine, I got enough bud to last most of the night at least",
  "hI am back. Good journey! Let me know if you need any of the receipts. Shall i tell you like the pendent?",
  "hSo that takes away some money worries",
  "haight we can pick some up, you open before tonight?",
  "sLatest News! Police station toilet stolen, cops have nothing to go on!",
  "hSac needs to carry on:)",
  "hJust sing HU. I think its also important to find someone female that know the place well preferably a citizen that is also smart to help you navigate through. Even things like choosing a phone plan require guidance. When in doubt ask especially girls.",
  "hWhat???? Hello wats talks email address?",
  "hExcept theres a chick with huge boobs.",
  "hIm just wondering what your doing right now?",
  "hWishing you a beautiful day. Each moment revealing even more things to keep you smiling. Do enjoy it.",
  "s\"For the most sparkling shopping breaks from 45 per person; call 0121 2025050 or visit www.shortbreaks.org.uk\"",
  "hArun can u transfr me d amt",
  "hSorry, I'll call later",
  "hIf you hear a loud scream in about &lt;#&gt; minutes its cause my Gyno will be shoving things up me that don't belong :/",
  "sDecember only! Had your mobile 11mths+? You are entitled to update to the latest colour camera mobile for Free! Call The Mobile Update Co FREE on 08002986906",
  "hOk i thk i got it. Then u wan me 2 come now or wat?",
  "sTxt: CALL to No: 86888 & claim your reward of 3 hours talk time to use from your phone now! Subscribe6GBP/mnth inc 3hrs 16 stop?txtStop www.gamb.tv",
  "hU GOIN OUT 2NITE?",
  "hI will treasure every moment we spend together...",
  "hShall I bring us a bottle of wine to keep us amused? Only joking! I‘ll bring one anyway",
  "shttp//tms. widelive.com/index. wml?id=820554ad0a1705572711&first=true¡C C Ringtone¡",
  "sGet your garden ready for summer with a FREE selection of summer bulbs and seeds worth £33:50 only with The Scotsman this Saturday. To stop go2 notxt.co.uk",
  "sURGENT! Last weekend's draw shows that you have won £1000 cash or a Spanish holiday! CALL NOW 09050000332 to claim. T&C: RSTM, SW7 3SS. 150ppm",
  "hOk lor.",
  "hI thought slide is enough.",
  "hYup",
  "hWell obviously not because all the people in my cool college life went home ;_;",
  "hOk lor ü reaching then message me.",
  "hWhere's mummy's boy ? Is he being good or bad ? Is he being positive or negative ? Why is mummy being made to wait? Hmmmm?",
  "hDhoni have luck to win some big title.so we will win:)",
  "hYes princess! I want to please you every night. Your wish is my command...",
  "hWhat Today-sunday..sunday is holiday..so no work..",
  "hNo probably  &lt;#&gt; %.",
  "hReally do hope the work doesnt get stressful. Have a gr8 day.",
  "hHave you seen who's back at Holby?!",
  "hShall call now dear having food",
  "sURGENT We are trying to contact you Last weekends draw shows u have won a £1000 prize GUARANTEED Call 09064017295 Claim code K52 Valid 12hrs 150p pm",
  "hSo li hai... Me bored now da lecturer repeating last weeks stuff waste time... ",
  "h, ,  and  picking them up from various points | going 2 yeovil | and they will do the motor project 4 3 hours | and then u take them home. || 12 2 5.30 max. || Very easy",
  "hAlso fuck you and your family for going to rhode island or wherever the fuck and leaving me all alone the week I have a new bong &gt;:(",
  "hOfcourse I also upload some songs",
  "s2p per min to call Germany 08448350055 from your BT line. Just 2p per min. Check PlanetTalkInstant.com for info & T's & C's. Text stop to opt out",
  "hK. I will sent it again",
  "hOh thanks a lot..i already bought 2 eggs ..",
  "hK. I will sent it again",
  "hU studying in sch or going home? Anyway i'll b going 2 sch later.",
  "sMarvel Mobile Play the official Ultimate Spider-man game (£4.50) on ur mobile right now. Text SPIDER to 83338 for the game & we ll send u a FREE 8Ball wallpaper",
  "hI think if he rule tamilnadu..then its very tough for our people.",
  "hCool, we shall go and see, have to go to tip anyway. Are you at home, got something to drop in later? So lets go to town tonight! Maybe mum can take us in.",
  "hGood afternoon, my love ... How goes your day ? How did you sleep ? I hope your well, my boytoy ... I think of you ...",
  "hYes... I trust u to buy new stuff ASAP so I can try it out",
  "sSMS SERVICES. for your inclusive text credits, pls goto www.comuk.net login= 3qxj9 unsubscribe with STOP, no extra charge. help 08702840625.COMUK. 220-CM2 9AE",
  "hWhy did I wake up on my own &gt;:(",
  "hNow get step 2 outta the way. Congrats again.",
  "hLove has one law; Make happy the person you love. In the same way friendship has one law; Never make ur friend feel alone until you are alive.... Gud night",
  "sPRIVATE! Your 2003 Account Statement for 07808247860 shows 800 un-redeemed S. I. M. points. Call 08719899229 Identifier Code: 40411 Expires 06/11/04",
  "hApo all other are mokka players only",
  "hPerhaps * is much easy give your account identification, so i will tomorrow at UNI",
  "hWait . I will msg after  &lt;#&gt;  min.",
  "hWhat i told before i tell. Stupid hear after i wont tell anything to you. You dad called to my brother and spoken. Not with me.",
  "hGod's love has no limit. God's grace has no measure. God's power has no boundaries. May u have God's endless blessings always in ur life...!! Gud ni8",
  "hI want to be inside you every night...",
  "hMachan you go to gym tomorrow,  i wil come late goodnight.",
  "hLol they were mad at first but then they woke up and gave in.",
  "hI went to project centre",
  "hIt‘s reassuring, in this crazy world.",
  "hJust making dinner, you ?",
  "hYes. Please leave at  &lt;#&gt; . So that at  &lt;#&gt;  we can leave",
  "hOh... Okie lor...We go on sat... ",
  "hYou are a great role model. You are giving so much and i really wish each day for a miracle but God as a reason for everything and i must say i wish i knew why but i dont. I've looked up to you since i was young and i still do. Have a great day.",
  "hYa, i'm referin to mei's ex wat... No ah, waitin 4 u to treat, somebody shld b rich liao...So gd, den u dun have to work frm tmr onwards...",
  "hMiles and smiles r made frm same letters but do u know d difference..? smile on ur face keeps me happy even though I am miles away from u.. :-)keep smiling.. Good nyt",
  "hBy the way, i've put a skip right outside the front of the house so you can see which house it is. Just pull up before it.",
  "hCan you pls send me that company name. In saibaba colany",
  "hNo. I dont want to hear anything",
  "hYou are a big chic. Common. Declare",
  "hThats cool. I want to please you...",
  "hGoing to join tomorrow.",
  "sYou are awarded a SiPix Digital Camera! call 09061221061 from landline. Delivery within 28days. T Cs Box177. M221BP. 2yr warranty. 150ppm. 16 . p p£3.99",
  "hI want to tell you how bad I feel that basically the only times I text you lately are when I need drugs",
  "sPRIVATE! Your 2003 Account Statement for shows 800 un-redeemed S.I.M. points. Call 08718738001 Identifier Code: 49557 Expires 26/11/04",
  "hTotal disappointment, when I texted you was the craziest shit got :(",
  "hIts just the effect of irritation. Just ignore it",
  "hWhat about this one then.",
  "hI think that tantrum's finished so yeah I'll be by at some point",
  "hCompliments to you. Was away from the system. How your side.",
  "hhappened here while you were adventuring",
  "hHey chief, can you give me a bell when you get this. Need to talk to you about this royal visit on the 1st june. ",
  "hOk which your another number",
  "hI know you are thinkin malaria. But relax, children cant handle malaria. She would have been worse and its gastroenteritis. If she takes enough to replace her loss her temp will reduce. And if you give her malaria meds now she will just vomit. Its a self limiting illness she has which means in a few days it will completely stop",
  "hAiyah ok wat as long as got improve can already wat...",
  "sWant explicit SEX in 30 secs? Ring 02073162414 now! Costs 20p/min Gsex POBOX 2667 WC1N 3XX",
  "hI can't believe how attached I am to seeing you every day. I know you will do the best you can to get to me babe. I will go to teach my class at your midnight",
  "hJust sleeping..and surfing",
  "sASKED 3MOBILE IF 0870 CHATLINES INCLU IN FREE MINS. INDIA CUST SERVs SED YES. L8ER GOT MEGA BILL. 3 DONT GIV A SHIT. BAILIFF DUE IN DAYS. I O £250 3 WANT £800",
  "hYeah it's jus rite...",
  "hArmand says get your ass over to epsilon",
  "hU still havent got urself a jacket ah?",
  "hI'm taking derek &amp; taylor to walmart, if I'm not back by the time you're done just leave the mouse on my desk and I'll text you when priscilla's ready",
  "hHi its in durban are you still on this number",
  "hIc. There are a lotta childporn cars then.",
  "sHad your contract mobile 11 Mnths? Latest Motorola, Nokia etc. all FREE! Double Mins & Text on Orange tariffs. TEXT YES for callback, no to remove from records.",
  "hNo, I was trying it all weekend ;V",
  "hYou know, wot people wear. T shirts, jumpers, hat, belt, is all we know. We r at Cribbs",
  "hCool, what time you think you can get here?",
  "hWen did you get so spiritual and deep. That's great",
  "hHave a safe trip to Nigeria. Wish you happiness and very soon company to share moments with",
  "hHahaha..use your brain dear",
  "hWell keep in mind I've only got enough gas for one more round trip barring a sudden influx of cash",
  "hYeh. Indians was nice. Tho it did kane me off a bit he he. We shud go out 4 a drink sometime soon. Mite hav 2 go 2 da works 4 a laugh soon. Love Pete x x",
  "hYes i have. So that's why u texted. Pshew...missing you so much",
  "hNo. I meant the calculation is the same. That  &lt;#&gt; units at  &lt;#&gt; . This school is really expensive. Have you started practicing your accent. Because its important. And have you decided if you are doing 4years of dental school or if you'll just do the nmde exam.",
  "hSorry, I'll call later",
  "hif you aren't here in the next  &lt;#&gt;  hours imma flip my shit",
  "hAnything lor. Juz both of us lor.",
  "hGet me out of this dump heap. My mom decided to come to lowes. BORING.",
  "hOk lor... Sony ericsson salesman... I ask shuhui then she say quite gd 2 use so i considering...",
  "hArd 6 like dat lor.",
  "hWhy don't you wait 'til at least wednesday to see if you get your .",
  "hHuh y lei...",
  "sREMINDER FROM O2: To get 2.50 pounds free call credit and details of great offers pls reply 2 this text with your valid name, house no and postcode",
  "sThis is the 2nd time we have tried 2 contact u. U have won the £750 Pound prize. 2 claim is easy, call 087187272008 NOW1! Only 10p per minute. BT-national-rate.",
  "hWill ü b going to esplanade fr home?",
  "hPity, * was in mood for that. So...any other suggestions?",
  "hThe guy did some bitching but I acted like i'd be interested in buying something else next week and he gave it to us for free",
  "hRofl. Its true to its name",
]);

return { SOURCE, MESSAGES };
})();

var nslkdd$ = (function () {
'use strict';

// src/pages/statistics/hw7/nslkdd.js
// Il test set di NSL-KDD (KDDTest+), ridotto alle colonne che l'homework
// usa: protocollo, servizio, flag ed etichetta (gli stessi record, con la
// stessa codifica, dell'Homework #6) e i byte inviati dalla sorgente di ogni
// connessione (src_bytes). Generato una volta dal file originale (22.544
// righe di 43 campi, SHA-256
// fa46b0935342616aa83b7c2578db355b6a7aaabbc492248172c7a1e8b7ab8f84, uguale
// su due copie pubbliche indipendenti); nient'altro del file e' cambiato.
//
// Licenza, dalla pagina del dataset (Canadian Institute for Cybersecurity,
// University of New Brunswick, https://www.unb.ca/cic/datasets/nsl.html):
// "You may redistribute, republish, and mirror the ISCX NSL-KDD dataset in
// any form. However, any use or redistribution of the data must include a
// citation to the NSL-KDD dataset and the paper referenced below."
// La citazione e' in SOURCE, e la pagina e il programma la mostrano.

/** Where the data come from, as the page and the program cite them. */
const SOURCE = Object.freeze({
  dataset: 'NSL-KDD, test set KDDTest+ (Canadian Institute for Cybersecurity, University of New Brunswick)',
  url: 'https://www.unb.ca/cic/datasets/nsl.html',
  paper: 'M. Tavallaee, E. Bagheri, W. Lu, A. Ghorbani, "A Detailed Analysis of the KDD CUP 99 Data Set", Second IEEE Symposium on Computational Intelligence for Security and Defense Applications (CISDA), 2009',
  paperUrl: 'https://ieeexplore.ieee.org/document/5356528',
  file: 'KDDTest+.txt',
  sha256: 'fa46b0935342616aa83b7c2578db355b6a7aaabbc492248172c7a1e8b7ab8f84',
  records: 22544,
});

// The values of every column, the most frequent first (as in Homework #6): a record stores their positions.
const PROTOCOLS = Object.freeze(['tcp', 'udp', 'icmp']);
const SERVICES = Object.freeze(['http', 'private', 'telnet', 'pop_3', 'smtp', 'domain_u', 'ftp_data', 'other', 'ecr_i', 'ftp', 'imap4', 'eco_i', 'sunrpc', 'finger', 'auth', 'domain', 'uucp', 'iso_tsap', 'bgp', 'uucp_path', 'Z39_50', 'vmnet', 'nnsp', 'ctf', 'link', 'courier', 'whois', 'echo', 'name', 'http_443', 'netbios_ns', 'time', 'csnet_ns', 'gopher', 'efs', 'mtp', 'systat', 'login', 'daytime', 'exec', 'supdup', 'discard', 'netstat', 'ssh', 'netbios_dgm', 'kshell', 'hostnames', 'urp_i', 'klogin', 'nntp', 'ldap', 'sql_net', 'pm_dump', 'shell', 'X11', 'netbios_ssn', 'remote_job', 'IRC', 'pop_2', 'printer', 'ntp_u', 'rje', 'tim_i', 'tftp_u']);
const FLAGS = Object.freeze(['SF', 'REJ', 'S0', 'RSTO', 'RSTR', 'S3', 'SH', 'S1', 'S2', 'OTH', 'RSTOS0']);
const LABELS = Object.freeze(['normal', 'neptune', 'guess_passwd', 'mscan', 'warezmaster', 'apache2', 'satan', 'processtable', 'smurf', 'back', 'snmpguess', 'saint', 'mailbomb', 'snmpgetattack', 'portsweep', 'ipsweep', 'httptunnel', 'nmap', 'pod', 'buffer_overflow', 'multihop', 'named', 'ps', 'sendmail', 'rootkit', 'xterm', 'teardrop', 'xlock', 'land', 'xsnoop', 'ftp_write', 'loadmodule', 'perl', 'phf', 'sqlattack', 'udpstorm', 'worm', 'imap']);

/**
 * The records, four characters each (base 64: A = 0, ..., / = 63): the
 * positions of the protocol, the service, the flag and the label, in the
 * order of the file.
 */
const RECORDS = Object.freeze([
  'ABBBABBBAGAACLALACDDAAAAAEAAACACAAAAAJACACADAEAAABBBACCBACAAAAAAAAAAAAAABBAAABBBAyBBADCDAAAAAAAA',
  'AZBBApDBAAAAAAAACIAIBBAAAAEFAEAAAAAABBAAABBGAKDDAAAAAJATBFAAAGAAABCBAAAAAAAAAAAAAjBBAAAAAkCBAAAJ',
  'ACCDBBAAAAAAAAAAARBBABBBAJAEAAAAAKBBBBANACAHAAAAADACAGAEAAAAAAAAAHBGAAAAACBDABBBAECBAAAAABBBAEAA',
  'AAAAAAAAAgBBAAAAAAAAACAHAAAAAAAAABBBABBBCIASAAAAAAAAAAAAANDBADDDAAAAAGAAAAAAAAAAABBBAHBQADACAEAA',
  'AAAABFAAABGRAQDBAHCGAJACABBBABBBAEAAABBBACAWAAAAABBBAAAAAAAAABBBACAHACAHAAAAABCBAAAACIAIAaBBBBAK',
  'AAAACIAIABGRABBBANAABFAAACACABBBAAAABFAABFAAAAAAACFHAAAAACAHAAAAABBBBBAKAKDDAAAAAAAABFAAABBBABBB',
  'AAEFCLAPACCDABBBAAAAACAHACDCABCBCIASAEAMAAAAABBBACAHAjBBAeCBABCBABBBAkCBAHBGABDBAJAEAKCBABCBAJAE',
  'AAAAABCBACAHAAAAABBBABBBAAEFAAAAABBGAHBLACACAEAACIAIBFAAAAAAAAAABFAAADACABBBAYBBBFAAABBBAAAAACAH',
  'ANDBAEAAAAAABFAAAJAAAJACAUBBBBANACDDAAAAAACFAAAAAAAAAHBGAaBBACFHAAAAAAAAAAEFAGAEAAAAAAAABBAACIAI',
  'AAAABFAAAAAABBAKAAAAAAAABBAAABBBAAAAAAAJAAAAABCBBFAAAAAABBAAAMBDAGAEAAAAAOBBCIASAACFBBAAAAEFACAD',
  'AEAABFAAAACFABBBABCBAAAAAJAEABCBAsCBAAAAAEAAAEAAADACAAAAABCBAHBGACCDAAAAAJAEAAAAAAAAAGAEAAAAABBB',
  'ACDBABCBAJACBFAAAAAACLAPATBBAAAAABCBABEOABBBBBAAACBDAAAAABDBABBBBBAAAGAEAGAEAKCDANCBAAAAAJAEABBB',
  'AAAAACFHAAAAAHBQADDDAAAAAAAABBAAAMBDAAAAAVBBAAAAABBBAAIJBBAAADACBBAAAAAAAHBGAJAEABBBAPCBAHBGAAAA',
  'BBAAAAAAAGAAABBBADACAAAAABBBAAAAAAAAAEAAAAAAABBBAAAAAGAECIAIACACAKDDABBBAABBABHAABBBBFAAAeBBAAAA',
  'AAAABBAAABBBABBOADBDAACFAAAABFAAAAAJBBAGACADAHBGACAHBFAAAjCBABBBADACAAAAAAAAADACAAAABFAABBAAAcBB',
  'AAAAAAAAABBBAAAAAAAAAEAABBAAABBGAAAABBAKBFAAABBBAAAJBBAAAAAAABBBACACADACABBBAAAAAAAAACAHABCBACFH',
  'ACAABFAAABBBAEAAAGAAAJAAACAHAAAAABBBAHBLAAAAAAAACIAIAAAAAAAABBAAABCBAAAAADACAABBAAAAA6BBAAAABBAN',
  'ACAHABCBAAAAACCBBBAAAHBLAAAAAAAAAAAJAUBBAEAMAEAAAdCBAAAAAAAAABBBAAAAAGAAADDDAHEAABBBBHAUANDBAAAA',
  'AEAMBBAAADCDAAAAAAAAAHCGCLAAADACAAAAAAAAAAAAAAAACIAIAAAAAEAAAAAABBANAUCBACACAAEFABBBBBAABFAAAAAA',
  'AHBGABGRAMBDACAHAAAAAKCBAAAAAAAAABBBAHBGAAAAAAAAAAAABBAAABBBAHBQADACAAAJAAAAAAAAABEABBAAACAHAAAA',
  'AAAAAGAEACADAAAAABCBBBAGACAHAAAAAAEJBFAAAAAAAAAAAMDBADCDApDBBHAACLALBFAAAZCBBFAACvAAABCBACAHAKBB',
  'AAAJCIAIAAAAACACABBBBBANAAAAAAAAACADBBAKCIAICIAICLAPAAEFAAAAABBBAcBBAGAAAAAAAOAAAGAEBHAGABCBAAAA',
  'ADACAEAAABEOAEAMAACFAGAAAJAEABBBAAAAAAAABFAAAAAAAAAAAJDBAAAAAAAAAAAAADACAEAAABBBBBAGAAAAAAAAABBB',
  'AAEFAAAAAAAABBAAAAAAABBBAAAAAGAAAAAAAAAAAlCBCIAIADDDABCBAAAABFAACIAIBBAAAAAAAAAAAAHAAAAABBANAAAA',
  'CIAIAAAAAAAAAAAACIAIAAAAAAEFATBBAGAEAAAAACACAJACABBBBBAKCIAIAHBQAAAAAAEFBBAABFAAAEAAABCBACAAABBO',
  'AEAMABCBAAAAAACFABBBAAAAACCBAAAABBANCIAIABBBABBBADACABCBAEAAABGRAAAJAAAAAAAJAAAAABBBAAAAAGAEAhBB',
  'ACFHACACBFAAABBBAABBACAHABBBACACAAAAAAEFAAAAABCBACACAnDBAAAAABBBBBAACLALADACAACFAHBGBBAAABCBCLAP',
  'AAAAAAAAAYBBAMBDAAAAAEAAAAAAAAAAAKADAJAEAAAAAAAAAAAAADACAJACAAAAAAAAAJAAABDBABCBAAAAAAAAADACBHAG',
  'AGAABBAAAEAAAAAABBAAACAHAAAAACAHBFAAAAAAABCBCIAICIASBBAKAAEFACDBAAAAAHBGAAAACIAIAAAAAAAAAAAAADAC',
  'ABCBANAAAlDBBFAAAKCDAGAEABBBBHAAAAAAAEAAABCBAAAAATBBAHBGAAAAAAAAAHBGABBBABCBBHAGBFAAAECBABBOAAAA',
  'BBAABBAABBAAAAAACIASCIAICLAPADCDAGAAAAAAAAAACIAIBBANAAAAAGAAAHBLBFAACLAAAGAVATBBAEAAAEAMAAAJAAAA',
  'AAAAAEAAAAAAAAAAACACAAAAAZBBCIAIACBDBBAAACDDAAAABFAAAJAEAAEJAAAAAAAAAGAEBFAAABBBAEAAACAHABBBBFAA',
  'AAAABBAGABCBBFAAAGAEAACFAGAAAAAAAAAAABBBABBBBFAAAEAAABBBABCBAAAAAAAAAAAAAAAAAAEFAAAACIAIAHBGAEAA',
  'AGAEAEAAAAAAAAAAADACAAAAAAEFABBLAAAAABBBAAAAABBBAAAAACAHAGAAAAAAACAHABBBACFHCLAAACAHAAAAAGAEAMBD',
  'AAAAAAAAAAAAAAAAAnDBABBBAAAAAGAAAAAAABBBAAAAAAAAABCBABBBAAAAAEAABBANAEAAAAAAACFHAGAEBBAABFAAAJAE',
  'ABBBAAAAAAAAABBBACFHAAEFAAAAAAAAAJAEAAAABFAAAAEFBFAAACACAUBBARBBAEAMABBBACCBAHCGAJAEABBBAAAJABBB',
  'BBAAAAEFAEAAAAAAAMBDBBAAACAHAAAAABBBAAAAABBBBFAAADACAAEFAgBBABCBAAAAAKDDABCBAGAAAAAAAAAAABCBAOBB',
  'ABBBAGAEBBAAAACFAAAAAHBGACAHACFHABBBABBBAAAAAAAACLALABBBAAAACLAPAEAXAEAAAGAAABBBAJAEABBBAAAAABBB',
  'AAAAAAAAABBBAAAABBANAHBGAAAAABBBBBAGAHAAABBBBBAKAAAAACATBBAGADACAJACAAAABHANAAAABFAABFAAAAAAAAAA',
  'AAEFCIAIAAAABBAKCLALAAEFBBAAAfDBABCBBBANAAAAAAAAAyBBACAHABCBCIAIBFAABBAABFAAAPCBAAAABBAAAAEFCIAI',
  'ABCBAAAAAAAAACACAAAAABBBCIAIACATABGRAAAAAGAAABBBBBAGCIAIAgBBA4BBAAAAAAAAAAAACIAIABBBABBBACFHAMBD',
  'AAAAAGAEAGAAABBBAAAAABBBACACAAAACIAIAEAAAAAJACAHABBBAHCGCIAIAHBLAAAAAAAABFAAABGRAAAJABBBBFAAABCB',
  'AOBBACIHBFAAACBDArBBAtBBABBBAAAJCIAIBBAABFAAAAAAAKDDCIAIBBAKAAAAAAAAAAAAAJAECIAIABBBBBAAAAAABFAA',
  'AAAAAAAAADDDABGRAGAAAAAAAAAAACFHCIAIAAAAAAEFAAAAABBBABCBACCBAEAMBHAGABBBAAAJAAAAAAAAAAAABFAABFAA',
  'AAAAArCBACACCIAICLAPAKDDADACAAAAAOAXABCBAcCBAEAMABBBBBAAAAAAABBBABBBAAAABBAGAHBQBFAAAGAAADCDAAEF',
  'AAAAAAAAAAAACIAIBFAAAAAAABBBAAAAAAAAAJAEAGAABBAAAAAAAAAAAAAAAGAEAAAAAACFAMBDAJAEABBBABCBBFAAAAAA',
  'AAAAAAAAAEAMAACFAAEFAJAEBBANBBAAABCBABBBAEAABBAAABCBABCBBHAAAHAAAEAMAAEFAMBDAAAAAAAAAAAABBAGABCB',
  'BBAAAGAACIAIABGRABBBANAAAEAAAAAAAGAEBBALACAHABBBAGAEAMBDBFAABBAGABBBAKADCLAPAAAACIAIABBOACAHAEAM',
  'AACFANDBAAAAABBBAAAJAAAAAAAAAACFATCBAzBBAAAAAAAABBAAAEAAAGCBACAHCIAIBBAGAAAAAJCBAAAAAAAAAGAABBAN',
  'ACFHAVBBATBBAAAAAAAAABBBAJAEBBAAABBBAAEJAAAAAAAABBAAAAAAA1DBAJAEAJAEAEAAAAAACIAIADACAAAAAGBBBBAA',
  'AAAAABBBACCBABCBABBBAAAAAHBQAJAEAAAAABBBABCBAGAAAAAJAEAMABGRABBBBBAAAAAAAHAQADACANAAAAAAAAEJABBB',
  'ADDDCIAIBBAAADACAKBDAAAAADACAAAAAQDBABCBAAAAAAAAAGAAABBBAAAAAAEFAHBQABBOAEAABFAAAHBGCIAIAgBBABBB',
  'AEAAADBDAAAAAhBBAAAAAGAAAAAAAAAAAHAQAAAAACAHADACAAAABBAACLALAAAAAEAMAKCDAuBBAAAAAAAAABBBABBBBBAK',
  'AHCBABBBADACCIASAAAAAAAAAlDBAAAACIAIAAAAAbCBAACBAAAAADACAJAEAHCGABBBABCBADDDACAHAAAAANCBAGAEAMBD',
  'ABBBACAHBBANADBDBHAGAKDDABBOBBAKBFAAAAAAAAAABFAAAAAAAEAAAAEFAAAAABBBABBLCIAIABCBAAEFBBAAACAAAGAA',
  'ABBBBBAGBHAAAHBGAAAAACFHAKBBAlDBBBAAAAAAABBBAAAFABBBAHBQAmDBAAAAAGAAABBBAAAAAAAAAHBGAEAACIAIAAAA',
  'AGAAAAAAAACFABCBBFAAAAAABBAKAUBBADACAAAAAKDDBBAAAAAAABCBAAAAAGAEADACAAAABBAGAaBBAEAMBBAKAAAAAGBB',
  'CLAPABBBCLAAABBBANDBBBAGAAAAADACABBBABBBBHAGCIAIACFHAAAAADACBBAKAAAAAGAAADACACAAAAAAAAAABBAKAAAA',
  'AJAEAAAAAKCDACAHAAAABBAABFAAADACACAHAAAABFAAABCBAHBQAGAACLAPBBANACFHAAAAAAAAAAAAAEAMA0ADACCDAAAA',
  'AACFABBBBBAKABBBBFAAAAAAAAAABBAGAGAAADDDABBBAAAJAAAAApCBAJAEAAAAAECBAAAABBAAACAHADACAVCBABBBAAAA',
  'ABBBAJAEABCBAGAEAAAABFAAAAAACLAPABBBBFAAAAAAAAAAAAAAAEAMAfDBAJAEAAAAACADAjBBATBBAAAAAHKGAEAAAAAA',
  'ABBBBBAAACFHAGAACLALAEAAABBBAAAABBAAAAEFCIAIAJAEBBAAAAAAABCBADACAAAAA4BBAHBGAAAABBAAAAAACIAIAAAA',
  'AAAAAAAAAAAACIAIAAAAAEAABHAGAAAAAAAABBANAAAAAEAAABCBBBAAAAAAABCBAJAEABDBAABBAAAAAAAAAAAJAAAAAAAA',
  'AJAEABBBAZBBAAAACvAAAAAAAAAAADACAAAAAKCDAJACAAAAAAAAAAAABBAACIAIAEAAACBDAJAAAAEFAAAAAAAAAOBBAAAA',
  'ANAAAAAAAEAMAAAAAAAAADACAAAAAAAAACAHAAAAA5EAAeBBAAAAACFHAAAAAAAAAHBLADACAAAAAAAAAMCBAKBDAAAAADAC',
  'AKADAqBBAAAAAaBBAXBBAlDBAJAECIAIBFAAAAAABFAAACDBAAAAABBBAAAAABBBAAAAADBDAEAMAAAABBAACIAIABBBAJAE',
  'ABBBAcBBABBBAAAACIAIAGAAABBBABCBARCBABBBAEAMAAAAAdBOAAAAABCBAAAAADACAAAAAAAABFAAAABBAAAAAAAAACFH',
  'ACFHADDDACDDACAHAAAAABGRCIAIAAAAACAHAGAEADACACACAAAAAxCBBBAABFAAADACAAAABBAAAsCBAAAAAAAABBAKABCB',
  'AAAAACACADACBFAAACADAAAAAAAAAHCLANAAAAAAACACAAAAABBBAEAAAAAAACBDAAAABBANAAAAAmCBAAAAAEAMAAAAAMBD',
  'AAAAADBDBBAGAAAAADACAAAAAJAEABBBAACBAEAMAAAAAGAAAAAAABBBAJAABFAAAAAAAAAAAGAEACDDAAAAAAAAAHBGAAAA',
  'AAAAAAAAAZBBAAAAAAAAABBBCIAIABCBABBBAAAAAEAAAAAAAAAAAJAEAGAAAAAAABCBAAAAACBDA3CBC+ASAJAEAAAAAEAM',
  'AEAAABCBABBBBFAABFAAACDDAAAAAEAABBAAAAAAAAAABFAABFAAAaBBAAAAACACBBAGAAAABBANAOAAAHBGAAEFBBAKCIAI',
  'AEAAABBBBBAAAAAAAAEFABBBABBBACACAAAAAfDBBFAABBAACIAIAAAAADACABCBABBBAAAAAAAAAAEFAAAACIAICLAPABBB',
  'AAAAAAAABBAGATBBAEAMAAAACIAIABCBAHBGCvAABBAKAHBGAAAAACCBAAAAAHAAADACAAAAAAAAAAAAAAAAAEAMACFHAnDB',
  'AEAXAHEAAAAAAJACABBBCLAPAAAAAACFABBBABBBAEAABBAAAGAAAAAAABBBACAHCLALAAAAAMBDAEAAACAHABBLAEAAAAAA',
  'AGAAAAAAACACABBBAAAAAAAAAoBBABCBABBBABCBABBBAAAACIAIBFAAAhCBAAAAAAAAAZCBAAAAAAAABHAGAAAAAAAAAMBD',
  'BBANAzCBAAEJAAAAAAEJAAAAAAAAAcBBAEDOAAAAABEOAAAAABBBAAAAAAAAADACAEAMAAAAAJAECIAIABEOAAAAABCBABBB',
  'A3BBAAAABBAKAHBGABCBABCBCIAIACFHABCBADACAAAAAAAAAAAAADACAAAAACCBADDDBBAKAAAAADACAAAAAAAAAAAAABBB',
  'BBAAAACFBBAKAHBLBBAKAGAEABCBAAAAABCBABCBAAAAAJAECLALBHANABBBAJAEAEAMAEAABFAAAAAAAAAAABBBAYCBBBAA',
  'AAAAAAAAAMBDBBAAAHBGACCDAJAEADACABBBABCBAAAJAAEFABBBAAEFCIAIABBBABBBABBBAHBQAAAAAHBGAAAAAAAAAAAA',
  'AAAAAGAEADACAAAAAAAAAHBLABCBAACFABBBBBAAAAAAAAAAAACFBBAGBBAGADDDACAAAAAAABBBAAAAAHBLCIAICIAIAAAJ',
  'BFAAABBBCIAAAuBBABBBAAAAAHBLAEAMAAAAAJAEAACFAAEFADBDAAAAAGAEABCBAEAMAJAEABCBAAAAANAABBAGAAAAAAAA',
  'AAAACIAIAAAJAAAAABCBAEAAAAEFABBBABBBBFAAAAAAABBBAOAAABBBABBBAEAAAqCBAHBLABCBBFAAAKDDAAAABBAAADAC',
  'BFAAAGAAAAAAAHBQACCBBBAGAAAAAJAEADACAHBQAAEJABBBAAAAABBBAAAAAACFABBBAMBDAAAAAGAEACAHAAAAAdBBAAAA',
  'ABBBAJAEAAAAAAEFCIAIAAAJAHBGAGAEBBAACvAAAEAMABCBAEAMANCBAAAABBAKADADABEOAAAAACFHACAfAAAAAAAAASCB',
  'AAAABBAKABBBBBAKACAHAAAAAYBBAJACAAAAAAAAAAAABFAACIAAACDDAAAAANAAADACAGBBBBAAAAAAAEAAAHBGAAAAAJAC',
  'AGAEAAAAAACFACBDBBAAABBBAAAAAfDBAAAAAAAABFAABBAAAAAAAAAAAAAACIAIBFAAAAAABFAAAAAAAAAAAWCBABBBAHBG',
  'ABCBAEAAAAAAABBBAAAABBAABBAAABBBAEAABHAGAGBBAAAAABBBACAHAAAAAUBBAhCBAAAAAHBQAACFADACAKDDABBBArCB',
  'AAAAAAAAAhBBAGAEAAAAAAAACIAIBBAAABBOAAAAAACFAAAAAAAAAQCBAHBGADBDBFAAABBBACDDAMBDADACABEOAGCBBFAA',
  'BBAAAOBBCIAIAVBBAAAAACDCAAAAAGAEAAAAADACBBAKABBBADDBAUBBAAAAABCBAKCDAJAWAAAAAAAAABBBAJAEAAAAABBB',
  'ABCBAHBGAEAMAGAABBAAAAAAAEAABHAGAhBBADACACACAKDDAAAAABBBAEAMBBAAABBBACAHAAAAABBBADBDAAAAABBGCIAI',
  'CLAPCIAIBFAAAAAAAAAAAHBGAAAAAAAABFAACIAIAEAAAAAAAAAAAAAAABBBAAAAAKDDABBBCIAIAAAAAAAAAAAAACDDAaCB',
  'AJAEBHAGABBBABDBADACAAAAAHBQAdBBABBBAqBBAkCBAAAAABDBAAAAAJACABBBABBBAEAACIAIAABAAAAACIAIABDBCIAI',
  'AJACABBBAAAAABCBBBAKAAAAAyBBBBAGAACFADDDAAAAABBBBFAAAACFACFHACFHCIAIABBBACACABBBABBBACAHAEAMAJDB',
  'AAAAACAHABBBAAAJBHAAAAAAACFHAEAAAAAAAAAJAKCDBBAABBAAAAAAACDDAAAAAAAABBAAABCGCLALAAAAAAEFAJAAAAAA',
  'ACCBAAAAAAAACIAIBBAAAAAACIAIAAAACIAIAAAAADACADDDACADCIAAAAAABFAAABBBAAAAAACBACCDCvAUAAAACLALAGAE',
  'AAAAAAEJAAAAAACFAGAAACACAEDBBFAAAAAABBAAArBBBBAABFAAAAAAAAAAABCBAAAAANDBAAAAAAAAACADAAAAA9BBAGAE',
  'AJAEAEAAABGRACAHAMBDAAEFAGAEBBAAAAAJAAAAAAAAAyBBAAEFAXBBAAAAACAHAAAAAuBBABEOBFAAACFHABCBAJDBCIAI',
  'ACACAZBBAAEFA7DBBBAAACBDACFHAGAEAEAMAAAAABBBAJAEAAAACLAAAAAAACAHAAAAAAAAAJAAAAAAADACAeBBACAHBBAA',
  'ABBBBBAKAEAAAAAAAAAAAAAAAACBAAEFAHBGABBBAAAAAGAAACFCABBBCIAIADACAAAAAGAECIAIAAAAABCBBFAAAVCBACFH',
  'ACAHA7DBAAAAAAAAAAAAABBBAAAAABBBAEAAAAAAAAAAAHCLAAFFABDBADACAAAAACAHABBBAAAAAHBQAAAAACAZAAAAAAAA',
  'ACATABCBAAAAAAAAAAAJAJACABBBANCBABBBAAHJAJACAACFACAHABBBACACAGAAAHBLBFAAAAAAAHBGAKBDAHDBAAAAAAAA',
  'AHBGAAAACIAIAEAAABCBAAAAAAAAABBBACFHAAAAABBBABBBAAAAACADABBBAAAAA4BBABBBAABAAAAABBAKAAAAAAAAAKBD',
  'AABBAJAEAAAAAAAAAGAEAAAAAAAAAPBBBBAAAAEFAACFAAAAAAAAAJAEABBBAAAABBAABBAAAAAAAAAAAAAABBALABCBABBB',
  'BBANAAAAACAHAAAAAAAAAAAAACBDABCBAAAAAAAAAGAEAKBDBFAAADACAAAAACAHAeBBAAAAAMBDAAAJABBBBBAACIAABFAA',
  'ABBLA3BBACACAAAAAHBLADACABBBANCBCIAICIAIAHCLAHBGAAAJAHBGAKDDABGRApDBBFAAAAAAAGAABBAKACAHCLALAGAA',
  'AAAABFAAAAAAABBBAAAAACACABBBAGAEACAHAAAAAEAAAAAABFAAAGAAAEAAAAAJACHDAAAAAAAAAAAAAEAAAMBDACBDBBAA',
  'AAAAAHBQAHBGAAAAAAAAADDDAJAEBFAABFAAAAAAANDBAAAAAAEFAAAAACACACACAAAAAAAAAHCGBBAAAAAAAAAAAAAAAEAM',
  'CIAIAAAAACACACAHAKCDAQGRAAAAAAAAAdBBACDAAACFAAAAAAAAABBBAAAAABBBAAAAAAAAABCBAAAAABCBABBBAhBBAAAA',
  'AAAAABBBADACACAHABBBAAAAAGAEAHBQAAAAACBDACBDAAAAABCBAfDBAAAAAEAAAAAAAGAAAEAAAAAABFAAAHCGAAAAAHBG',
  'ACFHAAAAAAAAAAEFBFAAAAAAAAAAAKCBBHAGAAAAAmDBADACCvAAAAAAAAAAABBBAAAAAJACCIAIAAAAAAAAAGAEAAAAAAAA',
  'AAAAAAAABBAAABCBAJAEABBBADACAAAAAKCDAEAAADACCIAIABBBAAAAAGAEACAHADACABBBBFAAAKDDAJAEAAAAAAAAABCB',
  'BBAAAAAAAjCBAAAAABEOBFAAAAAAAHBQADDDAAAAADACAAAAAAEFAAAABHAAAAEFAAAAAAAAAiBBAAAAABBBCIAIAcBBAAAA',
  'AVBBAGAWCIASAAAAAAAAAEAAAAAAAAAAAAAAABBBABBBCIAICLAPCIAICLALCIAIAJAEABCBAAAAAAEFAAAJABBBAbDBADAC',
  'ADACACACAEAMAHBGABCBAAAJBBAAABCBACCBACAZACAHAJAEBFAAAAAAAbDBABBBAAAACIAIAKCDAAAAACAHAAAAAJAAAJAE',
  'ABBGBBAAAAAAAAAAAJAEAOBBABBBABCBAAAABFAAAAAAAGCBAAAABBAKAAAABBAAAAAAAKDDACAHAAAAAACFBFAAADAAAGAE',
  'ABBBABBBABCBAAAAAAAACIAIAAAAA2HAAAAAAAAAADACCLALABCBA1DBABCBAEAAABCBAEAMAAAAADACAEAMABBBACDDAAAA',
  'AAAAABCBAEAAADCDAYBBAAAAAAAACIAIAAAABBAABBAAABCBBFAAABBBAAEFABCBAAAAACCDCIAIBBAGAAEFAVBBAAAAAAAJ',
  'ABBBAAAAACCBAMBDBBAKAACBAAAJA5EAADDDAGAEAJAEApDBAHBGABBBCIAIAcCBABCBAAEFAAAAAAAAAAAAACACAHBGANAA',
  'AAAAAAAAAAAAAAAAAGAAAKCDAHBGBBAAAAAABBAAABCBAAAABBAAAAAAACAHAABBABCBAAAAAGAEAAAAAdBBAAAAAGAAAJAE',
  'CIAPAZBBBBAGAAAAAAAAAAAABBAGAOCBAAAAABCBBFAAAAAAAAAAAjBBABBBAGAEAAAJBBANAGAEAAAAAGAAAAAAABBBAAAA',
  'AAEFADACAAAAACACAAAAADECAAEFAAAAAGAAABCBAAAAAAAAABBBAiBBAAAAAAAABBAAAAAAABBBBFAAAAAAAeBBAGAEAJAE',
  'ABBBABCBATBBAGAAAGAEBBANACACACAHAACFBBAABBAAAAAAAAAAAAAAAAEFBBAAAAAAACAHAAAAACAHBBAKACDDADACAQBL',
  'AAAJACAHAAAJAAAAATBBAMBDAAAAAAAABBAAAAAAAAAAAAAAAAAAABCBAQDBCIAAAAAACIASADACADACABBBAHBGAAAABFAA',
  'ADACAAAAABCBAAAAAAAAABBBAAAACIAIABBBABCBABBBAAAABFAAAGAAAAAAAAAAABBBAAAAAAAAAAAAAAAAAAEFACACAAAA',
  'AAAABBAGACFHAkBBAAAAAGAEAAAAAaCBAAAAABBBAKDDADACAXBBAAEFABBBAEAMADDDBBAAAEAAAAAAAEAAACACABBBACAC',
  'AAAAAAAAABBBABCGADACAAAAAAAAAJAAABBBASBBAEAAAGAEADDDACACAECBAMBDAJAEABCBAEAAAJAEACAAAAAAAAAAAEAM',
  'ADACBHAGAMBDAAAABFAAAAAAAHBGAAEFABGRAAAAADACAAAAAAEFABCBAAAAAAAAAAAAAAAACIAIAJAEAUCBCIAIAGAAAAEF',
  'ACBDCvAKAHEAAAAAAKDDAEAMABCBAAAACIAIAEAAABBBAAAAABCBAZBBAAAAAHBQAAAAADACAAAAAJAEAHBQACAHABCBABBB',
  'AEAMAEAAAAAAABCBAAAABFAAA3CBABCBAAAACIAIAAAAAAAABBAAAEAMAAAAACAkAAAAADACAJAEAAAAAAAACIAIARBBACDB',
  'ACAHCIAIARBBADACAAAABBAAAAAAAAAAABCBAJAEAAAAADDDADADAEAAAAAAACAHBBANABBBABBBAJAEAHBLABCBABCBBBAa',
  'AAAAAAAAAAAAADACACDCABBBAJAEAAAAAAAAABBGANCBABBBABBGBBAKAAAAAGAEAzCBAAAAAAAAAGAAATBBABBBABCBAAAA',
  'AAAAAAAAAAAAABBBABBBAAAAAAAAAACFBBAAAAAAAGAAACCBAAAJACDDABBBACACAAAAAAAAAEAAANAAAEAAAGAWAAAAAQDB',
  'CIAIAAAJBBAKAAEFABBBAAAAAGAAAAAJCIAIBBAAACADAAAABBANADBDAEAAAHBLAAAAACAHAAAAAAAAAAAAAAAAABCBAZCB',
  'ABCBAGATABBBAAAAACACAAAAABCBAJAEAEAMACACAAAAADACADACAeBBAQDBAJDBBBAGAAAAAGCBAAAABFAABFAAAAAAAKDD',
  'AAAAADACAAAAACAHAAAABFAAAAEFBBAAADACAEAAAAAJAAAABBAKAAAAABBBAAAAABBBACFHABBBAAAAAAAAAaBBAAAAAAAA',
  'AAAAAGAEACCBABBBADACABBBABDBADCDAEAAAAAAAAEFABBBBBAKAJAEBHAGAWEOAAAAAAAAABBBCLALBBAKAACFBFAAAAAA',
  'AYCBAKBDAAAAAHBGADACAAAAAAAJBBAGAAAABBAKAJAEAAAAAAEJAACFADACAAAAADDDAHBQAJAAAAAAAqBBABCBAAAAAAAA',
  'AhBBAMBDABCBA4CGBBAABBAAACACADACBBAAAAAAAABABFAAACAHCIAIAAAAABCBAAAAABBBABCBAJCBAAAABHAGAGAEAAAA',
  'AACFAAAAADDDAAAAAAAAADACABBBAACFAAEFAAAAAAAAANALAJDBABBBABBBABBBAAAAAEAAAZBBAAAAABBOAAAAAAEFBBAA',
  'AaBBACFHABBBBBAAAAAAAEAMAAAAACDDAAAAAHBGAAEFACCDABBBAAAAAEAAAAAAADACAGAAAACFAJAEAAAACIAIAAAAAHBG',
  'AACFAAAABFAAACBDCLAPAAAAACDDAAEFAAAAABCBAJACBBAKABBOACFHAACFBFAAAAAAAAAAABBBAJDBBBAKACACAZBBAGAA',
  'ABBBACAHAAEFBBAAAKBDAEBACIAIAAAAAAAJACAHBBAKABBBAGAEAAAAAKDDABBBAEAAAHBLAAAAB8AAAKDDABCBAABBACFH',
  'B8AACIAIAAAAADACACACAAAAACAHADACAAAAASBBAAAAAAEFABBBADCDAAAAAKCDABBOACBDBFAAAKBDBFAAABBBAAAABBAK',
  'BBAAAEAABBAKCIAIAAAAADACACACABCBAHBGAhBBAAAAACACACDDAYBBAXCBBBANBBAAAAAAAEAMAAEFAAAAABBBATBBBFAA',
  'ADDDAEAAAHAVACADAEAABBAAAABAAAAAAAAACIAIAAEFABBBA0ADAGAEBBAAAHBLAAEFBBAAAAAAASBBADACAAAAAPBBAAAA',
  'AJAECIAIBBAAAHBGABBBAAAAAAAAAAAAAAAABBANAAAJABCBAJAECLALADACAAAAAGAEACACACAAACAHAGAAABBBAAAAAAAA',
  'AQDBAAEFACDBAAAAAJAAAAAAAAAAADACCIAIACACBFAAADACABBBAAAABFAAADDDADACAAAAABBBAEAAAAAAAUBBAHBGBBAA',
  'ABBBAAAACIAIADDDBBANABBBAAAABBAKACACADBDAHBGAAAAAEAAAGAEAAAAAAEFABBBAJAEBFAAAAAAABCBAAEFAEAAAAAA',
  'AEAAAGAEAAAAABEOACFHCLALAEAMAEAAABBBAAAJCIAIABGRAGAEABBBBHAGAAAAAAAAABCBAAAAAAAAAdBBBFAAABBBABCB',
  'AAAAAAEFAoCBAAAAAAAAAAAAAkBBAEAMABBBAHBLAsBBADDBAAAAAEAAAAAAAAAAABBBAAAJBFAACIAICIAIACAZABCBABBB',
  'AJAEAAAAADACAAAAAsCBAGAAAnDBAQDBCLALBFAAAAAAAiCBAHBLAAAJAEAAAAAABHAGAKCDAAAJAAAABBAAABCBBBAGCIAI',
  'AAEFACCBAGAAAxDBACAHCLALAAEFACAHAAAAADACAHBGAWBBABBBABCBAEAAACAHCLALABBBAAAAAAAAABBBABCBAKBBABCB',
  'AKDDBBAAAHCGArBBAEAMBFAAAAAAAGAEAwBBCIAIBHAAABBBAHBQAGAABFAAAUCBABBBADACABBBBBAAAYBBCIAIABBBAdBB',
  'AAAAACFHABBGABBBAGAAAAAAAAAAAAAAAKDDBBAKAKBDADACCIAIAAAAAAAAAAAAAJAEAAAAAlDBAAAAABBBAGAEAtCBBBAK',
  'AAAJABCBAAAJAAAABHAGAAAABBAGADACAAAABBAKAAAAACAHAEAMAAAAAAAACIAIBBAKAAAAAAEFAAAAAAAAAAAAAAAACIAI',
  'AGAAAAEFAAAABBAACIAIAAAABFAAAKBDAAAAAAAAABEOACACBFAAAAAAAAAAAAAAACACAJAEAOAAAAEFAGAEBBAGAKDDAJAE',
  'AAAACIAIACACCIAIAAAAAbCBCLAPCLAAABCBAJAEAJDBABBBACAHACFHAJAEACFHABCLAAAAAAEFAAAAAGAEAAAAAAAAAAAA',
  'ACAHBFAAAAAAAAAAABBGA5EAAHBGACACBBAAAAAAAAAAADDDABCBAAAAAAAAACDDADCDABBBABBBCIAIAGAEAAAJAAAAAAAA',
  'ASBBAAAAABBBADACAEAAAXBBCIAIABBBCIAICLALAEAMBBAAAAAAAAAAAAAAADACCIAIABCBABCBAnDBADACABCBAAAAAHAQ',
  'AAAACIAIAAEFAAAABBAKCLALADACAKBBAAAAANCBACFHAAAAABBBAACFABBBACCDABBBAOAXAEAMAKDDAVBBBBAAACACBBAA',
  'BFAACIAIAAAAABBBAAAAAAAABFAACIAIBFAAAAEFBBAKABCBAAAAABBBACAHAZBBBFAAAhBBBBAAADACABCBAAAAAAAAAKDD',
  'ABBBABBBAEAAAGAAAJEOABGRBBAAAGAAAHBLADACACAHARCBAAAAAEAAABBBAAAJABBBACACAAAAABCBAAAAADDDAAAABFAA',
  'AAAAADACADACAAAABBAGADACABBBAAAAAEAAAAAAAACFBBAABFAABFAABFAAAJACCLAPAAAAADACACACAAAAAAAAAAAAAKCD',
  'ACCBAGAEAJAEABCBABBBAEAAAhBBAAAAAAAAAhBBBFAABBAKAAAAADACAHBQAAAABBAAABBBAPCBAAAAADACAAAAABCBADAC',
  'ADACACATADACABBLAKBDAAAAAGBBAMBDAAAAABCBAJDBBBAAANAAAEAAAAAAAGAEACFHAKDDBBAKBBAKAAAAAAIAAJAEAAAA',
  'AAAABBAKANAAABCBABCBAAAAAjBBAAAAACACAAAABFAAAAAACIAIBFAAAHBGAJAEA0ADAAAABFAAAACFABBBABDBCIAIABBB',
  'AAAAACDDAACFAACFACFHAAAAABBBAEAMBFAAABBOBHAGAGAYABCBAAAAAEAACIAICIAIBBANAEAAAAAAA2AbCIAICLAAABCB',
  'BFAAABCBAHBLABBLAAAAAAAAAEAMAAAJAAAAAAAAADBDABCBCIAIAAAAACAHABBBBBAABFAAACAAABBBBBAKACDBAQCBBBAG',
  'AKBBADACAAAAAAAAAAAAACADABCBAAAAABBBAAAAABBGACFHABCBBBAGAMCBADACAAAAAAEFAAAABBANAAAABBAGCIASAAAA',
  'CIAIBFAABBAAAGAAAAAAABEAABGRABBBAHBGAAAAAAAAAAAABFAAAAAJBHAAAAEJBBAKAAAAAAAAACAHABBBBBANAAAAAAAA',
  'AAEFAAEFABBBAAAAADACAGAEACDDCIAIABBBABGRAnDBBBAAAnDBABCBAgBBAAAAAAAAAAAAAHBGAAAABBAKCLAPAAAAACFH',
  'ACCDAAAAABBBAAAAAAAAACAHAAAAAAAABFAAAEAMAAAAABCBAfDBADACACADABBBAAAAAAAAACADAAAAAAAJADACBBAGACDD',
  'AAAAAAAAAAAAAAAAAAAAACFHACAHAGAAAAAAAAAAAEAMAAAAAAAAAGAAACACACAgACACABBBACAHACAHAAAAAAAJCIAIAAAA',
  'AAAJBFAAAAAJADACAGAAABBBAAAAAAAAABBBAAAAADACAJACAGAAAGAAABBBAAAAAKBDABBBAAAAAHEAAAAAAAAAABBBBBAA',
  'AEAMAAAAAAAAAKDDAACFADACAEAMAAAAAAAAACACCIAIAEAAAHBLCIAIAKDDBFAAAKDDAAAAAAAAAEAMADACABBBAAAJASBB',
  'AAEFAAAABBAGAAAAABBBAAAAADACAjCBABBBACACABCBADACAHBGAAAAAEAAAAAAADACAAAAAAAAAAAAADACABCBAJAEACAH',
  'AGAEAGAEAAAAAHBGABBBAAAJABCBAXBBAAAAAAAAAMBDAAAAABCBAAAAARCBCLAPAAAAAAAAAAAAAJAEACADAAAAACAHAeBB',
  'ABCBAAAAABBGABBBAAAAADACAAEFAAAAABBBADACAAAJAnCBABBBAEAAAMDBABBBAAAAAAEFAAAAACACADDDAGAWBBAKATCB',
  'AAAAAAAAACFHAHBLABBBAAAAACFHABBGACCBAABAAAAAAAEFAGAEAAAAAAAAAGAEABCBBFAAABBBABBBAEAAAAAAABBBAAAA',
  'AKBDAAAABFAAACBDAAAABBANAAAAAEAAANDBABCBAAAAAAAAABBLACAHBBAKAHBGACAHACBDABBBAAAJAHBLAAAAAAAAAEAA',
  'AKBDAAAAACCBAKBDACDBAAAAAAAAAAAAACAWCIAIAHBGBBAAABBBAGAAAAAAAAAAACAHADACADACAAAAAAAAABCBAAAAABCB',
  'AAAAABBBAGAAAAAAAAAAABBBACFHAHBGAEAAANCBCIAIAOAAAGAAAJAEAJACACAHAEAABFAAAdBBAAAAABBBAAAAAAEFABBB',
  'ADACANALAAAAAAAAANAAAAAAAAAAADACAAAAABCBAAAAAAAAABBBBBAACLALABBBAAAAANCBAEAABBAKBFAAAEAACLALADAD',
  'AAAABBAAABCBAAAAAAAAABBBAHBGBBAAAAAAABCBCLALABBBABEOAAAAABBBAJAEBBAACIAIAAEFAAAAAAEFACAHABCBAAAA',
  'BFAAAAAAAAAAACADACFHCIAIADCDAMBDAGAYAAAAAAAAACDDABBBAAAAABCBAAAAAAAAAAEFABCBAAAABBANAAAAA5EAAAAA',
  'AAAAAfAACLAAAEAMBBAABFAAAAAAAAAAAEAMCIAIAGCBAAAACIAIAAAAAGAEBBAAApCBAGAAAJAEAAAAACACAAAAACAHAAAA',
  'ABCBAAAAAAAAABBBAAAAAAAACIAIBBAGADCDAUCBABCBBBAAACAfAAAAAAAAAAAAAAAAAAAAAGAEABEOABBBAAAAAAAAAJAE',
  'AAAAAAAAAAAAAGAEAAAACIAIABCBABCBABCBBFAAABCBBBAGAMBDAAAAABCBABCBAAAAABEOABBOAAAAAAAABBAKAGAEBBAK',
  'AAAAARBBAAAAAAAAAACFABBGAAAAADACAAAAAAAAAAAAAAAAAAEFABCBArBBABBBAAAAABCBAAAAAcCBAJAEAAAAAHCGAAAA',
  'AJAEAJAECIAIABBBAMBDAAAAAEAMABDBADACAAAAAAAABFAAAAEFABCBAAAAAEBAABBOAGAABBAGBBAKAJACAAEFAWBBABBB',
  'A4BBAAAABBAKAHBGABEOAAAAAJAEAKDDAAAAAGAAADACAAAAAAAAAKBDAsBBAAAABFAACvAAAAAAAAAAAHBGAAAAAAAABBAN',
  'AmDBBBAAADACBBAAAAAAABBBBBAKAAAAAAAAABCBCIAIAMBDAAAAADACBFAAAiBBABBBBBAAADACAAAAACDCCIAIADACAAAA',
  'ABBBAAAAAGAAAAAABFAAAAAAADACAAAAAJAEBFAAAAAAAEAMBBAAAqBBADECAAAAAJAEADACADACAAAAAHBLAAAAAHCGA4BB',
  'ACDCABCBAHCGACAHCIAIAUCBAHBQAAAAAAAAAEAAAAEFBBAKAAAABBAGBFAAABEOAAFFAAAACLAAAAAAAMBDAXBBCIAIAaCB',
  'CIAIABCBBBAGAAAAAAAAAAAAABEOAAAAAsCBAJAEBFAAAGAEBHAGAAAACLAPABBBAJAEARBBAMBDAAAABBAAAAAAAAAACIAI',
  'AAAAAAAAAAAAAACFABGRADBDACAHBBAAAAAAAAEFBBAACIAIADACAEAACIAIAAAAAAAAAAAAADACAmDBAAAAAEAAAMBDAAAA',
  'AEAMAAAAAAAAAAAAAAAAAAAAADACAKDDAAAAAAAAAAAAABBBAAEFAAAAAJAEAHBGAGAEAAAACIAIBBAKACACBFAAAAAAACDD',
  'AAAAABBBA5EABFAAABBBAAEFABBBAKCBABCBAuCBBBAGAEAAAAAAAJAEAGAEAAAAABBBABCBACACADBDADDDAAAAAAAAAACF',
  'AJAEABCBABCBABBBAAAAAAAAAHBQABCBAAAAABCBBBAKABCBACAHBFAAABBBBBAKAAAAAAAAAAAAACACAAAAACCBAAAAAAAA',
  'AGAEAAAAABCBBFAAAPBBACACAfDBAAAJBBAAAAAAAAAAAAAABBAKAACFAAAAAJAEBFAAAEAAAAAABBAAABAGAAAABBAAAJAE',
  'AAEFABCBCLAPAJACACAHAGAAAAAAAAAAABBBAOAXABBOBFAAAAAACIAIAAAAAAAAABBBAAAAADACABBBABBBAAAAAEAAAJAE',
  'AAAAABBBAHBGAAAAAJAEACFHBBAAAAAAABBBBBAGABBBACAHASBBAHBGAkBBBBAAAEAAAAEFAAAABBAAAAAACIAAAAAAAEAA',
  'AxCBADACABCBBBAKABBBACFHACAHAJAAAAAAACACAAEFAAAAABBBADACABBBABBBAAAAADACCLAABFAAANCcAAAAABGRBBAA',
  'AVBBAEAAABBBATBBABCBAJAEADACABBBABBBBFAABFAAAAAAAAAAAAAAAAAAAAAAAZCBADACAAAAACACADACADDDAMDBABBB',
  'ACAHBBAAAAAAAEAMABBBADACAAAAABCBABBBABCBCLAPAAAAAAAAABCBAAAAAAAAAAAAABBBAKBDAAAAAAAAAAAJABDBADDD',
  'ABBBAAAAABBBACFHAEAABBAKAHDBAKBDAAAABHALACDDAAAAApDBAEAAADACAAAAAAAAABBOAAAACLAPAKCBABCBCLALAJAE',
  'AAAAAAAAAHBGAKDDAAAAAAAAACAHCLALAAAAACACAJAAANDBAAAABBAGBBAAAAAACLALAEAABBAKA6BBAEAMAACFAAAABFAA',
  'AaBBACACAAAAAAAAAAAABBAKABBBAAAABFAAABBBAdBBACACAJAEAAAAAAAAA2AbAAAAAABBBFAABBAAAAAAABBBAEAAAJAE',
  'ACFHAAAABFAAAGAACIAIAAAAADACAAAACIAIAAAJAAAACIAIAGAAAAAJANAAAAAAADACAHBGACACADADAGAEAGAEACAHAEAA',
  'AABAABBBASCBBFAABBAAAACBAUCBABCBABBBBBAAABCBAMBDAHCGAMBDAAAAAAAAAAAAACACAHBQACACBHANAACFACAHA1DB',
  'AAEFAwBBACADAAAAAHBGAACFAAAAABCBABBBAAAAAHBQBBAAAAAAAAAJAAAABFAABBAGBBAGACCBAAAAAAAAABGRAAAAAAAA',
  'BBAGAAAACIAIAEAAABBOCIAIACACBBAACIAIAEAAAJCBAAAAATCBABBBAAAAAAAAAbDBAAAABBAKAAAABBALACFHAgBBANCB',
  'AGAEACAHABBBAAAAAAAAAAEFBBAGBBAAAAAAACACAAAAABBBABCBABBBAMBDABBBAuCBABCBArBBAHCGAAAABFAAAGAAAAAA',
  'AAEFAJAEAEAAAAEFABBBAAAAAAAAAABBAAEFABGRACAHAQCBApDBAHBGAtBBAAAAAAAAAAAAAEAAAEAAAAAABFAAAPBBAAAA',
  'BFAAABBBAJAEBFAAAACFAAAAAYBGAHBGAAAABBAAAEAAABBBACBDAAAAABBBACFHCIAIABBBAAAAABBBBBAKBBANADACAAAJ',
  'CIAIAAAAAAAAACADAAAAACACAAAAABBBAAAAAEDBAGAEAACFAAAACIAIARCBBBAKBFAABBALAAAAAzBBAAAAABCBA1DBAKCD',
  'AEAABFAAAAAABBAKBBAGAtBBBHAGAAEFAAAAAAAAABCBAACFABCBAPBBAPBVAHBGAAAAAiBBArBBCIAIABBBAAAAAAAAAEAA',
  'AAAAAAAAAAEFAAAABBAGAAIJAdCBACACAEAACLALBBAAAAAAAAEFABBBCIAAAAEJAAEJABBBBBAAADACAABAAHBGAGBBABCB',
  'CIAIAAAAAEAMArBBAAAABFAAAAAAACDCBFAABBAKAAAAAAAAADACAJACBFAAAAAAAAAAABBBANAACIAIAEAAAJAEABBGABBB',
  'AAAAAAAAA2HdAAAAAAAAAJAVBBAAAAAAAZBBAAAAABBBAAAAABBOAAAAACAHACFHAHEACIAIACAHAAAAAJAECLALANAAAAAA',
  'AAAAAHBQAAEJACACAHBLBBANADCDBFAAC+ASABBBAAAJBBANAAAAAAAABFAAABBBArCBAAAAADACABBBAGAEBFAAAAAAAAAA',
  'AAAAAAAABBAaACACABCBBBAABBAKAKDDAAAAAAAAAfCBAAAJAGAEAtCBADCDABBBACAHAMDBABBBAMDBBFAACIAIAAAACIAI',
  'AAAJABCBACACAAAAAcCBAJACAGAAAAAAAAEJAAAACIAIABBBABBBAAAAAAAAAAAAAGAAAAAABBANAGAEAAAABBAAABBBAAAA',
  'AAAACLAPAAAAADACADACAABBCIAIAEAMBFAABBAAAJAEBBAAABBBACDCAKDDABCBABCBBBAKAAAAAKBBAAAAAAAAAMDBAiCB',
  'ADACACAHAGAEAHBLAGAAAEAMBBAKBFAABFAAABBBAHAQABBBACAHBFAAAEAABFAAAAAJAGAEABBBAAAAADACAGAEAHBQAEAA',
  'AAAAAAAAA6BBAEAAADACBBAGBHANBBAKABBBABBBBHAGAQDBACFHAGAEABEOABCBADDDACAHA6BBCIAIABCBACBDAGAEAGAE',
  'BBAAAyBBBBAAABBBA1DBACCDBBAGAAAAAEAAAEAMACAHAJAEAAEFAEAAAEAMAAAAArBBAOBBAEAAAAEJABCBABBBAAAJAjBB',
  'ADACAeBBAGAAAAAABFAAAAAAACAiBHANBBAAAVBBBFAABBAGAOBBAEAMAGBBABBBBBAKAMBDAAAAAVCBAAAAAAAAAAAAAAAA',
  'AqBBABBBAAAAAAAAABBBABCBABCBABBBAAAAAAAAAEAAAAAABBANAACFADACBFAAAAAAAEAMAAAAAAAAAJAEABBGAPBBBFAA',
  'AAAAAAAAAAAAABBBABCBBBAACIAIAEAACIAIABBBAAAAA2AbADACAGAABFAAAAEFAAAABHAACIAIAAAAAAAAAEAAAHBGAJAC',
  'ABCBAJAEAAAAAAAAABBBCLAPABBBACAHABBBAAAAApDBAJBLCIAIAEAAAJAEBBAAAAAAAACFArCBABBBAAAAAGAAAAAAAAAA',
  'AAAJAHBLAAAAADACCIAIBBAGABBBACAHAGAEAEAAAEAMABBBCIASAGAABFAAAAAABBAAABCBABCBAuBBBBAAAGAEADDDAACF',
  'AeBBAAAAAAAAAAAAAAAAABBBADACCIASACFHAAAAAAAAAAAAAAAAABBBAAAAAfDBAAAAATBBAYBBAJAEABBBACDBAeBBAAAA',
  'AAAACIAIBBAAACACAAAAAwBBCLAAAAAAAAAAAAAAADACAJAEAAAACIAIBFAAAHBGAEAMABBBABCBABBBAAEFABBBAJAEAAAA',
  'AAAABBAAAACFAAAAAAAAAJAEAAAABFAAC+AAABCBACACAAAAABCBABCBAAAAAAAAAKDDAAAAAAAAABCBAAAAACADAAAAABBB',
  'AEAABBAAACFHBBAAAHBGAAAAAAAJAqBBAAAAAMBDAAAAAAAAAAAABBAGBBAAAAAAAMBDABCBABBBAAAABFAABFAAAAAAAAAA',
  'AKDDABBBB8AAAMBDAAAAAAAAABBBBBAKAAAAADACAAAAADDDABBBABBBAJAEABDBBFAAAJAEAAAAAAAAADACABBBAJDBAGCB',
  'AAAABBAAAAAAABCBAkCBABBBBBAAAKBDAbDBABBBAACFAHBLAGAAAACFACAHADACAAAAAGAEADACABBBAAAABFAAAEAMABCB',
  'AAAAADACAEAAABCBACFHABBBBBAAABBBACCDABDBACAHAAAAABBBAZBBACBDBBAGAVBBACADADDDBFAAACCBAGAAABEOADAC',
  'ABBBABCBABBBADACAACFAGAEAAAAAAAAAJAEAHCBAAAAABCBAJAEAEAAACAHACBDAAAAAAAAAAAACLAPAAAAAGAAAHBGAAAJ',
  'AAEFAEAAAAAAAACFAAAAABBBAGAEABCBADACAAAAAAAAABBBAAAAACACAGBBBBAGACAHAAAAAEAMCIAIAnDBAoBBABBBAAAA',
  'AAEFACAHBFAAACAHBFAAAAAAAAAAABGRAAAAA5AbAAAAACDDAMCBAAAAAACFBFAAACCDAAAAAGAEABCBABBBAEAMAbDBAYCB',
  'A1DBAAAAAAAJBHAGAAAAAAAAADACAAAJCIAIAAAABFAABBAKBFAAAAEFAAAABBAAAMBDAEAAABEOABBBAAAAAAAAAGAEABBG',
  'AAAAAACFACAHAAAAAAAAACFHABCBASBBACAHACAHAJAEAGAEACCBABBBAGAAAYBBAWCBAAEFAAAAAJAEBBAAAAAAACFHBBAK',
  'ACACBFAAAAAABBANBBAKAAAABFAAAAAABBAKAJAEAAAAACAHAAEJAAEFBBAAAAAAAAAAAAAABFAAACAHABBBAfCBAcBBACBD',
  'CIAIABBBAGBBAEAMCLALBFAAAAAAAGBBABCBCIAIAAAACIASAAAAAAAABBAAABGRAAAAABCBAGBBAAAABBANAEAMAHAQAHBG',
  'AAAABFAAABCBAGAEAAAAABCBAAAJAAAAAWCBAAAABBAABBAAAAAAAAAAANAAAAAAAAAAABBBABBBABBBACAHAEAAAHBGAKAD',
  'AAAABBANAJAEAAAAAAAAAAAACIAIAEAAAJAYBBAGAAAAADACAJACAAAAACACBBAGAAAAAAAABBAAAGAEAAAJACAAAMBDAaBB',
  'AAAAAAAAAACBABCBAAAAACACBBAKAAAABFAAABBBACATBFAACIAIADACBBAKABBBCIAIADBDA3BBABCBAAAAAAAAADACAAAA',
  'AeBBBBANACACABBBAAIACIAAAAAAADCDABBBAAAAAACFABBBBBAGAAAAAAAABBAGCLALABCBCIAICIAIACAHCIAIADCDAAAA',
  'BBAAAJAEACDBABCBAKDDAAEFAAAAAAAAADACAABBBBAAABDBBBAGAaBBBFAAAAAAAAAAANDBAAAACIAIAEAAAAAAAAAJAHAA',
  'ADACAAAAAGAEADACAAAACLALAAAAAUBBACFHBFAAAAAACLAPCIAIACAHBHAGAGAAAEAAAAAABBAAAAEFBBAGBFAAAyBBAAAA',
  'AlDBBFAAAAEFAAAAAAEFADACAAAAABBBABBBAHCGCIAIAMBDAMDBADDDAGAEAGAEAVCBABBBABEOAAAJA3CBAAAAADACAAAA',
  'CIAIABCBADACAAAAABBBAJAEADACAHBGAAAAACAHBFAAAHCGAfDBABCBAAAAACACAAAAAzBBACCBABBBADACACACAGAEAAAA',
  'ABBBAAEFBBAABFAABBAAAHBGAAAACIAIAAAAAAAAABBBANCBADACACAHA2AAAAAAABEOAVBBAJAEBBAAABBBAEAMAMBDBHAG',
  'AAAAAAAAABBBAgCBACDDAGAEABBBAHBQAAAAABBOAAAAAGAEAYCBADACADACABBBCIAIABCBAAAAAHBGAEAMABBBAACFCIAI',
  'ABBBAPBBABBBBBAAAPBBABBBAEAAADACAEBABBANBBAAADACAGAAADACBBAGCIAIAVCBAAAAAEAAACAHABBBAGAEAJAEAGAE',
  'ACFHAAAAAAAACIAIAAAAAHBGABCBAAAAAAAABBAAABBLABBBACDDADDDAAAABHAUAAAAAkBBAAAABFAACIAIAEAAAAAABFAA',
  'CIAIAAEFBBAAABCBAJAEABCBAAAABBAAAHBQAHBGAAAAAJAEAGAEAGAEAAAAAAAAAAAAAJAEArCBAAEFABBBAAAABBAAAAAA',
  'ACBDAAAABBAAAAAAARCBAAAAAAAAAAAAAAAABFAABFAAB8AAAAAAABBBBFAAACACAJAEAAAAACFHABBBCLAAACAHABBBA1DB',
  'BFAAABBBAAAAABBBAJAEACACAAAAACDBADACAAAJABCBAHBGAAAAAJAEAcBBAeBBADACASBBAEAMABBBAAAAAGAEAwBBAAAA',
  'AEAAABBBAKBDAAAAABBOAAAAAACFAQCBAAAJAAAACIAIAACFABBBAAAAAAEFAAEJAAAAAAEFAAAAABCBCIAIAAAAAAEFABBB',
  'ACACAAAACLAPBFAAAAAAABBBAABABFAAAuCBACACAAAJAEAMACFHAGAEAKDDABCBANCBAAEFBBAAAGAEACFHAAEFAAAACIAI',
  'AAAAACACABBBABBBABCBAAAABBAKABBBACCBCIAIAAAABBAAAHBGAGAAABBBBBAAAAAAABBBABBBAEAXABBBAVCBAAAAACCB',
  'BBAAAEAMADACBFAAAJAEAAAACIAAAHBGAPBBAAAAAAAAAJACAAAAAJAEBFAAAAAAACDDANDBAUBBAJACAAAAAEAMAmCBBFAA',
  'AAAAAACFAAAAAEAAAAAAAAAAAXCBAJAAAAAAAAAACIAIAAAAAAAAAAEFACFHAhDOBHAGAHBQACAHAAAAAAEFAAAAAAAAAAAA',
  'BBAAACACAJAEADACADBDAAAAACAHAAAAAHBQABBBAAAAAGAEACAHAJAeAAAAABBBAAAABBANAAAAAOCBAJAEAAAJADACAAAA',
  'AMBDAAAAADACBBANAoBBAAAAAAAAAAAAAAAACLAPAJAAAAAAAAAAAAEFABBBCIASABCBAAAAAEAAAAAAACDDADACAAAAAAAA',
  'AEAABFAACIAIAAAABHAGACACAAAAADCDAVCBA6BBCIAIAcBBACACAAAAAAAAAAAAAWBBAHBQAMBDABBOAAEFAAEFBHAGBBAA',
  'ADACAACFAAAAACDDCLALABCBAHBLAHBLAEAMAAAAABCBAAAABBAKAAAAACFHBBAAAEAMAAAAARCBCLALADACBBAAADACAGAA',
  'AAEJBBAABFAAAAAABBAAAAAAACAHAAAAAAAABBAaABBBAAAABBAAABBBBFAACIAIADACAAAAAAAAAAAABBAAAAAAAVBBABBB',
  'AAEFCIAIA6BBABBBABCBAAAAAAAAAGBBACAHBBAAADCDAAAAAAAAAAEJAACFAHBGAAAAAAEFBHAGADACBBAAAAAAAAAAATBB',
  'ADACAACFCLAPAaBBAGBBAAAAAAAJAAAAACFHAAAAACDDABCBAPBBAHEAAAAABBANAAAAAiBBAAAAAHCGCLAPAKCDCLALAAAA',
  'ApDBAAAAADACAAAAADACBBAKABBBABBBAHBLADACAAAAACAHAJAECLALAAAAAEDBAAAAABBBACDDAVCBADACBBAAAAAAAAAA',
  'AHDBAAAAAJAEBBAABBAGAAAAACAHAAAAACFHACFHABBBAHBGAAAJAAAAABBBBFAAADACAACFAAAAAAAAABBBAAAAABCBBBAA',
  'ACDBAAAAAAAAAAAABFAAABBBAKDDACFHAAAAAGAAABBBAEAMCLALABBBBFAAAAAAAAAAAAAJAAAABBANABGRAAAAAEAAAAAJ',
  'ACHDAAAAABBBACAHAAAACIAIABBBAAAABBAAAAAABFAAABBBADACAAAAAAAABBAAAfCBASBBAAAAA0ADAJAEBFAAAHBLABBB',
  'AAAAAAEFAAAAAJAEABBBACFHAAAAAJACACACAJAEABBBAEAAAEAABBAABFAAAAAAADDDAAAABBAAAAAAAAAJAAAAABBBAAEF',
  'BBAAAjCBAGAEAAAAAAAAAAEJAEAMABBBAWCBBBAAAAAAADCDAAAAACAHBBAGADACCIAIAAAABFAACIAABFAAAGAAAAAAABBB',
  'AAAAADDDABEOAAAAABBBAACFAGAEAACFBFAAAAAAAAAAADACAGAACIAIAAAAABBBACADAEAMAACBAEAAAAAAACAHAAAAAAAA',
  'AsBBAAAAAHBGCIAIAEAAAAEFAeCBAAAAABBBABGRAHBGAHBLAAAAAAAJAAAAAGAEAAEFAAAAAAAAAAAAAGBBAAAAABBBBBAG',
  'CLALAAAAAAAAABBBAAAAABBBAAAAAEAAAMBDCIAIAxCBAAAAAAAAABBBAAAAAABACIAACIAIAACFABEOAAAABBANAAAAACAC',
  'AQDBABBBAHBGAJAEAAAAAAEFABBBAAAAACACBFAAAAAJAAAAAAAAAAAAAAAABBAGAAAABFAAACFHAHBQABBBAGAEAAAAAAAA',
  'BFAAAAEFAAAAAHBGAAAACIAIAAAACIAIABBBADACANCBAAAAABBBBBAGACACASBBAEAAAAAAACAXAAAJATCBABCBAtBBAEAA',
  'BHAGAAAAACACAGAEAJAEABBBAKDDAAAJADCDAAAAAAAABBAGAAAAAJAWAAEFBFAAAVBBBFAACvAKAAAACLALAEAAACBDADAC',
  'AEAAABBBABBBARBBCIAIAAAAAAAAACAAAAAAAAAAAAAABFAAAHCGAKDDAAAAAAAABFAAAAAAAAAAABBBABCBABEOACACACAH',
  'ABBBAAAAABBBAAAAAAAAABEOACDBADACBBAAAzCBBBAKBFAABFAAABBBAGAEAEAMAAAAAAEFAAAABHAGACAHBBAAAGAEAAAA',
  'BBAAAAAAAEAMAEAMAGAEAbDBAAAAACADABCBAAAAAGAEAAAAAAAAADACADACAAAJABDBABBBAWCBAJAEAAAACLAPACACCIAI',
  'CIAIACAHAAAAACFHAACBAGAAAAAJCIAIAdBBAAAJABCBABCBBBAAAEAMAAAAABCBAAAAAAAAAAAAAJAEABBBAEAABHAUABBB',
  'AAAAAAAAAEAAABBBAJAEAAAABFAAAGAABHAAAAEFBFAABBANAuBBAGAAAJACAAAAAeBBAAAAAHEAAAAAAAAAAEAAABCBABCB',
  'AAAAABCBACFHAAAAAkBBAAAABBAACIAIABBBAAAACIAICLAPAJAEAEAAABBOAAAAAAAAATBBAAAAAAAAAAAABFAAABBBACAC',
  'AJAEADACAAAAAKBDACADBBAAAAAAAAAJABCBAHBGAAAAAUCBACDBAAAAABBBCIAIBBANAAAAABBBACAHABBBAAAAAAAAACAC',
  'AGAAAAAACIAAAMDBAAAAABBBAAAAAGHEABBBBFAAAAAAAKBDABBOAAAAAAAAAAAAAEAMADACAAAAAWBBAAEFAAAAACDDAAAA',
  'AKBDABBBAEAAAQDBCIAIABBBCIAIABBLAAAAAAAAAAAAAGAEAWBBABBBACAHCIAICIAICIAAAAAJAKDDADACACFHAJACAEAA',
  'ADACAAAAADACBFAAAWCBADACABCBAJAEABBOAAAAADACAHBGAJAEABBBAoBBADACAAEFAQDBAAAAAAAAAJAEACACACCDAAAA',
  'BBAAACADAAAAACCDAEAAAKCDAAAAAGAEAEAABBAAAAAAAcBBBFAAAAAAABBBABBBABBBAAAAAAAAADACAJAEAAAAAAAAABBB',
  'AAAABBAAABBBACAHAKDlAHCLABBBBFAAAAAACIAIAAAAAAAAAAAAAAAAARBBACAHADDDABBBAAAAAuBBAAAAAAEFCvAAADAC',
  'AAAAAAAAAJAEAAAAAAAAACAAAAAAACDDABCBBBAAAdCBBFAAAAAAAAAAABCBAKCBAEAAARBBAoCBACADAAAABFAAABBBBHAU',
  'AsBBABBBACAHABBGABBBACAHACACBBAACIAIBBAAACDCAJACBFAAAGAAAACFAAAABFAAACACAGAEAAAAABBBAEAAADACADAC',
  'AAAAAAAAAAAAACFHAAAAAAEFADACAJAEAAAAADACBBAKAAAAAAAAADACAJACAsEOAAAAAAEFAAAAADACABCBAAAAASBBABCB',
  'ACCBAAAAAAEJAAEFABCBAGAEAAAAAAAABFAAAgBBAAAJAAAAAAAAAAAAAbDBAAAAAAEFABBBAJDBAGAEAZCBCIAIABBLAAAA',
  'AAAACIAIADACAMBDAAAAAtBBAKDDAAAAAGAEANDBBBAAAAAAAGAAACACAAAAAAAABFAAABDBAAAJAAAAABBBABBBAAAABHAG',
  'AAAAAnDBBFAAAGAEAACFARCBAAAAACADACACAAAAAWBBAHBGADACAGAAABCBABCBAAAAABBBAEAMAEAAAKCDAAAAA4CBADAC',
  'BHANACAHARBBAAAAABCBBBAGAhBBAEAAAAAAAACFAAAAABBBCIAIABBBAAAAAAAAAAEFAJAEAAEFAAAAACAHAAAAAEAAAAAA',
  'AACFAKCDACDBAAEFBFAACLAPBFAAABCBAJAEBBAGAAAAAAAJABCBABCBAAAAAEAMAAAAACACABBBAAEFAAAAABBBABCBABBB',
  'CLAPABBBAlCBAAAAABCBAAAAAAAAAGAAAAAAAEAAAEAAACAHAAAAAAAAAJAEACFHCLAPBBAAAACFADDDAAAAAKCDAAAAAAAA',
  'AAEFAkCBCLALAAAAAAAAAEAABHAGAAAAABBBAAEFABCBBFAAAAAAAAAABBAGBFAAACDDAAEFAAAAAAAAACACCIAAABBBBBAA',
  'ABBBAAAAAMCBCIAIAEAMBBAAAAAABFAAAAAAAAEFBBAAABCBACAHABBBAAAABBAAABBBCLAPABCBABBBBBAAAEAMABBBAAAA',
  'AAAAAAAAAAAAAAAAAACFAAAAAAAAAGAAABBBAHBQACACBBAKAAAJAAAAACACABCBAAAABHAAAEDBAAAAAEAMABDBAAAAAGAE',
  'AAAAAAAAAAEFAAAAAXBBAAAABBANAAAAAzBBACDDAAAACLAAAHCLAAAAAGAEADDDAHBGACDDABBBABCGBBAAAAAAABBBBBAK',
  'AJAEBFAAAEAABFAACLAPAAAAAAAACIAIABBBCLALAQDBABCBAAEFAAAAAEAAAGAAAAAAABCBAHCLAQDBBFAAABBLABBBAAAA',
  'AEAAABCBAAAACIAIAAAAACADBFAAAJAEBBAAAAAABFAAAAAAABBBAHBQACAbAAAAAAAAABCBAEAABFAACLAPAAAAAiBBABDB',
  'AAEFAHBQAAAAABDBAAAABHAGCIAIAhCBAAAAABCBAGAEAAAAAAAAAAAACIAIAABBBBAKADACACAHBBAAABCBAKDDBBAAAOBB',
  'AHBGBBAKAAAABBAABBAKACFHAAAABBAKCIAIAAAAAAEFABBBARBBAGAEAAAACLAPAAAAAAAAAKDDACAHACCBA6BBACACABBO',
  'AHAAAAAAAAAAABBBAAAAAuBBAMBDABBBBBAAABCBACAHABCBABCBAAAAAEAAAHCGAAAABFAABBAAAHBLAAEFADDDAAAAABCB',
  'CLALAAAAAGAEAAAAAAAAAAEFAEAAAAAAAAAAAAAAAAAAAAAAABCBAAAAAAAAACADAAAABBAAAAAAAAAAATBBBBAABBAGAAAA',
  'ABBBABCBAAAAAHBGAAAAAAAAACAHACCBADACAAAAABBBCIAIAAAAAGAAAAAAABCBADACAJCBANALAAAAAAAAAAEFAMBDADAC',
  'AAAJAHBLACAbBBAKAAAAABBBBHAAAAAAABBBBBAKCIAIAAAABFAAAKBBAAAJBBAAAjBBABBBAAAAABBBABGRAHBGBBAAAAAA',
  'CIAIABBBCLALCIAIAhCBAEAAAoCBAAAAABBBBBAAAAEFAAAACIAIADDDAAAAAAAAAAAAAAEFACBDAAAAAEAACIAIADACAAAA',
  'AAAAAZBBBFAAACACAGAEAAAAAAAAAAAAAAAAAHBQAmDBA3BBAAAAAAAAAAEFACACAhBBABBBAAAAABBBAAAAAAAAABBBABCB',
  'AAAABBAAAGAEABBBBFAABBAAAEAAADACBFAAAAAAACACABBBADDDAAAAAAAJAAAAAEAAAGAEABCBAAAAAAAAAEAMAEAMABBB',
  'BFAAABGRBBAABBAAABBBAAAAABBBACDDAEAAAHEAABBBAAAAAAAABBAAAEAAAAAAAAAAAAAAABBBAAEFAJAEAAAACIAIABBB',
  'AAAAAAAAAAAJAAAAACFHA3BBAAAABBAAABBBBHAGAOBBABCBAAAAAAAAAAAAADACAAAAAAAAAGAEANDBABCBBBAAAAAAAdBB',
  'AAAAAAAAAAAAAHBGACACACACABCBACAAAoBBACCDAEAAABBBACAHBFAAABBBAAAAAAAAABBLAACFAAAAAABAAAAAAAAAADAC',
  'AGAEAAAAACAHAAAAAAAAAAAJAAAABFAAABBGABCBAACBAGAAABBBAAAABBAGAGAEAAAAAGAEBFAACIAIBFAAACAHAAAAA7CB',
  'AAAAADACABBBAAAAABBBAJAECLAPBHAGBBAAAAAAABEOAAAACIAAABBGADDDBBAAAAAACIAICIAIAWBBADACAAAAADACAAAA',
  'AHBLAAAAABBBADACBBAGAJAAAGAEAJAEBFAAABBBAAAAAAAAADDDAMBDAAAAAAAACIAAAEAABBAAAAAAADACABBBAAAAAEAA',
  'AHBGAAAAAAAAAAAAAACFABBBAiBBAiBBAAAAACBDAAAAAEAAAGAAACAHCLAPAGAEACADAAAAAAAAABBBAAAAADACAEAMAAAA',
  'ABBOBFAABFAAAAAJABBBAGAAAAAABBAAAAAAAEAMAGAAABGRAAAAABBBABBBACFHBBAAAAAAAAAAAAEFAAAAADBDABCBAAAA',
  'AAAABBAAAAAAADACAEAMAKDDAEAAABBBAACFABBBABCLCLAPAAAACIAIAGAAACACAAAAABCBAAAAAmDBAgBBCIAIAAAAAHBL',
  'ACBDAJAEABBBAAAAADACAAAAAAAAAAAAAAAACIAIABGRAEAAAAAAAAAAAAEFATBBAAAAACAHAAAAABCBABBBBBAKAAAAABCB',
  'AAAABBAAABCBBHAGATBBABCBAAAACIAIAGAEAHBLAAAAAAAAAAAAABBOAOAAAAAAACACABBBBBAGAGAABFAAA1DBAJACAAAA',
  'BBAKABBBAAAAAAAABBAGADDDABBBACACBFAAADACABCBAAAAAAAAAEAMBBAACIAIAJACBBAGAHAQAAEJABBBBBAGABBBAAAA',
  'ABCBABCBAAAAAAAAAAAAAWBBACFHAGBBAGAAACDBBBAAACFHACACBFAAAAAAABBBABBBAAAAAGAEAAAAAAEFCIAIAtBBAAAJ',
  'ACDDADACAKADAAAAAHBLABCBAAAAAJAEAJAEBBAKAAAAADACBBANAAAAAGAEABBBAAEFAAAAADCDBBAAABBBAGAABBAKACAC',
  'ABBBAAAAAAAAAAEFADACBBAAAHBQAAAAAAEFA1CBACFHACAHABCBABCBAAAABBAABFAABBAKAAAAAAAAAAAAAJDBAAAAAAAA',
  'ABCBAGAEABCBABBBAAAAABBBACCBAAAABBAKAAAAABCBA1DBBFAAAAAAABBBAEBAAJAEAAAAADACAAAABFAAACFHBBAAABBB',
  'BFAAAACBADACAAEFAKDDAAAAAGBBBBAAADACA7DBAAAABFAAAGAEACAiABCBABCBACADAGAEBBAKBBAKABBBAAAAABCBBBAA',
  'AAAABBAKAAAAAGAEBFAAAMBDAAAJBBAABBAGAAAAAGAEAAAAAAAAADACAAAABBALAJAEAJAEAHBGAACFABCBAdCBAAAAAAAA',
  'AAAABHAGAGAEBBAABBAAAAAABFAAABBBACAHAAAABHAGCLALAAAABFAAAAAAAAAAABBLAAAAADACAHBLBBAAAAAAAAAJAAAA',
  'AGAEBBANAAAAAAAABBAAADACAAAAAJAEABBBAAAABBAACIAIAAAAAEAAAiCBAAAFBBAAAzBBBBAAABBBAHBQBBAAAAAABFAA',
  'AAAABFAAAAAAAAAAATCBACACADACADACAAAAAaBBAAAAAAAAACACABBBBBAABBAAABBBABCBACACACFHABBBABBBAAAAAJAE',
  'AGAAAGAVABBBBBAGAlDBAAAAAAAAABBBAMBDACACAAAAAAAAABBBAGAEAAAAADBDADBDAAAAAABBAAAAAAAAANAABBAKAAAA',
  'AlDBACBDAAAAAAAJABBBAAAAAHBGAAAAAJAEAAAAAACFAGAAAAAAARBBAAAAABBBAAAAAJAEAAAAABCBACAHACFHAAAAApDB',
  'AAAAADACAAAAAJAEBFAAAAAAAAAAAAAAAEAAAHBGABBBAAAABBAGAAAAABBBAJAEAEAAAAAABFAACIAAAAAACIAIAEAAABBL',
  'AGAAAGAAAAAAAMBDAAAAAAAAABCBAEAMAHCGAAAAAJAEADACABBLBBAACIASAAAAAJAEAOBBBFAAAHAQBBAAAAAABBANAEAA',
  'ACAHAAAAADACAKCDADACACAHAAAAAAAJAJAEACACAAEFAAAAABBBBBANAHAQACACAXCBAHBQADACACFHABBBBBAACIAIAAAA',
  'AAAACIAIAAAAAHBQAAAACIAIAAAAAAAAADDDACACAHBQABJOAAAAABBLAAAAAGAAAAAAAABBAHCGAAAAADACABBBAsBBAAAA',
  'BHAGABBBBBAAABCBAEAAAEAAAAAAAAAABBAGAMDBAAAAANCBAVBBBBANAAAAAJAEACCDAKBBABBBAAAABBAKAAAAACAHABBB',
  'ACFHBHAUAAAAAAAAADDDAGAAAAAAABBBBBAAABBBAAAAAEAAABBBABCBABBBACACAAAAACFHAAAAAAAAAAAAABBBABBBAAAA',
  'ABBOAJACACAUBFAABHAGCIAICIAIAAAAAuCBAAAJBBANAAAAADDDAABBAGAAAGAEBFAAAlDBAAAAACAAABBBADACAJAEAZBB',
  'AAAJAAAAABBBABBBAACFCIAIAAAAAAAJAKBDAHBLACAHADDDACADAAAAADACAKDDAEAMACFHAEAAANCBCIAIAHBLAAAAAAAJ',
  'BBAGBFAAACCBApDBAAAAAJAEAEAAAAAACIAIACFHAkBOACAHABBBACDDACFHADACAAAAAAAAAAAAAeBBCLALBBAAADACACAH',
  'AAAAAJACAAAAAAAAABBBAAAAAmCBAGAAABBBBHAGACACAJAEAHBGACFHAAAAAAAABBAAAAAAAHBGAkBBCIAIABBBBBAAAAAA',
  'AAAAARBBAEAAAACFACFHAJACAAAAAGAAAEAMABBBAAAAAGAEAAAABHALAJAQAGAEABCBAAAAAAAAAAAAADACAZBBABCGBBAA',
  'ABBBAJAEAAAACIAIAAAAABCBAGAAADACAGAEAAAAAAAABBAKAzCBABCBBBANAJAEABBBAAAAAGAEACACAEAAAAAAAVCBAAAA',
  'ABBBAAEFABBBAEAAAAAACIAIBFAAABBBBFAAAAAAAUCBABBBCIAAABBOACAXAAAAAAEFAHBGBFAAACACAAAAAAAACIAIAAEF',
  'AAAAABBBAMBDCLAPAAAAACACAAAAACAHCIAIAAAAAEAMABBBAAAAAGAEABCBAAAAAAAABFAABBANCLALACAHACFHAAAACLAP',
  'AAAAAAAAAAAAAAEFAAEFAAAAABCBAAAABBAAAHBGBBAAAAAJAYBBBBAAADACAAAAABBBAAAAAAAAAcBBABBBAHBGAAAAAAAA',
  'AJACAAAAAAAAAEAABFAABBAAABBLACATBFAAADACAEAAAKCDABBLCIAIAJAUADACAAAAAAAABFAABBAAAAAJAEAAAEAAAAAA',
  'APBBAAEFBBAKAAAAAHBLAHBGAHBGAAAACIAIAAEFAAAAAGAAABCBBBANAAAAABBBABCBAAAAAAAAABBBCLAPAAAAACDBAAAA',
  'BBAKBBAKAGAEAJAEABBOAAAAAAAAACDCCIAIAAAAAAAAAAAABBAjAGAEAAAAAAAAAAAAAAAAACAHAAAAAKDDAAAAAKCDCLAP',
  'ACADAAAABBANACAHAAAAAEAAAAAAAJAEAEAMAABLAHBGAAAACIAIAJAEAAAAANAAAAAAADBDAAAAAAAAAKDDACADAGAECLAP',
  'ABBBAAAAABCBAAAAAdBBABBBACAHCIASAAAABBAGAAAJAJCBAAAAAABAABEOAAAABFAAAAAAAGAAAGAAAAAAAAEFAkCBABBO',
  'AbCBABBBACFHAAAABBAAAAAAACAZBFAAABBBAAAABFAABBAGAAAAAAAABBAAAAAAABBBAABABFAAABBLABBGAGAEAACFAEAA',
  'ASBBAAAAAAAAABCBAHBLAAAAAAAAABDBAAAAAAAABBAAAAAAAHBGABBBAAAAACDBAAAAACAHAAAAAHBGCIAABBAKAeBBAJAE',
  'AJAEABCBA9CBADDDAJAABBAKAAAAAAAAACFHABBBCIAIACAHABBBAAAAAAAACIAIABBBAoBBAGAEAAAAACACACFHAAAAAAAA',
  'AAAAAAAAAGCBAqBBAaCBAABBABEOAAAABBAAABBBACACAAAAABBBAJAEAXBBBFAAAEAMAAAAAGAEAAAAAAAACIAIBBAAAAAJ',
  'AAAAAPBBABBBAHCBAEAMABGRCIAIAfDOACAHAAEFAACFAuBBBBAGAAAAADACBHAGAyBBAAAABBAAACDBAEAMAAAAABBBAEAA',
  'ABCBAAAAADDBAAAAACBDBBAAABBBBBANBBAKABCBAHBGAbCBBBAKAKBBAAAAACDDABBGAAEFAAAAAiBBACCBANCBCIAAAAAA',
  'AAAABFAABBANAAAJABBBAAAAAAAAACBDAAAABFAAAGAACLALAAAABBAGAAAAAAAAABCBAAAAAEAAADACACBDAAAABFAAABCB',
  'AEAMAAAAABBBBBAKAVCBACACAAAAABCBAAAABHAGBFAAADACAAAAACBDAAAABFAACIAPAAAAAaBBAMBDAKDDAEAACIAIABBB',
  'AAEFAEAABBAAAGAAAAAAAHBGAAAAAAAAACACAAAAAKDDAAAAAAAAAHBGAAAAADACABCBAlCBAEAMBBAAABCBAAAABBAGAAAA',
  'AAAAABCBAHBGAMDBAHBGADDDAJAEAAAACLALAAAAADCDAAAAABBBAJAEAHBGAHBQACFHAJAEACAHANDBABEOAAAAAAAAAMBD',
  'AAAAAAAABHAGCIAIBFAAAAAABBANAQDBABBBBBAAAJAEACACAKADAAAAAACFAAAAAEAMABCBAAAAABCBAAAAAgBBAAAAAAAA',
  'AdBBAAAAAAEFAAAABFAAABBBAEAAADCDAAAAAAAABFAAAAAAAAEFAJAEABBBAAAABFAABBAKAAEFABGRAEAAAAAAABBLAEAM',
  'ACACAAAAAEAACIASAAAAAAEFAAEFAZGRABBBCIAIAAIAABBBAGAEAZCBAACFAAAAACATAACFAAAJBBAKARCBABBBACDBAHBG',
  'ADACB8AAAAAABBAGAEAAACACAVBBBFAAAAAAAPCBACAZAQDBABBBAAAAAACFAGAEAAAAABBBABBBADACAAAAAAAABFAABBAA',
  'AGAEAGAEAHBLAAAAAAAAAAAAAAAAAAEFAEAMAAAAACDCBBAAAAAAAAAAAJAEAEAAAAAAAAAAAABBAHBGAAAAABBBACAHBBAN',
  'AAAAAAAABFAAAEAAAEAAAACFAAAAAAAAAGAYAAEFAKDDAAAAADACCIAIAAAAAAAAAAAABBAKAAAJAAAAANALABBBABBBAAAA',
  'ABEOAAAAAABBBFAAAAEFASBBACACADACAAAAACAHAAAAADACACADCLAPAGAEAAEFAAAAADBDBBAGABEOAAAAA7DBAAAAAAAA',
  'ABBGBBAAAOBBAAEFCIAIAAAAAAEFAjCBAAAAABEOAAAABFAAAAAACLAPABBBAsBBAEAAAHBGABDBAKDDAAAAABCBACACBFAA',
  'AEAMAAAAAEAMAGAEBHAGAHBLAAEFABBOABBAAEAMAAAAAAAAAAAACIAIACBDAAAAACCBAAAAABCBACDDAEAMABCBAAAAACFH',
  'AEAAABCBADACAAAAABCBADACADAABFAAAJAEAAAAAAAAAjCBAAFFACDDAEAMCLAPAGAAAJAEAAEFAAAAAAEFAAAABFAAAHBL',
  'AAEFBBANAGAEABCBADACACADABBBAGAAAAAJAABBAnDBAJAEBBAAABCBAAAAAAAJABBBAAAABFAAAHBQAHBGBFAAAAAAAAAA',
  'ABCBAAAAAAAJAGBBAAAAAAAAAAAAAAFFACBDAEAAADACAAAAAAAACIAIAEAAAAAAA5EAAKCBABBBABCBACAHCIAIACADACDD',
  'ABBBBFAAAAAAAAAACIAIABCBAJAEAAAAADACACFHAAAAAGAEBBAAACACAAAABBAACIAIAZBBATBBACAHAAAAAOAAAAAAAHBG',
  'ACADABBBAUBBAAAAAEAAAAAAABCBBBAKAHBLAPBBAAAAAAAAABCBAJAAAGAAAEAMBBAAABBBAWBBACBDBFAAAqCBAJAEAAAA',
  'AAAAAJAAAdBBADACAQDBABCBAAAAAOCBCIAIAJAEABCBAAAAABCBAVBBAAAAANDBAAAAABDBBBAAADCDAGAAAAAAAAAACIAS',
  'AAAAACCDABEOABEAAEAAAAAAAAAAAEAMAAAAAABAAAAAAAAAACFHBBAAAAAAAAAAAAAAAHBQAJAZAKBDAGAEAAAAAzBGADDD',
  'AJAEAKCDAAAAAAAAAAAABBANAAAAAkCBAAAAAAAAAAAAAXBBADACACDDAAAAAAEJAAAAATBBAlDBAAAAAAAAADACAAAAAAAA',
  'AAAABFAAAAAAAAAAABBBAAAABFAAAAAACIAIAjBBAEAMAJAEAAAAAAAJAJAEACACABCBBBAABBAAABCBAAAAABCBAAAAAGAA',
  'AAEJAAAAAGAEAAAAABCBAEAXCIAIAJAEAAAAASBBADDDAyCBAAAAAbCBABBGACCBCIAIAMBDBHAAAACFBFAAAAAAAAAAABCB',
  'AAAABBAKBBAKAAAAAEAMCLAPABCBAGAEAAAAAMBDADACAAAAADACCIAIAGAAANCcBFAAAEAAAAAAAAAAABCBAAAAAAEFAGAA',
  'ABBBAAAAAHEAAAAAAAAAAAAJAAAAAAAJABBBCIAIAAAAAEAAANAAADACABBBABBBACADAAAABBAAAAAAAKDDCIAIANAAAAEF',
  'AGAEAAAAADACAAAAAACFAAAAAJAEAJACAHBGABBBAJAAAAAAAAEFAGAAAAAAAtCBABBBAEAMAAAAAAAAAAAACLAPABBBAdBB',
  'AGAAAEAAAAAAAAAABFAAAAAAAAAAAAAAAAAAAfDBABCBAAHAAGAEAAAAAAAAAAAACIAIABBBABCBAMBDAGAEASBBABCBAAAA',
  'AAAAACAHBBAAAAAAABBBAJACA3CBAAAAAAAAADACAoBBABCBABCBAEAAABBBACAHAHBGABBBAAAAAAAAAAAAAAAAAAAAAOCB',
  'AJAAAAAABBANAAAAADBDAHBQAAAAAAAAAQDBBFAAAAAAAAAAAAAAABCBCIAIAAAAAAAABBAAAAAAAAEFACAWAlDBBBAAAGAA',
  'ABBLAAAAAAAAADACACCBAJAEAAAAADACBFAAABBBAXCBBFAACIAIA2FAAJAEABBBBBAAAAEFACCBAAAAAAAACLAPACAHAAEF',
  'AAAAABCBBHAGBBAAAGAAAAEFAGAEBFAAAGAEAAAAACFHAAAAAHBGAAAAAEAAAAAAAAAABBAAAEAAABCBAAAAABBBAAAABBAN',
  'AGAEAEAMBBAAAAAABBAAAACFABBBAAAAABBBAAAACIAABBAAABBBCIAIAAAAACFHBHAGAAAAADBDADBDAAAJABBBAAAABBAA',
  'AAAAABBBBBAAAHBQCIAIADACAWBBAAAABBAAAAAAABCBAAAAAAAAAACFBFAABBAAAAAABFAAADACABCBAAAAAAAAAAAAAAAA',
  'ABBBACAHBBAAAAAABFAAAAAAABBBABBBACACBFAAAAAJAAAJAEAAABBBABGRABDBAEAAAsBBAACFABBBADACAHBLAAEFABBB',
  'ACBDAAAAANAAAAAAAEAMAAAAADACAAAABBAACIAIADACAEAAABBBABCBABBBADACACACAAAAABBBAEAAACAHAAAAABBGADAC',
  'AEAAAAAAADACBFAAAHBLABBBBBALAAEFACACAAAABBANAHBGAJACAKCDAAAJAHBQABCBAAAAABBBA9CBABBBAHCGAJAEAAAA',
  'AAAAAEAMAAAAABCBADBDAHBGAAAABBANAAEFCvAABBANABCBAMBDAGAAAAAAAAAACLALAGAECIAIABBBCIAIAAAAAAAAAACF',
  'AAAAABBOABBBCIAIBBANAZBBBFAAAAAAACFHATBBACFHBBANACAHCIAIAAAAAHEAAWBBBBAKAAAABFAAAAAABBAaACAHBFAA',
  'AAAAAAAAAAAAAAAABBAGCIAIACAHAAAAAAAAAAAJAAAAAHBGBFAAAwBBAGAAABBBAEAMABBBAAAAABBBAAAAAXBBAAAAABCB',
  'AEAMAAAAAAAAACDBCIAIAAAABFAAAAAAABCBACFHBFAAA3BBAAAAAAAAAAAABFAAABBBCIAIAjBBAAAABBAGAAAABBAABFAA',
  'ABCBASCBABCBAAAABFAAACFHAAAAAEAAACACABBBAEAAAAAAAGAEAAAAAEAAAAAAABBBAzBBAEAAAJAAAAEFBBAAAAAAABBB',
  'AAAAAAAAAAAAAAAAAAAAABBBAAAAAJAEBBAAAEAAAAAAAAAAAEAMAAAACIAIBBAGCIAIBFAAABBBABBBABCBAAAAABBBAGAA',
  'AAEFABCBABCBACAHAAEFAEAAABBBABBBAAAABFAAACAHAAAABBAAANAAADACA4BBAAAAAAAAAJAEACFHAAAAABCBADACAAAA',
  'ACACAPCBAAAJAAAAABBBAGAEAJAEAAAAAAAACIASCLAPAkBBBBAKBBAABBAKAABBAAAACLALCIAIAPBBAACFBBAKAAAAABBB',
  'ADADAEAABBAAAEBAAAAAAAAAACAHABBBAEAAABCBAAAAABBBBFAAAAAAAAAAAAAAAAAAAHBLAAAAAAAAABBBACADAAAABFAA',
  'AAAAADACAAAAADACACCBABBBAJAEBHAGBBANAAEFAAAAAAAAABBBAAAAAJAEBBAAAAAABBAAAAAAAAAJAPBBACAHABBBAGAA',
  'AyBBCLALAGAEAHBGAOBBABCBAHBLABCBAhBBBFAAAAEFADACABCBAAAAAAAAAEAAACDDCIAIBBAABFAAAgCBAEAAABBBADAC',
  'AACFBBAACIAIAAAAAAAAAAAAACAHCIAIAAAAAOBBABCBABDBANAAABBBAAAAABBBAVBBAAAAAHBLAAAABBAAABBBAAAAAAEF',
  'AAAAAJAEABCBABBBADACAEAAAAAAAAAAAAAAAAAAAAAAAAAAAGAEABBBAAAAABCBAAAABFAAAAAAABCBAGAEAAAAANDBAAAA',
  'BBAKABBBADACABBBAAAAAAAABFAAABCBAGAEAGAAAAAAAAAAAAAAAAAAARCBAAAAAACFAAAAABBBAzBBAAAAAAAAAAAAACFH',
  'CIAIAJAEAJACACAHADACAAAAABBBAAAAAAAAAAAAAHBQAAAABFAAABBBAEAAADACABBBABCBBBAGAbCBAkBBABBBABCBAKBD',
  'AAAAAAAACIAIAHBQAAAAAAAAAGAEBBAGAAAAADACBBAAAAAAAAAAAAAFAVBBAEAMAAAABBAAAAAACLAPAJAEAGAAAJAEAAAA',
  'AAAAAAAACIAIAEAAAAAAAJAEBFAAAAAAACDDACAHAAAAAAEFABBBAAAAACACACACABBBABBBAAAAABCBAAAAC+ASBFAAAAAA',
  'ADACBBAKADDDAJAEBFAAAAEFAACFAAAAAAAAACBDAAAAAACFAAAAABBBAAAAABBBAAAAAJAEABCBAgBBCIAAAAAAAoBBAJAE',
  'AGAEAGAEABBBAAAAADACA3BBAAAAADACBFAAAAAAAxDBAAAACIAIAMBDAAAAACDBABBBABBBAAAAAEAAAAAAABBBAAAAAHDB',
  'ACACAAAABBAKAGAAACADAEAMADCDAABBAAAAAAAAAAAABBANADCDAAAAACADAAAABBAAAMBDAAAAAHBGAHBGBBANAAAAAAAA',
  'BBAGAAAAAHEQACFHAAAAABBBABBBCIAIAHBGACACAAAAAAAAAAAAAGAEAAAAAAAACLAPANAAA2HAADACAAAAAXBBAAAAAAAA',
  'AMBDBBAABHAGCIASBFAAAHBLAAAAABCBCLALAJAAAAAAAuBBAyCBAHBLACACAAAAABBBABCBAEAAAHBGAAEFBBANABBBADAC',
  'AEAXAAAAAAAAAGAEAAAAAEAABBAAACADBBAAABBBAACFAAAAACDBAAAAAAAAAEAAAAEFAAAACIAIAOAABFAAAACFAAAAAGAA',
  'AAAAAGAAANDBAABBAHBLACFHAEAAADACAAAAACAHBBAAAAAABBAKAAAAABEOBBAAAAAAAAEFBFAAAAAABBAAAAAAAAEFACCD',
  'AoCBABBBAAAAAAAAABBBAAAABFAAACDBACACADACBBAAABCBAAAAACCDBFAABBAKAAAAAEAAABBGADACADACAAAAAAAAAAAA',
  'AHBGAAAACIASAAAAACAHABCBBBAAAAAAAAAAABBBBBAAADDDCIASACAAAAAAABCBCLAAACDBAHBGBBAKAACFADACAAAAAAAA',
  'ACAAACACAnCBAAAAAAAAAEAMAAAAAwBBABCBAAAACIAIAEAAAAAACLAPBBAABBAAAEAAATCBAAAAAJAEAAAAADACAAAAAAAA',
  'AAAAABCBAAAAABCBAGAABBAAAAAABBAAAAAAADACAwBBAEAAAAAAAAAJAAAAADACAGAABBAAAAAAABBBABBBAAAACLALAJAE',
  'BBAKAAAAAAAAACACAAAAAAAAAHEAACAHAAAAADACACAAABBBAAAAAAAAAAAAAAAAAHEAAAAABFAAAAAABFAAABCBAAAAAAAA',
  'AEAAAAAAAJAEAJACAHBGABCBAXCBADACACDDAHCGABBBAABBAAAACIAIABCBAAAAAAAAAHBGAJAEAAAABHAUACAHAAAAAAAA',
  'AHBLAAAAAAAAAKDDAGAAAHBGAGAACLAPBFAAAhBBAaCBBFAAABGRABBBAAAAABBBBFAAAAAABFAAABBBAAAAAHCGAAAAAAEF',
  'ABBBADACABBBBFAAAEAMAAAAAEAAAHBGAAAAABCBAAAAAAAAApDBAAAAAAAJADACBBANAAAAAAEFABCBAAAAABBBAAAAAEAA',
  'AAAAAAAAABBGAAAAAAAAABCBAAAAAAAABBANARBBAAAAAAAABBAAAAEFAOBBAGAAAAAAAAAAACACADACAUBBAAAAAAAAAACF',
  'AAAAABBBAAAAApCBAEAAAAAACvAAAAAAADACAHBGAEAAAMBDBFAAABBOAHBGADACAAAABBAKACAHAAAAAAAAABBBAkCBAAAA',
  'AzBBAAEFAAEFAEAMAEAAAAAAABCBACACAEAMABCBAAAABFAAAAAAAAAAABBBABCBAUBBACAHAAAAAAAAACACAAAAAHBGACFH',
  'AAAAADACACADCIAAAAAAAAAAAAEFABBBAEAMAEAAAaBBAHBGAJAAACADAqBBAHBGACACADACAAAABHAAAHBGAGAAAAEFCIAI',
  'BFAAAAAABFAAABCBA1CBABBBAGAQAEAAAHBLAgCBAAAAAGAEABBBAAAJAAAAABBBABCBADACABBBAAAAADACAAAABBAAAAAA',
  'AAEFBBAAAAAAAAAAAAAAABCBAKDDCLAPAAAAACCDAAAABBAKAAAAAAAABBAAAAEJAAAABFAAACACAAAAAAAAAAAAAJAAABEO',
  'AuBBASBBAAAAABBBAXBBANDBACATAAEFAAAAADACAAAABBAAAAAAAHBGAAAAAGAEAAAAABCBAAAACIAIAAAAAjBBAAAAABBB',
  'ABBBAAAAABBBAZBBAAAAABCBABBBCLAPAAAABBAABBAAADCDAHCLCIAIABCBAAAAABCBAAAABBAAAAAAABCBADACAYCBAAAA',
  'AGAABFAAABBBABBBAGAAAAAAAAAAACACAHBQAEAAAXBBBBAGAGAABBANAAAAACAHAGAEACAAABBBABBBAAAAABBBAJAAAAAA',
  'ACACCLAPAAAACIAAACACAKCDAAAAADACAAAAACAHAAAAAGAEANAAACAHAAAAAJACAAAAAEAMAAAABHAGABCBAKDDBFAAAKCD',
  'AAAAAAAABBAKAAAAAAAAAAAAAAAAAAAACIAIAGAEAAAAAHBGAKCBABBBAAAAACADAAAAAAAAAJAEAAAABFAAABCBABGRABBB',
  'AAEFAcBBAAAAAGCBAAAAAAEFAJACBFAAAHBLAAAAADACAEAMADACAAAAAAAAAAAAAAAAABCBAAAAAHBGCLALAEBAAiBBBHAU',
  'AAEFABBBBBAAAEAAAcCBAAAAAAAAAAAJAAEFADACAAAAADCBAAAAAiBBAAAAAHEOAAAAACACADACAAAAABBBAQDBADACACDC',
  'AAAAABCBBFAAABBBAEAAAAAAAAAABBAKAAAAABCBAAAAADACACDDAAAAAAAAAAAJAAAAADACAAAABBAAAAAAAEAAAJAEABBB',
  'BBAAAAAAAAAAAGAAABBBAJAEAEAAAAAAAJAEAAAAAAAAAqBBAGAECIAIADACABBBAAAAAGAAADACACACADACAACBABCBAAAA',
  'ARCBAAAABBAAAAEJAAEFAAAAAbCBAAAABBAAAAAJAAAAADACABBBAAAAAAAJABBLAjBBAAAAABCBAEAAAAAAADACABJOAAAA',
  'AWBBAAAAANILABBBBBALAAAABBAAAAAAAAAAAJAYAAAAABCBBHAAAGAAAAAAACIHABBBBFAACIAIAAAAABBBBFAAAAAAADAC',
  'AEAAAAHAAAAAAAEFAPCBABBBAAAAAgCBAAAAACFHANCBADACAAAAAKDDACACAHCGAHBQAAAAACACAGAECIAABFAAAYCBAEAA',
  'ABCBAJACAAAAAAAAABBBAMBDAAAAAGAEBBAKAAAABFAABFAAAUBBAAAAACAHBBAKAAAAAAEJAAAACIAIABBBAGAEAAAAAKDD',
  'AEAAA4BBABBBACAYABBBAGAAACAHCLALAGAAADDDAAAAADACCLAPAAAAAGAEAEAMBBAAAJAEAABBAAAJADACAAAAAAAABBAA',
  'AAAAABBBACDCAAAAAMBDADACAGAEAAAAAAAABBAAAHBLABBBAAAABBAKAAAABBAACIASABBBAAAAACFHAAAAAAAAAJACAAAA',
  'ACADABBBABCBAAAAADACAAAJAZCBAAAAAAAAANCBAAEFAAAAACAHAAAAACACCIAIABBBACCBCIAICLALCIAICIAIAEAAAeCB',
  'AAAAABBBAJAEAAAAAAAJAGAAAAAAABBBAAAAAAAAAAAAAJAEBBAAAGAAAJAEACAHAACFAAAAACACAVBBABBBACAHAHBQACAH',
  'AAAAAAAAAAAABBANAAAAABEOAAAAAAAAABBBAJAEACBDAAAAACACAAAAAsBBAAEFABCBADACAAAAAKCDAACFAAAAAmDBAAAA',
  'CIAIABBBAfAAAAAAAAAAAAAAABBGAAAAADACAAAAAGAEAHBGABCBAMBDAAAAAAAABFAABBANAAEFATBBAGAABFAAADACAaBB',
  'ABBBAAAAAJACAEAAAAAAACFHBBAKCIAIBBAAAAAAABBBACACAAAABBANAnDBAGAEAAAAAEAMCIAAAAAAABBBACAHAYBBAGAE',
  'AAAAACACABBBAAAJAAAAAAAAABBBBBAKAAAAABBBABBBBFAAAAAJAAAAADACAAAAACAHAEAAABBBAABBAfDBAAAAAAAAAxDB',
  'ABCBAAEOADACBFAAAAAABBAGAAEFAAAABBAKCIAIAAAAAAAAAAAAAHBGAAAAAHBQCIAIAJAEABBGADDDABCBAAAAAAAAABCB',
  'ABBBAAAAAAAAAGAAACFHACDDAAAABBAAAAAAACDDAAEFAJACABCBCIAIAJAEAAAAACAHAAAAAAAAABBBCLAPAJDBBBAAAJAE',
  'AACFAAEFABCBABEOAAAAAAHAAAAAACDDACAHAAAAABCBAAAABHAGADACAAAJADACAAAAAwCBAJAEACACCIAIAQDBAKBBACAA',
  'BBAAAAAAAAAAAAAAAYBBAEAAARBBAAAAAAAAAACFABBBACCBACDCAAAAARBBAAAAABCBAAAABBAAAAAAAAAAABCBABCBACBD',
  'AHBGAMDBAAAAABBBABBBBBAAAXBBAAAAAAAAARBBBHAGBBALABCBBBAKBBAKBFAAAAAAANAAAAAAAAAAADACADACCIAIABBB',
  'AGAEAJACAGBBAsCBAAAAAKDDBFAAAAAAABCBAWCBACAHAAAABBAAAAAAAJAEAEAMABBBCIAIAAAACIAIAAAJAGAAAACFAYBB',
  'ABBBAbCBAAAAABCBACDBAAAAABBBAGAAABBBAAEFAAAAAAAAAHCGAABBABCBAAAAAAAABBAACIAIAEAMAAAAAACBBFAAAAAA',
  'BFAAAgCBCIAICIAIAAAAAKCDAAAAAAAAAAAAAcBBAJHEASBBAEAMBBAAAAAAAAAAACDCAAEFAAAABBAAAAAAAEAAAHBGBBAA',
  'CIAIBBAKADACBBANABCBAAAAAKBDABCBACACAEAAADACAAAAAJAACLAPBHAGAAAABBAAABBGAEAAAbDBAEAAA7CBAAAABFAA',
  'AAAAAAAABFAAAAAAACAWAAAAAJAEAAAAACFHAGAEAAAABFAAAAAAAAEFAQDBAjBBAAAAAAAABBAAAAAAACAHAAAAAEAMAAAA',
  'ABBBABCBATBBAJFAAEAAADDDBFAAAAAAAAAABFAAABBBAHCGAEAAAGAAAKDDCIAIAHBGCIAIADACAGCBAmCBABBBBBAABBAA',
  'AEAMAAAAACFHBBAAAAAAABBBAAAAAjBBABBLACAHAAAAAAAAAAAAAAAAACAAACFHABBBABBBAAAAAEAMAGCBAAAAAAAABBAK',
  'CIAIABBBBBAAABBGAAAAAAAABBANAAAAAAAAAEAAACACAAAAAAAJAAAAAiBBCIAIABBBBBAAANDBBFAAACCBAKDDABBGAaBB',
  'AAAAAAAACIAICIAIABBBACFHB8AABFAAAAAAAAAABBAAABBBAAAAABCBABBBAAAACIAIADACACAHABBBAHBLAAAAAAAAABBB',
  'ABBBABBBAAAAAGAEAAAABFAABBAAAKDDBHAGAGAAAGAEADACAAAAAEAMAAAAANAABHAGAAAAAAAAAABBAAAABHAAABCBAGAE',
  'CIAIAKDDBBAKACDDAAAACIAIAAAAAAAABFAAAAAAAAAACIAIABCBAAAACLAAAAAAABBBAJAEAAAAAAAAACAHABBBAAAAAGAE',
  'AACFACALABCBAAAAAAAAAGAZACADAAAJAeBBABBBABBBADACBHAGAGAAAAAAAGAAAAAJAAEFAJAAACACBHAGAAAAAAEFAmDB',
  'ABBBBFAABBAGBBAKAAAAAAAAABBBAAAAAAAAAAAAAAAAAAAAAEAAAEAMABBGAAAAAwBBAAAAAEAABFAACIAIAGAEABBBABBB',
  'AAAAAAAAAEAAAAAAACAHABBBABBBAAAAAJAEBBAAAAAAABBBAhCBAGAEAAAAAAAAA7DBASBBAAAAAAAABBAAAAAAABCBAGAA',
  'BFAAAPBBAJAEADACAOAAAJAEAtBBBBAKBBAaAEAMADCDABCBABBBAqCBBBAAAAEFABBBACFHAJAEAhCBADCDAOBBAAAAAEAA',
  'AKBDAAAAABCBAAAAAAAAAAAABBAAAKBBBBAAACACACFHAAAAABBBAAAAACCDAAAAAGAEAEAMBHAGAAAAABCBAGAeAAAAAJAE',
  'AHBGBFAAADDDAACFCIAIACACBBAAABBBAAAAABCBAAAABFAAAACBABBBAAAAAAAAAJAABBAAABJOBBAAABBBAAAAAAAAAAAA',
  'AAAABFAAADACAAAAABCBAgCBAAAAAAAAACATACACAGAEAAEFAOBBCIAIAAAABFAACLAPBBAABFAAAAAJAAAAAAAAANAAABCB',
  'AAAAAeCBBFAAABBBCLAAACACBFAAABBBAAAAAGAAAEAAADACAAAAABCBAAAAAAAAABBBAAAAACAAACAHAAEFAGCBBFAAABEO',
  'AAAACIAIAGAAAHBGAKDDACAUAWBBBFAAACBDAEAAABCBAAAAAEAAAAAAADDDAAAAAAAAAACFBFAAABBBBBAGBBAKBHAGAAAA',
  'BBAGACAHAUBBAJAEAAAAAGAAAKCBACFHAAAAABBBAOCBABBBAAAAAAAAAEAAABBBABCBAGAEAKCDAHBGAAAAAAAAADACAAAA',
  'AAAAAAAAAAAAAAAAADACAAAAAAAAAAAACIAIABBBAAAACLAPBFAAAAAAAAAAAJAEBBAAAAAAABBBAAAAAAAAAAAAADACCIAI',
  'ADACAAAAAGAAACACAEAMBBAAAAAAAGAEAAAAAAAAABBBACFHAHBGCIAIAAAAADACABCBCIAIAEAAAJACBFAAASBBAAAAAAAA',
  'ABBBAAAACLALBBAAAKDDAAAAAAAAABBBAEAAAAEFAAAAAAAAAABBAXCBADDDARBBAKDDAHBGABBBAKDDABBBBBAABBAAABCB',
  'AAAAAEAMCLALCIAIAHBGAAAABFAACIAIAAAAABGRADACACACAEAABFAABFAABBANAAAAAAAAAAAAAGAEACACABBBAEAAACFH',
  'AfDBAJACAAAAAAAAAAAAAJAEAAAAABBBBFAAAEAMCvAAAEAABBAAABEOAAAAAmDBAJAEAAAAAZBBBFAAABCBAGAAABBBBHAA',
  'ACCBABBBAACFAAAAAAAAAAEFAGAEAAAAAGAABBAAABBBAAAAAJAEABBBAAAAAAAAAAAAADACACAHAAAAAAAAAGAEADACACDB',
  'AAAAABBBBBAKBBAAAAAABBAAAAAAAEAAAHBQAUBBAAAJAAEFACCDAOBBAEAABBAAAEAAAAAAA5EAAHBGAAEFABCBABCBAAAA',
  'AAAAAAAAAAEFAAAAACAHAgBBAEAAACAHAGAAAAAAADACAAAACLAAACCBAAAAAJAEAoBBAAAABBAKACFHABCBAAAAAAAAAxBL',
  'ABBBAJAAAMBDAAAABHAGAAAAAEAAAAAJAAAAASCBACACACAHAACFABCBAAEFABBBABBOABBBACDBCIAIAAAACvAAAKDDABBB',
  'ACAHCLAPAMBDAAAAAAAABFAAABBBACACAAAAACACADACAAAABBAAABBBAAAAAOAAAGAEArBBAAAAABBBAGAEABBBAAAAAHCG',
  'BFAAAAAAAAAAAAAAAAEFABCBAAAABFAAACADAAAAAAAAAAAABFAAAMBDABGRACACAAAAAAAAAACFAGCBASBBABBBBBAACIAI',
  'AAAAAfCBAAAAACACAAAJADDDAAAAAAAABFAAAaBBABBBAAAACIAIAJAEAHBLAAAAAAAAAAAACIAIABBBAJAEBBANBFAAAGAE',
  'ACACAAEFADDDAAAAACAHAAAAACADAAAAAAAAAAAAAGAEADACAAAAAAAABFAAAJAEAAAJAAAAACAHAAAAAAAAABBBAAAJAAAA',
  'AAAAAKDDBBAKABGRAaBBCIAIA1DBBFAAAAAAACAHAGAAA1CBBFAAAAAAAGAAAGAEAyBBAAAAAAAAABBBBBAABHAGAHEOAAAA',
  'AAAABFAAAAAAAAAAAAAAAAHAAAAAAAAAAAAJAXBBAYCBAbDBACAHAAAJAGAEAAAAADACArBBAAAAB/AAAAAAAAAAACAHACCB',
  'ABCBAAEFACDDADACAAAAAAAAACFHABBLAAAAAAAAAAAABFAACIAIBFAAABBBADDDAAAAAAEFABCBAAAAABCBBBAKADCDACAH',
  'AAAAAAAAAAAAABBBBBAAACAHA9BBAAAAABBBAAAACIAIACAAAAAAAKBDCIAIAAAAAJACABBBACACAGAAASCBAxDBAHBLBBAA',
  'AAAAAAAAApCBAGAEABEOACFHAAEFAAAAAAAAACCDAACFBBANAAAABBANAAEFAAAAAAAAAGAEADACABBBAAAACLAPAeCBAAAA',
  'AAAABBAAAGAEAEAAAGAEAKDDAAAAABBBAAAAAJAEAEAAABBBAAAAArBBAAAAAGAEAHBGAEAAAAAAAAEFAAAAACACABBBAAAA',
  'ABCBAGAEABBBAHBQABBBBHAGAAEFACADADDDAEAMBFAAACAHCIAIAtBBBBAACIAIAJAEAAEFABBBABCBABBLAAAAAEAACIAI',
  'AAAAABBBACDDAAAAAAAABBAKABBBCLAPABCBAHEABBAKBHAGADACABBBAAAAABBBCIAIAAAAAAAAADACAHBGAAEFAAAAAGAA',
  'AACFAJACAAAAAEAMABBBABBBABCBBFAAAAAAAEAAAAAAADACAGCBABCBABBLAEAMABBBAAAAABCBAHBGAJAEBBAAAAAAAAAA',
  'BBAKAAAAAGAEAAAABBANCIAIAHBQABBBADACAAEFAAAAAKDDABCBAAAAACACARBBACACADACBHAGAAAAAAAABBAKAACFAHBQ',
  'AEAMABBBAAAAABBBAEAAACACABCBAAAAACACABBOCIAIBBAAAAAAAGBBABBBAJAAAkBBAAAAAEAMABCBAAAAAGAEAAAAAHBG',
  'ADACAAAAAAAABFAAAAAAACFHAAAAACCDAUCBAAAACIAIABBBAoBBAABBAAAAABBBABCBABBBAEAAABBBAKBDADACABBBBFAA',
  'ABCBAACFAKDDCIASAAAAAAAAACBDAKDDAUBBAAAABBAAAAEFAAAAAEAMAAEFAEAACIAIABDBAAAAACBDAAAAAAAAAJAEBFAA',
  'AEAAAGAEABBBBFAAAAAAAAAAAEAAABBBBBAABBANBFAAABCBAAEFAEAAAAAAAKCDAAAAAAAAAAAAABEOAaCBAOCBAAAAADAC',
  'AnCBAAAAADDDABBBAACFAVBBAWBBAAEFAAAAAGAAABBBBBAAAXCBAAAAABCBACCBABCBAAAAAAAAADACAAAAA0ADAAAAAAAA',
  'AAAAABBBAEAACIAIADACAAAAACAWASCBABCBABCBACFHAAAAACCBBBAAAAAAAnDBCIAIAAAABBAKABCBACAHCIAIACAHCLAL',
  'AAAAAAAAAAAAAJAEANDBBFAAAAAAAAAAABBBAAAAAAAAAAAAAEAABFAABHAGBBAAAyBBAAAAAAAAAAAAAAAAACAZAAAAABBO',
  'AHBGAKBDACAZAAAAABCBACCDAJAEAHBLAEAAAEAMCIASAHBQAGAEABBBACAAAAAAAAAABFAACIAIAJAEABBBAAAABBAABHAG',
  'AJAEAAAJAMBDAAAAAAAAADACAEAMAJACABCBAJAAAEAAABBBAAAAAMBDACACAAAJADACADDDAAAAABBBACAHAAAABBAAABBL',
  'APCBAAAAAEAMAEAMBFAAAEAMCIAIAjBBAAEFABEOAAAAAlALAGAAAAAAAAAAAJAEADACAAAAAAAAAKDDAEAAAGAVABBBAMBD',
  'AeBBAAAAAAAAADAAAACFABBBAGAEABBBAEAAAAAAAAAAAAAAAAAAAAAABFAAADACAAAAAkBBABCBACAHCIAIBFAAABBGAJAE',
  'AAAAACAHAAAAAOAAABBBCIAIAZCBAQDBAAAACIAIABCBAAAAADAAAAAAAAEFAAAAAyBBAAAAAAAAAAAAAAAACLAPABBBAAAA',
  'AJAEAwBBAAAAAGAAAJAEABBBAAAAAGAAABCBAACFAJAYAAAJAAAAACAHBBAKABBBAAAABFAAADACABCBAAAAACDBCIAIB8AA',
  'AgBBAJAEAAAAABBBAAAAABBBCIAIAEAMABCBAAAAADACABBBAAAAAHBLAAAABBAAAGAAAEAAAAAACIAIBFAAAAAABBAABFAA',
  'AAEFABBBAAAAAGAAAAAJAAAAACACACBDAJAEAAAAAJAEABEOCIAIBBAAAJAEBBAAAKBDAAAAAjCBAEAABBANAACFAAAAACAH',
  'ATBBADACAHEAAAAAABCBAAAAAACFAEAAAAAAABBBAMDBABKAAAAAABCBAGAZAeBBAGAEACFHAAAACIAIAxCBBFAAADACCIAI',
  'AACFADACABGRABBBAHBLABCBAAAAAEAAADDBABBBAJAEAJDBABCBAGAAADCDAAAAAAAAAAAAAAAAACCBBBANACFHAmDBACAH',
  'AYCBAPBBAAAAAAAAAAAAAGAEBBANAAAABBAABBAKBFAAAAAAABBBAAAAABBGAAAAABBBAAAAAAAAANDBABBBAAAAAAAACIAI',
  'ABBBADACBBAKBBAAAJAEADDDAAAAAAEFCLALCIAIACFCAHCLAMBDABBBAYBBBBAAAAAAAJAEBHAGAHBQAAAAABCBAAAAAJAE',
  'AAAAAlDBAAAAABBBBBAAAAAAAAAAAAAAABBBAHBGABCBAGAEAAAAAJACAAAAAACFAAAJAAAAAYBBABBGAEAAAKDDADACBFAA',
  'ACCDADACACFHAAAAAAEFAAAAAACFABBOCLALABCBABBGAAEJABBBAACFACDDAKBDAAAABBAKCIAIABBBAAAAABBBAnDBAHBG',
  'AMBDAAAAABBOBBAAAAAAADACACAHABCBADACAAAAABBLAAAAASBBAGAEAAAAAAEFBFAAAbDBADDDAJAEAAEFAAAJCLAPABBB',
  'AGAAAAAAABBGAAAAABCBAAAAAAAAABBBAACFAAAAAAAAAAAAAKBBAAAJADACAAAAACCBAAAAAGAAAAAAAAAABBAAA7DBADAC',
  'ACATADACAAAAABCBAcCBACCDAAAAAAAAABCBAKCDAAAAAEAAAAAAAAEFAAAAAAAAAAAJBBANAAAAABEOAAAAAAAAAAAAABBB',
  'ABBBAAAAAAAABBAKABBBAACFAAAAABBBBHAGBFAAAHBGAEAACIAIAAAAACAHAkBBAAAAAAAJACAHADADAGAEADACCLAPAEAA',
  'AmDBAEAAABCBABBBADACACCBAAEFAAEFBBAACIAIAHCGASBBAAAAABBBAAAAAiCBAAAAACDBAAAAABBBAAAABFAAAGBBA0AD',
  'AAAAAGAAAGAECIAIAAAAABBBAAAAACCDABCBAAAACIAIAAAAAGHAAAAAACFHABBBAAAAAEAMAAAJACACAAAAAEAMBHAGBBAK',
  'AAAAAAAAAAAAAAEJABBBBFAAAkCBAAAJAwBBABCBCIAIADBDAKDDAwBBADACABBBACBDABCBAfCBABCBAEAAAAAACIAIAAAA',
  'AEAAACDCAGAEAAAAAEAMAGAAAMBDACDDAeCBAAAAAHBQABDBAJAECIAIACACABBBAAAAAAAAAAAAABBBABBBAHBQACFHAEAA',
  'AAAAAHCGBBAKAABhAAAAABBGAGAEBFAABBAAAGAEABBBAAAAAAAAAAAAAEAMAAEFABBBACACAAAABFAAABBBAAAAADACADAC',
  'AAAAASCBABBBAAAJAACFAAAAAAAAAAAAAYEAACFHAAEFAAAAACCBAGAEAAAAAAAACLALCIAIABCBAAAAABBBACACAEAABBAN',
  'AAAAAAAJAWCBAJAEAAAABBANA7DBADDDABGRAGAAABBOAHCGAKCDAAAAAJAEAAAAACAHAAAABFAAAAAAAAAAAAAAAJAEABBB',
  'ABBBAACFAAAAAHBQAAEFABBBAJAEAAAAA0ADATBBAJAEAHBLCIASABBBACFHAAAABBAAABCBAAAAAEAMBBAAABBBBBAKCIAI',
  'AAAAAAAAABBBAAAACIAIAKCDAAEFAAAAAAAAAAAAAAAAAAAAAAAACIAICIAIAKDDABBBBFAAAGAAAAAJABBBAJAEAAAAAAEF',
  'AAAAAAAAABBBBBAKACFCACAAAAAAACAABBAKAAAAAAAABBAAAEAAAHBGBBAAAHCGACBDAAAABBAGAHBQAAAAAAAAAAAAAGAA',
  'ABBBCIAAAAAAABCBAAAAABBBAAEFAAAACIAIAAAAABCBAHBQCLALAAAAAhCBAMBDAAAAABCBAACFABBBAAAAABBBAAAAAAAA',
  'AEAMAAAAABBBBBANAAAAAJAEAAAAAAAAABBBAAAAADACAHCGAHBGAAEFAAAAAAAAAAAAAEAAAAAAACAHAAAJAAAAABBBAAAA',
  'A0ADAAAAAAAAAAAAAAAAABCBACADAAAAABBBAAAJAEAAACBDABBBAAAAABBBAJAEAJAEAEAMAAAAAKCDAAAABBAAAGAEAMBD',
  'CIAAAAAAAEAABBAAAnCBAAAAAHCLAAAAAAEFAAAABBAKADBDAAAAAEAAAAAAAACFACADACACBBANACAHBBAAACAABFAAAEAA',
  'AJAEAAAJAAAABBAKAWCBAAAAAGAUAJAEAAAABFAAAHBGADACAAAAAKDDBBAKAACFABBBAAAAACACAMDBABBBACFHAUBBAGAE',
  'AAAAAAAAAAAAAACFACAHAAAAACFHCIAIAAAACIAIAMDBAAAAAEIAAAAAAMBDACAbAHBGAGAEACFHAAAAAHBGAAAAACCDApCB',
  'CIAIBBAAABBBACAHBBAAANAABFAAABBBAAAAABBBAAEFAAAAARBBBFAAAAAAAAAABFAAAAAAAEAMBBAKABBOAAAAAAAAAJAE',
  'AAAAABBBBFAACLAPAAAAAAAAAEAMBFAGABCBAAAAAAAAAlDBAAAAAHBGCIAIAAAAAAAAAKBDBBAKAGAEAAEJADDDABBBADAC',
  'AEAACIAICIAIAAAAAAAAAAAAABCBADACAAAABBAACIAIBHAGADDDABCBAVBBAJAAAAAAAAAAABBBAyBBAHEOAAAACLAPAAAA',
  'AEAMAAAABFAAAKDDAJAEAPBBADACAlCBBBANAAAAAAAAACAHAHBGAAAAAAAAABCBAmDBAAAAABBBAAAABFAAAAAAAAAABFAA',
  'AEAAABBBAAAAAAAAAAEFAAAAAXBBAGAEBBAKBFAAAHCLBFAAAAAAAAAAAAAABBAKACAHBBANAJAEAAAAAHBGBBAKCIAIACFH',
  'AEAMABBBAAAAAAAAAoCBBFAAAAAAAGAAAAAAAJAEAAAAAKBDAGAEBBAAABBBAWBBAGAEBBAAABBBAJAWACAHAAAAAAAAAGAE',
  'ABBBACAHAAAAABCBBBAAAYBBAAAAAAAAADACAAAAAKBBAMBDAAAAADCDABCBAEAAAAAAAAAJAAAAABBBAqBBAiCBBFAAACAD',
  'ADACAAAAAEAAABBBAEAMAAAAABBGABIAASBGAKDDBBAAAAAAAAAAABBBAEAMAEAAAAAABBAGAJAEAAAABBANACAHAJAEAAAA',
  'AJAEAAAJAAAAAAAAAACFAAAAAAAAAAAAAAAAABBBAhCBADDDBFAAACACAAEFAAAAAGAEADACABBBADDDBBAAAKDDADACAAAJ',
  'AAAAAAAAABBBABGRAAAABBAGACAHAWBBABBBBFAAABBBAEAAAAAABFAAAAAAAAEFAAAAAAAAAeBBAHBGBBAAAAAAAAAAAHBL',
  'AAAAAEAMABCBADDDABBBAAAAAAAACIAIAAAAAACFABBBBBAAAAAABFAAAKBDAAAAAEAAABCBAHCLAAAJAAAAADACAGAEABBB',
  'ABBBAAAAACAHACACAEAACIAIAGAEAHCGABBBABBBAEAMAAAAAAAAABBBAAAAAXBBAAAAAAAAAACBADACAABBBFAAAACBACBD',
  'AAAABFAAACAHAAAAAAEFADACAAAAACAHACCBBBAAAnDBAAAAAAAAADACAAAAAVBBAEAAAAAAAAAJBBAACIAIAAAAAaBBAAAA',
  'ACAHADDDBHAGAAAAADACAAAAABCBABBLABBBBBAAAAAAAABAAEAABBAAABCBACCBAiCBAAAAAEAMCIAIBFAAAAAAABBBAgCB',
  'ABBBBBAAAKCDAAAAADACBFAAADACBBAAAAAAAAAAAhBBAAAAABBBAjCBBBAGBFAAAMBDAGBBAAEFADACA9BBANAAAAAAAAAA',
  'ADACBBAAAAAAAAAAAAAAABBBAAAAAAAAAAAABFAAABBBABEOAAAAAHAQAAAAABCBAXCBAGAEABBBAAAAAWBBADACAAAJAAAA',
  'BBAKBFAAAAAAAHAQAACFCIAIAAAABFAAADACAxAGBHAGABBBAHBLAAAAAiBBA0ADABCBABDBAAAAAKCDAMBDCLALAYBBBBAA',
  'AAAAAAAAAAAAADACABBBABBBAEAAADACABBBABEOABCBAAEFAAAAAAAAAAAAASCBBBANABBBABBBAAAJACDBAHBGBFAABBAK',
  'AAAAA9BBBBAKBFAABBAKABBBAAAJABCBBBAGABCBAAEFAAAAABBBBFAAARBBAGAECLAPADDDAAAAAfDBABBBACACAABBAAAA',
  'AAAAACACAJAEABCBAAAAAgBBAJAAAMBDACAHABBBABCBACACBBAKAAAAAJAEBFAAAHBGAAAAABDBAJAEBBAAAHBLAAAAABCB',
  'AAAAAAAAADACCIAIABBBAAAAACDCABBBABBBAAAAAAAAATBBCIAIAEAAACFHAAAAA6BBBFAAAHBGAACFBBAKABCBAAEFAAAA',
  'AAAABBAGAAAAAHBGAAAAAAAAACAHAHBGAHBLBBAAAKCDAAAAAAEFACAHACACAEAAAAEFAAAAAAAABHAGABBBAAAACIAIACCB',
  'ABBBAJACAAAAAAEFACAHAJAEAAAAAAAAAGAAADACADACADACAAAAABBBABBOAAEFAAAACLAPAAAABFAABBAAAxCBAAAAACDB',
  'ABBBCIAICIAIBFAAABCBAAAAAAAAABCBAGAAAAAAAAAAABCBBBAABFAAACCBAAAAANCBABBBABBBADACBBAAAHBLBBAGACCB',
  'BBAAABCBADACAJAEAAAAABBBAAAAACACAAAAAAAAABGRAACFAAAAAOCBACACBBAAABBBCLAPAAAAAAAAAAAAAAAAAGAEAHCG',
  'AAAAAEAAABBBAEAMADBDAAAAAAAAAJAEAAAAAJAEAAAAAAAABHANABCBAEAAABCBAGAABBAAAsBBAAAAAAAAAHCLAPCBAAAA',
  'AAAAABBBAAAACIAIAHEOAAAACIAIAAAAAnDBAEAAAHBLAGAEBFAAAAAAAAAAAAAAACACAAEFBBAAAEAAAKDDCIAAANCBABCB',
  'ABBBBBAAAoBBABCBAEALAAAAAAAAA1CBBBAAACACCIAIA0ADANDBABCBAKDDABBBBBANAAAAACACABBBAAAAAGAEAAAABFAA',
  'ABEOAACFAAAAABDBADCDACAHAHAQAAAAAAAAAKDDBBAAAAAAAAAAABBBAAAJAAAAAPBBACADABCBANAAACFHAAAAAAAAACAH',
  'AHBGBFAAAAEFABBBABCBAdBBACAHABBBAAAAAACFAAAACIAIAAAAAAAABBAAACCDAAAAACDBAAAAABBBABBBAEAAADACCLAP',
  'BFAAAAAABFAAAAAAAAEFACACABCBAtCBAAAAAAAAAAAAABBBCIAIABBLAAAAACCDAEAMAAAJAAAAADACAAAAAAAABFAACLAP',
  'AEAMABBBADADAAEFAAAAAJAEADACAAAAAACFABBBAAAAAJAEACCBAAAAABBBAEAAAAAAADBDAEAMAAAAABBBAAEFCLAPAAAA',
  'ADACCIAIA0ADAaBBBBAGAAAAAWBBBFAAAAAAAAAAAAAAAGAEAAEJAHBLACDBAQDBAJACAAAAArBBAMBDAEAAAAAAAAAAAPCB',
  'AAAAABBBACACABBBAAEFAJAEACACAACFAAAAABCBCIAIAdBBACAHACCBAWGRAMBDABBBADACAHBLAAAAAAAAAAAAAAAAAAAA',
  'BFAAAAAAABBBABCBAAAAABEOABBBAJAEAAAAAAAAAAAAAAAAABBBBFAAAVBBCIAIAAAABBAAAAAAAAAAABCBABBGBBAABBAA',
  'CIAIBBAKAHCGAHBGAAEFAAAACIAIABCBABBBADACBBAAAcCBAAAAAEAABBAKABBLAAAAACIHAAAJABBBAAAACLAPAAAAAcBB',
  'A2AVAAAAADACADBDAGAEABDBAEAAAGAEAJACBBAKAJACAAAAACATBFAAADADAAAAAACFAEAMAAAAABCBBBAKACAHACACAHBL',
  'AHBQABCBAAAAAAAAACAHCIAAABCBA6BGAGCBAAAAA2ALBBAKAACFAAAAAAAAAAAAABBBCIAIAEAAAAAAABCBAAAJANDBAAEF',
  'CLALAMBDAAAAAAEFAAAAAAAAAAAAAHBQAnCBABGRAAAAAAAAAEAAAAEFAAAAAAAAAAAAABCBAAAABBAAABBBCIAIAAAAAGAE',
  'ABBBBFAAADACAAAJAdBBAAAAAAAAABBBAAEFAAAAAADOBFAAABBBABCBCIAIBBAAAHBGBBAAAHEAABBGABCBABBBAAAJAAAA',
  'ABBBAJAAAAAAACFHAJAEAJAEAAAAAGAAAAAAAAAAADACADACACAHBHAAAAAAAMBDABBBAAAJAAAAABBBAAAAAAAAAMBDBBAN',
  'AAAAAAAAAAAAAAAABFAABFAAAAAAAJAEAAAAAKDDAAEFAAAAAAAAACAAAGAEAAAAA3CBABBBACADAGAEAGAEAAAAANAAAJAE',
  'ABBBACBDAHBGBBANAAAAABCBAAAAAAAAABBBAEAAAHBLAAAACIAIAHBGBBAKACACBFAAABCBAAAAAACFAKBBAAAAAEIACIAI',
  'BFAACLAPAGAAADDDAAAAAAAAABBBABBBCIAIAAAJAAAAAAAAAAAAABBBACCBBFAAABBBBBAAAEAAABCLAHBQAJACABBBABBB',
  'BHAAAAAAABBBAGAEAAAAAHBGBFAAAAAABBAAARBBAAAACIAIABBBAAAAAAAABBAAAAAAAUCBAAAAABCBAAAAAAAAAGAAAGAA',
  'AGAEAAAAAAAABFAAAAAAABBBABBBAGAEAAAAAAAAABBBCIAIABBBAAAAABBBACAHABEOAPDVAAAAAAAAABBBABBBAEAAAAAA',
  'AAAAAAAAABBOAAAAAAAAACADABBBBBAGAAAAAAAAAEAAABBBAAAACvAAAAAABBAAABBBAiBBAAAAABGRABBBAAAAABCBAHBL',
  'AHCLAKBDBFAAAAAAACDCAAAAAJAEAJAEBFAAAAAAAAAAAAAAAAAAACAHACFHAJAEAJAWAAAAABBBABBBCIAIAHBQBFAAAAAA',
  'ACFHBHAGAAAAADDDACAHAAAAACFHACAHACADABCBAOBBABBBAAAAACCBAAAAABCBCIAAAJAEAAAAABBGAJAEBBAABFAAAAAA',
  'AAAAAKBBAAAABFAAAKDDAAAAACACAAAAAAAAAAAAAAAAAAAAAAAAACFHAGAAACACAAAABBAKACBDBBAAACAAACACABCBAzCB',
  'AAAJAHBGBBAKBBAAAXCBAAAAABBGBBAKCIAIAAAAABBBAkCBACFHArCBAAAAAKDDBBAAACDDAAAJAGAAAAAAAAAAAGAAAEAM',
  'BBAAAOCBBBANABCBBFAABBAaABCBABBBAJAEAAAAACAHABBBAAAAAAAAAAAAAAAAAAAABBAAAJACABBBBHAGABBBCIAIAAAA',
  'AEAMADACABEOAAAABHAAAAAJAAAACIAIAHCGBHAAAAAAAHBQAeBBACFHAGAEABBBAAAABFAAABBBAAAAACFHADACBFAAAABB',
  'BBAKCIAIAAAAABCBAAAAACBDAAAAAAIAAAAAAAAABFAAAAAABFAAAHBGAAAABBAGAAAACIAIADCDBBAAAAAABBAKBBAAAGAE',
  'ABBBACAHAAAAAbDBABCBBBAAACAHAAEFAAAAAAAJABBGABBBABBBAAAAABBBABCBAAAAAAAABBAGAAAAAAAAAAAABFAAAAEF',
  'ADACAAAAAAAACIAAACACABBBACBDBBAAAbDBADACAHBGAEAAAAEFAAAAABBBABBBBBAACLAPBHAGAAAABFAAAAAJCIAIBFAA',
  'AAAABFAAAKDDAfAAAJACAgCBAEAAAxCBAAAAAAAAAdBBABBBABBBABBBAAAAADACAAAAAEAAAGAAAAAAAAAAAEAAACFHABBB',
  'AAAAAAAAAAAAAEAMAAEFAMBDAAAACIAIAAAABFAAAQDBABCBAOAAAAAAAGAEABBBABBBCIAIAAAAAEAAAAEFABBBABCBAAAA',
  'ABCBADACABCBAGAEAHBGABCBBFAABBAKAAEFACAHAAAAADACBBAKAHBLABBOACACAAAAACACABBBABCBAKDDAAAAABBBAAAA',
  'BBAAAAAAABCBAAAAAJAEApDBAMBDAJACAJAEBBAKAAAAAAAAAACFBFAAAEAACLALAbDBAAAAAsBBAAAAABBBAHBQAAAACIAI',
  'BBAGAEAABBAAAGAEAHBQBBAAAAAAAAAAAAAAABBBACAHAEAABFAAAACBABBBApCBABBBACAHAAAAABBBAKBDAAAABBAAAoBB',
  'AAAAABBBAAAJADACABCBBFAAAAAAAAAAAACFAAAAACDDAAAAAAAAAAAAAKCDACIHAAAAAAAJAAEFCIAIAABBBBAAAAAAAAAA',
  'AWCBABBBACADAACFAcBBAEAAAAAAAJCBACCDAJAEAGCBACACAECBBFAAAAAAACFCAJAEABCBAAAAACDBBBAKBFAAAAAABFAA',
  'ADACABGRACFHAWBBABBBAgBBAAAACIAIAGAEAAAAABBBAHBLBBAAAEAMAAAAAHBGBFAABBAKBFAACIAIAAAAACACBBAAAGAE',
  'BHAGAAAAADBDAAAABFAAABBBABBBAAAAAAAJADACAEAAAGAAAAAAAAAAAAAAADDBADACAAAABBANAeBBAAAAAAAABFAAADAC',
  'ACBDCIAIACACAAAAAAAAAEAAAAEFAHBGAEAAAEAABBAAAHBGAAAABBAKAAAAAAEFAAEFABBBACACACDDAAAABBAAABBBAPCB',
  'AAAAABBBAAAAABCBACDDAAAAACBDABBBBHAGAAAAAKADBBAAAEAMAAAABBALArCBAAAABHAGAAAABBAAADACAAAAAGAEAqCB',
  'AAEFABBBAJAEABBBABBBAJAEADACACDBABBBACAHABBBAAAABBAAAHBGAAAAAAAAABGRBFAABFAAAAAAAAAAAAAABBAGAAAA',
  'AAAABFAACLAAAAAAAKDDAAAAAAAAABBBABCBAGAEAGAEAAEFAKBDAmCBAAAAABEOAAAAAAAAAGAAAAAACIAAAoCBAAAAA1AG',
  'AEAMAAAAAJAEBBAGABCBAAAABBAAACACAAAJABBBAAAAAAAAAHBGAEAMBBAAADACAAAAAAAACIAAABBBBBAAACAHAoBBADAC',
  'AgBBAEAAAAAAAAAAAAAAAAAAAAAJCLAPAAAAAAAAAJAEAAAAAAAAAAAAAGAABBAAAAAAAAAAAEAMACFHAHBGAAAAAGAECIAI',
  'AAAAAEAABBAAACAHCIASAAAABHAUAHBGAAAAAAAAADACAAAAAAAAACFHABBBABBBAAAAAACFABBBAKDDACFHAAAAABCBBBAK',
  'ABBBAJAEAAAAAHBQACFHAGAAAEAMADDDAAAAABBBAKDDAEAMAyBBABBBAAEJAGAAABBBAAAAAEAAAAAAADACAAAABBAAABBB',
  'BFAAAMBDACBDADACADACAAEJAKCDAAAAAAAAAAAACIAIACADAGAABFAAAAAAAEAAABBBAAEFAAAABBAAAHBLAsBBAHBGABBB',
  'ACAHABBBABBBAAAAABBBAAAAAZCBBBAAADDDAAAAARCBAKADAAAACIAICIAIABBBAAAAAJAEBBAAAdBBABBBAAAAAACFADAC',
  'BBAABBAKBFAAAbDBAPCBABEOAAEFAAAAACACAJAZADACAAAAADACABBBAAAAAAAACIAIADCDADACAAAAAJAEBBAKACAHACAC',
  'AEAABBAAAAAAADACBBAKAABBBFAAAHEAAAAAAKDDAAAAAHBGACFHAAAAAAAAAAAABFAAAAAAAAAAAAAAAeBBBFAAAAAAAAAA',
  'AAAABFAABBAAAGAEABBBAAAAAAAAAEAABFAAAABBAKBDAAAAACDBABCBBFAAAGAEAAAAACFHBFAABBAAAAAACIAIAAAAACCD',
  'AGAAC+ASAkBBABBBACAHCIAIADDDAAAAADACADACAJACAMBDBBAAADDDACFHABBBADACABBBAAAAAUBBAAAAAGAABFAAAAAA',
  'AAAAAAAAAAAACLAPABBGABCBAAAAADACABBLAlAGAAAAABCBAGAAAEAMAAAAACAHAKBDAAAAAAAAAACFAKBBAGAEAAAABBAK',
  'AAAABBAAABBBABBBAAAAAJAEAAAAAAAJABBBCIAIBFAAAGAAAoCBBBAAAAAAACCDAAAAAnDBAAAAAAAAAAAAAJAEABBBAAAA',
  'AAEFAAAAAAAJAAAAAEAAAAAAAGAECIAIAAAAAAAAAKDDAMBDAAAAABBBABBBCIAIAAAAAACFACAHACADAACFADACBBAAABBB',
  'ATBBABBBBBAKAAAAAAAAAJAEAAEFADBDAAAJAGAEBBAGABBBBBANBBAKAAAAAAAAAGAAAAAAAAAAAAAABFAAAAEFACCBBHAG',
  'ABBBADACACACACDDADADBFAAAEAAAAAAANCBAHBGAAAABFAAAEAAAAAAABBBADACAAAAADCDAEAAACDDAJAEAPCBAWBBAAAA',
  'ABBBAAAAAAAAAAAABFAABBAKBFAAAAAAACACADACADACAACFAEAAAAAABFAAAEAMCIAAAAEFABCBAEDBCIAIAAAAAHEAAAAA',
  'ASBBAEAAABBBBBAAAAAAAHCGAACFAKDDAAAAABBBAAAABBAaADDDABCBAHAQABCBAAAACLAPAtBBABCBAAAAACBDBHAGApDB',
  'AAAAAAAAABBBAAAAAAAAAAAAAGAEAAAAABBBBHAGACCDABCBBBAKBFAAAAAAAEAAAAAAAAAAACFHABBBAAAAAAAAAAAAABBB',
  'AAAAABBBAAAAAAAAADACADACAJACABCBCIAAAAAAAAEFCIAIAAAAABBBABBGAAAAAJAEBFAAABCBAAAABHAAAAAAAAAAABBL',
  'AEAAAAAAABBBAAAAABBBABBBADACCIAIAAAAA6CBABCBCLAPBFAAACFHACAHBFAAAEAMADCDADACACCDAAAAABCBAMDOAAAA',
  'ABBBAAAAAAAAABCBABCBACACAJACAAAJACFHABBBAGAECIAAAAAAAGAAACAHAAAAAAAAAtBBAHEOAHBGA6CBAdBBAAAACIAI',
  'AAAAAdCBACFHAAAAASCBAGAABBAAAAAAAACFCIAIAAAAAAAACLAPAGAAAhBBAJAEBBANAAAAAAAJAAAAAAAACLAPACBDAAEF',
  'BBAAABBOAAAAAAAABBAGCIAIAAAABFAAAAAAAAAAADACABBBAGAAAkBOABBBAGATAAAABBANAAAAAGBBApDBAAEJAAAAACAA',
  'AAAAACAHAAAAABBBAAAAADACAEAABFAAAAAAABBBAAAAAGAAACFHAAAAABBGABCBABBBAPBBAGAABFAAAGBBAAEFBBALAAAA',
  'ADBDAJAEBBAKAuCBAcCBADACBBAGAAAAACAHBFAAABBOAEAMAAAAABBBAJAEAAAAAOAAACADAGAEAAAJBFAABBAAABBBAAAA',
  'BBAKAAAAAAAAAAEFAAAAAHBLAAAABFAABFAABBAAAAAAAAEFAAAAAoBBAbDBAQDBABCBCIAIAEAAABBBAAAACIAIAAAAAAAA',
  'ADACCLAPAAAAAAAABFAAAAAAAAAAAsCBAAAAAAEFAAAAAHEOBBAAAXBBABCBACBDAACFABBBAQDBAAAAAAEFAAAACLALAAEF',
  'ACCDAAAAAGAEANDBAAAAAAEFAiBBBBAKAAAABBAAARBBAAAAAcBBACACABBBCLAPABBBAGAEAiBBCLALAEAMAHBLAAAABBAA',
  'BBAKABBBAHBGBBAAABBBAHBGBFAAAAAAAAAAAAAAAAAAAEBAAEAAAHCLABBBAAAABBAAAAAAADACAGAAANCBAAAAAAAAAABA',
  'CLAPAAAAAAAAADACAAAAABBBBFAAAHBGBFAAAAAAABCBAAAAADDDAAAAAWCBAAAAAAAAAEAABHAGAABBAAAAAwCBAKDDAKDD',
  'AHBGAAAAAEAMADACBBAKACAHABBBAAAACIAAAAAAAUBBAtBBADDDAAAABFAAABDBAKCDAVBBAAAAAEAAAEAAA7DBBBAAAAEF',
  'AAAAAAAACIAIABCBAAAAABCBADBDAAAAAEAMAAEFADDDBBAAAGAEABCBAAAAAbCBANCBAJACBFAAAGAEAHBGAZBBAZBBAAAA',
  'ADCDAACFABBBAcBBCIAIAAAAAGBBADACAAAAAAAJAGAAAEAMAJAEAEAAAHBQAAEFAAAAAdCBAAEFAEAMAKDDADACBBAKABBB',
  'AKBDAEAAAEAAAHBLBHAGAAAAAAAJABBBABBBAAAAAAAAABCBBHAGAKDDABCBAgBBAAAAAMBDAEAMABBBBBAAAHBLAAAAAACF',
  'AAAAACADABBBAAAAAAAAAHBLAGAEAGAAACAHABBBA9CBABBBAAAAADACAAAAAiBBBBAAAJAEABCBBFAAACACAAAAAAAAAAAA',
  'AAAACLALABBBAWBBAAAAAJAEACBDBBANAAAAAAAAAAAAA0ADBBAACIAIAtCBCIAIBFAAABBBBBAABFAAABBGAGAAAAAAAAAA',
  'ABCBAXBBAEAAAEAAAAAAAAAAAAAAAGAEAZBBANCcAJAEAAAAAAAAAAAABBAKBBAAAAAAAGAAAwBBAAAAAJCBAAAAAAAAAACF',
  'CLAPCIAIBBANAAAACIAIBBAAABBBACACAAAAADACAJACAAAAAHBGAAAAADACAAAAABBBAHCGAAAAAcBBACFHAGAEAZBBACFH',
  'AGAEAJAEAEAAAEAMABBBAAAAAAAAADACAJAAAAAAAHBGADACAAAAAAAABBAAABBBAcBBBBAGAPCBCIAIABBBAAAAAAAAABEA',
  'AAAJBBANBBAKAAAAAAAAACDCCLAPAAAJBBAAADACAAAAABBBABCBAHBQAAAAAhBBABCBAAAAAJAEAAAAAAAAABBBAAAAAAAA',
  'AAAAAAAAA1DBBHAGAAAAAGAAAAAAAHBGABEOABCBACAHAAAAACACAAAAACACADACACFHACAHAGAECLALAAAABFAAAAAJACBD',
  'AAAAAGAEAAAABBAAAAAAAAAAABBBACAHABCBAGAEAAAAA5DAADACAOBBAAAAAHBGAAAAAAAAABBBBBAAAAAAAAEFAAAAAOCB',
  'BBAGACAHABBBADDDABBBCLALBBAKAQDBASBBAJAEABBBABBLAAAAAHBLAAAAAGAAABBBAJAEAAAAABBBAAAAA4CBABCBABCB',
  'ABBBAAAAAAAAAGAAABBBAAAAAAAAAAAAACCDADACAEAAADDDAAAAApDBBHAGAxDBABBBAAAAAAAAAEAAAVCBBBAKAAAJAAAA',
  'ABCBAGAEAGAEAGAAAAAAAJAEABCBABBBAJAAADADBBAAAAAAACDDAAAAAHAQAAAABFAAAGAAAGAEABCBACCBABBBAAAAADDD',
  'AHBLAHBGAAAAAAAAAOAABBAAABCBAAAAABBOA5EAADACAAAAABBBABBBAACFAEAAADACABBBAEAMBBAKABBBAAEFAjBBABBB',
  'AHBGAAAAAKBBAGAEAKDDABCBAAAABBAAACCDAEAAASBBAAAAAiBBAAAACIAIAAAAABBBADDDAmCBAAAAAHBGABBOABBBAAAA',
  'ABCLAAAAAAAAAAAAABBBAAAAAAAAABBBAAAAAAAACIAIANCBAqBBBBANAAAAAAAABFAAAAAAAAAABBAAAGAAAAAAA0ADAgCB',
  'AAAAAAAAAAAAAAAAABCBAEAAA2AVAAAAAGAAABBBBBAKAAAABFAAACCDABEOAAAABFAABBANABBGACAHACDDACADAAAAAHBG',
  'ACBDABGRBBAAAJAEAAAAAAAAAGBBAAAAAGAEABBBAeCBAQDBAJAEBFAAAAAAAJAAAEAMACAHABBBAAAAAGAEAAAAAKDDAAAA',
  'AAEFADACAAAAADACB8AAAAEJBFAAABBBAGAEAAAABFAAAsCBAAAAAAAAAqBOAAAAACFHAHCGABBBABBBACADAAAABFAACIAI',
  'CIAIAAAAAAAAAAAAADACCIAIAHBGBFAACIAIACACAXBBBBAAAAAAADACAAAABBAKAAAAABCBAAAAAGAEANDBADDBAHBQBBAG',
  'AAAAADACBHAAAAAAABBBABCBAKDDAEAMAPBBAJAAAHEAADCDBHAGAAAAABCBAAAAAJAEAAAAABCBABBBABBBBFAAAAAJAAAA',
  'ACACAJAEAMDBACAHAEAAABBBAAAAAAAAAAAAACDBAHBLABCBAAAAADDDACACADDDAAAAAAAACLAPABBBADACAAAAABCBBBAK',
  'AAAABBANAOBBAAAACIAIAAAABBANACAACIAIBBAKAAAAABBBBFAAAeBBAAAAAAAABBANBFAAAJAEABBLABCBAAAAABBBABCB',
  'ACAHCLAPABCBAAAAAnDBADACADDDAGAEACBDAAEFAEAAAAEFAAAAABCBAVBBAABBBBAAACAHAAAAAACBBBAACIAIACDBAAEJ',
  'ABBBBBAAADACAAAJCIAIAcBBAEAAABEOABBBBBAAAmDBAGAEAGAAAAAABBAAAAAAAAAABBAAABCBABCBAEAAAGAAAMBDABBG',
  'BFAAAEAMACFHAAAAACBDABBBAAAAAoBBBBAAAAEFAAAAACAHABBBARBBAAAAAAAAAAAJAAEJADACAMBDAAAAAAAAADACBBAA',
  'AAAAABBBABBBCIAIAAEFABCBABBBAAEFAJACBFAAABBOABBBASBBAAAAAAAJAGAABFAAABCBAAAAAAAAAKDDABBLAAAAAAAA',
  'APBBABGRAAAAAAAAAnDBAKDDAHBLACCBBBAAACADAAAAADACACAHBBAGAAAAAEAAABBBBFAAANCBAQDBACADACFHAAAAAAAA',
  'AEIAAAAABFAAAAEFABBBAAAAAAAAABCBBBAAAHCGAAEFAAAACIAIABBBBBAKAEAMAAAABBAKACDDACAHABBBAAAAAAEFAAAA',
  'AAAAAGAEABBBCIAIBFAACLAPAABBABBBBBAABBAKBFAAABBBAAAABFAAADACACBDAAAAADACAKCDABBBAJAEAAAAAGCBACAH',
  'BBAKAAEFAAAAACAHAAEFAAAAABCBAHBGAbDBABDBACFHBFAAAAAAAAAAAJACAAAAAZBBAAAACIAIAAAJBBAABBAAABBBABCB',
  'ACACACAHACACABBBAAAACIAIBBANBBAGAAAAAAEFAdBBACAAAAAAAAAJADACAAAAAHAQAGAEAAAAABBBADDDAACFAHEQBBAA',
  'AAAAAAAACIAIAAAACIAIAAAJAAAAAGAAACAHAAAAAAAABBAKABBBAAAAAAAAAAAAAPBBAEAMCIAIBBAGAAAAAAAAA4CBAEAM',
  'AKCBBBAAAAAAABBBBHAAAEAAAGAAABEOABBBAAAAABCBCIAIAMBDAAAAACAHABJOAAAJApDBBFAABFAAAAAAANCBA0ADAAAA',
  'AAAJAAAAACACAYCBAKBDCIAIBBAAAAAAAAAABFAAAEAAAAAACIAIACAHABBBAJACBBAAAAAAAAAAACACAtBBCLAPCvAGCIAA',
  'BFAAABBBADDDACAAAAAAABGRBFAAAEAACIAIACDBBBAAAAAABFAAAAAABBAGAAAAAAAAAGAEABBBCIAAAcBBAAAAAACFABBB',
  'ACFHAAAAAAAAAAAJAAAJAACFAAAAADACBFAABBAAABBBAGAAAAAAADACADACABCBACAAABBBAEAAAAAAAAAAABBOAGBBAqCB',
  'AJACAHBLAZBBAQCBACAHBFAACIAIAAAAAAAAADCDABBBABBBABBBCLAAAAAAAAEFBHAGAEBAAAAAAAAAAAAAAJDBABCBACAH',
  'AMDBADACAGCBAAAAACAHADACACAHBHAAAEAMAAAAAAAAAAAAAAAAAJAEBHAGABCBCLALAAAACIAIAAAAABBBAJAUABCBAPAV',
  'B8AAAAAAAGAEAHBGABBBAAAAAABBAAAAAAAAAfCBABBBAAAAABCBAoBBADDDABBBAUBBABCBBFAAAAAAAAAAAAAAAKDDAEAA',
  'AJACAAAAACBDAHBLACAHAAAAAbDBABCBAAAAACAHAAAABBAAAYEOBBAABFAAAAAAAAAAAAAJAAAACLAABHAGAGAAAAAAAAAA',
  'AJAEAHBGACAHAAAABBAAAGAEBBAKAAAAATBBBBAABBAAAAAJAKCDAAAAABBBBBAAAEAAABBBBBAKBBAAAJAEAAAAAeCBBFAA',
  'ACAHAAAABFAAACAHAAAABFAAADACACDCANCBAAAAABCBAAAAADACABBBABCBBBAAAAAAAAAAAAAAADBDAjBBBBAAAEAMA5EA',
  'AAAAArBBAAAAAAAAArBBAAAABBAAAAAAADCDAGAEAbDBBFAACIASAAAAAGAEApDBABBBABBBAAAACIAIACAXABCBAEAAAEAA',
  'ADADAABBACDCAAAAABBBAAAAAJAEArBBAdCBAAAAADACAAAAABGRABBBAUBBBFAAACFHACBDAACFAAAAAAAAAAAAACHDBBAA',
  'BBANAAAAAAAAAGAEAAAAAAAJAKDDAAAAAAAACIAIAAAAAPGRAAAAAAAAACACAAAAAHBGAOBBBBANARCBABCBABCBAGAAAHBQ',
  'BFAAAAAAAAAACIAIAAAAACAHCIAIAAAAACACBBALAJAEAAAAAAAAAEAABFAAAAEFAAAJAAAACIAAAAAAACACASBBAiBBADAC',
  'AAAABFAACLALAAEFAAAAAaBBAJAEAAAABBAGADACAAAAAgBBAAAAAAAAAMBDBHAGACAHABBBBFAACLALAJAEAAAACLAPAAAA',
  'AGAEADBDAEAMCIAIAAAAAAAAAAAAABBBABBBABBBACAHABBBABBBAAAAACACAAAAABCBAYBBABGRAEAAAAAAABBBCIAIACAH',
  'AAAAABBBAKADAAAAAAAAAJAAAAEFAAAJBFAACIAIAAAAAEAMACACAAAAABCBABBBADDDACAQAAAAAAAAAHBGAGAEABBBAAAA',
  'BFAAAAAAAAAAAwBBAAAAAAAAAGAECLAPABCBCIAIAAAAAAAAAAAAAbCBAAAABFAAAmDBBBAAAAAAABBBAAAAAMBDAAAABBAA',
  'CIAIAAAAAHEOABCBAAAABBAAAdBBABCBAuCBABBBABBOAGAABBAAABBBAAAACLALAAAAAAAAAAAAABBBAAAAAAAAAKADAAAA',
  'BBAAAAAAACAHAAAAAEAAABCBAAAACIAIAAEFCIAIAGBBAAAAABBBBBAAAAAAABBBAAAAAQDBAGAEACACACAUAEAAAAAAABBB',
  'CIAIABCBAAEFABBBAGAAAAAAABBBAACFCIAIAJCBAWBBACBDAAAAAAAAABCBBFAAAdBBApDBBBANBBAAAEAACIAAAJAEAmDB',
  'AAAAAAEJAAAAACDDAUCBABCBABBBAHBQAAAAAAAAAAAABBAAABBBAAAAAAAAAHBQACAHATCBBFAAAAAAACADAAAAAAAAAACF',
  'ANAAACFHADACArCBADACAJAEAHEABBAKABBBBFAAADDDAMBDAAAABBAKAAAAAAEFAEAMABCBAJAEBHAGAAAAACAHAAAAABCB',
  'ADACBFAAAAAAADACAAAAAAAAAAAAAHBGAAAABBAACIAAAAAAACACAAAAAAAAAEAMAAAAAjBBAAAAADACBBAAAAAAABBBAEAM',
  'ABBBBBAAACACAAAAACFHAAAAAJAEAGAECLAPBBAKAAAAAEAAAAAAAAAACLAPABBBABBBACACCIAIAAAAAAAABBAAAAAAACAD',
  'AtCBAXBBAAAAAAAAAAEFABBBAHBLAMBDADACAAAAAAAAAMBDAAAAADADBBAKAAEFAAAAAHBQBBAAAGAAAAEFADACAAAAABBB',
  'ACACACFHBFAABHAAAACFBBANABBBAAAAABCBAeBBAEAMBBAACLAPACAAABBBAOBBAGAEACACABBBANCBBHAGAOBBAlCBAAAJ',
  'AJAEAAAAAGAABFAACLAPAAAABFAAAUBBABBBAEAAAAAJABBBAAAAACAHAAAAAQDBAAAAAAAAAAAAABBBAAAAAAAAACDDBFAA',
  'AAAAABBBABBBAcCBAAAAAAAAAAAAAAAAABCBBBAAAGAEAAAAANDBAAAAACDDAAAAAZBBABBBAEAAAHCGAAAAACAHAAAAAAAA',
  'AJACAAAABFAAABBBACAHBBAAAJAEAAAAABBBABBBAAAABBAABBANAAAAAGAAAEAABBAKAGAEADACAECBAKCDACACAAAAADAC',
  'BBAaAJAEADACAAAABBAAABCBAAAACLAAAAAAACDDAAEFACAHAJAEBFAAAAAAAAAAAEAAAAAAAJAEAAAAAAAAAAAACLAPAAAA',
  'AAAAABBBAAAABHAGAAAAAAAAADACAAEFABBBAAAAAEAMBHAGBFAAAHBGAEAAAAAABFAAAAEFBFAAACCBAAAAACCDAAAAAAAJ',
  'BHAACIAIAAAAABCBCLAPAEAAACACAACFABCBAAAAAAAABHANABBBABBBABBBBFAAAAEFAAEFAAAAAAAABBAAAACFAACFAAEF',
  'CIASAAEFCLAPBBAKADACAAAAAJCBAGAEACDDASBBAAHAAUBBACDBAAAAABCBAAAAAAAAACFHABBBABBBADACAEAAABBBAAAA',
  'AQDBAAAABBAAAAAAABBBBFAAAAAAAAAAADACAAAAAAAAAAAAAAAAABBGCIAIABCBAAAABBAGAAAAAAAAAAAAAAAAAAAABHAG',
  'AAAAAAAAACDDAAAAAAAAAAAAACFHAqBBAAAAAAAACLALAAAAAHBGAGAEAwBBBBAGABBBBFAAACCDAAAAAAAABBAAABBBCLAP',
  'AAAAAAAAACDDBBAKAAAAAAAACLAPAAAAABBBAEAAAAAAABBBBBAKAHBGABBBABBBAAAAAAAAAEAAAEAMADACAGBBBBAAAAAA',
  'ACFHAAAABBAAABBBAAEFABBBAHBGABCBABCBBBAAAACBABBBAAAAAAAAAVBBBBANAJACAAAAABBBAAAAABBBAgBBAAAAAAAA',
  'BFAAAAAAAUCBAAAAAAAAAAAAAKDDBBAAADACACACBBAKAAAAAHEABHAGAEAMAcBBAAAAABBBBFAAACAHAAAABBAAAAAABBAG',
  'BBAAAAAAAEAAAKCDAgBBAJAEABBBCIAIAACFABBBA0ADAAAACLALAEAAAAAACIAIAHBQABBBABCBAAAAAJAEAGBBAAAAABBB',
  'AfDBAAAAABBBAAAABBAKBBAGADACAAAAAGAEBBAKABBBBBAKAHBLABCBBFAACIAIAEAAAEAABBAAACAHAEAAAAAABFAABBAK',
  'AAAABHAGBBAAAAAAAAAAAAAABBAKAAAAAAAAACFHAHBGAPAVAJAEAACFBFAAAAAAAgBBBBAKAAAAAAAAAAAABBANAAEFACAT',
  'AAAAABBBARBBAAAAAEAAAGCBABGRAHAQAAAAACCDAAEFBBAKABDBAfAABBAKAAAAABCBBBAAABCBAAAAAAAAAAAJBFAAAAAA',
  'BFAAACAHBFAAAmCBABBBAEAAAAAAAaCBADACAAAAAAAAAjCBAGAACLALAAAAAAAAAAAJABCBAAAAAAAAA2AbAHEOAEAMAwBB',
  'AEAAACAHABBBAKCDAEAAABBBAlDBAPBBBBAAACAkAAAAABBBAPBBAKCDAAAABFAAAAAAABBBBBANAAAAABBBAAAAABBBAAAA',
  'AHBLAAEFAAAAABCBAHBGANAAAJAEABBBBFAABBANAHBGANCBAAAAACADABBBACAHAAAAABCBAAEFBBAAAPBBAAAABBAACIAI',
  'ABCBAAAAABBBABBBAACFABCBABBBAAAAAAEFCIAIADACADACAEAAABGRABBBABBBCIALAXCBAHCGAAAAAJAEAAAAADACAAEF',
  'AAAAAAAAAAAACLAPAAEFACFHCIAIAAAABBAKAAAAAHBGAAAAAAAAAVBBAAAAAHBGAAEFBBAGABBBAAEFAJAEACBDAAAAAAAA',
  'ABCBAAAAAGAEAGAEADACAAAAAGAAAWBBAAAACIAIAJAEADACAAAAABBBAEAAAEAAAAAAAsBBAAAABBAAABBBAJAEACAHAAAJ',
  'AAAABFAAAAAABFAAACDDAAAABBAKACDBAAAAAAAAACCBCIAIAAAAAAEFBBAGABBBAfCBABBBAEAMAAAAAGAEABBBABCBBFAA',
  'AAAAACACAAAAAAAAADACABCBANCBABGRACADADACADACAAAAAEAABFAAAHBQAAAAAAAABFAAAAAAADACAAAAAAAAAAAAAAAA',
  'ABCBAAAAAAAAAAAJABGRAzBBABBBABBBAAAAABBBAAEFABBBABBOABBBAAAAABBBAAAAAnCBABDBAAAABBAAABCBAEAABFAA',
  'AUCBAAAAAAAAAAAAACAWAJACAAAAAqBBBBAGABBBABCBBFAAAGAAAHBGAAAABBANACACAGAECIAIAAAAAEAAAJAEAAEFAAAA',
  'AAAABFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBABBBACACAwBBADDDAAEFAAAAABBBAAAAACACAGAAAAAABBAKAAAAAGAA',
  'AJAEACBDAAAACLALABBBAEAAAABAAAAAABBBADCDCIAICLALAAHAAAAAAgBBABBLAAAAAAAAADDDCIAIAHBQABBBBBAKAAAA',
  'ADACAAAAAACFBHAGAAAAAAAAADACAAAAABBBABCBACCDBBANABBBAHCLATBBAAAAABCBBBAAAAAAAAAAAsCBADACAKCBCIAI',
  'ABCBAAAABFAAAAAAAAAAAAAAAAAAADACAAEFABBBAEAMAGAEABBBACDDCLALADDDAxDBCIAIANCBAJACAAAABBAAAKDDABCB',
  'AAAAADBDAAAAAACFAAEFAAAAAGAEAEAAAAAJAKBDAaCBAyBBCLAPBBAAAKBDAAAAAAAABFAAAEAMABBBAAAAAAAAAeCBAAAA',
  'ABCBAAAAAAAAAAEJABBLAAAAABBBAHBLBBAAACDDADACABBBAAAAAAAAAGCBAKDDABBBAAAAADACAGAEAAAACLAABBAGAAAA',
  'ABCBATBBBFAABBAKADCDCIAIAJAABBAGAAAAACADABBBBBAAAEAAAAAAAAAAABBBAAEFA0ADAACFABCBABBBBBAKAEAAACAC',
  'ABCBAAAAAAAAAAAACvAAADACCIAIAJAEAAEFAAAAACACAKADAAAAAAAAABCBAAAAABCBAAAAAAAAAABBBBAAAAAAACACAMBD',
  'AAAJBBAAAKADAzBBAGAECIAIAEAAACAACIAIBBAAACACBFAAAHCGAAAJAAAAACAHAAAAAAAAABBBABBBAJAEACACABBBAAAA',
  'ABCBABEOAAAAAGAAAAAAAAAAABCBBFAAACADAEAAABBBABGRAAAAAJAECIAIAAAAAAAJAAAAAAAAAEAAAACFAECBBBAAAACF',
  'AAAAAAAAABBBCvAAAAAAAAAAAAAACLAPAAAAAAAAAAAAAAAAAEAAABCBAAAAABCBAAAJAAAABFAAABBBAAAAAREOAAAAAKDD',
  'AAAAADDBAKCDABBGBFAAAAAAAAAABHAGAGAVAEAABBAAAAAAAAAAAAAAACBDAAAACLALAAAAAAAAABBBABBBAAAAAAAAAEAM',
  'AEAABFAAAAEFAJHEACAHABCBADACAdBBBFAABFAAAAAAAAAAAAAAABBBACDDABBBAAEJAAAACIAIBBAKAKBBAAAAAKADAEAA',
  'AAAAAAAAAAAAACFHACDBAAAAACDDABBBAAAAAAAAAAAAABBBAAEFACACACFHATBBABBBAABABBANAAAAADDDABCBAbEOBFAA',
  'ADACADCDAGAEAAAAAAAABBAKAAAAABBBAAAAAAAAAAAAAiBBAAAAAHBLADACABBBABGRABBBADACCLAPAAAJAAAAAAAABFAA',
  'AlDBAJAEABBBACDDAAAAAAAAACAHAAAAACFHANDBAAAAABBBAAAAAdBBBFAAAMBDABBBAAAAABCBBBAAAHBLCIAIABBBAAEF',
  'ANCcAAAAAJACAHBQAAAAABGRAAAAAJAEACATAAAAADACACBDABEOAAAAAAAhADACAMBDADACAGAYAAAAAWBBAHBQAAAAAAAA',
  'AACBAEAAAAAAAAAAABCBAXCBAAAAAJCBAAEFAAAAABCBBBAKAAAAAABBAAAAAJAAAAAAABBOAJAEAAAAABBBAAEFABCBCIAI',
  'ACADABBBA3BBAAAAAEAMAGAECIAIBFAAAAAAAAAACIAIAAAAAJAEAmDBBBAAAAAAAAAAABBBAEAAACAAABCBABCBAAAAAAAA',
  'ADACABBBBBAAAAAAAAAAACACACFHAXCBAAAAAAAAAACBAAAABBAKAAAABHAGAAAABFAABFAAAGAAAJAEAAAAAZBBADACAHAQ',
  'ADACACDDAGAEBBAKBFAAACEHABCBBHAGAAAAAAAAAAAAACACAAAAACAHABBBABCBAAAABBAAAAEFACADABBBAtBBAdCBCIAI',
  'ABCBAAAAAAAABBAAAHBGAAAAAAAABFAABBANBBAAAAEJABBBAAAACIAIAAAJAGAACIAIAAAAABCBAAAAAAAABFAAACCBAXBB',
  'CLALADDDAAAAAOBAAAAAAAAAAAAAAAAAABCBBBAAAGAEAAAAAAAAAEAAAtBBACACAUBBAEAAACBDACACABGRAAAAABBBABBB',
  'AMBDAAAACIAIBBAAAuBBBBAAArBBBFAAAJAEABBBABBBAiCBAHBGAAAAAAAAAAAABBANAAAAAEAAAAAABBAAABBBAAAAABBB',
  'CIAIACAHADACAHBQAJACAAEFAAAABBAAADACADAAAAAABFAACLAAAAAAAEAAAAAABBAKAAAAAJAEAAAABBAKABCBAAAABBAA',
  'AAAAADDDAEAAAAAABFAAABBBABEOAGAEABEOAAAAAAAAAGAYBBAAAAAAAAAAADACABBBAOBBAAAAABCGAAAAAGAEABBBAAAA',
  'ABBBAAAABFAABBAAAKDDAGAEAEAAAAAAAJAEAEAMADBDAAAAAEAAACACAJAEABBBAAAJBFAAABCBADACABCBAAAACIAIAAAA',
  'BBAAADACAAAAAAAJADDDAAAAAAEFADDDAJAEAAAAABBBACAHABBBACAHAAAAAAAAAAAABBANABCBABEOACHDAGAAACFHAAAA',
  'ABBBBFAAABBBBBAABBAABHAGBFAAABCBAAAABBAAAGAABHAGCIAIAAAAAGAEAACFAAAAAHBQAAAABFAAAEAMAAAAAACFAAAA',
  'ACACAAAAANCcABBBAJAUAACFAAAAABBBAYBBACACABEOABCBACAAAGAEBHAGACAHAAAAAAAABFAAABBBABBBAAAAADACAAEF',
  'AfDBADACABBBAAAAAKDDAAAAACACACCBAAEFAAAABFAAABGRAUBBABBBAaBBAAAAABCBAJACAGAABBAAABBBAAAAAiBBAAAA',
  'AAAJAAAAAAAAAAAAAAAAAKDDAEAAA6CBCLALA4BBAEAMBBANAAAAAAAAAAAAAUBBBBAKBFAAAAAAAGAEAAAAADACABCBCIAI',
  'AAAAAAAAAAAAAHBLANCBAAAAAAAAAAAJAAAABBAAAJAEAAAABHAGAAAAABBBAAAAAAAAABCBADACAAAJACADCLALABBBAAAA',
  'BBAKAGAAADACAKCDAAAAADDDABBBBFAAAAAAAAAAAGAEABBBAAAAAKBDAAAAAAAAACAHAAAAAACFAAAAAAAAAJAEAAAAAAAA',
  'BBAGAAAACIAIAAEFAAAAADACAAAAAKBDCLAAABBBBBAABBAAAAAABBAKAAAAAqCBBBAKAHBGAKBDAEAMAAAAADACAAAABFAA',
  'CIAIAAAAAAAAAAAAAHBLAAAAAAAAAsBBAAAAASBBAJAEAAAABBAAABBBADACABCBAAAAAEAAACACAAAAAAAAACACBFAAABBG',
  'AACFAGAEBFAAACAHABBBAAAABFAAAEAAAEAMAcBBABBBAHBGAAAACIAIBBAAAAAABFAAAAAJAkBBAAAABBAKAXBBAAAAABCB',
  'BFAAADBDAAAABFAABFAAAEAMABBBABBBABBBABBGABCBBFAAABBBABBBBFAABFAAAJACADACCIAIAEAMBBAAABCBBBAKAbDB',
  'ACAHACAHBBAAAEAACLALAAAAAAAAAEAAAGAEAAAAAGAEAACFAAAAANCBCIAIADCDARBBBBANABBBAGAEACAHBBAABBAGAAAA',
  'ADBDAAAAABBBACFHADDDAAAABBAAAQCBAEAAAAAACIAIBFAAAAAAAHBGBBAGAAAABBAGA3BBAjBBAaCBABBBAMBDAAAAAAEF',
  'ACAHAQDBACACAAAAADACAfDBAAEFAAAACLALAAAABFAAAAAAAAAAACBDABCBATCBACDDAAEFAgBBABCBAAAAAACFACDDAAAA',
  'ADACABBBABDBAAEFAMBDBBAKBFAAAxCBAAAAAKCDBFAAA4EAAAAAAmDBAAAAACAHAAAAADACABBBAJAEABBBAGAEAAAABBAN',
  'ABGRABDBAAAAAAAAAAAACIAIAeCBADDDAGCBCIAIABBBBBAACIAIACAHABBBBBAAAEAAABBBACACAAAAAAAAAAAAACAZBBAA',
  'BFAABBAAAACFAAAAADACADACAHCBBBANBBAKADCDAAAAABBBABCBAAEFAAAAAAAAABBBBHAGACADAAAAADACACAHAAAABFAA',
  'AAAAAYBBABBBAAAABFAAAAAAAGAEAHAAAAAAAABBABBBACFHAAAAABBBAAAAADACAAAAAAAAABBBBHAGADACABDBACBDAAAA',
  'AJAEAAAAAAAAAqBBAOBBAAAAABCBAAAAACAHAAAAANDBAAAAAGAECIAIAAAAAGAECLAPAAAAAJAEADACANCBAAAAABBBBBAK',
  'ACFHAAAAAEAAAEAAAAAACIAIAAAABBAGABCBAMBDAAAABBAAABCBAAAAABCBAEAXAAAAABCBBBAKABCBAuBBAAAAAJAEAAAA',
  'AAAAAACFAAAABFAAAAAAABBBBBANAJAEAAAAAAAAAKBDABCBACACAAAAACAHBBAABBAABBAAAAAAADDDAAAAAACFAHAVABBB',
  'AAAAAGBBAAAACIAICIAIABBBAAAAAAAAC+ASABBBADACAMBDAAAAAlDBACDDAAAAADACAAAABBAAAAAAAACFAHBLBBAAAqCB',
  'BBAAADACABBBAAAAAoBBBFAAAAAAAmCBABBBABCBABBBAAAAACDBAAAAAAAAABBBBBAAAGAEASBBBFAAAKDDAAEFABGRACEH',
  'ABBBAKADAAAAABBBAAAAAAAAAGAAAOBBAHBLAEAAAAAAAAAAAKBDAEAMACACAGAABFAAAAAAAkCBABBBAXCBABCBAAAAAGAA',
  'AAAAAAAAAeBBAMBDABCBABCBABCBADACAMBDAAAAAAAAABBBAHBLAAAAAEAMACACAAAABBAABFAAANCBACDDABBBAJAYAEAM',
  'BFAAAAAAAmEOACBDAAAAAAAAAHBGBBAAAAAAABBBADACADDBAKDDAAAAAEAMAKCDAAEFAAAAAEAAAAAAAhCBABBBAEAAAJAE',
  'ADACAAAAAAAABHAGAKCDACAHCLALAAAAAAAAAAAAAAAABBAAADACAAAAAAAAAAAAAAAAAAAABBAGBBAaBBAAASBBAAAAAEAA',
  'ABBBAAAAAAAAAAAAADDDAAAAAHBGAAAJBFAACIAIACDDAAAABBAGACDCAAAAAAAAABBBAKDDAJACABBBABBBAAEFBBAKAYCB',
  'AAAAAAAAABCBBHAGAAAAACBDAGBGACACABCBAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAGBBABCBBBAGAXBBAEAABBAABBAG',
  'AGAABBAKACFHBBAGAAAAABBBABCBCIAIACBDAAAAAJAEAGAAAAAABHAAABBBAAAJAAEFAACBAAAAAAAABBAAADACCIAIADAC',
  'AGAAACAHAKDDAuBBAAAAAAAAAAAAATCBABBBABBBAEAAAHBGAEAAAAFFAAAAABBBABCBACCBABCBAHBGABBBBFAACIAIAAAA',
  'AJAVAGAEAEAAAHBGABBBCIAIAAAAAbDBAAAAAJAEABCBAaBBAAEFAAAAAAAAABCBAAAJAAAAAAAAABBBABBBAEAAABBBAEAA',
  'BBAGAAAAACAHAAAAAAAAAGAEAEAMAhCBAAAAAAAAAAAAADCDABCBBFAAAACFAAAAAAAAADACAAAAAEAMAHBGAJAEBBAABBAK',
  'ACACCIASBBAAAJAEADACAHBQBBAAACDDABCBAGAAAACFABBOAAAACvAAAGAAAAAAABBGAAAABBAAAAAJAAEFAEAMACFHAAAA',
  'AAAAAAAJBFAAAAAAAACFAAAAAAAAAEAACIAIAAAAAHBGADBDABBBA2AbAxDBABCBAGAEAKDDBFAACLAPACACAAAAAEAMBBAK',
  'AAAAAAAAAEAMBBAGAAEJAAAAACACABBBAAAAAAAJABCBAEAMAAAAABBOAAAJAACFAHBGABBBBBAAAAAAAAAAAxCBAEAMAAEF',
  'APCBAAAAAlAeAAAJAAAABBAAABBBAAAAAEAMBHALACAHAHEABBAGADACAKBBAAEFAGAECIAIABCBAAAJABBBANCcABBBABBB',
  'ACDDAEAMBFAAAJAEAAAAAKDDACAHAAAAAGAEABCBABBBAAAAAAAAAAAAAAAAAHBGAGAECLAPAAAAAGAEAAAAABCBAACFACAH',
  'ADACAAAAAAAAAHCGBBAKAQDBAAAAACAHABBBBFAABBAAADACAACFAKBDBBAGAJAEAAAAAAAAAAAABBAKABDBABCBAJAEBBAA',
  'AAAAABBBAAAAAXBBA9BBAAAABFAAABBBBFAAABCBAHBGAAAAAAAABFAAAHBQAEAMAAAAAAAAAAAAAGAEAABAATBBABBBAAAA',
  'AEAABBAAAAAAAAEFAACBAAAAAAAAAGAEABBBACFHABBBCIASAGAAAAAAAABBAmCBBFAAAAAABBAAAAAAAAAABBAAAHBGAAAA',
  'CLAPAJAEANAAAEAMAAAAAAAAAfDBAAAAAAAAAAAAABBLAAAAAgBBABCBABBBBBAKBFAAACACAAAAAAAJAVCBAAAABBAGAKDD',
  'ABBBAGAZBHAGAAAAAAAJBFAAAAAAARCBAAAAAEAACIASAAAAAAAAAAAAAnDBAAAAAEAAAjBBAAAABBAAACAHCIAIAAAABBAA',
  'AAAAABBBCIASAAAABBAAAAAAADADABBGACCBABBBABBLAAEFAAAAADACAGAEAACFAAAAAiBBAAAAAGBBACACATBBCIAIBBAA',
  'AAAAAAAAAJAEAAAAAAAJAtBBAAAAAAAAAGAAADACBBAAACBDAAAACLALACAHABBOCIAIACCBANDBABBBAAAAAAAABBANABGR',
  'AAAAAAAAA2AVAAAAAAAAAAAABFAAAAAAAAAAAGAAAAAABBANABCBCIAICLAPADACAAAJACAAAAAAADACAMCBAHBQACAAAAAA',
  'ABBBABBBABBBBFAAAQCBAlCBAAAAAAAAAAAAAGAEAYBBAGAEAAEJBHAAAAAAAAAABFAAAAAAAMBDAAAAAAAAAGAECIAIAAAA',
  'CIAIAAAAABBBAEAMABCBABBBAAAABFAAABCBABBBAPBVAGAEACCBAAAAAEAAACACAdBBAVBBACACAHBGBFAAAAAAACACAAAA',
  'AACFADACACFHAGAYATBBAAAAAHBGAAAAAAAAAAAAADACAAAAAKDDABBGAAAABBANACFHABBBABBGAAAAAHBLAHBGAEAMBFAA',
  'BBAKCIAIABBBCIAIAACFABGRAGAEAAAAAAAAABDBABBBACAHABCBADACAMBDAAAJAAAAAJAEBBAKBBAKAQCBAcBBAAEFAyBB',
  'AuBBAAAAAAAAABBBABCBAAAABFAAAAAAAAAAAAAAAGAABBAAACDDABCBAAAAAHBGABBBACAHBBAAAAAABFAACIAIAAAAAAAA',
  'AAAACIAIAJAEAAAAABBBAAAAAAAAAAAAAHCGAcCBAAEFAAAAAGAEADACAAAAAAAAAAAAAAAAAGAAAACFAEAAABBBAAAAAHBG',
  'AHBQABBBAkBBABBBACACBBAAABCBAAAAABBBBBANAhBBAGAAADBDAAAAAHBLBFAAACAHAAAAAAAAABCBACAHBBAAACFHACAH',
  'AAAAAAAAABBBAJAEAJAAAAAAAJAEBFAABFAAACAAAAAAADACAEAAABBBADCDADDDADACABBBAAAAAAAAABBBABCBAAAAAAAA',
  'BBANBBAAAHBLAAAABFAAAUCBABCBACDDAAAAAAAABFAAACADBFAAAAAAAAAAAAAAAAAJABBBABCBBBAGAGAEAAAAAaCBAKBD',
  'AHBGAAAAACAHAAAAAhCBAAAAAAAAABCBAJAEAAAABFAABBAKABBBAKBDAAAAAAAABFAAABBBAEAAABBBAAEFAAAAAAAAAAAA',
  'AAAAA3CBBFAAAAAAABCBABBBAUBBAAAAAAAAABBBAAAAAHBGABBBAAAAAACBACATABBGAOAAABBGAYBBAJACABBBABBBAAAA',
  'AKDDAACFBBAAABBBABBBAGAAADDDAACBANAAACDDAAAAABCBAAEFBFAAAGAEBBAAAEAAABCBAhBBBBANABCBAGAEAAAABBAA',
  'CLAAABCBAGAAAHBQANCBAAAABFAAAAAABFAAADACCvAKAAEJAJAEAAAAAGCBCLAPABBBADACAAAACIAIAAAAAAAAACDDAAAA',
  'AAAACIAIARBBCIAIAJAEAAEFABBBAGAEBBAAAACFAAEJBFAAAAAABFAAAAAAAACFAAAAAAAAAEAMACACAHBLAAAACIAIAAAA',
  'AJAEACACABBBAAAAAEAMABBBAAAAAAAAADACAkBBAAAAAAAAABCBAGAAAjBBAAAABBALADDDAEAAABDBAAAABBAAAGAEBBAN',
  'AAAAAQDBACFHAAAAABCBAAAAAAAAAAAAAACFANAAAAAAABBLAaBBAHBGAEAACLAPCIAIAOBBAAAAACACAAEFBFAAAAAJABCB',
  'AJAEAJACAAAACLAAAKDDBBAKACACAHEAAJAEACAHAAAAAAAAACACAAAJAAAABBANACDBAAAAAAAAAEAAAMBDAAAABBAACIAI',
  'AAAAABBBAAAAAAAABBAKABBBAEAMBFAAADACABCBAEAAAAAAAAAAAbDBAGAAABCBAEAMAAAAAAAAAGBBAAAAAHBGAAEFABCB',
  'AAAAAAAAABCBAAAAAAAAANCBAAAAAAAAABBBAbCBAAAAANDBAAAABFAAABBBBHAAAAAABBAACLAPARBBADACACAHAAAACLAP',
  'AAAAAAAABBAABBAjCIAIAKCDAAAABBAABBAAAAAAAAAAABBGACAHABBBAAEFABBBACBDACAHACCDABBBAAAAABBBAAEFBFAA',
  'BBAKANDBAAAAACAHAAAAACFHACFHACAXBBAAAMBDAAAJCIAIAACFBFAAAfDBAGAEAAAAAAEFADACAEDBBBAGABCBANAAAAAA',
  'AAAAABBBBFAAABBBAHBGAAAABBALABBBABBBCIAIADACACFHAJAEABEOAAAJAAAAAqBBAAAAACCBAMBDAEAMAAAACIAICIAS',
  'ABBBAGAAAAAABBAKAkCBABBBAAAAAAAAAAAAA5BLAAAAAGAAADACAAAAADACABBBACAHBHAAABBBAAAAAOBBABCBAAAAB8AA',
  'AAAABBAGAACFAfCBAJAEACAHAEAAAAAAABCBABBBCIAIAAAABFAAAAAAAEAAACFHBBAKAHBGAAAAAGAECIAIABCBAAAAAAEF',
  'AAAJAAAAAAAACLAPAAAAAAAABFAAABBBAAAAADBDAAAABFAAAJCBACACAAEFAAAAAAAAAAAABFAAABBBABBBAGAEACFHAAAA',
  'AAAAAAAAAAAAAAAAADACAAAAAAAAABBBBBANBBAABFAAABCBAABBACATACAHAAAAAAAAAAAAAAAAABBBAAAAAAEJBFAAAAAA',
  'AAAACIAIAAAABFAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAACAHARBBAAAAAAAABBAKABCBCIAIAAAAADACAAAAAJAAAAAAABBB',
  'ABBBCIAIAEAAAJDBAAAAADBDABBBBFAAAGAAAJAEAAAJABBBAAAAAACBABBBAJAEAAAAAAAABBAKACAHBBAAAAAAABBBAHBQ',
  'AAAAAAAAAAEJBFAAAAAABFAAABBGAAAAABBBBBAAAAAAAAAABFAAACCBCLALADACABBBAAAACLAPAJAEAAAAABCBAAAAAGAE',
  'AHBQAAAAApDBABGRAEAABBAAAdBBAJDBCIAABFAAACAHAAAAAAAABBAKAAAAAAAAAGAAAHBLAEAAAJAEAGAAAHBGAAAAABCB',
  'AwCBBBAACIAIAGAABFAAABBBACCBA6BBAAAAABBBACAHACFHAAAAAEAAAAAAAAAAABCBAAAAACAHABCBAAAAAEAAAKCBBFAA',
  'AHCGABCBAAAAADBDAlDBAAAAAAAAAEAAAHBGAAAAAHBQADACAAAACLAPBFAAAAEFAEAABBAKACDCAsBBABBGAAAAAGAAABBB',
  'AAAACIAIAAAAABBBABCBAAAAAAAAAACFAAAAAiBBBHAGAAEFAEAMATCBAAAAABCBADACBBAKAAAAABBBABBBAAAAAEAAACFH',
  'AAAAAAAABBAGAAAAAAAAAoBBAEAACLAPABBBAAAAABBBAAAACvAAAAAAADACAAAAADACAAAAANDBABBBAAAAAGAEAAAABBAG',
  'AAAAAGAEABEOAAAAAAEFBFAAACCBAHBLAAAAAPBBAJACAGAEAAAAACDBACDDACDDBHAGACAHBBAAAKBDAAAAAAAAABBBAJAE',
  'ABBBAyCBAEAABBAAAAEFAAAAAAAAABBBAEAMATCBAGAEAAAACIAIABBBAAAAADACBBAKBBAAAAAAAAEJAAAAAEAAAAAABBAA',
  'AHBLAEAABBAAAAAAAMCBBBAAAAAABFAAAAEFAEAABFAAABCBBBANABBBADACCLALABCBABBBAEAAASCBAEAMABBBCLAPABCB',
  'BBAAAJAEACAHAAAAAXBBAAAAAAAAAGAEAJAEAKDDABBBAAAAAMBDADDDAAAAAAAAAAAAACACAAAABBAACIAIABCBACACAEAA',
  'ACADAGBBACAHBBAKACFHACCBAiBBAAAAAHBGAAAAAAEFAOCBABBBAAAAAAAABBAKCIAIACDDABBBAcBBAAAAAACFBBAGABCB',
  'AAAAADACAAAAAAAAAACFAEAAAAAAAAAJAAAABFAABBANAJAEBBANAKDDAAAABFAAAAAAAEAAADCDADACAAAAAGBBAsCBAMCB',
  'ABBBAHBGAJAEACAHAAAAAEBABFAABBANAAAACLAPACADACATAAAAABBBBFAABBAGAAAJBBAGABBBAAEFABBBAAAAAAAAABCB',
  'AAAAAVBBAAAAADBDANAAAAAABFAAAAAAACBDAAAAAAAABFAAABBBAAAAAAAAAAAAACACAbDBABBBAlDBAGAAAAAAAAAAAAAA',
  'AAAJBBAAABBBAAAAAJAEABBBAAEFAAAAAACFABBBAAAJAQAGAEAAAAAAAGAECLAPAEAMBFAAABBGABBBABBBAGAAAAAAAAEF',
  'AGAEAAAAAAAAAEAMAAAJBFAAAAAAAAAAADACAEAAADACABBLABCBABCBBFAAAAAACIAIABCBAAAAABBBAEAAARBBAAAAAAAA',
  'BFAAABCBABBBABBBAEAMABBBACBDAZBBAHBGAJAEBBAKAAAAAEAMAAAAAGAAAAAAAAAAAAAAABBBBBAAAxCBAAAAABBBABBB',
  'CIAIAYBBAAAABBAAADDDCIAIAfAABFAAAEAAABCBCIAICIAIAAAAACCDADACBFAAAAAAACAHABBBADACABBBAGAACLALBBAN',
  'AnCBAAAAAAAAAABBAJAEADACAAAJAEAAACAHANCBAAAAAHBLACAHAAAAADBDBBAAACACABBBAACFACCBAAAACIASAAAAAxDB',
  'ACDCAAAAABBGADBDAAAAAEAABBAAADACAAAAAGAEANCcBBAAAAAAAKBBABBBABBBAGAECIAIABBBABBBAAAAAAAAACAYABBB',
  'ABCBAAAAAAAAABBBAAAAABCBAOBBBFAAAAAAABBBAMDBAAAAABBBABBBAHBLABCBAJAEBBAAABBBABBBBFAAABBBAAAAAEAA',
  'AAAAANDBAJACABBBACAHABBBACFHAAAAAQDBAuBBAJAEAWBBAAAAAAAAAAEFAABAAACFBBAAAACFABBBBBAAABBBAAAAADCD',
  'AAAAAJAEBHALAAAAAAAAAHBGAEAABBAKABBBACACAAAABBAABBAaAGAAAJAEAGAABBAAAAAACIAIAAAABBAAAAAAAAAAADCD',
  'CvAABBAGAYBBAAAAAAAAAAAAADAAADACAAAAAEAMBBAAAAAAAAAAAeCBAAAAAAAAAEAAACADAAAAAAAAABGRARBBABBBABCB',
  'ADACACAHBBAGCLAPABBBAAAAABDBAAAAAAAAAJAEABCBBBAAAaBBAAAAAAAAADACBBANAEAMAAAAAAAAAAAAAAAAADACAYBB',
  'ABCBAEAMAAAAAAAAABBBACAHBBAKBFAAAAAABHAGAEAAAAAAAAAAAAAAAAAAABBBAZBBAAAABBAAAGAEADACADACABCBAAAA',
  'ABBBAAAJAAAAACBDAGAAABBBACAHAXBBACACADACAAAAABBBAHBLAAEFACAdAPDVAUBBAAAAAAAAAGAEBFAAACAHAaBBABBB',
  'AnDBAAAABBAAABBBBFAAAAAAACAHArBBBBAACLALABBBABBBAzBBACAHBHAGAAAAABBBADACAPCBABBBABCBAAAAAAAAABBB',
  'AHBGBBAKAHBGAAAABBANCIAAAGAEABBBADCDABCBAAAAAAAAABBBAGCBAWBBAAAAABBBAHAQBBAGAAAAAAAAACAHAGAAAAAA',
  'AAAAABCBAAEFABEOBBAaAAAAAJAEADACABBBBBAAAAAAABBBANDBAGAEAAAAAAAABFAAAAAAABBBAAAAACCBAAAAAAAAADCD',
  'AAAAAkBBAGAEAAEFAAAAABBBABCBAHBGACACAAAAABCBACAHABBBBBAGAAAAANAAAAAAABBBABCBACACAAAAADCDAEAAAGAE',
  'ACBDAAAAAAAAABBBACACAAAAABCBAKCDAAAAADACAAAAAGAEAAEFBFAAAHBGAAAJAAEFABCBBBAAAKCDADACAEAMACACACFH',
  'AEAACLAPAAAAABBBAAAAABBBACACAYBBAGAAAAAAAAAAAAAAAAAAACDCACAHAAAAAAAACIAIAuBBAAAAABBBABCBBBAAAAAA',
  'AAAAAAEFABCBAAAAASBBAGAEADACAAAAAOAAAHBQAAAAAQDBAGAAAAAAABBBABBBABBBAAAAAAAAAJAEAOAABFAAAAAABBAK',
  'AHBQAEAMAwCBAEAMACAHAAAAAAAAAHAQADACAaBBAMBDAAAABBAAAMBDADACAAAAAHBLAJAEAJAEAEAAAAAAABCBAAAAADCD',
  'AGAEACFHAAAAAMBDAAAAAlDBACAHAAAAABBBAGAECIAIAJAEAAAAACDDAPBBAJAEAWCBAAAABFAAAAAAABCBACCBAaCBAGAE',
  'BBAAAAAAABBBAACFBBAKAGAACIAIAGAEAAAACLAPAAAAAAAAAACFAoBBABCBAAAAAxDBADBDAjCBADACABEOAEAABFALACCB',
  'BBAABBAAADACAAAAAAAABBAAABBBAJAEABCBAhCBACFHAAAAABBBAKBDAJAEAAEFAAAAAAAAABBBACBDABBBAAAAAEAAAAAA',
  'AEAAACACAAAAABBBAAAAAACFAAAAAKADCLALABBBAAAAAAAAAAAAAAAAABCBAAAAAAAAAAAAAYCBAlDBAAEFADDDCLAPAAAA',
  'ACATAHBGAAAAAAAAAEAAAAAAAJAAAAAAACFHABCBBFAAAJAEAAAAACADAAAAADDDAGAEAABAAAAAAAAAAJDBAHBGAEAAAACF',
  'BFAABFAAACADABBBAAAAAHBLBFAAABCBADACAJAEAAAAAAAABBANBFAAAAAABFAAAAAAAUBBCIAIAAAAAAAAACFHAJAEAACF',
  'AAAAARCBBBAAAAAAAAAAAAAAAJAWAAAAAAAAAAAAAAAAABBBAAAABBAGAGAEAAAAAHEOAAAAAAAAADACANCBAEAAAAAAAAAA',
  'ABCBAAFAAAAAABBBAAAAAbDBACFHBBANAWBBABBBACFHABBBAAAAAHBGA2AdAAAABBAKACBDAACFAAAAAAAABBAAABBBAAAA',
  'AAAAABCBABBGACFHAGAEAAAAAKDDAEAAAAAAADDDABBBABBGBBAAAJAEBFAAAAAAAHAQACAHAAAAABBBABCBAAAAACACAAAA',
  'BBAAABCBAAAAAAAJAAAJADACBFAACLAPAAAAABBBAAAAAEAAAAAAABCBAGAEAAAABFAAACAHACADAJAEAEAAAAAABFAAAAAA',
  'BBAAAAAJAAAAACFHAAAAACACAAEFAHBQAHBGBFAAABCBAAAAABBBAKCDAAAAAGAEAKCDAAAAAAAABFAABBAAADBDADACAAAA',
  'AAAAAJAEAAAAADACAAAAAEAAAHBGABBBAAAAAAAAABGRBFAAAgCBAqCBCIAAADACAAAAADACABCBABBLAAAAAAAAACBDABBB',
  'AAAAAJAEAAAJAAAAAKDDAGAEBFAAABBBAAAAAEAAABBBBBAAAAAAACCDCIAIBFAAAHBGADACBBANAAAAACACBFAABBAKAEAA',
  'ACAHAACFAPBBBBAAACFHAAAABBAAAJAEAAAAAcCBAAAAAAAAAJAEAGAACIAIAGAEABBBAAAAABCBAAAAACFHBBAAAAAABBAA',
  'BBAKANDBAGBBAGAAAAEJAAAAAAAAAEAMBFAAAAAAANAAADDDABEAAAEFAAAAABGRAAAAAAAJAMBDAAAAAGAEBFAAAJAEABBB',
  'ABBBADACABBBAAAAAAEFABCBCIAIACCBAAAAAAAAABCBAAAAACCBADACAAAAAAAAADCDBBAKANDBAAAAACBDBFAAAzBBAJAC',
  'BBAABBAAAAAABBAAABEOAAAAAAAABFAABBAAAAAAAAAAABCBAJAEAEAMBFAABBANAAAAAGAUAAEFABBBAGAAAAAABFAAAAAA',
  'BBAKAAAABBAGAGCBCIAAABBBAAAAABBBAJACAAAAAAAAAAAABBAABBAGACDCAAAAAGAAAAAABBAAAAAAAAAJAAAACIAIAAEF',
  'AAAAAAAAAHBGACAHADACAAAAAAAABBAGAAAAAOBBAHEABBAKAAAAAAAAAAAAAAEFACFHABBBACACACACAAAAABCBBBAAABBB',
  'AAAAACAUAABBAbCBAACFAfDBABDBAAEFAACFAAAACIAIAAAAAAAABBAGAAAAAAAAAHBQAAAAABBBABBGAAAAAbDBABBBAtCB',
  'AAAAAAAAAaCBABCBAAAAAiBBACAAABBBACACACFHABBBAAAAAAAACIAIAEAAAACFAAAAAOBBACDDABBBAJACACFHBBAAAAAA',
  'AAAAAAAAAfCBABGRAAAAABEAADACACAAAACFABBBACAdAAAAAAAABBAAAMBDAAAJAAAAAHEAABBBBBAKAJAACIAIBFAABBAA',
  'ABBBATCBAHBGAAAACIAIABBBAEAAAGAEBBAAAKBDAJAEAAAAAAAAABEAAAAAAAAAABBBACAHAAAAAEAAAAAAAAAABFAABFAA',
  'BBAGAAAAADAABFAAAKCBAJAEAAAAAAAABFAAAECBAAAAABBGAwCBAHCGADDDADDDABBGABBBABBBAAAABBAAAEBAACCDABBB',
  'AAAAAEAAACDDAAAAAAAAABCBAAAAAqCBBBAAAGAEABBBAKBBACACABCBBBAKAAAAADDDAKBDAAAAAGBBAJAECIAIAyCBAAAA',
  'BBAAABBBAGAEAGAAACDDAQDBAHBGAAAAAAAAAAAABBAAABBBABBBAJAEBBAAACACACAHAAAAANAAAAAAAABBAAAAABCBAAAA',
  'AAAJACACAAEFAAAAAAAAABEOABBBABBBACACACFHAAAAABBLACAHAAAJAACFAAAAACAHAAAAADACABBBASBBABCBAHBGABCB',
  'AEAMAHBQAAAAADACAJAEACFHAEAAAZBBADACAAAAABCBAKCDABBBBFAAAAAAABDBABBBAAEFAAAAAOBBACACAiBBAAAAAGAE',
  'BBANAEDBAJAEADACADACACACAAAAAAEFAEAAABBBAJAEAAAJAAAABFAAACFHBFAAACAHAEAAADAAAAAAACACABBBAtCBACAH',
  'ADACAAFAAGAEACAHAAAAAGAEAAAAADACCIAIAAAAAAAAAqBBADACABBBAMBDAAAABFAAAAAAAGAAAHBLAAAAAJACAKCDCIAI',
  'BFAAADDDBFAAAAEFAAAAAKCDAAAAACFHABCBAAAAAAAAAACFAAAJABBBAAAAAWBBAAAAAAAAAAAAAAAABFAAAHBLAAAAAAAJ',
  'AAAAABBBABBOAGAECIAABFAAAAAAACACAAAAAHBQABBBAAAAAAAAABCBACACBBANAJAEBHAAACAHAAAAABCBAJACAAAAApDB',
  'CIAIAAAAAAAJADACABBBAAAAAJAEAAAJAAAABBANAAAAAAAABFAAAHBGACAHBFAAAAAAACACAAAAAAAAAMBDABBBABCBAJAE',
  'AAAAAEAAAJACADDDAGAEAAEFCIAIAAAAABBBAAAAAEAABBAAAQCBBFAAAcBLBBAKADBDAHBQAAAAAAAAAAAABFAAAhBBBHAG',
  'AAAAABCBAAAAADACAAAAABDBCIAIABCBAJAEAAAAAEAMABCBAAAAADACCLALADACAAAAAAAAAGAEAGAEAAAAAAAAABBBAHBQ',
  'AGAWAMDBAHBLAJAEAAAAADACCIASAKBDAAAAAEAAAYCBAAAAAAAAACACCIAIABCBCLALAHBQAEAAABBBABBLAkBBCIAIABBG',
  'BBAAAAAABFAAAAAABFAAABBBAGAEAjCBAgBBABBBAAAAAAAAAEAAAAAAAAAAADBDAKBBADACAJACAAAAAJAEABCBANAABFAA',
  'AAAABFAAABCBAAAABBAAAHBGABBBAAAAABBBAGAEAHEOBBANABCBCIAIAAAJABBBABBBAVBBAAAAACCDABCBCIAIAAAAABBB',
  'AAAABFAAACFHBBAABFAAAAAJAAAAACDDAAAAAAAAAAAABBAKAABBAHBGAAAAAACFABBBAJAEAAAAAACFAAAAAAAAACFHAAEF',
  'AKBDACACAEAMAAAAAaCBAEAMAAAAACACBBAAABCBAAAAAAAAABBBAJAEABCBAuBBABCBAAAAAAAAAAAJBBAKBBANAMDBAAAA',
  'BFAAAAAABBAAABBBAJAAAHBLAAAAABBBCIAICvAAAAAAAAAAAAAAABBBAKBDAAAAAXBBBBAAAJAEAmDBAAAAABBBABBBAJAE',
  'AAAAADACCLAPAJAEADACACAgAEAAAAAFAABBAMBDAAAAAAAAAAAACIAIAAAAACDOAMBDAAAABBAAAAAAAGAEAAAAABBBAJAC',
  'ACACAAAAACFHAAAACIAIAcCBACACAEAAABBBBFAAAAAAAAAAABCBBFAAABCBAAEFAAAAAAAAAMBDBFAABBAGANAAAAAAAAAA',
  'ABCBBFAAADACAAAAABBBBBAAAAAAACDBAAAAABBBABBBAOAXAAAAACACABBBABBBADACBFAAABBBAAAAAAAAAJAEAAAABBAA',
  'AGAEAAAAAAAAACAAAAAABBAAASCBAJAEAACFAAAAACACAOAAAGBBAxCBAAAAAAAAAAEFBBAAAEAAAKBDArBBBFAAABBBAHBG',
  'AjBBAAAAAkBBADACAAAAACACAHBQAACFABGRABCBAAAAABCBABBBAAAACIAIAJAEBBAAACAHAAAAACAHAJAEAAAAACDDBBAN',
  'AAAAAAAAACACAGAAAEAMABBBAVCBACACAVBBACAHBBAGBBAKAAAAAAAAAAAAANCBCIASACDDAAAAAEAABBANAACBCIAIBBAG',
  'AJAEACCBABBBAAAAAAAAACFHABCBAGHEAMBDAAAAAHBGAAAAABCBAAAACIAIABBLAAAJABCBABEOACAHBBAKABBBAAAAAAAA',
  'AAAAAEAMAAAABBAGBBAKAAAAAAAAAAAAAJAEBBANBBAGA7DBBBAKAAAAAJAEABBBAAAAABBBABCBBBAAAAAAAAAAAAAAA5BG',
  'AEAMADACABBBACACAAAAABCBAAAAAGAABBAABFAAAUBBAAAAADACADACAKDDACDBAHBQAAAAAAAABFAAAEAMAAEFAAEJAAAA',
  'AtBBAAAABBAAACAHAAAJAAAAABCBANAAAAAAABBBBBAAAAAAAEAABBAAAAAAAEAAAEAAAAAAABBBAQDBAHBGABCBAJAECIAI',
  'AEAAAGAEABCBAGAEACADABCBABBBAHBLAAAAABBBAAAAAAEFADACAAAAAHBGABBBBBAAAAAAAAAAABBBAAAAAAAAAABAAAAA',
  'AAAAACDDAJAEBHAGCIAIACACAJAEAHEAAGAEACAHAAAAAACFADACAAAACIAIAAAAAAAAAAAACLAPABBBAAAAAAAAABCBAsBB',
  'ABCBAAAAACFHABCBAAAAAHBGAAAJAAAABBAAAAAAAHEABFAAABBBAAAAANDBAACBAAAAAAAAAJAEAfDBABBBAACFAHBLAJAE',
  'AAAAAHBGADACADADBBANAAAAABCBBBAABBAAABCBAAAAAAAAARCBAAAAAAAACIAIABBBABBAACACAAEFA4BBAAEFAAAAAAAA',
  'AACFAAAAAAAAAUCBBFAAAAAACLAPABCBAEAAAGAEAAAAAAAAAAAABFAAAAAAAAAAACAHAKBDAJAEABCBAAAAAAAAADACACFH',
  'BBAAAEAABBAABFAAADACAAAAAJAEAGAAADCDADDDAAAAADDDCIAIACFHAGAAAAAAAAAABFAAACACBBAaADDDABCBAAAAAfDB',
  'AAAAAAAAAKDDABCBAAAAAAEFABCBAAAAASBBABBBAAAABFAAAAAAAKCBAAAAAAAAAAAAAAAAAHBGAhCBAAAACIAIAJAEAEAM',
  'AHBQAAAAADACBBAAAAAABHAGACFHAAAAAYCBABBBABBBAAAAABBBADACAAEFAHBGABBLAoBBAEAABFAAAAAAACADCIAIAAAA',
  'AOCBACACBHAAAACFAAAAACAHAAAAACAHABBGBBAGAAAJAAAAAJAYAAEFAAAAAAAACIAIANAAABCBABCBAAAAAAAAABBBAAAA',
  'ARBBAEAMCIAIAEAAAAAAAAAJBFAAAMBD',
]);

/** The bytes sent by the source of every connection (src_bytes), in the order of the file: numbers in base 36, separated by commas, 1,000 per string. */
const SRC_BYTES = Object.freeze([
  '0,0,a0n,k,0,7f,se,3l,93,q,0,h4,0,0,lh,9q,5x,6u,19,0,0,0,5g,7p,0,0,86,8c,eg,1i,1ndc,k0,8d,1,0,0,5t,64,17,1w72,0,7p,8x,9b,0,6i,0,1630,0,1a,8u,74,0,0,4g,6d,0,2x,0,7u,s,62ua,6h,75,0,5y,0,0,0,5n,0,0,8j,8w,0,5z,9y,0,7i,9d,0,0,154,63,76,90,0,0,6k,1b7,93,8f,0,0,s,0,7u,18,0,0,0,q,0,0,rn,0,5h,5h,0,6e,4h,0,0,0,68,0,8x,so,0,1c,8f,e4,0,0,8,17,3g,0,75,16,16,63,0,78,0,9x,0,17,0,62,82,16,0,0,1jzo,8,0,0,6s,0,3g,0,154,207,6a,0,0,0,0,0,0,0,0,0,4i,0,0,4e,8p,0,0,7x,0,0,1hqk,85,0,0,3d,33y,e4,18,7m,5p,18,q,0,0,19,0,at,0,0,hew,8x,18,a0,q,0,2x,0,61,0,5h,7s,0,0,0,9t,6t,1jzo,c,92,7o,2x,s0,7v,x,6b,17,5v,6e,1h,0,76,1630,7o,0,18,6i,1h,0,c,8i,0,154,0,1h,18q4,0,128,18,0,0,0,4v,4k,0,0,9i,15o,1bi,s,3w,0,0,0,6t,4k,6j,9t,c,7d,0,0,0,q,18,94,i,0,9n,0,0,0,1g,0,7g,0,0,1a,62ua,c,0,0,5p,4e,0,6m,0,74,0,0,6t,a2,1i,0,94,0,4j,0,1630,2x,w,1h,5o,0,4i,0,0,0,8s,1g,ad,5ck,0,w,6g,0,6z,7z,tb,7y,0,8x,62ua,so,3e,0,0,0,2,0,m,0,67,6l,19,0,0,0,0,8d,18,1630,1,o,0,0,18,0,0,u,5h,6q,u,9q,1a,1g,0,6n,5r,0,50,9f,hu,1j,0,9h,1d,16,0,1630,2x,7x,0,3f,w,0,1oca,7j,0,0,0,wc,1a,0,ur,3i3,6p,0,67,0,0,5p,8m,so,65,6i,1k,0,8r,u,0,9y,0,64,2x,0,0,6t,0,1i,0,7g,90,1630,0,207,wo,0,66,70,0,6k,o4,0,0,0,n,0,65,207,s,0,9a,6n,0,uvc,s,66,5q,7y,7k,so,5v,0,78,2x,0,3b,gcg,0,1,17,62,0,0,0,0,5t,0,7v,5i,0,0,df,8q,8t,1h,0,0,u,1630,8r,8m,0,1i,0,9h,9w,62ua,o,5r,0,1,0,8w,1630,18,8g,9g,0,0,0,1,k,17,0,18,10,0,0,0,1630,so,7k,3f,0,2x,8x,0,6,1b,so,s0,8,1jzo,7r,0,0,lc,7c,d,62ua,1,0,66,q,12t,0,207,0,70,4g,0,6p,6k,18,6v,9j,0,85,79,9r,w,3a7,0,1,6t,5p,0,1az8,4t,6t,1i,74,0,5d,j3,9k,6m,0,s0,0,0,6l,16,e4,1,75,6n,64,5s,2x,93,s0,69,6i,8v,s0,9a,17lk,0,c,6t,3d,q,0,1a,eg,0,8x,17lk,1,18,3r,0,2h,0,207,0,5t,0,0,7j,0,8f,2x,eg,0,0,w,0,190,0,1630,5m,1630,6p,0,77,c,0,0,3e,18,0,0,0,0,3c,5v,17lk,7z,0,3g,0,a1,0,1k,k,s,0,0,1,0,i,6f,46,0,0,92,po,8f,8u,0,4j,8a,7g,78,u,q,68,69,5u,0,0,7n,8z,w,1,1baq,1,19b,5w,1h,0,6o,0,w,5d,0,e4,154,1a,184g,0,64,0,8a,so,6j,a1,6r,q,0,a,0,18,0,62ua,0,37,9p,crq,0,5v,0,0,9g,7l,0,0,0,1,10,0,0,62,1,1k,1h,5z,154,so,8,0,5a,96,97,so,2x,3x,281,0,17,u,2zn8,0,sk,207,1630,8t,62,l7,67,84,3h,5y,0,s0,0,1j,0,9e,18,4h,1630,8e,8d,62ua,16,0,1a7,0,0,18,8o,1,0,17,62ua,0,b,86,5m,0,0,18,13o,0,0,8s,4i,6y,8z,1bgg,6h,s0,0,0,c,1as,6x,8a,w,7z,18q4,0,64,0,6j,0,5y,0,4kp,8w,0,0,0,uvc,0,62,c,0,5y,56,63,66,0,0,61,5c,6o,0,89,6i,0,0,5s,rg,2x,1em,6f,0,c,1h,19,4k,0,8m,5r,0,0,ffo,5d,60,4i,6e,19,19uo,16,3f,0,0,207,0,0,0,4i,0,1630,0,2x,1az8,3ww,5o,0,1j,0,5q,0,6c,0,18,u,1mkg,0,0,5w,0,0,5c,66,7x,0,0,0,62ua,1j,0,6n,0,0,1,0,0,85,a0,k,0,74,i,3gl,6uh,ki,0,4i,0,88,0,86,6b,0,5k,2x,0,8g,0,1,7rt,0,17,6s,20n,1,w,q,8m,42,68,18,18,5c,5w,198g,s0,5d,19,k,19uo,1e,0,0,2x,6j,8a,0,0,0,so,17,2x,19,0,5t,2x,1acg,so,0,9g,4x,3b,6n,0,s0,2wg,0,6u,ki,0,1,so,0,0,91,9b,8e,e4,0,0,0,0,63,62ua,a0n,0,9j,0,3b,6c,so,2pm,1630,0,0,0,s0,0',
  '5d,5e,18,0,1630,0,18,0,0,0,18,0,0,0,0,1630,so,1g,t,6c,0,so,19,6j,8a,7d,4i,so,0,1a,7u,18,9d,93,0,0,29,5x,90,0,s0,91,19uo,6j,0,0,0,207,1,0,1630,4k,8q,9s,18,19,8d,0,3e,so,i,0,u,88,9,0,0,207,0,1i,a1,0,0,8i,1,0,1a,wua,0,1jzo,5u,8j,92,so,1a,7a,0,8p,7o,4g,o4,1j,6l,81,6x,62ua,99,0,0,4g,0,0,18,5s,68,6k,207,0,1c3s,4d,2x,1h,0,0,t2,2x,0,0,42,8v,207,1ndc,0,8m,85,5u,1,0,1h,o4,so,0,0,5,2gm,7n,62ua,1,0,0,62ua,0,17,1,0,0,i,9o,s0,0,0,207,0,0,8d,0,1630,6c,8e,0,0,0,aj,4p,2x,ns,0,0,so,1,82,0,7u,8e,v8u,2x,0,0,0,5p,6a,0,4k,1,0,os8,5t,63,2x,9s,0,4g,4c,jy,6d,so,s,88,0,s,80,0,0,0,0,87,0,4g,5r,0,0,6t,1630,207,0,0,1,7z,6o,u,6,64,1630,0,0,s0,1j,q,0,84,w,5w,0,0,4o,9s,6qp,0,72,y4g,0,0,c7n,19,0,eg,0,0,kl,0,8g,0,7t,an,6f,54,7f,8d,0,s,6g,1g,k,9c,207,0,0,81,6k,0,0,19,0,0,s,154,9y,8s,0,90,s0,8l,0,0,8w,w,4e,0,0,0,0,0,62,0,c,0,0,0,2x,0,1,0,0,1d,1a,62,8m,19,61,e42,1bgg,96,0,0,so,0,17lk,2x,4i,3o1,0,1,1,0,6v,0,0,0,1,67,0,z,0,0,0,8a,ub6,0,6t,84,0,26p,so,9i,9,6f,0,0,19,7i,16,0,w,6z,0,2x,96,0,71,c,r,67,1,0,207,1d,7m,0,i,0,uvc,0,0,1,7p,u,0,0,1,s0,0,62,w,17,58,30l,u,3f,59,8q,1b,88,4g,8j,0,0,68,19,18,w,0,6o,17,0,0,c90,i,2x,0,84,90,7a,207,18,0,6p,0,0,1b,0,18,6k,91,1,6bh8,0,0,1630,6z,0,4e,5k,0,7h,1j,0,u,0,0,8x,0,4i,0,62ua,87,18,6l,8,0,18,55,8g,97,207,0,4k,85,o,0,0,65,0,azl,6a,0,2x,0,m,k,p7,0,64,1j,1jzo,so,4e,1i,5t,0,w,65,0,0,9g,1i,6i,e4,6f,64,8c,6h,so,7z,4lj,1,5q,ac,2x,6c,zw,0,1,5a,0,4i,0,0,8f,6i,1630,5r,8z,4i,0,0,62,10,8y,6i,u,63,0,q,91,5c,6i,1h,so,os,0,93,skg,7m,7v,0,6a,6,6o,207,7i,7l,u,7s,6q,0,5d,1dy,0,4r,0,5u,5c,0,w,75,8b,0,0,7f,w,0,0,8f,0,0,0,4g,s0,19,94,17,0,8k,0,5f,0,5s,0,207,8c,1i,s0,0,4h,0,0,0,8w,s0,o4,0,0,0,0,207,5k,0,5y,0,8j,u,7y,8a,17,0,66,62,0,0,0,0,0,5k,0,s0,66,0,c,s,3e,67,0,1i,10,s,7y,1,0,8g,6h,19,0,7q,3a,v,19,o,7w,8g,0,7,7q,3g,9l,0,0,64,0,8j,2x,8n,0,81,207,7u,0,6r,0,1,6k,s,75,4i,0,0,207,8t,5c,8g,0,5a,17,5r,91,62ua,0,84,8c,0,7f,71,54,0,6f,86,0,s0,0,0,8x,ud,5z,9f,4i,5c,6c,0,6b,0,0,fo,4i,9g,207,0,0,0,18,18,0,59,zl,2x,67,6o,18,18,0,85,3d,1,9x,2x,e,0,16h0,1b,s0,tp,0,1i,6a,1jzo,0,0,3c,94,0,18,2x,so,9o,s,0,0,7y,5u,1jzo,4h,s0,i,0,93,94,1,0,207,67,so,0,0,10,1c,0,8j,0,79,53d,s,94,65,7b,g1,207,0,0,3gl,0,7b,q,0,i,6w,0,0,0,1ne,2x,h3,6z,0,0,k,67,0,un,0,0,1ak,4h,6qp,7a,3c,0,69,8m,0,0,0,0,0,71,so,1a,0,7t,7e,0,66,8j,1,8j,5r,0,2x,0,13fg,9z,pws,5t,6x,0,0,83,0,7w,0,8w,4n,s,207,7w,4g,s0,0,93,0,0,0,5t,15,0,0,0,so,0,0,s,4r,86,6b,w,81,0,0,1b,6h,u,66,8f,6e,0,2x,0,1e,0,1d,c,0,7z,0,0,84,4k,k,42,0,4e,207,3ni,18,8s,6h,0,0,2x,96,5p,0,1j,0,0,4k,w,0,0,1630,170g,0,1jzo,so,0,0,0,0,6s,0,95,6e,5m,5x,62ua,w,6f,67,0,0,0,0,1,7e,8a,0,1,1,0,2i,9w,0,83,0,s0,so,1630,18,0,154,0,0,9b,0,207,51,4e,0,17lk,0,6a,c,0,207,4i,0,67,9,1,8w,5z,8n,so,1630,6h,0,16b,1ohw,0,0,18,5q,0,a,0,0,2te,0,0,0,19,0,65,1a,w,18,2bb6y,7q,0,0,1,4h,4f',
  'r,0,1630,0,5u,0,63,0,0,0,6f,c,0,59,0,b0,0,4g,5f,1l48,s0,1630,0,62ua,1k,10,207,0,207,0,9w,15,0,0,64,0,7p,4l,5o,0,8m,18,0,16,0,82,0,q,91,6a,6c,19,uvc,0,83,7,s,0,1g,8z,zs,0,5x,q,62ua,4o,0,0,1i,0,4g,0,6i,92,1a,1i,6b,6m,8a,so,16,77,18,5t,7b,0,0,0,0,0,8v,0,70,1g,2x,0,1qm,1,0,5z,0,0,5a,0,0,8d,0,0,w,0,0,0,8t,65,0,62ua,5s,6a,s0,2x,0,6g,0,6o,65,0,0,0,x,0,0,0,s,0,0,10,1i,0,so,0,9v,3h,8k,62ua,az,w,16,0,0,0,8s,0,0,2n,49,5r,0,4g,5q,0,0,0,207,47,1,6p,wr,1,0,w,3h,0,5p,0,207,2x,0,0,4i,0,0,6h,0,so,i,e4,16,8i,8c,0,6j,90,16,e4,vr,86,86,5j,0,69,0,0,s0,5c,6v,7s,0,0,4i,1,0,0,s,8i,0,0,0,0,0,5i,0,6t,q,0,0,254,so,0,6w,e4,0,so,q,0,7x,0,18,6t,0,1,0,0,5z,0,19,0,0,0,eg,0,3h,0,0,0,207,0,6a,0,0,1630,37,63,0,16o,8g,1630,0,1h,2x,6f,0,83,5u,1,0,k,8a,1jzo,6l,84,0,8x,5h,so,2x,64,s0,8z,e4,8n,s,0,o,uvc,59,1a,0,6c,0,0,fc,8v,k,62ua,91,1630,7h,0,h3,3f,0,19,90,1g,0,1,19,8l,8s,0,8y,0,8c,9i,l,8k,0,c,4e,o5,0,0,0,1jzo,c,2x,1630,6v,7u,0,17lk,0,8l,0,94,0,0,6,0,0,0,s0,3g,0,170g,0,1b,0,0,62ua,207,7j,0,4f,5m,1s,62,0,45,5y,6h,83,s,0,0,s,0,1e,182,7e,5d,5r,0,1mkg,0,0,84,22,3d,0,so,u,65,c,so,64,0,19,0,0,0,0,8v,69,8h,0,5y,0,lo,68,51,0,17lk,0,q,89,0,0,5k,0,5z,251,7a,9z,3t,0,87,4d,1630,q,0,0,0,1630,q,0,0,0,3k,an,0,18,4b,0,0,0,6x,4z,0,84,so,160,0,68,6w,0,1,9r,0,0,9c,o,0,8h,0,0,0,9b,1a,5b,8t,0,0,4h,4f,5z,62ua,b5,9s,0,1,1jzo,0,87,5d,4h,0,88,1h,1h,7u,8r,ab,1,0,0,2x,7r,0,6i,6i,6y,0,0,8x,8v,62ua,0,19,s,6b,0,0,9d,0,1630,0,1,20,1a,0,0,3g,67,0,u,0,0,eg,e4,0,0,1630,0,0,0,0,10,86,h3,16,0,k,a6,8o,1a,8u,0,9l,3i,0,c,0,53,0,86,18,ay5,1kx,1630,0,65,8o,87,160,0,0,19,98,0,0,8c,4r,0,4i,18,10,89,0,6x,1lgg,8w,3h,3j,5l,91,0,1,9g,a3,9d,207,s0,5o,3b,0,0,0,8v,7y,0,46,0,87,81,0,92,0,7x,8o,0,6d,0,0,0,5o,79,0,u,0,0,6h,c,0,6j,0,0,5f,0,0,6s,29o,85,ht,yf,6t,17,0,9m,0,0,7t,84,1jzo,16,5z,66,0,1,8p,0,q,10,87,65,0,8i,q,s0,8d,6p,62ua,69,9t,93,6f,1h,0,4i,0,w,8d,0,td,s,s0,0,7s,6fi,0,w,0,18,0,4f,82,64,0,1i,6a,0,5d,0,18,8r,0,0,7a,w,9p,19uo,8t,1,19uo,6v,9j,0,64,0,s0,0,8l,0,2ky,154,7t,8c,2fc,6n,6n,70,0,0,s0,i,so,k,s0,4g,0,52,16h0,1630,0,0,s,s,3f,207,0,0,1630,2x,0,0,e0,0,4g,17,5r,0,0,7h,so,0,4d,0,96,aq,4g,0,1h,8e,8c,4e,0,0,0,6j,18,6u,0,5m,1f,6q,1,88,0,0,8e,0,z,1u,62ua,0,0,0,6z,5h,so,87,l9w,6d,94,s,k,0,0,0,1h1,0,207,7u,u,207,0,0,5x,88,0,1c3,0,0,5k,89,so,7n,1i,2x,0,19,0,tog,0,64,0,s0,1,sg,0,6a,1630,0,8e,0,0,18,0,1630,o0,0,c,4g,0,0,0,s0,0,0,30g,6h,5t,7m,3a,0,c,5x,5s,56,81,of,0,0,1h,48,1g,0,63,1i,84,0,0,0,8d,c,41,0,63,1n,4g,8,0,1,4d,a0,9b,1,0,a6,0,17,8m,bf,0,0,c,1630,2x,c,8i,ht,8i,0,8h,1l48,q,6g,3g,88,f,1az8,97,3z2,0,5v,64,0,0,4m,6r,2x,6a,0,1a,68,0,62ua,4g,0,0,0,70,c,2x,3i,0,0,s,1k,7g,6n,49,18q4,1,5v,0,5p,0,19,0,q,0,1630,0,1630,7z,0,0,5w,69,1i,8p,5w,64,9g,0,0,154,85,154,w,r,0,0,6a,t,q,5z,0,9f,6f,0,8g,s0,0,0,0,9e,y,an,ai,6b,0,6i,5f,ah,6h,1mkg,3c,80',
  '8c,1,0,0,5u,c,90,0,89,0,0,r,0,1ndc,0,207,0,1i,0,5i,t2,3g,0,3d,70,54,0,0,u,6s,5p,62,0,0,0,62ua,0,3b,0,0,4m,0,13z,4d,43,6e,82,207,w,1,0,7h,10,8m,0,1acg,0,48,s,7c,16h0,0,66,8a,6e,8h,s0,4g,0,so,cyb,17lk,0,10,0,8u,0,207,0,8e,so,1f8,0,9p,0,0,8l,0,4i,w,8x,4f,0,0,0,0,207,fkx,99,0,9u,x,0,0,5t,s0,9p,6s,2x,207,6l,38x,84,q,4g,93,97,e4,0,0,0,s0,0,w,6g,1g,87,6g,0,4k,8s,0,0,ft,8z,0,2x,0,0,4g,0,0,0,s,7z,8e,86,u,3f,0,4g,8n,6b,0,0,0,0,19,8q,c,0,5z,6r,j,0,0,0,6h,8x,6g,69,0,0,8u,8a,0,s,5i,8z1,0,1630,0,0,3i,65,5n,15v,5,16t,0,7r,0,so,1630,16,1l48,0,6g,j3,1630,so,1k,o,8g,2x,0,uc,0,88,0,6n,5q,6v,6g,0,0,0,0,0,67,3k,8m,0,4i,207,3h,6b,w,u,0,0,0,1,7o,0,9f,19,16,6x,0,8z,u,5a,0,5v,1a,17lk,1k,s,133,1630,6e,17,70,0,8p,0,0,0,5o,89,0,7q,88,62,c,0,0,s,0,0,0,1y5,5p,10u8,0,16,4k,1,0,6u,7z,0,k,18,0,19,bq,0,0,69,0,u,5y,1630,1,ad,15,4j,63,1630,0,u,7z,0,0,sn,6d,0,0,5x,59,0,0,0,0,2x,1g,3i,s,1j,77,0,w,0,so,91,0,6m,0,0,0,8a,1,62ua,ax,0,6i,0,68,ao,p,0,0,17lk,5y,9b,5,0,0,0,0,8d,li,0,6h,0,5e,1jzo,1a,0,0,0,19,5s,207,8f,0,5t,0,17lk,0,0,5f,rf,8k,w,b,0,4i,5r,so,4e,0,0,9i,19,0,i,7p,0,17lk,65,0,p,17,0,0,0,16,5v,5q,0,0,1a,3i,0,5es,0,0,7gg,1j,0,0,so,8i,1630,0,1d,0,62ua,5x,0,0,io,0,5p,1c,0,0,0,0,1c,s0,8z,s,3h,6z,0,v,9f,0,8d,1v98,0,0,a8,0,0,0,1a,0,16,0,5s,17,2x,it,19,e4,6o,r,3h,0,0,0,8f,3g,0,0,0,2x,1g,6z,207,17lk,8f,0,0,10,0,0,0,6,ql,2x,0,88,8v,so,17lk,0,18,c,s,0,19uo,1h,8j,0,w,5c,0,8h,4k,s0,2x,0,0,4x,8x,55,61,2x,1630,0,4g,k,q,7k,62ua,3f,48,0,29,0,9j,6h,0,1c3s,0,9j,68,60,6g,w,s0,3e,10,u,0,7d,10,0,w,6q,0,ry,8l,0,0,1,0,8f,s0,0,2x,0,7y,19,3e,0,0,8b,17i,c,6f,184g,0,4i,m,8w,0,1az8,mk,7x,rj,c,8y,0,0,k,207,18t,0,1630,so,0,c,0,1,a7,9k,0,8i,7s,0,19,0,0,8f,17lk,0,5n,91,8n,0,207,0,0,0,0,73,15c,6l,64,0,1630,15,s0,so,297,0,0,4f,6h,w,8s,0,j3,0,0,k,18,5p,0,0,1630,8c4,8t,1,0,1630,87,1a,0,1,s0,1c3s,0,ar5s,0,0,k,170g,0,9c,s,0,0,0,0,0,0,k,0,8q,5m,0,0,0,0,0,1j,0,0,207,18,4a,62ua,0,eg,37,0,0,1uv,16,0,0,q,0,1h,0,eg,0,0,9t,0,0,0,j3,8d,8x,6k,0,18,0,s,s0,68,8k,62,4a,6p,0,5m,0,62ua,0,19,1630,0,1630,96,1,5j,1,w,69,1a,9t,0,207,63,6p,e4,1e,5t,1lgg,8u,6l,5f,8e,eg,nb0,18q4,8m,1i,so,6h,18,0,5w,6t,0,3g,18,5o,5a,5q,3j,4e,a,170g,c,1,0,4k,9q,so,3f,s0,94,0,i,uvc,0,4g,0,0,0,0,4c,0,0,70,184g,5v,62ua,8i,6e,7x,0,18,8c,8r,0,rq,0,3h,1b,7p,63,0,0,7j,6m,0,0,0,0,so,c,1630,6c,6f,0,8f,0,s,pl,0,s0,0,s0,k,207,1h,6f,5g,ak,u,so,0,0,0,w,0,5i,6o,8u,s0,17lk,6c,17,k,s,0,8i,0,0,7w,0,0,0,0,0,a,207,0,0,1i,3e,1j,18,e4,8l,0,61,8m,17,so,18,1kcg,18,0,6u,0,0,0,19,0,1,s,0,5i,59,0,0,0,oh,559y,0,0,1h,s2,0,w,0,0,63,rl,0,1630,0,3e,5v,0,70,0,8m,18,8x,s,w,66,1,w,0,5r,st,18b,0,1,18,16,18,q,i,7y,w,3l,4u,9a,7u,0,0,c,4k,0,0,hx,0,85,8w,0,16,1d,80,w,0,70,2x,0,0,5b,v,6x,0,w,s,1c6,u,0,0,6r,0,0,5t,0,0,1i,8,lt,8w,62ua,0,0,17,17,7d,53,4k,6d,63,16,7,0,0,9f,0,83,3d,5w,18,9i,so,1a,0,4c',
  '18,64,19,0,0,0,so,0,60,0,0,0,0,5h,0,207,19,0,1,19,0,51,ng,s0,so,2x,0,6i,17b0,s0,u,0,10,0,0,0,5y,5r,207,1630,98,8e,0,0,so,8u,0,0,1h,18,4q,0,19,0,0,1,0,r,5k,5k,9b,0,0,9i,0,69,0,1,0,1,0,s,88,16h0,99,2x,96,1,154,6g,so,18,1i,o4,70,0,0,0,0,5z,6b,8d,19,1630,42,tag,1a,8p,9a,0,0,2x,8y,94,1jzo,17lk,0,83,w,c,0,so,0,0,0,1i,0,0,0,8g,6x,6b,0,9p,1c,i,6i,0,0,7k,0,5z,5x,0,5p,5s,19,207,6s,0,0,w,o,0,8e,5z,o,6f,1630,w,1,0,63,6y,91,9o,8t,0,0,h3,6m,90,207,71,8k,m,3b,76,3g,0,0,0,6q,1630,e4,7q,1630,17,1630,w,yj0,0,8x,93,0,86,s,q,o4,2n,0,74,0,0,65,0,80,8h,0,2x,207,61,ub0,0,0,u,207,7l,7y,3f,s0,3h8,0,so,0,18,0,8i,6k,207,w,0,1630,0,1c3s,6t,1,6q,0,78,s,0,0,3j,0,u,0,6f,1t6,dg,w,5r,8a,8j,w,0,4e,0,c,62ua,8k,0,0,1630,0,0,8p,8p,0,64,0,8a,0,8,9w,7z,8w,4k,0,7l,0,0,0,96,0,0,6g,s,1pwg,5t,0,w,1630,0,0,10j,0,0,5y,1wds,61,3h,0,0,18,0,8f,8o,0,0,0,8m,1,0,0,0,9c,1jzo,c,7f,7w,62ua,0,19,0,0,vp,7e,0,6j,0,9o,1a,0,9c,2x,73,lg,0,0,87,61,0,0,1b,0,0,0,0,1630,0,64,7i,s4,0,5s,0,0,0,56,93,68,9t,so,0,1j,0,7o,6g,9j,0,v,w,8s,69,0,6l,0,5b,0,5l,9a,6n,0,0,0,u5,0,s0,e,2s7a,4g,p,0,25r,17,0,8s,0,7v,1jzo,0,q,6,5w,8z,6,7x,4l,q,83,0,6n,62,0,1g,k,0,5y,0,0,14,19,zb,k,0,6k,s,0,67,6k,0,0,1i,67,0,k,0,0,5o,0,4e,2x,so,1m8s,7d,17lk,0,0,5s,19,69,83,o,0,s0,0,0,5hj4,4f,6v,0,0,7y,0,68,8l,1az8,0,93,2x,cw,n3,8p,98,0,u,207,1,u,5z,69,207,s0,0,5p,e4,a6,62ua,2x,0,64k,4i,8s,3f,5u,0,61,0,5k,82,0,5s,6a,so,1,0,0,0,1f,7p,6b,5j,8i,9c,8p,62ua,0,0,6k,8l,4g,9s,8m,4j,62ua,80,so,0,0,0,1e,0,1,0,6y,0,0,5y,0,0,66,5r,1a,62ua,1g,5x,0,96,5o,0,0,8g,w,8j,98,85,4m,1zrg,0,0,0,8e,0,5r,0,4g,7z,0,9b,4k,4g,so,0,0,6g,207,0,w,81,5k,18,184g,0,69,0,0,c,1,1f,q,1iv4,0,0,0,6d,1a,0,0,85,4g,0,65,5w,s,9a,6j,0,0,7r,16,10,8j,5w,0,89,66,2x,0,2x,s,1,5h,0,1e,5t,6f,0,eg,0,66,w,z,0,0,1,s,4y,3f,s0,s,5e,0,6g,o4,5e,17,6c,v,8q,4k,19,7g,207,1,0,r,8a,4i,s,r,5h,0,97,0,0,3e,0,0,0,so,0,0,9k,av,pl,31k,18,84,1,1a,0,1jzo,8f,u,87,0,0,s0,0,s0,0,1,8h,5m,8y,0,98,0,4e,1a,c,1,5w,i,0,4e,0,0,8i,2x,8d,5y,e4,6n,6y,8h,0,0,0,0,1j,8e,18q4,1a,so,s,te,s0,9k,9a,95,w,0,4q,lt,0,5s,207,5s,8c,92,54,5c,u,0,6k,60,8n,0,1gm0,85,4g,0,c,6s,s0,1d,3h,18,6m,0,9e,0,uf,18,0,170g,0,0,0,0,1,if,7v,4e,62ua,9l,0,0,3d,0,0,7p,7r,0,4i,0,0,0,8z,5y,0,0,5p,0,1c,0,0,1a,0,15,6j,5a,6s,3c,6s,0,9k,8g,c,6e,0,19,0,3d,0,1630,1i,4t,6c,89,1c,0,65,4e,18,sz,6l,2x,6,8x,1j,4g,1jzo,0,8,q,0,47,99,9l,0,a,0,17,8x,eg,6q,5z,0,8b,w,0,0,5o,0,4e,6j,0,0,86,4c,0,1j,6z,0,1,0,0,0,0,0,1,1kb,18q4,6h,1i,6a,154,9e,124,0,w,0,17,0,0,0,6b,8e,3f,170g,62,0,p,0,0,70,s,uvc,1a,0,6u,0,1,0,1ax,0,0,0,4g,w,0,0,19,17,68,6g,9i,61,60,0,v,92,3a,u,0,0,0,0,1h,8i,207,0,w,5o,0,0,0,i,8f,6o,0,9k,92,8t,0,0,90,c0,1630,0,0,0,80,0,0,17g,1b,0,0,8i,14,f,8b,0,3d,v,6z,5c,0,63,i,0,0,k,4h,74,9y,0,0,9e,8r,0,k,8y,3c,62,0,90,1,1j,8g,k,ip,19,0,207,0,46,19,0,3c,6o,85,7z,16,0,6j',
  '1a,0,0,3j,4g,6h,9g,3waw,76,0,22,1g,7r,0,ln,4i,0,95,19,cfn,so,9f,u,7s,so,1630,8a,so,1n,1630,a,0,w,0,3k,0,c,62ua,0,np,0,0,0,17,1,0,0,0,0,s,0,0,0,0,5q,9z,5o,3a,0,3f,42,0,0,0,1m8s,0,o,9t,0,0,8o,0,0,8k,0,2x,9x,1630,6g,1a,1,1,0,7k,4e,0,5m,61,1,b0,so,27n,0,s0,3c,1a,s0,0,0,6h,0,0,5r,6b,0,63,1a,7q,1,0,0,0,62ua,0,0,5k,8x,1l48,1,2x,66,3j,6p,0,0,0,0,0,0,0,0,0,6l,19,9ic,61,1az8,4i,0,26is,0,6a,8m,0,17lk,0,0,0,0,0,0,5f,8g,6h,1xs,0,5y,16,0,8j,17,0,4f,18,0,8a,0,0,8y,1h,ol,0,0,69,0,0,s0,0,66,0,19,2x,s,1630,so,8o,9i,o,9f,3h,6h,0,4b,0,c,0,aq,s0,0,15,18,1,7w,0,61,0,0,0,w6,16,5h,1e,1,0,1,170g,4g,8h,0,0,0,0,0,0,6s,0,0,so,0,7r,5p,0,5o,6r,19uo,8q,1,1630,0,31,14r,k,1i,5m,1c3s,0,uvc,1630,1630,0,1a,s,0,0,0,0,e4,8g,207,0,88,16,6n,3g,18,1a,67,90,u,q,y,8l,6i,0,a,so,1jw,4e,0,0,7z,7l,yw,8n,8q,3p,1j,7x,0,8g,0,6c,0,9c,0,0,0,s0,0,62,4e,k,7,8i,4q,0,yx8,3g,0,2x,0,x,fo,0,1630,2x,44,84,18,0,0,8g,s,0,c,10,8q,7f,5q,65,s,3e,0,1,18,0,8x,6u,0,1630,62ua,0,0,0,0,0,0,0,18,so,8h,eg,1630,0,3i,5a,0,q,b,8e,1630,5r,s0,0,0,64,6e,5u,5c,63,2x,c,6p,1f,0,93,8c,i,83,s,u,0,s0,207,19,2x,4g,1g,0,3f,0,0,0,19,8r,0,6d,7s,0,0,s,0,c,0,j3,207,1b,19,19,0,6x,0,0,1a,1b0,16,1630,c,0,62,s,c,0,1jb,6g,6c,0,1dx,s,1,42,18,0,0,1,0,0,62ua,0,0,0,0,0,so,0,0,62ua,c,1g,0,1i,0,0,0,1,63,18x,207,0,4c,1l48,0,207,6e,0,0,sn,uf0,0,0,1630,0,u,0,nq,5e,19,7l,b2,42,1f,0,18,1,0,207,0,0,18,0,8j,0,6g,8l,7v,9r,0,0,76,86,0,0,0,0,66,7b,p4,5p,2x,0,w,18,8f,207,5w,8n,4f,0,0,1a,8x,9b,8b,0,0,1h,s0,1g9,so,0,98,11ekkw,q,80l,1a,1c3s,4o,42,so,63,81,265,0,q,0,4i,5r,90,0,i,0,0,0,8s,0,0,eg,147,4k,1a,6r,0,0,0,81,39e,8d,8f,1630,0,69,w,s0,1,0,0,c,10k,207,0,154,52t,1a,5c,1h,0,0,0,1,c,0,0,0,82,8o,8e,51,0,w,154,0,81,4k,5p,5t,0,7t,0,6a,0,0,4e,0,0,0,5x,5p,eg,2x,3g,5z,0,1s,8p,8m,9z,s,4j,6m,so,19,0,207,0,0,0,1jzo,0,4g,95,7y,1i,0,86,7l,4f,6k,16,fo,0,3h,9c,0,0,8o,9f,0,6q,4y,0,6o,o,78,0,0,1i,0,1,0,5d,1630,0,8v,0,73,5q,8q,1,1j,9c,0,0,0,5q,19,17,5u,9e,0,0,1c,0,6f,5m,0,1a,5m,q,8i,0,0,0,4e,0,2e,4f,6q,8i,q,0,0,0,5o,1,86,0,0,0,1h,0,0,0,0,0,j3,0,0,v,6y,62ua,w,0,98,14,207,0,8x,w,12t,0,0,0,2x,0,0,0,0,6f,0,0,0,1,0,0,0,19,0,1p,0,s,0,0,0,s,0,62ua,7v,67,4i,0,96,0,4i,3tb,0,0,5z,6c,62,8,7v,5c,0,1630,1l48,196,8m,0,9e,0,c,0,w,5w,4l,0,7h,3i,0,1,0,4z,207,s0,0,0,0,5m,1j8g,0,19,0,16,8g,6d,0,8q,9i,8c,0,0,7t,0,16,0,75,c,0,0,207,0,0,0,7d,1630,1,8i,81,s,1630,so,8j,17,17,1a,12kg,9b,2x,0,ju,0,0,5m,5y,c,0,72,0,0,8v,8q,0,0,0,0,0,4i,62ua,0,0,8v,0,0,170g,4t,4d,1h,5g,0,18,3h,19,94,2x,18,62,18,8x,1g,4k,83,0,tag,19uo,1j,8g,6d,8q,18,0,0,0,0,0,so,0,0,207,k,16,6d,0,0,s0,6f,154,9h,8z,2x,0,8o,0,0,5b,2x,207,6x,0,7v,16,0,62ua,8c,0,1630,7t,0,44,1h,1h,6n,9b,b,9r,8u,0,0,0,0,yf,0,0,7t,2x,4d,73,6c,63,so,0,44,1,5z,s,q,5w,3e,1,62,9h,19,62ua,1630,4n,0,0,6b,68,0,0,68,3p,17,61,19,0,2qk,17,s0,s,18,0,so,0,0,0,67,6f,w,7w',
  '0,2x,3e,0,79,u,7m,0,0,7z,0,0,1,6j,5t,1,k,0,so,s0,0,eg,0,8p,s,4k,0,0,0,1jzo,62,6o,w,0,1i,0,1,0,29,8b,81,0,81,s0,1ha,8i,1630,80l,w,92,62ua,s,5q,k,84,0,0,18,9q,8,so,0,1,4s,nt,6t,2x,170g,1,19,0,5n,0,17,1l48,4i,1c3s,w,6e,0,0,0,so,0,0,0,62ua,c,0,0,0,1630,0,ag,u,61,s0,0,u,6g,0,4d,w,0,8m,0,16,0,0,0,9b,3c,8k,0,0,0,w,3h,c,7b,0,1jzo,1h,16,1j,0,6i,so,5h,51,0,0,s,0,arg,5a,0,0,4i,1j,0,207,0,1,8b,9t,0,0,0,62ua,0,0,8y,0,8o,c,0,s,w,0,s0,0,64,0,207,0,0,s0,0,0,0,2x,0,0,5gi,w,0,2x,2x,w,bv5,v,1,s0,0,96,pe,0,0,62ua,4k,c,0,67,6d,so,5z,0,0,64,86,1,0,0,0,0,8p,n,65,0,6x,18,s0,vw,4u,10,s0,1jzo,1i,0,4g,0,5u,1j,0,0,5r,4m,62ua,c,9a,8x,8e,4a,0,1vy8,0,60,1g,7t,0,5p,1a,6e,0,7r,6o,8q,80,17,1a,1c,5j,0,t,3e,4i,83,0,0,u,0,0,0,25,0,63,0,3y,3f,9l,0,w,1630,0,0,7u,4i,0,0,u,0,207,0,9u,c,0,6w,0,0,0,41,0,88,0,0,1630,8x,so,0,0,6u,18q4,pws,6q,1bgg,5t,0,e4,8r,1j8g,0,3g,6x,8,17,7e,0,0,18,0,3g,1630,207,0,62ua,0,0,0,1m8s,1i,62ua,0,1m8s,6r,s0,48,3g,0,0,0,6h,18,0,0,eg,6j,1i,0,6b1,0,2x,9v,0,0,3gl,0,0,8k,0,2x,207,s,18,4l,65,u,0,0,9w,6t,q,6w,4g,18,8m,0,0,0,q,61,207,0,19,5h,0,5y,5jk,7u,93,0,66,7a,71,e4,4h,5l,18q4,0,0,1,0,0,8y,1ymw,5q,5z,86,1i,3i,4k,v,0,90,0,9c,0,0,6p,c,0,22,8v,0,6y,2x,8x,0,4i,1630,w,ap,0,7s,s,2x,0,6p,a2,8f,6r,i,7z,5r,90,1x0,0,154,0,68,2r,69,0,s,7y,5k,0,17,so,9p,1,3e,94,0,0,0,e4,0,3h,65,9b,59,0,0,0,0,1jzo,30g,1,1,w,0,90,0,k,0,0,0,207,8h,0,63,1c,79,0,1a,207,5j,0,k,r,1k,u,sm,1630,1g,19,6q,1j,5h,0,84,8h,s,0,7n,s,0,22,so,q,cn,72,92,1i,8v,0,0,17lk,e4,0,0,0,8s,77,0,0,1j,0,5k,8x,wo4,0,0,4u,1m8s,1,w,1i,7u,73,0,q,0,8,0,0,67,1630,6u,0,85,0,0,0,0,61,2x,8h,0,87,0,8,0,k,61,0,4k,u,8f,u,1e,0,0,0,q,8b,0,4k,k,67,0,7j,0,0,0,w,1i,6o,6a,0,9u,4g,2x,1,5m,0,67,0,0,0,0,1630,6b,0,t,w,0,6c,6y,0,9f,0,1h,0,5z,4r,7f,23,0,0,0,68,o4,0,207,k,0,16,6l,8n,1630,96,2x,0,9f,197,1630,0,8i,0,0,a4,s0,0,6m,1i,8t,16,0,q,90,80,1g,0,0,6x,18,4j,18,0,0,4r,1jzo,4l,4a,0,1,5n,q,3h,4k,0,jx,0,1h,18,7l,0,6o,1g,9j,1630,6r,0,30g,2x,0,c,84,78,os8,207,0,0,1,8o,0,88,0,1,s,s0,85,19,154,16,yj0,a2,0,75,0,0,9p,0,0,c,0,t,84,8p,w,j3,s0,40,0,0,207,0,1al,4z,0,6c,63,0,84,0,so,kp,1jzo,0,8n,0,0,0,0,5x,1630,6x,62ua,1az8,8v,5q,58,0,8x,0,1,k,8d,5q,0,ah,0,8h,3c9,0,so,0,8k,5x,0,6x,0,uvc,eg,0,0,5o,2x,83,3g,0,0,0,4i,7h,1bgg,0,ej,3e,19,1630,43,7t,5j,85,1,8d,1a,0,0,0,c,5y,67,17,1jzo,62,0,8k,so,8m,eg,0,v,0,8v,0,1,3h,0,137,62,5b,1630,0,0,0,12e,1,5t,3h,62ua,4k,0,0,1630,0,8g,8m,1,a5,42,1ohw,19,0,17,10,5q,k,xo,0,r,k4,0,0,0,s0,6f,7w,bc,5q,6j,97,w,0,0,63,5h,17,8v,88,0,0,0,3f,0,0,85,0,43,6s,0,0,u,2x,0,16,18,10,0,62ua,207,7s,1k84,6a,1,0,1a,c,8o,2x,5o,207,207,c,0,5o,0,0,9c,c,8h,7u,s,r,1630,0,0,0,4i,93,i,3f,so,so,0,81,0,0,5c,1630,so,0,1630,0,0,2x,207,8h,0,8p,89,77,4g,0,0,ec,0,69,67,xi,0,4h,5j,y,c,42,19uo,1a,2x,0,ht,p,8e,0,69,0,88,94,163,0,0,6k,0,1,5r,0,7d,1j,s0,0,4g,so,8,4e,0,0,6f',
  '8y,0,4t,61,6g,17,0,3c,4e,s,9q,0,o,2x,5m,1630,0,0,88,0,0,6r,0,so,2x,6o,0,0,0,67,6y,3f,1gk,5n,u,0,84,0,6j,1its,0,19,8e,0,0,6p,7z,85,207,w,85,0,1jzo,6q,0,7x,0,0,0,0,s0,0,e4,0,4g,5z,5l,c,0,0,0,so,s0,uvc,1630,0,w,0,q,2a4,u,6d,w,10,0,r,0,4g,0,8z,w,0,4g,0,0,s,1az8,0,60,a7,4c,3b,0,5o,1h,o,8o,0,2z,0,94,62ua,xs,1h,5n,0,18,5x,0,0,0,8z,9i,w,4c,95,9l,0,4w,2x,0,0,11k,0,0,17,89,so,9r,6q,5i,6i,0,0,0,0,8s,0,5s,1az8,10,s,6e,82,4c,5q,9n,ic,8p,0,0,1h,0,16,7g,7n,0,0,1zu,0,0,o,5o,18,0,4t,0,0,0,0,0,0,3e,1,so,1,3e,q,19,ht,0,95,19,3d,62ua,5o,0,0,u,w,5i,6l,5a,0,55,19uo,s,4f,84,s,15,74,6z,s,q,0,94,1c3s,7s,u,0,8k,0,0,0,6e,kj0,17lk,0,c,8i,8e,17,0,1630,8i,5h,8o,0,8p,17lk,0,0,62ua,0,s0,0,9e,85,so,q,0,72,0,0,5y,62ua,0,1k,8y,5ck,3d,68,6h,17,0,1630,68,0,0,60,1,6w,0,18,c,0,0,6o,l,3e,69,0,0,w,29,0,0,5t,0,207,mm,0,95,0,s,42,0,0,67,0,1,0,n0,5i,0,4g,0,so,0,9h,6p,1v98,4e,1az8,5v,0,5w,zs,6j,0,0,0,18q4,17,i,1a,0,4i,1,8l,1630,0,0,94,207,83,3j,0,1az8,87,0,0,0,i,0,0,8p,0,da,7d,5a,6w,1z8,qk,0,77,5j,4h,1,8,1h,0,0,90,0,97,6m,1jzo,0,k,62,8z,sw,1,5r,0,170g,0,1a,6b,6j,1,z,0,16h0,8i,6v,3h,154,0,1a,0,65,0,so,207,1h,9p,18,86,1l48,2x,0,0,0,5p,1h,0,i,0,0,1h,207,0,7q,8u,9a,84,72,0,8g,5w,j3,0,0,3h,1b,1630,8z,3c,0,7e,1,0,79,207,0,8b,c,7w,65,1c3s,8p,0,6e,2x,5s,0,0,8j,7q0,0,5r,c,0,0,0,0,0,1j,8a,0,1b,4g,19,123,m,i,6z,6i,s0,0,k,0,0,1m8s,5t,1gd,76n,5w,0,0,0,18,0,0,82,xy,0,4v,eg,70,o,19,4h,1i,67,18,66,0,0,9c,5z,6p,0,wn,1a,i,5h,0,0,17lk,0,5h,0,6d,1,so,0,95,0,62ua,5y,a3,4t,eg,0,1c,u,0,1h,0,0,1i,0,0,1e,6u,1g,18,0,5w,14,e4,8h,17lk,0,0,c,8j,i,82,7m,0,0,0,0,3i,0,5iy,9r,6a,0,60,0,0,0,1i,0,0,0,0,79,2x7,0,5e,16,1i,0,17lk,0,81,0,k,9g,c,90,5r,18q4,mq,5s,8u,6s,8k,84,0,7z,5w,o,6l,1i,6g,6x,0,1j,1,6o,0,0,9d,0,6f,5p,0,0,s,5u,0,so,7n,chw,4g,0,w,0,6,88,8i,18q4,0,u,1630,0,3n,1c,8f,0,1,8x,0,16,e4,7r,1a,0,1630,2x,0,0,79,0,0,0,2x,9c,so,0,k,so,0,168,0,91,0,2x,15cg,92,so,0,5t,59,5t,1jzo,0,5o,1cx,so,w,5k,8p,0,19,3d,62ua,do,5v,8o,68,0,0,0,8n,5x,11ys,3c,0,0,88,0,79,8p,0,0,65,1,c,0,18,1a,0,u,19,7m,3a,0,0,66,1630,5v,0,62ua,0,7b,7b,207,207,0,z,0,1g,2x,0,5l,0,0,108,0,0,7y,96,2x,h1,85,8k,63,0,1qr0,4g,4k,so,0,8r,8r,1630,6z,0,0,69,1,0,1,0,0,9i,6v,8w,s,8d,8x,c,0,0,1h,8e,0,5q,7t,65,0,3e,3l,0,5i,0,0,106,0,0,16,0,6q,93,0,0,83,0,7u,6j,w,c,6z,0,8b,6k,1630,8z,u,0,0,0,2f4,0,63,1,62ua,8u,62ua,1a,s0,19,0,6c,0,8b,s,0,9q,0,4i,i,1,2x,85,0,80,u,0,0,2x,5c,so,so,0,w,4x,q,71,0,87,0,u,1,84,62ua,4i,10,0,9i,9b,0,0,7b,6r,u,f7,1i,62,q,0,8b,nqu,0,62,93,5q,0,0,0,0,82,0,8b,pbh,cyb,0,i,62ua,o,64,5e,0,8q,q,207,79,0,18,19,1630,0,5x5,4f,1h,8x,207,h3,0,6u,0,0,0,2x,5y,8w,18q4,66,0,0,6o,8b,1,7b,w,207,0,y7,0,0,0,0,i,76,so,246,3b,5l,0,64,0,0,so,8k,0,0,4i,0,6h,s,7e,87,74,7x,s0,0,k1,86,9t,1ecw,0,5z,0,58,0,0,1c,8t,0,ag,1h,0,1,0,0,5t,s0,c,0,8x,4f,9v,0,e,5o,3f,0,1,5a,2l,0,q,7s,1h,0,8t,5f,1,0,0,3j',
  '1a,w,0,51,7x,207,1f,so,q,1,7b,pws,0,1,0,7y,0,0,7y,7s,97,0,0,0,an,0,1,1,3f,1a,5y,0,0,8f,c,7u,1nog,so,0,1630,0,w,0,76,0,0,7y,4i,4c,17,72,w,2x,98,62ua,0,18q4,8l,0,1k,0,bv5,1b,3g,0,5q,8s,184g,q,2x,0,90,1c3s,0,0,0,0,0,5o,1,17,1f,5r,6d,8z,0,4q,9j,0,c,0,0,78,0,0,a7,17,5z,0,0,1a,86,0,0,4g,7e,w,8i,18,0,2x,0,17,0,s,1bgg,0,9g,0,1a,q,0,5p,10,62ua,b2,0,0,l,62ua,1f,1a,0,7n,0,1k,6a,1c,5x,c,1a,0,1630,2x,1,88,c,8v,5h,r,96,1,4m,4f,0,0,0,0,5u,5y,5r,1,62ua,1i,1h,6v,17,0,0,5y,1,k,9m,19,89,8y,0,4o,w,0,1,5p,1630,64,c,2x,60,5s,1,v,6j,4g,0,6h,2x,so,9v,i0,0,z,1j,0,1h,0,0,s,5g,17,7z,19,8h,75,0,3h,s,r,58,0,7h,8j,3f,0,1,1i,0,0,3h,1,0,0,5h,4g,kt,47y,0,1,0,67,75,0,0,3e,65,a9,0,62ua,8x,0,0,5o,0,6b,8w,8,18,6b,0,0,8t,1630,0,5t,0,bp,4g,6w,0,1w72,6y,0,6t,0,6j,4g,6g,0,0,0,8j,0,65,u,8f,4k,10,84,6r,7e,lk,0,0,8j,1,84,0,4g,tx,8a,17,4y0,8l,eg,141,0,j3,8v,4y,0,8h,49,0,207,0,5q,4g,s,0,1g,154,99,4g,0,1a,6o,s,a0,2x,220,0,90,w,0,s,0,63,1630,4e,3d,1jzo,4t,0,2x,6o,3b,0,0,u,0,0,1j,s0,6d,5x,so,89,0,62,so,6i,9e,0,3i,0,0,84,0,70,1no4,9y,0,0,6o,s,0,0,8d,1,0,1j,0,1eo,aae,80,6j,1,0,5w,0,0,2x,8o,4e,0,0,0,6d,1d,5j,0,0,0,ec,85,3x,0,6b1,7e,0,1j,0,9a,hu,0,0,0,3d,7j,0,5k,5w,6g,0,0,9c,0,q,47,17,1,s0,so,5s,0,1630,2x,7s,0,0,47,c,17,0,6f,4o,0,u,4g,0,1630,78,0,0,0,eg,5q,1630,0,0,0,0,0,8r,s,0,207,0,39z,0,so,0,46,1630,1,19,0,0,65,4e,4gc,6l,s0,0,0,0,0,0,0,w,8h,9c,6g,0,k,1i,u,0,5p,q,8l,92,0,8n,0,1b6,0,1,3c,4i,0,0,5c,5s,1g,6o,0,0,so,0,2x,6t,4v,0,184,0,0,q,65,53d,207,0,5u,c,8j,5,32,c,0,81,4d,ap,w,0,0,1i,0,4g,8q,s0,5n,0,c4q,u,62ua,5v,an,1b,0,0,2x,4g,0,94,62ua,3c,v5,6c,0,5p,0,18q4,0,k1,5t,so,18,0,17,84,0,0,ffs,0,5b,5y,1pmg,0,16,3a,8m,5p,eg,1jzo,6x,0,0,i,9s,3i,5k,0,so,6b,207,0,9c,62ua,0,5q,sw,1a,2x,k,0,0,6n,i,92,62,9f,1bgg,31k,5z,0,az,1j,0,2x,1630,0,1h,s,5p,0,9d,6a,0,0,0,9d,5c,q,4x,5l,vu,10,1j,0,15y,18,u,1kk,0,0,s0,28,s,8n,6o,18,1,1630,1u4,od,8n,0,1c3s,19,65,0,0,0,5u,eg,198g,8y,39p,0,2x,70,0,0,65,64,0,i,8i,0,6n,17,1d,62ua,4e,0,5x,6b,3e,s0,6e,7r,6l,0,62ua,3y,4i,61,6v,0,8t,0,5w,0,8,l,6l,2x,0,8b,2yf,7s,4k,207,0,0,6m,so,4g,5b,7,8t,0,5t,67,0,0,62ua,i,0,79,0,6h,0,0,0,154,68,1,1630,0,82,0,0,6r,18,4k,100,j3,5l,17lk,0,0,0,0,0,5o,1h,7z,2hi,16,0,5t,18,1,8c,62,1h,9a,0,0,19,0,0,62ua,0,rw,0,84,83,0,0,65,5u,0,9n,6e,1,9c,0,0,9i,0,85,0,66,0,154,1a,0,4k,4g,0,0,0,7t,19,6k,88,0,0,so,0,0,88,61,so,0,0,c,7j,3f,0,60,7u,5v,7w,0,0,0,0,0,77,1,0,3g,5g,0,4b,0,1a,207,8q,62ua,8d,61,so,1h,1630,5c,0,0,0,207,0,so,0,0,17lk,0,0,1,6g,s,1,0,5s,1h,0,207,62,0,gs,0,7f,0,6z,0,1h,0,2x,16,0,0,0,16,0,7j,0,0,1d8c,65,0,0,0,uvc,9g,8d,1y,2x,1630,0,89,8p,0,7d,19,5a,k,8r,1,6q,9w,0,8w,0,s,0,5y,t,0,207,5x,0,15,0,3e,81,0,60,5,17,v,87,0,5k,18,i,5i,0,0,0,1as,e4,0,17lk,qy,1j,ht,6m,0,69,60,3i,6m,0,84,6n,0,5y,w,0,0,207,2x,0,69,1,7w,5f,0,0,0,0,0,4f,6g,k,8x,0,67,0,4g,0,0,0,4g,0,0,0,6a,7a,0',
  '5l,8d,1,so,18,65,2x,0,0,1h,4i,3i,0,7w,0,8q,207,0,8r,0,5x,0,50,7u,0,63,1bgg,8a,18,0,0,0,5u,64,t,6b,1ndc,4k,0,8x,18,17,17lk,0,pw,5t,0,207,3d,8g,1fq,154,7z,15cg,1l48,0,0,s0,0,0,62ua,0,0,7d,25b,0,1630,17,0,0,0,0,s,1c,71,1,22g,3h,0,17,9j,0,2ig,0,0,88,0,62ua,e4,0,0,w,6a,6m,18,1h,62ua,62ua,0,99,8b,8e,4j,1acg,207,8j,3f,1j,6b,7v,4i,1se,8d,8h,0,0,5w,0,0,2x,65,9v,18,qy,0,0,5q,5o,38,18q4,0,86,w,so,8w,63,69,19,1630,80,9,0,0,69,0,5x,0,2p,1c3s,0,3a,s,62,0,8e,10,o,8,c,1m8s,6f,0,1,0,bq,0,94,66,0,1b,0,19uo,s0,8u,18q4,0,5d,0,9m,17,7c,i,0,0,et,0,0,0,6t,0,3f,16,207,86,207,62ua,1,0,17lk,0,0,207,8i,82,6m,so,0,64,0,8l,0,0,207,0,88,0,t8,0,u,5h,0,w,1u,18,4e,6c,6l,0,1jzo,0,207,i,117,4g,184g,7a,hgg,5t,17,0,1jzo,2x,62ua,0,s,o,0,5c,1630,0,0,4i,1h,0,8o,1630,0,5t,18,0,0,18,63,6b,0,6e,1630,0,5i,7y,65,1az8,0,u1,u,66,5g,e4,1zi,5e,ni,0,0,0,0,so,0,0,0,18,67,5h,so,0,4e,70,s,0,6p,c,1b,3e,8c,1a,s0,0,0,0,7s,d,8l,0,o,0,0,91,2s1,4k,0,16,0,0,90,92,0,7x,5wq,207,1h,0,0,0,19,0,4d,72,98,hw,0,q,0,0,69,0,s0,4g,0,8k,0,0,83,0,7e,0,1j,0,1zfa,69,4a,154,8q,0,0,0,13v,59,8y,207,8x,0,81,66,0,1i,8f,67,9c,0,3j,0,c,8f,0,0,4e,0,87,8d,7t,2x,5t,0,5l,6y,7z,0,q,0,80,os8,6d,0,0,5k,8i,s,6g,8f,5q,16,8e,6x,0,ar,19,5v,so,0,207,49,6a,1630,4i,3e,0,1h,1k,0,5e,0,8b,6t,1630,5w,c,7v,0,3gl,so,4k,6i,0,0,0,6s,0,0,0,s0,0,1,0,10,7b,87,0,8s,16,19,7v,207,8,0,c,8f,0,w,8s,s,eg,1n,0,27,0,60,7v,0,7r,31k,j3,0,4k,0,6w,6n,1630,5y,1630,0,s0,66,1wm,7,v,0,0,o,6u,s,7c,0,so,9,19uo,62ua,7s,q,6g,0,8j,4g,q,0,0,a4,84,17lk,ki,8w,0,0,207,4r,9t,5q,i,0,0,7o,8y9,6p,6c,18,6f,6b,4v,6a,0,0,8v,62ua,72,7z,86,s0,0,0,0,62ua,0,0,68,8g,0,1a,8z,0,q,0,ax,8g,u,0,0,0,91s,0,0,0,0,8v,53,97,99,50,0,q6,85,2x,88,0,0,6w,7s,0,18,66,49,8o,0,so,6d,79,2x,5t,zpo,5f,0,1h,4ej,0,7u,5k,u,0,4i,6q,u,18,0,0,19,e4,l74,4g,0,1g,1az8,0,60,5r,8,0,19uo,95,0,1,s,9g1,179g,62ua,v,c,6b,0,6q,0,6j,0,63,6a,1h,li,0,85,0,61,2x,62ua,207,1h,6h,2x,0,0,5z,0,8v,154,1i,0,eg,5h,0,1,67,0,0,1630,0,5p,s,86,0,2x,0,so,s,0,uaj,1i,6c,0,6m,58,0,17,2x,8m,19,r,0,6r,6v,5h,6p,0,0,2x,5k,18,8o,0,0,3c,25,1630,1630,t6,0,0,0,12s,0,0,0,u,0,1jzo,0,0,6g,b,8d,207,99,w,a8,1i,so,w,3c1,0,0,0,u,3i,5g,0,1fi,0,8o,0,w,1al,74,u,19,0,0,1,170g,3d,8o,2x,0,q,0,1630,0,0,a4,0,0,0,0,4m,8f,7q,207,7y,0,0,0,73,2x,16h0,10,2x,0,0,448,70,6b,k,c,so,0,e4,8n,5q,0,8j,0,0,eg,2x,0,18,6d,0,0,0,2x,0,so,5z,0,0,1d,8s,h,8l,s,0,18,8z,8k,6w,6k,1,s0,0,8e,7y,1630,8y,0,16,0,3o1,0,207,0,7o,0,5j,0,9c,0,207,5t,60,0,e4,9a,16,5m,0,0,19,0,6k,6g,5y,1x,0,s0,0,51,1,6u,1g,18,0,0,0,65,19,0,8c,e0e,3e,0,lw,90,c,8j,vz,8k,0,0,r9,6g,1jzo,2x,7y,0,62,53,85,7a,54,0,88,4e,2x,116d,5z,5l,207,8o,s0,1,so,18,0,0,0,6d,0,8v,1x0,0,0,0,1bgg,0,0,0,8q,18,0,5x,1h,8,w,0,7v,81,4c,0,5j,0,s,84,3h,0,1630,7c,0,c,4b,4q,8s,154,i,0,1d,1a,19,0,78,k,s0,0,0,18,6r,0,0,1fz,2x,0,9k,7q,0,0,ug,0,86,0,18,7r,8j,8m,67,0,6z,4a,0,o,4y,18,8m,s,9b,q,0,0,4g,1,2x,19uo,8o,8v,0,7k,4i,1i',
  '6a,1i,7y,1630,0,0,0,o4,0,k,62ua,0,0,0,0,0,0,1a,31k,s,0,8h,79,1a5,0,so,1g,18,0,3ps,0,w,0,2x,s0,89,8d,7z,0,eg,6l,0,0,0,8,0,8v,0,0,98,0,7z,1i,0,3z,19uo,7y,4k,0,0,q,1na,7a,66,5e,8b,90,5v,62ua,0,7z,0,85,y,6g,0,62ua,74,0,9d,15,0,u,0,8o,84,10,0,62ua,1l4,8j,63,4k,6e,0,8w,0,6j,0,0,8f,8a,58,0,s0,4i,p,0,u,9n,0,65,98,9a,0,8y,19,0,1a3,s,0,0,1,0,0,0,0,0,63,93,e4,0,5f,7l,c,1,6r,w,1j,6z,9s,z,0,207,4v,2x,64,i,4g,5c,4e,5e,8s,80,so,xi,6k,4i,19,a4,0,0,6d,1mkg,0,5u,3c,3f,0,0,6s,0,6a,fo,18,bw,r,1d,0,4g,19,1zrg,0,6j,8t,0,6c,0,5h,0,6w,0,8c,4b,0,0,154,9o,0,4i,c,62ua,0,99,u,0,8y,u,18,85,0,73,so,0,6h,0,0,0,6t,21p,88,0,5b,0,3e,7s,15,o4,o,207,0,0,8t,81,82,2x,0,5o,f,90,1i,0,64,0,0,2x,6h,6i,1,7j,6s,0,5r,0,0,e4,0,3g,68,5q,6h,62ua,8j,66,8,a,64pk,s,9a,0,8k,8f,0,1k,1,154,1a,0,63,0,k,41,9g,0,0,0,3h,5d,0,0,0,0,17lk,2x,0,r,3gl,6q,6a,62ua,7b,19v,2x,o,1e,0,0,8u,0,5s,91,o6,170g,65,s0,a,17,0,52,5c,5u,5kx,0,0,0,0,io,u,77,0,2x,84,1b,6l,0,1,43,1x0,17,88,1h,97,17lk,0,0,0,88,5q,0,5q,19,0,3a,s,2x,0,4j,0,18,1f,77,28s,0,w,w,6h,6c,5v,0,6z,154,8l,0,0,1i,9v,8x,0,2x,0,154,32,8f,0,u,0,0,19,0,w,9b,5k,7i,3j,0,74,87,207,4z,0,0,8f,e4,137,5g,i,1a,2x,22m,0,8p,4e,5v,u,61,8r,4x,0,7s,0,ht,1,5p,2x,6c,u,0,o0,95,1630,6h,w,80l,1j,89,0,0,8u,k,4i,1f,6x,9n,3c,8w,82,0,0,67,q,54,0,84,5o,60,7t,0,92,18,92,19,0,6q,86,tu,65,4g,q,0,0,0,s,0,0,0,0,67,so,0,70,7h,0,4e,5v,n,0,7l,5l,0,61,7q,0,kk,0,64k,i,17,0,0,16,0,0,6a,0,19,5c,1a,0,8l,0,91,18q4,0,u,0,1a,207,8f,153,0,8g,0,8n,55,0,9k,1630,q,2x,5w,16h0,0,78,0,7o,ij,71,7l,0,69,5x,0,8a,49,2x,0,ap,47,1h,1kcg,0,h3,90,6n,3e,w,0,61,8f,0,7r,0,60,0,10d,9r,10,87,s,0,1on,0,19,0,0,w,62,1a,0,63,67,0,0,7m,0,1l48,17lk,207,0,8a,0,3g,207,0,96,1a,83,51,0,0,0,0,5d,6b,3b,6c,0,0,6y,v,o,u,6l,6j,1c3s,0,207,1ih,0,0,3fr,o,0,0,3h,w,5y,1,0,128,1h0g,eg,1a,75,19,0,0,0,274,k3,0,0,7m,62ua,0,1630,8g,0,0,w,0,89,s,8w,1b,8s,1qr0,1,5z,8w,61,0,0,i,7x,0,8j,15,85,82,1j,rr8,9l,19,3e,5p,6v,68,nv,0,0,0,6d,0,0,0,4c,1j8g,7i,s,86,2x,6g,0,67,c,69,0,9e,so,5r,0,6k,0,0,60,0,0,8u,0,0,8,78,1g,1,0,0,s0,0,8k,0,7w,1i,88,0,s,0,94,2u4,19,0,0,an,7v,e8,3h,0,ot,0,1,j3,2x,5q,0,62ua,i0,0,0,5r,0,1j,8s,3g,i,8f,u,3f,0,8v,w,5x,0,83,62ua,6,0,98,q,82,207,b9,1,0,0,19,0,8p,9p,15,68,68,95,9m,9p,e4,62ua,8h,0,0,0,8o,o,7n,88,4i,5d,1a,0,0,0,9sw,0,5t,0,6j,15cg,q,16,0,8a,s,207,w,5v,60,5s,48,0,5o,0,k,0,0,ec,1bgg,0,1b,zy,0,8k,84,1630,1jzo,w,62,0,8w,0,5o,0,9e,3b,q,89,0,0,u,3c,5b,0,1a,0,sn,6g,9b,1d,8p,0,69,w,0,9f,92,1630,5o,w,60,1j,5x,fs,4g,0,1,9m,6w,29,0,4e,342,91,4h,6p,6t,0,c,s0,u,0,9b,5c,w,3d,q,0,0,91,0,5j,1,uf0,1c3s,7n,0,8p,1,1630,8a,u,0,6w,1630,0,0,5v,0,10j,88,w,0,6a,0,6q,0,0,1,5l,1j,6b,5o,59,7y,0,42,ht,5o,0,0,1a,so,9o,0,18,89,w,miy,3v,99,1jzo,0,0,8h,0,7u,0,0,u,66,0,3e,0,0,6w,3i,62ua,154,17,0,25c,0,q,8c,98,0,0,8h,c,1b,6e,19,t,0,4q,0,15,8f,1630,5z,s0,0,62ua,97,0,106,0,0,185,0,m,0,k',
  '1ay,0,64,w,i,6u,c,207,1,4g,0,1630,s,93,6j,1g,8p,0,3g,68,0,w,62ua,5n,6e,1g,0,0,c9,15,72,1j,154,0,8w,0,6f,6f,q,5i,o,0,0,6f,r,1630,0,5e,51,0,1az8,6c,0,64,3d,e4,0,0,so,k,s0,s0,wo,0,8l,0,4j,9m,1630,1c,6m,0,7h,5n,85,4g,2x,h3,4i,0,0,bj,3f,0,0,0,0,0,66,66,5q,2x,81,0,92,6h,0,4k,0,81,3f,6d,0,17lk,0,s,8h,0,0,98,0,5f,s0,0,0,62,6v,8i,0,81,u,5f,c,0,0,0,6p,8e,1a,2x,18q4,0,70,18,w,0,0,8s,q,jx,72,0,16,so,1h,9p,0,3f,76,2x,0,c,9k,207,u,76,0,0,0,62ua,5j,3h,0,1630,8h,8y,0,1c,69,0,0,19,1630,54,q,7z,0,14i,0,0,0,85,9k,0,0,0,v,18,6m,1,gk8,6g,1b,e4,61,66,6j,0,b4,0,e4,4e,0,0,0,87,65,0,0,8w,6c,1ay,0,0,8j,2x,79,0,17lk,p,0,so,4k,5j,0,5g,6y,0,i,0,1i,4d,0,18q4,0,0,5j,5a,6b,0,0,5s,0,85,1,s,1630,u,6z,0,4a,3c,so,0,0,4x,1h,5c,9f,92,0,3md,0,8m,8w,0,0,0,3f,79,0,84,0,8z,1i,6a,5w,0,0,0,0,0,6t,0,0,s,0,64,8e,0,1,1,0,1h,17,18,4c,a,8m,66,w,s,so,0,62ua,p,0,0,8o,0,16,86,0,0,0,77,1i,5x,4e,207,0,so,7u,eg,1630,o4,0,0,0,0,8y,0,0,8a,0,77,0,1jzo,6v,5c,0,0,0,8v,6e,1a,s0,207,8j,0,16,8s,1a,0,eg,s0,65,0,87,5x,69,0,47,0,207,1a,5r,77,3i,1c3s,8r,2x,70,ma,0,2x,e4,19,u,2x,0,4m,0,0,3g,1ac,q,8a,67,8,1,8t,1g,0,26l,0,14f,0,62,18,86,7o,19,ac,5i,7q,4i,9b,1,c,6l,y,6a,17lk,0,0,4u,5o,1,5r,0,6i,207,8z,0,0,0,0,3g,0,16,8u,6b,18,0,0,0,1b7,0,so,0,s0,s,0,0,0,1h,1,207,68,0,2x,64,0,6j,0,0,0,6r,65,5c,59,5v,0,0,0,75,207,0,8h,96,1b,so,0,1h,0,5r,8t,2x,67,5r,ss,3e,6x,1630,89,0,e4,0,1h,0,18,0,0,0,0,6b,8b,so,e4,0,1,1c,1a,7x,7x,1h,0,7s,0,0,5l,so,v,0,0,0,6m,5o,0,0,0,76,c,62,17,1j,0,1,ht,c,s,6m,207,8s,6,1,9d,5k,0,7a,1,0,c,so,0,1a,0,5n,s0,8x,8o,10,78,8f,s0,0,8b,u,5q,0,4e,6j,8f,0,0,6t,c,0,22,0,9z,9b,1pd,0,1630,0,0,0,w,1,5c,6u,1zxy,1630,170g,7y,3f,1,7n,17lk,0,0,1a,1,17,aa,84,0,8w,6p,99,a8,95,ho,207,0,8j,0,5i,iv,18,s0,c,0,0,aa,7v,sz,9c,0,0,0,6k,4g,1,9a,0,0,c,6c,64,0,0,8w,6e,2x,9t,0,6t,16,0,4k,u,d,4m,0,16,s,207,0,0,0,0,2x,1bgg,0,0,4f,0,0,0,67,i8,0,4d,0,7e,7z,96,2x,0,1i,3i,0,9r,0,6h,0,8h,62ua,207,1,91,0,0,6n,4i,0,19,0,0,s0,3i,2x,0,5s,0,70,17,0,0,8v,67,6p,2x,0,1i,0,6g,5v,5f,5x,t,p,5v,0,0,87,5z,1vu,3d,62ua,1az8,0,so,6i,17,i,1j,1a,1630,4i,4y,9,0,64,0,19,0,7q0,3c,16,0,8t,pu,13t,u,74,0,6i,5o,0,5f,34,0,1l48,0,19,0,4x,so,11a,0,0,2d1,0,1a,0,t8,0,92,b7t,9i,0,8z,67,0,1a,0,1,1e,1,5g,1,0,0,4g,b9,c,0,0,60,0,0,0,9s,7i,2by,0,0,c,0,0,4w,8j,w,8m,8l,8p,97,5n,s,5u,8g,5s,so,0,9q,i,19,4a,92,4g,1j,7s,0,6y,63,5v,w,s0,s,5q,o4,3g,207,1a,83,62ua,6w,6l,0,0,0,s0,8c,u,0,e4,2hf,q,19,0,8p,6i,0,8d,k,1h,0,6b,9a,0,op,sg,av,87,0,0,0,0,0,0,0,0,0,1h,1i,0,40,207,k,s0,0,67,18,so,6k,0,v,3j,12a,17,18,2x,6h,8c,67,c,3f,0,0,0,0,q,80,8s,61,4i,74,0,18,207,10,1iv,2x,0,89,0,4j,7i,0,18,0,5wq,0,1,0,0,0,8i,6p,5ao,c,8r,5gl,1,0,9c,4g,0,5v,5n,6j,u,0,78,4z,62ua,s,0,8p,0,1c,1a,85,1h,9u,qb,0,0,1630,1m8s,0,0,rd,1i,0,77,13u,0,170g,0,0,9n,41,5r,1c3s,6q,0,0,t2,0,kk,6f,u,6c,uvc,0,6e,4e,0,a1,1a,0,0,6a,8g,0',
  '0,4x,0,6r,1,68,0,1630,6x,0,3j,0,0,0,17lk,0,0,0,0,s0,5y,10,0,0,0,i,0,8h,66,18,0,3e,8v,3e,q,4e,1g,0,6u,a,62ua,0,8w,0,c,0,6u,0,18,6p,6o,7q,1c3s,0,8k,18,o,8x,6d,8c,10,0,0,3i,41,7u,0,0,0,0,2x,so,8u,0,4h,3i,1630,0,6a,86,18,0,0,62,so,4i,0,8p,69,51,so,0,4f,2x,16,c,3l,1jzo,0,6l,0,7b,o,83,71,8h,62ua,u,8h,74,16,4g,1630,4c,0,a0,4s,0,1630,5y,66,0,18,0,0,so,0,18,8z,0,ht,0,18,5x,1d2,c,0,8k,77,0,2x,1,0,6h,92,19,8h,8y,9v,6e,6g,7r,1630,0,0,0,0,1630,62ua,5s,u,0,64,1,8p,8k,0,0,0,1jzo,0,p,9n,7r,0,0,7y,8s,7u,16,e4,16,0,0,8x,1jzo,0,6r,0,1e,0,0,5v,8p,60,0,2x,0,0,5z,0,6y,so,ll,7p,0,s0,72,q,0,3f,an,0,0,0,1h,8v,60,0,c,0,0,18q4,9b,7x,0,0,2x,8r,2x,vwg,57,65,62ua,q,0,97,i,0,72,66,2x,c,0,62ua,0,8z,0,4g,4g,0,0,5x,0,84,62ua,0,97n,73,1jzo,86,3d,0,8g,0,c,0,0,0,1,jxw,o,0,207,1a,0,s0,0,19,s0,4g,184g,0,0,0,5v,tp,so,43,0,0,8f,8a,1f,0,i,0,0,15,1,w,0,94,0,s0,5q,92,w,0,19uo,8l,2vc,0,q,8f,207,0,0,0,19,7b,tn,67,w,0,0,0,207,0,83,0,0,4j,1,9q,4d,1a,5p,c,6k,2x,s0,0,0,w,170g,64,0,0,7p,3d,0,3e,r,1,88,88,1g,0,0,207,0,96,0,n8,3h,0,89,3b,0,so,1h,8s,0,0,6p,0,8j,207,0,5n,c,8w,0,v,7z,8z,18,8z,0,5l,0,0,92,s0,0,0,0,9n,0,0,0,2u,0,0,u,0,18,0,0,0,154,5n,8z,0,0,0,7v,1i,1jzo,4m,207,1uns,1pd,so,0,7p,0,9m,8j,4g,18,1v4,c,0,18,7y,5x,qx,0,1i,2x,16,0,sg,0,5j,0,6s,8a,8v,0,0,0,8b,w,0,78,0,0,0,0,0,pko,68,6t,0,2x,0,4r,0,0,0,5t,61,w,8y,18,a8,8h,7u,0,4ho,so,s,5v,5h,0,0,0,0,98,0,1h,5j,0,s0,64,1h,0,0,so,0,k,9d,7z,69,4i,0,18,98,7c,0,6b,7t,9x,ts,1a,1,2x,0,82,92,48,8p,20a,7t,0,0,0,2vx,5v,0,0,4c,0,155,207,154,0,62ua,0,6p,6r,61,18,so,4i,0,90,1h,1,4e,1630,0,6m,5p,w,207,q,0,am,1u0,0,8f,0,3c,1630,w,0,87,0,0,8s,1h,0,0,8g,207,207,19,207,s0,0,19uo,0,6t,q,5c,5s,5h,4g,w,8k,8c,0,1qy,64f,0,0,0,5z,6d,z,0,0,c,0,1az,5p,6s,78,5j,6i,17,w,9c,0,0,0,e4,16,0,4e,85,0,6z,e,0,so,0,0,ad,s0,0,6f,z,72,170g,5h,0,9e,66,5p,9n,8,0,8j,4c,0,9v,ad,4k,0,5t,kk,0,0,4e,1630,7o,0,16,0,44,16,w,0,4e,0,s0,1c,0,4f,8r,0,83,0,so,207,0,9k,v,0,6e,0,5v,1i,6m6,8wn,60,s0,1a,4f,1a,18,18q4,0,5w,g,1630,8l,3i,0,4e,89,4c,0,eg,2x,4i,2x,0,79,0,0,2x,0,5k,0,0,w,0,8l,0,89,0,ty,79,0,0,0,8l,0,8g2,0,62ua,0,7r,e4,0,17,q,so,0,q,0,0,0,0,5c,vd,0,0,4c,0,0,a7r,0,67,8s,6i,8m,0,2x,0,0,0,0,0,88,4a,82,62ua,2x,81,1g,17,17,5k,0,71,0,8v,0,4q,88,0,0,5m,7w,s0,0,w,1a,1,4i,0,6e,1jzo,k,eg,3c,0,0,0,0,1j,8j,4i,1,0,5r,0,6a,4c,7x,0,7t,0,2x,60,4f,5v,0,0,0,c,5u,q,8l,0,1630,9t,0,0,12j,0,r,18,0,s,0,8g,18q4,7y,0,0,k,0,0,pws,0,0,0,0,6p,1b,so,0,9o,0,0,0,0,6c,0,2x,8q,w,0,0,s,65,0,8z,0,c,5v,1c3s,1a,0,0,4d,170g,1630,i,0,ki,4v,0,8f,0,5h,66,0,0,4p,85,63,0,1630,v,6e,0,6o,i,8o,61,1,0,s,20n,s,8v,0,0,0,al,88,0,0,71,419,6x,1l48,5a,5s,1630,2x,7x,0,5s,6q,8v,0,0,8y,84,1g,0,0,8j,0,1,16,0,2hc,so,68,0,0,5o,1630,0,0,c,s,i,3oc,0,111,0,0,w,0,18q4,1ndc,1j,e4,0,0,6f,0,5q,0,89,0,82,0,63,10,0,18,8t,j,c,so,65,0,5q,0,0,8v,s0,5i,7vw,8q,0,0',
  '5t,207,1630,3i,4w,207,1,19,7k,8b,6w,cn4,0,18,0,1630,0,0,s0,0,0,0,u,0,0,0,0,0,x8,8t,so,66,x2,3f,62ua,7t,207,1ov,0,0,0,5u,0,0,4i,s0,3c,0,7p,6l,6d,0,0,0,0,1il,8f,0,16,0,8h,0,c,1a,1i,c,0,86,ac,8o,207,17lk,0,3d,62,18,0,64,w,u,9a,0,0,1630,0,62,91,8f,0,0,16h0,97,0,62ua,88,8p,k,s0,0,5k,0,3f,0,2x,86,1630,0,4g,6j,2x,0,0,0,3ob,0,0,0,9f,4g,93,0,5l,18,6b,80,8p,4i,0,0,0,6g,0,1jnk,0,4e,8v,18,0,4g,0,154,0,0,44,1a,0,8q,207,1h,0,17,so,6d,8z,0,99,eg,0,1x0,6s,6m,5w,9s,68,77,s0,e4,0,0,1a,ok,1630,0,4i,62,6f8,7a,8y,0,1c,3e,37,8f,3i,17,4e,8x,1i,nk,0,1,0,0,8q,1,0,86,6e,8k,1ux,0,u,60,0,87,0,184g,5v,so,87,0,0,k,40,0,0,5p,0,0,0,9n,0,5l,6e,207,6e,0,2x,6y,4i,8h,86,0,8y,v,0,0,1m8s,7b,6b,8c,lf,7u,0,1630,55,0,7w,18,8r,4e,8l,7m,0,o,51,0,1630,7fe,0,0,7e,0,4c,4i,207,9g,0,7u,1i,62ua,0,154,7y,0,1h,0,8v,0,7q,1s00,7n,17,0,6e,1vi,8b,0,o,3e,2x,0,1i,yw,18,o3,4h,1630,7g,17,0,5t,cip,4i,8d,16,0,p,6o,0,16,0,0,9h,3e,0,0,0,0,c,as,7s,9l,0,0,al,0,e4,45,so,0,6d,o1,6a,0,e3,0,62ua,0,8a,0,63,0,0,so,1,0,0,2x,a,1e,0,65,0,1az8,8o,0,17,8p,8z,19,6r,207,19,0,5n,9s,4e,84,0,17,i,5q,7c,207,1,0,6q,9n,0,5r,0,so,4e,7m,0,18,c,tag,0,0,q,0,eg,eg,5n,8b,5v,0,u,6p,1,so,1,0,0,0,7x,5o,5k,0,0,0,7u,i,6k,207,7w,18,0,4g,0,w,0,2x,8q,8r,0,0,6j,8q,0,0,87,0,8h,1a,5x,6n,18,bqo,0,7t,5p,1ohw,6b,0,62ua,16,18,0,19,6g,93,69,19,0,2x,4e,7q,0,1a,e4,0,207,0,77,8j,0,16,9s,5ck,8e,4e,4j,0,62ua,1,0,0,c,2x,0,2m,0,5r,6k,62ua,0,0,5p,0,1g,0,7q,6k,u,67,0,0,6k,0,0,od,60,1630,8n,0,0,0,19,o,q,5l,n0,0,207,98,0,2j,0,0,1h,8q,8b,0,207,17h,7x,1,4i,93,2x,0,4i,4k,4i,1630,8x,6i,0,63,5v,8q,5c,0,0,0,18,3c,18q4,63,62ua,s,0,0,1h,0,u,1630,5q,6o,0,0,7p,1,0,0,0,19,0,ww,6x,17,6t,1jzo,8r,60,0,0,1h,65,8j,0,9f,207,0,0,0,92,67,so,5k,0,0,1a,88,19,0,8h,1ee,0,0,1630,88,10,c,0,0,9f,0,3l,y3,so,c,0,0,0,207,7q,6i,0,6f,0,6p,62,0,w,0,19,0,0,7d,19,0,8b,19uo,u,6p,0,0,1,0,db,5x,u,5s,0,nw,7y,1630,1i,so,62,0,8x,0,0,1,6c,u,8h,0,0,0,1g,5h,0,kr,1h,0,0,0,8y,207,eg,18,99,0,0,0,1k,0,8s,u,m,q,1i,5i,6s,0,6o,0,0,1,19,0,0,16h0,u,0,9,5b,66,u,1g,5s,6b,5p,0,9k,82,86,18,0,0,6b,7b,4p,0,0,c,0,6o,0,r,1630,5p,17,1a,8f,9cv,0,s0,6g,19,s,6,1,0,0,9b,0,18,0,0,9v,0,0,k,0,1i,5m,8c,67,w,0,0,t0,w,0,0,0,1jzo,6s,65,5t,0,2x,0,0,1630,0,0,19,1d,6k,0,15,18,1a,0,1630,0,1,0,17lk,5s,0,m,0,c,i,0,76,0,0,3h,0,92,89,3d,4e,0,8k,0,t9,0,0,0,0,3g,1a,6p,48,18,0,6o,0,4e,1g,0,8g,0,68,8y,u,so,0,7n,3f,0,0,9a,6d,0,so,1q3,0,5i,0,1a,0,0,1b,0,1j8g,5w,6d,1,94,0,60,80,0,0,0,1i,0,5n,18q4,0,3c,kt,18q4,8k,63,1,0,7w,so,0,0,q,40,8oc,0,4e,8w,61,ht,v,q,w,6d,0,0,18q4,4l,i,7v,x,1,0,83,0,0,s0,e4,17,0,80,91,0,5m8,47,6d,0,s,10,0,3z,0,0,0,w,2x,0,1,0,1i,0,s,4k,8e,0,6u,3c,8f,7b,0,0,6i,0,3h,s,0,i,8u,6p,5v,7b,c,0,6d,16d,0,207,0,6q,5y,4g,5t,4c,6r,5j,42,0,0,0,1n,1h,0,6d,58,0,0,8b,9e,0,6z,so,0,92,s0,7z,0,py,0,62ua,16,5w,7g,73,3i,1az8,2x,1op,0,1s,0,0,0,2x,0,0,6,5y,8d,0',
  '1j,3e,so,18,0,0,0,0,2x,5s,3d,0,9n,c,5u,18,0,0,5s,0,0,0,6x,8d,8x,0,2x,5s,89,0,1630,8f,0,o,0,6,0,7w,8a,0,0,19,1jzo,0,0,0,0,0,6f,0,9c,so,6y,83,1i,0,60,0,81,0,0,17v,u,8,18,88,18,64,18q4,3g,0,0,8z,8b,40,0,e4,0,6r,0,207,1630,64,s,8c,8i,1a,i,207,0,0,1az8,83,4i,q,42,0,0,9f,4k,0,94,0,zf,5g,0,207,9b,0,1v98,i,7h,s,eg,18,0,1,8j,0,w,5y,65,8a,62ua,pws,0,0,0,q,71,0,0,0,4a,6s,0,7b,0,3i,0,1ndc,4g,3e,0,7l,0,so,0,0,0,0,0,0,w,0,5p,6p,4n,9l,5u,1a,7y,0,0,9h,0,0,4g,7f,95,7a,6m,0,16,0,so,77,1,8h,53,0,0,1,1,e4,1e,0,0,1jzo,8c,s0,0,0,w,1i,0,4o,1jz,19,0,61,0,1630,0,6f,i,6k,0,1bm8,8o,u,0,c,0,ph,62ua,q,1a,q,4f,1wa,18,0,5r,0,207,6x,0,1d,0,3g,0,0,0,58,6t,0,154,0,0,0,98,6,1a,0,5q,8h,7s,0,s0,172,7u,0,1630,0,1lgg,k,0,67,198g,8l,6n,9e,0,0,0,8j,5h,1fm,1l48,5t,8q,8c,0,8j,1i,0,so,5r,62ua,0,17,u,1630,0,5a,8d,0,17lk,8c,0,16,0,0,so,18,0,2x,0,0,0,0,1630,5l,0,84,7d,0,4i,4i,7v,5c,5m,5i,s,w,0,1,5t,0,0,1630,84,0,5w,8y,0,2x,9h,7u,5w,69,19,19,5o,4i,4j,0,bwg,5m,6q,4q,62ua,6t,0,0,o,c,62ua,7c,9,4i,0,0,0,2x,8v,0,91,8p,0,h2,0,4t,so,0,1e,3a,18,0,5n,0,0,63,0,s0,16,8,j3,0,6g,65,0,0,so,1630,4g,5t,6b,0,0,t,0,2x,vd,0,0,p,0,0,1,81,0,c,7g,0,18,8c,1h,0,6s,so,0,63,89,2x,6q,0,5p,0,77,9g,o4,27,62ua,8o,5p,1,8m,0,0,c,76,78,0,s0,0,7h,0,0,0,17e,53,9c,0,0,0,7h,60,5z,0,5g,68,l,0,1,51,8c,j3,0,62,10,82,1i,0,0,85,0,0,6f,0,0,0,0,10,81,3h,7a,4e,4f,18,9k,6d,8f,8p,0,0,4g,1e,5g,0,0,s0,0,19,8q,1,1,6j,0,0,94,0,0,o,0,0,0,6h,0,8x,0,u,4i,8f,0,4g,s,2u,68,9c,0,92,16,0,95,3h,96,49,5u,8y,9h,8x,0,23q,3d,8t,16,0,1i,2v,3f,0,0,1630,0,19,s,0,5q,0,1d,eg,91,0,0,0,0,78,0,1,0,1630,kk,8h,5o,gv,207,1g,0,2x,0,19,s,0,0,4e,7t,0,0,8a,8m,6v,9e,65,2x,q,0,1,0,s0,7u,207,w,0,5n,37,1630,41,e4,0,1,9o,0,0,0,62ua,0,71,14,0,8o,0,u,m,0,16,so,6c,0,41,0,9b,93,5y,86,18,5g,19,0,6l,1,ab,s0,0,2x,6h,19,2x,62ua,0,0,9t,0,0,1,0,1c3s,7y,1630,0,0,0,8y,0,0,6w,8t,1,6j,6o,a1,10,184g,u,6h,5o,154,3e,0,0,1,0,w,0,xe,1bgg,8x,0,0,1h,8,1,5n,18,1630,s0,y,92,1,0,0,p,0,qt,0,75,98,0,0,0,0,9p,s,9b,1mp,kk,64,5z,387,0,0,5s,5o,4m,207,1wg,0,8b,e4,6p,18,0,0,9,6c,62ua,0,0,s0,5r,su,1jzo,0,0,8o,0,s,0,62ua,0,0,16,1a,jog,0,64,w,15,0,0,3f,90,3e,0,0,0,5v,0,8j,1j,5l,0,8p,4e,0,0,q,4g,1b,6q,6b,0,u,py,k,0,68,0,8l,0,0,6c,s0,1,0,19,c,0,1a,92,5j,5h,0,0,1gu,16,0,0,0,0,0,9j,0,0,72,1i,0,8n,0,1630,w,0,19,64,8l,0,47,f,87,69,8h,0,0,6o,1630,1j8g,so,0,1h,7w,9j,0,0,0,0,0,vs,8l,0,0,4e,0,3a,0,18,8q,3o,4g,0,98,0,15,19,5u,18,q,0,0,0,0,0,6l,so,62ua,7x,0,0,1a,207,8l,0,17,1b,1a,e4,8g,3b,1a,62ua,1,8i,0,83,19,0,0,5v,1630,s,181,an,8b,8h,8h,0,s,6e,2x,0,5u,6f,19,u,0,so,3f,5n,85,xd,19uo,0,zf,17n,s,0,8h,16,70,sg,1jzo,0,3c,0,62,1j,0,0,5x,0,8m,0,0,81,0,0,1,5z,0,1i,207,63,1,0,8e,1,5m,s,w,60,62ua,0,1u4o,0,4i,0,0,4c,q,0,0,0,0,5p,2x,0,73,90,0,19,19,5l,8c,92,1,5a,85,10,uvc,8i,0,8r,8t,0,0,c,c,170g,0,0,8j,0,99,71,j3,7o,uvc,0,6m,0',
  '207,6i,4e,1,0,8c,1h,3g,1630,0,8h,5p,0,207,1j,u,8k,68,u,0,1a,0,0,s,0,zg,68,98,9b,8h,1630,8,5o,7u,4g,4v,85,9h,xb,1i,97,4f,207,0,0,8b,62ua,so,6b,p5,2x,0,154,8c,ec,0,6d,f9u,v,86,67,0,0,0,74,0,0,0,0,5t,0,19,0,4c,5u,0,0,1vz,207,0,7l,0,0,207,0,0,l7s,11,0,6f,t2,9n,s,5i,1g,0,18,0,0,u,q,uf0,0,6u,58,9w,so,l,9ic,19,6g,14o,0,sg,6b,2x,0,0,0,0,0,0,0,6d,0,5v,0,s,0,81,0,0,5y,so,s0,0,6j,4i,2x,0,0,71,0,w,1b,1b,16,0,0,0,1c3s,54,3g,3o,v,94,w,0,5x,9w,s0,0,w,6t,4e,1a,0,3j,s0,1a,89,s,1i,0,18,0,4k,0,8a,0,0,81,5k,61,18,5o,90,5w,0,16,9l,5u,85,18,2x,62ua,0,5p,61,23r,18,0,0,65,0,0,19,c,8z,0,19,1b,78,eg,7l,0,4b5,fo,0,0,0,s0,0,8p,u,s,q,0,2x,0,0,0,w,0,65,0,85,j3,y,8b,6b,85,8b,i,0,0,66,w,0,6,6e,0,ki,207,60,0,0,89,5v,0,0,c,9t,19,5i,1,0,0,7r,4c,bu,1630,0,e4,y,ht,0,1i,8t,0,8e,0,6r,5g,5s,4g,0,8t,17lk,8w,1630,5p,xd,71,62ua,so,ak,5o,0,0,6n,0,0,so,68,0,0,o,0,u,2x,0,0,0,1b,7r,95,4l,1jzo,0,1630,c,1,0,2x,1f,62,8e,b,6e,6q,81,10,1ndc,0,1,0,s,31,0,0,1a,11o,6g,0,0,5r,10,fq,91,0,u,4w,0,mq,0,4k,0,0,5l,0,67,9h,9i,16,1f,19,5i,3c,w,w,0,121,8d,18,207,u,1jzo,0,0,e4,8h,0,9j,0,0,0,2x,8j,0,0,0,60,0,96,s,0,0,6x,0,6s,i,0,0,7s,0,1,0,5v,5o,0,a3,5s,5g,62ua,6s,0,1,0,0,18,1a,70,12o,8e,7y,0,0,5g,6z,5d,0,83,0,43,7z,s,s,q,0,154,8j,1bgg,so,9l,0,0,9u,4g,18,0,an,1,8n,85,0,p6,8g,0,7x,0,0,w,so,9l,0,0,8,1a,0,0,18,207,0,r,0,8n,0,0,8r,0,9o,9t,0,0,3g,q,1630,1,0,62ua,u,9h,2u4,0,4c,5s,0,0,0,0,0,61,so,6y,0,0,8j,0,6t,2x,6b,0,so,6c,8v,i,w1,0,4h,2x,6q,1630,68,8r,i,0,1c3s,1g,0,8p,8u,1,s0,61,y,7j,6h,u,0,5c,0,0,0,64,2x,6b,0,0,1630,83,jy,6m,0,76,0,8a,r,o7,1a,5t,0,5s,1n,0,4i,0,0,0,0,4s,18,0,1bgg,1,68,0,4g,1b,0,0,s,1,5k,0,19,0,207,85,0,4e,5o,e,0,c,1630,18,2x,0,9o,1c,74,91,1jzo,55,0,6e,18,16,2x,6j,17lk,89,0,0,0,0,eg,84x,0,67,s0,8r,93,q,i,93,8j,18,6b,8i,0,46,1m8s,8o,0,1i,0,0,0,0,0,0,62,1kcg,7s,k,184g,0,8w,62ua,0,6f,170g,0,18,8h,1k,0,5r,0,3f,0,i,0,c,0,k,207,0,8h,1a,17,0,0,1h,0,0,19,9p,5x,8k,6j,0,288,0,0,8h,1j,5s,w,j3,0,91,8v,0,8,5t,4b,u,59,0,1a,0,19,9f,0,6t,0,60,0,8k,6a,tt,1,0,5h,0,0,0,0,5i,207,w,15,0,0,8f,u,9p,0,0,0,47,18,0,0,0,89,ug,0,0,2x,1d8c,8h,8l,so,0,63,0,0,86,207,31k,0,1h,62ua,0,9j,0,0,q,19,62ua,0,0,0,6h,0,0,0,0,eg,7y,0,u,5m,1630,5kx,207,4f,1a2,0,26is,7t,0,ikg,207,0,u,1a,0,0,x8,1my,0,1,6l,1630,0,0,8a,5s,0,5,0,0,0,5f,0,207,0,2x,0,7v,0,95,l,0,66,8g,0,c,c,0,0,0,0,7o,s,97,0,1g,4d,0,23,3e,5f,82,65,8d,k,0,0,9n,4g,0,2x,61,84,8q,18,1i,so,0,so,1a,0,1,18,0,2z7m,8w,99,0,0,0,ol,6q,6s,8i,62ua,0,0,4i,6j,5v,63,18,1j,5f,pu,0,88,0,6q,7l,0,i,eg,2x,8b,so,1h,0,3g,9i,u,q,8c,0,7t,u,69,0,0,8x,0,1,62ua,0,0,c,4h,10n,207,0,6p,5p,u,a0,5z,0,q,8g,8e,1i,0,0,1,0,so,0,9z,5o,0,1630,2x,1c,7c,9h,3i,i,1630,2x,r,65,0,0,0,65,0,0,8g,4e,7e,7s,0,9p,8g,66,6s,0,1,8v,1g2,4y,0,0,0,0,7o,3d,6j,3h,w,0,0,c,k,7z,16,1630,0,7d,62ua,6i,2x,5t,74,0,0,0,c,6f,q2,u,0,6r,0',
  '8a,9b,0,1a,5t,1jzo,9n,0,1,0,0,0,0,k,1b,0,0,4e,0,0,9o,0,65,1g2,0,4m,7o,0,6c,0,0,0,0,8t,7z,5s,0,9d,61,8m,0,r,0,0,89,0,1,0,0,9e,8d,wh,0,16,1630,7e,0,c,c,4kp,87,4g,0,0,6l,0,2x,6n,0,6m,7f,6j,18,1r,c,0,0,0,66,0,0,0,67,6n,a,1,0,79,0,wo,u,91,0,0,0,2ru,w,0,207,1e,0,17lk,0,0,0,63,0,62ua,0,0,6e,1h,0,1ma,0,8q,0,80,s0,82,0,0,0,6f,0,0,0,62,0,60,6x,76,0,76,5x,0,7p,8q,so,0,0,2x,8i,6i,1a,5t,5w,2x,2n,77,18,0,93,67,77,8p,0,165,u9k,4o,kk,0,1c,8u,19,0,0,68,1a,2x,0,0,0,o,63,0,0,0,1,4i,65,6v,0,81,c,0,0,0,4i,10,6j,o1,207,0,0,6n,c,6h,0,79,17lk,w,6i,u,1c,1630,1a,0,c,8m,16,0,5f,9g,0,8u,0,0,0,0,o,8o,19,so,so,8p,7c,8u,u,s0,0,2d,eg,3e,0,1,65,u,5i,16,63,0,6a,c,0,0,0,1,6u,w,1,8c,0,0,0,207,0,7t,0,0,1,81,0,6b,4e,6e,0,0,0,17,1630,5v,3f,4h,0,0,on,0,7p,61,9m,0,0,0,4q,0,3e,0,9g,6h,i,0,v,76,0,16,9e,2x,0,8c,so,8w,2x,iy,so,1a,7b,0,18,0,8x,5t,2x,19,4i,0,0,5s,0,0,0,i,0,5t,0,w,0,62ua,0,1c3s,g3,1jzo,6j,0,0,0,1i,0,5r,0,2x,so,0,12l0,0,1h,u,1630,so,0,r7,0,0,1j,0,62ua,6t,6t,1i,8x,9f,1j,0,0,0,hp,0,0,18,207,0,8d,0,0,5q,0,1,1xic,69,0,0,0,8k,8a,1630,os8,q,0,92,6a,w,1k,98,0,0,eg,1jzo,0,0,1jzo,q,22,0,0,0,95,1630,c,19,0,6m,7u,0,0,8s,6j,0,0,5v,6s,0,0,0,0,2x,o,8e,r,0,1,9c,10h,0,16,0,0,o,1,4f,8k,0,5p,1a,18q4,0,9g,65,0,1,0,170g,68,s0,0,1b,207,aa,14,0,0,0,6w,1c3s,5p,87,62ua,0,s0,10,i,0,0,2x,1k,w,0,95,16,w,0,7m,s,0,0,4g,6o,0,0,1g,17lk,6h,0,1jzo,5q,0,0,0,0,0,20,92,63,q,8h,0,6b,so,1630,1i,2x,0,0,3d,0,3i,0,8b,so,2x,1,8k,1jzo,0,7j,6j,1630,s,9y,6s,c,8y,0,0,0,6s,1i,8f,5w,eg,6q,so,1630,5a,j3,0,62,8b,1e,0,64,64,41,0,207,so,1,5x,87,0,207,0,1i,8h,0,37,12j,i,0,0,79,0,e4,0,8n,0,0,1630,0,17,19,6n,0,18,8f,1630,92,3k,0,0,e4,1h,6k,64,16,1cp,93,so,0,0,q,s,5x,7t,3f,0,i,11,uvc,h,0,0,9n,6k,0,19,pa,so,0,1,9p,t,a6,1,84,8m,62ua,0,uvc,0,88,0,0,0,4h,6c,1630,1630,0,8k,s,19,1j,0,an,6a,w,q,0,2r,0,2eq,5z,8c,0,0,0,q,0,0,0,0,14,s0,5d,8j,0,0,0,0,u,9p,1l48,1,0,9a,8x,5n,0,0,0,0,w,0,7h,0,w,0,42,207,88,60,9h,5p,4g,1,0,k,7t,so,7c,0,4o,0,17e,1c,6a,62ua,0,0,5d,0,7y,7w,0,0,5g,0,0,0,0,0,0,16,5u,6h,9g,0,11y,q,6k,0,0,0,65,0,0,90,0,5p,1,0,2x,19,5b,4i,1630,6e,u,1,1d2,6d,8i,4e,0,0,6u,1,62ua,1d,8i,0,s,1j,1630,0,8n,0,1i,132,0,18,1,4i,87,0,12,0,5p,16,0,7d,16,q,3k,0,8e,0,62,q,0,0,1,5i,9g,94,0,0,1i,207,g7,8a,0,55,6d,0,6n,1k,7o,0,62ua,0,18,154,6a,c,0,0,0,6c,so,5b,0,z4,k7,0,0,3j,7r,0,9m,4i,0,0,5y,r,67,0,0,0,18,0,0,0,17i,6z,5y,0,1h,2x,60,5f,62ua,8t,1630,0,8z,5p,so,60,0,7y,6d,3e,5s,0,0,2x,0,0,0,ht,0,16,96,ai,so,94,0,eg,62,3l,1,4e,a0,aa,iy,1g,1bgg,1630,5x,uvc,5l,3d,0,0,s,6j,m,k,17lk,a1,0,4g,5s,1,u,81,0,5q,9o,0,1,0,0,10,k,4e,7s,8,5x,c,0,207,s0,6h,64,5j,0,0,0,0,0,0,7g,3d,8v,0,0,0,16r,7s,0,s0,0,9n,0,0,8a,6l,6b,18q4,1630,19,eg,6g,207,3f,6c,0,0,0,zli,6e,8o,0,62ua,0,6w,1a,9l,7m,0,8y,60,c,i,0,so,9r,74,60,0,b6,19,0,1j,65,0,8x,0,5r,1i,e4,8o,0,0,71,1i,0,0',
  '0,0,0,5c,2x,0,6l,k,81,5g,4e,0,67,7y,0,85,1j,8l,0,87,2v,0,82,so,1jzo,eg,0,7x,0,2x,55,0,5o,0,c,3f,5w,1np,7h,0,so,0,1k3w,0,o4,92,0,0,so,0,0,0,9f,6l,0,16,0,0,2x,s,n8,uvc,4g,0,8s,uf0,49,0,0,0,0,0,e6,8s,89,1h,0,60,9g,0,0,0,18,6m,0,6g,56,0,7,0,w,0,w,4e,0,18,0,18,0,0,88,1d,65,1mkg,207,0,4i,1,6x,0,5u,0,w,18,52,w,8g,58,9w,0,5o,1g,154,5z,3i,6z,9s,207,6h,0,6j,u,s,43,0,207,0,2x,3e,60,0,9e,4g,62ua,i,14,5m,1q4,9f,8r,8,0,0,3g,s0,9e,6l,1i,8t,o,0,0,8l,7x,1i4g,0,0,0,w,5r,7z,0,5z,0,1a,1r7k,5b,0,2x,1ov,1c3s,w,6r,0,3j,0,16,1,0,2x,0,6j,0,0,207,1,i,2v,0,0,c,3f,0,0,1,0,0,1630,4i,87,5c,19,8,6z,18,0,0,19w,1630,0,4d,0,8i,0,6p,7x,66,0,89,90,0,19,68,0,0,0,86,67,6i,8s,0,2x,62ua,6f,0,6c,0,8l,0,0,1i8,0,5w,0,81,87,q,7u,27,0,0,1h,4k,8l,0,0,60,1j,2x,5t,k,te,19,62ua,w,0,0,3f,60,u,s,4g,q,6q,1d,0,63,uvc,5y,0,1ohw,0,4k,18,8q,8s,lv,6h,4e,77,6l,5o,i,5p,6g,0,76,1,6q,99,s,1vy8,0,86,207,1,26,0,k9,96,18,1c3s,19,0,8s,0,43,1630,37,so,64,0,i,ng,3h,0,0,4w,6j,42,0,0,0,18,1jzo,31k,5t,8x,2x,0,0,1jzo,154,1jzo,i,1b,u,6x,0,c,0,0,8y,0,0,6c,0,5u,84,0,0,0,u,k4,0,7k,0,6j,1j,9m,0,16,8z,6e,u,97,6j,8y,60,0,so,0,87,1,72,9o,8l,5w,6r,1,7w,65,0,6a,4g,8q,0,0,5c,4v,k,60,0,c,0,1,0,19,0,8p,9p,2x,0,i,8f,6h,0,1f,6p,5m,i,7v,0,32,9h,0,15,0,0,0,8h,70,ln,207,s,0,1h,93,0,62,1,0,1zwg,0,0,0,0,1j,0,0,67,8d,0,2x,q,76,0,8m,0,0,6z,9c,19,8u,0,5j,8a,4u,0,1h,u,3i,1a,5d,0,1,207,0,8t,0,18,0,a5,1,5s,1,1i,9e,oy,0,0,4g,0,so,0,0,18,8g,k,no6,5f,eg,0,0,0,9a,4g,0,a5,0,0,8x,0,69,1h,1,u,6r,62ua,18,0,18,0,0,10,s0,t4,v2,1g,0,1vf,70,16,1c,7y,1,1j,6f,8s,93,14,93,6z,0,0,17e,4i,0,18,69,0,1d,91,5w,5s,2x,1m8s,246,82,0,0,5r,117,0,0,6o,8r,0,1az8,1a,0,0,14,6d,0,2x,0,5o,8v,1630,w,62,18,0,19,0,0,0,91,0,w,76,6n,0,auc,k,6c,9k,1630,0,5y,5z,r2do,0,207,0,1z0,0,0,0,1qh,0,0,0,1h,38x,8c,0,0,0,5u,17,8p,0,2x,6r,0,6p,0,48,0,17lk,70,0,0,9,4i,0,18,2x,0,0,5t,0,0,0,7q,0,17lk,2x,0,89,2x,s0,0,94,0,0,0,0,0,80,1az8,s0,s,s,2x,0,0,0,k,0,0,8i,4g,64,q,17lk,8f,9b,68,i,170g,1,so,6c,1e,u8u,0,6v,5r,0,5s,0,1pmg,1,0,18q4,4e,0,85,90,0,7z,62ua,c,w,5x,j,0,6w,so,4e,u,84,0,px,3ga,5o,0,6s,2x,0,4i,0,1630,5y,17,6f,17,0,67,1c,0,8s,5t,0,eg,8f,19uo,1,0,0,0,207,5t,c,0,0,10,6k,3i,9b,5j,u,0,0,0,o,u,u,64,yh,x,0,93,61,18,5r,s,64,8s,6a,8j,0,5q,7u,1630,0,0,0,0,9k,0,1pmg,0,0,0,6v,0,5r,0,0,7v,1i,0,iq,19,0,6b,8j,8z,39,q,6e,0,1,0,0,18,2ui,0,5w,2x,3d,62ua,s0,79,je,4i,18q4,9t,60,17,95,5x,6k,82,7o,4t,5k,0,0,3a,0,0,19uo,8g,0,72,3j,7r0,67,1d,6b,2wv,4i,0,8u,k,0,nk,0,8p,0,0,e4,k,78,6z,0,0,ac,5t,0,eg,0,0,1b,7u,10,7y,0,1,8n,9t,s,5g,0,0,0,2x,0,0,0,5m,0,2x,6l,9d,0,r,0,so,0,86,1a,7v,8a,6e,8k,w,1bgg,0,207,62ua,0,0,k,0,0,so,0,q,8c,2x,0,0,62,0,6e,0,1ohw,8n,62ua,zd,1630,0,0,0,8,2x,0,7c,66,19,207,0,85,6y,0,a4,0,5r,8r,1630,0,67,0,0,1a,0,u,0,6e,5w,0,0,0,ak,u,62ua,8j,1s,1,7v,0,0,16,16,0,s0,16m,1,7h,o,0,s,1eg,8i,98,0,17lk,18,0,0,0,16,2t,3i',
  '0,67,74,6f,10,s,so,4i,1az8,5d,3j,0,6s,8g,0,5j,0,6h,71,0,1a,8j,3a,0,1630,2x,0,0,c,so,15a,74,so,1g,3d,16,0,1630,8a,0,6r,63,0,0,4k,3g,0,6e,0,0,8x,c90,6a,5y,0,19,o,vv,0,0,65,4i,so,63,1630,64,5y,0,0,0,18,0,7u,62,0,10,9t,7m,6w,8,64,5j,9x,71,1ao,0,5z,0,1630,98,17,0,6l,0,7q,0,6f,0,0,0,17,6a,8k,1,e1,1pb,1i,74,4l,8z,0,8j,k,a3,5j,0,0,5r,g1,207,1d2,18,19uo,4c,0,0,u,0,1a,18,68,62,6n,0,0,0,uf0,7n,eg,17,0,4k,0,ms,69,83,6l,0,0,60,0,0,7w,4n,9a,0,17lk,3f,0,0,0,0,2x,8o,0,0,0,18,s,0,c,9k,8r,1g,82,0,95,6b,9g,0,7y,0,w,0,0,0,u,i,1630,8p,8v,23,0,4f,0,0,6t,9b,0,94,0,0,7f,0,60,0,19,0,0,60,0,1i,0,e4,0,1jzo,0,63,q,0,7p,0,8d,4e,1wa,65,w,0,0,6u,1f,q,0,w,62ua,5v,0,0,97,6m,0,0,6x,8w,0,0,73,0,17lk,7d,0,1b,62,0,6d,64,8i,0,4g,9g,0,1jzo,0,s0,o,0,0,6o,207,c,s0,11,8i,9t,s0,89,4c,0,s,6w,61,0,zw,2h,0,0,6r,65,v,0,1i,9k,6g,3f,0,0,99,9m,0,8r,1a,5p,1,84,19,18,5a,4h,6y,0,w,6o,u,0,c,1b,18,0,0,1,7x,6l,61,3g,7q,0,0,0,5h,1,1jzo,o,0,0,0,so,0,8i,68,1b,0,68,8i,16,2x,1i,os8,0,5h,s0,1630,j3,so,9e,0,60,6x,1a,0,0,k,0,89,0,7x,65,7d,9j,0,1j,c,9q,78,0,0,3b,0,0,0,3e,0,5y,0,0,0,6h,so,1g,0,1k,0,18,4f,0,0,0,0,5x,6b,68,2x,81,10t,6f,1a,0,6r,0,so,0,s,0,q,1kcg,69,1j,q,z,5v,18,uvc,6m,j8,bg,1d,66,4e,9s,18,0,6i,1j,a3,0,y0,8a,19,0,0,c,0,7k,8h,2ky,2x,6i,64,u,0,0,8v,0,8v,c,0,5s,0,68,1a,1g,0,62ua,2f2,62,4g,207,0,9n,r6,3g,4e,0,1630,x,0,w,0,6n,eg,88,1,w,5w,1630,0,9h,18q4,0,4i,8d,0,0,0,0,5k,8x,69,2v,0,0,0,ar5s,0,5j,0,18,0,1g,1i,1,16,0,7a,1k,j3,1,s0,4e,c,0,8v,0,8r,19,207,6c,0,8b,3i,6d,0,0,c,0,4l,0,0,3g,0,0,2z,62ua,1,0,4f,8r,17,0,0,5t,s,17lk,0,u,0,4q,0,66,3b,0,17lk,5n,18,0,0,0,0,8i,0,q,rp0,1g,0,7t,0,8x,1630,8t,5z,78,5u,0,16d,0,k,0,207,2x,61,5u,9g,0,1b,19,89,62ua,4k,w,0,s0,8j,5f,66,0,0,67,5d,1630,60,1j,4i,41,1,51,0,6d,7w,0,q,1630,0,k,0,68,1c,5c,s,0,88,0,0,19,4y,8j,c,0,6g,0,9h,fam,0,8o,0,7g,5h,4i,ag,6q,1,8a,so,1jzo,6k,s,9h,0,uvc,0,2x,1a,7u,1e,9c,0,19,0,0,207,6f,u,5f,10,so,4c,a2,7x,0,8f,84,0,9z,0,4g,63,2x,0,s,0,5c,1if,3g,ai,8e,3i,16,0,0,c,16,0,0,61,18,190,207,0,0,0,87,eg,1i,69,19,1630,0,7q,1a,0,5s,0,16,0,af,18,32,207,0,0,0,0,0,15,0,0,24,18,q,q,eg,207,1a,0,1e,0,0,0,2x,1l2,k,7b,8l,go,62ua,5p,62ua,0,8r,0,so,0,0,2x,0,c,0,1h,1,4y,0,89,0,0,0,86,s,0,g3z,9k,s0,19,9f,0,1,8h,1,0,0,0,0,0,5l,184g,0,0,3d,7i,u,0,1jzo,8p,k,5t,19,8g,5q,0,0,0,0,15wg,0,0,8b,0,0,61,w,0,0,19uo,0,19,10,0,6e,0,17,0,89,0,8k,0,ba,w,0,4i,0,c,8n,2x,0,0,6f,4r,8w,s0,0,0,0,so,0,1,s0,0,0,1e,0,0,3d,5j,92,7y,2w6,1b,18,1h,0,66,q,w,0,2x,16,0,8r,0,0,1jzo,8b,83,0,1,0,6g,w,0,8p,17,64,0,0,1occ,17,7c,c,xq,5r,0,0,0,44,0,7t,w,60,5p,0,1,s,0,0,8k,4g,6s,62,0,0,5c,0,81,0,6h,0,6e,c,eg,7y,62ua,i,71,4e,r,0,93,0,17,0,6u,fa,h9,6f,s0,8y,1,0,0,5v,2x,0,6d,0,3ga,8e,0,16,0,0,8g,4e,5w,8l,0,66,x,78,0,2x,4e,8e,5q,0,0,3c,6k,0,1i,1g,2x,9d,0,5z,0,0,0,8y,0,66,so,s0,0,6q,5v,fo,0,w,0,8e,0,0,7w',
  'p,3y,1b,4f,0,0,2x,0,1,s,0,55,0,10,8w,0,0,0,0,92,0,77,5u,0,1,c,0,19,0,1ohw,0,0,0,0,5y,0,6q,4g,a0n,0,0,0,6i,65,0,207,3h,5es,18,8i,0,0,0,0,6x,1v494,67,9t,0,0,0,0,0,w,0,a1,9u,0,0,6z,207,3c,6i,1,18,0,0,0,2o,207,17,6c,0,0,63,94,0,1g,40,0,u,0,0,6k,207,0,1l48,8i,1jp,6t,0,0,xr,4c,u,7s,5n,1,0,0,k,4q,90,8k,6r,1i,u,5r,64,63,5p,80,1,s,2x,0,8b,u9,0,6t,57,7h,0,7y,0,1630,18,e4,0,4d,1,3g,82,4s,0,0,q,0,0,1j8g,1e,0,94,5x,0,1,67,0,0,3c,0,6b,bc,95,87,7h,0,91,5m,0,0,1,0,rj,2x,1,tpy,1a,0,1,5f,0,0,so,0,68,4e,4ae,6x,37,0,1630,1acg,0,8h,4r,1,s,eg,s,1n,0,0,0,8e,7z,8i,0,0,0,0,0,23h,1jzo,60,0,0,0,0,0,0,16,s0,7k,3i,c,11f,0,0,eg,6n,0,8v,4g,0,0,1l48,5u,7f,0,1630,8l,6e,0,0,l0,0,7iw,1,8o,0,68,9w,c,207,0,40,8e,7q,0,0,1a,0,5n,6k,u,6u,207,0,4g,1h,1c,3g,154,1h,4d,w,0,1j,0,0,b,0,0,6m,10,o4,5z,0,84,1g,1630,18q4,207,0,62,5o,1630,18,6z,0,6p,82,0,eg,68,0,0,0,iu9wo,0,0,c,0,19,8,3f,6r,207,1a,7v,6r,207,1,15iw,8s,3h,0,5u,1630,0,207,78,0,1630,0,0,0,2x,6h,5y,0,207,1jzo,0,61,2i,1630,8t,1,0,5q,207,5,0,0,1,u,0,18q4,62ua,s0,0,1630,0,0,0,0,0,207,18,4g,8x,0,0,6j,62ua,0,0,8f,65,6k,79,0,62ua,8,6u,c,7b,0,0,0,w,5j,7x,0,1b,0,5o,0,0,1v,1,w,0,0,1,4i,8t,8w,7f,18,0,0,4e,1h,6z,0,5x,0,0,87,18,0,1a,0,0,8w,65,1a,0,207,90,73,82,c,0,0,0,6h,1fw,1h,8n,1bgg,0,58,65,62ua,0,0,0,154,5ck,9u,0,0,19,97,1j,5i,8c,2x,0,92,i,4c,8,207,8j,7t,0,6k,cs,8t,0,8f,0,0,0,1d,16,3g,68,1630,0,6b,1,0,0,1pd,1,9d,1630,18,8t,0,6o,mu,154,5r,6b,89,0,6v,sm,0,66,1a,0,e4,5o,1i,6r,0,154,88,2x,68,0,0,0,0,0,198g,8r,q,0,0,8k,0,84,0,3j,0,so,1i,9l,5m,4e,6y,1630,0,4v,6a,11a,u,1j,0,68,k,0,0,so,0,0,0,6a,8o,2x,0,8u,6m,183w,56,5t,58,18,8s,65,448,79,2x,0,so,i,q,1630,12y,8h,w,0,0,kh,6k,0,0,0,16,0,0,61,5j,7q,c,0,c,1630,1,6a,86,1a,5k,0,6i,8b,c,so,4l,eg,51,0,207,0,0,7w,18,0,0,0,62ua,0,6e,0,3g,0,0,3f,0,19,5o,3h,4p,0,u,0,5f,0,6h,0,9h,75,65,w,8o,0,0,66,2x,0,0,0,8s,0,0,207,16,1f,e4,0,s0,0,0,62ua,5o,6k,0,0,0,0,s,0,1630,57,4i,1c,16,0,0,1m8s,0,0,5v,8r,0,0,5k,19,8j,4w,90,j,1h,0,0,95,0,0,0,2x,94,18,eg,73,5t,78,e4,4g,5e,0,5p,7h,7d,0,0,1wg,6q,62ua,v,6i,5v,4p,5v,lc,0,r9,0,77,0,0,0,0,0,3g,1,0,7z,0,2x,0,2wv,0,5i,0,16,0,90,8d,0,0,2x,0,0,8z,86,0,4i,a4,88,4g,18,16,3b,8z,u,13r,0,0,0,p,0,97,82,0,0,6e,8a,2x,1h,0,5g,1a,0,0,f,5w,6h,18,o,17,5b,6s,6d,1630,0,0,1,c,8n,0,0,0,61,0,5v,0,5d,8v,0,4e,6n,18,1e,0,0,5t,9d,19,0,0,0,1gm0,8q,5s,6q,4h,0,19,6c,0,0,0,89,7q,0,94,0,0,7b,0,2a2,0,a,0,0,q,0,0,71,0,0,1,0,0,1s2,0,0,9,0,68,0,170g,16,c,1h,16a,0,0,2x,0,62ua,9m,1i,uvc,0,3rah,0,0,60,19,8s,t,w,10,yx8,4c,83,0,8,0,s,5z,eg,87,5f,0,8z,62,so,0,s0,4g,1l48,0,c,s,0,pws,18,8x,m,95,0,5q,6o,207,3h,0,66,s0,8d,4c,3f,0,6n,207,0,5r,7l,w,0,8z,91,0,c90,0,8x,1,0,17j,0,6f,2x,62ua,2x,5y,0,0,6b,0,4n,4r,64,0,7,8j,0,0,0,xs,8,so,0,62,3f,1l48,16,1630,0,4c,q,5m,7q0,0,17,3d,0,4e,0,8y,6p,3c,1630,61,2x,0,5o,6f,136,0,8r,1g,eg,a4,0,5p,8p,17,0,207,18',
  'u,0,4tv,6m,6t,0,6ri,0,207,6c,69,0,95,0,sg,0,94,5r,0,5w,6d,0,62,68,0,0,7u,0,4y,1a,0,42,6a,s,8,0,s,0,89,8,6i,68,2x,0,e4,0,5a,1h,2x,5x,5o,0,0,0,sg,0,0,0,0,0,68,0,1c3s,1a,17,0,64,0,89,0,0,4a,1i,0,1630,so,0,19,0,c,5f,1az8,s,0,1,0,7,8g,8a,0,17,0,0,51,1,0,0,s0,u,0,4k,0,1630,7g,0,9l,0,0,207,5w,e4,154,0,6b1,8n,16,0,0,8a,5x,6r,0,5t,5n,u,6m,s,0,0,42,0,85,0,0,76,1c,62,1,0,0,4d,0,277,7g,0,0,so,8j,16,6h,15r,0,1a,0,9b,c,so,0,9u,n0g,1630,62,81,i,9f,5g,15,0,7u,0,e7,10,0,3e,1az8,5v,5v,6d,18,0,0,62ua,0,5i,8f,8h,8n,83,u,72,86,0,2x,1,1a,0,0,25b,0,71,6f,6o,6n,0,95,pws,19,70,8m,eg,63,18,5t,6y,0,7u,6e,6e,6i,0,0,7y,5f,15,0,so,64,w,8j,13z,5u,0,0,eg,8fh,0,5u,0,0,18,an,4e,1630,0,69,0,0,4i,7y,58,1c,0,1i,7v,0,0,am,95,yx8,18,6f,18,0,72,0,1i,5t,84,17,0,k,q,0,87,i,4h,8a,0,5q,62ua,0,87,0,0,u3,1i,0,0,1s,19,0,5n,80,19,8h,6a,cyb,0,13z,4g,pu,0,6v,0,0,1g,so,kk,18,0,0,0,88,0,0,0,7x,1ou,8t,52,0,8g,0,0,5j,l6,0,17,0,0,8p,0,0,8p,65,44z,0,6d,0,s,97,i,16,1zwg,0,1a,3f,0,0,80,1ov,0,6h,so,6d,0,0,5z,4t,0,70,0,1,1nog,207,0,6x,0,q,14,5r,0,0,6i,0,0,b4,7l,1,73,8j,0,190,i,0,88,0,9w,33,55,w,8l,s,9q,0,0,60,62ua,6j,1,6q,c,0,67,19uo,18,0,0,62,0,q,c,54,0,0,0,1,0,2x,0,8y,9m,0,4g,0,0,wf,1,1iv4,5l,89,0,207,0,62ua,6t,so,0,86,10,17,1,5u,os8,6k,1zj,a7,1g,0,kv,1h,5g,0,1i,8a,19,1l48,33s,19,0,2x,0,w,k,0,0,uk,0,207,0,i,0,2x,4g,0,88,0,60,6i,62ua,4g,0,0,6t,0,0,92,9a,6r,3k,7v,1i,so,0,3j,ri,0,0,0,1a,0,0,0,70,0,5t,1v98,0,0,8z,8r,1d,so,0,0,0,7s,0,1,0,6e,u,79,8y,0,x8,7v,1630,8o,y,2x,4e,2x,0,6i,18,6q,xr,0,u,6g,0,0,0,0,0,4g,0,5o,0,17,2x,6m,8,o,1bl,7m,0,16,1,1630,1,0,17lk,0,4l,5y,0,8v,0,5r,0,8,8o,18,5y,0,5j,9f,19,0,6q,8i,9e,3g,0,0,0,j3,95,9x,61,1630,2x,0,7m,4g,0,1acg,80,0,0,1630,6,2fy,8i,62ua,8,207,19,0,0,0,7ll,7x,17lk,c,7s,8v,207,1630,16,9e,5w,w,0,u,0,0,0,18,6l,e4,0,ai,0,125,0,8n,5i,19,0,0,0,207,0,0,0,0,4g,17,6g,207,8z,ki,62,7s,5z,0,1h,0,8j,0,0,s0,0,4h,1,0,so,0,16,i2,0,so,s0,6u,0,w,19,7a,0,0,s,0,3o1,k,2x,0,6j,8j,0,4i,u,1630,1gz,0,0,1ob6,0,0,5n,0,1i,3m,0,0,0,81,154,6b,0,3h,68,0,0,6z,k2,1i,w,5w,c,0,1,65,0,0,0,62ua,so,0,0,70,5v,1d9,0,0,75,67,0,9c,0,0,15,63,0,0,8k,0,0,0,0,4i,1j,0,0,18,0,6w,qg,a2,0,q,0,0,0,0,5z,0,0,4k,0,5l,58,1nog,0,0,1h,0,0,s,0,3z,0,7r,4g,5,5r,5r,0,26v,1a,0,3i,9n,1,s,3rah,4e,5ck,19,6g,so,8x,1h,8e,8p,0,10,1,0,7x,6j,84,25,u,8c,207,1j,5u,85,0,5q,7g,zh,l,8u,64,0,0,0,0,w,0,1,8,0,69,0,7v,5g,4i,0,1a,0,5j,64,w,2x,207,8n,8v,5o,82,w,0,0,207,6h,8w,0,0,17,17,69,1,lg,89,6i,62,9f,0,0,8i,1,62ua,w,s,0,6t,0,1630,5n,0,15l,0,0,0,3c,q,61,0,0,18q4,6a,17e,0,67,6x,62ua,x,0,0,0,0,63,2x,0,19,67,0,0,s,k,0,0,0,0,1,8i,0,s,0,0,0,71,86,0,0,1d,0,88,2x,4y0,62ua,0,0,0,6k,4d,0,0,0,5u,0,7f,1,61,62,0,o4,5v,5y,0,1bgg,0,s,62,4i,v,0,1j,67,0,0,c,7q,92,w,80,0,5t,0,6j,83,0,42,0,62ua,1jzo,8h,0,0,0,3c,6g,0,0,0,1,4h,a,6m,0,0,3a,66,0,1af,c',
  '0,8e,50,0,3c,6q,0,0,6b,u,5u,62ua,31k,17,0,1630,1jzo,0,1i,0,w,207,3b,0,uz,i,5q,0,7x,0,3a,0,6t,92,64,7h,87,3g,0,8r,9z,e4,0,91,0,0,1g,9z,6n,sg,0,6w,0,62ua,u,7x,9,0,7w,0,3b3a,94,0,0,0,8f,6c,4c,e,18,5h,15,0,207,0,207,0,8a,67,7b,q,0,0,6z,1,0,s,93,0,4g,4c,td,8v,0,68,0,c,1,62,0,6s,0,0,94,0,c,s0,4i,4t,0,0,4i,0,85,16,9g,0,0,0,c,1,7v,0,0,18,8v,so,62ua,8y,8,97,5s,0,0,0,68,0,0,0,u,0,0,1,0,1i,2x,w,61,8k,2x,0,4f,0,0,0,7c,0,0,4i,1bgg,8h,96,0,0,0,6p,0,64,bkb,3f,96,0,4j,0,4g,0,k,0,89,5x,8z,5z,0,6l,79,77,0,0,1l48,0,i,53,23f,0,5q,87,n4,9d,6b,87,0,0,10,4i,7g,o,6f,0,c,0,6m,9a,0,0,td,0,17,1a,0,0,88,0,10,0,q,4i,84,4s,2x,18,9e,10,6q,0,eg,bc,6z,0,4i,0,5v,0,2x,5v,97,6e,2m,5x,69,8c,76,0,8b,1,62ua,97,0,77,7z,s,0,11y,8i,84,0,8h,8v,0,7a,0,1,2x,0,0,0,0,8x,0,11s,6e,19,0,0,6d,5p,1e,0,8g,7u,0,0,0,c,91,0,5g9,73,0,0,0,2x,4e,26,9h,6s,0,6q,0,0,67,3e,85,1h,0,5t,1630,1630,u,1a,8,69,0,6k,0,9q,0,62ua,6p,18,0,o,4i,nv,64,17,6d,1h,1630,8p,1,5w,3h,1c3s,0,0,18,0,4q,0,0,6c,c,0,59,6c,17,1g,0,q,8g,8t,4k,7u,u,6a,1c6,0,0,6k,63,0,18,0,0,154,u,5w,u,0,0,8z,6k,0,0,5r,4m,1630,5p,0,c,19,0,5p,1f1,0,2x,7r,0,so,19,0,u,2x,70,3g,16,16,105,0,0,0,2x,0,7w,1a,4i,7t,0,6l,5v,4i,3rah,so,c,0,9f,0,84,0,1,96,1,1c,0,0,vu,pws,70,8l,207,16,61,c,0,0,qcg,5p,0,6p,1630,0,8h,c,19,4g,0,0,r,0,6n,1l48,0,s0,0,7z,80,0,9h,0,w,8r,5z,0,19,0,9i,0,18,0,p,1,1h,7v,1h,0,7m,8j,18,18,8w,9c,0,4g,207,16,2x,8i,0,1jzo,0,ki,8v,19,88,1d,6h,1,0,u,0,6g,0,p,5d,6s,67,1a,1,3h,88,1c,5o,1j,7h,1630,6u,so,17lk,65,63,0,0,s,6o,4g,1,8l,0,0,1e,7t,5r,9j,1jzo,0,0,3e,3d,6s,0,1h,0,8d,97,0,0,0,0,0,sg,0,5x,so,72,5y,1,8p,67,0,6d,0,0,6g,0,0,0,8p,6k,0,0,86,0,3l,0,3k,0,0,8e,8h,s0,0,0,5m,0,0,0,q,0,1,6m,6y,6j,0,0,88,0,r,1v,0,0,79,5y,8l,1,0,1630,5q,0,0,18,7h,so,16,1f,0,0,0,8a,s0,0,2zd,c,s,0,4i,bu,6g,0,88,71,0,0,5p,12c,9t,97,1a,1a,1,5u,1g,18,0,4i,89,60,18,0,9c,0,0,0,0,0,0,0,0,8l,1,0,0,0,8m,pq,0,7g,96,0,5v,0,1j,62ua,0,0,3g,0,14,5l,0,0,7s,0,4e,so,0,5o,1h,0,62ua,11v,0,0,0,67,9l,61,1h,0,0,4g,1h,3h,0,85,7,74,0,68,0,87,1630,36,17lk,7f,98,0,0,0,3f,0,7n,0,0,1630,0,9k,0,89,w,0,0,0,0,0,207,0,8o,r,4e,0,sx,0,q,9b,0,0,0,18,8g,0,0,d6k,86,0,3d,0,5y,62ua,2x,0,4i,s,s,3j,8x,1c3s,rf,0,4k,1630,6z,18,0,10,0,ma,1g,8c,3h,0,0,0,s,4y,62ua,0,92,c,64,w,s0,6a,7l,0,q,0,0,8t,19,6o,3quok,0,67,q,0,so,1a,0,18,1x0,8m,0,8j,0,0,9f,7w,0,1630,0,9b,0,4r,8c,90,5p,19,0,5w,1630,93,0,0,62ua,uvc,x,9e,3i,4m,0,0,8p,79,0,3i,2x,4g,42,0,4i,0,q,5n,0,s0,78,1630,w,0,8x,4i,1630,95,2x,5p,4m,17,0,0,1a,7x,3h,6b,97,0,0,0,4a,8l,tu,q,0,62ua,1c3s,s0,5k,0,6x,kg,1g,0,17,0,1b,0,0,6q,8h,6u,19,0,1,6f,0,7u,s,8m,0,s0,0,4g,91,207,0,67,w,k,q,63,6n,c,62ua,6d,62,0,0,0,0,0,4g,7n,q,154,0,6e,0,0,6a,8i,3e,s0,0,k,0,3k,0,0,0,s0,0,19,4r,10,6j,16,0,62ua,0,0,0,6g,65,ie,8e,81,0,0,10,q,6q,4d,0,7,16,8r,1,0,7h,1i,0,0,89,0,c,0,2x,0,s0,1630,0',
  '0,0,8q,0,0,so,8p,0,98,18,1,1,18,1630,41,0,90,68,96,18,0,0,5e,0,0,4i,6z,0,6d,9i,0,1jzo,0,3j,207,7e,0,207,8p,3f,1i,0,9b,6c,0,4g,0,0,0,97,bp,1630,1b,2x,0,4c,17,9b,1b,0,o9,0,83,0,so,10,57,5x,6m,0,0,8g,0,1f,4c,0,4i,0,0,4g,9f,u,8,4c,u,78,20x,z,0,0,5x,88,52,so,63,0,0,9p,2x,5z,62ua,5j,0,q,3j,62,0,9w,so,0,3g,u2,0,19,8k,6a,0,18,0,19uo,6s,5n,0,19,1,b,a4,8q,0,16,w,6z,0,2x,6g,0,8x,0,0,a,6i,3h,0,0,w,19,0,5w,8c,4a,7a,1a,62ua,6s,8n,a8,7d,2x,0,4h,0,8v,3k,d,0,0,bx,66,1c3s,1,187,0,0,17,0,0,0,6v,0,w,8j,3d,0,0,0,0,5i,0,0,44,s0,4g,1g,0,5g,0,4c,5p,f,2x,8r,87,3h,72y,207,0,0,3f,0,0,1,1c,5t,6c,97,0,154,0,6u,i4,2x,0,s0,1,4i,0,0,8w,a3,0,0,3s4c,0,7q,0,6q,0,59,so,0,1630,0,0,0,1e,0,8x,6w,85,207,9v,1,16,8k,62,5m,4f,2x,1,0,14,97,20,0,45,0,0,1j,69,9i,7z,0,207,q,0,3g,6v,0,9e,an,1g,15,0,77,q,s,0,0,0,aa,78,17,207,1c3s,s5w,6y,0,6c,s,0,1630,9t,0,5,8c,0,1h,6z,ss,2x,a8,0,18c,8x,0,0,0,0,4h,s0,93e,c,0,62ua,o,0,0,0,87,0,8r,7gg,s,82,0,0,1k,9r,8m,0,ac,5j,0,7z,8x,0,4e,1,s0,3e,4c,0,c,0,5h,0,u,96,s0,84,8a,4n,i,0,7x,9k,0,0,0,87,0,0,92,0,1630,66,s,8f,0,16,0,9m,0,0,45,6e,4k,0,0,0,0,4i,8u,0,u,0,2x,9b,0,1i,1d,0,5g,8m,0,7y,9m,so,0,0,3g,1jzo,0,31k,6i,6e,0,94,5t,0,18,8x,8,0,4bn,62ua,6a,aj,6o,19,8i,85,0,0,4h,0,96,6i,s,0,1,sf,1h,18,s,66,4a,5wq,0,0,5p,0,so,0,1b1dn,62,5w,18,3e,s,0,0,5w,0,7p,87,0,0,9t,10u8,0,6i,0,0,7t,18,8u,0,5r,6n,a7,64,0,0,92,so,4j,207,0,8u,u,2x,6u,1,0,85,0,0,0,87,0,s,18q4,0,0,0,qe,w,9c,o,s0,6j,0,3i,37,0,8y,0,87,0,0,1,1630,81,19,170g,4p,6k,so,9,0,0,7c,7m,0,7s,0,207,so,m2,8t,1630,16,0',
]);

return { SOURCE, PROTOCOLS, SERVICES, FLAGS, LABELS, RECORDS, SRC_BYTES };
})();

// src/pages/statistics/hw7/homework7.js
// Homework #7 di Statistics: la libreria dei calcoli. Due parti, come la
// consegna. La prima usa il teorema di Bayes come motore inferenziale: un
// allarme dell'IDS e il tasso di base, una rete bayesiana per il triage di
// un incidente, il test sequenziale di Wald per decidere quando bloccare un
// indirizzo IP, la stima bayesiana della quota di dipendenti che cliccano
// un phishing (con un prior qualsiasi, su una griglia, e il confronto con
// gli intervalli frequentisti), e due filtri naive Bayes su dati veri: gli
// SMS della SMS Spam Collection e le connessioni di NSL-KDD. La seconda
// esplora le forme di convergenza: in probabilita', quasi certa, in media
// quadratica e in distribuzione (legge dei grandi numeri e limite
// centrale), con i controesempi che le separano, le code pesanti, la
// velocita' delle disuguaglianze, il posterior che converge e le collisioni
// di hash.
//
// Lo stesso file serve la pagina (import), il worker (stats.worker.js) e il
// programma scaricabile (homework7.js da solo, anche con node homework7.js):
// niente DOM fuori dalle funzioni di disegno, niente dipendenze. I dati sono
// in smsspam.js e nslkdd.js, che la build mette dentro il programma.
const { MESSAGES, SOURCE: SMS_SOURCE } = smsspam$;
const { FLAGS, LABELS, PROTOCOLS, RECORDS, SERVICES, SOURCE: KDD_SOURCE, SRC_BYTES } = nslkdd$;

const fail = (message) => {
  throw new RangeError(message);
};

// ---------------------------------------------------------------------------
// 1. I parametri
// ---------------------------------------------------------------------------

/** The seed of every stream as the page opens. */
const DEFAULT_SEED = 2026;

/** The accepted ranges. */
const LIMITS = Object.freeze({
  seed: Object.freeze([0, 4294967295]),
});

/** Significance level of every test. */
const SIGNIFICANCE = 0.05;

/** An integer of the range [min, max], in decimal digits. */
function parseInteger(text, [min, max]) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (!/^\d{1,12}$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const value = Number(t);
  if (value < min || value > max) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** The parameters of the computations, checked against LIMITS. */
function checkParams({ seed = DEFAULT_SEED } = {}) {
  if (!(Number.isInteger(seed) && seed >= LIMITS.seed[0] && seed <= LIMITS.seed[1])) fail(`seed out of range: ${seed}`);
  return { seed };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const range = (n) => Array.from({ length: n }, (_, i) => i);
const LN10 = Math.log(10);
const SQRT_2PI = Math.sqrt(2 * Math.PI);

// ---------------------------------------------------------------------------
// 2. Le funzioni speciali: gamma, beta, normale, binomiale, Kolmogorov
// ---------------------------------------------------------------------------

const LANCZOS = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];

/** ln Γ(x) for x > 0 (Lanczos, g = 7, nine coefficients: relative error about 1e-15). */
function lnGamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  const z = x - 1;
  let a = LANCZOS[0];
  const t = z + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** ln B(a, b). */
const lnBeta = (a, b) => lnGamma(a) + lnGamma(b) - lnGamma(a + b);

/** ln of the binomial coefficient C(n, k). */
const lnChoose = (n, k) => lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);

const TINY = 1e-300;

/**
 * The regularized incomplete gamma functions P(s, x) and Q(s, x) = 1 - P:
 * the series below s + 1, Lentz's continued fraction above (Numerical
 * Recipes 6.2), as in Homework #5. Returns { P, Q }.
 */
function incompleteGamma(s, x) {
  if (!(s > 0) || !(x >= 0)) return { P: NaN, Q: NaN };
  if (x === 0) return { P: 0, Q: 1 };
  const front = Math.exp(-x + s * Math.log(x) - lnGamma(s));
  if (x < s + 1) {
    let term = 1 / s;
    let total = term;
    for (let n = 1; n < 100000; n++) {
      term *= x / (s + n);
      total += term;
      if (Math.abs(term) < Math.abs(total) * 1e-16) break;
    }
    const P = Math.min(1, total * front);
    return { P, Q: 1 - P };
  }
  let b = x + 1 - s;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - s);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  const Q = Math.min(1, front * h);
  return { P: 1 - Q, Q };
}

/** The distribution function of the Gamma(k, 1) law, the sum of k exponential values of mean 1. */
const gammaCdf = (x, k) => (x <= 0 ? 0 : incompleteGamma(k, x).P);

// the continued fraction of the incomplete beta function (Numerical Recipes 6.4, Lentz)
function betaFraction(x, a, b) {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < 100000; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return h;
}

/** The regularized incomplete beta function I_x(a, b), the distribution function of the Beta(a, b) law at x. */
function betaCdf(x, a, b) {
  if (!(a > 0 && b > 0)) return NaN;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnFront = a * Math.log(x) + b * Math.log1p(-x) - lnBeta(a, b);
  if (x < (a + 1) / (a + b + 2)) return (Math.exp(lnFront) * betaFraction(x, a, b)) / a;
  return 1 - (Math.exp(lnFront) * betaFraction(1 - x, b, a)) / b;
}

/** The density of the Beta(a, b) law at x. */
function betaDensity(x, a, b) {
  if (x < 0 || x > 1) return 0;
  if (x === 0) return a < 1 ? Infinity : a === 1 ? Math.exp(-lnBeta(a, b)) : 0;
  if (x === 1) return b < 1 ? Infinity : b === 1 ? Math.exp(-lnBeta(a, b)) : 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - lnBeta(a, b));
}

/** The quantile of the Beta(a, b) law: Newton's method on I_x(a, b) = p, kept inside a bracket that bisection narrows. */
function betaQuantile(p, a, b) {
  if (!(p >= 0 && p <= 1)) return NaN;
  if (p === 0) return 0;
  if (p === 1) return 1;
  let lo = 0;
  let hi = 1;
  let x = a / (a + b);
  for (let i = 0; i < 200; i++) {
    const f = betaCdf(x, a, b) - p;
    if (f === 0) return x;
    if (f < 0) lo = x;
    else hi = x;
    const density = betaDensity(x, a, b);
    let next = density > 0 && Number.isFinite(density) ? x - f / density : NaN;
    if (!(next > lo && next < hi)) next = (lo + hi) / 2;
    if (Math.abs(next - x) <= 1e-15 * Math.max(x, 1e-300) || hi - lo <= 1e-16) return next;
    x = next;
  }
  return x;
}

/** The standard normal density. */
const phi = (z) => Math.exp(-0.5 * z * z) / SQRT_2PI;

/**
 * Mills' ratio R(w) = P(Z > w)/phi(w), by Laplace's continued fraction
 * (Lentz), for w > 0: it keeps the relative accuracy far in the tail.
 */
function millsRatio(w) {
  let f = w;
  let C = w;
  let D = 0;
  for (let k = 1; k <= 5000; k++) {
    D = w + k * D;
    D = 1 / (D === 0 ? TINY : D);
    C = w + k / C;
    if (C === 0) C = TINY;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return 1 / f;
}

/**
 * The standard normal distribution function Phi, the method of Homework #5:
 * the series with positive terms 1/2 + phi(z)(z + z^3/3 + z^5/15 + ...)
 * for |z| < 2, Laplace's continued fraction beyond. About 15 correct digits.
 */
function normalCdf(z) {
  if (Number.isNaN(z)) return NaN;
  const w = Math.abs(z);
  if (w < 2) {
    let term = z;
    let sum = z;
    for (let k = 1; k < 200; k++) {
      term *= (z * z) / (2 * k + 1);
      sum += term;
      if (Math.abs(term) <= 1e-17 * Math.abs(sum)) break;
    }
    return 0.5 + phi(z) * sum;
  }
  if (w > 40) return z < 0 ? 0 : 1;
  const q = phi(w) * millsRatio(w);
  return z < 0 ? q : 1 - q;
}

/** P(Z > z), with its relative accuracy also far in the upper tail. */
const normalSf = (z) => normalCdf(-z);

/**
 * The standard normal quantile: Acklam's rational approximation (relative
 * error below 1.2e-9), then one step of Halley's method on normalCdf.
 */
function normalQuantile(p) {
  if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  let x;
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p > 1 - 0.02425) {
    const q = Math.sqrt(-2 * Math.log1p(-p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const e = normalCdf(x) - p;
  const u = e / phi(x);
  return x - u / (1 + (x * u) / 2);
}

/** ln P(K = k) for K ~ Binomial(n, p). */
function binomialLogPmf(k, n, p) {
  if (k < 0 || k > n || !Number.isInteger(k)) return -Infinity;
  if (p === 0) return k === 0 ? 0 : -Infinity;
  if (p === 1) return k === n ? 0 : -Infinity;
  return lnChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p);
}

/** P(K <= k) for K ~ Binomial(n, p), through the incomplete beta function: I_(1-p)(n - k, k + 1). */
function binomialCdf(k, n, p) {
  const kk = Math.floor(k);
  if (kk < 0) return 0;
  if (kk >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  return betaCdf(1 - p, n - kk, kk + 1);
}

/** P(K >= k) for K ~ Binomial(n, p), without the cancellation of 1 - P(K <= k - 1) in the upper tail. */
function binomialSf(k, n, p) {
  const kk = Math.ceil(k);
  if (kk <= 0) return 1;
  if (kk > n) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return betaCdf(p, kk, n - kk + 1);
}

/**
 * The survival function of Kolmogorov's limit law, P(K > x): the
 * alternating series 2 sum (-1)^(k-1) exp(-2 k^2 x^2) for x >= 1, the theta
 * series sqrt(2 pi)/x sum exp(-(2k-1)^2 pi^2/(8 x^2)) below.
 */
function kolmogorovSf(x) {
  if (!(x > 0)) return 1;
  if (x < 1) {
    let s = 0;
    for (let k = 1; k <= 20; k++) s += Math.exp(-((2 * k - 1) ** 2) * Math.PI * Math.PI / (8 * x * x));
    return clamp(1 - (SQRT_2PI / x) * s, 0, 1);
  }
  let s = 0;
  for (let k = 1; k <= 200; k++) {
    const t = Math.exp(-2 * k * k * x * x);
    s += k % 2 ? t : -t;
    if (t < 1e-18) break;
  }
  return clamp(2 * s, 0, 1);
}

/**
 * The Kolmogorov-Smirnov test of a sample against a continuous
 * distribution function: D = sup |F_n - F|, and its p-value from
 * Kolmogorov's law with Stephens' correction (sqrt n + 0.12 + 0.11/sqrt n) D,
 * with its logarithm also below 10^-300.
 */
function ksTest(values, cdf) {
  const x = Float64Array.from(values).sort();
  const n = x.length;
  let D = 0;
  for (let i = 0; i < n; i++) {
    const F = cdf(x[i]);
    D = Math.max(D, (i + 1) / n - F, F - i / n);
  }
  const root = Math.sqrt(n);
  const lambda = (root + 0.12 + 0.11 / root) * D;
  const p = kolmogorovSf(lambda);
  // when p underflows, its logarithm from the first term of the series, 2 exp(-2 lambda^2)
  const log10p = p > 0 ? Math.log10(p) : (Math.LN2 - 2 * lambda * lambda) / LN10;
  return { D, p, log10p, size: n };
}

/** The standard Cauchy distribution function. */
const cauchyCdf = (x) => 0.5 + Math.atan(x) / Math.PI;

/** A p-value written as { p, log10p }, also when p underflows. */
const pOf = (p) => ({ p, log10p: p > 0 ? Math.log10(p) : -Infinity });

/**
 * The exact two-sided binomial test of k successes in n trials against the
 * probability p0: the sum of the probabilities of the outcomes no more
 * likely than k (the rule of R's binom.test and SciPy's binomtest).
 */
function binomialTest(k, n, p0) {
  const own = binomialLogPmf(k, n, p0);
  let total = 0;
  const tolerance = 1e-7;
  for (let j = 0; j <= n; j++) {
    const lp = binomialLogPmf(j, n, p0);
    if (lp <= own + tolerance) total += Math.exp(lp);
  }
  return { k, n, p0, observed: k / n, ...pOf(Math.min(1, total)) };
}

/** ln P(K <= k) for K ~ Binomial(n, p), summed in logarithms: it never underflows, however small. */
function binomialLogCdf(k, n, p) {
  const terms = range(Math.floor(k) + 1).map((j) => binomialLogPmf(j, n, p));
  const top = Math.max(...terms);
  if (top === -Infinity) return -Infinity;
  return top + Math.log(terms.reduce((s, t) => s + Math.exp(t - top), 0));
}

/**
 * McNemar's exact test on the discordant pairs b and c (b + c > 0): twice
 * the lower binomial tail of min(b, c) in b + c trials with p = 1/2, capped
 * at 1, with its logarithm when p underflows.
 */
function mcnemarTest(b, c) {
  const n = b + c;
  if (n === 0) return { b, c, p: 1, log10p: 0 };
  const lnP = Math.min(0, Math.log(2) + binomialLogCdf(Math.min(b, c), n, 0.5));
  return { b, c, p: Math.exp(lnP), log10p: lnP / LN10 };
}

// ---------------------------------------------------------------------------
// 3. Il generatore
// ---------------------------------------------------------------------------

/*
 * The generators of Homework #3 to #6: SplitMix64 turns a 64-bit number
 * into the initial state of xoshiro128**, which draws the numbers. Every
 * stream starts SplitMix64 from seed x 2^32 + j, XOR the golden ratio times
 * the number of the stream, so the streams never meet and every repetition
 * j (a campaign, a path, a sample) is the same whatever the others do.
 * Stream 0 ('main') is the first stream of Homework #5 and #6, checked
 * there against independent Python code; here the other streams are
 * checked the same way, through the results they produce.
 */

const MASK64 = (1n << 64n) - 1n;
const GOLDEN = 0x9e3779b97f4a7c15n;

/** SplitMix64 (Steele, Lea and Flood, 2014), as in Vigna's reference code: 64-bit outputs, as BigInt. */
function splitMix64(seed) {
  let x = BigInt.asUintN(64, BigInt(seed));
  return () => {
    x = (x + GOLDEN) & MASK64;
    let z = x;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    return z ^ (z >> 31n);
  };
}

const rotl = (x, k) => (x << k) | (x >>> (32 - k));

/** xoshiro128** 1.1 from the state (a, b, c, d), not all zero: unsigned 32-bit outputs. */
function xoshiro128ss(a, b, c, d) {
  let s0 = a | 0;
  let s1 = b | 0;
  let s2 = c | 0;
  let s3 = d | 0;
  if ((s0 | s1 | s2 | s3) === 0) fail('the state of xoshiro128** must not be all zero');
  return () => {
    const result = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0;
    const t = s1 << 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = rotl(s3, 11);
    return result;
  };
}

/** The streams of the page: more are added at the end, so the first ones keep their numbers. */
const STREAMS = Object.freeze(['main', 'phishing', 'sprt', 'paths', 'sequences', 'clt', 'cauchy', 'bytes', 'hash', 'coverage', 'bvm', 'live', 'bursts', 'gc']);

/** The initial state of stream `stream`, repetition j (from 0): two outputs of SplitMix64 as four 32-bit words. */
function streamState(seed, stream, j) {
  const index = STREAMS.indexOf(stream);
  if (index < 0) fail(`unknown stream ${stream}`);
  const start = (BigInt(seed >>> 0) << 32n) | BigInt(j >>> 0);
  const next = splitMix64(start ^ ((GOLDEN * BigInt(index)) & MASK64));
  const a = next();
  const b = next();
  return [Number(a & 0xffffffffn), Number(a >> 32n), Number(b & 0xffffffffn), Number(b >> 32n)];
}

/** A stream: xoshiro128** from streamState. */
const generator = (seed, stream, j) => xoshiro128ss(...streamState(seed, stream, j));

/** A uniform double in (0, 1) from two outputs: 53 random bits, never 0 and never 1. */
const uniform53 = (next) => ((next() >>> 5) * 67108864 + (next() >>> 6) + 0.5) / 9007199254740992;

/** A new seed from the cryptographic generator, when there is one (the seed does not protect anything). */
function randomSeed() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}

/** Standard normal values by Box-Muller (1958): two uniforms give two independent normals, sqrt(-2 ln u1) (cos, sin)(2 pi u2). */
function normalSampler(next) {
  let spare = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    const r = Math.sqrt(-2 * Math.log(uniform53(next)));
    const angle = 2 * Math.PI * uniform53(next);
    spare = r * Math.sin(angle);
    return r * Math.cos(angle);
  };
}

/** A Bernoulli value: 1 when the uniform falls below p. */
const bernoulli = (next, p) => (uniform53(next) < p ? 1 : 0);

/** An integer of [0, m), m <= 2^32, from one uniform (bias below 2^-21 for m <= 2^32, irrelevant here). */
const uniformInt = (next, m) => Math.floor(uniform53(next) * m);

// ---------------------------------------------------------------------------
// I calcoli a fette
// ---------------------------------------------------------------------------

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

/** Runs a generator in slices of a few milliseconds, leaving the browser free to draw in between. */
function runStepsAsync(makeSteps, { sliceMs = 12, schedule = (run) => setTimeout(run, 0) } = {}) {
  return new Promise((resolve, reject) => {
    let steps;
    try {
      steps = makeSteps();
    } catch (error) {
      reject(error);
      return;
    }
    const run = () => {
      const end = Date.now() + sliceMs;
      try {
        let step = steps.next();
        while (!step.done && Date.now() < end) step = steps.next();
        if (step.done) resolve(step.value);
        else schedule(run);
      } catch (error) {
        reject(error);
      }
    };
    schedule(run);
  });
}

// ---------------------------------------------------------------------------
// 4. Bayes, il motore: prior x verosimiglianza / evidenza = posterior
// ---------------------------------------------------------------------------

/** Bayes' theorem on a finite set of hypotheses: the posteriors from the priors and the likelihoods of the evidence, and the evidence P(E). */
function bayes(priors, likelihoods) {
  const joint = priors.map((p, i) => p * likelihoods[i]);
  const evidence = joint.reduce((s, v) => s + v, 0);
  return { posteriors: joint.map((v) => v / evidence), evidence };
}

const odds = (p) => p / (1 - p);
const probabilityOfOdds = (o) => (o === Infinity ? 1 : o / (1 + o));
/** The logistic function, without overflow for large |x|. */
const sigmoid = (x) => (x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)));

// --- 4.1 L'allarme dell'IDS --------------------------------------------------

/** The alarm as the page opens: one connection in 100 is an attack, the IDS sees 95 attacks in 100 and raises an alarm on 3 normal connections in 100. */
const ALARM_DEFAULT = Object.freeze({ base: 0.01, sensitivity: 0.95, fpr: 0.03 });
/** The second, independent detector: a sandbox that opens what the connection carried. */
const SECOND_DETECTOR = Object.freeze({ sensitivity: 0.8, fpr: 0.01 });
/** The connections of the picture of natural frequencies. */
const POPULATION = 10000;
/** The values the sliders of "Try it" can take. */
const ALARM_BASES = Object.freeze([0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5]);
const ALARM_SENSITIVITIES = Object.freeze([0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 0.999]);
const ALARM_FPRS = Object.freeze([0.0001, 0.0005, 0.001, 0.005, 0.01, 0.02, 0.03, 0.05, 0.1, 0.2]);

/** Integer counts from real ones that add up to `total`: the largest remainders get the units left over. */
function roundCounts(values, total) {
  const floors = values.map(Math.floor);
  let left = total - floors.reduce((s, v) => s + v, 0);
  const order = values.map((v, i) => [v - Math.floor(v), i]).sort((x, y) => y[0] - x[0] || x[1] - y[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

/**
 * One alarm: the probability of an attack after it (Bayes), and after its
 * silence; the likelihood ratios; the natural frequencies of `population`
 * connections (expected, and rounded for the picture: detected attacks,
 * missed attacks, false alarms, quiet normal connections).
 */
function alarmFacts({ base, sensitivity, fpr }, population = POPULATION) {
  const pAlarm = base * sensitivity + (1 - base) * fpr;
  const posterior = (base * sensitivity) / pAlarm;
  const pQuiet = 1 - pAlarm;
  const posteriorQuiet = (base * (1 - sensitivity)) / pQuiet;
  const expected = [population * base * sensitivity, population * base * (1 - sensitivity), population * (1 - base) * fpr, population * (1 - base) * (1 - fpr)];
  return {
    base,
    sensitivity,
    fpr,
    pAlarm,
    posterior,
    posteriorQuiet,
    lrPlus: sensitivity / fpr,
    lrMinus: (1 - sensitivity) / (1 - fpr),
    priorOdds: odds(base),
    posteriorOdds: odds(base) * (sensitivity / fpr),
    expected,
    counts: roundCounts(expected, population),
    population,
  };
}

/**
 * Evidence after evidence: every detector, with its sensitivity, its false
 * positive rate and whether it fired, multiplies the odds by its likelihood
 * ratio; in logarithms it adds its weight. Turing measured the weights in
 * bans (log10) and decibans. The posterior of a step is the prior of the next.
 */
function evidenceChain(base, detectors) {
  let logOdds = Math.log(odds(base));
  return detectors.map((d) => {
    const lr = d.fired ? d.sensitivity / d.fpr : (1 - d.sensitivity) / (1 - d.fpr);
    const prior = sigmoid(logOdds);
    logOdds += Math.log(lr);
    return { ...d, prior, lr, weight: Math.log10(lr), posterior: sigmoid(logOdds), logOdds };
  });
}

// --- 4.2 La rete bayesiana del triage ----------------------------------------

/**
 * A small Bayesian network for the triage of an incident. Two causes:
 * a phishing that stole a password, and a vulnerability exploited from
 * outside. Either can compromise the host (noisy-OR, with a small leak).
 * Three clues: the EDR on the host raises an alarm (child of the
 * compromise), the login comes from an unusual place (child of the
 * phishing), the IDS sees the signature of an exploit (child of the
 * vulnerability). The numbers are plausible orders of magnitude, not data.
 */
const NETWORK = Object.freeze({
  nodes: Object.freeze(['phishing', 'exploit', 'compromise', 'edr', 'login', 'signature']),
  causes: Object.freeze({ phishing: 0.05, exploit: 0.02 }),
  compromise: Object.freeze({ leak: 0.002, phishing: 0.6, exploit: 0.9 }),
  // P(clue | its parent false), P(clue | its parent true)
  edr: Object.freeze({ parent: 'compromise', p: Object.freeze([0.04, 0.85]) }),
  login: Object.freeze({ parent: 'phishing', p: Object.freeze([0.03, 0.5]) }),
  signature: Object.freeze({ parent: 'exploit', p: Object.freeze([0.01, 0.8]) }),
});

const CLUES = Object.freeze(['edr', 'login', 'signature']);
const HIDDEN = Object.freeze(['phishing', 'exploit', 'compromise']);

/** P(compromise | phishing, exploit) by noisy-OR: each cause fails to compromise on its own, independently. */
function compromiseGiven(phishing, exploit) {
  const c = NETWORK.compromise;
  return 1 - (1 - c.leak) * (phishing ? 1 - c.phishing : 1) * (exploit ? 1 - c.exploit : 1);
}

/** The probability of one complete state of the network, { phishing: 0|1, ... }: the product of every node given its parents. */
function networkJoint(s) {
  const pick = (p, v) => (v ? p : 1 - p);
  let p = pick(NETWORK.causes.phishing, s.phishing) * pick(NETWORK.causes.exploit, s.exploit);
  p *= pick(compromiseGiven(s.phishing, s.exploit), s.compromise);
  for (const clue of CLUES) p *= pick(NETWORK[clue].p[s[NETWORK[clue].parent]], s[clue]);
  return p;
}

/**
 * Inference by enumeration: the 64 states consistent with the evidence
 * ({ edr: true | false, ... }; a clue left out is unknown), summed. Returns
 * the probability of every node given the evidence, and P(evidence).
 */
function networkPosterior(evidence = {}) {
  const totals = Object.fromEntries(NETWORK.nodes.map((n) => [n, 0]));
  let pEvidence = 0;
  for (let bits = 0; bits < 64; bits++) {
    const s = Object.fromEntries(NETWORK.nodes.map((n, i) => [n, (bits >> i) & 1]));
    if (Object.entries(evidence).some(([n, v]) => v !== null && v !== undefined && s[n] !== (v ? 1 : 0))) continue;
    const p = networkJoint(s);
    pEvidence += p;
    for (const n of NETWORK.nodes) if (s[n]) totals[n] += p;
  }
  return { ...Object.fromEntries(NETWORK.nodes.map((n) => [n, totals[n] / pEvidence])), pEvidence };
}

/** The story of section 1.3, one clue at a time: nothing, the EDR alarm, the exploit signature, the unusual login. */
const NETWORK_STEPS = Object.freeze([
  Object.freeze({}),
  Object.freeze({ edr: true }),
  Object.freeze({ edr: true, signature: true }),
  Object.freeze({ edr: true, signature: true, login: true }),
]);

// --- 4.3 Quando bloccare un IP: il test sequenziale di Wald ------------------

/**
 * Login attempts from one address, one at a time. A legitimate user fails
 * now and then (p0 = 0.2: typos, an old password); a brute-force attack
 * fails almost always (p1 = 0.95). Blocking a legitimate user should
 * happen once in a thousand (alpha), missing an attacker once in a hundred
 * (beta).
 */
const SPRT_DEFAULT = Object.freeze({ p0: 0.2, p1: 0.95, alpha: 0.001, beta: 0.01 });
const SPRT_ALPHAS = Object.freeze([0.01, 0.001, 0.0001]);
/** How many attempts the exact computation and the simulation follow before giving up. */
const SPRT_MAX_STEPS = 400;

/**
 * Wald's sequential probability ratio test (1945): every failed attempt
 * adds ln(p1/p0) to the log-likelihood ratio, every success adds
 * ln((1 - p1)/(1 - p0)); the address is blocked when the sum reaches
 * ln((1 - beta)/alpha), cleared when it falls to ln(beta/(1 - alpha)). With
 * the prior odds of an attack added, the same sum is the log of the
 * posterior odds: Bayes' theorem applied one attempt at a time.
 */
function sprtSetup({ p0, p1, alpha, beta } = SPRT_DEFAULT) {
  const fail = Math.log(p1 / p0);
  const success = Math.log((1 - p1) / (1 - p0));
  const upper = Math.log((1 - beta) / alpha);
  const lower = Math.log(beta / (1 - alpha));
  // the mean step under each hypothesis: the Kullback-Leibler divergences, with their signs
  const driftAttacker = p1 * fail + (1 - p1) * success;
  const driftLegit = p0 * fail + (1 - p0) * success;
  return {
    p0,
    p1,
    alpha,
    beta,
    fail,
    success,
    upper,
    lower,
    driftAttacker,
    driftLegit,
    // Wald's approximations of the expected number of attempts
    waldAttacker: ((1 - beta) * upper + beta * lower) / driftAttacker,
    waldLegit: (alpha * upper + (1 - alpha) * lower) / driftLegit,
  };
}

/** The decision after a log-likelihood ratio: 'block', 'clear' or null (one more attempt). */
const sprtDecision = (setup, llr) => (llr >= setup.upper - 1e-12 ? 'block' : llr <= setup.lower + 1e-12 ? 'clear' : null);

/** The path of the log-likelihood ratio along a list of attempts (true = failed), stopped at the decision. */
function sprtPath(setup, attempts) {
  const llr = [0];
  let decision = null;
  for (const failed of attempts) {
    if (decision) break;
    const next = llr[llr.length - 1] + (failed ? setup.fail : setup.success);
    llr.push(next);
    decision = sprtDecision(setup, next);
  }
  return { llr, decision, steps: llr.length - 1 };
}

/**
 * The exact behaviour of the test when every attempt fails with
 * probability pFail: the walk lives on the lattice f ln(p1/p0) + s ln(...)
 * of failures and successes, so its law after every attempt is a short
 * list of points, followed until SPRT_MAX_STEPS. Returns the probabilities
 * of blocking, of clearing and of no decision, and the expected number of
 * attempts (counting the undecided ones at the last step).
 */
function sprtExact(setup, pFail, maxSteps = SPRT_MAX_STEPS) {
  let alive = new Map([['0,0', 1]]);
  let block = 0;
  let clear = 0;
  let mean = 0;
  const stopping = [];
  for (let n = 1; n <= maxSteps && alive.size; n++) {
    const next = new Map();
    let stoppedNow = 0;
    for (const [key, p] of alive) {
      const [f, s] = key.split(',').map(Number);
      for (const [failed, q] of [[true, pFail], [false, 1 - pFail]]) {
        const ff = f + (failed ? 1 : 0);
        const ss = s + (failed ? 0 : 1);
        const mass = p * q;
        const decision = sprtDecision(setup, ff * setup.fail + ss * setup.success);
        if (decision === 'block') block += mass;
        else if (decision === 'clear') clear += mass;
        else {
          const k = `${ff},${ss}`;
          next.set(k, (next.get(k) || 0) + mass);
          continue;
        }
        stoppedNow += mass;
        mean += n * mass;
      }
    }
    stopping.push(stoppedNow);
    alive = next;
  }
  const undecided = [...alive.values()].reduce((s, v) => s + v, 0);
  return { block, clear, undecided, mean: mean + maxSteps * undecided, stopping };
}

/**
 * The same test simulated: `runs` addresses whose attempts fail with
 * probability pFail; run r draws from stream 'sprt', repetition offset + r.
 */
function sprtSimulate(setup, pFail, runs, seed, offset = 0) {
  let block = 0;
  let clear = 0;
  let undecided = 0;
  let steps = 0;
  for (let r = 0; r < runs; r++) {
    const next = generator(seed, 'sprt', offset + r);
    let llr = 0;
    let decision = null;
    let n = 0;
    while (!decision && n < SPRT_MAX_STEPS) {
      n++;
      llr += uniform53(next) < pFail ? setup.fail : setup.success;
      decision = sprtDecision(setup, llr);
    }
    if (decision === 'block') block++;
    else if (decision === 'clear') clear++;
    else undecided++;
    steps += n;
  }
  return { runs, block, clear, undecided, meanSteps: steps / runs };
}

/** The simulated users and attackers of section 1.4. */
const SPRT_RUNS = 10000;

// --- 4.4 Stimare un tasso: il phishing, con un prior Beta ----------------------

/** The simulated campaign: 40 e-mails a day for 10 days; the true share of clicks, 12%, is unknown to the analyst. */
const CAMPAIGN = Object.freeze({ days: 10, perDay: 40, rate: 0.12 });

/** The priors of the page, as the parameters (a, b) of a Beta law. */
const PRIORS = Object.freeze({
  uniform: Object.freeze([1, 1]),
  jeffreys: Object.freeze([0.5, 0.5]),
  informed: Object.freeze([3, 17]),
  wrong: Object.freeze([40, 60]),
});
const PRIOR_KEYS = Object.freeze(['uniform', 'jeffreys', 'informed', 'wrong']);

/** The clicks of the campaign, day by day: day d draws its e-mails from stream 'phishing', repetition d. */
function campaign(seed, { days, perDay, rate } = CAMPAIGN) {
  return range(days).map((d) => {
    const next = generator(seed, 'phishing', d);
    let clicks = 0;
    for (let i = 0; i < perDay; i++) clicks += bernoulli(next, rate);
    return { day: d + 1, sent: perDay, clicks };
  });
}

/** The posterior Beta(a + clicks, b + sent - clicks), with its mean, mode, standard deviation and equal-tailed credible interval. */
function betaPosterior([a0, b0], clicks, sent, level = 0.95) {
  const a = a0 + clicks;
  const b = b0 + sent - clicks;
  const mean = a / (a + b);
  const tail = (1 - level) / 2;
  return {
    a,
    b,
    mean,
    mode: a > 1 && b > 1 ? (a - 1) / (a + b - 2) : null,
    sd: Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1))),
    lo: betaQuantile(tail, a, b),
    hi: betaQuantile(1 - tail, a, b),
    // the probability that the true rate exceeds a threshold
    above: (x) => 1 - betaCdf(x, a, b),
  };
}

/** The posterior after every day of the campaign: day 0 is the prior. */
function campaignPosteriors(days, prior) {
  let sent = 0;
  let clicks = 0;
  const rows = [{ day: 0, sent, clicks, ...betaPosterior(prior, 0, 0) }];
  for (const d of days) {
    sent += d.sent;
    clicks += d.clicks;
    rows.push({ day: d.day, sent, clicks, ...betaPosterior(prior, clicks, sent) });
  }
  return rows;
}

/** The share of clicks the security team wants to stay under, and the question of section 1.5: how likely is the rate above it? */
const TARGET_RATE = 0.1;

// --- 4.5 Un prior qualsiasi, su una griglia -----------------------------------

/** The grid of the rates: 0, 0.005, ..., 1. */
const GRID_SIZE = 201;
const GRID = Object.freeze(range(GRID_SIZE).map((i) => i / (GRID_SIZE - 1)));
/** The handles of the prior that can be dragged: 0, 0.1, ..., 1. */
const HANDLES = 11;
const HANDLE_X = Object.freeze(range(HANDLES).map((i) => i / (HANDLES - 1)));

/** Ready-made shapes of the prior, as the heights of the handles (0 to 1). */
const PRIOR_SHAPES = Object.freeze({
  flat: Object.freeze(range(HANDLES).map(() => 0.6)),
  informed: Object.freeze(HANDLE_X.map((x) => {
    const peak = betaDensity(2 / 18, 3, 17);
    return Number((betaDensity(Math.min(Math.max(x, 1e-9), 1 - 1e-9), 3, 17) / peak).toFixed(3));
  })),
  twoPeaks: Object.freeze([0.05, 0.9, 0.35, 0.05, 0.05, 0.1, 0.35, 0.9, 0.35, 0.05, 0.02]),
  pessimist: Object.freeze([0, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 0.95, 1]),
});
const PRIOR_SHAPE_KEYS = Object.freeze(['flat', 'informed', 'twoPeaks', 'pessimist']);

/** The trapezoid rule on the grid. */
const gridIntegral = (values) => {
  const h = 1 / (GRID_SIZE - 1);
  let s = 0;
  for (let i = 1; i < GRID_SIZE; i++) s += (values[i - 1] + values[i]) * h * 0.5;
  return s;
};

/** The prior on the grid from the heights of the handles, joined by straight lines and normalized to a density. */
function priorFromHandles(heights) {
  const values = GRID.map((x) => {
    const t = x * (HANDLES - 1);
    const i = Math.min(HANDLES - 2, Math.floor(t));
    const u = t - i;
    return Math.max(0, heights[i] * (1 - u) + heights[i + 1] * u);
  });
  const area = gridIntegral(values);
  return area > 0 ? values.map((v) => v / area) : values.map(() => 1);
}

/** The quantile of a density on the grid, from its cumulative trapezoids, by linear interpolation. */
function gridQuantile(density, q) {
  const h = 1 / (GRID_SIZE - 1);
  let cumulative = 0;
  for (let i = 1; i < GRID_SIZE; i++) {
    const piece = (density[i - 1] + density[i]) * h * 0.5;
    if (cumulative + piece >= q) return GRID[i - 1] + (piece > 0 ? ((q - cumulative) / piece) * h : 0);
    cumulative += piece;
  }
  return 1;
}

/**
 * Bayes on a grid, with any prior: posterior = prior x likelihood,
 * normalized by the trapezoid rule. No conjugate formula: the engine bare.
 * The likelihood is shown as a density too (the posterior of a flat prior).
 */
function gridPosterior(prior, clicks, sent, level = 0.95) {
  const logLik = GRID.map((x) => (x === 0 ? (clicks === 0 ? 0 : -Infinity) : x === 1 ? (clicks === sent ? 0 : -Infinity) : clicks * Math.log(x) + (sent - clicks) * Math.log1p(-x)));
  const top = Math.max(...logLik);
  const lik = logLik.map((v) => Math.exp(v - top));
  const likArea = gridIntegral(lik);
  const likelihood = lik.map((v) => v / likArea);
  const raw = prior.map((v, i) => v * lik[i]);
  const area = gridIntegral(raw);
  const posterior = area > 0 ? raw.map((v) => v / area) : raw;
  const mean = gridIntegral(posterior.map((v, i) => v * GRID[i]));
  const tail = (1 - level) / 2;
  return { prior, likelihood, posterior, mean, lo: gridQuantile(posterior, tail), hi: gridQuantile(posterior, 1 - tail), clicks, sent };
}

// --- 4.6 Bayes e frequentisti: credibilita' contro confidenza ----------------

/** One day of the campaign: 40 e-mails. */
const COVERAGE_N = 40;
const INTERVAL_METHODS = Object.freeze(['wald', 'wilson', 'clopper', 'jeffreys']);
/** The rates of the coverage curves: 0.005, 0.01, ..., 0.5 (the other half is the mirror image). */
const COVERAGE_PS = Object.freeze(range(100).map((i) => (i + 1) / 200));

/**
 * The 95% interval for a rate after k clicks out of n: Wald (the textbook
 * normal one), Wilson (1927, the inverted score test), Clopper-Pearson
 * (1934, exact by the binomial) and Jeffreys (the credible interval of the
 * prior Beta(1/2, 1/2); the convention of Brown, Cai and DasGupta, 2001,
 * puts its lower end at 0 when k = 0 and its upper end at 1 when k = n).
 */
function interval(method, k, n, level = 0.95) {
  const alpha = 1 - level;
  const z = normalQuantile(1 - alpha / 2);
  const p = k / n;
  if (method === 'wald') {
    const half = z * Math.sqrt((p * (1 - p)) / n);
    return [Math.max(0, p - half), Math.min(1, p + half)];
  }
  if (method === 'wilson') {
    const centre = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
    const half = (z / (1 + (z * z) / n)) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [Math.max(0, centre - half), Math.min(1, centre + half)];
  }
  if (method === 'clopper') return [k === 0 ? 0 : betaQuantile(alpha / 2, k, n - k + 1), k === n ? 1 : betaQuantile(1 - alpha / 2, k + 1, n - k)];
  if (method === 'jeffreys') return [k === 0 ? 0 : betaQuantile(alpha / 2, k + 0.5, n - k + 0.5), k === n ? 1 : betaQuantile(1 - alpha / 2, k + 0.5, n - k + 0.5)];
  return fail(`unknown method ${method}`);
}

/**
 * The exact coverage of every method: the probability, when the true rate
 * is p, that the interval of the observed k contains p, summed over the
 * n + 1 possible k. No simulation: binomial probabilities.
 */
function coverageCurves(n = COVERAGE_N, ps = COVERAGE_PS) {
  const intervals = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, range(n + 1).map((k) => interval(m, k, n))]));
  const curves = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, []]));
  const widths = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, []]));
  for (const p of ps) {
    const pmf = range(n + 1).map((k) => Math.exp(binomialLogPmf(k, n, p)));
    for (const m of INTERVAL_METHODS) {
      let cover = 0;
      let width = 0;
      intervals[m].forEach(([lo, hi], k) => {
        if (lo <= p && p <= hi) cover += pmf[k];
        width += pmf[k] * (hi - lo);
      });
      curves[m].push(cover);
      widths[m].push(width);
    }
  }
  const summary = Object.fromEntries(INTERVAL_METHODS.map((m) => {
    const c = curves[m];
    return [m, { mean: c.reduce((s, v) => s + v, 0) / c.length, min: Math.min(...c), minAt: ps[c.indexOf(Math.min(...c))], width: widths[m].reduce((s, v) => s + v, 0) / c.length }];
  }));
  return { n, ps, intervals, curves, widths, summary };
}

/** The coverage at one rate, exactly, for every method. */
const coverageAt = (p, n = COVERAGE_N) => coverageCurves(n, [p]).curves;

/** The same coverage simulated: `runs` campaigns of n e-mails at the rate p (stream 'coverage', repetition r). */
function coverageSimulation(p, n, runs, seed) {
  const intervals = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, range(n + 1).map((k) => interval(m, k, n))]));
  const hits = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, 0]));
  for (let r = 0; r < runs; r++) {
    const next = generator(seed, 'coverage', r);
    let k = 0;
    for (let i = 0; i < n; i++) k += bernoulli(next, p);
    for (const m of INTERVAL_METHODS) {
      const [lo, hi] = intervals[m][k];
      if (lo <= p && p <= hi) hits[m]++;
    }
  }
  return { p, n, runs, hits };
}
const COVERAGE_RUNS = 20000;

// --- 4.7 Il filtro antispam: naive Bayes sugli SMS -------------------------------

const SMS_DATA = SMS_SOURCE;

/** The words of a message: lowercase runs of letters and digits, and the pound sign on its own; the HTML entities of the file are not words. */
function tokenize(text) {
  return String(text).toLowerCase().replace(/&(lt|gt|amp);/g, ' ').match(/[\p{L}\p{N}]+|£/gu) || [];
}

/** The text of a message as it was written: the three HTML entities of the file decoded. */
const messageText = (text) => String(text).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Whether a record belongs to the test set: 3 in every 10, by position. */
const inTest = (i) => i % 10 < 3;

let smsCache = null;

/**
 * The corpus: every distinct message once (the file repeats 404 lines), in
 * the order of the file, split by position into a training set (7 in 10)
 * and a test set (3 in 10).
 */
function smsCorpus() {
  if (smsCache) return smsCache;
  const seen = new Set();
  const docs = [];
  for (const m of MESSAGES) {
    const text = m.slice(1);
    if (seen.has(text)) continue;
    seen.add(text);
    docs.push({ spam: m[0] === 's', text, tokens: tokenize(text) });
  }
  const train = [];
  const test = [];
  docs.forEach((d, i) => (inTest(i) ? test : train).push(d));
  smsCache = { docs, train, test, lines: MESSAGES.length, repeated: MESSAGES.length - docs.length };
  return smsCache;
}

/**
 * Multinomial naive Bayes with Laplace smoothing (alpha = 1): the counts of
 * every word in the spam and in the legitimate messages of the training set.
 */
function trainNaiveBayes(docs, alpha = 1) {
  const counts = new Map();
  const totals = [0, 0];
  const classes = [0, 0];
  for (const d of docs) {
    const c = d.spam ? 1 : 0;
    classes[c]++;
    for (const t of d.tokens) {
      let entry = counts.get(t);
      if (!entry) {
        entry = [0, 0];
        counts.set(t, entry);
      }
      entry[c]++;
      totals[c]++;
    }
  }
  const V = counts.size;
  const weight = (t) => {
    const e = counts.get(t);
    if (!e) return null;
    return Math.log((e[1] + alpha) / (totals[1] + alpha * V)) - Math.log((e[0] + alpha) / (totals[0] + alpha * V));
  };
  return { counts, totals, classes, V, alpha, priorLogOdds: Math.log(classes[1] / classes[0]), weight };
}

/**
 * The posterior of a message: the prior log-odds of spam plus the weight
 * ln P(word | spam)/P(word | legitimate) of every known word. `priorLogOdds`
 * replaces the base rate of the training set (section 1.7: the same message
 * in another inbox).
 */
function spamScore(model, text, priorLogOdds = model.priorLogOdds) {
  const tokens = typeof text === 'string' ? tokenize(text) : text;
  const words = new Map();
  for (const t of tokens) words.set(t, (words.get(t) || 0) + 1);
  let logOdds = priorLogOdds;
  const parts = [];
  for (const [token, count] of words) {
    const w = model.weight(token);
    if (w !== null) logOdds += count * w;
    parts.push({ token, count, weight: w, known: w !== null });
  }
  return { logOdds, posterior: sigmoid(logOdds), parts, words: tokens.length };
}

/** The area under the ROC curve, as the Mann-Whitney statistic: the probability that a random spam scores above a random legitimate message (ties count one half). */
function rocArea(scores, labels) {
  const order = range(scores.length).sort((i, j) => scores[i] - scores[j]);
  let rank = 0;
  let sumRanks = 0;
  let positives = 0;
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && scores[order[j + 1]] === scores[order[i]]) j++;
    const mid = (i + j) / 2 + 1;
    for (let t = i; t <= j; t++) {
      if (labels[order[t]]) {
        sumRanks += mid;
        positives++;
      }
    }
    rank = j + 1;
    i = j + 1;
  }
  const negatives = rank - positives;
  return (sumRanks - (positives * (positives + 1)) / 2) / (positives * negatives);
}

/** The confusion matrix and its measures, for predictions and true labels (true = the positive class). */
function confusion(predicted, actual) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  predicted.forEach((p, i) => {
    if (p && actual[i]) tp++;
    else if (p) fp++;
    else if (actual[i]) fn++;
    else tn++;
  });
  const n = tp + fp + fn + tn;
  return { tp, fp, fn, tn, n, accuracy: (tp + tn) / n, precision: tp / (tp + fp), recall: tp / (tp + fn), fpr: fp / (fp + tn), f1: (2 * tp) / (2 * tp + fp + fn) };
}

/** The bins of the log-odds of the test messages, for the chart of section 1.7. */
const LOGODDS_BINS = Object.freeze(range(13).map((i) => -30 + 5 * i));

let smsModelCache = null;

/**
 * The filter of section 1.7: trained on the training set, judged on the
 * test set (threshold: posterior 1/2), against the rule that calls every
 * message legitimate; the words that weigh most; the log-odds of the test
 * messages, binned.
 */
function smsModel() {
  if (smsModelCache) return smsModelCache;
  const corpus = smsCorpus();
  const model = trainNaiveBayes(corpus.train);
  const scores = corpus.test.map((d) => spamScore(model, d.tokens).logOdds);
  const actual = corpus.test.map((d) => d.spam);
  const predicted = scores.map((s) => s > 0);
  const matrix = confusion(predicted, actual);
  // McNemar against "everything is legitimate": b = the filter right and the rule wrong, c = the other way round
  let b = 0;
  let c = 0;
  predicted.forEach((p, i) => {
    const filterRight = p === actual[i];
    const ruleRight = !actual[i];
    if (filterRight && !ruleRight) b++;
    if (ruleRight && !filterRight) c++;
  });
  const words = [...model.counts.entries()].filter(([, e]) => e[0] + e[1] >= 10).map(([token, e]) => ({ token, spam: e[1], ham: e[0], weight: model.weight(token) }));
  words.sort((x, y) => y.weight - x.weight || (x.token < y.token ? -1 : 1));
  const bins = LOGODDS_BINS.map((from, i) => ({ from, to: i === LOGODDS_BINS.length - 1 ? Infinity : LOGODDS_BINS[i + 1], spam: 0, ham: 0 }));
  scores.forEach((s, i) => {
    const k = clamp(Math.floor((s - LOGODDS_BINS[0]) / 5), 0, bins.length - 1);
    bins[k][actual[i] ? 'spam' : 'ham']++;
  });
  smsModelCache = {
    corpus,
    model,
    matrix,
    auc: rocArea(scores, actual),
    majority: { accuracy: actual.filter((a) => !a).length / actual.length },
    mcnemar: mcnemarTest(b, c),
    spamWords: words.slice(0, 12),
    hamWords: words.slice(-12).reverse(),
    bins,
    trainSpamShare: model.classes[1] / (model.classes[0] + model.classes[1]),
  };
  return smsModelCache;
}

// --- 4.8 Lo stesso motore su NSL-KDD ---------------------------------------------

const KDD_DATA = KDD_SOURCE;
const KDD_FEATURES = Object.freeze(['protocol', 'service', 'flag']);
const KDD_LEVELS = Object.freeze({ protocol: PROTOCOLS, service: SERVICES, flag: FLAGS });

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let kddCache = null;

/** The records of NSL-KDD: the codes of protocol, service and flag, whether it is an attack, and the bytes sent by the source. */
function kddRecords() {
  if (kddCache) return kddCache;
  const codes = RECORDS.join('');
  const n = codes.length / 4;
  const protocol = new Uint8Array(n);
  const service = new Uint8Array(n);
  const flag = new Uint8Array(n);
  const attack = new Uint8Array(n);
  const normal = LABELS.indexOf('normal');
  for (let i = 0; i < n; i++) {
    protocol[i] = ALPHABET.indexOf(codes[4 * i]);
    service[i] = ALPHABET.indexOf(codes[4 * i + 1]);
    flag[i] = ALPHABET.indexOf(codes[4 * i + 2]);
    attack[i] = ALPHABET.indexOf(codes[4 * i + 3]) === normal ? 0 : 1;
  }
  const bytes = Float64Array.from(SRC_BYTES.join(',').split(','), (s) => parseInt(s, 36));
  if (bytes.length !== n) fail('the bytes and the records of NSL-KDD differ in number');
  kddCache = { n, protocol, service, flag, attack, bytes, columns: { protocol, service, flag } };
  return kddCache;
}

let kddModelCache = null;

/**
 * Categorical naive Bayes on NSL-KDD: from protocol, service and flag, is
 * the connection an attack? Trained on 7 records in 10, judged on the other
 * 3, against the full table of the three columns together (the exact
 * Bayes, with a Beta(1, 1) prior in every cell) and against the rule that
 * calls everything an attack (the larger class).
 */
function kddModel() {
  if (kddModelCache) return kddModelCache;
  const R = kddRecords();
  const sizes = KDD_FEATURES.map((f) => KDD_LEVELS[f].length);
  const counts = KDD_FEATURES.map((_, j) => [new Float64Array(sizes[j]), new Float64Array(sizes[j])]);
  const classes = [0, 0];
  const joint = new Map();
  for (let i = 0; i < R.n; i++) {
    if (inTest(i)) continue;
    const c = R.attack[i];
    classes[c]++;
    KDD_FEATURES.forEach((f, j) => {
      counts[j][c][R.columns[f][i]]++;
    });
    const key = `${R.protocol[i]},${R.service[i]},${R.flag[i]}`;
    const e = joint.get(key) || [0, 0];
    e[c]++;
    joint.set(key, e);
  }
  const priorLogOdds = Math.log(classes[1] / classes[0]);
  const featureWeight = (j, v) => Math.log((counts[j][1][v] + 1) / (classes[1] + sizes[j])) - Math.log((counts[j][0][v] + 1) / (classes[0] + sizes[j]));
  const explain = (p, s, f) => {
    const values = [p, s, f];
    const parts = KDD_FEATURES.map((feature, j) => ({ feature, value: KDD_LEVELS[feature][values[j]], weight: featureWeight(j, values[j]), attacks: counts[j][1][values[j]], normals: counts[j][0][values[j]] }));
    const logOdds = priorLogOdds + parts.reduce((sum, x) => sum + x.weight, 0);
    const e = joint.get(`${p},${s},${f}`) || [0, 0];
    return { parts, logOdds, posterior: sigmoid(logOdds), joint: { attacks: e[1], normals: e[0], posterior: e[0] + e[1] ? (e[1] + 1) / (e[0] + e[1] + 2) : null } };
  };
  const test = range(R.n).filter(inTest);
  const actual = test.map((i) => R.attack[i] === 1);
  const naive = test.map((i) => explain(R.protocol[i], R.service[i], R.flag[i]));
  const predictedNaive = naive.map((x) => x.logOdds > 0);
  const predictedJoint = naive.map((x) => (x.joint.posterior === null ? classes[1] > classes[0] : x.joint.posterior > 0.5));
  const majorityAttack = classes[1] > classes[0];
  let b = 0;
  let c = 0;
  predictedNaive.forEach((p, k) => {
    const nbRight = p === actual[k];
    const ruleRight = majorityAttack === actual[k];
    if (nbRight && !ruleRight) b++;
    if (ruleRight && !nbRight) c++;
  });
  kddModelCache = {
    classes,
    priorLogOdds,
    explain,
    train: R.n - test.length,
    test: test.length,
    naive: confusion(predictedNaive, actual),
    joint: confusion(predictedJoint, actual),
    majority: confusion(test.map(() => majorityAttack), actual),
    auc: rocArea(naive.map((x) => x.logOdds), actual),
    mcnemar: mcnemarTest(b, c),
    cells: joint.size,
    unseen: naive.filter((x) => x.joint.posterior === null).length,
  };
  return kddModelCache;
}

/** The connection that the explanation of section 1.8 shows as the page opens: TCP, private, S0 (a half-open connection, the trace of a SYN flood). */
const KDD_EXAMPLE = Object.freeze({ protocol: 'tcp', service: 'private', flag: 'S0' });

// ---------------------------------------------------------------------------
// 5. Le forme di convergenza
// ---------------------------------------------------------------------------

// --- 5.1 In probabilita': la stima del tasso di falsi allarmi ------------------

/** A rule of the IDS raises a false alarm on 3 benign connections in 100; the estimate after n connections should stay within 1 point. */
const FALSE_ALARMS = Object.freeze({ rate: 0.03, epsilon: 0.01 });
/** The numbers of connections of the tables of Part 2. */
const N_STEPS = Object.freeze([10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]);

/**
 * P(|S_n/n - p| > eps) for S_n ~ Binomial(n, p), exactly: the two tails of
 * the binomial law, S < n(p - eps) and S > n(p + eps).
 */
function deviationExact(n, p, eps) {
  const below = Math.ceil(n * (p - eps) - 1e-9) - 1;
  const above = Math.floor(n * (p + eps) + 1e-9) + 1;
  return (below >= 0 ? binomialCdf(below, n, p) : 0) + (above <= n ? binomialSf(above, n, p) : 0);
}

/** The bounds and the approximation of the same probability: Chebyshev, Hoeffding, and the normal law of the CLT. */
function deviationBounds(n, p, eps) {
  const sd = Math.sqrt((p * (1 - p)) / n);
  return {
    chebyshev: Math.min(1, (p * (1 - p)) / (n * eps * eps)),
    hoeffding: Math.min(1, 2 * Math.exp(-2 * n * eps * eps)),
    normal: 2 * normalSf(eps / sd),
  };
}

/** The table of sections 2.1 and 2.7: n, the exact probability, the two bounds, the normal approximation, the mean square error. */
function deviationTable(p = FALSE_ALARMS.rate, eps = FALSE_ALARMS.epsilon, ns = N_STEPS) {
  return ns.map((n) => ({ n, exact: deviationExact(n, p, eps), ...deviationBounds(n, p, eps), mse: (p * (1 - p)) / n }));
}

// --- 5.2 Quasi certa: le traiettorie ------------------------------------------

/** The paths of section 2.2: 1,000 IDS rules estimated over 10,000 connections each (stream 'paths', repetition = the path). */
const PATHS = Object.freeze({ count: 1000, length: 10000, shown: 20 });
/** The values of n where the paths are recorded: about 60, evenly spaced on a logarithmic axis. */
const PATH_POINTS = Object.freeze([...new Set(range(61).map((i) => Math.round(10 ** ((4 * i) / 60))))]);
/** The checkpoints of the tables of sections 2.2 and 2.3. */
const PATH_CHECKS = Object.freeze([10, 30, 100, 300, 1000, 3000, 10000]);

/**
 * The running means of `count` paths of Bernoulli(rate) values. For every
 * checkpoint n: the share of paths outside the band rate +- eps at n
 * (convergence in probability), the share that leave the band at least
 * once between n and the end (the almost sure criterion, cut at `length`),
 * and the mean square error. The first `shown` paths are kept at PATH_POINTS.
 */
function* pathsSteps(seed, { rate = FALSE_ALARMS.rate, epsilon = FALSE_ALARMS.epsilon, count = PATHS.count, length = PATHS.length, shown = PATHS.shown } = {}) {
  const outside = new Float64Array(PATH_CHECKS.length);
  const after = new Float64Array(PATH_CHECKS.length);
  const square = new Float64Array(PATH_CHECKS.length);
  const kept = [];
  const points = new Set(PATH_POINTS);
  const checks = new Map(PATH_CHECKS.map((n, i) => [n, i]));
  for (let j = 0; j < count; j++) {
    const next = generator(seed, 'paths', j);
    let sum = 0;
    let lastOutside = 0;
    const line = [];
    for (let n = 1; n <= length; n++) {
      sum += bernoulli(next, rate);
      // outside means |S - n p| > n eps, compared on the counts as deviationExact does: a mean exactly on the edge stays inside
      const gap = Math.abs(sum - rate * n);
      const out = gap > epsilon * n + 1e-9;
      if (out) lastOutside = n;
      if (j < shown && points.has(n)) line.push(sum / n);
      const c = checks.get(n);
      if (c !== undefined) {
        if (out) outside[c]++;
        square[c] += (gap / n) ** 2;
      }
    }
    // a path has left the band after n if its last exit came at n or later
    PATH_CHECKS.forEach((n, c) => {
      if (lastOutside >= n) after[c]++;
    });
    if (j < shown) kept.push(line);
    if (j % 25 === 24) yield;
  }
  return {
    rate,
    epsilon,
    count,
    length,
    checks: PATH_CHECKS.map((n, c) => ({ n, outside: outside[c] / count, after: after[c] / count, mse: square[c] / count, exactMse: (rate * (1 - rate)) / n, exactOutside: deviationExact(n, rate, epsilon) })),
    paths: kept,
    points: PATH_POINTS,
  };
}

// --- 5.3 I controesempi che separano le convergenze --------------------------

/**
 * The sequences of "Try it": all converge to 0 in some sense, except the
 * last, whose limit is Z itself.
 *  mean:       the mean of n fair coins, minus 1/2: every kind of convergence;
 *  bern1:      independent Bernoulli(1/n): in probability and in L2, not almost surely;
 *  bern2:      independent Bernoulli(1/n^2): every kind, almost surely by Borel-Cantelli;
 *  typewriter: the indicator of a sliding interval of length 2^-k: in probability and in L2, almost surely nowhere;
 *  spike:      n 1{U < 1/n}: almost surely and in probability, not in L2;
 *  flip:       (-1)^n Z with Z normal: in distribution only.
 */
const SEQUENCES = Object.freeze(['mean', 'bern1', 'bern2', 'typewriter', 'spike', 'flip']);
const SEQUENCE_EPSILON = 0.1;
/** Which modes every sequence has, as the theory says (the numbers of sequenceFacts show them). */
const SEQUENCE_MODES = Object.freeze({
  mean: Object.freeze({ probability: true, as: true, l2: true, distribution: true }),
  bern1: Object.freeze({ probability: true, as: false, l2: true, distribution: true }),
  bern2: Object.freeze({ probability: true, as: true, l2: true, distribution: true }),
  typewriter: Object.freeze({ probability: true, as: false, l2: true, distribution: true }),
  spike: Object.freeze({ probability: true, as: true, l2: false, distribution: true }),
  flip: Object.freeze({ probability: false, as: false, l2: false, distribution: true }),
});

/** The block and the position of n = 2^k + j in the typewriter sequence. */
const typewriterIndex = (n) => {
  const k = Math.floor(Math.log2(n));
  return { k, j: n - 2 ** k };
};

/**
 * The exact numbers of a sequence at n: the probability of a deviation
 * larger than eps, the mean square distance from the limit, the probability
 * of another deviation at some m >= n (the almost sure criterion; 1 means
 * that deviations never stop), and the distance between the laws (for a
 * constant limit, convergence in distribution is convergence in probability).
 */
function sequenceFacts(key, n, eps = SEQUENCE_EPSILON) {
  if (key === 'mean') {
    return { deviation: deviationExact(n, 0.5, eps), l2: 1 / (4 * n), afterwards: null, law: deviationExact(n, 0.5, eps) };
  }
  if (key === 'bern1') return { deviation: 1 / n, l2: 1 / n, afterwards: 1, law: 1 / n };
  if (key === 'bern2') return { deviation: 1 / (n * n), l2: 1 / (n * n), afterwards: n >= 2 ? 1 / n : 1, law: 1 / (n * n) };
  if (key === 'typewriter') {
    const { k } = typewriterIndex(n);
    return { deviation: 2 ** -k, l2: 2 ** -k, afterwards: 1, law: 2 ** -k };
  }
  if (key === 'spike') return { deviation: 1 / n, l2: n, afterwards: 1 / n, law: 1 / n };
  if (key === 'flip') {
    const odd = n % 2 === 1;
    return { deviation: odd ? 2 * normalSf(eps / 2) : 0, l2: odd ? 4 : 0, afterwards: 2 * normalSf(eps / 2), law: 0 };
  }
  return fail(`unknown sequence ${key}`);
}

/** The x values of the paths of "Try it": 1 to 1,000 on a logarithmic axis. */
const SEQUENCE_POINTS = Object.freeze([...new Set(range(46).map((i) => Math.round(10 ** ((3 * i) / 45))))]);
const SEQUENCE_LENGTH = 1000;

/**
 * `count` paths of a sequence, simulated (stream 'sequences', repetition
 * = the path), recorded at SEQUENCE_POINTS; and, for every path, the last n
 * where it was still away from its limit.
 */
function sequencePaths(key, seed, count = 12, length = SEQUENCE_LENGTH) {
  const points = new Set(SEQUENCE_POINTS);
  const paths = [];
  const last = [];
  for (let j = 0; j < count; j++) {
    const next = generator(seed, 'sequences', j);
    const u = uniform53(next);
    const z = normalQuantile(u);
    let sum = 0;
    let away = 0;
    const line = [];
    for (let n = 1; n <= length; n++) {
      let v;
      let off = null;
      if (key === 'mean') {
        sum += bernoulli(next, 0.5);
        v = sum / n - 0.5;
        // on the counts, so that a mean exactly 0.1 away stays inside, as in sequenceFacts
        off = Math.abs(sum - 0.5 * n) > SEQUENCE_EPSILON * n + 1e-9;
      } else if (key === 'bern1') v = bernoulli(next, 1 / n);
      else if (key === 'bern2') v = bernoulli(next, 1 / (n * n));
      else if (key === 'typewriter') {
        const { k, j: pos } = typewriterIndex(n);
        const width = 2 ** -k;
        v = u >= pos * width && u < (pos + 1) * width ? 1 : 0;
      } else if (key === 'spike') v = u < 1 / n ? n : 0;
      else if (key === 'flip') v = n % 2 ? -z : z;
      const limit = key === 'flip' ? z : 0;
      if (off ?? Math.abs(v - limit) > SEQUENCE_EPSILON) away = n;
      if (points.has(n)) line.push(v);
    }
    paths.push(line);
    last.push(away);
  }
  return { key, paths, last, points: SEQUENCE_POINTS };
}

// --- 5.4 Il limite centrale ----------------------------------------------------

/** The laws whose sums section 2.4 and "Try it" standardize. */
const CLT_LAWS = Object.freeze(['bernoulli', 'exponential', 'uniform', 'cauchy']);
const CLT_SIZES = Object.freeze([1, 2, 5, 10, 30, 100, 300, 1000]);
/** Shevtsova's constant (2011) of the Berry-Esseen theorem for independent and identically distributed values. */
const BERRY_ESSEEN_C = 0.4748;

/**
 * Every law with its mean, its standard deviation, the third absolute
 * central moment rho and the ratio rho/sigma^3 of the Berry-Esseen bound,
 * and a sampler from one uniform: a false alarm (Bernoulli 0.03), the time
 * between two alarms (exponential of mean 1), a uniform value, and Cauchy,
 * which has no mean.
 */
function lawFacts(law) {
  const p = FALSE_ALARMS.rate;
  if (law === 'bernoulli') {
    const sd = Math.sqrt(p * (1 - p));
    const rho = p * (1 - p) * (p * p + (1 - p) * (1 - p));
    return { mean: p, sd, rho, ratio: rho / sd ** 3, sample: (u) => (u < p ? 1 : 0) };
  }
  if (law === 'exponential') {
    const rho = 12 / Math.E - 2;
    return { mean: 1, sd: 1, rho, ratio: rho, sample: (u) => -Math.log(u) };
  }
  if (law === 'uniform') {
    const sd = Math.sqrt(1 / 12);
    return { mean: 0.5, sd, rho: 1 / 32, ratio: 1 / 32 / sd ** 3, sample: (u) => u };
  }
  if (law === 'cauchy') return { mean: null, sd: null, rho: null, ratio: null, sample: (u) => Math.tan(Math.PI * (u - 0.5)) };
  return fail(`unknown law ${law}`);
}

/**
 * `reps` sums of n values of a law, standardized: (S_n - n mu)/(sigma
 * sqrt n); for Cauchy the mean S_n/n, which has no mean to subtract.
 * Repetition r draws from stream `stream`, repetition offset + r.
 */
function standardizedSums(law, n, reps, seed, { stream = 'clt', offset = 0 } = {}) {
  const f = lawFacts(law);
  const out = new Float64Array(reps);
  for (let r = 0; r < reps; r++) {
    const next = generator(seed, stream, offset + r);
    let s = 0;
    for (let i = 0; i < n; i++) s += f.sample(uniform53(next));
    out[r] = law === 'cauchy' ? s / n : (s - n * f.mean) / (f.sd * Math.sqrt(n));
  }
  return out;
}

/** A histogram of values on [x0, x1] as densities, with `count` bars; the values outside are left out (their share is returned). */
function histogram(values, x0, x1, count) {
  const width = (x1 - x0) / count;
  const bars = range(count).map((i) => ({ from: x0 + i * width, to: x0 + (i + 1) * width, count: 0, value: 0 }));
  let outside = 0;
  for (const v of values) {
    const k = Math.floor((v - x0) / width);
    if (k < 0 || k >= count) outside++;
    else bars[k].count++;
  }
  for (const b of bars) b.value = b.count / (values.length * width);
  return { bars, outside: outside / values.length };
}

/**
 * The exact Kolmogorov distance between the standardized binomial law and
 * the normal one: the supremum is reached at a jump, on one side or the
 * other of it, so it is enough to look at the n + 1 jumps (only those that
 * carry probability above 10^-17).
 */
function ksExactBernoulli(n, p = FALSE_ALARMS.rate) {
  const mu = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  let D = 0;
  let cdf = 0;
  for (let k = 0; k <= n; k++) {
    const mass = Math.exp(binomialLogPmf(k, n, p));
    const Phi = normalCdf((k - mu) / sd);
    D = Math.max(D, Math.abs(cdf - Phi));
    cdf += mass;
    D = Math.max(D, Math.abs(cdf - Phi));
    if (k > mu && 1 - cdf < 1e-17) break;
  }
  return D;
}

/**
 * The exact Kolmogorov distance between the standardized sum of n
 * exponential values (a Gamma(n, 1) law) and the normal one: the
 * largest gap on a grid of z, refined by golden section around it.
 */
function ksExactExponential(n) {
  const root = Math.sqrt(n);
  const gap = (z) => Math.abs(gammaCdf(n + z * root, n) - normalCdf(z));
  let best = -6;
  let bestGap = 0;
  for (let i = 0; i <= 1200; i++) {
    const z = -6 + i * 0.01;
    const g = gap(z);
    if (g > bestGap) {
      bestGap = g;
      best = z;
    }
  }
  let a = best - 0.01;
  let b = best + 0.01;
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = b - ratio * (b - a);
    const d = a + ratio * (b - a);
    if (gap(c) > gap(d)) b = d;
    else a = c;
  }
  return Math.max(bestGap, gap((a + b) / 2));
}

/** The Berry-Esseen bound C rho/(sigma^3 sqrt n), capped at 1. */
const berryEsseen = (ratio, n) => Math.min(1, (BERRY_ESSEEN_C * ratio) / Math.sqrt(n));

/** The Berry-Esseen ratio rho/sigma^3 of a Bernoulli(p): ((1 - p)^2 + p^2) / sqrt(p (1 - p)). */
const bernoulliRatio = (p) => ((1 - p) ** 2 + p ** 2) / Math.sqrt(p * (1 - p));

/** The table of section 1.4: for every n, the exact distance from the normal law of the two sums (a Bernoulli(p) and an exponential), and their Berry-Esseen bounds. */
function cltTable(ns = CLT_SIZES, p = FALSE_ALARMS.rate) {
  const e = lawFacts('exponential');
  const ratio = p === FALSE_ALARMS.rate ? lawFacts('bernoulli').ratio : bernoulliRatio(p);
  return ns.map((n) => ({ n, bernoulli: ksExactBernoulli(n, p), bernoulliBound: berryEsseen(ratio, n), exponential: ksExactExponential(n), exponentialBound: berryEsseen(e.ratio, n) }));
}

// --- 5.5 Le code pesanti: Cauchy e i byte di NSL-KDD --------------------------

let bytesCache = null;

/** The bytes sent by the source of the 22,544 connections: mean, standard deviation, skewness, the Berry-Esseen ratio, the share of the largest ones. */
function bytesFacts() {
  if (bytesCache) return bytesCache;
  const x = kddRecords().bytes;
  const n = x.length;
  let mean = 0;
  for (const v of x) mean += v / n;
  let m2 = 0;
  let m3 = 0;
  let a3 = 0;
  for (const v of x) {
    const d = v - mean;
    m2 += (d * d) / n;
    m3 += (d * d * d) / n;
    a3 += Math.abs(d * d * d) / n;
  }
  const sd = Math.sqrt(m2);
  const sorted = Float64Array.from(x).sort();
  const total = mean * n;
  const top = (k) => sorted.slice(n - k).reduce((s, v) => s + v, 0) / total;
  let zeros = 0;
  for (const v of x) if (v === 0) zeros++;
  bytesCache = {
    n,
    mean,
    sd,
    skewness: m3 / sd ** 3,
    ratio: a3 / sd ** 3,
    median: (sorted[(n - 1) >> 1] + sorted[n >> 1]) / 2,
    max: sorted[n - 1],
    zeros,
    top10: top(10),
    top1: top(1),
    // how many connections the Berry-Esseen bound needs to promise a distance below 0.05
    needed: Math.ceil(((BERRY_ESSEEN_C * (a3 / sd ** 3)) / 0.05) ** 2),
  };
  return bytesCache;
}

const BYTES_SIZES = Object.freeze([10, 100, 1000]);
const BYTES_REPS = 10000;

/**
 * Samples of n connections drawn with replacement from the 22,544 (stream
 * 'bytes', repetition offset + r): their mean bytes, standardized by the
 * true mean and sd/sqrt n. The CLT promises a normal law; the tails of the
 * data delay it.
 */
function bytesMeans(n, reps, seed, offset = 0) {
  const x = kddRecords().bytes;
  const f = bytesFacts();
  const out = new Float64Array(reps);
  for (let r = 0; r < reps; r++) {
    const next = generator(seed, 'bytes', offset + r);
    let s = 0;
    for (let i = 0; i < n; i++) s += x[uniformInt(next, x.length)];
    out[r] = (s / n - f.mean) / (f.sd / Math.sqrt(n));
  }
  return out;
}

/** The running means of `count` Cauchy paths (stream 'cauchy'), at PATH_POINTS: they never settle. */
function cauchyPaths(seed, count = 8, length = PATHS.length) {
  const points = new Set(PATH_POINTS);
  return range(count).map((j) => {
    const next = generator(seed, 'cauchy', j);
    let s = 0;
    const line = [];
    for (let n = 1; n <= length; n++) {
      s += Math.tan(Math.PI * (uniform53(next) - 0.5));
      if (points.has(n)) line.push(s / n);
    }
    return line;
  });
}

// --- 5.6 Il posterior converge: Bernstein-von Mises ----------------------------

/** The long campaign of section 2.8: up to 10,000 e-mails at the true rate 12%, one stream (stream 'bvm'). */
const BVM = Object.freeze({ rate: CAMPAIGN.rate, length: 10000, checks: Object.freeze([10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]) });

/** The Kolmogorov distance between the Beta(a, b) posterior and the normal law with its mean and standard deviation. */
function betaNormalDistance(a, b) {
  const m = a / (a + b);
  const s = Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
  const gap = (x) => Math.abs(betaCdf(x, a, b) - normalCdf((x - m) / s));
  const lo = Math.max(1e-12, m - 7 * s);
  const hi = Math.min(1 - 1e-12, m + 7 * s);
  let best = lo;
  let bestGap = 0;
  const steps = 700;
  for (let i = 0; i <= steps; i++) {
    const x = lo + ((hi - lo) * i) / steps;
    const g = gap(x);
    if (g > bestGap) {
      bestGap = g;
      best = x;
    }
  }
  const h = (hi - lo) / steps;
  let u = Math.max(lo, best - h);
  let v = Math.min(hi, best + h);
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = v - ratio * (v - u);
    const d = u + ratio * (v - u);
    if (gap(c) > gap(d)) v = d;
    else u = c;
  }
  // the gap at 0 and 1, where a normal law still has mass and the Beta none
  return Math.max(bestGap, gap((u + v) / 2), normalCdf((0 - m) / s), 1 - normalCdf((1 - m) / s));
}

/**
 * The same e-mails seen by two analysts, one with the flat prior and one
 * with the wrong one (Beta(40, 60), mean 40%): at every checkpoint, the
 * posterior mean and standard deviation of each, and the distance of each
 * posterior from its normal approximation. Both forget their prior.
 */
function bvmFacts(seed, { rate = BVM.rate } = {}) {
  const next = generator(seed, 'bvm', 0);
  const checks = new Set(BVM.checks);
  let clicks = 0;
  const rows = [];
  for (let n = 1; n <= BVM.length; n++) {
    clicks += bernoulli(next, rate);
    if (!checks.has(n)) continue;
    const row = { n, clicks, mle: clicks / n, rate };
    for (const key of ['uniform', 'wrong']) {
      const [a0, b0] = PRIORS[key];
      const a = a0 + clicks;
      const b = b0 + n - clicks;
      row[key] = { mean: a / (a + b), sd: Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1))), distance: betaNormalDistance(a, b) };
    }
    rows.push(row);
  }
  return rows;
}

// --- 5.7 Le collisioni di hash: il compleanno ------------------------------------

/** The sizes of the identifiers, in bits. */
const HASH_BITS = Object.freeze([16, 20, 24, 32]);
/** The sizes "Try it" can simulate (32 bits would take millions of draws per trial). */
const HASH_TRY_BITS = Object.freeze([16, 20, 24]);

/** The probability that m random identifiers of `bits` bits are not all different: 1 - prod (1 - i/N), in logarithms. */
function collisionExact(bits, m) {
  const N = 2 ** bits;
  if (m > N) return 1;
  let ln = 0;
  for (let i = 1; i < m; i++) ln += Math.log1p(-i / N);
  return -Math.expm1(ln);
}

/** The smallest number of identifiers with a collision more likely than not, found by bisection. */
function collisionMedian(bits) {
  let lo = 1;
  let hi = Math.ceil(2 * Math.sqrt(2 ** bits)) + 2;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (collisionExact(bits, mid) >= 0.5) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** One trial: m identifiers drawn at random from 2^bits; true if two of them are equal. */
function collisionTrial(next, bits, m) {
  const N = 2 ** bits;
  const seen = new Set();
  for (let i = 0; i < m; i++) {
    const v = uniformInt(next, N);
    if (seen.has(v)) return true;
    seen.add(v);
  }
  return false;
}

/** `trials` trials (stream 'hash', repetitions offset to offset + trials - 1): how many saw a collision. */
function collisionRun(bits, m, trials, seed, offset = 0) {
  let hits = 0;
  for (let t = 0; t < trials; t++) if (collisionTrial(generator(seed, 'hash', offset + t), bits, m)) hits++;
  return hits;
}

/** The trials of the test of the summary: 16-bit identifiers, as many as give a collision one time in two, 20,000 times (as many as the other simulations of the page). */
const HASH_TEST = Object.freeze({ bits: 16, trials: 20000 });

// --- 5.8 La mappa delle implicazioni ---------------------------------------------

/** The four modes, and the arrows that always hold between them. */
const MODES = Object.freeze(['as', 'l2', 'probability', 'distribution']);
const IMPLICATIONS = Object.freeze([
  Object.freeze(['as', 'probability']),
  Object.freeze(['l2', 'probability']),
  Object.freeze(['probability', 'distribution']),
]);

/** Whether mode a implies mode b (directly or through probability), and when it does not, the sequence that shows it. */
function implication(a, b) {
  if (a === b) return { holds: true };
  const direct = (x, y) => IMPLICATIONS.some(([u, v]) => u === x && v === y);
  if (direct(a, b) || (direct(a, 'probability') && direct('probability', b))) return { holds: true };
  const counter = {
    'probability>as': 'bern1',
    'probability>l2': 'spike',
    'l2>as': 'typewriter',
    'as>l2': 'spike',
    'distribution>probability': 'flip',
    'distribution>as': 'flip',
    'distribution>l2': 'flip',
  }[`${a}>${b}`];
  return { holds: false, counter };
}

// --- 5.9 Perche' radice di n: la varianza che si somma ----------------------------

/**
 * The standard error of the share of false alarms after n connections:
 * with independent connections the variances add up, Var(S_n) = n p(1 - p),
 * so the count spreads as sqrt(n) and the share as 1/sqrt(n). For every n:
 * the variance and the standard deviation of the count, the standard error
 * of the share and the half-width of its 95% interval.
 */
function rootTable(p = FALSE_ALARMS.rate, ns = [10, 100, 1000, 10000, 100000]) {
  const z = normalQuantile(0.975);
  return ns.map((n) => {
    const variance = n * p * (1 - p);
    const se = Math.sqrt((p * (1 - p)) / n);
    return { n, variance, sd: Math.sqrt(variance), se, half: z * se };
  });
}

/** The connections needed for a 95% interval of half-width eps: n = z^2 p(1 - p)/eps^2, the square of the precision. */
function sampleSizeFor(eps, p = FALSE_ALARMS.rate, level = 0.95) {
  const z = normalQuantile(1 - (1 - level) / 2);
  return Math.ceil((z * z * p * (1 - p)) / (eps * eps));
}

/** The values of alpha of "Try it: the right scale", the sizes and how many means per size. */
const SCALE_ALPHAS = Object.freeze([0, 0.25, 0.4, 0.5, 0.6, 0.75, 1]);
const SCALE_SIZES = Object.freeze([10, 100, 1000]);
const SCALE_REPS = 2000;

/**
 * Means of n exponential values of mean 1 (the times between two alarms,
 * in minutes), as sqrt(n)(mean - 1), for every size of SCALE_SIZES (stream
 * 'live', repetitions from 3 x 10^6): "Try it" multiplies them by
 * n^(alpha - 1/2) to get n^alpha (mean - 1) for any alpha.
 */
function scaleSamples(seed = DEFAULT_SEED, reps = SCALE_REPS) {
  return SCALE_SIZES.map((n, i) => {
    const out = new Float64Array(reps);
    for (let r = 0; r < reps; r++) {
      const next = generator(seed, 'live', 3000000 + i * reps + r);
      let s = 0;
      for (let k = 0; k < n; k++) s -= Math.log(uniform53(next));
      out[r] = Math.sqrt(n) * (s / n - 1);
    }
    return { n, values: out };
  });
}

// --- 5.10 Senza indipendenza: allarmi a raffica ------------------------------------

/** The correlations between two consecutive connections of "Try it: bursts". */
const BURST_RHOS = Object.freeze([0, 0.25, 0.5, 0.75, 0.9, 0.95]);
/** The correlations of the section, and its size. */
const BURST_SECTION = Object.freeze({ rhos: Object.freeze([0, 0.5, 0.9]), n: 1000, reps: 4000 });

/**
 * False alarms that come in bursts: a two-state Markov chain whose
 * stationary share of alarms is p and whose consecutive values have
 * correlation rho. After an alarm the next one comes with probability
 * p + rho(1 - p), after a quiet connection with probability p(1 - rho).
 */
const burstTransitions = (p, rho) => ({ afterAlarm: p + rho * (1 - p), afterQuiet: p * (1 - rho) });

/**
 * The exact variance of the number of alarms in n connections of the
 * chain: the covariances no longer vanish, and the variances do not just
 * add up: n p(1 - p) [1 + 2 sum_{k=1}^{n-1} (1 - k/n) rho^k].
 */
function burstVariance(n, p, rho) {
  let s = 0;
  let r = 1;
  for (let k = 1; k < n; k++) {
    r *= rho;
    if (r < 1e-18) break;
    s += (1 - k / n) * r;
  }
  return n * p * (1 - p) * (1 + 2 * s);
}

/** The factor by which the variance grows, and the effective number of independent connections: n (1 - rho)/(1 + rho) for large n. */
function burstFacts(n, p, rho) {
  const variance = burstVariance(n, p, rho);
  const factor = variance / (n * p * (1 - p));
  // the naive 95% interval assumes independence: its true coverage, by the normal approximation
  const coverage = 2 * normalCdf(normalQuantile(0.975) / Math.sqrt(factor)) - 1;
  return { n, rho, variance, factor, limit: (1 + rho) / (1 - rho), effective: n / factor, coverage };
}

/**
 * The chain simulated: `reps` windows of n connections (stream 'bursts',
 * repetition offset + r), starting from the stationary share. Returns the
 * mean and the variance of the counts, and how often the naive 95%
 * interval, F +- 1.96 sqrt(F(1 - F)/n), contains p.
 */
function burstSimulation(n, p, rho, reps, seed, offset = 0) {
  const { afterAlarm, afterQuiet } = burstTransitions(p, rho);
  const z = normalQuantile(0.975);
  let sum = 0;
  let sumSq = 0;
  let covered = 0;
  for (let r = 0; r < reps; r++) {
    const next = generator(seed, 'bursts', offset + r);
    let x = bernoulli(next, p);
    let count = x;
    for (let t = 1; t < n; t++) {
      x = bernoulli(next, x ? afterAlarm : afterQuiet);
      count += x;
    }
    sum += count;
    sumSq += count * count;
    const f = count / n;
    const half = z * Math.sqrt((f * (1 - f)) / n);
    if (Math.abs(f - p) <= half) covered++;
  }
  const mean = sum / reps;
  return { n, rho, reps, mean, variance: (sumSq - reps * mean * mean) / (reps - 1), coverage: covered / reps };
}

/** One path of the chain for the picture of "Try it": the alarms of the first `n` connections (stream 'bursts', repetitions from 10^6). */
function burstPath(n, p, rho, seed = DEFAULT_SEED, j = 1000000) {
  const { afterAlarm, afterQuiet } = burstTransitions(p, rho);
  const next = generator(seed, 'bursts', j);
  const out = new Uint8Array(n);
  out[0] = bernoulli(next, p);
  for (let t = 1; t < n; t++) out[t] = bernoulli(next, out[t - 1] ? afterAlarm : afterQuiet);
  return out;
}

// --- 5.11 Altri risultati: Slutsky, metodo delta, Glivenko-Cantelli, MLE ------------

/** The sizes of the tables of section 1.7. */
const RESULT_SIZES = Object.freeze([30, 100, 1000, 10000]);

/**
 * The exact Kolmogorov distance from the normal law of the t statistic
 * T = (F - p)/sqrt(F(1 - F)/n), where the standard deviation is estimated
 * from the data (Slutsky's theorem makes it normal in the limit). T grows
 * with the count k, so its law is the binomial one moved to the points t_k;
 * k = 0 and k = n give T = -infinity and +infinity.
 */
function ksExactT(n, p = FALSE_ALARMS.rate) {
  let D = 0;
  let cdf = 0;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const t = k === 0 ? -Infinity : k === n ? Infinity : (f - p) / Math.sqrt((f * (1 - f)) / n);
    const Phi = t === -Infinity ? 0 : t === Infinity ? 1 : normalCdf(t);
    const mass = Math.exp(binomialLogPmf(k, n, p));
    D = Math.max(D, Math.abs(cdf - Phi));
    cdf += mass;
    D = Math.max(D, Math.abs(cdf - Phi));
    if (k > n * p && 1 - cdf < 1e-17) break;
  }
  return D;
}

/**
 * The delta method on the log-odds g(F) = ln(F/(1 - F)): its standard
 * deviation is about |g'(p)| sqrt(p(1 - p)/n) = 1/sqrt(n p(1 - p)). The exact
 * one is computed on the binomial law, given 0 < k < n (where g is finite),
 * with the probability of k = 0 or n, left out.
 */
function deltaLogOdds(n, p = FALSE_ALARMS.rate) {
  let mass = 0;
  let m1 = 0;
  let m2 = 0;
  for (let k = 1; k < n; k++) {
    const w = Math.exp(binomialLogPmf(k, n, p));
    if (w < 1e-300) continue;
    const g = Math.log(k / (n - k));
    mass += w;
    m1 += w * g;
    m2 += w * g * g;
  }
  const mean = m1 / mass;
  return { n, exact: Math.sqrt(m2 / mass - mean * mean), delta: 1 / Math.sqrt(n * p * (1 - p)), excluded: 1 - mass, bias: mean - Math.log(p / (1 - p)) };
}

/**
 * The maximum likelihood estimate of the rate of alarms from n exponential
 * times between them, lambda_hat = n/S_n. Its law is exact: lambda S_n is
 * Gamma(n, 1), so P(lambda_hat <= x) = P(S_n >= n/x). Returns the exact
 * Kolmogorov distance of sqrt(n)(lambda_hat - lambda)/lambda from the normal
 * law (the asymptotic normality of the MLE, with Fisher's information
 * I = 1/lambda^2), the exact relative bias and the ratio of the exact
 * variance to the Cramer-Rao bound lambda^2/n.
 */
function mleRate(n) {
  const root = Math.sqrt(n);
  const cdf = (z) => (1 + z / root <= 0 ? 0 : 1 - gammaCdf(n / (1 + z / root), n));
  const gap = (z) => Math.abs(cdf(z) - normalCdf(z));
  let best = -6;
  let bestGap = 0;
  for (let i = 0; i <= 1200; i++) {
    const z = -6 + i * 0.01;
    const g = gap(z);
    if (g > bestGap) {
      bestGap = g;
      best = z;
    }
  }
  let a = best - 0.01;
  let b = best + 0.01;
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = b - ratio * (b - a);
    const d = a + ratio * (b - a);
    if (gap(c) > gap(d)) b = d;
    else a = c;
  }
  return {
    n,
    distance: Math.max(bestGap, gap((a + b) / 2)),
    bias: n / (n - 1) - 1,
    // Var(lambda_hat)/(lambda^2/n) = n^3/((n - 1)^2 (n - 2))
    efficiency: n > 2 ? (n * n * n) / ((n - 1) * (n - 1) * (n - 2)) : Infinity,
  };
}

/** The sizes and the samples per size of the Glivenko-Cantelli simulation. */
const GC_SIZES = Object.freeze([10, 100, 1000, 10000]);
const GC_REPS = 400;
/** The mean of Kolmogorov's law: sqrt(pi/2) ln 2. */
const KOLMOGOROV_MEAN = Math.sqrt(Math.PI / 2) * Math.LN2;

/**
 * Glivenko-Cantelli: the empirical distribution function of n exponential
 * values converges uniformly to the true one, almost surely. For every n,
 * `reps` samples (stream 'gc', repetition i x reps + r): the mean of
 * D_n = sup |F_n - F|, the mean of sqrt(n) D_n (Kolmogorov: its law tends to
 * the one of K, whose mean is KOLMOGOROV_MEAN) and its values, for the test.
 */
function glivenkoCantelli(seed, sizes = GC_SIZES, reps = GC_REPS) {
  return sizes.map((n, i) => {
    const scaled = new Float64Array(reps);
    let sumD = 0;
    const x = new Float64Array(n);
    for (let r = 0; r < reps; r++) {
      const next = generator(seed, 'gc', i * reps + r);
      for (let k = 0; k < n; k++) x[k] = -Math.log(uniform53(next));
      x.sort();
      let D = 0;
      for (let k = 0; k < n; k++) {
        const F = -Math.expm1(-x[k]);
        D = Math.max(D, (k + 1) / n - F, F - k / n);
      }
      sumD += D;
      scaled[r] = Math.sqrt(n) * D;
    }
    let sumScaled = 0;
    let over = 0;
    for (const v of scaled) {
      sumScaled += v;
      if (v > 1.3581) over++;
    }
    return { n, meanD: sumD / reps, meanScaled: sumScaled / reps, over: over / reps, scaled };
  });
}

/** The distribution function of Kolmogorov's law. */
const kolmogorovCdf = (x) => 1 - kolmogorovSf(x);

// --- 6.1 La probabilita' condizionata ------------------------------------------------

/**
 * The chain of a phishing attack, stage by stage: the probability of every
 * stage given that the previous ones happened. By the product rule the
 * probability of the whole chain is the product of the conditional ones.
 * Plausible orders of magnitude, not data.
 */
const ATTACK_CHAIN = Object.freeze([
  Object.freeze({ key: 'delivered', p: 0.3 }),
  Object.freeze({ key: 'opened', p: 0.6 }),
  Object.freeze({ key: 'clicked', p: 0.2 }),
  Object.freeze({ key: 'credentials', p: 0.5 }),
  Object.freeze({ key: 'mfa', p: 0.1 }),
]);
const CAMPAIGN_SIZES = Object.freeze([1, 100, 1000]);

/** The chain multiplied out: after every stage, the probability that an e-mail has come that far; and, for a campaign of m e-mails, the probability of at least one breach. */
function attackChain(stages = ATTACK_CHAIN) {
  let cumulative = 1;
  const rows = stages.map((s) => {
    cumulative *= s.p;
    return { ...s, cumulative };
  });
  const breach = cumulative;
  const withoutMfa = breach / stages[stages.length - 1].p;
  return {
    rows,
    breach,
    withoutMfa,
    campaigns: CAMPAIGN_SIZES.map((m) => ({ m, breach: -Math.expm1(m * Math.log1p(-breach)), withoutMfa: -Math.expm1(m * Math.log1p(-withoutMfa)) })),
  };
}

/** P(a and b | evidence) in the network of section 2.4, by enumeration. */
function networkPair(a, b, evidence = {}) {
  let both = 0;
  let total = 0;
  for (let bits = 0; bits < 64; bits++) {
    const s = Object.fromEntries(NETWORK.nodes.map((n, i) => [n, (bits >> i) & 1]));
    if (Object.entries(evidence).some(([n, v]) => v !== null && v !== undefined && s[n] !== (v ? 1 : 0))) continue;
    const p = networkJoint(s);
    total += p;
    if (s[a] && s[b]) both += p;
  }
  return both / total;
}

/**
 * Independence and conditional independence, with the numbers of the
 * network: the two causes are independent a priori and dependent given
 * the EDR alarm; the unusual login and the EDR alarm are dependent, and
 * independent given the phishing.
 */
function independenceFacts() {
  const prior = networkPosterior({});
  const edr = networkPosterior({ edr: true });
  return {
    causes: { phishing: prior.phishing, exploit: prior.exploit, both: networkPair('phishing', 'exploit') },
    causesGivenEdr: { phishing: edr.phishing, exploit: edr.exploit, both: networkPair('phishing', 'exploit', { edr: true }) },
    login: prior.login,
    loginGivenEdr: edr.login,
    loginGivenPhishing: networkPosterior({ phishing: true }).login,
    loginGivenPhishingEdr: networkPosterior({ phishing: true, edr: true }).login,
  };
}

/**
 * A p-value is a conditional probability: of data at least as extreme,
 * given H0. A rule of the IDS is documented with 3% false alarms; on 1,000
 * benign connections it raises 45. H0: the rate is 3%; H1: the rule has
 * drifted to 5%. The p-value P(S >= 45 | H0) against the posterior P(H0 |
 * S = 45) with a prior of 90% on H0 (most rules keep working).
 */
const PVALUE_EXAMPLE = Object.freeze({ n: 1000, k: 45, p0: 0.03, p1: 0.05, priorH0: 0.9 });
function pvalueFacts({ n, k, p0, p1, priorH0 } = PVALUE_EXAMPLE) {
  const pValue = binomialSf(k, n, p0);
  const l0 = binomialLogPmf(k, n, p0);
  const l1 = binomialLogPmf(k, n, p1);
  const lr = Math.exp(l1 - l0);
  const posteriorH0 = 1 / (1 + ((1 - priorH0) / priorH0) * lr);
  return { n, k, p0, p1, priorH0, pValue, likelihood0: Math.exp(l0), likelihood1: Math.exp(l1), lr, posteriorH0, posteriorEven: 1 / (1 + lr) };
}

/**
 * Many tests at once: among the hypotheses tested, a share `real` has a
 * real effect; a test finds a real effect with probability `power` and
 * rejects a true H0 with probability `alpha`. Out of 1,000 tests, the
 * expected counts (true discoveries, missed effects, false discoveries,
 * true H0 kept) and P(H0 | rejected), the false discovery rate.
 */
const DISCOVERY_REALS = Object.freeze([0.01, 0.02, 0.05, 0.1, 0.2, 0.5]);
const DISCOVERY_POWERS = Object.freeze([0.2, 0.5, 0.8, 0.95]);
const DISCOVERY_ALPHAS = Object.freeze([0.05, 0.01, 0.005]);
const DISCOVERY_DEFAULT = Object.freeze({ real: 0.1, power: 0.8, alpha: 0.05 });
const DISCOVERY_TESTS = 1000;
function discoveryFacts({ real, power, alpha } = DISCOVERY_DEFAULT, total = DISCOVERY_TESTS) {
  const expected = [total * real * power, total * real * (1 - power), total * (1 - real) * alpha, total * (1 - real) * (1 - alpha)];
  const rejected = real * power + (1 - real) * alpha;
  return { real, power, alpha, total, expected, counts: roundCounts(expected, total), falseDiscovery: ((1 - real) * alpha) / rejected, pRejected: rejected };
}

// --- 6.2 L'influenza del prior sulle conclusioni ------------------------------------

/** The decision of section 2.10: another training session if P(rate > 10%) exceeds 90%. */
const DECISION_LEVEL = 0.9;
const SENSITIVITY_DATA = Object.freeze([1, 3, 10]);

/** For every prior and every amount of data (the first 1, 3 and 10 days): the posterior mean, its 95% interval, P(rate > 10%) and the decision. */
function priorSensitivity(seed = DEFAULT_SEED) {
  const days = campaign(seed);
  return SENSITIVITY_DATA.map((d) => {
    const chosen = days.slice(0, d);
    const clicks = chosen.reduce((s, x) => s + x.clicks, 0);
    const sent = chosen.reduce((s, x) => s + x.sent, 0);
    return {
      days: d,
      clicks,
      sent,
      priors: Object.fromEntries(PRIOR_KEYS.map((k) => {
        const post = betaPosterior(PRIORS[k], clicks, sent);
        const above = post.above(TARGET_RATE);
        return [k, { mean: post.mean, lo: post.lo, hi: post.hi, above, act: above > DECISION_LEVEL }];
      })),
    };
  });
}

/** The weight of the prior in the posterior mean of a Beta prior: (a + b)/(a + b + n); the posterior mean is w x prior mean + (1 - w) x k/n. */
function priorWeight([a, b], clicks, sent) {
  const w = (a + b) / (a + b + sent);
  return { w, priorMean: a / (a + b), mle: sent ? clicks / sent : null, posteriorMean: (a + clicks) / (a + b + sent) };
}

/** The likelihood of the share of clicks, scaled to a maximum of 1, on the grid: a function of theta, not a density (its area is not 1). */
function likelihoodCurve(clicks, sent) {
  const mle = clicks / sent;
  const at = (x) => {
    if (x <= 0 || x >= 1) return 0;
    let l = 0;
    if (clicks) l += clicks * Math.log(x / mle);
    if (sent - clicks) l += (sent - clicks) * Math.log((1 - x) / (1 - mle));
    return Math.exp(l);
  };
  const values = GRID.map(at);
  const h = 1 / (GRID_SIZE - 1);
  let area = 0;
  for (let i = 1; i < GRID_SIZE; i++) area += (values[i - 1] + values[i]) * h * 0.5;
  return { values, mle, area };
}

// ---------------------------------------------------------------------------
// 6. I calcoli lunghi della pagina, a fette (il worker)
// ---------------------------------------------------------------------------

/** The repetitions of the tests of the central limit theorem. */
const CLT_REPS = 20000;
/** The sizes of the three tests on standardized sums: the exponential at 30 (the rule of thumb), the uniform at 12 (the old recipe for normal values), Cauchy at 100. */
const CLT_TESTS = Object.freeze({ exponential: 30, uniform: 12, cauchy: 100 });

/**
 * The simulations of the page as a generator: it yields between pieces of
 * work, so the page (or the downloadable program, from file://) can run it
 * a few milliseconds at a time, and the worker runs it in one go (explore).
 * Everything here is plain data, and every number is a function of the seed.
 */
function* exploreSteps(params = {}) {
  const { seed } = checkParams(params);
  const started = now();

  // the generator of the page: the mean of 100,000 uniform values against 1/2 (z test, known variance 1/12)
  const sample = 100000;
  const nextMain = generator(seed, 'main', 0);
  let mean = 0;
  let ss = 0;
  for (let k = 1; k <= sample; k++) {
    const u = uniform53(nextMain);
    const delta = u - mean;
    mean += delta / k;
    ss += delta * (u - mean);
    if (k % 25000 === 0) yield;
  }
  const z = (mean - 0.5) / Math.sqrt(1 / 12 / sample);
  const zp = 2 * normalSf(Math.abs(z));
  const generatorTest = { n: sample, mean, variance: ss / (sample - 1), z, p: zp, verdict: zp < SIGNIFICANCE ? 'reject' : 'accept' };

  // 1.4: Wald's test on 10,000 legitimate users and 10,000 attackers, against its exact error rates
  const setup = sprtSetup(SPRT_DEFAULT);
  const exactLegit = sprtExact(setup, SPRT_DEFAULT.p0);
  const exactAttacker = sprtExact(setup, SPRT_DEFAULT.p1);
  const legit = sprtSimulate(setup, SPRT_DEFAULT.p0, SPRT_RUNS, seed, 0);
  yield;
  const attackers = sprtSimulate(setup, SPRT_DEFAULT.p1, SPRT_RUNS, seed, SPRT_RUNS);
  yield;
  const sprt = {
    legit,
    attackers,
    exactLegit: { block: exactLegit.block, clear: exactLegit.clear, mean: exactLegit.mean },
    exactAttacker: { block: exactAttacker.block, clear: exactAttacker.clear, mean: exactAttacker.mean },
    testLegit: binomialTest(legit.block, legit.runs, exactLegit.block),
    testAttacker: binomialTest(attackers.clear, attackers.runs, exactAttacker.clear),
  };

  // 1.6: the coverage of the four intervals at the true rate of the campaign, simulated against the exact one
  const coverageSim = coverageSimulation(CAMPAIGN.rate, COVERAGE_N, COVERAGE_RUNS, seed);
  const coverageExactAt = coverageAt(CAMPAIGN.rate);
  const coverage = {
    ...coverageSim,
    exact: Object.fromEntries(INTERVAL_METHODS.map((m) => [m, coverageExactAt[m][0]])),
    test: binomialTest(coverageSim.hits.jeffreys, coverageSim.runs, coverageExactAt.jeffreys[0]),
  };
  yield;

  // 2.2 and 2.3: 1,000 paths of 10,000 connections
  const paths = yield* pathsSteps(seed);

  // 2.4: the exact distances from the normal law, and three tests on simulated sums
  const cltRows = cltTable();
  yield;
  const expo = standardizedSums('exponential', CLT_TESTS.exponential, CLT_REPS, seed, { offset: 0 });
  yield;
  const unif = standardizedSums('uniform', CLT_TESTS.uniform, CLT_REPS, seed, { offset: CLT_REPS });
  yield;
  const cauchyMeans = standardizedSums('cauchy', CLT_TESTS.cauchy, CLT_REPS, seed, { stream: 'cauchy', offset: 1000 });
  yield;
  const clt = {
    rows: cltRows,
    exponential: { n: CLT_TESTS.exponential, ...ksTest(expo, normalCdf), exact: ksExactExponential(CLT_TESTS.exponential) },
    uniform: { n: CLT_TESTS.uniform, ...ksTest(unif, normalCdf) },
    cauchy: { n: CLT_TESTS.cauchy, ...ksTest(cauchyMeans, cauchyCdf) },
  };

  // 2.6: the mean bytes of 10, 100 and 1,000 connections, and the paths of Cauchy
  const bytes = [];
  for (const [i, n] of BYTES_SIZES.entries()) {
    const values = bytesMeans(n, BYTES_REPS, seed, i * BYTES_REPS);
    const sorted = Float64Array.from(values).sort();
    bytes.push({ n, ...ksTest(values, normalCdf), histogram: histogram(values, -3, 9, 48), below: sorted.filter((v) => v < 0).length / values.length, median: sorted[values.length >> 1] });
    yield;
  }
  const cauchy = cauchyPaths(seed);
  yield;

  // 2.8: the posterior converges
  const bvm = bvmFacts(seed);
  yield;

  // "Try it" of 2.4: 16-bit identifiers, as many as give a collision once in two; 20,000 trials
  const hashM = collisionMedian(HASH_TEST.bits);
  const hashExact = collisionExact(HASH_TEST.bits, hashM);
  const hashHits = collisionRun(HASH_TEST.bits, hashM, HASH_TEST.trials, seed, 0);
  const hash = { bits: HASH_TEST.bits, m: hashM, trials: HASH_TEST.trials, hits: hashHits, exact: hashExact, test: binomialTest(hashHits, HASH_TEST.trials, hashExact) };
  yield;

  // 1.7: Glivenko-Cantelli, and the test of sqrt(n) D_n at n = 1,000 against Kolmogorov's law
  const gcRows = glivenkoCantelli(seed);
  const gcTestRow = gcRows.find((r) => r.n === 1000);
  const gc = { rows: gcRows.map(({ n, meanD, meanScaled, over }) => ({ n, meanD, meanScaled, over })), test: { n: gcTestRow.n, ...ksTest(gcTestRow.scaled, kolmogorovCdf) } };
  yield;

  // 1.9: the bursts, simulated against their exact variance and the coverage of the naive interval
  const bursts = [];
  for (const [i, rho] of BURST_SECTION.rhos.entries()) {
    const sim = burstSimulation(BURST_SECTION.n, FALSE_ALARMS.rate, rho, BURST_SECTION.reps, seed, i * BURST_SECTION.reps);
    bursts.push({ ...sim, exact: burstFacts(BURST_SECTION.n, FALSE_ALARMS.rate, rho) });
    yield;
  }

  return { params: { seed }, generator: generatorTest, sprt, coverage, paths, clt, bytes, cauchy, bvm, hash, gc, bursts, elapsed: now() - started };
}

/** The same computations in one go (the worker). */
function explore(params = {}) {
  const steps = exploreSteps(params);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

// ---------------------------------------------------------------------------
// 8. I grafici: righe, istogrammi, barre impilate e affiancate, la griglia delle frequenze naturali; etichette sotto il puntatore e legende a pulsanti
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = {
  background: '#ffffff',
  text: '#444444',
  grid: '#eeeeee',
  bars: '#5c6bc0',
  reference: '#d52349',
  highlight: '#d52349',
  // the first seven as in the other homework; the others for charts with many parts (the stacked bars of Homework #6 had 11)
  series: ['#5c6bc0', '#d52349', '#2e7d6b', '#f0a500', '#8e24aa', '#00838f', '#777777', '#8d6e63', '#9e9d24', '#ef6c00', '#1e88e5', '#ad1457'],
};

/**
 * Sizes a canvas for drawing at the device's pixel density. `knownWidth`,
 * when given (for example by a ResizeObserver), avoids reading clientWidth,
 * which right after another canvas has been resized would force the browser
 * to lay out the whole page again.
 */
function setupCanvas(canvas, aspect, knownWidth = 0) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const width = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const height = Math.round(width * aspect);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

const chartNumber = (text, decimal) => (decimal === '.' ? text : text.replace('.', decimal));

/** A short number for an axis: 0, 0.05, 1.5, 200, 10000, 1e-4. */
function axisLabel(v, decimal = '.') {
  if (v === 0) return '0';
  const a = Math.abs(v);
  let s;
  if (a >= 1) s = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
  else if (a >= 0.001) s = String(Number(v.toPrecision(2)));
  else s = v.toExponential(0);
  return chartNumber(s, decimal);
}

/** About `count` round values covering [lo, hi], for the ticks of an axis. */
function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / Math.max(1, count - 1);
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = [1, 2, 2.5, 5, 10].map((f) => f * power).find((u) => u >= raw) || 10 * power;
  const ticks = [];
  for (let v = Math.ceil(lo / unit) * unit; v <= hi + unit * 1e-9; v += unit) ticks.push(Math.abs(v) < unit * 1e-9 ? 0 : Number(v.toPrecision(12)));
  return ticks;
}

/** A label under the x axis, centred on its tick but kept inside the canvas: the last tick of a chart often lies on its right edge. */
function xTickLabel(ctx, label, x, y, width) {
  const half = ctx.measureText(label).width / 2;
  ctx.fillText(label, Math.min(Math.max(x, half + 1), width - half - 1), y);
}


const LINE_ASPECT = 0.56;
const LINE_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };
const HIST_ASPECT = 0.56;
const HIST_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };

/** Where the plot of drawLineChart lies on a canvas of this width, and the pixel of every x value; xMin and xMax, when given (a zoomed view), replace the first and last x. */
function lineLayout(data, width) {
  const height = Math.round(width * LINE_ASPECT);
  const margin = LINE_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const x0 = data.xMin ?? data.x[0];
  const x1 = data.xMax ?? data.x[data.x.length - 1];
  const scale = (v) => (data.logX ? (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) : (v - x0) / (x1 - x0));
  const px = (v) => margin.left + w * scale(v);
  return { margin, w, h, height, px, xs: data.x.map(px) };
}

/**
 * Line chart: one line per series over the same x values, on linear or
 * logarithmic axes, each with an optional shaded band (a confidence
 * interval), dashed or dotted (a bound, a theoretical line), with or without
 * dots; null values are skipped. The colours are palette.series in order, or
 * the one of `colorIndex`; the legend is written in the page, under the
 * figure, where it can be read and translated.
 */
function drawLineChart(canvas, { x, series, logX = false, logY = false, xMin = null, xMax = null, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = null, hidden = [], zoomed = false, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, LINE_ASPECT, knownWidth);
  const { margin, w, h, px } = lineLayout({ x, logX, xMin, xMax }, width);
  const ty = (v) => (logY ? Math.log10(v) : v);
  const lo = ty(yMin);
  const hi = ty(yMax);
  // values beyond the axis stay on its edge; in a zoomed view they go on and the plot clips them
  const reach = zoomed ? hi - lo : 0;
  const py = (v) => {
    const t = logY && !(v > 0) ? lo - reach : ty(v);
    return margin.top + h * (1 - (Math.min(hi + reach, Math.max(lo - reach, t)) - lo) / (hi - lo));
  };
  const shown = (v) => v !== null && v !== undefined && !Number.isNaN(v) && (!logY || v > 0);
  const label = yFormat || ((v) => axisLabel(v, decimal));
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'right';
  for (const v of yTicks) {
    ctx.beginPath();
    ctx.moveTo(margin.left, py(v));
    ctx.lineTo(margin.left + w, py(v));
    ctx.stroke();
    ctx.fillText(label(v), margin.left - 4, py(v) + 4);
  }
  ctx.textAlign = 'center';
  for (const v of xTicks) {
    ctx.beginPath();
    ctx.moveTo(px(v), margin.top);
    ctx.lineTo(px(v), margin.top + h);
    ctx.stroke();
    xTickLabel(ctx, axisLabel(v, decimal), px(v), margin.top + h + 15, width);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  series.forEach((s, i) => {
    if (hidden.includes(`series:${i}`)) return;
    const color = pal.series[(s.colorIndex ?? i) % pal.series.length];
    const points = x.map((v, j) => [px(v), s.values[j]]).filter(([, v]) => shown(v));
    if (s.band) {
      const band = x.map((v, j) => [px(v), s.band[j]]).filter(([, b]) => b && !Number.isNaN(b[0]) && !Number.isNaN(b[1]));
      if (band.length > 1) {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = color;
        ctx.beginPath();
        band.forEach(([X, b], j) => (j ? ctx.lineTo(X, py(b[1])) : ctx.moveTo(X, py(b[1]))));
        for (let j = band.length - 1; j >= 0; j--) ctx.lineTo(band[j][0], py(band[j][1][0]));
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (!s.dotsOnly) {
      ctx.strokeStyle = color;
      ctx.lineWidth = s.dashed || s.dotted ? 1.5 : 2;
      ctx.setLineDash(s.dashed ? [5, 4] : s.dotted ? [2, 3] : []);
      ctx.beginPath();
      points.forEach(([X, v], j) => (j ? ctx.lineTo(X, py(v)) : ctx.moveTo(X, py(v))));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (s.dots ?? (s.dotsOnly || (!s.dashed && !s.dotted))) {
      ctx.fillStyle = color;
      for (const [X, v] of points) {
        ctx.beginPath();
        ctx.arc(X, py(v), 2.6, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
  ctx.restore();
}

/** The top of the y axis of drawHistogram: yMax, or 8% above the tallest bar or point of the curve. */
function histTop({ bars, curve = null, yMax = null }) {
  if (yMax !== null && yMax !== undefined) return yMax;
  let top = 1e-12;
  for (const b of bars) top = Math.max(top, b.value);
  if (curve) for (const [, v] of curve) top = Math.max(top, v);
  return top * 1.08;
}

/** Where the plot of drawHistogram lies on a canvas of this width. */
function histLayout(data, width) {
  const height = Math.round(width * HIST_ASPECT);
  const margin = HIST_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const px = (v) => margin.left + (w * (v - data.x0)) / (data.x1 - data.x0);
  return { margin, w, h, height, px };
}

/**
 * Histogram on a continuous axis: the bars [{ from, to, value }] (the
 * simulation, as densities), a curve (`curve`, points [x, y] of a density,
 * such as the normal one) and an optional vertical line at `marker` (the
 * exact value). The legend is in the page; `hidden` lists the parts it
 * hides ('bars', 'curve', 'marker'), which still count for the axis.
 */
function drawHistogram(canvas, { x0, x1, bars, curve = null, marker = null, yMin = 0, yMax = null, yTicks = null, xTicks = [], hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, HIST_ASPECT, knownWidth);
  const { margin, w, h, px } = histLayout({ x0, x1 }, width);
  const top = histTop({ bars, curve, yMax });
  const py = (v) => margin.top + h * (1 - Math.min(1, Math.max(0, (v - yMin) / (top - yMin))));
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  for (const v of xTicks) {
    ctx.beginPath();
    ctx.moveTo(px(v), margin.top);
    ctx.lineTo(px(v), margin.top + h);
    ctx.stroke();
    xTickLabel(ctx, axisLabel(v, decimal), px(v), margin.top + h + 15, width);
  }
  ctx.textAlign = 'right';
  for (const v of yTicks || niceTicks(0, top / 1.08, 3)) {
    ctx.beginPath();
    ctx.moveTo(margin.left, py(v));
    ctx.lineTo(margin.left + w, py(v));
    ctx.stroke();
    ctx.fillText(axisLabel(v, decimal), margin.left - 4, py(v) + 4);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  ctx.fillStyle = pal.series[0];
  ctx.globalAlpha = 0.85;
  for (const b of hidden.includes('bars') ? [] : bars) {
    const left = px(b.from);
    const right = px(b.to);
    const gap = right - left > 4 ? 0.6 : 0;
    ctx.fillRect(left + gap, py(b.value), Math.max(0.8, right - left - 2 * gap), margin.top + h - py(b.value));
  }
  ctx.globalAlpha = 1;
  if (curve && curve.length > 1 && !hidden.includes('curve')) {
    ctx.strokeStyle = pal.series[2];
    ctx.lineWidth = 2;
    ctx.beginPath();
    curve.forEach(([X, v], i) => (i ? ctx.lineTo(px(X), py(v)) : ctx.moveTo(px(X), py(v))));
    ctx.stroke();
  }
  if (marker !== null && !hidden.includes('marker')) {
    ctx.strokeStyle = pal.reference;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(px(marker), margin.top);
    ctx.lineTo(px(marker), margin.top + h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}



const STACK_MARGIN = { left: 96, right: 14, top: 8, bottom: 26 };
const STACK_ROW = 26;
const STACK_GAP = 10;

/** Where the bars of drawStackedBars lie: one row per bar, the shares from 0 to 1 across the plot. */
function stackLayout(data, width) {
  const margin = { ...STACK_MARGIN, left: Math.max(56, Math.min(STACK_MARGIN.left, Math.round(width * 0.24))) };
  const n = data.rows.length;
  const h = n * STACK_ROW + (n - 1) * STACK_GAP + (data.separate ? STACK_GAP : 0);
  const height = margin.top + h + margin.bottom;
  const w = width - margin.left - margin.right;
  const px = (v) => margin.left + w * v;
  const top = (i) => margin.top + i * (STACK_ROW + STACK_GAP) + (data.separate && i === n - 1 ? STACK_GAP : 0);
  return { margin, w, h, height, px, top };
}

/**
 * Bars of conditional shares, one per row, each from 0 to 100%: the row
 * { label, values } has one segment per level (their shares add to 1), in
 * the colours of the palette, so the bars of the levels of X can be
 * compared with each other and with the last one (`separate`: the
 * marginal distribution, set a little apart). `hidden` lists the segments
 * the legend hides ('seg:j'): their place stays empty, the others do not
 * move.
 */
function drawStackedBars(canvas, { rows, separate = false, hidden = [], width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width = knownWidth || canvas.clientWidth || 600;
  const L = stackLayout({ rows, separate }, width);
  const { ctx } = setupCanvas(canvas, L.height / width, width);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, L.height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    ctx.moveTo(L.px(v), L.margin.top);
    ctx.lineTo(L.px(v), L.margin.top + L.h);
    ctx.stroke();
    xTickLabel(ctx, `${Math.round(v * 100)}%`, L.px(v), L.margin.top + L.h + 16, width);
  }
  rows.forEach((row, i) => {
    const y = L.top(i);
    let acc = 0;
    row.values.forEach((v, j) => {
      const share = Number.isFinite(v) ? v : 0;
      if (!hidden.includes(`seg:${j}`) && share > 0) {
        ctx.fillStyle = pal.series[j % pal.series.length];
        ctx.globalAlpha = 0.88;
        ctx.fillRect(L.px(acc), y, Math.max(0.6, L.px(acc + share) - L.px(acc)), STACK_ROW);
        ctx.globalAlpha = 1;
      }
      acc += share;
    });
    ctx.strokeStyle = pal.grid;
    ctx.strokeRect(L.px(0), y, L.w, STACK_ROW);
    ctx.fillStyle = pal.text;
    ctx.textAlign = 'right';
    const label = row.label.length > 16 ? `${row.label.slice(0, 15)}…` : row.label;
    ctx.fillText(label, L.margin.left - 6, y + STACK_ROW / 2 + 4);
  });
}

const GROUP_ASPECT = 0.5;
const GROUP_MARGIN = { left: 48, right: 12, top: 10, bottom: 30 };

/** Where the bars of drawGroupedBars lie: the categories across, one bar per series inside each. */
function groupLayout(data, width) {
  const height = Math.round(width * GROUP_ASPECT);
  const margin = GROUP_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const k = data.categories.length;
  const s = data.series.length;
  const slot = w / k;
  const inner = slot * 0.78;
  const bar = inner / s;
  const x = (cat, ser) => margin.left + cat * slot + (slot - inner) / 2 + ser * bar;
  const yMin = data.yMin || 0;
  const py = (v) => margin.top + h * (1 - Math.min(1, Math.max(0, (v - yMin) / (data.yMax - yMin))));
  return { margin, w, h, height, slot, bar, x, py };
}

/**
 * Bars side by side: for every category (a level, a department) one bar per
 * series ({ values, colorIndex }), from 0 up, on the scale [0, yMax] with
 * the ticks `yTicks` (yFormat writes them). `hidden` lists the series the
 * legend hides ('series:s'): their bars leave an empty place.
 */
function drawGroupedBars(canvas, { categories, series, yMin = 0, yMax, yTicks = [], yFormat = null, hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, GROUP_ASPECT, knownWidth);
  const L = groupLayout({ categories, series, yMin, yMax }, width);
  const label = yFormat || ((v) => axisLabel(v, decimal));
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'right';
  for (const v of yTicks) {
    ctx.beginPath();
    ctx.moveTo(L.margin.left, L.py(v));
    ctx.lineTo(L.margin.left + L.w, L.py(v));
    ctx.stroke();
    ctx.fillText(label(v), L.margin.left - 4, L.py(v) + 4);
  }
  ctx.strokeRect(L.margin.left, L.margin.top, L.w, L.h);
  series.forEach((s, j) => {
    if (hidden.includes(`series:${j}`)) return;
    ctx.fillStyle = pal.series[(s.colorIndex ?? j) % pal.series.length];
    ctx.globalAlpha = s.dim ? 0.45 : 0.88;
    s.values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      const top = L.py(v);
      ctx.fillRect(L.x(i, j) + 0.5, top, Math.max(0.8, L.bar - 1), L.margin.top + L.h - top);
    });
    ctx.globalAlpha = 1;
  });
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  categories.forEach((name, i) => {
    const text = name.length > 12 ? `${name.slice(0, 11)}…` : name;
    xTickLabel(ctx, text, L.margin.left + (i + 0.5) * L.slot, L.margin.top + L.h + 16, width);
  });
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
function chartHeight(draw, data, width) {
  if (draw === drawIconArray) return iconLayout(data, width).height;
  if (draw === drawStrip) return stripLayout(data, width).height;
  if (draw === drawLineChart) return lineLayout(data, width).height;
  if (draw === drawStackedBars) return stackLayout(data, width).height;
  if (draw === drawGroupedBars) return groupLayout(data, width).height;
  return histLayout(data, width).height;
}

/**
 * The ticks of an axis shown from lo to hi: round values on a linear axis,
 * powers of ten on a logarithmic one (1, 2 and 5 times them when the view
 * holds fewer than two powers).
 */
function axisTicks(lo, hi, log = false) {
  if (!log) return niceTicks(lo, hi, 5);
  const inside = (v) => v >= lo * (1 - 1e-9) && v <= hi * (1 + 1e-9);
  const first = Math.floor(Math.log10(lo));
  const last = Math.ceil(Math.log10(hi));
  const powers = [];
  for (let k = first; k <= last; k++) if (inside(10 ** k)) powers.push(10 ** k);
  if (powers.length >= 2) return powers;
  const steps = [];
  for (let k = first; k <= last; k++) for (const f of [1, 2, 5]) if (inside(f * 10 ** k)) steps.push(Number((f * 10 ** k).toPrecision(12)));
  return steps.length >= 2 ? steps : niceTicks(lo, hi, 4);
}

/**
 * Where the plot of a chart lies on a canvas of this width, and the values
 * it shows, for the charts that can be zoomed: { plot: { x, y, w, h } in
 * CSS pixels, x: { min, max, log } or null (categories), y: { min, max,
 * log }, zoom: 'xy' or 'y' }. null for the charts without continuous axes
 * (icon arrays, stacked bars, strips). The interactive charts (chartkit)
 * convert the pointer into values with it.
 */
function chartFrame(draw, data, width) {
  if (draw === drawLineChart) {
    const L = lineLayout(data, width);
    return {
      plot: { x: L.margin.left, y: L.margin.top, w: L.w, h: L.h },
      x: { min: data.xMin ?? data.x[0], max: data.xMax ?? data.x[data.x.length - 1], log: !!data.logX },
      y: { min: data.yMin ?? 0, max: data.yMax ?? 1, log: !!data.logY },
      zoom: 'xy',
    };
  }
  if (draw === drawHistogram) {
    const L = histLayout(data, width);
    return { plot: { x: L.margin.left, y: L.margin.top, w: L.w, h: L.h }, x: { min: data.x0, max: data.x1, log: false }, y: { min: data.yMin || 0, max: histTop(data), log: false }, zoom: 'xy' };
  }
  if (draw === drawGroupedBars) {
    // x counts the categories (0 at the left edge, one per slot): a handle can stand between two of them; only y zooms
    const L = groupLayout(data, width);
    return { plot: { x: L.margin.left, y: L.margin.top, w: L.w, h: L.h }, x: { min: 0, max: data.categories.length, log: false }, y: { min: data.yMin || 0, max: data.yMax, log: false }, zoom: 'y' };
  }
  return null;
}

/**
 * The same data drawn in another view, { x: [lo, hi] or null, y: [lo, hi]
 * or null } in the units of the axes: the range and the ticks of every
 * axis given, the rest unchanged. Charts without continuous axes come back
 * as they are.
 */
function withView(draw, data, view) {
  if (!view || (!view.x && !view.y)) return data;
  if (draw === drawLineChart) {
    const out = { ...data, zoomed: true };
    if (view.x) Object.assign(out, { xMin: view.x[0], xMax: view.x[1], xTicks: axisTicks(view.x[0], view.x[1], data.logX) });
    if (view.y) Object.assign(out, { yMin: view.y[0], yMax: view.y[1], yTicks: axisTicks(view.y[0], view.y[1], data.logY) });
    return out;
  }
  if (draw === drawHistogram) {
    const out = { ...data };
    if (view.x) Object.assign(out, { x0: view.x[0], x1: view.x[1], xTicks: axisTicks(view.x[0], view.x[1]) });
    if (view.y) Object.assign(out, { yMin: view.y[0], yMax: view.y[1], yTicks: axisTicks(view.y[0], view.y[1]) });
    return out;
  }
  if (draw === drawGroupedBars && view.y) return { ...data, yMin: view.y[0], yMax: view.y[1], yTicks: axisTicks(view.y[0], view.y[1]) };
  return data;
}

/**
 * What lies under the point (x, y) of a chart drawn at this width, in CSS
 * pixels from its top left corner; null outside the plot or on a hidden
 * part. For lines, the index of the nearest x; for histograms, the bar; for
 * stacked bars, the segment of a row; for grouped bars, the category (the
 * label lists its bars). `rect` is the rectangle to outline.
 */
function chartHitTest(draw, data, width, x, y) {
  if (draw === drawIconArray) return iconHit(data, width, x, y);
  if (draw === drawStrip) return stripHit(data, width, x, y);
  const off = data.hidden || [];
  if (draw === drawLineChart) {
    const { margin, h, w, xs } = lineLayout(data, width);
    if (x < margin.left - 6 || x > margin.left + w + 6 || y < margin.top || y > margin.top + h) return null;
    // the nearest point among those in the plot (a zoomed view leaves some outside)
    let index = -1;
    xs.forEach((X, i) => {
      if (X < margin.left - 1 || X > margin.left + w + 1) return;
      if (index < 0 || Math.abs(X - x) < Math.abs(xs[index] - x)) index = i;
    });
    if (index < 0) return null;
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawStackedBars) {
    const L = stackLayout(data, width);
    const i = data.rows.findIndex((_, k) => y >= L.top(k) && y <= L.top(k) + STACK_ROW);
    if (i < 0 || x < L.px(0) || x > L.px(1)) return null;
    const v = (x - L.margin.left) / L.w;
    let acc = 0;
    for (let j = 0; j < data.rows[i].values.length; j++) {
      const share = data.rows[i].values[j] || 0;
      if (share > 0 && v >= acc && v <= acc + share) {
        if (off.includes(`seg:${j}`)) return null;
        return { kind: 'segment', index: i, segment: j, rect: { x: L.px(acc), y: L.top(i), width: Math.max(2, L.px(acc + share) - L.px(acc)), height: STACK_ROW } };
      }
      acc += share;
    }
    return null;
  }
  if (draw === drawGroupedBars) {
    const L = groupLayout(data, width);
    if (x < L.margin.left || x > L.margin.left + L.w || y < L.margin.top || y > L.margin.top + L.h) return null;
    if (data.series.every((_, j) => off.includes(`series:${j}`))) return null;
    const index = Math.min(data.categories.length - 1, Math.floor((x - L.margin.left) / L.slot));
    return { kind: 'bar', index, rect: { x: L.margin.left + index * L.slot, y: L.margin.top, width: L.slot, height: L.h } };
  }
  const { margin, w, h, px } = histLayout(data, width);
  if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
  if (off.includes('bars')) return null;
  const index = data.bars.findIndex((b) => x >= px(b.from) && x < px(b.to));
  if (index < 0) return null;
  const b = data.bars[index];
  return { kind: 'bar', index, rect: { x: px(b.from), y: margin.top, width: Math.max(2, px(b.to) - px(b.from)), height: h } };
}

/**
 * The reverse of chartHitTest: what the pointer would hit on the point,
 * the row of stacked bars or the category `index`; null for any other
 * chart or index. A row of a table uses it to outline its part.
 */
function chartHitAt(draw, data, width, index) {
  if (draw === drawIconArray) return iconRegion(data, width, index);
  if (draw === drawLineChart) {
    const { margin, w, h, xs } = lineLayout(data, width);
    if (!(index >= 0 && index < xs.length) || xs[index] < margin.left - 1 || xs[index] > margin.left + w + 1) return null;
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawStackedBars) {
    if (!(index >= 0 && index < data.rows.length)) return null;
    const L = stackLayout(data, width);
    return { kind: 'segment', index, rect: { x: L.px(0), y: L.top(index), width: L.w, height: STACK_ROW } };
  }
  if (draw === drawGroupedBars) {
    if (!(index >= 0 && index < data.categories.length)) return null;
    const L = groupLayout(data, width);
    return { kind: 'bar', index, rect: { x: L.margin.left + index * L.slot, y: L.margin.top, width: L.slot, height: L.h } };
  }
  return null;
}

/**
 * Explains a chart under the pointer: the bar or the point below the
 * mouse, or below the finger after a tap, gets an outline and a label with
 * the text describe(hit), inserted as plain text. Both stay inside the
 * canvas's parent, which must be positioned. `link` ties the chart to a
 * table, as { table() (the element, or null), row(hit) (the index of the
 * row in the body, -1 for none), point(row) (the index of its point) }:
 * the row of the point under the pointer gets the outline too, and a row
 * under the pointer, or tapped, outlines its point. Returns the function
 * that removes them.
 */
const attachChartTooltip = (canvas, { draw, data, describe: explain, link = null }) =>
  attachPointerLabel(
    canvas,
    (x, y, width) => {
      const hit = chartHitTest(draw, data, width, x, y);
      const text = hit && explain(hit);
      return text ? { rect: hit.rect, text, row: link ? link.row(hit) : -1 } : null;
    },
    link && {
      table: link.table,
      locate: (row, width) => {
        const hit = chartHitAt(draw, data, width, link.point(row));
        return hit && hit.rect;
      },
    },
  );

/**
 * The same label for any canvas: locate(x, y, width) says what is under
 * the point, as { rect, text, row? }, or null. With `link`, { table(),
 * locate(row, width) }, the row `row` of the table's body is marked (class
 * is-marked) while its point is under the pointer, and the other way round:
 * locate(row, width) gives the rectangle of a row on the canvas, or null.
 */
function attachPointerLabel(canvas, locate, link = null) {
  const box = canvas.parentElement;
  // where the element lies inside its box: the offsets of an HTML element (a canvas), the
  // difference of the rectangles for the others (an SVG drawing), which have no offsets
  const offset = () => {
    if (typeof canvas.offsetLeft === 'number') return { left: canvas.offsetLeft, top: canvas.offsetTop };
    const a = canvas.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    return { left: a.left - b.left - box.clientLeft, top: a.top - b.top - box.clientTop };
  };
  const mark = document.createElement('div');
  const tip = document.createElement('div');
  mark.className = 'chart-mark';
  tip.className = 'chart-tip';
  // the canvas already has its description; the label only repeats numbers on screen
  mark.setAttribute('aria-hidden', 'true');
  tip.setAttribute('aria-hidden', 'true');
  mark.hidden = true;
  tip.hidden = true;
  box.append(mark, tip);
  canvas.classList.add('has-tip');
  let frame = 0;
  let shown = null;
  // where the pointer is while the label is on screen: refresh() asks again what is under it
  let pointer = null;
  // the marked row of the linked table, and whether the outline on the canvas comes from a row
  let marked = null;
  let fromRow = false;
  // a row marked from the chart and hidden in the scrolling box of its table comes into view,
  // just inside the edge; only the box scrolls, never the page, so the chart stays under the pointer
  const revealRow = (row) => {
    const table = row.closest('table');
    const area = table && table.parentElement;
    if (!area || !/auto|scroll/.test(getComputedStyle(area).overflowY)) return;
    const a = area.getBoundingClientRect();
    // the part of the box on screen, below the header that stays on top
    const top = Math.max(a.top + area.clientTop + (table.tHead ? table.tHead.offsetHeight : 0), 0);
    const bottom = Math.min(a.top + area.clientTop + area.clientHeight, window.innerHeight);
    if (bottom <= top) return;
    const r = row.getBoundingClientRect();
    let by = 0;
    if (r.top < top || r.height > bottom - top) by = r.top - top;
    else if (r.bottom > bottom) by = r.bottom - bottom;
    if (Math.abs(by) < 1) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    area.scrollTo({ top: area.scrollTop + by, behavior: reduced ? 'auto' : 'smooth' });
  };
  const markRow = (index, reveal = false) => {
    const table = link && link.table();
    const row = (table && index >= 0 && table.tBodies[0] && table.tBodies[0].rows[index]) || null;
    if (row === marked) return;
    if (marked) marked.classList.remove('is-marked');
    if (row) row.classList.add('is-marked');
    marked = row;
    if (row && reveal) revealRow(row);
  };
  const hide = () => {
    mark.hidden = true;
    tip.hidden = true;
    shown = null;
    pointer = null;
    fromRow = false;
    markRow(-1);
  };
  const place = (rect) => {
    const at = offset();
    Object.assign(mark.style, {
      left: `${at.left + rect.x}px`,
      top: `${at.top + rect.y}px`,
      width: `${Math.max(2, rect.width)}px`,
      height: `${rect.height}px`,
    });
    mark.classList.toggle('is-thin', rect.width < 6);
    mark.hidden = false;
  };
  const show = (clientX, clientY) => {
    pointer = { clientX, clientY };
    fromRow = false;
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const hit = locate(x, y, r.width);
    if (!hit) {
      mark.hidden = true;
      tip.hidden = true;
      shown = null;
      markRow(-1);
      return;
    }
    const { text } = hit;
    const { left, top } = offset();
    place(hit.rect);
    markRow(hit.row ?? -1, true);
    if (text !== shown) {
      tip.textContent = text;
      shown = text;
    }
    tip.hidden = false;
    // above and to the right of the pointer, flipped near the edges of the figure
    let tx = left + x + 14;
    if (tx + tip.offsetWidth > box.clientWidth) tx = Math.max(0, left + x - tip.offsetWidth - 14);
    let ty = top + y - tip.offsetHeight - 12;
    if (ty < 0) ty = top + y + 18;
    tip.style.left = `${tx}px`;
    tip.style.top = `${ty}px`;
  };
  // the other way round: a row of the linked table under the mouse, or tapped, outlines its point
  const rowAt = (target) => {
    const table = link && link.table();
    const row = table && target instanceof Element ? target.closest('tr') : null;
    return row && row.parentElement.tagName === 'TBODY' && row.parentElement.parentElement === table ? row : null;
  };
  const showRow = (row) => {
    const rect = link.locate(row.sectionRowIndex, canvas.getBoundingClientRect().width);
    tip.hidden = true;
    shown = null;
    pointer = null;
    fromRow = true;
    if (rect) place(rect);
    else mark.hidden = true;
    markRow(rect ? row.sectionRowIndex : -1);
  };
  // while a drag zooms or moves the chart (chartkit), the label waits
  let suspended = false;
  const onMove = (e) => {
    if (e.pointerType === 'touch' || suspended) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => show(clientX, clientY));
  };
  // a finger leaves the canvas as soon as it is lifted: the label stays until a tap elsewhere
  const onLeave = (e) => {
    if (e.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    hide();
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') show(e.clientX, e.clientY);
  };
  const onDocumentDown = (e) => {
    const row = rowAt(e.target);
    if (row) showRow(row);
    else if (e.target !== canvas) hide();
  };
  const onDocumentOver = (e) => {
    if (e.pointerType === 'touch') return;
    const row = rowAt(e.target);
    if (row) showRow(row);
    else if (fromRow) hide();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerdown', onDocumentDown);
  if (link) document.addEventListener('pointerover', onDocumentOver);
  const detach = () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerdown', onDocumentDown);
    document.removeEventListener('pointerover', onDocumentOver);
    markRow(-1);
    canvas.classList.remove('has-tip');
    mark.remove();
    tip.remove();
  };
  // a chart that changes under a still pointer calls it after every frame
  detach.refresh = () => {
    if (pointer && !suspended) show(pointer.clientX, pointer.clientY);
  };
  // a drag on the chart hides the label until it ends
  detach.suspend = (on) => {
    suspended = on;
    if (on) {
      cancelAnimationFrame(frame);
      hide();
    }
  };
  return detach;
}

// ---------------------------------------------------------------------------
// I due disegni nuovi: la griglia delle frequenze naturali e il prior da trascinare
// ---------------------------------------------------------------------------

const ICON_MARGIN = 2;

/** Where the cells of drawIconArray lie: `columns` per row ('auto': 200 on a wide canvas, 100 on a narrow one), square, as wide as the canvas allows. */
function iconLayout(data, width) {
  const columns = data.columns === 'auto' ? (width >= 560 ? 200 : 100) : data.columns || 100;
  const rows = Math.ceil(data.total / columns);
  const cell = (width - 2 * ICON_MARGIN) / columns;
  return { columns, rows, cell, height: Math.round(2 * ICON_MARGIN + rows * cell) };
}

/** The category of every cell, in order: the first counts[0] cells are of the first category, and so on. */
function iconCategories(counts) {
  const ends = [];
  let s = 0;
  for (const c of counts) {
    s += c;
    ends.push(s);
  }
  return ends;
}

/**
 * Natural frequencies as a picture: `total` cells, `columns` per row, one
 * colour per category (counts, in order; `colors` are indices of
 * palette.series, `faint` the categories drawn pale). `hidden` lists the
 * categories the legend hides ('cat:k'): their cells stay empty, the others
 * do not move.
 */
function drawIconArray(canvas, { counts, total, columns = 'auto', colors = [1, 4, 3, 6], faint = [3], hidden = [], width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const L = iconLayout({ total, columns }, width);
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(L.height * dpr);
  canvas.style.height = `${L.height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, L.height);
  const ends = iconCategories(counts);
  const gap = L.cell >= 4 ? 1 : L.cell >= 2.5 ? 0.5 : 0;
  let k = 0;
  for (let i = 0; i < total; i++) {
    while (k < ends.length - 1 && i >= ends[k]) k++;
    if (hidden.includes(`cat:${k}`)) continue;
    const row = Math.floor(i / L.columns);
    const col = i % L.columns;
    ctx.globalAlpha = faint.includes(k) ? 0.28 : 1;
    ctx.fillStyle = pal.series[colors[k] % pal.series.length];
    ctx.fillRect(ICON_MARGIN + col * L.cell, ICON_MARGIN + row * L.cell, Math.max(0.6, L.cell - gap), Math.max(0.6, L.cell - gap));
  }
  ctx.globalAlpha = 1;
}

/** The cell under (x, y) of an icon array, as its category; null on a hidden category or outside. */
function iconHit(data, width, x, y) {
  const L = iconLayout(data, width);
  const col = Math.floor((x - ICON_MARGIN) / L.cell);
  const row = Math.floor((y - ICON_MARGIN) / L.cell);
  if (col < 0 || col >= L.columns || row < 0 || row >= L.rows) return null;
  const i = row * L.columns + col;
  if (i >= data.total) return null;
  const ends = iconCategories(data.counts);
  const index = ends.findIndex((e) => i < e);
  if (index < 0 || (data.hidden || []).includes(`cat:${index}`)) return null;
  return { kind: 'cell', index, rect: { x: ICON_MARGIN + col * L.cell, y: ICON_MARGIN + row * L.cell, width: L.cell, height: L.cell } };
}

/** The rows that the cells of a category span: what a row of the table outlines. */
function iconRegion(data, width, index) {
  const L = iconLayout(data, width);
  const ends = iconCategories(data.counts);
  if (!(index >= 0 && index < ends.length)) return null;
  const first = index === 0 ? 0 : ends[index - 1];
  const last = ends[index] - 1;
  if (last < first) return null;
  const r0 = Math.floor(first / L.columns);
  const r1 = Math.floor(last / L.columns);
  const x0 = r0 === r1 ? ICON_MARGIN + (first % L.columns) * L.cell : ICON_MARGIN;
  const x1 = r0 === r1 ? ICON_MARGIN + ((last % L.columns) + 1) * L.cell : ICON_MARGIN + L.columns * L.cell;
  return { kind: 'cell', index, rect: { x: x0, y: ICON_MARGIN + r0 * L.cell, width: x1 - x0, height: (r1 - r0 + 1) * L.cell } };
}

/** Where the cells of drawStrip lie: perRow square cells per row, filling the width. */
function stripLayout(data, width) {
  const perRow = data.perRow || 50;
  const rows = Math.max(1, Math.ceil(data.cells.length / perRow));
  const size = width / perRow;
  return { perRow, rows, size, height: Math.max(1, Math.round(rows * size)) };
}

/**
 * A strip of events in their order, one square cell each, perRow per row:
 * in the colour of `colorIndex` (palette.series) where the value is 1, in
 * the grid colour where it is 0. "Try it: alarms in bursts" draws the
 * connections, red where there is an alarm.
 */
function drawStrip(canvas, { cells, perRow = 50, colorIndex = 1, width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width0 = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const L = stripLayout({ cells, perRow }, width0);
  const { ctx, width, height } = setupCanvas(canvas, L.height / width0, knownWidth);
  const size = width / L.perRow;
  const gap = Math.max(0.5, size * 0.08);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  for (let k = 0; k < cells.length; k++) {
    ctx.fillStyle = cells[k] ? pal.series[colorIndex % pal.series.length] : pal.grid;
    ctx.fillRect((k % L.perRow) * size + gap, Math.floor(k / L.perRow) * size + gap, size - 2 * gap, size - 2 * gap);
  }
}

/** The cell of drawStrip under the point (x, y). */
function stripHit(data, width, x, y) {
  const L = stripLayout(data, width);
  const col = Math.floor(x / L.size);
  const row = Math.floor(y / L.size);
  const index = row * L.perRow + col;
  if (col < 0 || col >= L.perRow || row < 0 || index >= data.cells.length) return null;
  return { kind: 'cell', index, rect: { x: col * L.size, y: row * L.size, width: L.size, height: L.size } };
}

const EDITOR_ASPECT = 0.42;
const EDITOR_MARGIN = { left: 34, right: 14, top: 14, bottom: 26 };
const HANDLE_RADIUS = 7;

/**
 * The prior that can be drawn: the heights of HANDLES points at x = 0, 0.1,
 * ..., 1, joined by straight lines, dragged up and down with the mouse or a
 * finger, or chosen with the keyboard (arrows left and right pick a handle,
 * up and down move it). onChange(heights) after every change. Returns the
 * controls: setHeights, setPalette, setDecimal, redraw, destroy.
 */
function attachPriorEditor(canvas, { heights: initial, onChange = () => {}, palette: initialPalette = DEFAULT_PALETTE, decimal: initialDecimal = '.', label = (i, h) => `${i}: ${h}` }) {
  let heights = [...initial];
  let palette = { ...DEFAULT_PALETTE, ...initialPalette };
  let decimal = initialDecimal;
  let dragging = -1;
  let selected = 0;
  let focused = false;
  let width = 0;
  const geometry = () => {
    const w = width || canvas.clientWidth || 480;
    const height = Math.round(w * EDITOR_ASPECT);
    const m = EDITOR_MARGIN;
    const pw = w - m.left - m.right;
    const ph = height - m.top - m.bottom;
    return { w, height, px: (x) => m.left + x * pw, py: (h) => m.top + (1 - h) * ph, height1: (y) => clamp(1 - (y - m.top) / ph, 0, 1), m, pw, ph };
  };
  const render = () => {
    const G = geometry();
    const { ctx } = setupCanvas(canvas, EDITOR_ASPECT, G.w);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, G.w, G.height);
    ctx.font = '11px sans-serif';
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.text;
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = i / 5;
      ctx.beginPath();
      ctx.moveTo(G.px(x), G.m.top);
      ctx.lineTo(G.px(x), G.m.top + G.ph);
      ctx.stroke();
      xTickLabel(ctx, axisLabel(x, decimal), G.px(x), G.m.top + G.ph + 16, G.w);
    }
    ctx.strokeRect(G.m.left, G.m.top, G.pw, G.ph);
    // the shape, filled
    const color = palette.series[0];
    ctx.beginPath();
    ctx.moveTo(G.px(0), G.py(0));
    heights.forEach((h, i) => ctx.lineTo(G.px(HANDLE_X[i]), G.py(h)));
    ctx.lineTo(G.px(1), G.py(0));
    ctx.closePath();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    heights.forEach((h, i) => (i ? ctx.lineTo(G.px(HANDLE_X[i]), G.py(h)) : ctx.moveTo(G.px(HANDLE_X[i]), G.py(h))));
    ctx.stroke();
    // the handles; the selected one ringed when the canvas has the focus
    heights.forEach((h, i) => {
      ctx.beginPath();
      ctx.arc(G.px(HANDLE_X[i]), G.py(h), i === dragging ? HANDLE_RADIUS + 2 : HANDLE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = i === dragging ? palette.highlight : color;
      ctx.fill();
      ctx.strokeStyle = palette.background;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (focused && i === selected) {
        ctx.beginPath();
        ctx.arc(G.px(HANDLE_X[i]), G.py(h), HANDLE_RADIUS + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = palette.highlight;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    canvas.setAttribute('aria-valuetext', label(selected, heights[selected]));
  };
  const changed = () => {
    render();
    onChange([...heights]);
  };
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const locate = (x, y) => {
    const G = geometry();
    let best = -1;
    let dist = (HANDLE_RADIUS + 10) ** 2;
    heights.forEach((h, i) => {
      const d = (G.px(HANDLE_X[i]) - x) ** 2 + (G.py(h) - y) ** 2;
      if (d <= dist) {
        dist = d;
        best = i;
      }
    });
    // anywhere in the column of a handle picks it too: easier with a finger
    if (best < 0) {
      const i = Math.round(((x - G.m.left) / G.pw) * (HANDLES - 1));
      if (i >= 0 && i < HANDLES && Math.abs(G.px(HANDLE_X[i]) - x) < 14 && y >= G.m.top - 8 && y <= G.m.top + G.ph + 8) best = i;
    }
    return best;
  };
  const onDown = (e) => {
    const [x, y] = point(e);
    const i = locate(x, y);
    if (i < 0) return;
    dragging = i;
    selected = i;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    heights[i] = geometry().height1(y);
    changed();
  };
  const onMove = (e) => {
    const [x, y] = point(e);
    if (dragging < 0) {
      canvas.style.cursor = locate(x, y) >= 0 ? 'ns-resize' : 'default';
      return;
    }
    const h = geometry().height1(y);
    if (heights[dragging] !== h) {
      heights[dragging] = h;
      changed();
    }
  };
  const onUp = () => {
    if (dragging < 0) return;
    dragging = -1;
    render();
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      selected = clamp(selected + (e.key === 'ArrowLeft' ? -1 : 1), 0, HANDLES - 1);
      render();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      heights[selected] = clamp(Math.round((heights[selected] + (e.key === 'ArrowUp' ? 0.05 : -0.05)) * 100) / 100, 0, 1);
      changed();
    } else return;
    e.preventDefault();
  };
  const onFocus = () => {
    focused = true;
    render();
  };
  const onBlur = () => {
    focused = false;
    render();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('focus', onFocus);
  canvas.addEventListener('blur', onBlur);
  render();
  return {
    setHeights(next) {
      heights = [...next];
      render();
    },
    setPalette(next) {
      palette = { ...DEFAULT_PALETTE, ...next };
      render();
    },
    setDecimal(d) {
      decimal = d;
      render();
    },
    redraw(nextWidth = 0) {
      width = nextWidth;
      render();
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('focus', onFocus);
      canvas.removeEventListener('blur', onBlur);
    },
  };
}

// ---------------------------------------------------------------------------
// 7. Verifiche e riga di comando
// ---------------------------------------------------------------------------

/*
 * Independent checks. The special functions, the exact probabilities and
 * the two filters against an implementation in Python written apart from
 * this file (SciPy 1.17.1, NumPy 2.4 and mpmath 1.4 at 50 digits; Python's
 * fractions for the alarm and the network). The simulations against the
 * same Python code with its own copy of the generators: the same seed must
 * give the same numbers. The generators against their reference C code.
 * A check passes when the strings are equal, or the numbers agree within a
 * relative error of `tol` (10^-9 unless said otherwise).
 */
const words = (values) => values.join(' ');
const sprtSetupDefault = () => sprtSetup(SPRT_DEFAULT);

const CHECK_VECTORS = Object.freeze([
  { group: 'functions', name: 'Φ(-5), the normal distribution function far in the tail (mpmath)', expected: 2.866515718791939e-07, compute: () => normalCdf(-5), tol: 1e-13 },
  { group: 'functions', name: 'Φ(1.96) (mpmath)', expected: 0.9750021048517795, compute: () => normalCdf(1.96), tol: 1e-14 },
  { group: 'functions', name: 'Φ⁻¹(0.975), the normal quantile (mpmath)', expected: 1.9599639845400543, compute: () => normalQuantile(0.975), tol: 1e-14 },
  { group: 'functions', name: 'I_0.12(13, 89), the Beta distribution function (SciPy betainc)', expected: 0.4385072848831475, compute: () => betaCdf(0.12, 13, 89), tol: 1e-12 },
  { group: 'functions', name: 'The 0.025 quantile of Beta(49.5, 351.5) (SciPy beta.ppf)', expected: 0.09311681542258143, compute: () => betaQuantile(0.025, 49.5, 351.5), tol: 1e-11 },
  { group: 'functions', name: 'P(Gamma(30, 1) ≤ 35) (SciPy gammainc)', expected: 0.8229545478999403, compute: () => gammaCdf(35, 30), tol: 1e-12 },
  { group: 'functions', name: 'P(Binomial(1000, 0.03) ≤ 20) (SciPy binom.cdf)', expected: 0.033280784135194114, compute: () => binomialCdf(20, 1000, 0.03), tol: 1e-11 },
  { group: 'functions', name: 'Kolmogorov’s law, P(K > 1) (SciPy kolmogorov)', expected: 0.26999967167735456, compute: () => kolmogorovSf(1), tol: 1e-12 },
  { group: 'functions', name: 'ln Γ(100.5) (mpmath)', expected: 361.4355404677776, compute: () => lnGamma(100.5), tol: 1e-13 },
  { group: 'functions', name: 'Exact binomial test, 7 clicks in 40 against 0.12 (SciPy binomtest)', expected: 0.3240523111458291, compute: () => binomialTest(7, 40, 0.12).p, tol: 1e-11 },

  { group: 'bayes', name: 'P(attack | alarm) with 1%, 95% and 3% (fractions: 95/392)', expected: 0.2423469387755102, compute: () => alarmFacts(ALARM_DEFAULT).posterior, tol: 1e-14 },
  { group: 'bayes', name: 'P(attack | alarm, sandbox alarm) (fractions)', expected: 0.962390781309358, compute: () => evidenceChain(ALARM_DEFAULT.base, [{ ...ALARM_DEFAULT, fired: true }, { ...SECOND_DETECTOR, fired: true }])[1].posterior, tol: 1e-13 },
  { group: 'bayes', name: 'Network: P(phishing | EDR alarm) (fractions, by enumeration)', expected: 0.33285214574340466, compute: () => networkPosterior({ edr: true }).phishing, tol: 1e-13 },
  { group: 'bayes', name: 'Network: P(phishing | EDR alarm, exploit signature)', expected: 0.07021738104501918, compute: () => networkPosterior({ edr: true, signature: true }).phishing, tol: 1e-13 },
  { group: 'bayes', name: 'Network: P(exploit | EDR alarm, exploit signature)', expected: 0.9503084441820995, compute: () => networkPosterior({ edr: true, signature: true }).exploit, tol: 1e-13 },
  { group: 'bayes', name: 'Wald: probability of blocking a legitimate user, exact (Python, the same lattice)', expected: 0.0004159930207001508, compute: () => sprtExact(sprtSetupDefault(), SPRT_DEFAULT.p0).block, tol: 1e-10 },
  { group: 'bayes', name: 'Wald: expected attempts of an attacker, exact', expected: 5.788450405345544, compute: () => sprtExact(sprtSetupDefault(), SPRT_DEFAULT.p1).mean, tol: 1e-10 },
  { group: 'bayes', name: 'Coverage of the Jeffreys interval at p = 0.12, n = 40 (SciPy)', expected: 0.9436787574822046, compute: () => coverageAt(0.12).jeffreys[0], tol: 1e-10 },
  { group: 'bayes', name: 'Smallest coverage of the Wald interval, p from 0.005 to 0.5 (SciPy)', expected: 0.1816304136888073, compute: () => coverageCurves().summary.wald.min, tol: 1e-10 },
  { group: 'bayes', name: 'Attack chain: P(at least one breach) in 1,000 e-mails (fractions)', expected: 0.8349690004435205, compute: () => attackChain().campaigns.find((c) => c.m === 1000).breach, tol: 1e-12 },
  { group: 'bayes', name: 'Network: P(phishing and exploit | EDR alarm) (fractions)', expected: 0.010222635404891075, compute: () => networkPair('phishing', 'exploit', { edr: true }), tol: 1e-12 },
  { group: 'bayes', name: 'p-value of 45 false alarms in 1,000 against 3% (SciPy binom.sf)', expected: 0.005559033343866492, compute: () => pvalueFacts().pValue, tol: 1e-10 },
  { group: 'bayes', name: 'P(H0 | 45 false alarms), prior 90%, H1 = 5% (SciPy binom.pmf)', expected: 0.2904137342271108, compute: () => pvalueFacts().posteriorH0, tol: 1e-10 },
  { group: 'bayes', name: 'Many tests: P(H0 | rejected) with 10% real effects, power 80%, alpha 5% (fractions)', expected: 0.36, compute: () => discoveryFacts().falseDiscovery, tol: 1e-13 },
  { group: 'bayes', name: 'Informed prior after the first day: P(rate > 10%) (SciPy beta.sf)', expected: 0.9334105544171286, compute: () => priorSensitivity()[0].priors.informed.above, tol: 1e-10 },

  { group: 'filters', name: 'SMS: distinct messages, of which spam (Python)', expected: "5170 652", compute: () => words([smsCorpus().docs.length, smsCorpus().docs.filter((d) => d.spam).length]) },
  { group: 'filters', name: 'SMS: vocabulary of the training set', expected: "7214", compute: () => String(smsModel().model.V) },
  { group: 'filters', name: 'SMS: true and false positives, false and true negatives on the test set', expected: "171 5 20 1355", compute: () => { const m = smsModel().matrix; return words([m.tp, m.fp, m.fn, m.tn]); } },
  { group: 'filters', name: 'SMS: area under the ROC curve', expected: 0.9678818909762859, compute: () => smsModel().auc, tol: 1e-12 },
  { group: 'filters', name: 'SMS: P(spam) of a phishing message written for the page', expected: 0.9952701617967173, compute: () => spamScore(smsModel().model, 'Your account has been suspended, verify your password at this link').posterior, tol: 1e-10 },
  { group: 'filters', name: 'NSL-KDD: naive Bayes, TP FP FN TN on the test set (Python)', expected: "3343 110 500 2812", compute: () => { const m = kddModel().naive; return words([m.tp, m.fp, m.fn, m.tn]); } },
  { group: 'filters', name: 'NSL-KDD: the full table, TP FP FN TN', expected: "3461 180 382 2742", compute: () => { const m = kddModel().joint; return words([m.tp, m.fp, m.fn, m.tn]); } },
  { group: 'filters', name: 'NSL-KDD: McNemar against the larger class, b and c', expected: "2812 500", compute: () => words([kddModel().mcnemar.b, kddModel().mcnemar.c]) },

  { group: 'convergence', name: 'P(|F̂ - 0.03| > 0.01) after 1,000 connections, exact (SciPy binom)', expected: 0.05063266843884167, compute: () => deviationExact(1000, 0.03, 0.01), tol: 1e-10 },
  { group: 'convergence', name: 'Kolmogorov distance of 100 false alarms from the normal law (SciPy)', expected: 0.1472492104640194, compute: () => ksExactBernoulli(100), tol: 1e-10 },
  { group: 'convergence', name: 'Kolmogorov distance of 30 exponential values from the normal law (SciPy, minimize)', expected: 0.024291427995467962, compute: () => ksExactExponential(30), tol: 1e-7 },
  { group: 'convergence', name: 'Distance between Beta(13, 89) and its normal approximation (SciPy)', expected: 0.02958472167249593, compute: () => betaNormalDistance(13, 89), tol: 1e-7 },
  { group: 'convergence', name: 'P(collision) among 77,163 identifiers of 32 bits (mpmath)', expected: 0.49999989051734833, compute: () => collisionExact(32, 77163), tol: 1e-10 },
  { group: 'convergence', name: 'Variance of 1,000 bursty connections, rho = 0.5 (Python, the sum of the covariances)', expected: 87.1836, compute: () => burstVariance(1000, 0.03, 0.5), tol: 1e-12 },
  { group: 'convergence', name: 'Kolmogorov distance of the t statistic from the normal law, n = 100 (SciPy)', expected: 0.18224982095487896, compute: () => ksExactT(100), tol: 1e-10 },
  { group: 'convergence', name: 'Exact standard deviation of the log-odds, n = 1,000 (Python)', expected: 0.19010989811321694, compute: () => deltaLogOdds(1000).exact, tol: 1e-10 },
  { group: 'convergence', name: 'Distance of the MLE of an exponential rate from the normal law, n = 30 (SciPy gamma, minimize)', expected: 0.046743254220091734, compute: () => mleRate(30).distance, tol: 1e-7 },
  { group: 'convergence', name: 'Connections for a 95% interval of half a point at 3%', expected: "4472", compute: () => String(sampleSizeFor(0.005)) },
  { group: 'convergence', name: 'Bytes of NSL-KDD: mean, standard deviation, skewness (NumPy, SciPy)', expected: "10395.450231 472775.9451 117.477719", compute: () => { const f = bytesFacts(); return words([f.mean.toFixed(6), f.sd.toFixed(4), f.skewness.toFixed(6)]); } },

  { group: 'simulation', name: 'Phishing campaign, seed 2026: clicks of the ten days (Python, its own generator)', expected: "7 6 6 6 4 7 3 5 2 5", compute: () => words(campaign(DEFAULT_SEED).map((d) => d.clicks)) },
  { group: 'simulation', name: 'Wald, 10,000 users and 10,000 attackers: blocked users, missed attackers, total attempts', expected: "1 40 87941", compute: (s) => words([s.sprt.legit.block, s.sprt.attackers.clear, Math.round(s.sprt.legit.meanSteps * s.sprt.legit.runs + s.sprt.attackers.meanSteps * s.sprt.attackers.runs)]) },
  { group: 'simulation', name: '20,000 campaigns: hits of Wald, Wilson, Clopper-Pearson and Jeffreys', expected: "17415 19062 19582 18911", compute: (s) => words(INTERVAL_METHODS.map((m) => s.coverage.hits[m])) },
  { group: 'simulation', name: '1,000 paths: outside the band at n = 1,000 and after it (NumPy, its own generator)', expected: "0.054 0.136", compute: (s) => { const c = s.paths.checks.find((x) => x.n === 1000); return words([c.outside, c.after]); } },
  { group: 'simulation', name: '20,000 sums of 30 exponential values: Kolmogorov statistic', expected: 0.027414904463515244, compute: (s) => s.clt.exponential.D, tol: 1e-9 },
  { group: 'simulation', name: '10,000 means of 1,000 connections: Kolmogorov statistic', expected: 0.37262639225731886, compute: (s) => s.bytes[2].D, tol: 1e-9 },
  { group: 'simulation', name: '20,000 trials of 16-bit identifiers: collisions', expected: "9992", compute: (s) => String(s.hash.hits) },
  { group: 'simulation', name: 'Long campaign: clicks in 10,000 e-mails', expected: "1214", compute: (s) => String(s.bvm[s.bvm.length - 1].clicks) },
  { group: 'simulation', name: 'Glivenko-Cantelli, 400 samples of 1,000: mean of D_n (NumPy, its own generator)', expected: 0.026751133648986576, compute: (s) => s.gc.rows.find((r) => r.n === 1000).meanD, tol: 1e-9 },
  { group: 'simulation', name: 'Bursts, rho = 0.5, 4,000 windows of 1,000: total alarms and naive intervals that cover', expected: "119603 2832", compute: (s) => { const b = s.bursts.find((x) => x.rho === 0.5); return words([Math.round(b.mean * b.reps), Math.round(b.coverage * b.reps)]); } },

  { group: 'generator', name: 'xoshiro128** from (1, 2, 3, 4)', expected: '11520 0 5927040 70819200 2031721883 1637235492', compute: () => { const g = xoshiro128ss(1, 2, 3, 4); return Array.from({ length: 6 }, g).join(' '); } },
  { group: 'generator', name: 'SplitMix64 from 0', expected: '16294208416658607535 7960286522194355700 487617019471545679', compute: () => { const g = splitMix64(0); return Array.from({ length: 3 }, g).join(' '); } },
  { group: 'generator', name: 'Main stream, seed 2026 (independent Python code)', expected: '1441997221 504457382 1212262897 368519188', compute: () => { const g = generator(2026, 'main', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Box-Muller: the first two normal values, seed 2026 (Python)', expected: '-0.2973509092608619 1.447208380667575', compute: () => { const z = normalSampler(generator(2026, 'main', 0)); return `${z()} ${z()}`; } },
]);

/** The groups of the checks, in the order the page shows them. */
const CHECK_GROUPS = Object.freeze(['functions', 'bayes', 'filters', 'convergence', 'simulation', 'generator']);

/**
 * Every check, with what was expected and what came out. The checks of
 * the simulations read the results of the computations (`results`, from
 * explore with the default seed): without them they wait, pending.
 */
function verifyAll(results = null) {
  return CHECK_VECTORS.map((v) => {
    if (v.group === 'simulation' && v.compute.length > 0 && (!results || results.params.seed !== DEFAULT_SEED)) {
      return { group: v.group, name: v.name, expected: String(v.expected), actual: '', ok: null };
    }
    const actual = v.compute(results);
    const tol = v.tol ?? 1e-9;
    const ok = typeof v.expected === 'string' ? actual === v.expected : Math.abs(actual - v.expected) <= tol * Math.max(1e-300, Math.abs(v.expected));
    return { group: v.group, name: v.name, expected: String(v.expected), actual: String(actual), ok };
  });
}

/**
 * Command line: node homework7.js [--seed 2026 | --random-seed]. Options
 * are checked strictly: anything unknown or malformed prints the usage.
 * The output follows the page: the forms of convergence, then conditional
 * probability and Bayes, then the checks.
 */
function runCli(argv, print = console.log) {
  const usage = () => {
    print(`usage: node homework7.js [--seed ${DEFAULT_SEED} | --random-seed]`);
    return 1;
  };
  let seed = DEFAULT_SEED;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--random-seed') seed = randomSeed();
    else if (arg === '--seed' && value !== undefined && parseInteger(value, LIMITS.seed).ok) {
      seed = parseInteger(value, LIMITS.seed).value;
      i++;
    } else return usage();
  }
  const pct = (v, d = 2) => `${(100 * v).toFixed(d)}%`;
  const p4 = (p) => (p >= 0.001 ? p.toFixed(4) : p.toExponential(2));
  print('Homework #7 - Statistics: the modes of convergence, and conditional probability, Bayes\' theorem and statistical inference');
  print(`Seed ${seed}${seed === DEFAULT_SEED ? ' (the one of the page)' : ''}`);
  const r = explore({ seed });
  print('');
  print('1. THE MODES OF CONVERGENCE');
  print('False-alarm rate 3%, band 1 point: n, exact P(outside), Chebyshev, Hoeffding, normal');
  for (const row of deviationTable().filter((x) => [100, 1000, 10000, 100000].includes(x.n))) print(`  ${String(row.n).padStart(6)} ${p4(row.exact).padStart(10)} ${p4(row.chebyshev).padStart(10)} ${p4(row.hoeffding).padStart(10)} ${p4(row.normal).padStart(10)}`);
  const c1000 = r.paths.checks.find((c) => c.n === 1000);
  print(`1,000 paths: outside the band at n = 1,000: ${pct(c1000.outside, 1)} (exact ${pct(c1000.exactOutside, 1)}); leave it again later: ${pct(c1000.after, 1)}; mean square error ${c1000.mse.toExponential(2)} (exact ${c1000.exactMse.toExponential(2)})`);
  print(`CLT, Kolmogorov distance from the normal law (exact): ${r.clt.rows.filter((x) => [10, 100, 1000].includes(x.n)).map((x) => `n = ${x.n}: Bernoulli ${x.bernoulli.toFixed(4)}, exponential ${x.exponential.toFixed(4)}`).join('; ')}`);
  print(`Birthday: 50% of collisions at ${collisionMedian(32)} identifiers of 32 bits; 16 bits, ${r.hash.m} identifiers: ${r.hash.hits} collisions in ${r.hash.trials} trials (exact ${pct(r.hash.exact)})`);
  print(`Slutsky, the t statistic: distance from the normal law ${RESULT_SIZES.map((n) => `n = ${n}: ${ksExactT(n).toFixed(4)}`).join(', ')}`);
  print(`Delta method, the log-odds: exact sd ${[100, 1000, 10000].map((n) => { const d = deltaLogOdds(n); return `n = ${n}: ${d.exact.toFixed(4)} (delta ${d.delta.toFixed(4)})`; }).join(', ')}`);
  print(`Glivenko-Cantelli: mean of sqrt(n) D_n ${r.gc.rows.map((x) => `n = ${x.n}: ${x.meanScaled.toFixed(3)}`).join(', ')} (limit ${KOLMOGOROV_MEAN.toFixed(3)})`);
  print(`MLE of an exponential rate: distance from the normal law ${[10, 30, 100, 1000].map((n) => `n = ${n}: ${mleRate(n).distance.toFixed(4)}`).join(', ')}`);
  print(`Why sqrt(n): the variance of the count adds up, ${rootTable().map((x) => `n = ${x.n}: sd ${x.sd.toFixed(1)}, standard error ${x.se.toFixed(5)}`).join('; ')}`);
  print(`  for a 95% interval of half a point at 3%: ${sampleSizeFor(0.005)} connections; of a tenth of a point: ${sampleSizeFor(0.001)}`);
  print(`Bursts (4,000 windows of 1,000): ${r.bursts.map((b) => `rho = ${b.rho}: variance ${b.variance.toFixed(1)} (exact ${b.exact.variance.toFixed(1)}, ${b.exact.factor.toFixed(2)} times the independent one), naive interval covers ${pct(b.coverage, 1)}`).join('; ')}`);
  const b = bytesFacts();
  print(`Bytes of NSL-KDD: mean ${b.mean.toFixed(1)}, skewness ${b.skewness.toFixed(1)}; means of 1,000 connections, distance from the normal law ${r.bytes[2].D.toFixed(3)}`);
  print('');
  print('2. CONDITIONAL PROBABILITY, BAYES\' THEOREM AND STATISTICAL INFERENCE');
  const chainFacts = attackChain();
  print(`Attack chain: ${chainFacts.rows.map((x) => `${x.key} ${pct(x.p, 0)}`).join(' x ')} = ${(100 * chainFacts.breach).toFixed(2)}% per e-mail; at least one breach in 1,000 e-mails: ${pct(chainFacts.campaigns[2].breach, 1)}`);
  const pv = pvalueFacts();
  print(`p-value of ${pv.k} false alarms in ${pv.n} against ${pct(pv.p0, 0)}: ${p4(pv.pValue)}; but P(H0 | data) with a prior of ${pct(pv.priorH0, 0)} is ${pct(pv.posteriorH0, 1)}`);
  const fd = discoveryFacts();
  print(`Many tests (${pct(fd.real, 0)} real effects, power ${pct(fd.power, 0)}, alpha ${pct(fd.alpha, 0)}): P(H0 | rejected) = ${pct(fd.falseDiscovery, 1)}`);
  const a = alarmFacts(ALARM_DEFAULT);
  print(`IDS alarm: base rate ${pct(a.base)}, sensitivity ${pct(a.sensitivity)}, false positives ${pct(a.fpr)}: P(attack | alarm) = ${pct(a.posterior)}, P(attack | no alarm) = ${pct(a.posteriorQuiet, 4)}`);
  print(`  in ${a.population} connections: ${a.counts[0]} attacks seen, ${a.counts[1]} missed, ${a.counts[2]} false alarms, ${a.counts[3]} quiet`);
  const chain = evidenceChain(ALARM_DEFAULT.base, [{ ...ALARM_DEFAULT, fired: true }, { ...SECOND_DETECTOR, fired: true }]);
  print(`  a second, independent alarm (sandbox, ${pct(SECOND_DETECTOR.sensitivity, 0)} / ${pct(SECOND_DETECTOR.fpr, 0)}): ${pct(chain[1].posterior)}`);
  print('Bayesian network of the triage (P(phishing), P(exploit), P(compromise)):');
  for (const ev of NETWORK_STEPS) {
    const q = networkPosterior(ev);
    print(`  ${Object.keys(ev).join(' + ') || 'no clue'}: ${pct(q.phishing, 1)}, ${pct(q.exploit, 1)}, ${pct(q.compromise, 1)}`);
  }
  const setup = sprtSetup(SPRT_DEFAULT);
  const exL = sprtExact(setup, SPRT_DEFAULT.p0);
  const exA = sprtExact(setup, SPRT_DEFAULT.p1);
  print(`Wald's test: block at ${setup.upper.toFixed(3)}, clear at ${setup.lower.toFixed(3)}; a failure adds ${setup.fail.toFixed(3)}, a success ${setup.success.toFixed(3)}`);
  print(`  exact: legitimate users blocked ${exL.block.toExponential(3)} (alpha ${SPRT_DEFAULT.alpha}), attackers missed ${exA.clear.toExponential(3)} (beta ${SPRT_DEFAULT.beta}); attempts ${exL.mean.toFixed(2)} and ${exA.mean.toFixed(2)}`);
  print(`  simulated: ${r.sprt.legit.block} of ${r.sprt.legit.runs} users blocked, ${r.sprt.attackers.clear} of ${r.sprt.attackers.runs} attackers cleared`);
  const days = campaign(seed);
  const post = campaignPosteriors(days, PRIORS.uniform);
  const last = post[post.length - 1];
  print(`Phishing campaign: clicks per day ${days.map((d) => d.clicks).join(' ')}; uniform prior -> mean ${pct(last.mean)}, 95% interval ${pct(last.lo)} to ${pct(last.hi)}, P(rate > ${pct(TARGET_RATE, 0)}) = ${pct(last.above(TARGET_RATE), 1)}`);
  print(`  P(rate > ${pct(TARGET_RATE, 0)}) by prior after 1, 3 and 10 days: ${PRIOR_KEYS.map((k) => `${k} ${priorSensitivity(seed).map((x) => pct(x.priors[k].above, 1)).join('/')}`).join(', ')}`);
  const cov = coverageCurves();
  print(`Coverage of the 95% intervals, n = ${COVERAGE_N}, mean and minimum over p: ${INTERVAL_METHODS.map((m) => `${m} ${pct(cov.summary[m].mean, 1)}/${pct(cov.summary[m].min, 1)}`).join(', ')}`);
  const sms = smsModel();
  print(`SMS filter: ${sms.corpus.train.length} messages to learn, ${sms.corpus.test.length} to judge; accuracy ${pct(sms.matrix.accuracy)}, precision ${pct(sms.matrix.precision)}, recall ${pct(sms.matrix.recall)}, AUC ${sms.auc.toFixed(4)}`);
  print(`  heaviest spam words: ${sms.spamWords.slice(0, 8).map((w) => w.token).join(', ')}; heaviest legitimate: ${sms.hamWords.slice(0, 8).map((w) => w.token).join(', ')}`);
  const kdd = kddModel();
  print(`NSL-KDD: naive Bayes accuracy ${pct(kdd.naive.accuracy)}, full table ${pct(kdd.joint.accuracy)}, larger class ${pct(kdd.majority.accuracy)}`);
  const lastBvm = r.bvm[r.bvm.length - 1];
  print(`Posterior after ${lastBvm.n} e-mails: uniform prior ${pct(lastBvm.uniform.mean)}, wrong prior ${pct(lastBvm.wrong.mean)}; distance from the normal law ${lastBvm.uniform.distance.toFixed(4)}`);
  print('');
  const checks = verifyAll(seed === DEFAULT_SEED ? r : null);
  const done = checks.filter((c) => c.ok !== null);
  const failed = done.filter((c) => !c.ok);
  print(`Checks: ${done.length - failed.length} of ${done.length} passed${done.length < checks.length ? ` (${checks.length - done.length} need the seed of the page)` : ''}`);
  for (const c of failed) print(`  FAILED ${c.name}: expected ${c.expected}, got ${c.actual}`);
  print(`(${r.elapsed.toFixed(0)} ms of simulations)`);
  return failed.length ? 1 : 0;
}

return { DEFAULT_SEED, LIMITS, SIGNIFICANCE, parseInteger, checkParams, clamp, lnGamma, lnBeta, lnChoose, incompleteGamma, gammaCdf, betaCdf, betaDensity, betaQuantile, phi, normalCdf, normalSf, normalQuantile, binomialLogPmf, binomialCdf, binomialSf, kolmogorovSf, ksTest, cauchyCdf, binomialTest, binomialLogCdf, mcnemarTest, splitMix64, xoshiro128ss, STREAMS, streamState, generator, uniform53, randomSeed, normalSampler, bernoulli, uniformInt, runStepsAsync, bayes, odds, probabilityOfOdds, sigmoid, ALARM_DEFAULT, SECOND_DETECTOR, POPULATION, ALARM_BASES, ALARM_SENSITIVITIES, ALARM_FPRS, roundCounts, alarmFacts, evidenceChain, NETWORK, CLUES, HIDDEN, compromiseGiven, networkJoint, networkPosterior, NETWORK_STEPS, SPRT_DEFAULT, SPRT_ALPHAS, SPRT_MAX_STEPS, sprtSetup, sprtDecision, sprtPath, sprtExact, sprtSimulate, SPRT_RUNS, CAMPAIGN, PRIORS, PRIOR_KEYS, campaign, betaPosterior, campaignPosteriors, TARGET_RATE, GRID_SIZE, GRID, HANDLES, HANDLE_X, PRIOR_SHAPES, PRIOR_SHAPE_KEYS, priorFromHandles, gridPosterior, COVERAGE_N, INTERVAL_METHODS, COVERAGE_PS, interval, coverageCurves, coverageAt, coverageSimulation, COVERAGE_RUNS, SMS_DATA, tokenize, messageText, inTest, smsCorpus, trainNaiveBayes, spamScore, rocArea, confusion, LOGODDS_BINS, smsModel, KDD_DATA, KDD_FEATURES, KDD_LEVELS, kddRecords, kddModel, KDD_EXAMPLE, FALSE_ALARMS, N_STEPS, deviationExact, deviationBounds, deviationTable, PATHS, PATH_POINTS, PATH_CHECKS, pathsSteps, SEQUENCES, SEQUENCE_EPSILON, SEQUENCE_MODES, sequenceFacts, SEQUENCE_POINTS, SEQUENCE_LENGTH, sequencePaths, CLT_LAWS, CLT_SIZES, BERRY_ESSEEN_C, lawFacts, standardizedSums, histogram, ksExactBernoulli, ksExactExponential, berryEsseen, bernoulliRatio, cltTable, bytesFacts, BYTES_SIZES, BYTES_REPS, bytesMeans, cauchyPaths, BVM, betaNormalDistance, bvmFacts, HASH_BITS, HASH_TRY_BITS, collisionExact, collisionMedian, collisionTrial, collisionRun, HASH_TEST, MODES, IMPLICATIONS, implication, rootTable, sampleSizeFor, SCALE_ALPHAS, SCALE_SIZES, SCALE_REPS, scaleSamples, BURST_RHOS, BURST_SECTION, burstTransitions, burstVariance, burstFacts, burstSimulation, burstPath, RESULT_SIZES, ksExactT, deltaLogOdds, mleRate, GC_SIZES, GC_REPS, KOLMOGOROV_MEAN, glivenkoCantelli, kolmogorovCdf, ATTACK_CHAIN, CAMPAIGN_SIZES, attackChain, networkPair, independenceFacts, PVALUE_EXAMPLE, pvalueFacts, DISCOVERY_REALS, DISCOVERY_POWERS, DISCOVERY_ALPHAS, DISCOVERY_DEFAULT, DISCOVERY_TESTS, discoveryFacts, DECISION_LEVEL, SENSITIVITY_DATA, priorSensitivity, priorWeight, likelihoodCurve, CLT_REPS, CLT_TESTS, exploreSteps, explore, DEFAULT_PALETTE, axisLabel, niceTicks, drawLineChart, drawHistogram, drawStackedBars, drawGroupedBars, chartHeight, axisTicks, chartFrame, withView, chartHitTest, chartHitAt, attachChartTooltip, attachPointerLabel, drawIconArray, drawStrip, attachPriorEditor, CHECK_VECTORS, CHECK_GROUPS, verifyAll, runCli };
})();

// src/pages/statistics/hw7/standalone/cli.js
// La coda del file homework7.js scaricabile: la riga di comando
// node homework7.js [opzioni] e l'uso da altri script. La build la aggiunge
// dopo la libreria cosi' com'e', quindi qui non ci sono import ne' export.
//
// Funziona qualunque sia il nome del file, e in entrambi i modi in cui Node
// puo' caricarlo:
//   - CommonJS (il package.json accanto lo dichiara): require('./homework7.js')
//     restituisce la libreria, e la riga di comando parte solo se il file e'
//     quello eseguito (require.main);
//   - modulo ES (per esempio copiato da solo in un progetto con
//     "type": "module"): la libreria e' globalThis.Homework7, e la riga di
//     comando parte solo se il file e' quello eseguito, cosa che qui si
//     ricava dalla traccia dello stack, l'unico modo che non richiede
//     import.meta (che in uno script classico sarebbe un errore di sintassi).

// Command line: node homework7.js [--seed 2026 | --random-seed] [--sample 100000]
(function () {
  if (typeof window !== 'undefined' || typeof process !== 'object' || !process || !process.versions || !process.versions.node) return;
  const run = () => {
    process.exitCode = Homework7.runCli(process.argv.slice(2), console.log);
  };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = Homework7;
    if (typeof require === 'function' && require.main === module) run();
    return;
  }

  globalThis.Homework7 = Homework7;
  // In un modulo ES require non esiste, e fino a Node 18 manca anche il
  // generatore crittografico globale (crypto): lo si carica qui, in modo
  // asincrono, e la riga di comando parte solo dopo, cosi' anche
  // --random-seed usa il generatore crittografico su ogni versione di Node
  // da 14 in su.
  const ready = globalThis.crypto
    ? Promise.resolve()
    : import('crypto').then((nodeCrypto) => {
      if (!globalThis.crypto) globalThis.crypto = nodeCrypto.webcrypto || { getRandomValues: (bytes) => nodeCrypto.randomFillSync(bytes) };
    });
  // where is this file? the first frame of a fresh stack trace says it
  const frame = (new Error().stack || '').split('\n').find((line) => /^\s+at /.test(line)) || '';
  const location = frame
    .replace(/^\s+at\s+/, '')
    .replace(/^[^(]*\((.*)\)$/, '$1')
    .replace(/:\d+:\d+$/, '');
  const normalize = (path) => {
    let s = String(path);
    if (s.startsWith('file://')) {
      s = decodeURIComponent(s.slice('file://'.length));
      if (/^\/[A-Za-z]:/.test(s)) s = s.slice(1);
    }
    s = s.replace(/\\/g, '/');
    return /^[A-Za-z]:\//.test(s) ? s.toLowerCase() : s;
  };
  const fs = typeof process.getBuiltinModule === 'function' ? process.getBuiltinModule('fs') : null;
  const real = (path) => {
    try {
      return fs ? fs.realpathSync(path) : path;
    } catch {
      return path;
    }
  };
  const entry = process.argv[1] ? normalize(real(process.argv[1])) : '';
  const self = normalize(location);
  if (entry && (entry === self || `${entry}.js` === self)) ready.then(run);
})();
