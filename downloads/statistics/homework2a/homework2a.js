/*
 * Homework #2 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Computations: the toy EC-ElGamal scheme on secp256k1, the Caesar cipher, the corpus and its language models,
 * the statistical attack, the attacks on the private key, statistics and command line (node homework2a.js [options]).
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-2a
 */

var Homework2a = (function () {
'use strict';

var corpus$ = (function () {
'use strict';

// src/pages/statistics/hw2a/corpus.js
// Il corpus della crittanalisi statistica del cifrario di Cesare: Lewis
// Carroll, Alice's Adventures in Wonderland (1865), di pubblico dominio,
// nella Millennium Fulcrum Edition 3.0 trascritta da Project Gutenberg
// (eBook #11). Una stringa per paragrafo, capitolo per capitolo. Le sole
// modifiche: via i trattini bassi che segnano il corsivo, la lineetta lunga
// scritta "-" come in tutto il sito, e tolte le due note fra parentesi
// quadre aggiunte dall'edizione ("later editions continued as follows").
// Il programma ricontrolla l'impronta all'avvio: se un solo carattere
// fosse diverso, rifiuterebbe di partire.

/** SHA-256 of the chapters as "CHAPTER n. title" and one paragraph per line, joined by newlines, with a final newline. */
const CORPUS_SHA256 = 'cb4e2d90da25ce8268bf99e7b02aa6cfe20695cd2be8faaf5b6e7adba795ac5d';

/** The twelve chapters: number, title and paragraphs. */
const CHAPTERS = [
  {
    number: 'I',
    title: "Down the Rabbit-Hole",
    paragraphs: [
      "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”",
      "So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
      "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, “Oh dear! Oh dear! I shall be late!” (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.",
      "In another moment down went Alice after it, never once considering how in the world she was to get out again.",
      "The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.",
      "Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled “ORANGE MARMALADE”, but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.",
      "“Well!” thought Alice to herself, “after such a fall as this, I shall think nothing of tumbling down stairs! How brave they’ll all think me at home! Why, I wouldn’t say anything about it, even if I fell off the top of the house!” (Which was very likely true.)",
      "Down, down, down. Would the fall never come to an end? “I wonder how many miles I’ve fallen by this time?” she said aloud. “I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think-” (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) “-yes, that’s about the right distance-but then I wonder what Latitude or Longitude I’ve got to?” (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)",
      "Presently she began again. “I wonder if I shall fall right through the earth! How funny it’ll seem to come out among the people that walk with their heads downward! The Antipathies, I think-” (she was rather glad there was no one listening, this time, as it didn’t sound at all the right word) “-but I shall have to ask them what the name of the country is, you know. Please, Ma’am, is this New Zealand or Australia?” (and she tried to curtsey as she spoke-fancy curtseying as you’re falling through the air! Do you think you could manage it?) “And what an ignorant little girl she’ll think me for asking! No, it’ll never do to ask: perhaps I shall see it written up somewhere.”",
      "Down, down, down. There was nothing else to do, so Alice soon began talking again. “Dinah’ll miss me very much to-night, I should think!” (Dinah was the cat.) “I hope they’ll remember her saucer of milk at tea-time. Dinah my dear! I wish you were down here with me! There are no mice in the air, I’m afraid, but you might catch a bat, and that’s very like a mouse, you know. But do cats eat bats, I wonder?” And here Alice began to get rather sleepy, and went on saying to herself, in a dreamy sort of way, “Do cats eat bats? Do cats eat bats?” and sometimes, “Do bats eat cats?” for, you see, as she couldn’t answer either question, it didn’t much matter which way she put it. She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, and saying to her very earnestly, “Now, Dinah, tell me the truth: did you ever eat a bat?” when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over.",
      "Alice was not a bit hurt, and she jumped up on to her feet in a moment: she looked up, but it was all dark overhead; before her was another long passage, and the White Rabbit was still in sight, hurrying down it. There was not a moment to be lost: away went Alice like the wind, and was just in time to hear it say, as it turned a corner, “Oh my ears and whiskers, how late it’s getting!” She was close behind it when she turned the corner, but the Rabbit was no longer to be seen: she found herself in a long, low hall, which was lit up by a row of lamps hanging from the roof.",
      "There were doors all round the hall, but they were all locked; and when Alice had been all the way down one side and up the other, trying every door, she walked sadly down the middle, wondering how she was ever to get out again.",
      "Suddenly she came upon a little three-legged table, all made of solid glass; there was nothing on it except a tiny golden key, and Alice’s first thought was that it might belong to one of the doors of the hall; but, alas! either the locks were too large, or the key was too small, but at any rate it would not open any of them. However, on the second time round, she came upon a low curtain she had not noticed before, and behind it was a little door about fifteen inches high: she tried the little golden key in the lock, and to her great delight it fitted!",
      "Alice opened the door and found that it led into a small passage, not much larger than a rat-hole: she knelt down and looked along the passage into the loveliest garden you ever saw. How she longed to get out of that dark hall, and wander about among those beds of bright flowers and those cool fountains, but she could not even get her head through the doorway; “and even if my head would go through,” thought poor Alice, “it would be of very little use without my shoulders. Oh, how I wish I could shut up like a telescope! I think I could, if I only knew how to begin.” For, you see, so many out-of-the-way things had happened lately, that Alice had begun to think that very few things indeed were really impossible.",
      "There seemed to be no use in waiting by the little door, so she went back to the table, half hoping she might find another key on it, or at any rate a book of rules for shutting people up like telescopes: this time she found a little bottle on it, (“which certainly was not here before,” said Alice,) and round the neck of the bottle was a paper label, with the words “DRINK ME,” beautifully printed on it in large letters.",
      "It was all very well to say “Drink me,” but the wise little Alice was not going to do that in a hurry. “No, I’ll look first,” she said, “and see whether it’s marked ‘poison’ or not”; for she had read several nice little histories about children who had got burnt, and eaten up by wild beasts and other unpleasant things, all because they would not remember the simple rules their friends had taught them: such as, that a red-hot poker will burn you if you hold it too long; and that if you cut your finger very deeply with a knife, it usually bleeds; and she had never forgotten that, if you drink much from a bottle marked “poison,” it is almost certain to disagree with you, sooner or later.",
      "However, this bottle was not marked “poison,” so Alice ventured to taste it, and finding it very nice, (it had, in fact, a sort of mixed flavour of cherry-tart, custard, pine-apple, roast turkey, toffee, and hot buttered toast,) she very soon finished it off.",
      "“What a curious feeling!” said Alice; “I must be shutting up like a telescope.”",
      "And so it was indeed: she was now only ten inches high, and her face brightened up at the thought that she was now the right size for going through the little door into that lovely garden. First, however, she waited for a few minutes to see if she was going to shrink any further: she felt a little nervous about this; “for it might end, you know,” said Alice to herself, “in my going out altogether, like a candle. I wonder what I should be like then?” And she tried to fancy what the flame of a candle is like after the candle is blown out, for she could not remember ever having seen such a thing.",
      "After a while, finding that nothing more happened, she decided on going into the garden at once; but, alas for poor Alice! when she got to the door, she found she had forgotten the little golden key, and when she went back to the table for it, she found she could not possibly reach it: she could see it quite plainly through the glass, and she tried her best to climb up one of the legs of the table, but it was too slippery; and when she had tired herself out with trying, the poor little thing sat down and cried.",
      "“Come, there’s no use in crying like that!” said Alice to herself, rather sharply; “I advise you to leave off this minute!” She generally gave herself very good advice, (though she very seldom followed it), and sometimes she scolded herself so severely as to bring tears into her eyes; and once she remembered trying to box her own ears for having cheated herself in a game of croquet she was playing against herself, for this curious child was very fond of pretending to be two people. “But it’s no use now,” thought poor Alice, “to pretend to be two people! Why, there’s hardly enough of me left to make one respectable person!”",
      "Soon her eye fell on a little glass box that was lying under the table: she opened it, and found in it a very small cake, on which the words “EAT ME” were beautifully marked in currants. “Well, I’ll eat it,” said Alice, “and if it makes me grow larger, I can reach the key; and if it makes me grow smaller, I can creep under the door; so either way I’ll get into the garden, and I don’t care which happens!”",
      "She ate a little bit, and said anxiously to herself, “Which way? Which way?”, holding her hand on the top of her head to feel which way it was growing, and she was quite surprised to find that she remained the same size: to be sure, this generally happens when one eats cake, but Alice had got so much into the way of expecting nothing but out-of-the-way things to happen, that it seemed quite dull and stupid for life to go on in the common way.",
      "So she set to work, and very soon finished off the cake.",
    ],
  },
  {
    number: 'II',
    title: "The Pool of Tears",
    paragraphs: [
      "“Curiouser and curiouser!” cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); “now I’m opening out like the largest telescope that ever was! Good-bye, feet!” (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off). “Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I’m sure I shan’t be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can;-but I must be kind to them,” thought Alice, “or perhaps they won’t walk the way I want to go! Let me see: I’ll give them a new pair of boots every Christmas.”",
      "And she went on planning to herself how she would manage it. “They must go by the carrier,” she thought; “and how funny it’ll seem, sending presents to one’s own feet! And how odd the directions will look!",
      "Alice’s Right Foot, Esq., Hearthrug, near the Fender, (with Alice’s love).",
      "Oh dear, what nonsense I’m talking!”",
      "Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.",
      "Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.",
      "“You ought to be ashamed of yourself,” said Alice, “a great girl like you,” (she might well say this), “to go on crying in this way! Stop this moment, I tell you!” But she went on all the same, shedding gallons of tears, until there was a large pool all round her, about four inches deep and reaching half down the hall.",
      "After a time she heard a little pattering of feet in the distance, and she hastily dried her eyes to see what was coming. It was the White Rabbit returning, splendidly dressed, with a pair of white kid gloves in one hand and a large fan in the other: he came trotting along in a great hurry, muttering to himself as he came, “Oh! the Duchess, the Duchess! Oh! won’t she be savage if I’ve kept her waiting!” Alice felt so desperate that she was ready to ask help of any one; so, when the Rabbit came near her, she began, in a low, timid voice, “If you please, sir-” The Rabbit started violently, dropped the white kid gloves and the fan, and skurried away into the darkness as hard as he could go.",
      "Alice took up the fan and gloves, and, as the hall was very hot, she kept fanning herself all the time she went on talking: “Dear, dear! How queer everything is to-day! And yesterday things went on just as usual. I wonder if I’ve been changed in the night? Let me think: was I the same when I got up this morning? I almost think I can remember feeling a little different. But if I’m not the same, the next question is, Who in the world am I? Ah, that’s the great puzzle!” And she began thinking over all the children she knew that were of the same age as herself, to see if she could have been changed for any of them.",
      "“I’m sure I’m not Ada,” she said, “for her hair goes in such long ringlets, and mine doesn’t go in ringlets at all; and I’m sure I can’t be Mabel, for I know all sorts of things, and she, oh! she knows such a very little! Besides, she’s she, and I’m I, and-oh dear, how puzzling it all is! I’ll try if I know all the things I used to know. Let me see: four times five is twelve, and four times six is thirteen, and four times seven is-oh dear! I shall never get to twenty at that rate! However, the Multiplication Table doesn’t signify: let’s try Geography. London is the capital of Paris, and Paris is the capital of Rome, and Rome-no, that’s all wrong, I’m certain! I must have been changed for Mabel! I’ll try and say ‘How doth the little-’” and she crossed her hands on her lap as if she were saying lessons, and began to repeat it, but her voice sounded hoarse and strange, and the words did not come the same as they used to do:-",
      "“How doth the little crocodile Improve his shining tail, And pour the waters of the Nile On every golden scale!",
      "“How cheerfully he seems to grin, How neatly spread his claws, And welcome little fishes in With gently smiling jaws!”",
      "“I’m sure those are not the right words,” said poor Alice, and her eyes filled with tears again as she went on, “I must be Mabel after all, and I shall have to go and live in that poky little house, and have next to no toys to play with, and oh! ever so many lessons to learn! No, I’ve made up my mind about it; if I’m Mabel, I’ll stay down here! It’ll be no use their putting their heads down and saying ‘Come up again, dear!’ I shall only look up and say ‘Who am I then? Tell me that first, and then, if I like being that person, I’ll come up: if not, I’ll stay down here till I’m somebody else’-but, oh dear!” cried Alice, with a sudden burst of tears, “I do wish they would put their heads down! I am so very tired of being all alone here!”",
      "As she said this she looked down at her hands, and was surprised to see that she had put on one of the Rabbit’s little white kid gloves while she was talking. “How can I have done that?” she thought. “I must be growing small again.” She got up and went to the table to measure herself by it, and found that, as nearly as she could guess, she was now about two feet high, and was going on shrinking rapidly: she soon found out that the cause of this was the fan she was holding, and she dropped it hastily, just in time to avoid shrinking away altogether.",
      "“That was a narrow escape!” said Alice, a good deal frightened at the sudden change, but very glad to find herself still in existence; “and now for the garden!” and she ran with all speed back to the little door: but, alas! the little door was shut again, and the little golden key was lying on the glass table as before, “and things are worse than ever,” thought the poor child, “for I never was so small as this before, never! And I declare it’s too bad, that it is!”",
      "As she said these words her foot slipped, and in another moment, splash! she was up to her chin in salt water. Her first idea was that she had somehow fallen into the sea, “and in that case I can go back by railway,” she said to herself. (Alice had been to the seaside once in her life, and had come to the general conclusion, that wherever you go to on the English coast you find a number of bathing machines in the sea, some children digging in the sand with wooden spades, then a row of lodging houses, and behind them a railway station.) However, she soon made out that she was in the pool of tears which she had wept when she was nine feet high.",
      "“I wish I hadn’t cried so much!” said Alice, as she swam about, trying to find her way out. “I shall be punished for it now, I suppose, by being drowned in my own tears! That will be a queer thing, to be sure! However, everything is queer to-day.”",
      "Just then she heard something splashing about in the pool a little way off, and she swam nearer to make out what it was: at first she thought it must be a walrus or hippopotamus, but then she remembered how small she was now, and she soon made out that it was only a mouse that had slipped in like herself.",
      "“Would it be of any use, now,” thought Alice, “to speak to this mouse? Everything is so out-of-the-way down here, that I should think very likely it can talk: at any rate, there’s no harm in trying.” So she began: “O Mouse, do you know the way out of this pool? I am very tired of swimming about here, O Mouse!” (Alice thought this must be the right way of speaking to a mouse: she had never done such a thing before, but she remembered having seen in her brother’s Latin Grammar, “A mouse-of a mouse-to a mouse-a mouse-O mouse!”) The Mouse looked at her rather inquisitively, and seemed to her to wink with one of its little eyes, but it said nothing.",
      "“Perhaps it doesn’t understand English,” thought Alice; “I daresay it’s a French mouse, come over with William the Conqueror.” (For, with all her knowledge of history, Alice had no very clear notion how long ago anything had happened.) So she began again: “Où est ma chatte?” which was the first sentence in her French lesson-book. The Mouse gave a sudden leap out of the water, and seemed to quiver all over with fright. “Oh, I beg your pardon!” cried Alice hastily, afraid that she had hurt the poor animal’s feelings. “I quite forgot you didn’t like cats.”",
      "“Not like cats!” cried the Mouse, in a shrill, passionate voice. “Would you like cats if you were me?”",
      "“Well, perhaps not,” said Alice in a soothing tone: “don’t be angry about it. And yet I wish I could show you our cat Dinah: I think you’d take a fancy to cats if you could only see her. She is such a dear quiet thing,” Alice went on, half to herself, as she swam lazily about in the pool, “and she sits purring so nicely by the fire, licking her paws and washing her face-and she is such a nice soft thing to nurse-and she’s such a capital one for catching mice-oh, I beg your pardon!” cried Alice again, for this time the Mouse was bristling all over, and she felt certain it must be really offended. “We won’t talk about her any more if you’d rather not.”",
      "“We indeed!” cried the Mouse, who was trembling down to the end of his tail. “As if I would talk on such a subject! Our family always hated cats: nasty, low, vulgar things! Don’t let me hear the name again!”",
      "“I won’t indeed!” said Alice, in a great hurry to change the subject of conversation. “Are you-are you fond-of-of dogs?” The Mouse did not answer, so Alice went on eagerly: “There is such a nice little dog near our house I should like to show you! A little bright-eyed terrier, you know, with oh, such long curly brown hair! And it’ll fetch things when you throw them, and it’ll sit up and beg for its dinner, and all sorts of things-I can’t remember half of them-and it belongs to a farmer, you know, and he says it’s so useful, it’s worth a hundred pounds! He says it kills all the rats and-oh dear!” cried Alice in a sorrowful tone, “I’m afraid I’ve offended it again!” For the Mouse was swimming away from her as hard as it could go, and making quite a commotion in the pool as it went.",
      "So she called softly after it, “Mouse dear! Do come back again, and we won’t talk about cats or dogs either, if you don’t like them!” When the Mouse heard this, it turned round and swam slowly back to her: its face was quite pale (with passion, Alice thought), and it said in a low trembling voice, “Let us get to the shore, and then I’ll tell you my history, and you’ll understand why it is I hate cats and dogs.”",
      "It was high time to go, for the pool was getting quite crowded with the birds and animals that had fallen into it: there were a Duck and a Dodo, a Lory and an Eaglet, and several other curious creatures. Alice led the way, and the whole party swam to the shore.",
    ],
  },
  {
    number: 'III',
    title: "A Caucus-Race and a Long Tale",
    paragraphs: [
      "They were indeed a queer-looking party that assembled on the bank-the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.",
      "The first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life. Indeed, she had quite a long argument with the Lory, who at last turned sulky, and would only say, “I am older than you, and must know better;” and this Alice would not allow without knowing how old it was, and, as the Lory positively refused to tell its age, there was no more to be said.",
      "At last the Mouse, who seemed to be a person of authority among them, called out, “Sit down, all of you, and listen to me! I’ll soon make you dry enough!” They all sat down at once, in a large ring, with the Mouse in the middle. Alice kept her eyes anxiously fixed on it, for she felt sure she would catch a bad cold if she did not get dry very soon.",
      "“Ahem!” said the Mouse with an important air, “are you all ready? This is the driest thing I know. Silence all round, if you please! ‘William the Conqueror, whose cause was favoured by the pope, was soon submitted to by the English, who wanted leaders, and had been of late much accustomed to usurpation and conquest. Edwin and Morcar, the earls of Mercia and Northumbria-’”",
      "“Ugh!” said the Lory, with a shiver.",
      "“I beg your pardon!” said the Mouse, frowning, but very politely: “Did you speak?”",
      "“Not I!” said the Lory hastily.",
      "“I thought you did,” said the Mouse. “-I proceed. ‘Edwin and Morcar, the earls of Mercia and Northumbria, declared for him: and even Stigand, the patriotic archbishop of Canterbury, found it advisable-’”",
      "“Found what?” said the Duck.",
      "“Found it,” the Mouse replied rather crossly: “of course you know what ‘it’ means.”",
      "“I know what ‘it’ means well enough, when I find a thing,” said the Duck: “it’s generally a frog or a worm. The question is, what did the archbishop find?”",
      "The Mouse did not notice this question, but hurriedly went on, “‘-found it advisable to go with Edgar Atheling to meet William and offer him the crown. William’s conduct at first was moderate. But the insolence of his Normans-’ How are you getting on now, my dear?” it continued, turning to Alice as it spoke.",
      "“As wet as ever,” said Alice in a melancholy tone: “it doesn’t seem to dry me at all.”",
      "“In that case,” said the Dodo solemnly, rising to its feet, “I move that the meeting adjourn, for the immediate adoption of more energetic remedies-”",
      "“Speak English!” said the Eaglet. “I don’t know the meaning of half those long words, and, what’s more, I don’t believe you do either!” And the Eaglet bent down its head to hide a smile: some of the other birds tittered audibly.",
      "“What I was going to say,” said the Dodo in an offended tone, “was, that the best thing to get us dry would be a Caucus-race.”",
      "“What is a Caucus-race?” said Alice; not that she wanted much to know, but the Dodo had paused as if it thought that somebody ought to speak, and no one else seemed inclined to say anything.",
      "“Why,” said the Dodo, “the best way to explain it is to do it.” (And, as you might like to try the thing yourself, some winter day, I will tell you how the Dodo managed it.)",
      "First it marked out a race-course, in a sort of circle, (“the exact shape doesn’t matter,” it said,) and then all the party were placed along the course, here and there. There was no “One, two, three, and away,” but they began running when they liked, and left off when they liked, so that it was not easy to know when the race was over. However, when they had been running half an hour or so, and were quite dry again, the Dodo suddenly called out “The race is over!” and they all crowded round it, panting, and asking, “But who has won?”",
      "This question the Dodo could not answer without a great deal of thought, and it sat for a long time with one finger pressed upon its forehead (the position in which you usually see Shakespeare, in the pictures of him), while the rest waited in silence. At last the Dodo said, “Everybody has won, and all must have prizes.”",
      "“But who is to give the prizes?” quite a chorus of voices asked.",
      "“Why, she, of course,” said the Dodo, pointing to Alice with one finger; and the whole party at once crowded round her, calling out in a confused way, “Prizes! Prizes!”",
      "Alice had no idea what to do, and in despair she put her hand in her pocket, and pulled out a box of comfits, (luckily the salt water had not got into it), and handed them round as prizes. There was exactly one a-piece, all round.",
      "“But she must have a prize herself, you know,” said the Mouse.",
      "“Of course,” the Dodo replied very gravely. “What else have you got in your pocket?” he went on, turning to Alice.",
      "“Only a thimble,” said Alice sadly.",
      "“Hand it over here,” said the Dodo.",
      "Then they all crowded round her once more, while the Dodo solemnly presented the thimble, saying “We beg your acceptance of this elegant thimble;” and, when it had finished this short speech, they all cheered.",
      "Alice thought the whole thing very absurd, but they all looked so grave that she did not dare to laugh; and, as she could not think of anything to say, she simply bowed, and took the thimble, looking as solemn as she could.",
      "The next thing was to eat the comfits: this caused some noise and confusion, as the large birds complained that they could not taste theirs, and the small ones choked and had to be patted on the back. However, it was over at last, and they sat down again in a ring, and begged the Mouse to tell them something more.",
      "“You promised to tell me your history, you know,” said Alice, “and why it is you hate-C and D,” she added in a whisper, half afraid that it would be offended again.",
      "“Mine is a long and a sad tale!” said the Mouse, turning to Alice, and sighing.",
      "“It is a long tail, certainly,” said Alice, looking down with wonder at the Mouse’s tail; “but why do you call it sad?” And she kept on puzzling about it while the Mouse was speaking, so that her idea of the tale was something like this:-",
      "“Fury said to a mouse, That he met in the house, ‘Let us both go to law: I will prosecute you.-Come, I’ll take no denial; We must have a trial: For really this morning I’ve nothing to do.’ Said the mouse to the cur, ‘Such a trial, dear sir, With no jury or judge, would be wasting our breath.’ ‘I’ll be judge, I’ll be jury,’ Said cunning old Fury: ‘I’ll try the whole cause, and condemn you to death.’”",
      "“You are not attending!” said the Mouse to Alice severely. “What are you thinking of?”",
      "“I beg your pardon,” said Alice very humbly: “you had got to the fifth bend, I think?”",
      "“I had not!” cried the Mouse, sharply and very angrily.",
      "“A knot!” said Alice, always ready to make herself useful, and looking anxiously about her. “Oh, do let me help to undo it!”",
      "“I shall do nothing of the sort,” said the Mouse, getting up and walking away. “You insult me by talking such nonsense!”",
      "“I didn’t mean it!” pleaded poor Alice. “But you’re so easily offended, you know!”",
      "The Mouse only growled in reply.",
      "“Please come back and finish your story!” Alice called after it; and the others all joined in chorus, “Yes, please do!” but the Mouse only shook its head impatiently, and walked a little quicker.",
      "“What a pity it wouldn’t stay!” sighed the Lory, as soon as it was quite out of sight; and an old Crab took the opportunity of saying to her daughter “Ah, my dear! Let this be a lesson to you never to lose your temper!” “Hold your tongue, Ma!” said the young Crab, a little snappishly. “You’re enough to try the patience of an oyster!”",
      "“I wish I had our Dinah here, I know I do!” said Alice aloud, addressing nobody in particular. “She’d soon fetch it back!”",
      "“And who is Dinah, if I might venture to ask the question?” said the Lory.",
      "Alice replied eagerly, for she was always ready to talk about her pet: “Dinah’s our cat. And she’s such a capital one for catching mice you can’t think! And oh, I wish you could see her after the birds! Why, she’ll eat a little bird as soon as look at it!”",
      "This speech caused a remarkable sensation among the party. Some of the birds hurried off at once: one old Magpie began wrapping itself up very carefully, remarking, “I really must be getting home; the night-air doesn’t suit my throat!” and a Canary called out in a trembling voice to its children, “Come away, my dears! It’s high time you were all in bed!” On various pretexts they all moved off, and Alice was soon left alone.",
      "“I wish I hadn’t mentioned Dinah!” she said to herself in a melancholy tone. “Nobody seems to like her, down here, and I’m sure she’s the best cat in the world! Oh, my dear Dinah! I wonder if I shall ever see you any more!” And here poor Alice began to cry again, for she felt very lonely and low-spirited. In a little while, however, she again heard a little pattering of footsteps in the distance, and she looked up eagerly, half hoping that the Mouse had changed his mind, and was coming back to finish his story.",
    ],
  },
  {
    number: 'IV',
    title: "The Rabbit Sends in a Little Bill",
    paragraphs: [
      "It was the White Rabbit, trotting slowly back again, and looking anxiously about as it went, as if it had lost something; and she heard it muttering to itself “The Duchess! The Duchess! Oh my dear paws! Oh my fur and whiskers! She’ll get me executed, as sure as ferrets are ferrets! Where can I have dropped them, I wonder?” Alice guessed in a moment that it was looking for the fan and the pair of white kid gloves, and she very good-naturedly began hunting about for them, but they were nowhere to be seen-everything seemed to have changed since her swim in the pool, and the great hall, with the glass table and the little door, had vanished completely.",
      "Very soon the Rabbit noticed Alice, as she went hunting about, and called out to her in an angry tone, “Why, Mary Ann, what are you doing out here? Run home this moment, and fetch me a pair of gloves and a fan! Quick, now!” And Alice was so much frightened that she ran off at once in the direction it pointed to, without trying to explain the mistake it had made.",
      "“He took me for his housemaid,” she said to herself as she ran. “How surprised he’ll be when he finds out who I am! But I’d better take him his fan and gloves-that is, if I can find them.” As she said this, she came upon a neat little house, on the door of which was a bright brass plate with the name “W. RABBIT,” engraved upon it. She went in without knocking, and hurried upstairs, in great fear lest she should meet the real Mary Ann, and be turned out of the house before she had found the fan and gloves.",
      "“How queer it seems,” Alice said to herself, “to be going messages for a rabbit! I suppose Dinah’ll be sending me on messages next!” And she began fancying the sort of thing that would happen: “‘Miss Alice! Come here directly, and get ready for your walk!’ ‘Coming in a minute, nurse! But I’ve got to see that the mouse doesn’t get out.’ Only I don’t think,” Alice went on, “that they’d let Dinah stop in the house if it began ordering people about like that!”",
      "By this time she had found her way into a tidy little room with a table in the window, and on it (as she had hoped) a fan and two or three pairs of tiny white kid gloves: she took up the fan and a pair of the gloves, and was just going to leave the room, when her eye fell upon a little bottle that stood near the looking-glass. There was no label this time with the words “DRINK ME,” but nevertheless she uncorked it and put it to her lips. “I know something interesting is sure to happen,” she said to herself, “whenever I eat or drink anything; so I’ll just see what this bottle does. I do hope it’ll make me grow large again, for really I’m quite tired of being such a tiny little thing!”",
      "It did so indeed, and much sooner than she had expected: before she had drunk half the bottle, she found her head pressing against the ceiling, and had to stoop to save her neck from being broken. She hastily put down the bottle, saying to herself “That’s quite enough-I hope I shan’t grow any more-As it is, I can’t get out at the door-I do wish I hadn’t drunk quite so much!”",
      "Alas! it was too late to wish that! She went on growing, and growing, and very soon had to kneel down on the floor: in another minute there was not even room for this, and she tried the effect of lying down with one elbow against the door, and the other arm curled round her head. Still she went on growing, and, as a last resource, she put one arm out of the window, and one foot up the chimney, and said to herself “Now I can do no more, whatever happens. What will become of me?”",
      "Luckily for Alice, the little magic bottle had now had its full effect, and she grew no larger: still it was very uncomfortable, and, as there seemed to be no sort of chance of her ever getting out of the room again, no wonder she felt unhappy.",
      "“It was much pleasanter at home,” thought poor Alice, “when one wasn’t always growing larger and smaller, and being ordered about by mice and rabbits. I almost wish I hadn’t gone down that rabbit-hole-and yet-and yet-it’s rather curious, you know, this sort of life! I do wonder what can have happened to me! When I used to read fairy-tales, I fancied that kind of thing never happened, and now here I am in the middle of one! There ought to be a book written about me, that there ought! And when I grow up, I’ll write one-but I’m grown up now,” she added in a sorrowful tone; “at least there’s no room to grow up any more here.”",
      "“But then,” thought Alice, “shall I never get any older than I am now? That’ll be a comfort, one way-never to be an old woman-but then-always to have lessons to learn! Oh, I shouldn’t like that!”",
      "“Oh, you foolish Alice!” she answered herself. “How can you learn lessons in here? Why, there’s hardly room for you, and no room at all for any lesson-books!”",
      "And so she went on, taking first one side and then the other, and making quite a conversation of it altogether; but after a few minutes she heard a voice outside, and stopped to listen.",
      "“Mary Ann! Mary Ann!” said the voice. “Fetch me my gloves this moment!” Then came a little pattering of feet on the stairs. Alice knew it was the Rabbit coming to look for her, and she trembled till she shook the house, quite forgetting that she was now about a thousand times as large as the Rabbit, and had no reason to be afraid of it.",
      "Presently the Rabbit came up to the door, and tried to open it; but, as the door opened inwards, and Alice’s elbow was pressed hard against it, that attempt proved a failure. Alice heard it say to itself “Then I’ll go round and get in at the window.”",
      "“That you won’t!” thought Alice, and, after waiting till she fancied she heard the Rabbit just under the window, she suddenly spread out her hand, and made a snatch in the air. She did not get hold of anything, but she heard a little shriek and a fall, and a crash of broken glass, from which she concluded that it was just possible it had fallen into a cucumber-frame, or something of the sort.",
      "Next came an angry voice-the Rabbit’s-“Pat! Pat! Where are you?” And then a voice she had never heard before, “Sure then I’m here! Digging for apples, yer honour!”",
      "“Digging for apples, indeed!” said the Rabbit angrily. “Here! Come and help me out of this!” (Sounds of more broken glass.)",
      "“Now tell me, Pat, what’s that in the window?”",
      "“Sure, it’s an arm, yer honour!” (He pronounced it “arrum.”)",
      "“An arm, you goose! Who ever saw one that size? Why, it fills the whole window!”",
      "“Sure, it does, yer honour: but it’s an arm for all that.”",
      "“Well, it’s got no business there, at any rate: go and take it away!”",
      "There was a long silence after this, and Alice could only hear whispers now and then; such as, “Sure, I don’t like it, yer honour, at all, at all!” “Do as I tell you, you coward!” and at last she spread out her hand again, and made another snatch in the air. This time there were two little shrieks, and more sounds of broken glass. “What a number of cucumber-frames there must be!” thought Alice. “I wonder what they’ll do next! As for pulling me out of the window, I only wish they could! I’m sure I don’t want to stay in here any longer!”",
      "She waited for some time without hearing anything more: at last came a rumbling of little cartwheels, and the sound of a good many voices all talking together: she made out the words: “Where’s the other ladder?-Why, I hadn’t to bring but one; Bill’s got the other-Bill! fetch it here, lad!-Here, put ’em up at this corner-No, tie ’em together first-they don’t reach half high enough yet-Oh! they’ll do well enough; don’t be particular-Here, Bill! catch hold of this rope-Will the roof bear?-Mind that loose slate-Oh, it’s coming down! Heads below!” (a loud crash)-“Now, who did that?-It was Bill, I fancy-Who’s to go down the chimney?-Nay, I shan’t! You do it!-That I won’t, then!-Bill’s to go down-Here, Bill! the master says you’re to go down the chimney!”",
      "“Oh! So Bill’s got to come down the chimney, has he?” said Alice to herself. “Shy, they seem to put everything upon Bill! I wouldn’t be in Bill’s place for a good deal: this fireplace is narrow, to be sure; but I think I can kick a little!”",
      "She drew her foot as far down the chimney as she could, and waited till she heard a little animal (she couldn’t guess of what sort it was) scratching and scrambling about in the chimney close above her: then, saying to herself “This is Bill,” she gave one sharp kick, and waited to see what would happen next.",
      "The first thing she heard was a general chorus of “There goes Bill!” then the Rabbit’s voice along-“Catch him, you by the hedge!” then silence, and then another confusion of voices-“Hold up his head-Brandy now-Don’t choke him-How was it, old fellow? What happened to you? Tell us all about it!”",
      "Last came a little feeble, squeaking voice, (“That’s Bill,” thought Alice,) “Well, I hardly know-No more, thank ye; I’m better now-but I’m a deal too flustered to tell you-all I know is, something comes at me like a Jack-in-the-box, and up I goes like a sky-rocket!”",
      "“So you did, old fellow!” said the others.",
      "“We must burn the house down!” said the Rabbit’s voice; and Alice called out as loud as she could, “If you do, I’ll set Dinah at you!”",
      "There was a dead silence instantly, and Alice thought to herself, “I wonder what they will do next! If they had any sense, they’d take the roof off.” After a minute or two, they began moving about again, and Alice heard the Rabbit say, “A barrowful will do, to begin with.”",
      "“A barrowful of what?” thought Alice; but she had not long to doubt, for the next moment a shower of little pebbles came rattling in at the window, and some of them hit her in the face. “I’ll put a stop to this,” she said to herself, and shouted out, “You’d better not do that again!” which produced another dead silence.",
      "Alice noticed with some surprise that the pebbles were all turning into little cakes as they lay on the floor, and a bright idea came into her head. “If I eat one of these cakes,” she thought, “it’s sure to make some change in my size; and as it can’t possibly make me larger, it must make me smaller, I suppose.”",
      "So she swallowed one of the cakes, and was delighted to find that she began shrinking directly. As soon as she was small enough to get through the door, she ran out of the house, and found quite a crowd of little animals and birds waiting outside. The poor little Lizard, Bill, was in the middle, being held up by two guinea-pigs, who were giving it something out of a bottle. They all made a rush at Alice the moment she appeared; but she ran off as hard as she could, and soon found herself safe in a thick wood.",
      "“The first thing I’ve got to do,” said Alice to herself, as she wandered about in the wood, “is to grow to my right size again; and the second thing is to find my way into that lovely garden. I think that will be the best plan.”",
      "It sounded an excellent plan, no doubt, and very neatly and simply arranged; the only difficulty was, that she had not the smallest idea how to set about it; and while she was peering about anxiously among the trees, a little sharp bark just over her head made her look up in a great hurry.",
      "An enormous puppy was looking down at her with large round eyes, and feebly stretching out one paw, trying to touch her. “Poor little thing!” said Alice, in a coaxing tone, and she tried hard to whistle to it; but she was terribly frightened all the time at the thought that it might be hungry, in which case it would be very likely to eat her up in spite of all her coaxing.",
      "Hardly knowing what she did, she picked up a little bit of stick, and held it out to the puppy; whereupon the puppy jumped into the air off all its feet at once, with a yelp of delight, and rushed at the stick, and made believe to worry it; then Alice dodged behind a great thistle, to keep herself from being run over; and the moment she appeared on the other side, the puppy made another rush at the stick, and tumbled head over heels in its hurry to get hold of it; then Alice, thinking it was very like having a game of play with a cart-horse, and expecting every moment to be trampled under its feet, ran round the thistle again; then the puppy began a series of short charges at the stick, running a very little way forwards each time and a long way back, and barking hoarsely all the while, till at last it sat down a good way off, panting, with its tongue hanging out of its mouth, and its great eyes half shut.",
      "This seemed to Alice a good opportunity for making her escape; so she set off at once, and ran till she was quite tired and out of breath, and till the puppy’s bark sounded quite faint in the distance.",
      "“And yet what a dear little puppy it was!” said Alice, as she leant against a buttercup to rest herself, and fanned herself with one of the leaves: “I should have liked teaching it tricks very much, if-if I’d only been the right size to do it! Oh dear! I’d nearly forgotten that I’ve got to grow up again! Let me see-how is it to be managed? I suppose I ought to eat or drink something or other; but the great question is, what?”",
      "The great question certainly was, what? Alice looked all round her at the flowers and the blades of grass, but she did not see anything that looked like the right thing to eat or drink under the circumstances. There was a large mushroom growing near her, about the same height as herself; and when she had looked under it, and on both sides of it, and behind it, it occurred to her that she might as well look and see what was on the top of it.",
      "She stretched herself up on tiptoe, and peeped over the edge of the mushroom, and her eyes immediately met those of a large blue caterpillar, that was sitting on the top with its arms folded, quietly smoking a long hookah, and taking not the smallest notice of her or of anything else.",
    ],
  },
  {
    number: 'V',
    title: "Advice from a Caterpillar",
    paragraphs: [
      "The Caterpillar and Alice looked at each other for some time in silence: at last the Caterpillar took the hookah out of its mouth, and addressed her in a languid, sleepy voice.",
      "“Who are you?” said the Caterpillar.",
      "This was not an encouraging opening for a conversation. Alice replied, rather shyly, “I-I hardly know, sir, just at present-at least I know who I was when I got up this morning, but I think I must have been changed several times since then.”",
      "“What do you mean by that?” said the Caterpillar sternly. “Explain yourself!”",
      "“I can’t explain myself, I’m afraid, sir,” said Alice, “because I’m not myself, you see.”",
      "“I don’t see,” said the Caterpillar.",
      "“I’m afraid I can’t put it more clearly,” Alice replied very politely, “for I can’t understand it myself to begin with; and being so many different sizes in a day is very confusing.”",
      "“It isn’t,” said the Caterpillar.",
      "“Well, perhaps you haven’t found it so yet,” said Alice; “but when you have to turn into a chrysalis-you will some day, you know-and then after that into a butterfly, I should think you’ll feel it a little queer, won’t you?”",
      "“Not a bit,” said the Caterpillar.",
      "“Well, perhaps your feelings may be different,” said Alice; “all I know is, it would feel very queer to me.”",
      "“You!” said the Caterpillar contemptuously. “Who are you?”",
      "Which brought them back again to the beginning of the conversation. Alice felt a little irritated at the Caterpillar’s making such very short remarks, and she drew herself up and said, very gravely, “I think, you ought to tell me who you are, first.”",
      "“Why?” said the Caterpillar.",
      "Here was another puzzling question; and as Alice could not think of any good reason, and as the Caterpillar seemed to be in a very unpleasant state of mind, she turned away.",
      "“Come back!” the Caterpillar called after her. “I’ve something important to say!”",
      "This sounded promising, certainly: Alice turned and came back again.",
      "“Keep your temper,” said the Caterpillar.",
      "“Is that all?” said Alice, swallowing down her anger as well as she could.",
      "“No,” said the Caterpillar.",
      "Alice thought she might as well wait, as she had nothing else to do, and perhaps after all it might tell her something worth hearing. For some minutes it puffed away without speaking, but at last it unfolded its arms, took the hookah out of its mouth again, and said, “So you think you’re changed, do you?”",
      "“I’m afraid I am, sir,” said Alice; “I can’t remember things as I used-and I don’t keep the same size for ten minutes together!”",
      "“Can’t remember what things?” said the Caterpillar.",
      "“Well, I’ve tried to say “How doth the little busy bee,” but it all came different!” Alice replied in a very melancholy voice.",
      "“Repeat, ‘You are old, Father William,’” said the Caterpillar.",
      "Alice folded her hands, and began:-",
      "“You are old, Father William,” the young man said, “And your hair has become very white; And yet you incessantly stand on your head- Do you think, at your age, it is right?”",
      "“In my youth,” Father William replied to his son, “I feared it might injure the brain; But, now that I’m perfectly sure I have none, Why, I do it again and again.”",
      "“You are old,” said the youth, “as I mentioned before, And have grown most uncommonly fat; Yet you turned a back-somersault in at the door- Pray, what is the reason of that?”",
      "“In my youth,” said the sage, as he shook his grey locks, “I kept all my limbs very supple By the use of this ointment-one shilling the box- Allow me to sell you a couple?”",
      "“You are old,” said the youth, “and your jaws are too weak For anything tougher than suet; Yet you finished the goose, with the bones and the beak- Pray, how did you manage to do it?”",
      "“In my youth,” said his father, “I took to the law, And argued each case with my wife; And the muscular strength, which it gave to my jaw, Has lasted the rest of my life.”",
      "“You are old,” said the youth, “one would hardly suppose That your eye was as steady as ever; Yet you balanced an eel on the end of your nose- What made you so awfully clever?”",
      "“I have answered three questions, and that is enough,” Said his father; “don’t give yourself airs! Do you think I can listen all day to such stuff? Be off, or I’ll kick you down stairs!”",
      "“That is not said right,” said the Caterpillar.",
      "“Not quite right, I’m afraid,” said Alice, timidly; “some of the words have got altered.”",
      "“It is wrong from beginning to end,” said the Caterpillar decidedly, and there was silence for some minutes.",
      "The Caterpillar was the first to speak.",
      "“What size do you want to be?” it asked.",
      "“Oh, I’m not particular as to size,” Alice hastily replied; “only one doesn’t like changing so often, you know.”",
      "“I don’t know,” said the Caterpillar.",
      "Alice said nothing: she had never been so much contradicted in her life before, and she felt that she was losing her temper.",
      "“Are you content now?” said the Caterpillar.",
      "“Well, I should like to be a little larger, sir, if you wouldn’t mind,” said Alice: “three inches is such a wretched height to be.”",
      "“It is a very good height indeed!” said the Caterpillar angrily, rearing itself upright as it spoke (it was exactly three inches high).",
      "“But I’m not used to it!” pleaded poor Alice in a piteous tone. And she thought of herself, “I wish the creatures wouldn’t be so easily offended!”",
      "“You’ll get used to it in time,” said the Caterpillar; and it put the hookah into its mouth and began smoking again.",
      "This time Alice waited patiently until it chose to speak again. In a minute or two the Caterpillar took the hookah out of its mouth and yawned once or twice, and shook itself. Then it got down off the mushroom, and crawled away in the grass, merely remarking as it went, “One side will make you grow taller, and the other side will make you grow shorter.”",
      "“One side of what? The other side of what?” thought Alice to herself.",
      "“Of the mushroom,” said the Caterpillar, just as if she had asked it aloud; and in another moment it was out of sight.",
      "Alice remained looking thoughtfully at the mushroom for a minute, trying to make out which were the two sides of it; and as it was perfectly round, she found this a very difficult question. However, at last she stretched her arms round it as far as they would go, and broke off a bit of the edge with each hand.",
      "“And now which is which?” she said to herself, and nibbled a little of the right-hand bit to try the effect: the next moment she felt a violent blow underneath her chin: it had struck her foot!",
      "She was a good deal frightened by this very sudden change, but she felt that there was no time to be lost, as she was shrinking rapidly; so she set to work at once to eat some of the other bit. Her chin was pressed so closely against her foot, that there was hardly room to open her mouth; but she did it at last, and managed to swallow a morsel of the lefthand bit.",
      "“Come, my head’s free at last!” said Alice in a tone of delight, which changed into alarm in another moment, when she found that her shoulders were nowhere to be found: all she could see, when she looked down, was an immense length of neck, which seemed to rise like a stalk out of a sea of green leaves that lay far below her.",
      "“What can all that green stuff be?” said Alice. “And where have my shoulders got to? And oh, my poor hands, how is it I can’t see you?” She was moving them about as she spoke, but no result seemed to follow, except a little shaking among the distant green leaves.",
      "As there seemed to be no chance of getting her hands up to her head, she tried to get her head down to them, and was delighted to find that her neck would bend about easily in any direction, like a serpent. She had just succeeded in curving it down into a graceful zigzag, and was going to dive in among the leaves, which she found to be nothing but the tops of the trees under which she had been wandering, when a sharp hiss made her draw back in a hurry: a large pigeon had flown into her face, and was beating her violently with its wings.",
      "“Serpent!” screamed the Pigeon.",
      "“I’m not a serpent!” said Alice indignantly. “Let me alone!”",
      "“Serpent, I say again!” repeated the Pigeon, but in a more subdued tone, and added with a kind of sob, “I’ve tried every way, and nothing seems to suit them!”",
      "“I haven’t the least idea what you’re talking about,” said Alice.",
      "“I’ve tried the roots of trees, and I’ve tried banks, and I’ve tried hedges,” the Pigeon went on, without attending to her; “but those serpents! There’s no pleasing them!”",
      "Alice was more and more puzzled, but she thought there was no use in saying anything more till the Pigeon had finished.",
      "“As if it wasn’t trouble enough hatching the eggs,” said the Pigeon; “but I must be on the look-out for serpents night and day! Why, I haven’t had a wink of sleep these three weeks!”",
      "“I’m very sorry you’ve been annoyed,” said Alice, who was beginning to see its meaning.",
      "“And just as I’d taken the highest tree in the wood,” continued the Pigeon, raising its voice to a shriek, “and just as I was thinking I should be free of them at last, they must needs come wriggling down from the sky! Ugh, Serpent!”",
      "“But I’m not a serpent, I tell you!” said Alice. “I’m a-I’m a-”",
      "“Well! What are you?” said the Pigeon. “I can see you’re trying to invent something!”",
      "“I-I’m a little girl,” said Alice, rather doubtfully, as she remembered the number of changes she had gone through that day.",
      "“A likely story indeed!” said the Pigeon in a tone of the deepest contempt. “I’ve seen a good many little girls in my time, but never one with such a neck as that! No, no! You’re a serpent; and there’s no use denying it. I suppose you’ll be telling me next that you never tasted an egg!”",
      "“I have tasted eggs, certainly,” said Alice, who was a very truthful child; “but little girls eat eggs quite as much as serpents do, you know.”",
      "“I don’t believe it,” said the Pigeon; “but if they do, why then they’re a kind of serpent, that’s all I can say.”",
      "This was such a new idea to Alice, that she was quite silent for a minute or two, which gave the Pigeon the opportunity of adding, “You’re looking for eggs, I know that well enough; and what does it matter to me whether you’re a little girl or a serpent?”",
      "“It matters a good deal to me,” said Alice hastily; “but I’m not looking for eggs, as it happens; and if I was, I shouldn’t want yours: I don’t like them raw.”",
      "“Well, be off, then!” said the Pigeon in a sulky tone, as it settled down again into its nest. Alice crouched down among the trees as well as she could, for her neck kept getting entangled among the branches, and every now and then she had to stop and untwist it. After a while she remembered that she still held the pieces of mushroom in her hands, and she set to work very carefully, nibbling first at one and then at the other, and growing sometimes taller and sometimes shorter, until she had succeeded in bringing herself down to her usual height.",
      "It was so long since she had been anything near the right size, that it felt quite strange at first; but she got used to it in a few minutes, and began talking to herself, as usual. “Come, there’s half my plan done now! How puzzling all these changes are! I’m never sure what I’m going to be, from one minute to another! However, I’ve got back to my right size: the next thing is, to get into that beautiful garden-how is that to be done, I wonder?” As she said this, she came suddenly upon an open place, with a little house in it about four feet high. “Whoever lives there,” thought Alice, “it’ll never do to come upon them this size: why, I should frighten them out of their wits!” So she began nibbling at the righthand bit again, and did not venture to go near the house till she had brought herself down to nine inches high.",
    ],
  },
  {
    number: 'VI',
    title: "Pig and Pepper",
    paragraphs: [
      "For a minute or two she stood looking at the house, and wondering what to do next, when suddenly a footman in livery came running out of the wood-(she considered him to be a footman because he was in livery: otherwise, judging by his face only, she would have called him a fish)-and rapped loudly at the door with his knuckles. It was opened by another footman in livery, with a round face, and large eyes like a frog; and both footmen, Alice noticed, had powdered hair that curled all over their heads. She felt very curious to know what it was all about, and crept a little way out of the wood to listen.",
      "The Fish-Footman began by producing from under his arm a great letter, nearly as large as himself, and this he handed over to the other, saying, in a solemn tone, “For the Duchess. An invitation from the Queen to play croquet.” The Frog-Footman repeated, in the same solemn tone, only changing the order of the words a little, “From the Queen. An invitation for the Duchess to play croquet.”",
      "Then they both bowed low, and their curls got entangled together.",
      "Alice laughed so much at this, that she had to run back into the wood for fear of their hearing her; and when she next peeped out the Fish-Footman was gone, and the other was sitting on the ground near the door, staring stupidly up into the sky.",
      "Alice went timidly up to the door, and knocked.",
      "“There’s no sort of use in knocking,” said the Footman, “and that for two reasons. First, because I’m on the same side of the door as you are; secondly, because they’re making such a noise inside, no one could possibly hear you.” And certainly there was a most extraordinary noise going on within-a constant howling and sneezing, and every now and then a great crash, as if a dish or kettle had been broken to pieces.",
      "“Please, then,” said Alice, “how am I to get in?”",
      "“There might be some sense in your knocking,” the Footman went on without attending to her, “if we had the door between us. For instance, if you were inside, you might knock, and I could let you out, you know.” He was looking up into the sky all the time he was speaking, and this Alice thought decidedly uncivil. “But perhaps he can’t help it,” she said to herself; “his eyes are so very nearly at the top of his head. But at any rate he might answer questions.-How am I to get in?” she repeated, aloud.",
      "“I shall sit here,” the Footman remarked, “till tomorrow-”",
      "At this moment the door of the house opened, and a large plate came skimming out, straight at the Footman’s head: it just grazed his nose, and broke to pieces against one of the trees behind him.",
      "“-or next day, maybe,” the Footman continued in the same tone, exactly as if nothing had happened.",
      "“How am I to get in?” asked Alice again, in a louder tone.",
      "“Are you to get in at all?” said the Footman. “That’s the first question, you know.”",
      "It was, no doubt: only Alice did not like to be told so. “It’s really dreadful,” she muttered to herself, “the way all the creatures argue. It’s enough to drive one crazy!”",
      "The Footman seemed to think this a good opportunity for repeating his remark, with variations. “I shall sit here,” he said, “on and off, for days and days.”",
      "“But what am I to do?” said Alice.",
      "“Anything you like,” said the Footman, and began whistling.",
      "“Oh, there’s no use in talking to him,” said Alice desperately: “he’s perfectly idiotic!” And she opened the door and went in.",
      "The door led right into a large kitchen, which was full of smoke from one end to the other: the Duchess was sitting on a three-legged stool in the middle, nursing a baby; the cook was leaning over the fire, stirring a large cauldron which seemed to be full of soup.",
      "“There’s certainly too much pepper in that soup!” Alice said to herself, as well as she could for sneezing.",
      "There was certainly too much of it in the air. Even the Duchess sneezed occasionally; and as for the baby, it was sneezing and howling alternately without a moment’s pause. The only things in the kitchen that did not sneeze, were the cook, and a large cat which was sitting on the hearth and grinning from ear to ear.",
      "“Please would you tell me,” said Alice, a little timidly, for she was not quite sure whether it was good manners for her to speak first, “why your cat grins like that?”",
      "“It’s a Cheshire cat,” said the Duchess, “and that’s why. Pig!”",
      "She said the last word with such sudden violence that Alice quite jumped; but she saw in another moment that it was addressed to the baby, and not to her, so she took courage, and went on again:-",
      "“I didn’t know that Cheshire cats always grinned; in fact, I didn’t know that cats could grin.”",
      "“They all can,” said the Duchess; “and most of ’em do.”",
      "“I don’t know of any that do,” Alice said very politely, feeling quite pleased to have got into a conversation.",
      "“You don’t know much,” said the Duchess; “and that’s a fact.”",
      "Alice did not at all like the tone of this remark, and thought it would be as well to introduce some other subject of conversation. While she was trying to fix on one, the cook took the cauldron of soup off the fire, and at once set to work throwing everything within her reach at the Duchess and the baby-the fire-irons came first; then followed a shower of saucepans, plates, and dishes. The Duchess took no notice of them even when they hit her; and the baby was howling so much already, that it was quite impossible to say whether the blows hurt it or not.",
      "“Oh, please mind what you’re doing!” cried Alice, jumping up and down in an agony of terror. “Oh, there goes his precious nose!” as an unusually large saucepan flew close by it, and very nearly carried it off.",
      "“If everybody minded their own business,” the Duchess said in a hoarse growl, “the world would go round a deal faster than it does.”",
      "“Which would not be an advantage,” said Alice, who felt very glad to get an opportunity of showing off a little of her knowledge. “Just think of what work it would make with the day and night! You see the earth takes twenty-four hours to turn round on its axis-”",
      "“Talking of axes,” said the Duchess, “chop off her head!”",
      "Alice glanced rather anxiously at the cook, to see if she meant to take the hint; but the cook was busily stirring the soup, and seemed not to be listening, so she went on again: “Twenty-four hours, I think; or is it twelve? I-”",
      "“Oh, don’t bother me,” said the Duchess; “I never could abide figures!” And with that she began nursing her child again, singing a sort of lullaby to it as she did so, and giving it a violent shake at the end of every line:",
      "“Speak roughly to your little boy, And beat him when he sneezes: He only does it to annoy, Because he knows it teases.”",
      "CHORUS. (In which the cook and the baby joined):",
      "“Wow! wow! wow!”",
      "While the Duchess sang the second verse of the song, she kept tossing the baby violently up and down, and the poor little thing howled so, that Alice could hardly hear the words:-",
      "“I speak severely to my boy, I beat him when he sneezes; For he can thoroughly enjoy The pepper when he pleases!”",
      "CHORUS.",
      "“Wow! wow! wow!”",
      "“Here! you may nurse it a bit, if you like!” the Duchess said to Alice, flinging the baby at her as she spoke. “I must go and get ready to play croquet with the Queen,” and she hurried out of the room. The cook threw a frying-pan after her as she went out, but it just missed her.",
      "Alice caught the baby with some difficulty, as it was a queer-shaped little creature, and held out its arms and legs in all directions, “just like a star-fish,” thought Alice. The poor little thing was snorting like a steam-engine when she caught it, and kept doubling itself up and straightening itself out again, so that altogether, for the first minute or two, it was as much as she could do to hold it.",
      "As soon as she had made out the proper way of nursing it, (which was to twist it up into a sort of knot, and then keep tight hold of its right ear and left foot, so as to prevent its undoing itself,) she carried it out into the open air. “If I don’t take this child away with me,” thought Alice, “they’re sure to kill it in a day or two: wouldn’t it be murder to leave it behind?” She said the last words out loud, and the little thing grunted in reply (it had left off sneezing by this time). “Don’t grunt,” said Alice; “that’s not at all a proper way of expressing yourself.”",
      "The baby grunted again, and Alice looked very anxiously into its face to see what was the matter with it. There could be no doubt that it had a very turn-up nose, much more like a snout than a real nose; also its eyes were getting extremely small for a baby: altogether Alice did not like the look of the thing at all. “But perhaps it was only sobbing,” she thought, and looked into its eyes again, to see if there were any tears.",
      "No, there were no tears. “If you’re going to turn into a pig, my dear,” said Alice, seriously, “I’ll have nothing more to do with you. Mind now!” The poor little thing sobbed again (or grunted, it was impossible to say which), and they went on for some while in silence.",
      "Alice was just beginning to think to herself, “Now, what am I to do with this creature when I get it home?” when it grunted again, so violently, that she looked down into its face in some alarm. This time there could be no mistake about it: it was neither more nor less than a pig, and she felt that it would be quite absurd for her to carry it further.",
      "So she set the little creature down, and felt quite relieved to see it trot away quietly into the wood. “If it had grown up,” she said to herself, “it would have made a dreadfully ugly child: but it makes rather a handsome pig, I think.” And she began thinking over other children she knew, who might do very well as pigs, and was just saying to herself, “if one only knew the right way to change them-” when she was a little startled by seeing the Cheshire Cat sitting on a bough of a tree a few yards off.",
      "The Cat only grinned when it saw Alice. It looked good-natured, she thought: still it had very long claws and a great many teeth, so she felt that it ought to be treated with respect.",
      "“Cheshire Puss,” she began, rather timidly, as she did not at all know whether it would like the name: however, it only grinned a little wider. “Come, it’s pleased so far,” thought Alice, and she went on. “Would you tell me, please, which way I ought to go from here?”",
      "“That depends a good deal on where you want to get to,” said the Cat.",
      "“I don’t much care where-” said Alice.",
      "“Then it doesn’t matter which way you go,” said the Cat.",
      "“-so long as I get somewhere,” Alice added as an explanation.",
      "“Oh, you’re sure to do that,” said the Cat, “if you only walk long enough.”",
      "Alice felt that this could not be denied, so she tried another question. “What sort of people live about here?”",
      "“In that direction,” the Cat said, waving its right paw round, “lives a Hatter: and in that direction,” waving the other paw, “lives a March Hare. Visit either you like: they’re both mad.”",
      "“But I don’t want to go among mad people,” Alice remarked.",
      "“Oh, you can’t help that,” said the Cat: “we’re all mad here. I’m mad. You’re mad.”",
      "“How do you know I’m mad?” said Alice.",
      "“You must be,” said the Cat, “or you wouldn’t have come here.”",
      "Alice didn’t think that proved it at all; however, she went on “And how do you know that you’re mad?”",
      "“To begin with,” said the Cat, “a dog’s not mad. You grant that?”",
      "“I suppose so,” said Alice.",
      "“Well, then,” the Cat went on, “you see, a dog growls when it’s angry, and wags its tail when it’s pleased. Now I growl when I’m pleased, and wag my tail when I’m angry. Therefore I’m mad.”",
      "“I call it purring, not growling,” said Alice.",
      "“Call it what you like,” said the Cat. “Do you play croquet with the Queen to-day?”",
      "“I should like it very much,” said Alice, “but I haven’t been invited yet.”",
      "“You’ll see me there,” said the Cat, and vanished.",
      "Alice was not much surprised at this, she was getting so used to queer things happening. While she was looking at the place where it had been, it suddenly appeared again.",
      "“By-the-bye, what became of the baby?” said the Cat. “I’d nearly forgotten to ask.”",
      "“It turned into a pig,” Alice quietly said, just as if it had come back in a natural way.",
      "“I thought it would,” said the Cat, and vanished again.",
      "Alice waited a little, half expecting to see it again, but it did not appear, and after a minute or two she walked on in the direction in which the March Hare was said to live. “I’ve seen hatters before,” she said to herself; “the March Hare will be much the most interesting, and perhaps as this is May it won’t be raving mad-at least not so mad as it was in March.” As she said this, she looked up, and there was the Cat again, sitting on a branch of a tree.",
      "“Did you say pig, or fig?” said the Cat.",
      "“I said pig,” replied Alice; “and I wish you wouldn’t keep appearing and vanishing so suddenly: you make one quite giddy.”",
      "“All right,” said the Cat; and this time it vanished quite slowly, beginning with the end of the tail, and ending with the grin, which remained some time after the rest of it had gone.",
      "“Well! I’ve often seen a cat without a grin,” thought Alice; “but a grin without a cat! It’s the most curious thing I ever saw in my life!”",
      "She had not gone much farther before she came in sight of the house of the March Hare: she thought it must be the right house, because the chimneys were shaped like ears and the roof was thatched with fur. It was so large a house, that she did not like to go nearer till she had nibbled some more of the lefthand bit of mushroom, and raised herself to about two feet high: even then she walked up towards it rather timidly, saying to herself “Suppose it should be raving mad after all! I almost wish I’d gone to see the Hatter instead!”",
    ],
  },
  {
    number: 'VII',
    title: "A Mad Tea-Party",
    paragraphs: [
      "There was a table set out under a tree in front of the house, and the March Hare and the Hatter were having tea at it: a Dormouse was sitting between them, fast asleep, and the other two were using it as a cushion, resting their elbows on it, and talking over its head. “Very uncomfortable for the Dormouse,” thought Alice; “only, as it’s asleep, I suppose it doesn’t mind.”",
      "The table was a large one, but the three were all crowded together at one corner of it: “No room! No room!” they cried out when they saw Alice coming. “There’s plenty of room!” said Alice indignantly, and she sat down in a large arm-chair at one end of the table.",
      "“Have some wine,” the March Hare said in an encouraging tone.",
      "Alice looked all round the table, but there was nothing on it but tea. “I don’t see any wine,” she remarked.",
      "“There isn’t any,” said the March Hare.",
      "“Then it wasn’t very civil of you to offer it,” said Alice angrily.",
      "“It wasn’t very civil of you to sit down without being invited,” said the March Hare.",
      "“I didn’t know it was your table,” said Alice; “it’s laid for a great many more than three.”",
      "“Your hair wants cutting,” said the Hatter. He had been looking at Alice for some time with great curiosity, and this was his first speech.",
      "“You should learn not to make personal remarks,” Alice said with some severity; “it’s very rude.”",
      "The Hatter opened his eyes very wide on hearing this; but all he said was, “Why is a raven like a writing-desk?”",
      "“Come, we shall have some fun now!” thought Alice. “I’m glad they’ve begun asking riddles.-I believe I can guess that,” she added aloud.",
      "“Do you mean that you think you can find out the answer to it?” said the March Hare.",
      "“Exactly so,” said Alice.",
      "“Then you should say what you mean,” the March Hare went on.",
      "“I do,” Alice hastily replied; “at least-at least I mean what I say-that’s the same thing, you know.”",
      "“Not the same thing a bit!” said the Hatter. “You might just as well say that ‘I see what I eat’ is the same thing as ‘I eat what I see’!”",
      "“You might just as well say,” added the March Hare, “that ‘I like what I get’ is the same thing as ‘I get what I like’!”",
      "“You might just as well say,” added the Dormouse, who seemed to be talking in his sleep, “that ‘I breathe when I sleep’ is the same thing as ‘I sleep when I breathe’!”",
      "“It is the same thing with you,” said the Hatter, and here the conversation dropped, and the party sat silent for a minute, while Alice thought over all she could remember about ravens and writing-desks, which wasn’t much.",
      "The Hatter was the first to break the silence. “What day of the month is it?” he said, turning to Alice: he had taken his watch out of his pocket, and was looking at it uneasily, shaking it every now and then, and holding it to his ear.",
      "Alice considered a little, and then said “The fourth.”",
      "“Two days wrong!” sighed the Hatter. “I told you butter wouldn’t suit the works!” he added looking angrily at the March Hare.",
      "“It was the best butter,” the March Hare meekly replied.",
      "“Yes, but some crumbs must have got in as well,” the Hatter grumbled: “you shouldn’t have put it in with the bread-knife.”",
      "The March Hare took the watch and looked at it gloomily: then he dipped it into his cup of tea, and looked at it again: but he could think of nothing better to say than his first remark, “It was the best butter, you know.”",
      "Alice had been looking over his shoulder with some curiosity. “What a funny watch!” she remarked. “It tells the day of the month, and doesn’t tell what o’clock it is!”",
      "“Why should it?” muttered the Hatter. “Does your watch tell you what year it is?”",
      "“Of course not,” Alice replied very readily: “but that’s because it stays the same year for such a long time together.”",
      "“Which is just the case with mine,” said the Hatter.",
      "Alice felt dreadfully puzzled, The Hatter’s remark seemed to have no sort of meaning in it, and yet it was certainly English. “I don’t quite understand you,” she said, as politely as she could.",
      "“The Dormouse is asleep again,” said the Hatter, and he poured a little hot tea upon its nose.",
      "The Dormouse shook its head impatiently, and said, without opening its eyes, “Of course, of course; just what I was going to remark myself.”",
      "“Have you guessed the riddle yet?” the Hatter said, turning to Alice again.",
      "“No, I give it up,” Alice replied: “what’s the answer?”",
      "“I haven’t the slightest idea,” said the Hatter.",
      "“Nor I,” said the March Hare.",
      "Alice sighed wearily. “I think you might do something better with the time,” she said, “than waste it in asking riddles that have no answers.”",
      "“If you knew Time as well as I do,” said the Hatter, “you wouldn’t talk about wasting it. It’s him.”",
      "“I don’t know what you mean,” said Alice.",
      "“Of course you don’t!” the Hatter said, tossing his head contemptuously. “I dare say you never even spoke to Time!”",
      "“Perhaps not,” Alice cautiously replied: “but I know I have to beat time when I learn music.”",
      "“Ah! that accounts for it,” said the Hatter. “He won’t stand beating. Now, if you only kept on good terms with him, he’d do almost anything you liked with the clock. For instance, suppose it were nine o’clock in the morning, just time to begin lessons: you’d only have to whisper a hint to Time, and round goes the clock in a twinkling! Half-past one, time for dinner!”",
      "(“I only wish it was,” the March Hare said to itself in a whisper.)",
      "“That would be grand, certainly,” said Alice thoughtfully: “but then-I shouldn’t be hungry for it, you know.”",
      "“Not at first, perhaps,” said the Hatter: “but you could keep it to half-past one as long as you liked.”",
      "“Is that the way you manage?” Alice asked.",
      "The Hatter shook his head mournfully. “Not I!” he replied. “We quarrelled last March-just before he went mad, you know-” (pointing with his tea spoon at the March Hare,) “-it was at the great concert given by the Queen of Hearts, and I had to sing",
      "‘Twinkle, twinkle, little bat! How I wonder what you’re at!’",
      "You know the song, perhaps?”",
      "“I’ve heard something like it,” said Alice.",
      "“It goes on, you know,” the Hatter continued, “in this way:-",
      "‘Up above the world you fly, Like a tea-tray in the sky. Twinkle, twinkle-’”",
      "Here the Dormouse shook itself, and began singing in its sleep “Twinkle, twinkle, twinkle, twinkle-” and went on so long that they had to pinch it to make it stop.",
      "“Well, I’d hardly finished the first verse,” said the Hatter, “when the Queen jumped up and bawled out, ‘He’s murdering the time! Off with his head!’”",
      "“How dreadfully savage!” exclaimed Alice.",
      "“And ever since that,” the Hatter went on in a mournful tone, “he won’t do a thing I ask! It’s always six o’clock now.”",
      "A bright idea came into Alice’s head. “Is that the reason so many tea-things are put out here?” she asked.",
      "“Yes, that’s it,” said the Hatter with a sigh: “it’s always tea-time, and we’ve no time to wash the things between whiles.”",
      "“Then you keep moving round, I suppose?” said Alice.",
      "“Exactly so,” said the Hatter: “as the things get used up.”",
      "“But what happens when you come to the beginning again?” Alice ventured to ask.",
      "“Suppose we change the subject,” the March Hare interrupted, yawning. “I’m getting tired of this. I vote the young lady tells us a story.”",
      "“I’m afraid I don’t know one,” said Alice, rather alarmed at the proposal.",
      "“Then the Dormouse shall!” they both cried. “Wake up, Dormouse!” And they pinched it on both sides at once.",
      "The Dormouse slowly opened his eyes. “I wasn’t asleep,” he said in a hoarse, feeble voice: “I heard every word you fellows were saying.”",
      "“Tell us a story!” said the March Hare.",
      "“Yes, please do!” pleaded Alice.",
      "“And be quick about it,” added the Hatter, “or you’ll be asleep again before it’s done.”",
      "“Once upon a time there were three little sisters,” the Dormouse began in a great hurry; “and their names were Elsie, Lacie, and Tillie; and they lived at the bottom of a well-”",
      "“What did they live on?” said Alice, who always took a great interest in questions of eating and drinking.",
      "“They lived on treacle,” said the Dormouse, after thinking a minute or two.",
      "“They couldn’t have done that, you know,” Alice gently remarked; “they’d have been ill.”",
      "“So they were,” said the Dormouse; “very ill.”",
      "Alice tried to fancy to herself what such an extraordinary way of living would be like, but it puzzled her too much, so she went on: “But why did they live at the bottom of a well?”",
      "“Take some more tea,” the March Hare said to Alice, very earnestly.",
      "“I’ve had nothing yet,” Alice replied in an offended tone, “so I can’t take more.”",
      "“You mean you can’t take less,” said the Hatter: “it’s very easy to take more than nothing.”",
      "“Nobody asked your opinion,” said Alice.",
      "“Who’s making personal remarks now?” the Hatter asked triumphantly.",
      "Alice did not quite know what to say to this: so she helped herself to some tea and bread-and-butter, and then turned to the Dormouse, and repeated her question. “Why did they live at the bottom of a well?”",
      "The Dormouse again took a minute or two to think about it, and then said, “It was a treacle-well.”",
      "“There’s no such thing!” Alice was beginning very angrily, but the Hatter and the March Hare went “Sh! sh!” and the Dormouse sulkily remarked, “If you can’t be civil, you’d better finish the story for yourself.”",
      "“No, please go on!” Alice said very humbly; “I won’t interrupt again. I dare say there may be one.”",
      "“One, indeed!” said the Dormouse indignantly. However, he consented to go on. “And so these three little sisters-they were learning to draw, you know-”",
      "“What did they draw?” said Alice, quite forgetting her promise.",
      "“Treacle,” said the Dormouse, without considering at all this time.",
      "“I want a clean cup,” interrupted the Hatter: “let’s all move one place on.”",
      "He moved on as he spoke, and the Dormouse followed him: the March Hare moved into the Dormouse’s place, and Alice rather unwillingly took the place of the March Hare. The Hatter was the only one who got any advantage from the change: and Alice was a good deal worse off than before, as the March Hare had just upset the milk-jug into his plate.",
      "Alice did not wish to offend the Dormouse again, so she began very cautiously: “But I don’t understand. Where did they draw the treacle from?”",
      "“You can draw water out of a water-well,” said the Hatter; “so I should think you could draw treacle out of a treacle-well-eh, stupid?”",
      "“But they were in the well,” Alice said to the Dormouse, not choosing to notice this last remark.",
      "“Of course they were,” said the Dormouse; “-well in.”",
      "This answer so confused poor Alice, that she let the Dormouse go on for some time without interrupting it.",
      "“They were learning to draw,” the Dormouse went on, yawning and rubbing its eyes, for it was getting very sleepy; “and they drew all manner of things-everything that begins with an M-”",
      "“Why with an M?” said Alice.",
      "“Why not?” said the March Hare.",
      "Alice was silent.",
      "The Dormouse had closed its eyes by this time, and was going off into a doze; but, on being pinched by the Hatter, it woke up again with a little shriek, and went on: “-that begins with an M, such as mouse-traps, and the moon, and memory, and muchness-you know you say things are “much of a muchness”-did you ever see such a thing as a drawing of a muchness?”",
      "“Really, now you ask me,” said Alice, very much confused, “I don’t think-”",
      "“Then you shouldn’t talk,” said the Hatter.",
      "This piece of rudeness was more than Alice could bear: she got up in great disgust, and walked off; the Dormouse fell asleep instantly, and neither of the others took the least notice of her going, though she looked back once or twice, half hoping that they would call after her: the last time she saw them, they were trying to put the Dormouse into the teapot.",
      "“At any rate I’ll never go there again!” said Alice as she picked her way through the wood. “It’s the stupidest tea-party I ever was at in all my life!”",
      "Just as she said this, she noticed that one of the trees had a door leading right into it. “That’s very curious!” she thought. “But everything’s curious today. I think I may as well go in at once.” And in she went.",
      "Once more she found herself in the long hall, and close to the little glass table. “Now, I’ll manage better this time,” she said to herself, and began by taking the little golden key, and unlocking the door that led into the garden. Then she went to work nibbling at the mushroom (she had kept a piece of it in her pocket) till she was about a foot high: then she walked down the little passage: and then-she found herself at last in the beautiful garden, among the bright flower-beds and the cool fountains.",
    ],
  },
  {
    number: 'VIII',
    title: "The Queen’s Croquet-Ground",
    paragraphs: [
      "A large rose-tree stood near the entrance of the garden: the roses growing on it were white, but there were three gardeners at it, busily painting them red. Alice thought this a very curious thing, and she went nearer to watch them, and just as she came up to them she heard one of them say, “Look out now, Five! Don’t go splashing paint over me like that!”",
      "“I couldn’t help it,” said Five, in a sulky tone; “Seven jogged my elbow.”",
      "On which Seven looked up and said, “That’s right, Five! Always lay the blame on others!”",
      "“You’d better not talk!” said Five. “I heard the Queen say only yesterday you deserved to be beheaded!”",
      "“What for?” said the one who had spoken first.",
      "“That’s none of your business, Two!” said Seven.",
      "“Yes, it is his business!” said Five, “and I’ll tell him-it was for bringing the cook tulip-roots instead of onions.”",
      "Seven flung down his brush, and had just begun “Well, of all the unjust things-” when his eye chanced to fall upon Alice, as she stood watching them, and he checked himself suddenly: the others looked round also, and all of them bowed low.",
      "“Would you tell me,” said Alice, a little timidly, “why you are painting those roses?”",
      "Five and Seven said nothing, but looked at Two. Two began in a low voice, “Why the fact is, you see, Miss, this here ought to have been a red rose-tree, and we put a white one in by mistake; and if the Queen was to find it out, we should all have our heads cut off, you know. So you see, Miss, we’re doing our best, afore she comes, to-” At this moment Five, who had been anxiously looking across the garden, called out “The Queen! The Queen!” and the three gardeners instantly threw themselves flat upon their faces. There was a sound of many footsteps, and Alice looked round, eager to see the Queen.",
      "First came ten soldiers carrying clubs; these were all shaped like the three gardeners, oblong and flat, with their hands and feet at the corners: next the ten courtiers; these were ornamented all over with diamonds, and walked two and two, as the soldiers did. After these came the royal children; there were ten of them, and the little dears came jumping merrily along hand in hand, in couples: they were all ornamented with hearts. Next came the guests, mostly Kings and Queens, and among them Alice recognised the White Rabbit: it was talking in a hurried nervous manner, smiling at everything that was said, and went by without noticing her. Then followed the Knave of Hearts, carrying the King’s crown on a crimson velvet cushion; and, last of all this grand procession, came THE KING AND QUEEN OF HEARTS.",
      "Alice was rather doubtful whether she ought not to lie down on her face like the three gardeners, but she could not remember ever having heard of such a rule at processions; “and besides, what would be the use of a procession,” thought she, “if people had all to lie down upon their faces, so that they couldn’t see it?” So she stood still where she was, and waited.",
      "When the procession came opposite to Alice, they all stopped and looked at her, and the Queen said severely “Who is this?” She said it to the Knave of Hearts, who only bowed and smiled in reply.",
      "“Idiot!” said the Queen, tossing her head impatiently; and, turning to Alice, she went on, “What’s your name, child?”",
      "“My name is Alice, so please your Majesty,” said Alice very politely; but she added, to herself, “Why, they’re only a pack of cards, after all. I needn’t be afraid of them!”",
      "“And who are these?” said the Queen, pointing to the three gardeners who were lying round the rose-tree; for, you see, as they were lying on their faces, and the pattern on their backs was the same as the rest of the pack, she could not tell whether they were gardeners, or soldiers, or courtiers, or three of her own children.",
      "“How should I know?” said Alice, surprised at her own courage. “It’s no business of mine.”",
      "The Queen turned crimson with fury, and, after glaring at her for a moment like a wild beast, screamed “Off with her head! Off-”",
      "“Nonsense!” said Alice, very loudly and decidedly, and the Queen was silent.",
      "The King laid his hand upon her arm, and timidly said “Consider, my dear: she is only a child!”",
      "The Queen turned angrily away from him, and said to the Knave “Turn them over!”",
      "The Knave did so, very carefully, with one foot.",
      "“Get up!” said the Queen, in a shrill, loud voice, and the three gardeners instantly jumped up, and began bowing to the King, the Queen, the royal children, and everybody else.",
      "“Leave off that!” screamed the Queen. “You make me giddy.” And then, turning to the rose-tree, she went on, “What have you been doing here?”",
      "“May it please your Majesty,” said Two, in a very humble tone, going down on one knee as he spoke, “we were trying-”",
      "“I see!” said the Queen, who had meanwhile been examining the roses. “Off with their heads!” and the procession moved on, three of the soldiers remaining behind to execute the unfortunate gardeners, who ran to Alice for protection.",
      "“You shan’t be beheaded!” said Alice, and she put them into a large flower-pot that stood near. The three soldiers wandered about for a minute or two, looking for them, and then quietly marched off after the others.",
      "“Are their heads off?” shouted the Queen.",
      "“Their heads are gone, if it please your Majesty!” the soldiers shouted in reply.",
      "“That’s right!” shouted the Queen. “Can you play croquet?”",
      "The soldiers were silent, and looked at Alice, as the question was evidently meant for her.",
      "“Yes!” shouted Alice.",
      "“Come on, then!” roared the Queen, and Alice joined the procession, wondering very much what would happen next.",
      "“It’s-it’s a very fine day!” said a timid voice at her side. She was walking by the White Rabbit, who was peeping anxiously into her face.",
      "“Very,” said Alice: “-where’s the Duchess?”",
      "“Hush! Hush!” said the Rabbit in a low, hurried tone. He looked anxiously over his shoulder as he spoke, and then raised himself upon tiptoe, put his mouth close to her ear, and whispered “She’s under sentence of execution.”",
      "“What for?” said Alice.",
      "“Did you say ‘What a pity!’?” the Rabbit asked.",
      "“No, I didn’t,” said Alice: “I don’t think it’s at all a pity. I said ‘What for?’”",
      "“She boxed the Queen’s ears-” the Rabbit began. Alice gave a little scream of laughter. “Oh, hush!” the Rabbit whispered in a frightened tone. “The Queen will hear you! You see, she came rather late, and the Queen said-”",
      "“Get to your places!” shouted the Queen in a voice of thunder, and people began running about in all directions, tumbling up against each other; however, they got settled down in a minute or two, and the game began. Alice thought she had never seen such a curious croquet-ground in her life; it was all ridges and furrows; the balls were live hedgehogs, the mallets live flamingoes, and the soldiers had to double themselves up and to stand on their hands and feet, to make the arches.",
      "The chief difficulty Alice found at first was in managing her flamingo: she succeeded in getting its body tucked away, comfortably enough, under her arm, with its legs hanging down, but generally, just as she had got its neck nicely straightened out, and was going to give the hedgehog a blow with its head, it would twist itself round and look up in her face, with such a puzzled expression that she could not help bursting out laughing: and when she had got its head down, and was going to begin again, it was very provoking to find that the hedgehog had unrolled itself, and was in the act of crawling away: besides all this, there was generally a ridge or furrow in the way wherever she wanted to send the hedgehog to, and, as the doubled-up soldiers were always getting up and walking off to other parts of the ground, Alice soon came to the conclusion that it was a very difficult game indeed.",
      "The players all played at once without waiting for turns, quarrelling all the while, and fighting for the hedgehogs; and in a very short time the Queen was in a furious passion, and went stamping about, and shouting “Off with his head!” or “Off with her head!” about once in a minute.",
      "Alice began to feel very uneasy: to be sure, she had not as yet had any dispute with the Queen, but she knew that it might happen any minute, “and then,” thought she, “what would become of me? They’re dreadfully fond of beheading people here; the great wonder is, that there’s any one left alive!”",
      "She was looking about for some way of escape, and wondering whether she could get away without being seen, when she noticed a curious appearance in the air: it puzzled her very much at first, but, after watching it a minute or two, she made it out to be a grin, and she said to herself “It’s the Cheshire Cat: now I shall have somebody to talk to.”",
      "“How are you getting on?” said the Cat, as soon as there was mouth enough for it to speak with.",
      "Alice waited till the eyes appeared, and then nodded. “It’s no use speaking to it,” she thought, “till its ears have come, or at least one of them.” In another minute the whole head appeared, and then Alice put down her flamingo, and began an account of the game, feeling very glad she had someone to listen to her. The Cat seemed to think that there was enough of it now in sight, and no more of it appeared.",
      "“I don’t think they play at all fairly,” Alice began, in rather a complaining tone, “and they all quarrel so dreadfully one can’t hear oneself speak-and they don’t seem to have any rules in particular; at least, if there are, nobody attends to them-and you’ve no idea how confusing it is all the things being alive; for instance, there’s the arch I’ve got to go through next walking about at the other end of the ground-and I should have croqueted the Queen’s hedgehog just now, only it ran away when it saw mine coming!”",
      "“How do you like the Queen?” said the Cat in a low voice.",
      "“Not at all,” said Alice: “she’s so extremely-” Just then she noticed that the Queen was close behind her, listening: so she went on, “-likely to win, that it’s hardly worth while finishing the game.”",
      "The Queen smiled and passed on.",
      "“Who are you talking to?” said the King, going up to Alice, and looking at the Cat’s head with great curiosity.",
      "“It’s a friend of mine-a Cheshire Cat,” said Alice: “allow me to introduce it.”",
      "“I don’t like the look of it at all,” said the King: “however, it may kiss my hand if it likes.”",
      "“I’d rather not,” the Cat remarked.",
      "“Don’t be impertinent,” said the King, “and don’t look at me like that!” He got behind Alice as he spoke.",
      "“A cat may look at a king,” said Alice. “I’ve read that in some book, but I don’t remember where.”",
      "“Well, it must be removed,” said the King very decidedly, and he called the Queen, who was passing at the moment, “My dear! I wish you would have this cat removed!”",
      "The Queen had only one way of settling all difficulties, great or small. “Off with his head!” she said, without even looking round.",
      "“I’ll fetch the executioner myself,” said the King eagerly, and he hurried off.",
      "Alice thought she might as well go back, and see how the game was going on, as she heard the Queen’s voice in the distance, screaming with passion. She had already heard her sentence three of the players to be executed for having missed their turns, and she did not like the look of things at all, as the game was in such confusion that she never knew whether it was her turn or not. So she went in search of her hedgehog.",
      "The hedgehog was engaged in a fight with another hedgehog, which seemed to Alice an excellent opportunity for croqueting one of them with the other: the only difficulty was, that her flamingo was gone across to the other side of the garden, where Alice could see it trying in a helpless sort of way to fly up into a tree.",
      "By the time she had caught the flamingo and brought it back, the fight was over, and both the hedgehogs were out of sight: “but it doesn’t matter much,” thought Alice, “as all the arches are gone from this side of the ground.” So she tucked it away under her arm, that it might not escape again, and went back for a little more conversation with her friend.",
      "When she got back to the Cheshire Cat, she was surprised to find quite a large crowd collected round it: there was a dispute going on between the executioner, the King, and the Queen, who were all talking at once, while all the rest were quite silent, and looked very uncomfortable.",
      "The moment Alice appeared, she was appealed to by all three to settle the question, and they repeated their arguments to her, though, as they all spoke at once, she found it very hard indeed to make out exactly what they said.",
      "The executioner’s argument was, that you couldn’t cut off a head unless there was a body to cut it off from: that he had never had to do such a thing before, and he wasn’t going to begin at his time of life.",
      "The King’s argument was, that anything that had a head could be beheaded, and that you weren’t to talk nonsense.",
      "The Queen’s argument was, that if something wasn’t done about it in less than no time she’d have everybody executed, all round. (It was this last remark that had made the whole party look so grave and anxious.)",
      "Alice could think of nothing else to say but “It belongs to the Duchess: you’d better ask her about it.”",
      "“She’s in prison,” the Queen said to the executioner: “fetch her here.” And the executioner went off like an arrow.",
      "The Cat’s head began fading away the moment he was gone, and, by the time he had come back with the Duchess, it had entirely disappeared; so the King and the executioner ran wildly up and down looking for it, while the rest of the party went back to the game.",
    ],
  },
  {
    number: 'IX',
    title: "The Mock Turtle’s Story",
    paragraphs: [
      "“You can’t think how glad I am to see you again, you dear old thing!” said the Duchess, as she tucked her arm affectionately into Alice’s, and they walked off together.",
      "Alice was very glad to find her in such a pleasant temper, and thought to herself that perhaps it was only the pepper that had made her so savage when they met in the kitchen.",
      "“When I’m a Duchess,” she said to herself, (not in a very hopeful tone though), “I won’t have any pepper in my kitchen at all. Soup does very well without-Maybe it’s always pepper that makes people hot-tempered,” she went on, very much pleased at having found out a new kind of rule, “and vinegar that makes them sour-and camomile that makes them bitter-and-and barley-sugar and such things that make children sweet-tempered. I only wish people knew that: then they wouldn’t be so stingy about it, you know-”",
      "She had quite forgotten the Duchess by this time, and was a little startled when she heard her voice close to her ear. “You’re thinking about something, my dear, and that makes you forget to talk. I can’t tell you just now what the moral of that is, but I shall remember it in a bit.”",
      "“Perhaps it hasn’t one,” Alice ventured to remark.",
      "“Tut, tut, child!” said the Duchess. “Everything’s got a moral, if only you can find it.” And she squeezed herself up closer to Alice’s side as she spoke.",
      "Alice did not much like keeping so close to her: first, because the Duchess was very ugly; and secondly, because she was exactly the right height to rest her chin upon Alice’s shoulder, and it was an uncomfortably sharp chin. However, she did not like to be rude, so she bore it as well as she could.",
      "“The game’s going on rather better now,” she said, by way of keeping up the conversation a little.",
      "“’Tis so,” said the Duchess: “and the moral of that is-‘Oh, ’tis love, ’tis love, that makes the world go round!’”",
      "“Somebody said,” Alice whispered, “that it’s done by everybody minding their own business!”",
      "“Ah, well! It means much the same thing,” said the Duchess, digging her sharp little chin into Alice’s shoulder as she added, “and the moral of that is-‘Take care of the sense, and the sounds will take care of themselves.’”",
      "“How fond she is of finding morals in things!” Alice thought to herself.",
      "“I dare say you’re wondering why I don’t put my arm round your waist,” the Duchess said after a pause: “the reason is, that I’m doubtful about the temper of your flamingo. Shall I try the experiment?”",
      "“He might bite,” Alice cautiously replied, not feeling at all anxious to have the experiment tried.",
      "“Very true,” said the Duchess: “flamingoes and mustard both bite. And the moral of that is-‘Birds of a feather flock together.’”",
      "“Only mustard isn’t a bird,” Alice remarked.",
      "“Right, as usual,” said the Duchess: “what a clear way you have of putting things!”",
      "“It’s a mineral, I think,” said Alice.",
      "“Of course it is,” said the Duchess, who seemed ready to agree to everything that Alice said; “there’s a large mustard-mine near here. And the moral of that is-‘The more there is of mine, the less there is of yours.’”",
      "“Oh, I know!” exclaimed Alice, who had not attended to this last remark, “it’s a vegetable. It doesn’t look like one, but it is.”",
      "“I quite agree with you,” said the Duchess; “and the moral of that is-‘Be what you would seem to be’-or if you’d like it put more simply-‘Never imagine yourself not to be otherwise than what it might appear to others that what you were or might have been was not otherwise than what you had been would have appeared to them to be otherwise.’”",
      "“I think I should understand that better,” Alice said very politely, “if I had it written down: but I can’t quite follow it as you say it.”",
      "“That’s nothing to what I could say if I chose,” the Duchess replied, in a pleased tone.",
      "“Pray don’t trouble yourself to say it any longer than that,” said Alice.",
      "“Oh, don’t talk about trouble!” said the Duchess. “I make you a present of everything I’ve said as yet.”",
      "“A cheap sort of present!” thought Alice. “I’m glad they don’t give birthday presents like that!” But she did not venture to say it out loud.",
      "“Thinking again?” the Duchess asked, with another dig of her sharp little chin.",
      "“I’ve a right to think,” said Alice sharply, for she was beginning to feel a little worried.",
      "“Just about as much right,” said the Duchess, “as pigs have to fly; and the m-”",
      "But here, to Alice’s great surprise, the Duchess’s voice died away, even in the middle of her favourite word ‘moral,’ and the arm that was linked into hers began to tremble. Alice looked up, and there stood the Queen in front of them, with her arms folded, frowning like a thunderstorm.",
      "“A fine day, your Majesty!” the Duchess began in a low, weak voice.",
      "“Now, I give you fair warning,” shouted the Queen, stamping on the ground as she spoke; “either you or your head must be off, and that in about half no time! Take your choice!”",
      "The Duchess took her choice, and was gone in a moment.",
      "“Let’s go on with the game,” the Queen said to Alice; and Alice was too much frightened to say a word, but slowly followed her back to the croquet-ground.",
      "The other guests had taken advantage of the Queen’s absence, and were resting in the shade: however, the moment they saw her, they hurried back to the game, the Queen merely remarking that a moment’s delay would cost them their lives.",
      "All the time they were playing the Queen never left off quarrelling with the other players, and shouting “Off with his head!” or “Off with her head!” Those whom she sentenced were taken into custody by the soldiers, who of course had to leave off being arches to do this, so that by the end of half an hour or so there were no arches left, and all the players, except the King, the Queen, and Alice, were in custody and under sentence of execution.",
      "Then the Queen left off, quite out of breath, and said to Alice, “Have you seen the Mock Turtle yet?”",
      "“No,” said Alice. “I don’t even know what a Mock Turtle is.”",
      "“It’s the thing Mock Turtle Soup is made from,” said the Queen.",
      "“I never saw one, or heard of one,” said Alice.",
      "“Come on, then,” said the Queen, “and he shall tell you his history.”",
      "As they walked off together, Alice heard the King say in a low voice, to the company generally, “You are all pardoned.” “Come, that’s a good thing!” she said to herself, for she had felt quite unhappy at the number of executions the Queen had ordered.",
      "They very soon came upon a Gryphon, lying fast asleep in the sun. (If you don’t know what a Gryphon is, look at the picture.) “Up, lazy thing!” said the Queen, “and take this young lady to see the Mock Turtle, and to hear his history. I must go back and see after some executions I have ordered;” and she walked off, leaving Alice alone with the Gryphon. Alice did not quite like the look of the creature, but on the whole she thought it would be quite as safe to stay with it as to go after that savage Queen: so she waited.",
      "The Gryphon sat up and rubbed its eyes: then it watched the Queen till she was out of sight: then it chuckled. “What fun!” said the Gryphon, half to itself, half to Alice.",
      "“What is the fun?” said Alice.",
      "“Why, she,” said the Gryphon. “It’s all her fancy, that: they never executes nobody, you know. Come on!”",
      "“Everybody says ‘come on!’ here,” thought Alice, as she went slowly after it: “I never was so ordered about in all my life, never!”",
      "They had not gone far before they saw the Mock Turtle in the distance, sitting sad and lonely on a little ledge of rock, and, as they came nearer, Alice could hear him sighing as if his heart would break. She pitied him deeply. “What is his sorrow?” she asked the Gryphon, and the Gryphon answered, very nearly in the same words as before, “It’s all his fancy, that: he hasn’t got no sorrow, you know. Come on!”",
      "So they went up to the Mock Turtle, who looked at them with large eyes full of tears, but said nothing.",
      "“This here young lady,” said the Gryphon, “she wants for to know your history, she do.”",
      "“I’ll tell it her,” said the Mock Turtle in a deep, hollow tone: “sit down, both of you, and don’t speak a word till I’ve finished.”",
      "So they sat down, and nobody spoke for some minutes. Alice thought to herself, “I don’t see how he can ever finish, if he doesn’t begin.” But she waited patiently.",
      "“Once,” said the Mock Turtle at last, with a deep sigh, “I was a real Turtle.”",
      "These words were followed by a very long silence, broken only by an occasional exclamation of “Hjckrrh!” from the Gryphon, and the constant heavy sobbing of the Mock Turtle. Alice was very nearly getting up and saying, “Thank you, sir, for your interesting story,” but she could not help thinking there must be more to come, so she sat still and said nothing.",
      "“When we were little,” the Mock Turtle went on at last, more calmly, though still sobbing a little now and then, “we went to school in the sea. The master was an old Turtle-we used to call him Tortoise-”",
      "“Why did you call him Tortoise, if he wasn’t one?” Alice asked.",
      "“We called him Tortoise because he taught us,” said the Mock Turtle angrily: “really you are very dull!”",
      "“You ought to be ashamed of yourself for asking such a simple question,” added the Gryphon; and then they both sat silent and looked at poor Alice, who felt ready to sink into the earth. At last the Gryphon said to the Mock Turtle, “Drive on, old fellow! Don’t be all day about it!” and he went on in these words:",
      "“Yes, we went to school in the sea, though you mayn’t believe it-”",
      "“I never said I didn’t!” interrupted Alice.",
      "“You did,” said the Mock Turtle.",
      "“Hold your tongue!” added the Gryphon, before Alice could speak again. The Mock Turtle went on.",
      "“We had the best of educations-in fact, we went to school every day-”",
      "“I’ve been to a day-school, too,” said Alice; “you needn’t be so proud as all that.”",
      "“With extras?” asked the Mock Turtle a little anxiously.",
      "“Yes,” said Alice, “we learned French and music.”",
      "“And washing?” said the Mock Turtle.",
      "“Certainly not!” said Alice indignantly.",
      "“Ah! then yours wasn’t a really good school,” said the Mock Turtle in a tone of great relief. “Now at ours they had at the end of the bill, ‘French, music, and washing-extra.’”",
      "“You couldn’t have wanted it much,” said Alice; “living at the bottom of the sea.”",
      "“I couldn’t afford to learn it.” said the Mock Turtle with a sigh. “I only took the regular course.”",
      "“What was that?” inquired Alice.",
      "“Reeling and Writhing, of course, to begin with,” the Mock Turtle replied; “and then the different branches of Arithmetic-Ambition, Distraction, Uglification, and Derision.”",
      "“I never heard of ‘Uglification,’” Alice ventured to say. “What is it?”",
      "The Gryphon lifted up both its paws in surprise. “What! Never heard of uglifying!” it exclaimed. “You know what to beautify is, I suppose?”",
      "“Yes,” said Alice doubtfully: “it means-to-make-anything-prettier.”",
      "“Well, then,” the Gryphon went on, “if you don’t know what to uglify is, you are a simpleton.”",
      "Alice did not feel encouraged to ask any more questions about it, so she turned to the Mock Turtle, and said “What else had you to learn?”",
      "“Well, there was Mystery,” the Mock Turtle replied, counting off the subjects on his flappers, “-Mystery, ancient and modern, with Seaography: then Drawling-the Drawling-master was an old conger-eel, that used to come once a week: he taught us Drawling, Stretching, and Fainting in Coils.”",
      "“What was that like?” said Alice.",
      "“Well, I can’t show it you myself,” the Mock Turtle said: “I’m too stiff. And the Gryphon never learnt it.”",
      "“Hadn’t time,” said the Gryphon: “I went to the Classics master, though. He was an old crab, he was.”",
      "“I never went to him,” the Mock Turtle said with a sigh: “he taught Laughing and Grief, they used to say.”",
      "“So he did, so he did,” said the Gryphon, sighing in his turn; and both creatures hid their faces in their paws.",
      "“And how many hours a day did you do lessons?” said Alice, in a hurry to change the subject.",
      "“Ten hours the first day,” said the Mock Turtle: “nine the next, and so on.”",
      "“What a curious plan!” exclaimed Alice.",
      "“That’s the reason they’re called lessons,” the Gryphon remarked: “because they lessen from day to day.”",
      "This was quite a new idea to Alice, and she thought it over a little before she made her next remark. “Then the eleventh day must have been a holiday?”",
      "“Of course it was,” said the Mock Turtle.",
      "“And how did you manage on the twelfth?” Alice went on eagerly.",
      "“That’s enough about lessons,” the Gryphon interrupted in a very decided tone: “tell her something about the games now.”",
    ],
  },
  {
    number: 'X',
    title: "The Lobster Quadrille",
    paragraphs: [
      "The Mock Turtle sighed deeply, and drew the back of one flapper across his eyes. He looked at Alice, and tried to speak, but for a minute or two sobs choked his voice. “Same as if he had a bone in his throat,” said the Gryphon: and it set to work shaking him and punching him in the back. At last the Mock Turtle recovered his voice, and, with tears running down his cheeks, he went on again:-",
      "“You may not have lived much under the sea-” (“I haven’t,” said Alice)-“and perhaps you were never even introduced to a lobster-” (Alice began to say “I once tasted-” but checked herself hastily, and said “No, never”) “-so you can have no idea what a delightful thing a Lobster Quadrille is!”",
      "“No, indeed,” said Alice. “What sort of a dance is it?”",
      "“Why,” said the Gryphon, “you first form into a line along the sea-shore-”",
      "“Two lines!” cried the Mock Turtle. “Seals, turtles, salmon, and so on; then, when you’ve cleared all the jelly-fish out of the way-”",
      "“That generally takes some time,” interrupted the Gryphon.",
      "“-you advance twice-”",
      "“Each with a lobster as a partner!” cried the Gryphon.",
      "“Of course,” the Mock Turtle said: “advance twice, set to partners-”",
      "“-change lobsters, and retire in same order,” continued the Gryphon.",
      "“Then, you know,” the Mock Turtle went on, “you throw the-”",
      "“The lobsters!” shouted the Gryphon, with a bound into the air.",
      "“-as far out to sea as you can-”",
      "“Swim after them!” screamed the Gryphon.",
      "“Turn a somersault in the sea!” cried the Mock Turtle, capering wildly about.",
      "“Change lobsters again!” yelled the Gryphon at the top of its voice.",
      "“Back to land again, and that’s all the first figure,” said the Mock Turtle, suddenly dropping his voice; and the two creatures, who had been jumping about like mad things all this time, sat down again very sadly and quietly, and looked at Alice.",
      "“It must be a very pretty dance,” said Alice timidly.",
      "“Would you like to see a little of it?” said the Mock Turtle.",
      "“Very much indeed,” said Alice.",
      "“Come, let’s try the first figure!” said the Mock Turtle to the Gryphon. “We can do without lobsters, you know. Which shall sing?”",
      "“Oh, you sing,” said the Gryphon. “I’ve forgotten the words.”",
      "So they began solemnly dancing round and round Alice, every now and then treading on her toes when they passed too close, and waving their forepaws to mark the time, while the Mock Turtle sang this, very slowly and sadly:-",
      "“Will you walk a little faster?” said a whiting to a snail. “There’s a porpoise close behind us, and he’s treading on my tail. See how eagerly the lobsters and the turtles all advance! They are waiting on the shingle-will you come and join the dance? Will you, won’t you, will you, won’t you, will you join the dance? Will you, won’t you, will you, won’t you, won’t you join the dance?",
      "“You can really have no notion how delightful it will be When they take us up and throw us, with the lobsters, out to sea!” But the snail replied “Too far, too far!” and gave a look askance- Said he thanked the whiting kindly, but he would not join the dance. Would not, could not, would not, could not, would not join the dance. Would not, could not, would not, could not, could not join the dance.",
      "“What matters it how far we go?” his scaly friend replied. “There is another shore, you know, upon the other side. The further off from England the nearer is to France- Then turn not pale, beloved snail, but come and join the dance. Will you, won’t you, will you, won’t you, will you join the dance? Will you, won’t you, will you, won’t you, won’t you join the dance?”",
      "“Thank you, it’s a very interesting dance to watch,” said Alice, feeling very glad that it was over at last: “and I do so like that curious song about the whiting!”",
      "“Oh, as to the whiting,” said the Mock Turtle, “they-you’ve seen them, of course?”",
      "“Yes,” said Alice, “I’ve often seen them at dinn-” she checked herself hastily.",
      "“I don’t know where Dinn may be,” said the Mock Turtle, “but if you’ve seen them so often, of course you know what they’re like.”",
      "“I believe so,” Alice replied thoughtfully. “They have their tails in their mouths-and they’re all over crumbs.”",
      "“You’re wrong about the crumbs,” said the Mock Turtle: “crumbs would all wash off in the sea. But they have their tails in their mouths; and the reason is-” here the Mock Turtle yawned and shut his eyes.-“Tell her about the reason and all that,” he said to the Gryphon.",
      "“The reason is,” said the Gryphon, “that they would go with the lobsters to the dance. So they got thrown out to sea. So they had to fall a long way. So they got their tails fast in their mouths. So they couldn’t get them out again. That’s all.”",
      "“Thank you,” said Alice, “it’s very interesting. I never knew so much about a whiting before.”",
      "“I can tell you more than that, if you like,” said the Gryphon. “Do you know why it’s called a whiting?”",
      "“I never thought about it,” said Alice. “Why?”",
      "“It does the boots and shoes,” the Gryphon replied very solemnly.",
      "Alice was thoroughly puzzled. “Does the boots and shoes!” she repeated in a wondering tone.",
      "“Why, what are your shoes done with?” said the Gryphon. “I mean, what makes them so shiny?”",
      "Alice looked down at them, and considered a little before she gave her answer. “They’re done with blacking, I believe.”",
      "“Boots and shoes under the sea,” the Gryphon went on in a deep voice, “are done with a whiting. Now you know.”",
      "“And what are they made of?” Alice asked in a tone of great curiosity.",
      "“Soles and eels, of course,” the Gryphon replied rather impatiently: “any shrimp could have told you that.”",
      "“If I’d been the whiting,” said Alice, whose thoughts were still running on the song, “I’d have said to the porpoise, ‘Keep back, please: we don’t want you with us!’”",
      "“They were obliged to have him with them,” the Mock Turtle said: “no wise fish would go anywhere without a porpoise.”",
      "“Wouldn’t it really?” said Alice in a tone of great surprise.",
      "“Of course not,” said the Mock Turtle: “why, if a fish came to me, and told me he was going a journey, I should say ‘With what porpoise?’”",
      "“Don’t you mean ‘purpose’?” said Alice.",
      "“I mean what I say,” the Mock Turtle replied in an offended tone. And the Gryphon added “Come, let’s hear some of your adventures.”",
      "“I could tell you my adventures-beginning from this morning,” said Alice a little timidly: “but it’s no use going back to yesterday, because I was a different person then.”",
      "“Explain all that,” said the Mock Turtle.",
      "“No, no! The adventures first,” said the Gryphon in an impatient tone: “explanations take such a dreadful time.”",
      "So Alice began telling them her adventures from the time when she first saw the White Rabbit. She was a little nervous about it just at first, the two creatures got so close to her, one on each side, and opened their eyes and mouths so very wide, but she gained courage as she went on. Her listeners were perfectly quiet till she got to the part about her repeating “You are old, Father William,” to the Caterpillar, and the words all coming different, and then the Mock Turtle drew a long breath, and said “That’s very curious.”",
      "“It’s all about as curious as it can be,” said the Gryphon.",
      "“It all came different!” the Mock Turtle repeated thoughtfully. “I should like to hear her try and repeat something now. Tell her to begin.” He looked at the Gryphon as if he thought it had some kind of authority over Alice.",
      "“Stand up and repeat ‘’Tis the voice of the sluggard,’” said the Gryphon.",
      "“How the creatures order one about, and make one repeat lessons!” thought Alice; “I might as well be at school at once.” However, she got up, and began to repeat it, but her head was so full of the Lobster Quadrille, that she hardly knew what she was saying, and the words came very queer indeed:-",
      "“’Tis the voice of the Lobster; I heard him declare, “You have baked me too brown, I must sugar my hair.” As a duck with its eyelids, so he with his nose Trims his belt and his buttons, and turns out his toes.”",
      "“That’s different from what I used to say when I was a child,” said the Gryphon.",
      "“Well, I never heard it before,” said the Mock Turtle; “but it sounds uncommon nonsense.”",
      "Alice said nothing; she had sat down with her face in her hands, wondering if anything would ever happen in a natural way again.",
      "“I should like to have it explained,” said the Mock Turtle.",
      "“She can’t explain it,” said the Gryphon hastily. “Go on with the next verse.”",
      "“But about his toes?” the Mock Turtle persisted. “How could he turn them out with his nose, you know?”",
      "“It’s the first position in dancing.” Alice said; but was dreadfully puzzled by the whole thing, and longed to change the subject.",
      "“Go on with the next verse,” the Gryphon repeated impatiently: “it begins ‘I passed by his garden.’”",
      "Alice did not dare to disobey, though she felt sure it would all come wrong, and she went on in a trembling voice:-",
      "“I passed by his garden, and marked, with one eye, How the Owl and the Panther were sharing a pie-”",
      "“What is the use of repeating all that stuff,” the Mock Turtle interrupted, “if you don’t explain it as you go on? It’s by far the most confusing thing I ever heard!”",
      "“Yes, I think you’d better leave off,” said the Gryphon: and Alice was only too glad to do so.",
      "“Shall we try another figure of the Lobster Quadrille?” the Gryphon went on. “Or would you like the Mock Turtle to sing you a song?”",
      "“Oh, a song, please, if the Mock Turtle would be so kind,” Alice replied, so eagerly that the Gryphon said, in a rather offended tone, “Hm! No accounting for tastes! Sing her ‘Turtle Soup,’ will you, old fellow?”",
      "The Mock Turtle sighed deeply, and began, in a voice sometimes choked with sobs, to sing this:-",
      "“Beautiful Soup, so rich and green, Waiting in a hot tureen! Who for such dainties would not stoop? Soup of the evening, beautiful Soup! Soup of the evening, beautiful Soup! Beau-ootiful Soo-oop! Beau-ootiful Soo-oop! Soo-oop of the e-e-evening, Beautiful, beautiful Soup!",
      "“Beautiful Soup! Who cares for fish, Game, or any other dish? Who would not give all else for two p ennyworth only of beautiful Soup? Pennyworth only of beautiful Soup? Beau-ootiful Soo-oop! Beau-ootiful Soo-oop! Soo-oop of the e-e-evening, Beautiful, beauti-FUL SOUP!”",
      "“Chorus again!” cried the Gryphon, and the Mock Turtle had just begun to repeat it, when a cry of “The trial’s beginning!” was heard in the distance.",
      "“Come on!” cried the Gryphon, and, taking Alice by the hand, it hurried off, without waiting for the end of the song.",
      "“What trial is it?” Alice panted as she ran; but the Gryphon only answered “Come on!” and ran the faster, while more and more faintly came, carried on the breeze that followed them, the melancholy words:-",
      "“Soo-oop of the e-e-evening, Beautiful, beautiful Soup!”",
    ],
  },
  {
    number: 'XI',
    title: "Who Stole the Tarts?",
    paragraphs: [
      "The King and Queen of Hearts were seated on their throne when they arrived, with a great crowd assembled about them-all sorts of little birds and beasts, as well as the whole pack of cards: the Knave was standing before them, in chains, with a soldier on each side to guard him; and near the King was the White Rabbit, with a trumpet in one hand, and a scroll of parchment in the other. In the very middle of the court was a table, with a large dish of tarts upon it: they looked so good, that it made Alice quite hungry to look at them-“I wish they’d get the trial done,” she thought, “and hand round the refreshments!” But there seemed to be no chance of this, so she began looking at everything about her, to pass away the time.",
      "Alice had never been in a court of justice before, but she had read about them in books, and she was quite pleased to find that she knew the name of nearly everything there. “That’s the judge,” she said to herself, “because of his great wig.”",
      "The judge, by the way, was the King; and as he wore his crown over the wig, (look at the frontispiece if you want to see how he did it,) he did not look at all comfortable, and it was certainly not becoming.",
      "“And that’s the jury-box,” thought Alice, “and those twelve creatures,” (she was obliged to say “creatures,” you see, because some of them were animals, and some were birds,) “I suppose they are the jurors.” She said this last word two or three times over to herself, being rather proud of it: for she thought, and rightly too, that very few little girls of her age knew the meaning of it at all. However, “jury-men” would have done just as well.",
      "The twelve jurors were all writing very busily on slates. “What are they doing?” Alice whispered to the Gryphon. “They can’t have anything to put down yet, before the trial’s begun.”",
      "“They’re putting down their names,” the Gryphon whispered in reply, “for fear they should forget them before the end of the trial.”",
      "“Stupid things!” Alice began in a loud, indignant voice, but she stopped hastily, for the White Rabbit cried out, “Silence in the court!” and the King put on his spectacles and looked anxiously round, to make out who was talking.",
      "Alice could see, as well as if she were looking over their shoulders, that all the jurors were writing down “stupid things!” on their slates, and she could even make out that one of them didn’t know how to spell “stupid,” and that he had to ask his neighbour to tell him. “A nice muddle their slates’ll be in before the trial’s over!” thought Alice.",
      "One of the jurors had a pencil that squeaked. This of course, Alice could not stand, and she went round the court and got behind him, and very soon found an opportunity of taking it away. She did it so quickly that the poor little juror (it was Bill, the Lizard) could not make out at all what had become of it; so, after hunting all about for it, he was obliged to write with one finger for the rest of the day; and this was of very little use, as it left no mark on the slate.",
      "“Herald, read the accusation!” said the King.",
      "On this the White Rabbit blew three blasts on the trumpet, and then unrolled the parchment scroll, and read as follows:-",
      "“The Queen of Hearts, she made some tarts, All on a summer day: The Knave of Hearts, he stole those tarts, And took them quite away!”",
      "“Consider your verdict,” the King said to the jury.",
      "“Not yet, not yet!” the Rabbit hastily interrupted. “There’s a great deal to come before that!”",
      "“Call the first witness,” said the King; and the White Rabbit blew three blasts on the trumpet, and called out, “First witness!”",
      "The first witness was the Hatter. He came in with a teacup in one hand and a piece of bread-and-butter in the other. “I beg pardon, your Majesty,” he began, “for bringing these in: but I hadn’t quite finished my tea when I was sent for.”",
      "“You ought to have finished,” said the King. “When did you begin?”",
      "The Hatter looked at the March Hare, who had followed him into the court, arm-in-arm with the Dormouse. “Fourteenth of March, I think it was,” he said.",
      "“Fifteenth,” said the March Hare.",
      "“Sixteenth,” added the Dormouse.",
      "“Write that down,” the King said to the jury, and the jury eagerly wrote down all three dates on their slates, and then added them up, and reduced the answer to shillings and pence.",
      "“Take off your hat,” the King said to the Hatter.",
      "“It isn’t mine,” said the Hatter.",
      "“Stolen!” the King exclaimed, turning to the jury, who instantly made a memorandum of the fact.",
      "“I keep them to sell,” the Hatter added as an explanation; “I’ve none of my own. I’m a hatter.”",
      "Here the Queen put on her spectacles, and began staring at the Hatter, who turned pale and fidgeted.",
      "“Give your evidence,” said the King; “and don’t be nervous, or I’ll have you executed on the spot.”",
      "This did not seem to encourage the witness at all: he kept shifting from one foot to the other, looking uneasily at the Queen, and in his confusion he bit a large piece out of his teacup instead of the bread-and-butter.",
      "Just at this moment Alice felt a very curious sensation, which puzzled her a good deal until she made out what it was: she was beginning to grow larger again, and she thought at first she would get up and leave the court; but on second thoughts she decided to remain where she was as long as there was room for her.",
      "“I wish you wouldn’t squeeze so,” said the Dormouse, who was sitting next to her. “I can hardly breathe.”",
      "“I can’t help it,” said Alice very meekly: “I’m growing.”",
      "“You’ve no right to grow here,” said the Dormouse.",
      "“Don’t talk nonsense,” said Alice more boldly: “you know you’re growing too.”",
      "“Yes, but I grow at a reasonable pace,” said the Dormouse: “not in that ridiculous fashion.” And he got up very sulkily and crossed over to the other side of the court.",
      "All this time the Queen had never left off staring at the Hatter, and, just as the Dormouse crossed the court, she said to one of the officers of the court, “Bring me the list of the singers in the last concert!” on which the wretched Hatter trembled so, that he shook both his shoes off.",
      "“Give your evidence,” the King repeated angrily, “or I’ll have you executed, whether you’re nervous or not.”",
      "“I’m a poor man, your Majesty,” the Hatter began, in a trembling voice, “-and I hadn’t begun my tea-not above a week or so-and what with the bread-and-butter getting so thin-and the twinkling of the tea-”",
      "“The twinkling of the what?” said the King.",
      "“It began with the tea,” the Hatter replied.",
      "“Of course twinkling begins with a T!” said the King sharply. “Do you take me for a dunce? Go on!”",
      "“I’m a poor man,” the Hatter went on, “and most things twinkled after that-only the March Hare said-”",
      "“I didn’t!” the March Hare interrupted in a great hurry.",
      "“You did!” said the Hatter.",
      "“I deny it!” said the March Hare.",
      "“He denies it,” said the King: “leave out that part.”",
      "“Well, at any rate, the Dormouse said-” the Hatter went on, looking anxiously round to see if he would deny it too: but the Dormouse denied nothing, being fast asleep.",
      "“After that,” continued the Hatter, “I cut some more bread-and-butter-”",
      "“But what did the Dormouse say?” one of the jury asked.",
      "“That I can’t remember,” said the Hatter.",
      "“You must remember,” remarked the King, “or I’ll have you executed.”",
      "The miserable Hatter dropped his teacup and bread-and-butter, and went down on one knee. “I’m a poor man, your Majesty,” he began.",
      "“You’re a very poor speaker,” said the King.",
      "Here one of the guinea-pigs cheered, and was immediately suppressed by the officers of the court. (As that is rather a hard word, I will just explain to you how it was done. They had a large canvas bag, which tied up at the mouth with strings: into this they slipped the guinea-pig, head first, and then sat upon it.)",
      "“I’m glad I’ve seen that done,” thought Alice. “I’ve so often read in the newspapers, at the end of trials, “There was some attempts at applause, which was immediately suppressed by the officers of the court,” and I never understood what it meant till now.”",
      "“If that’s all you know about it, you may stand down,” continued the King.",
      "“I can’t go no lower,” said the Hatter: “I’m on the floor, as it is.”",
      "“Then you may sit down,” the King replied.",
      "Here the other guinea-pig cheered, and was suppressed.",
      "“Come, that finished the guinea-pigs!” thought Alice. “Now we shall get on better.”",
      "“I’d rather finish my tea,” said the Hatter, with an anxious look at the Queen, who was reading the list of singers.",
      "“You may go,” said the King, and the Hatter hurriedly left the court, without even waiting to put his shoes on.",
      "“-and just take his head off outside,” the Queen added to one of the officers: but the Hatter was out of sight before the officer could get to the door.",
      "“Call the next witness!” said the King.",
      "The next witness was the Duchess’s cook. She carried the pepper-box in her hand, and Alice guessed who it was, even before she got into the court, by the way the people near the door began sneezing all at once.",
      "“Give your evidence,” said the King.",
      "“Shan’t,” said the cook.",
      "The King looked anxiously at the White Rabbit, who said in a low voice, “Your Majesty must cross-examine this witness.”",
      "“Well, if I must, I must,” the King said, with a melancholy air, and, after folding his arms and frowning at the cook till his eyes were nearly out of sight, he said in a deep voice, “What are tarts made of?”",
      "“Pepper, mostly,” said the cook.",
      "“Treacle,” said a sleepy voice behind her.",
      "“Collar that Dormouse,” the Queen shrieked out. “Behead that Dormouse! Turn that Dormouse out of court! Suppress him! Pinch him! Off with his whiskers!”",
      "For some minutes the whole court was in confusion, getting the Dormouse turned out, and, by the time they had settled down again, the cook had disappeared.",
      "“Never mind!” said the King, with an air of great relief. “Call the next witness.” And he added in an undertone to the Queen, “Really, my dear, you must cross-examine the next witness. It quite makes my forehead ache!”",
      "Alice watched the White Rabbit as he fumbled over the list, feeling very curious to see what the next witness would be like, “-for they haven’t got much evidence yet,” she said to herself. Imagine her surprise, when the White Rabbit read out, at the top of his shrill little voice, the name “Alice!”",
    ],
  },
  {
    number: 'XII',
    title: "Alice’s Evidence",
    paragraphs: [
      "“Here!” cried Alice, quite forgetting in the flurry of the moment how large she had grown in the last few minutes, and she jumped up in such a hurry that she tipped over the jury-box with the edge of her skirt, upsetting all the jurymen on to the heads of the crowd below, and there they lay sprawling about, reminding her very much of a globe of goldfish she had accidentally upset the week before.",
      "“Oh, I beg your pardon!” she exclaimed in a tone of great dismay, and began picking them up again as quickly as she could, for the accident of the goldfish kept running in her head, and she had a vague sort of idea that they must be collected at once and put back into the jury-box, or they would die.",
      "“The trial cannot proceed,” said the King in a very grave voice, “until all the jurymen are back in their proper places-all,” he repeated with great emphasis, looking hard at Alice as he said so.",
      "Alice looked at the jury-box, and saw that, in her haste, she had put the Lizard in head downwards, and the poor little thing was waving its tail about in a melancholy way, being quite unable to move. She soon got it out again, and put it right; “not that it signifies much,” she said to herself; “I should think it would be quite as much use in the trial one way up as the other.”",
      "As soon as the jury had a little recovered from the shock of being upset, and their slates and pencils had been found and handed back to them, they set to work very diligently to write out a history of the accident, all except the Lizard, who seemed too much overcome to do anything but sit with its mouth open, gazing up into the roof of the court.",
      "“What do you know about this business?” the King said to Alice.",
      "“Nothing,” said Alice.",
      "“Nothing whatever?” persisted the King.",
      "“Nothing whatever,” said Alice.",
      "“That’s very important,” the King said, turning to the jury. They were just beginning to write this down on their slates, when the White Rabbit interrupted: “Unimportant, your Majesty means, of course,” he said in a very respectful tone, but frowning and making faces at him as he spoke.",
      "“Unimportant, of course, I meant,” the King hastily said, and went on to himself in an undertone,",
      "“important-unimportant-unimportant-important-” as if he were trying which word sounded best.",
      "Some of the jury wrote it down “important,” and some “unimportant.” Alice could see this, as she was near enough to look over their slates; “but it doesn’t matter a bit,” she thought to herself.",
      "At this moment the King, who had been for some time busily writing in his note-book, cackled out “Silence!” and read out from his book, “Rule Forty-two. All persons more than a mile high to leave the court.”",
      "Everybody looked at Alice.",
      "“I’m not a mile high,” said Alice.",
      "“You are,” said the King.",
      "“Nearly two miles high,” added the Queen.",
      "“Well, I shan’t go, at any rate,” said Alice: “besides, that’s not a regular rule: you invented it just now.”",
      "“It’s the oldest rule in the book,” said the King.",
      "“Then it ought to be Number One,” said Alice.",
      "The King turned pale, and shut his note-book hastily. “Consider your verdict,” he said to the jury, in a low, trembling voice.",
      "“There’s more evidence to come yet, please your Majesty,” said the White Rabbit, jumping up in a great hurry; “this paper has just been picked up.”",
      "“What’s in it?” said the Queen.",
      "“I haven’t opened it yet,” said the White Rabbit, “but it seems to be a letter, written by the prisoner to-to somebody.”",
      "“It must have been that,” said the King, “unless it was written to nobody, which isn’t usual, you know.”",
      "“Who is it directed to?” said one of the jurymen.",
      "“It isn’t directed at all,” said the White Rabbit; “in fact, there’s nothing written on the outside.” He unfolded the paper as he spoke, and added “It isn’t a letter, after all: it’s a set of verses.”",
      "“Are they in the prisoner’s handwriting?” asked another of the jurymen.",
      "“No, they’re not,” said the White Rabbit, “and that’s the queerest thing about it.” (The jury all looked puzzled.)",
      "“He must have imitated somebody else’s hand,” said the King. (The jury all brightened up again.)",
      "“Please your Majesty,” said the Knave, “I didn’t write it, and they can’t prove I did: there’s no name signed at the end.”",
      "“If you didn’t sign it,” said the King, “that only makes the matter worse. You must have meant some mischief, or else you’d have signed your name like an honest man.”",
      "There was a general clapping of hands at this: it was the first really clever thing the King had said that day.",
      "“That proves his guilt,” said the Queen.",
      "“It proves nothing of the sort!” said Alice. “Why, you don’t even know what they’re about!”",
      "“Read them,” said the King.",
      "The White Rabbit put on his spectacles. “Where shall I begin, please your Majesty?” he asked.",
      "“Begin at the beginning,” the King said gravely, “and go on till you come to the end: then stop.”",
      "These were the verses the White Rabbit read:-",
      "“They told me you had been to her, And mentioned me to him: She gave me a good character, But said I could not swim.",
      "He sent them word I had not gone (We know it to be true): If she should push the matter on, What would become of you?",
      "I gave her one, they gave him two, You gave us three or more; They all returned from him to you, Though they were mine before.",
      "If I or she should chance to be Involved in this affair, He trusts to you to set them free, Exactly as we were.",
      "My notion was that you had been (Before she had this fit) An obstacle that came between Him, and ourselves, and it.",
      "Don’t let him know she liked them best, For this must ever be A secret, kept from all the rest, Between yourself and me.”",
      "“That’s the most important piece of evidence we’ve heard yet,” said the King, rubbing his hands; “so now let the jury-”",
      "“If any one of them can explain it,” said Alice, (she had grown so large in the last few minutes that she wasn’t a bit afraid of interrupting him,) “I’ll give him sixpence. I don’t believe there’s an atom of meaning in it.”",
      "The jury all wrote down on their slates, “She doesn’t believe there’s an atom of meaning in it,” but none of them attempted to explain the paper.",
      "“If there’s no meaning in it,” said the King, “that saves a world of trouble, you know, as we needn’t try to find any. And yet I don’t know,” he went on, spreading out the verses on his knee, and looking at them with one eye; “I seem to see some meaning in them, after all. “-said I could not swim-” you can’t swim, can you?” he added, turning to the Knave.",
      "The Knave shook his head sadly. “Do I look like it?” he said. (Which he certainly did not, being made entirely of cardboard.)",
      "“All right, so far,” said the King, and he went on muttering over the verses to himself: “‘We know it to be true-’ that’s the jury, of course-‘I gave her one, they gave him two-’ why, that must be what he did with the tarts, you know-”",
      "“But, it goes on ‘they all returned from him to you,’” said Alice.",
      "“Why, there they are!” said the King triumphantly, pointing to the tarts on the table. “Nothing can be clearer than that. Then again-‘before she had this fit-’ you never had fits, my dear, I think?” he said to the Queen.",
      "“Never!” said the Queen furiously, throwing an inkstand at the Lizard as she spoke. (The unfortunate little Bill had left off writing on his slate with one finger, as he found it made no mark; but he now hastily began again, using the ink, that was trickling down his face, as long as it lasted.)",
      "“Then the words don’t fit you,” said the King, looking round the court with a smile. There was a dead silence.",
      "“It’s a pun!” the King added in an offended tone, and everybody laughed, “Let the jury consider their verdict,” the King said, for about the twentieth time that day.",
      "“No, no!” said the Queen. “Sentence first-verdict afterwards.”",
      "“Stuff and nonsense!” said Alice loudly. “The idea of having the sentence first!”",
      "“Hold your tongue!” said the Queen, turning purple.",
      "“I won’t!” said Alice.",
      "“Off with her head!” the Queen shouted at the top of her voice. Nobody moved.",
      "“Who cares for you?” said Alice, (she had grown to her full size by this time.) “You’re nothing but a pack of cards!”",
      "At this the whole pack rose up into the air, and came flying down upon her: she gave a little scream, half of fright and half of anger, and tried to beat them off, and found herself lying on the bank, with her head in the lap of her sister, who was gently brushing away some dead leaves that had fluttered down from the trees upon her face.",
      "“Wake up, Alice dear!” said her sister; “Why, what a long sleep you’ve had!”",
      "“Oh, I’ve had such a curious dream!” said Alice, and she told her sister, as well as she could remember them, all these strange Adventures of hers that you have just been reading about; and when she had finished, her sister kissed her, and said, “It was a curious dream, dear, certainly: but now run in to your tea; it’s getting late.” So Alice got up and ran off, thinking while she ran, as well she might, what a wonderful dream it had been.",
      "But her sister sat still just as she left her, leaning her head on her hand, watching the setting sun, and thinking of little Alice and all her wonderful Adventures, till she too began dreaming after a fashion, and this was her dream:-",
      "First, she dreamed of little Alice herself, and once again the tiny hands were clasped upon her knee, and the bright eager eyes were looking up into hers-she could hear the very tones of her voice, and see that queer little toss of her head to keep back the wandering hair that would always get into her eyes-and still as she listened, or seemed to listen, the whole place around her became alive with the strange creatures of her little sister’s dream.",
      "The long grass rustled at her feet as the White Rabbit hurried by-the frightened Mouse splashed his way through the neighbouring pool-she could hear the rattle of the teacups as the March Hare and his friends shared their never-ending meal, and the shrill voice of the Queen ordering off her unfortunate guests to execution-once more the pig-baby was sneezing on the Duchess’s knee, while plates and dishes crashed around it-once more the shriek of the Gryphon, the squeaking of the Lizard’s slate-pencil, and the choking of the suppressed guinea-pigs, filled the air, mixed up with the distant sobs of the miserable Mock Turtle.",
      "So she sat on, with closed eyes, and half believed herself in Wonderland, though she knew she had but to open them again, and all would change to dull reality-the grass would be only rustling in the wind, and the pool rippling to the waving of the reeds-the rattling teacups would change to tinkling sheep-bells, and the Queen’s shrill cries to the voice of the shepherd boy-and the sneeze of the baby, the shriek of the Gryphon, and all the other queer noises, would change (she knew) to the confused clamour of the busy farm-yard-while the lowing of the cattle in the distance would take the place of the Mock Turtle’s heavy sobs.",
      "Lastly, she pictured to herself how this same little sister of hers would, in the after-time, be herself a grown woman; and how she would keep, through all her riper years, the simple and loving heart of her childhood: and how she would gather about her other little children, and make their eyes bright and eager with many a strange tale, perhaps even with the dream of Wonderland of long ago: and how she would feel with all their simple sorrows, and find a pleasure in all their simple joys, remembering her own child-life, and the happy summer days.",
    ],
  },
];

return { CORPUS_SHA256, CHAPTERS };
})();

/* global process */
/**
 * Homework #2 - A toy elliptic-curve scheme and the Caesar cipher:
 *               encryption, statistical cryptanalysis and attacks
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * The same message through two ciphers, and an attack on each: the
 * statistical attack that breaks the Caesar cipher by the letter frequencies
 * of a known language, and the algebraic attack that breaks the toy
 * elliptic-curve scheme because its private keys have only 32 bits.
 * Everything is written from scratch, with no dependencies:
 *
 *   0. Input validation and bytes
 *   1. SHA-256 (the nonces of the reproducible ciphertexts)
 *   2. secp256k1
 *   3. The toy scheme: EC-ElGamal on secp256k1 with 32-bit private keys
 *   4. The Caesar cipher
 *   5. The corpus and its language models
 *   6. Statistical cryptanalysis of the Caesar cipher
 *   7. Attacks on the toy scheme
 *   8. Statistics: hypothesis tests and experiments
 *   9. Charts (browser, <canvas>)
 *  10. Printed report and command line
 *
 * Educational code: the scheme is weak on purpose (32-bit private keys, no
 * authentication) and the arithmetic is not constant-time. Never use it to
 * protect anything.
 */
const { CHAPTERS, CORPUS_SHA256 } = corpus$;

// ---------------------------------------------------------------------------
// 0. Input validation and bytes
// ---------------------------------------------------------------------------

const fail = (message) => {
  throw new RangeError(message);
};

const describe = (v) => (typeof v === 'string' ? JSON.stringify(v.length > 40 ? `${v.slice(0, 40)}...` : v) : String(v));

function assertBytes(name, v, length = null) {
  if (!(v instanceof Uint8Array)) fail(`${name} must be a Uint8Array`);
  if (length !== null && v.length !== length) fail(`${name} must be ${length} bytes long, got ${v.length}`);
}

/** Bytes as lowercase hexadecimal. */
const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** Hexadecimal (an even number of digits, optional 0x) to bytes; anything else is refused. */
function fromHex(hex) {
  if (typeof hex !== 'string') fail(`hex must be a string, got ${describe(hex)}`);
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (h.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(h)) fail(`not an even-length hexadecimal string: ${describe(hex)}`);
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(h.slice(2 * i, 2 * i + 2), 16);
  return out;
}

/** UTF-8 bytes of a string. */
const utf8 = (text) => new TextEncoder().encode(text);

/** A string from its UTF-8 bytes, or null if the bytes are not valid UTF-8. */
function utf8Decode(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** The concatenation of byte arrays. */
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** Big-endian 32-bit integer. */
const ser32 = (i) => new Uint8Array([(i >>> 24) & 255, (i >>> 16) & 255, (i >>> 8) & 255, i & 255]);

/** Unsigned big-endian integer of 32 bytes. */
function ser256(n) {
  if (typeof n !== 'bigint' || n < 0n || n >= 1n << 256n) fail('ser256 expects a BigInt in [0, 2^256)');
  return fromHex(n.toString(16).padStart(64, '0'));
}

/** Bytes read as an unsigned big-endian integer. */
const bytesToBigInt = (bytes) => (bytes.length ? BigInt(`0x${toHex(bytes)}`) : 0n);

/** Bytes from the cryptographic generator of the browser (or of Node). */
function secureRandomBytes(length) {
  const out = new Uint8Array(length);
  const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') return webCrypto.getRandomValues(out);
  // eslint-disable-next-line no-undef
  if (typeof require === 'function') return require('crypto').randomFillSync(out);
  return fail('no cryptographic random generator available');
}

/** Milliseconds from an arbitrary origin, as precise as the platform allows. */
const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

// ---------------------------------------------------------------------------
// 1. SHA-256 (FIPS 180-4)
// ---------------------------------------------------------------------------

// The first 32 bits of the fractional parts of the cube roots of the first
// 64 primes, and of the square roots of the first 8: checked at the end of
// this file against the standard's test vector.
const K256 = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const H256 = new Int32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);

/** Merkle-Damgard padding: the message, a 1 bit, zeros, and the length in bits in the last 8 bytes, up to a multiple of 64 bytes. */
function mdPad(message) {
  const padded = new Uint8Array(Math.ceil((message.length + 9) / 64) * 64);
  padded.set(message);
  padded[message.length] = 0x80;
  let bits = message.length * 8;
  for (let i = padded.length - 1; i >= padded.length - 7; i--) {
    padded[i] = bits % 256;
    bits = Math.floor(bits / 256);
  }
  return padded;
}

const rotr32 = (x, n) => (x >>> n) | (x << (32 - n));

const W256 = new Int32Array(64);

function sha256Compress(H, block, offset) {
  const W = W256;
  for (let t = 0; t < 16; t++) {
    const o = offset + 4 * t;
    W[t] = (block[o] << 24) | (block[o + 1] << 16) | (block[o + 2] << 8) | block[o + 3];
  }
  for (let t = 16; t < 64; t++) {
    const s0 = rotr32(W[t - 15], 7) ^ rotr32(W[t - 15], 18) ^ (W[t - 15] >>> 3);
    const s1 = rotr32(W[t - 2], 17) ^ rotr32(W[t - 2], 19) ^ (W[t - 2] >>> 10);
    W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
  }
  let [a, b, c, d, e, f, g, h] = H;
  for (let t = 0; t < 64; t++) {
    const t1 = (h + (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) + ((e & f) ^ (~e & g)) + K256[t] + W[t]) | 0;
    const t2 = ((rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
    h = g;
    g = f;
    f = e;
    e = (d + t1) | 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) | 0;
  }
  H[0] = (H[0] + a) | 0;
  H[1] = (H[1] + b) | 0;
  H[2] = (H[2] + c) | 0;
  H[3] = (H[3] + d) | 0;
  H[4] = (H[4] + e) | 0;
  H[5] = (H[5] + f) | 0;
  H[6] = (H[6] + g) | 0;
  H[7] = (H[7] + h) | 0;
}

/** SHA-256 (FIPS 180-4): 32 bytes. Here it draws the nonces of the reproducible ciphertexts and checks the corpus. */
function sha256(message) {
  assertBytes('message', message);
  const H = Int32Array.from(H256);
  const padded = mdPad(message);
  for (let o = 0; o < padded.length; o += 64) sha256Compress(H, padded, o);
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) out.set(ser32(H[i]), 4 * i);
  return out;
}

// ---------------------------------------------------------------------------
// 2. secp256k1
// ---------------------------------------------------------------------------

/** The curve y^2 = x^3 + 7 over F_p of Bitcoin and Ethereum (SEC 2, 2000): prime order n, cofactor 1. */
const SECP256K1 = Object.freeze({
  p: 2n ** 256n - 2n ** 32n - 977n,
  n: 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
  a: 0n,
  b: 7n,
  Gx: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  Gy: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
});
const FP = SECP256K1.p;
const CURVE_N = SECP256K1.n;

/** The base point G, in affine coordinates. */
const G = Object.freeze({ x: SECP256K1.Gx, y: SECP256K1.Gy });

const MASK256 = (1n << 256n) - 1n;
// 2^256 = 2^32 + 977 (mod p): the high half of a product folds onto the low half
const FOLD = (1n << 32n) + 977n;

const modP = (a) => {
  const r = a % FP;
  return r >= 0n ? r : r + FP;
};

/**
 * x mod p for 0 <= x < 2^520 (the product of two field elements, or a small
 * multiple of it): two folds of the high half, using 2^256 = 2^32 + 977
 * (mod p), leave less than 2p, and one subtraction finishes. Cheaper than a
 * division, and these products are most of the work of every attack.
 */
function reduce(x) {
  let r = (x & MASK256) + (x >> 256n) * FOLD;
  r = (r & MASK256) + (r >> 256n) * FOLD;
  return r >= FP ? r - FP : r;
}

// Field operations on reduced elements, 0 <= a, b < p: no negative values,
// which would break the bit masks of reduce.
const fmul = (a, b) => reduce(a * b);
const fsub = (a, b) => (a >= b ? a - b : a - b + FP);
const fadd = (a, b) => {
  const s = a + b;
  return s >= FP ? s - FP : s;
};

/** Inverse modulo m with the extended Euclidean algorithm. */
function invMod(a, m) {
  let r0 = ((a % m) + m) % m;
  let r1 = m;
  let s0 = 1n;
  let s1 = 0n;
  while (r1 !== 0n) {
    const q = r0 / r1;
    let t = r0 - q * r1;
    r0 = r1;
    r1 = t;
    t = s0 - q * s1;
    s0 = s1;
    s1 = t;
  }
  if (r0 !== 1n) fail('not invertible');
  return s0 < 0n ? s0 + m : s0;
}

// Affine points are objects { x, y } (null is the point at infinity O);
// inside the arithmetic they are in Jacobian coordinates [X, Y, Z], meaning
// (X/Z^2, Y/Z^3): no inversion at every step. Z = 0 is the point at infinity.
const INFINITY_J = Object.freeze([0n, 1n, 0n]);

function jDouble(P) {
  const [X, Y, Z] = P;
  if (Z === 0n || Y === 0n) return INFINITY_J;
  const YY = fmul(Y, Y);
  const S = reduce(4n * fmul(X, YY));
  const M = reduce(3n * fmul(X, X)); // a = 0
  const X3 = fsub(fmul(M, M), fadd(S, S));
  return [X3, fsub(fmul(M, fsub(S, X3)), reduce(8n * fmul(YY, YY))), reduce(2n * fmul(Y, Z))];
}

/** P (Jacobian) + Q (affine, { x, y }; null adds nothing). */
function jAddAffine(P, Q) {
  if (Q === null) return P;
  const [X1, Y1, Z1] = P;
  if (Z1 === 0n) return [Q.x, Q.y, 1n];
  const Z1Z1 = fmul(Z1, Z1);
  const U2 = fmul(Q.x, Z1Z1);
  const S2 = fmul(Q.y, fmul(Z1, Z1Z1));
  const H = fsub(U2, X1);
  const r = fsub(S2, Y1);
  if (H === 0n) return r === 0n ? jDouble(P) : INFINITY_J;
  const HH = fmul(H, H);
  const HHH = fmul(H, HH);
  const V = fmul(X1, HH);
  const X3 = fsub(fsub(fmul(r, r), HHH), fadd(V, V));
  return [X3, fsub(fmul(r, fsub(V, X3)), fmul(Y1, HHH)), fmul(Z1, H)];
}

function toAffine([X, Y, Z]) {
  if (Z === 0n) return null;
  const zi = invMod(Z, FP);
  const zi2 = fmul(zi, zi);
  return { x: fmul(X, zi2), y: fmul(Y, fmul(zi2, zi)) };
}

/** Inverts many nonzero field elements with one inversion (Montgomery's trick). */
function batchInvert(values) {
  const prefix = new Array(values.length);
  let acc = 1n;
  for (let i = 0; i < values.length; i++) {
    prefix[i] = acc;
    acc = fmul(acc, values[i]);
  }
  let inv = invMod(acc, FP);
  const out = new Array(values.length);
  for (let i = values.length - 1; i >= 0; i--) {
    out[i] = fmul(inv, prefix[i]);
    inv = fmul(inv, values[i]);
  }
  return out;
}

/** Many Jacobian points in affine form with one inversion; the point at infinity becomes null. */
function toAffineAll(points) {
  const finite = [];
  for (let i = 0; i < points.length; i++) if (points[i][2] !== 0n) finite.push(i);
  const inverses = batchInvert(finite.map((i) => points[i][2]));
  const out = new Array(points.length).fill(null);
  finite.forEach((i, j) => {
    const zi2 = fmul(inverses[j], inverses[j]);
    out[i] = { x: fmul(points[i][0], zi2), y: fmul(points[i][1], fmul(zi2, inverses[j])) };
  });
  return out;
}

/** P, 2P, ..., count * P (count >= 1), by successive additions, in affine form. */
function successiveMultiples(P, count) {
  const jacobian = new Array(count);
  let acc = INFINITY_J;
  for (let i = 0; i < count; i++) {
    acc = jAddAffine(acc, P);
    jacobian[i] = acc;
  }
  return toAffineAll(jacobian);
}

/**
 * Fixed-base table: d * 16^w * P for every window w (64 of 4 bits) and
 * digit d = 1..15, in affine form. Built once for a point, it turns kP into
 * at most 64 additions instead of about 256 doublings and 128 additions.
 */
function fixedBaseTable(P) {
  const jacobian = [];
  let base = P;
  for (let w = 0; w < 64; w++) {
    let acc = [base.x, base.y, 1n];
    jacobian.push(acc);
    for (let d = 2; d <= 15; d++) {
      acc = jAddAffine(acc, base);
      jacobian.push(acc);
    }
    base = toAffine(jDouble(jDouble(jDouble(jDouble([base.x, base.y, 1n])))));
  }
  return toAffineAll(jacobian);
}

/** kP from the fixed-base table of P, for 1 <= k < n. */
function multiplyByTable(table, k) {
  let R = INFINITY_J;
  for (let w = 0; w < 64; w++) {
    const d = Number((k >> BigInt(4 * w)) & 15n);
    if (d) R = jAddAffine(R, table[15 * w + d - 1]);
  }
  return toAffine(R);
}

let gTable = null;
const generatorTable = () => gTable || (gTable = fixedBaseTable(G));

/** kG for a scalar k in [1, n - 1], as an affine point { x, y }. */
function multiplyG(k) {
  if (typeof k !== 'bigint' || k <= 0n || k >= CURVE_N) fail('the scalar must be a BigInt in [1, n - 1]');
  return multiplyByTable(generatorTable(), k);
}

/** kP for an affine point P and a scalar k >= 0, by double-and-add from the most significant bit (null is O). */
function multiply(P, k) {
  if (typeof k !== 'bigint' || k < 0n) fail('the scalar must be a non-negative BigInt');
  if (P === null || k === 0n) return null;
  let R = INFINITY_J;
  for (let i = BigInt(k.toString(2).length - 1); i >= 0n; i--) {
    R = jDouble(R);
    if ((k >> i) & 1n) R = jAddAffine(R, P);
  }
  return toAffine(R);
}

/** P + Q for affine points (null is the point at infinity). */
function addPoints(P, Q) {
  if (P === null) return Q;
  if (Q === null) return P;
  return toAffine(jAddAffine([P.x, P.y, 1n], Q));
}

/** -P: the point with the same x and the opposite y. */
const negate = (P) => (P === null ? null : { x: P.x, y: P.y === 0n ? 0n : FP - P.y });

/** P - Q. */
const subtractPoints = (P, Q) => addPoints(P, negate(Q));

const pointsEqual = (P, Q) => (P === null || Q === null ? P === Q : P.x === Q.x && P.y === Q.y);

/** Whether an affine point lies on y^2 = x^3 + 7 with coordinates in [0, p). */
const isOnSecp256k1 = (P) => P !== null && P.x >= 0n && P.x < FP && P.y >= 0n && P.y < FP && modP(P.y * P.y - P.x * P.x * P.x - 7n) === 0n;

/** SEC 1 compressed encoding: 02/03 (the parity of y) || x, 33 bytes; the point at infinity is the single byte 00. */
const encodeCompressed = (P) => (P === null ? new Uint8Array(1) : concat([P.y % 2n === 0n ? 2 : 3], ser256(P.x)));

/** The point of a compressed encoding: y = (x^3 + 7)^((p + 1) / 4), since p = 3 (mod 4). Refuses anything that is not a curve point. */
function decodeCompressed(bytes) {
  assertBytes('compressed point', bytes, 33);
  if (bytes[0] !== 2 && bytes[0] !== 3) fail('a compressed point starts with 02 or 03');
  const x = bytesToBigInt(bytes.slice(1));
  if (x >= FP) fail('x is not a field element');
  const y2 = modP(x * x * x + 7n);
  let y = 1n;
  let base = y2;
  let e = (FP + 1n) / 4n;
  while (e > 0n) {
    if (e & 1n) y = fmul(y, base);
    base = fmul(base, base);
    e >>= 1n;
  }
  if (fmul(y, y) !== y2) fail('x is not the abscissa of a curve point');
  if (Number(y & 1n) !== bytes[0] - 2) y = FP - y;
  return { x, y };
}

/** A point as 66 hexadecimal digits (compressed form). */
const pointHex = (P) => toHex(encodeCompressed(P));

/** The low 52 bits of x as a Number: the key of the hash tables of the attacks (a match is then checked in full). */
const xKey = (x) => Number(x & 0xfffffffffffffn);

/**
 * P_i + Q_i for many pairs of affine points at once, in place on the arrays
 * of coordinates xs, ys: one inversion for all the slopes (Montgomery's
 * trick), so each addition costs about six multiplications instead of an
 * inversion. The point at infinity has x = null. A pair with the same x
 * (P = Q or P = -Q), or with P at infinity, which the attacks meet at most
 * once, goes through the general formulas.
 */
function addInPlace(xs, ys, qx, qy) {
  const count = xs.length;
  const dens = new Array(count);
  const special = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const d = xs[i] === null ? 0n : fsub(qx[i], xs[i]);
    if (d === 0n) {
      special[i] = 1;
      dens[i] = 1n;
    } else dens[i] = d;
  }
  const inverses = batchInvert(dens);
  for (let i = 0; i < count; i++) {
    if (special[i]) {
      const R = addPoints(xs[i] === null ? null : { x: xs[i], y: ys[i] }, { x: qx[i], y: qy[i] });
      xs[i] = R === null ? null : R.x;
      ys[i] = R === null ? null : R.y;
      continue;
    }
    const l = fmul(fsub(qy[i], ys[i]), inverses[i]);
    const x3 = fsub(fsub(fmul(l, l), xs[i]), qx[i]);
    ys[i] = fsub(fmul(l, fsub(xs[i], x3)), ys[i]);
    xs[i] = x3;
  }
}

// ---------------------------------------------------------------------------
// 3. The toy scheme: EC-ElGamal on secp256k1 with 32-bit private keys
// ---------------------------------------------------------------------------

/** The restriction of the toy scheme: private keys of at most 32 bits, 1 <= k <= 2^32 - 1. */
const KEY_BITS = 32;
const KEY_MAX = 2n ** BigInt(KEY_BITS) - 1n;

/** The private key of the page, drawn once for this homework with a cryptographic generator. */
const DEFAULT_KEY = 3474662160n;

/** The message of the page: Suetonius on Caesar's cipher (Life of Julius Caesar, 56.6, in J. C. Rolfe's translation, 1914). */
const DEFAULT_MESSAGE = 'If anyone wishes to decipher these, and get at their meaning, he must substitute the fourth letter of the alphabet, namely D, for A, and so with the others.';

/** Longest message accepted, in UTF-8 bytes: every byte becomes a ciphertext block of 66 bytes. */
const MESSAGE_MAX_BYTES = 280;

/** The seed of the reproducible nonces (seededNonce). */
const NONCE_SEED = 'Homework #2 - toy EC-ElGamal nonces';

/** The private key typed by the user: decimal digits only, from 1 to KEY_MAX. */
function parsePrivateKey(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  if (t.replace(/^0+/, '').length > 10) return { ok: false, error: 'range' };
  const k = BigInt(t);
  if (k < 1n || k > KEY_MAX) return { ok: false, error: 'range' };
  return { ok: true, value: k };
}

/** A uniformly random private key of the toy scheme, from the cryptographic generator. */
function randomPrivateKey() {
  for (;;) {
    const k = bytesToBigInt(secureRandomBytes(KEY_BITS / 8));
    if (k >= 1n && k <= KEY_MAX) return k;
  }
}

let byteTable = null;

/** The 256 points bG that encode the bytes b = 0..255 (0G is the point at infinity), and the way back from x to b. */
function bytePoints() {
  if (!byteTable) {
    const points = [null, ...successiveMultiples(G, 255)];
    byteTable = { points, index: new Map(points.slice(1).map((P, i) => [P.x, i + 1])) };
  }
  return byteTable;
}

/** The point that encodes a byte: M = bG. */
const encodeByte = (b) => bytePoints().points[b];

/**
 * The byte encoded by a point, or -1 if the point is not bG for a byte b:
 * a discrete logarithm, easy because b has only 256 possible values (a
 * table of the 256 points, built once).
 */
function decodeByte(M) {
  if (M === null) return 0;
  const { points, index } = bytePoints();
  const b = index.get(M.x);
  return b !== undefined && points[b].y === M.y ? b : -1;
}

/**
 * The nonce r_i of block i in the reproducible ciphertexts: the first value
 * of SHA-256(seed || i || attempt) in [1, n - 1], for attempt = 0, 1, ...
 * Deterministic, so that the page, the downloadable program and the command
 * line show the same ciphertext; for the same reason anyone can recompute
 * it, which a real sender must never allow (section 4.7): there r comes
 * from a cryptographic generator, as in randomNonce.
 */
function seededNonce(i, seed = NONCE_SEED) {
  const prefix = utf8(seed);
  for (let attempt = 0; ; attempt++) {
    const r = bytesToBigInt(sha256(concat(prefix, ser32(i), ser32(attempt))));
    if (r >= 1n && r < CURVE_N) return r;
  }
}

/** A nonce from the cryptographic generator, uniform in [1, n - 1]. */
function randomNonce() {
  for (;;) {
    const r = bytesToBigInt(secureRandomBytes(32));
    if (r >= 1n && r < CURVE_N) return r;
  }
}

/**
 * The toy scheme with one key pair. Key generation: a private key k of at
 * most 32 bits and the public key K = kG. Encryption with K, byte by byte:
 * M_i = b_i G, a fresh nonce r_i, C1 = r_i G, S_i = r_i K, C2 = M_i + S_i.
 * Decryption with k: S_i = k C1 (= k r_i G = r_i K), M_i = C2 - S_i, and
 * b_i from M_i with the table of the 256 points.
 *
 * What depends only on the key and on the position of a byte (r_i, C1 and
 * S_i, then k C1 when decrypting) is computed once and kept: a new message
 * costs one point addition per byte. `nonces` is 'seeded' (reproducible,
 * seededNonce), 'random' (randomNonce) or a function i -> r_i, for the
 * flawed variants of section 4.7.
 */
function toyScheme(k, { nonces = 'seeded' } = {}) {
  if (typeof k !== 'bigint' || k < 1n || k > KEY_MAX) fail(`the private key must be a BigInt in [1, ${KEY_MAX}]`);
  const K = multiplyG(k);
  let kTable = null;
  let nonceOf;
  if (typeof nonces === 'function') nonceOf = nonces;
  else if (nonces === 'random') nonceOf = () => randomNonce();
  else nonceOf = (i) => seededNonce(i);
  const secrets = [];
  const byNonce = new Map();
  const shared = new Map();
  const secretAt = (i) => {
    if (!secrets[i]) {
      const r = nonceOf(i);
      if (!byNonce.has(r)) {
        if (!kTable) kTable = fixedBaseTable(K);
        byNonce.set(r, { r, C1: multiplyG(r), S: multiplyByTable(kTable, r) });
      }
      secrets[i] = byNonce.get(r);
    }
    return secrets[i];
  };
  /** The blocks of a message: for every byte, its point M, the nonce r, the shared point S and the ciphertext (C1, C2). */
  function* encryptSteps(text) {
    const bytes = utf8(text);
    const blocks = [];
    for (let i = 0; i < bytes.length; i++) {
      const { r, C1, S } = secretAt(i);
      const M = encodeByte(bytes[i]);
      blocks.push({ index: i, byte: bytes[i], M, r, C1, S, C2: addPoints(M, S) });
      if (i % 25 === 24) yield;
    }
    return { text, bytes, blocks };
  }
  const encrypt = (text) => runSteps(encryptSteps(text));
  /** Decryption of blocks { C1, C2 } with k: S = k C1, M = C2 - S, and the byte of M (-1 if M encodes no byte). */
  function decrypt(blocks) {
    const out = blocks.map(({ C1, C2 }) => {
      const id = C1 === null ? -1n : C1.x * 2n + (C1.y & 1n);
      let S = shared.get(id);
      if (S === undefined) {
        S = multiply(C1, k);
        shared.set(id, S);
      }
      const M = subtractPoints(C2, S);
      return { S, M, byte: decodeByte(M) };
    });
    const ok = out.every((b) => b.byte >= 0);
    const bytes = Uint8Array.from(out, (b) => Math.max(0, b.byte));
    return { blocks: out, ok, bytes, text: ok ? utf8Decode(bytes) : null };
  }
  return { k, K, encrypt, encryptSteps, decrypt };
}

/** The ciphertext as bytes: C1 || C2 for every block, in compressed form, 66 bytes per byte of message. */
const ciphertextBytes = (blocks) => concat(...blocks.flatMap((b) => [encodeCompressed(b.C1), encodeCompressed(b.C2)]));

// ---------------------------------------------------------------------------
// 4. The Caesar cipher
// ---------------------------------------------------------------------------

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** The shift of Caesar himself, according to Suetonius: D for A. */
const DEFAULT_SHIFT = 3;

const isUpper = (c) => c >= 65 && c <= 90;
const isLower = (c) => c >= 97 && c <= 122;

/**
 * The Caesar cipher: every letter a-z and A-Z moves `shift` places forward
 * in the alphabet, from z back to a, keeping its case; anything else
 * (spaces, punctuation, digits, accented letters) stays as it is.
 */
function caesar(text, shift) {
  const s = ((shift % 26) + 26) % 26;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (isUpper(c)) out += String.fromCharCode(65 + ((c - 65 + s) % 26));
    else if (isLower(c)) out += String.fromCharCode(97 + ((c - 97 + s) % 26));
    else out += text[i];
  }
  return out;
}

/** Decryption: the same cipher with the opposite shift. */
const caesarDecrypt = (text, shift) => caesar(text, -shift);

/** The shift typed by the user: an integer from 0 to 25. */
function parseShift(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const s = Number(t);
  if (s > 25) return { ok: false, error: 'range' };
  return { ok: true, value: s };
}

/** The letters a-z of a text, case ignored, as numbers 0-25 (a = 0); everything else is skipped. */
function letterIndices(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (isUpper(c)) out.push(c - 65);
    else if (isLower(c)) out.push(c - 97);
  }
  return Uint8Array.from(out);
}

/** How many times each of the 26 letters occurs. */
function letterCounts(letters) {
  const counts = new Array(26).fill(0);
  for (const x of letters) counts[x]++;
  return counts;
}

/** The words of a text, as maximal runs of letters a-z (case ignored), each an array of numbers 0-25. */
function wordsOf(text) {
  const words = [];
  let word = [];
  for (let i = 0; i <= text.length; i++) {
    const c = i < text.length ? text.charCodeAt(i) : 0;
    if (isUpper(c) || isLower(c)) word.push((c | 32) - 97);
    else if (word.length) {
      words.push(Uint8Array.from(word));
      word = [];
    }
  }
  return words;
}

const wordString = (word, shift = 0) => {
  let s = '';
  for (const x of word) s += ALPHABET[(x - shift + 26) % 26];
  return s;
};

// ---------------------------------------------------------------------------
// 5. The corpus and its language models
// ---------------------------------------------------------------------------

/**
 * The chapters of the corpus by role: `training` estimates the language
 * models; inside it, `fit` and `validation` choose their smoothing; `test`
 * is where the attack is measured, on text it has never seen.
 */
const SPLIT = Object.freeze({
  training: Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']),
  fit: Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']),
  validation: Object.freeze(['VIII', 'IX']),
  test: Object.freeze(['X', 'XI', 'XII']),
});

let corpusChecked = false;

/** Checks the corpus against its SHA-256 fingerprint, once: a changed character would change every number. */
function checkCorpus() {
  if (corpusChecked) return;
  const canonical = `${CHAPTERS.map((c) => `CHAPTER ${c.number}. ${c.title}\n${c.paragraphs.join('\n')}`).join('\n')}\n`;
  if (toHex(sha256(utf8(canonical))) !== CORPUS_SHA256) fail('the corpus does not match its SHA-256 fingerprint');
  corpusChecked = true;
}

/** The chapters of the corpus, with their number of letters. */
function corpusChapters() {
  checkCorpus();
  return CHAPTERS.map((c) => ({ number: c.number, title: c.title, paragraphs: c.paragraphs.length, letters: c.paragraphs.reduce((s, p) => s + letterIndices(p).length, 0) }));
}

/** The text of some chapters, one paragraph per line. */
function corpusText(numbers) {
  checkCorpus();
  return CHAPTERS.filter((c) => numbers.includes(c.number))
    .map((c) => c.paragraphs.join('\n'))
    .join('\n');
}

/** The orders of the Markov models of the letters: from n = 1 (single letters) to n = 4 (quadgrams). */
const MAX_ORDER = 4;

/** The candidate strengths beta of the smoothing, chosen on the validation chapters. */
const SMOOTHING_GRID = Object.freeze([0.1, 0.3, 1, 3, 10, 30, 100]);

/** The n-grams of a letter sequence, each counted at the index given by its letters as a number in base 26. */
function ngramCounts(letters, n) {
  const counts = new Float64Array(26 ** n);
  const keep = 26 ** (n - 1);
  let h = 0;
  for (let t = 0; t < letters.length; t++) {
    h = (h % keep) * 26 + letters[t];
    if (t >= n - 1) counts[h]++;
  }
  return counts;
}

/**
 * P(x | h) for every n-gram h x, smoothed toward the model of order n - 1
 * (the same context without its oldest letter, h'):
 * P_n(x | h) = (c(h x) + beta P_(n-1)(x | h')) / (c(h) + beta), and the
 * uniform 1/26 below order 1. A context seen often keeps its own counts,
 * one seen rarely borrows from the shorter context, and an unseen one is
 * the shorter context: the posterior mean under a Dirichlet prior centred
 * on the lower order, worth beta observations. Additive smoothing, which
 * would give an unseen context the uniform distribution, rewards the
 * nonsense of a wrong decryption.
 */
function smoothedProbabilities(counts, n, beta, lower) {
  const out = new Float64Array(counts.length);
  const keep = 26 ** Math.max(0, n - 2);
  for (let h = 0; h < counts.length / 26; h++) {
    let total = 0;
    for (let x = 0; x < 26; x++) total += counts[h * 26 + x];
    const base = (h % keep) * 26;
    for (let x = 0; x < 26; x++) {
      const prior = n === 1 ? 1 / 26 : lower[base + x];
      out[h * 26 + x] = (counts[h * 26 + x] + beta * prior) / (total + beta);
    }
  }
  return out;
}

/**
 * Natural log-likelihood of the letters (c - shift) mod 26 under a Markov
 * model of order n - 1 (an n-gram model): every letter is scored given the
 * n - 1 before it, and the first n - 1 letters with the lower orders.
 * `model.logs[j - 1]` is the table of the j-grams.
 */
function sequenceLogLikelihood(model, letters, shift = 0) {
  const n = model.logs.length;
  const keep = 26 ** (n - 1);
  let ctx = 0;
  let total = 0;
  for (let t = 0; t < letters.length; t++) {
    const idx = ctx * 26 + ((letters[t] - shift + 26) % 26);
    total += model.logs[Math.min(t, n - 1)][idx];
    ctx = idx % keep;
  }
  return total;
}

/** Cross-entropy of a letter sequence under a model, in bits per letter: how many bits per letter the model needs to encode it. */
const crossEntropyBits = (model, letters) => -sequenceLogLikelihood(model, letters) / (letters.length * Math.LN2);

/**
 * The smoothing of the language models, chosen without looking at the
 * test chapters: for every order n = 1..4, the beta of SMOOTHING_GRID
 * under which the validation chapters are most likely when the counts come
 * from the other training chapters (the lower orders keep the beta already
 * chosen for them). Returns the betas and the validation cross-entropies.
 */
function* chooseSmoothingSteps() {
  const fitLetters = letterIndices(corpusText(SPLIT.fit));
  const validLetters = letterIndices(corpusText(SPLIT.validation));
  const logs = [];
  const betas = [];
  const validation = [];
  let lower = null;
  for (let n = 1; n <= MAX_ORDER; n++) {
    const counts = ngramCounts(fitLetters, n);
    let best = null;
    const row = [];
    for (const beta of SMOOTHING_GRID) {
      const probs = smoothedProbabilities(counts, n, beta, lower);
      const table = probs.map(Math.log);
      const h = crossEntropyBits({ logs: [...logs, table] }, validLetters);
      row.push(h);
      if (best === null || h < best.h) best = { beta, h, probs, table };
      yield;
    }
    betas.push(best.beta);
    validation.push(row);
    logs.push(best.table);
    lower = best.probs;
  }
  return { betas, validation };
}

const modelCache = new Map();

/**
 * The language models of the attack, estimated on all the training
 * chapters with the chosen smoothing: the tables of the n-grams for
 * n = 1..4, the letter frequencies q, the most frequent letter and the
 * vocabulary (the words seen in training, for the dictionary method).
 */
function languageModels(betas) {
  const id = betas.join(',');
  if (modelCache.has(id)) return modelCache.get(id);
  const text = corpusText(SPLIT.training);
  const letters = letterIndices(text);
  const logs = [];
  let lower = null;
  betas.forEach((beta, i) => {
    lower = smoothedProbabilities(ngramCounts(letters, i + 1), i + 1, beta, lower);
    logs.push(lower.map(Math.log));
  });
  const counts = letterCounts(letters);
  const q = Array.from(logs[0], Math.exp);
  const vocabulary = new Set(wordsOf(text).map((w) => wordString(w)));
  const models = {
    betas: betas.slice(),
    logs,
    counts,
    letters: letters.length,
    q,
    top: q.indexOf(Math.max(...q)),
    vocabulary,
    order: (n) => ({ logs: logs.slice(0, n) }),
  };
  modelCache.set(id, models);
  return models;
}

let frequencies = null;

/** The letter frequencies of the training chapters, plain counts over the total: the reference of the charts. */
function trainingFrequencies() {
  if (!frequencies) {
    const counts = letterCounts(letterIndices(corpusText(SPLIT.training)));
    const N = counts.reduce((s, c) => s + c, 0);
    frequencies = counts.map((c) => c / N);
  }
  return frequencies;
}

/** Shannon entropy of a distribution, in bits. */
const entropyBits = (p) => -p.reduce((s, v) => (v > 0 ? s + v * Math.log2(v) : s), 0);

/** Index of coincidence: the probability that two symbols drawn without replacement are equal. */
function coincidenceIndex(counts) {
  const N = counts.reduce((s, c) => s + c, 0);
  return N > 1 ? counts.reduce((s, c) => s + c * (c - 1), 0) / (N * (N - 1)) : NaN;
}

// ---------------------------------------------------------------------------
// 6. Statistical cryptanalysis of the Caesar cipher
// ---------------------------------------------------------------------------

/** The methods compared in section 3.4, from the least to the most information about the language. */
const METHODS = Object.freeze(['top', 'chi2', 'unigram', 'bigram', 'quadgram', 'dictionary']);

/** What every method looks at in a ciphertext: its letters, their counts and its words. */
function analyzeCiphertext(text) {
  const letters = letterIndices(text);
  return { letters, counts: letterCounts(letters), words: wordsOf(text) };
}

/**
 * The score of each of the 26 shifts s (decryption with s) for a
 * ciphertext, the higher the more plausible:
 *   top        the count of the ciphertext letter that s maps to the most
 *              frequent letter of the corpus (e);
 *   chi2       minus Pearson's chi-square between the decrypted letter
 *              counts and their expectation L q;
 *   unigram    the log-likelihood of the decrypted letters under the
 *              letter frequencies q: maximum likelihood;
 *   bigram, quadgram  the log-likelihood under the Markov models of order
 *              1 and 3 (n-gram scoring);
 *   dictionary the letters of the decrypted words that the corpus
 *              contains: exhaustive key search with a recognizer of words.
 */
function shiftScores(method, a, models) {
  const scores = new Array(26).fill(0);
  const L = a.letters.length;
  for (let s = 0; s < 26; s++) {
    if (method === 'top') scores[s] = a.counts[(models.top + s) % 26];
    else if (method === 'chi2') {
      let chi2 = 0;
      for (let x = 0; x < 26; x++) {
        const e = L * models.q[x];
        chi2 += (a.counts[(x + s) % 26] - e) ** 2 / e;
      }
      scores[s] = L ? -chi2 : 0;
    } else if (method === 'unigram') {
      let ll = 0;
      for (let x = 0; x < 26; x++) ll += a.counts[(x + s) % 26] * models.logs[0][x];
      scores[s] = ll;
    } else if (method === 'bigram') scores[s] = sequenceLogLikelihood(models.order(2), a.letters, s);
    else if (method === 'quadgram') scores[s] = sequenceLogLikelihood(models.order(4), a.letters, s);
    else if (method === 'dictionary') {
      let found = 0;
      for (const w of a.words) if (models.vocabulary.has(wordString(w, s))) found += w.length;
      scores[s] = found;
    } else fail(`unknown method ${describe(method)}`);
  }
  return scores;
}

/** The shifts with the best score: more than one when they tie. */
function bestShifts(scores) {
  const max = Math.max(...scores);
  const tolerance = 1e-9 * Math.max(1, Math.abs(max));
  return scores.flatMap((v, s) => (max - v <= tolerance ? [s] : []));
}

/** The posterior probability of each shift under a uniform prior, from log-likelihoods. */
function posteriorOf(logLikelihoods) {
  const max = Math.max(...logLikelihoods);
  const w = logLikelihoods.map((v) => Math.exp(v - max));
  const z = w.reduce((s, v) => s + v, 0);
  return w.map((v) => v / z);
}

/**
 * The statistical attack on one ciphertext: the scores and the best shifts
 * of every method, the posterior of the shifts under the letter
 * frequencies, and the 26 candidate decryptions with their
 * log-likelihood. The recovered key is the maximum-likelihood shift.
 */
function crackCaesar(ciphertext, models) {
  const a = analyzeCiphertext(ciphertext);
  const methods = {};
  for (const m of METHODS) {
    const scores = shiftScores(m, a, models);
    methods[m] = { scores, best: bestShifts(scores) };
  }
  const best = methods.unigram.best;
  const key = a.letters.length > 0 && best.length === 1 ? best[0] : null;
  const candidates = methods.unigram.scores.map((ll, s) => ({ shift: s, logLikelihood: ll, perLetter: a.letters.length ? ll / a.letters.length : NaN, text: caesarDecrypt(ciphertext, s) }));
  return {
    letters: a.letters.length,
    counts: a.counts,
    methods,
    posterior: posteriorOf(methods.unigram.scores),
    posteriorQuadgram: posteriorOf(methods.quadgram.scores),
    key,
    candidates,
    fit: key === null ? null : letterFit(a.counts, key, models),
  };
}

/**
 * The check of a decryption: the counts of its letters against L q, with
 * the chi-square goodness of fit of section 8. Under the right shift the
 * text should look like English; under any other it should not.
 */
function letterFit(counts, shift, models) {
  const shifted = Array.from({ length: 26 }, (_, x) => counts[(x + shift) % 26]);
  return goodnessOfFit(shifted, models.q);
}

// ---------------------------------------------------------------------------
// 7. Attacks on the toy scheme
// ---------------------------------------------------------------------------

/** How many candidates the page tries by exhaustive search on the key of section 1, before extrapolating to the whole range. */
const EXHAUSTIVE_LIMIT = 2 ** 20;

/** Seed of the kangaroos' starting offsets and of the keys of the scaling experiment. */
const ATTACK_SEED = 2026;

/** Points walked together by the exhaustive search and by the giant steps: one inversion every LANES additions. */
const LANES = 256;

/**
 * Exhaustive search: k = 1, 2, 3, ... until kG = K, for at most `limit`
 * candidates. The candidates are walked in LANES parallel lanes (lane j
 * holds (t LANES + j + 1)G at round t, and a round adds LANES G to all of
 * them with one inversion), but checked in increasing order, so the
 * number tested is exactly k when k <= limit: one group operation per
 * candidate.
 */
function* exhaustiveSteps(K, limit) {
  const started = now();
  const width = Math.max(1, Math.min(LANES, limit));
  const start = successiveMultiples(G, width);
  const xs = start.map((P) => P.x);
  const ys = start.map((P) => P.y);
  const step = start[width - 1];
  const qx = new Array(width).fill(step.x);
  const qy = new Array(width).fill(step.y);
  for (let base = 0; base < limit; base += width) {
    for (let j = 0; j < width && base + j < limit; j++) {
      if (xs[j] === K.x && ys[j] === K.y) return { found: true, key: base + j + 1, ops: base + j + 1, limit, ms: now() - started };
    }
    if (base + width >= limit) break;
    addInPlace(xs, ys, qx, qy);
    if ((base / width) % 8 === 7) yield;
  }
  return { found: false, key: null, ops: limit, limit, ms: now() - started };
}

const babyTables = new Map();

/**
 * The baby steps: x(jG) for j = 1..m in a hash table, with the parity of y
 * to tell jG from -jG. It does not depend on the key under attack: built
 * once for every m, it serves every key of the same size.
 */
function* babySteps(m) {
  if (babyTables.has(m)) return babyTables.get(m);
  const table = new Map();
  // the same lanes as the exhaustive search: lane j holds (t LANES + j + 1)G at round t
  const width = Math.min(LANES, m);
  const start = successiveMultiples(G, width);
  const xs = start.map((P) => P.x);
  const ys = start.map((P) => P.y);
  const step = start[width - 1];
  const qx = new Array(width).fill(step.x);
  const qy = new Array(width).fill(step.y);
  let last = null;
  for (let base = 0; base < m; base += width) {
    for (let j = 0; j < width && base + j < m; j++) {
      const id = xKey(xs[j]);
      if (!table.has(id)) table.set(id, 2 * (base + j + 1) + Number(ys[j] & 1n));
      if (base + j + 1 === m) last = { x: xs[j], y: ys[j] };
    }
    if (base + width >= m) break;
    addInPlace(xs, ys, qx, qy);
    if ((base / width) % 8 === 7) yield;
  }
  const entry = { table, mG: last };
  babyTables.set(m, entry);
  return entry;
}

/**
 * Baby-step giant-step (Shanks, 1971) for k in [1, 2^bits). With
 * m = 2^ceil(bits / 2), every k is i m + j with 0 <= i <= 2^bits / m and
 * 0 <= j <= m. The baby steps store x(jG) for j = 1..m; the giant steps
 * walk Q_i = K - i mG for i = 0, 1, ... until Q_i = jG (k = i m + j) or
 * Q_i = -jG (k = i m - j). About m + k / m group operations, at most about
 * 2 sqrt(2^bits), paid with a table of m points. The giant steps go in
 * LANES parallel lanes, checked in increasing i.
 */
function* bsgsSteps(K, bits) {
  const started = now();
  const w = 2 ** bits;
  const m = 2 ** Math.ceil(bits / 2);
  const { table, mG } = yield* babySteps(m);
  const giants = Math.floor(w / m) + 1;
  const width = Math.min(LANES, giants);
  const negmG = negate(mG);
  const lanes = [];
  let acc = [K.x, K.y, 1n];
  for (let l = 0; l < width; l++) {
    lanes.push(acc);
    acc = jAddAffine(acc, negmG);
  }
  const start = toAffineAll(lanes);
  const xs = start.map((P) => (P === null ? null : P.x));
  const ys = start.map((P) => (P === null ? null : P.y));
  const step = negate(multiply(mG, BigInt(width)));
  const qx = new Array(width).fill(step.x);
  const qy = new Array(width).fill(step.y);
  const result = (key, i) => ({ found: true, key, ops: m + i, baby: m, giant: i + 1, table: table.size, bits, ms: now() - started });
  for (let base = 0; base < giants; base += width) {
    for (let l = 0; l < width && base + l < giants; l++) {
      const i = base + l;
      if (xs[l] === null) {
        // Q_i = O: K = i mG
        if (i * m >= 1 && i * m < w && pointsEqual(multiplyG(BigInt(i * m)), K)) return result(i * m, i);
        continue;
      }
      const v = table.get(xKey(xs[l]));
      if (v === undefined) continue;
      const j = Math.floor(v / 2);
      const k = (v & 1) === Number(ys[l] & 1n) ? i * m + j : i * m - j;
      if (k >= 1 && k < w && pointsEqual(multiplyG(BigInt(k)), K)) return result(k, i);
    }
    if (base + width >= giants) break;
    addInPlace(xs, ys, qx, qy);
    yield;
  }
  return { found: false, key: null, ops: m + giants, baby: m, giant: giants, table: table.size, bits, ms: now() - started };
}

/**
 * Pollard's kangaroo method (1978), in the parallel form of van Oorschot
 * and Wiener (1999), for k in [1, 2^bits). Two herds of `herd` kangaroos
 * jump along the group, each jump of 2^j G with j chosen by the current
 * point: the tame ones from known multiples of G in the middle of the
 * interval, the wild ones from K plus known offsets. The walk depends only
 * on the point, so a wild kangaroo that lands where a tame one has been
 * follows its trail from then on, and the meeting shows at the next
 * distinguished point (x with its lowest d bits at zero), stored with the
 * distance travelled: tame exponent = k + wild offset, and k follows.
 * About 2 sqrt(2^bits) jumps in all, and memory only for the
 * distinguished points. The mean jump N sqrt(2^bits) / 4, for N
 * kangaroos, is the one that minimizes the expected work.
 */
function* kangarooSteps(K, bits, { seed = ATTACK_SEED, herd = 8 } = {}) {
  const started = now();
  const rand = prng(seed);
  const w = 2 ** bits;
  const N = 2 * herd;
  const target = (N * Math.sqrt(w)) / 4;
  const meanOf = (t) => (2 ** t - 1) / t;
  let t = 1;
  for (let c = 2; c <= 52; c++) if (Math.abs(meanOf(c) - target) < Math.abs(meanOf(t) - target)) t = c;
  const jumpPoints = [G];
  for (let j = 1; j < t; j++) jumpPoints.push(toAffine(jDouble([jumpPoints[j - 1].x, jumpPoints[j - 1].y, 1n])));
  const meanJump = meanOf(t);
  const dpBits = Math.max(0, Math.round(bits / 2 - Math.log2(N) - 3));
  const dpMask = BigInt(2 ** dpBits - 1);
  const spacing = Math.max(1, Math.round(meanJump / herd));
  const traps = new Map();
  let ops = 0;
  let sameHerd = 0;
  let restarts = 0;
  const limit = 64 * Math.sqrt(w) + 64 * N * 2 ** dpBits + 1024;
  for (;;) {
    // tame kangaroos: exponent w/2 + i * spacing; wild ones: k + offset, offset = i * spacing (+ a random shift after a restart)
    const shift = restarts === 0 ? 0 : Math.floor(rand() * meanJump);
    const tame = [];
    const exps = [];
    for (let i = 0; i < N; i++) {
      const isTame = i < herd;
      const e = isTame ? Math.floor(w / 2) + (i % herd) * spacing + shift : (i % herd) * spacing + shift;
      tame.push(isTame);
      exps.push(e);
    }
    const startPoints = exps.map((e, i) => (tame[i] ? multiplyG(BigInt(e)) : e === 0 ? K : addPoints(K, multiplyG(BigInt(e)))));
    const xs = startPoints.map((P) => P.x);
    const ys = startPoints.map((P) => P.y);
    const qx = new Array(N);
    const qy = new Array(N);
    let rounds = 0;
    const roundLimit = Math.ceil(limit / N);
    while (rounds < roundLimit) {
      for (let i = 0; i < N; i++) {
        const j = Number((xs[i] >> 64n) & 0xffffn) % t;
        qx[i] = jumpPoints[j].x;
        qy[i] = jumpPoints[j].y;
        exps[i] += 2 ** j;
      }
      addInPlace(xs, ys, qx, qy);
      ops += N;
      rounds++;
      for (let i = 0; i < N; i++) {
        if ((xs[i] & dpMask) !== 0n) continue;
        const id = xKey(xs[i]);
        const seen = traps.get(id);
        if (seen === undefined) {
          traps.set(id, { tame: tame[i], e: exps[i] });
        } else if (seen.tame !== tame[i]) {
          const k = tame[i] ? exps[i] - seen.e : seen.e - exps[i];
          if (k >= 1 && k < w && pointsEqual(multiplyG(BigInt(k)), K)) {
            return { found: true, key: k, ops, herd, N, meanJump, jumps: t, dpBits, distinguished: traps.size, sameHerd, restarts, expected: 2 * Math.sqrt(w) + N * 2 ** dpBits, bits, ms: now() - started };
          }
        } else {
          // two kangaroos of the same herd on the same trail: this one moves on by a random distance
          sameHerd++;
          const r = 1 + Math.floor(rand() * meanJump);
          const P = addPoints({ x: xs[i], y: ys[i] }, multiplyG(BigInt(r)));
          xs[i] = P.x;
          ys[i] = P.y;
          exps[i] += r;
          ops++;
        }
      }
      if (rounds % 64 === 0) yield;
    }
    restarts++;
    if (restarts > 8) return { found: false, key: null, ops, herd, N, meanJump, jumps: t, dpBits, distinguished: traps.size, sameHerd, restarts, expected: 2 * Math.sqrt(w) + N * 2 ** dpBits, bits, ms: now() - started };
    traps.clear();
  }
}

/** Runs one of the generators above to the end, in one go (a worker, the command line). */
function runSteps(steps) {
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

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

/** The public key as the attacks receive it: the compressed point, checked to be on the curve. */
const publicKeyFromHex = (hex) => decodeCompressed(fromHex(hex));

/** The three attacks of section 4 on a public key of the toy scheme, by name: exhaustive search on the first EXHAUSTIVE_LIMIT candidates, baby-step giant-step and kangaroo on the whole 32-bit range. */
function attackSteps(name, publicKeyHexValue) {
  const K = publicKeyFromHex(publicKeyHexValue);
  if (name === 'exhaustive') return exhaustiveSteps(K, EXHAUSTIVE_LIMIT);
  if (name === 'bsgs') return bsgsSteps(K, KEY_BITS);
  if (name === 'kangaroo') return kangarooSteps(K, KEY_BITS);
  return fail(`unknown attack ${describe(name)}`);
}

/** A nonce used for every byte by the flawed variant of section 4.7. */
const REUSED_NONCE = seededNonce(0, `${NONCE_SEED} (reused)`);

let byteModel = null;

/**
 * The frequencies of the 256 byte values in the UTF-8 text of the training
 * chapters, with add-1/2 smoothing: a model of English text byte by byte,
 * spaces and punctuation included.
 */
function byteLogs() {
  if (!byteModel) {
    const counts = new Array(256).fill(0);
    for (const b of utf8(corpusText(SPLIT.training))) counts[b]++;
    const total = counts.reduce((s, c) => s + c, 0);
    byteModel = counts.map((c) => Math.log((c + 0.5) / (total + 128)));
  }
  return byteModel;
}

/**
 * The attack on the flawed variant with one nonce for every byte. All C1
 * are equal, and C2_i = b_i G + S with the same S: the differences
 * C2_i - C2_0 = (b_i - b_0) G give b_i - b_0, a discrete logarithm in
 * [-255, 255] read from the table of the 256 points. The message is then
 * known up to the single byte b_0: a Caesar cipher on the byte values,
 * broken like the one of section 3, here with the byte frequencies of the
 * corpus. No private key and no large logarithm are needed.
 */
function nonceReuseAttack(blocks) {
  if (!blocks.length) return null;
  const sameC1 = blocks.every((b) => pointsEqual(b.C1, blocks[0].C1));
  const diffs = blocks.map((b) => {
    const D = subtractPoints(b.C2, blocks[0].C2);
    if (D === null) return 0;
    const plus = decodeByte(D);
    if (plus >= 0) return plus;
    const minus = decodeByte(negate(D));
    return minus >= 0 ? -minus : null;
  });
  if (diffs.includes(null)) return { sameC1, diffs: null, candidates: [], valid: 0 };
  const logs = byteLogs();
  const lo = -Math.min(...diffs);
  const hi = 255 - Math.max(...diffs);
  const candidates = [];
  for (let b0 = lo; b0 <= hi; b0++) {
    const bytes = Uint8Array.from(diffs, (d) => b0 + d);
    const text = utf8Decode(bytes);
    if (text === null) continue;
    candidates.push({ b0, text, score: bytes.reduce((s, b) => s + logs[b], 0) });
  }
  candidates.sort((a, b) => b.score - a.score);
  return { sameC1, diffs, candidates: candidates.slice(0, 5), valid: candidates.length, range: hi - lo + 1 };
}

/**
 * The ciphertext with delta G added to every C2: with the same k it
 * decrypts to every byte plus delta. Nobody needs k to do it: the scheme
 * is malleable, and with delta = 1 this is the cipher of Augustus, one
 * letter forward, applied to an encrypted message.
 */
function shiftCiphertext(blocks, delta) {
  const D = delta >= 0 ? encodeByte(delta) : negate(encodeByte(-delta));
  return blocks.map((b) => ({ C1: b.C1, C2: addPoints(b.C2, D) }));
}

// ---------------------------------------------------------------------------
// 8. Statistics: hypothesis tests and experiments
// ---------------------------------------------------------------------------

const SIGNIFICANCE = 0.05;

/** Seed of the generator of the experiments' random choices: passages, keys, samples. */
const EXPLORE_SEED = 2026;

/**
 * Sizes of the experiments, chosen so that the computations take a few
 * seconds. The random choices come from a seeded generator, so the page,
 * the downloadable program and the command line print the same numbers
 * (except the times, which depend on the machine).
 */
const SAMPLES = Object.freeze({
  maxTrials: 2000, // ciphertexts per length in the Caesar experiment, fewer when the test chapters do not hold that many disjoint passages
  ecBytes: 1500, // bytes of test text encrypted with the toy scheme, for the statistics of its ciphertext
  keys: 400, // public keys of 32-bit private keys, and as many of full-range ones
});

/** The lengths of the Caesar ciphertexts, in letters. */
const LENGTHS = Object.freeze([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200]);

/** The key sizes, in bits, of the scaling experiment of the attacks, and how many keys are drawn for each. */
const SCALING = Object.freeze({
  exhaustive: Object.freeze({ bits: Object.freeze([8, 10, 12, 14]), trials: 16 }),
  bsgs: Object.freeze({ bits: Object.freeze([8, 12, 16, 20, 24, 28, 32]), trials: 12 }),
  kangaroo: Object.freeze({ bits: Object.freeze([8, 12, 16, 20, 24, 28]), trials: 8 }),
});

/** The exponent of every attack according to the theory: about c 2^(exponent x bits) group operations. */
const THEORY = Object.freeze({ exhaustive: 1, bsgs: 0.5, kangaroo: 0.5 });

/** Seeded generator (mulberry32): the same numbers everywhere. */
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randomBytesFrom = (rand, length) => {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(rand() * 256);
  return out;
};

function logGamma(z) {
  // Lanczos approximation, g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const w = z - 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (w + i);
  const t = w + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (w + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Regularized upper incomplete gamma Q(s, x): series below s + 1, continued fraction above. */
function gammaQ(s, x) {
  if (!(s > 0) || !(x >= 0)) return NaN;
  if (x === 0) return 1;
  const front = Math.exp(-x + s * Math.log(x) - logGamma(s));
  if (x < s + 1) {
    let term = 1 / s;
    let total = term;
    for (let n = 1; n < 1000; n++) {
      term *= x / (s + n);
      total += term;
      if (Math.abs(term) < Math.abs(total) * 1e-15) break;
    }
    return Math.max(0, 1 - total * front);
  }
  const tiny = 1e-300;
  let b = x + 1 - s;
  let c = 1 / tiny;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - s);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-15) break;
  }
  return Math.min(1, front * h);
}

/** P(X >= chi2) for a chi-square variable with df degrees of freedom. */
const chiSquarePValue = (chi2, df) => (df > 0 && chi2 >= 0 ? gammaQ(df / 2, chi2 / 2) : NaN);

/** Probability that |Z| > z for a standard normal Z. */
const twoSidedNormalTail = (z) => gammaQ(0.5, (z * z) / 2);

const finish = (test) => ({ ...test, verdict: test.pValue < SIGNIFICANCE ? 'reject' : 'notReject', alpha: SIGNIFICANCE });

/** Binomial test of a rate against p, normal approximation with continuity correction (valid here: n p (1 - p) is large). */
function binomialTest(successes, trials, p) {
  const mean = trials * p;
  const sd = Math.sqrt(trials * p * (1 - p));
  const excess = Math.abs(successes - mean) - 0.5;
  const z = sd > 0 && excess > 0 ? (Math.sign(successes - mean) * excess) / sd : 0;
  return finish({ kind: 'binomial', successes, trials, expectedRate: p, rate: successes / trials, z, pValue: twoSidedNormalTail(z) });
}

/**
 * Chi-square goodness of fit of counts against probabilities. Neighbouring
 * classes are merged until each expects at least 5 observations (Cochran),
 * so that the chi-square approximation holds.
 */
function goodnessOfFit(counts, probabilities) {
  const N = counts.reduce((s, c) => s + c, 0);
  const merged = [];
  let o = 0;
  let e = 0;
  counts.forEach((c, i) => {
    o += c;
    e += probabilities[i] * N;
    if (e >= 5) {
      merged.push([o, e]);
      o = 0;
      e = 0;
    }
  });
  if (merged.length && (o > 0 || e > 0)) {
    merged[merged.length - 1][0] += o;
    merged[merged.length - 1][1] += e;
  }
  const chi2 = merged.reduce((s, [obs, exp]) => s + (obs - exp) ** 2 / exp, 0);
  const df = merged.length - 1;
  return finish({ kind: 'chi2', N, classes: merged.length, df, chi2, pValue: df > 0 ? chiSquarePValue(chi2, df) : NaN });
}

/**
 * Chi-square test of independence on a contingency table of counts: the
 * expected counts come from the margins, with (r - 1)(c - 1) degrees of
 * freedom. Cramer's V = sqrt(chi2 / (N (min(r, c) - 1))) measures the
 * strength of the dependence, from 0 (none) to 1 (each row determines the
 * column). Empty rows and columns are left out.
 */
function independenceTest(table) {
  const rowsAll = table.map((row) => row.reduce((s, v) => s + v, 0));
  const colsAll = table[0].map((_, j) => table.reduce((s, row) => s + row[j], 0));
  const rows = table.filter((_, i) => rowsAll[i] > 0).map((row) => row.filter((_, j) => colsAll[j] > 0));
  const R = rows.length;
  const C = R ? rows[0].length : 0;
  const rowSums = rows.map((row) => row.reduce((s, v) => s + v, 0));
  const colSums = Array.from({ length: C }, (_, j) => rows.reduce((s, row) => s + row[j], 0));
  const N = rowSums.reduce((s, v) => s + v, 0);
  let chi2 = 0;
  let minExpected = Infinity;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      const e = (rowSums[i] * colSums[j]) / N;
      minExpected = Math.min(minExpected, e);
      chi2 += (rows[i][j] - e) ** 2 / e;
    }
  }
  const df = (R - 1) * (C - 1);
  return finish({ kind: 'independence', N, rows: R, cols: C, df, chi2, minExpected, cramerV: Math.sqrt(chi2 / (N * (Math.min(R, C) - 1))), pValue: df > 0 ? chiSquarePValue(chi2, df) : NaN });
}

/** Wilson score interval of a proportion (95%): unlike p +- 1.96 sd, it stays inside [0, 1] and works near 0 and 1. */
function wilsonInterval(rate, n, z = 1.959963984540054) {
  if (!(n > 0)) return [NaN, NaN];
  const z2 = z * z;
  const center = (rate + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z * Math.sqrt((rate * (1 - rate)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

/**
 * Share of ones at every bit position of a list of equally long byte
 * arrays, with a z-score per position against 1/2 and the global test
 * sum(z^2) ~ chi-square(positions): for uniform outputs every bit is an
 * independent fair coin.
 */
function bitBalance(samples, bits) {
  const N = samples.length;
  const ones = new Array(bits).fill(0);
  for (const s of samples) {
    for (let j = 0; j < bits; j++) ones[j] += (s[j >> 3] >> (7 - (j & 7))) & 1;
  }
  const fractions = ones.map((c) => c / N);
  const z = ones.map((c) => (c - N / 2) / Math.sqrt(N / 4));
  const z2 = z.reduce((s, v) => s + v * v, 0);
  return {
    N,
    bits,
    fractions,
    z,
    beyond3: z.filter((v) => Math.abs(v) > 3).length,
    global: finish({ kind: 'chi2', chi2: z2, df: bits, pValue: chiSquarePValue(z2, bits) }),
  };
}

/** Total variation distance between two distributions: the largest difference in the probability of any set of outcomes. */
const totalVariation = (p, q) => p.reduce((s, v, i) => s + Math.abs(v - q[i]), 0) / 2;

const normalize = (counts) => {
  const N = counts.reduce((s, c) => s + c, 0);
  return counts.map((c) => c / N);
};

/**
 * Chernoff's bound on the error of maximum likelihood with i.i.d. letters
 * from q: the true shift loses to the wrong shift d with probability at
 * most rho_d^L, rho_d = min over lambda of sum_x q(x)^(1 - lambda)
 * q(x - d)^lambda (lambda = 1/2 gives the Bhattacharyya coefficient), and
 * a union over the 25 wrong shifts bounds the error by sum_d rho_d^L. The
 * largest rho_d belongs to the shift most easily confused with the right
 * one, and fixes the exponential rate at which the error vanishes.
 */
function chernoffRates(q) {
  const f = (d, lambda) => q.reduce((s, v, x) => s + v ** (1 - lambda) * q[(x - d + 26) % 26] ** lambda, 0);
  const rho = [NaN];
  for (let d = 1; d < 26; d++) {
    // golden-section search: f is convex in lambda, with f(0) = f(1) = 1
    let a = 0;
    let b = 1;
    const g = (Math.sqrt(5) - 1) / 2;
    for (let it = 0; it < 60; it++) {
      const c = b - g * (b - a);
      const e = a + g * (b - a);
      if (f(d, c) < f(d, e)) b = e;
      else a = c;
    }
    rho.push(f(d, (a + b) / 2));
  }
  return rho;
}

/** The lower bound on the success of maximum likelihood with L i.i.d. letters, from chernoffRates. */
const chernoffSuccess = (rho, L) => Math.max(0, 1 - rho.slice(1).reduce((s, r) => s + r ** L, 0));

/** The longest prefix of a text whose UTF-8 encoding fits in `bytes` bytes. */
function prefixWithin(text, bytes) {
  let used = 0;
  let end = 0;
  for (const ch of text) {
    const size = utf8(ch).length;
    if (used + size > bytes) break;
    used += size;
    end += ch.length;
  }
  return text.slice(0, end);
}

/** The class of a plaintext byte in the independence tests: space, e, t, a, o, another letter, anything else. */
const BYTE_CLASSES = [32, 101, 116, 97, 111];
const byteClass = (b) => {
  const lower = b >= 65 && b <= 90 ? b + 32 : b;
  const i = BYTE_CLASSES.indexOf(lower);
  if (i >= 0) return i;
  return lower >= 97 && lower <= 122 ? 5 : 6;
};

/**
 * The statistical exploration, as a generator that yields between units
 * of work (a page can run it in slices, a worker or the command line in
 * one go):
 *   - the corpus: letter frequencies of training and test chapters;
 *   - the language models: smoothing chosen on validation chapters, and
 *     their cross-entropy on the test chapters;
 *   - the Caesar experiment: every method on disjoint passages of the test
 *     chapters, for every length of LENGTHS, each passage under a random
 *     shift;
 *   - the two ciphertexts of the same test text, Caesar and toy scheme;
 *   - the public keys of 32-bit and of full-range private keys.
 */
function* exploreSteps({ seed = EXPLORE_SEED } = {}) {
  const rand = prng(seed);
  const result = { seed, samples: SAMPLES };

  // --- The corpus and the language models -------------------------------
  const chapters = corpusChapters();
  const trainingLetters = letterIndices(corpusText(SPLIT.training));
  const testText = corpusText(SPLIT.test);
  const testLetters = letterIndices(testText);
  const trainingCounts = letterCounts(trainingLetters);
  const testCounts = letterCounts(testLetters);
  yield;
  const smoothing = yield* chooseSmoothingSteps();
  const models = languageModels(smoothing.betas);
  const crossEntropy = [];
  for (let n = 1; n <= MAX_ORDER; n++) crossEntropy.push(crossEntropyBits(models.order(n), testLetters));
  const maxEntropy = Math.log2(26);
  result.corpus = {
    chapters,
    split: SPLIT,
    training: { letters: trainingLetters.length, counts: trainingCounts, ic: coincidenceIndex(trainingCounts), entropy: entropyBits(normalize(trainingCounts)) },
    test: { letters: testLetters.length, counts: testCounts, ic: coincidenceIndex(testCounts), entropy: entropyBits(normalize(testCounts)) },
    homogeneity: independenceTest([trainingCounts, testCounts]),
    tvd: totalVariation(normalize(trainingCounts), normalize(testCounts)),
    vocabulary: models.vocabulary.size,
  };
  result.models = {
    betas: smoothing.betas,
    grid: SMOOTHING_GRID,
    validation: smoothing.validation,
    crossEntropy,
    maxEntropy,
    redundancy: crossEntropy.map((h) => maxEntropy - h),
    unicity: crossEntropy.map((h) => maxEntropy / (maxEntropy - h)),
    q: models.q,
    top: models.top,
  };
  yield;

  // --- The Caesar experiment ---------------------------------------------
  const positions = [];
  for (let i = 0; i < testText.length; i++) {
    const c = testText.charCodeAt(i);
    if (isUpper(c) || isLower(c)) positions.push(i);
  }
  const trials = [];
  const sums = Object.fromEntries(METHODS.map((m) => [m, []]));
  for (const L of LENGTHS) {
    const blocks = Math.floor(positions.length / L);
    const order = Array.from({ length: blocks }, (_, b) => b);
    for (let t = order.length - 1; t > 0; t--) {
      const r = Math.floor(rand() * (t + 1));
      [order[t], order[r]] = [order[r], order[t]];
    }
    const n = Math.min(SAMPLES.maxTrials, blocks);
    const total = Object.fromEntries(METHODS.map((m) => [m, 0]));
    for (let t = 0; t < n; t++) {
      const b = order[t];
      const passage = testText.slice(positions[b * L], positions[b * L + L - 1] + 1);
      const shift = Math.floor(rand() * 26);
      const a = analyzeCiphertext(caesar(passage, shift));
      for (const m of METHODS) {
        const best = bestShifts(shiftScores(m, a, models));
        if (best.includes(shift)) total[m] += 1 / best.length;
      }
      if (t % 50 === 49) yield;
    }
    trials.push(n);
    for (const m of METHODS) sums[m].push(total[m] / n);
    yield;
  }
  const rho = chernoffRates(models.q);
  const confusable = rho.reduce((best, r, d) => (d > 0 && (best === 0 || r > rho[best]) ? d : best), 0);
  result.caesar = {
    lengths: LENGTHS,
    trials,
    rates: sums,
    intervals: Object.fromEntries(METHODS.map((m) => [m, sums[m].map((r, i) => wilsonInterval(r, trials[i]))])),
    bound: LENGTHS.map((L) => chernoffSuccess(rho, L)),
    rho,
    confusable: { shift: confusable, rho: rho[confusable] },
  };
  yield;

  // --- The same text through both ciphers --------------------------------
  const sampleText = prefixWithin(testText, SAMPLES.ecBytes);
  const scheme = toyScheme(DEFAULT_KEY, { nonces: (i) => seededNonce(i, `${NONCE_SEED} (statistics)`) });
  const { bytes, blocks } = yield* scheme.encryptSteps(sampleText);
  const byteCounts = new Array(256).fill(0);
  const independence = Array.from({ length: BYTE_CLASSES.length + 2 }, () => [0, 0, 0, 0]);
  let odd = 0;
  for (const b of blocks) {
    for (const v of ser256(b.C1.x)) byteCounts[v]++;
    for (const v of ser256(b.C2.x)) byteCounts[v]++;
    if (b.C2.y & 1n) odd++;
    independence[byteClass(b.byte)][Number(b.C2.x >> 254n)]++;
  }
  const plainLetters = letterIndices(sampleText);
  const cipherText = caesar(sampleText, DEFAULT_SHIFT);
  const cipherLetters = letterIndices(cipherText);
  const plainCounts = letterCounts(plainLetters);
  const cipherCounts = letterCounts(cipherLetters);
  // the five classes of the most frequent plaintext letters and the classes of their images
  const topLetters = plainCounts.map((c, x) => [c, x]).sort((a, b) => b[0] - a[0]).slice(0, 4).map(([, x]) => x);
  const letterClass = (x) => (topLetters.includes(x) ? topLetters.indexOf(x) : 4);
  const caesarTable = Array.from({ length: 5 }, () => new Array(5).fill(0));
  plainLetters.forEach((x, i) => {
    caesarTable[letterClass(x)][letterClass((cipherLetters[i] - DEFAULT_SHIFT + 26) % 26)]++;
  });
  const top = topLetters[0];
  const topBlocks = blocks.filter((b) => b.byte === 97 + top);
  result.ciphers = {
    text: sampleText,
    bytes: bytes.length,
    shift: DEFAULT_SHIFT,
    plain: { letters: plainLetters.length, counts: plainCounts, ic: coincidenceIndex(plainCounts), entropy: entropyBits(normalize(plainCounts)) },
    caesar: {
      counts: cipherCounts,
      ic: coincidenceIndex(cipherCounts),
      entropy: entropyBits(normalize(cipherCounts)),
      uniform: goodnessOfFit(cipherCounts, new Array(26).fill(1 / 26)),
      dependence: independenceTest(caesarTable),
      topLetters,
    },
    ec: {
      counts: byteCounts,
      ic: coincidenceIndex(byteCounts),
      entropy: entropyBits(normalize(byteCounts)),
      uniform: goodnessOfFit(byteCounts, new Array(256).fill(1 / 256)),
      parity: binomialTest(odd, blocks.length, 0.5),
      independence: independenceTest(independence),
      bytesPerBlock: 66,
    },
    repeated: {
      letter: top,
      occurrences: topBlocks.length,
      caesarDistinct: new Set(topBlocks.map((b) => caesar(String.fromCharCode(b.byte), DEFAULT_SHIFT))).size,
      ecDistinct: new Set(topBlocks.map((b) => pointHex(b.C2))).size,
    },
  };
  yield;

  // --- Public keys of 32-bit and of full-range private keys --------------
  const small = [];
  const full = [];
  for (let i = 0; i < SAMPLES.keys; i++) {
    const k = 1n + BigInt(Math.floor(rand() * 4294967295));
    small.push(ser256(multiplyG(k).x));
    const r = (bytesToBigInt(randomBytesFrom(rand, 32)) % (CURVE_N - 1n)) + 1n;
    full.push(ser256(multiplyG(r).x));
    if (i % 20 === 19) yield;
  }
  result.keys = { small: bitBalance(small, 256), full: bitBalance(full, 256) };
  return result;
}

/** The whole exploration in one go: for a worker, the command line and the tests. */
const explore = (options) => runSteps(exploreSteps(options));

/** The exploration in slices of a few milliseconds, with the browser free to draw in between. */
const exploreAsync = (options, scheduling) => runStepsAsync(() => exploreSteps(options), scheduling);

/** Least-squares line y = intercept + slope x, with the standard error of the slope. */
function fitLine(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const residuals = xs.reduce((s, x, i) => s + (ys[i] - intercept - slope * x) ** 2, 0);
  return { slope, intercept, slopeError: n > 2 ? Math.sqrt(residuals / (n - 2) / sxx) : NaN };
}

/**
 * How the cost of the three attacks grows with the size of the key: for
 * every size of SCALING, keys drawn uniformly in [1, 2^bits) from the
 * seeded generator, attacked by each method. The group operations do not
 * depend on the machine (exhaustive search: exactly k; baby-step
 * giant-step: m + floor(k / m); kangaroo: the jumps until the meeting);
 * the times do. A line fitted to log2(mean operations) against the bits
 * estimates the exponent; the extrapolation to 256 bits keeps the
 * exponent of the theory and estimates only the constant, because an
 * error of 0.02 in a fitted slope would become a factor 2^5 at 256 bits.
 */
function* scalingSteps({ seed = ATTACK_SEED } = {}) {
  const rand = prng(seed + 1);
  const rows = { exhaustive: [], bsgs: [], kangaroo: [] };
  const timing = { exhaustive: { ops: 0, ms: 0 }, bsgs: { ops: 0, ms: 0 }, kangaroo: { ops: 0, ms: 0 } };
  for (const method of ['exhaustive', 'bsgs', 'kangaroo']) {
    for (const bits of SCALING[method].bits) {
      const ops = [];
      const ms = [];
      for (let t = 0; t < SCALING[method].trials; t++) {
        const k = 1 + Math.floor(rand() * (2 ** bits - 1));
        const K = multiplyG(BigInt(k));
        let r;
        if (method === 'exhaustive') r = yield* exhaustiveSteps(K, 2 ** bits);
        else if (method === 'bsgs') r = yield* bsgsSteps(K, bits);
        else r = yield* kangarooSteps(K, bits, { seed: seed + 7 * t + bits });
        if (!r.found || r.key !== k) fail(`${method}: wrong key for ${bits} bits`);
        ops.push(r.ops);
        ms.push(r.ms);
        timing[method].ops += r.ops;
        timing[method].ms += r.ms;
      }
      rows[method].push({ bits, ops, ms, mean: ops.reduce((s, v) => s + v, 0) / ops.length });
    }
  }
  const fits = {};
  for (const method of Object.keys(rows)) {
    const bits = rows[method].map((r) => r.bits);
    const logs = rows[method].map((r) => Math.log2(r.mean));
    const free = fitLine(bits, logs);
    const constant = logs.reduce((s, v, i) => s + v - THEORY[method] * bits[i], 0) / logs.length;
    fits[method] = { ...free, exponent: THEORY[method], constant };
  }
  // group operations per second on this machine: those of the exhaustive search, nothing but additions
  const rate = timing.exhaustive.ms > 0 ? (1000 * timing.exhaustive.ops) / timing.exhaustive.ms : NaN;
  return { seed: seed + 1, rows, fits, rate, timing };
}

/** The scaling experiment in one go, or in slices. */
const scaling = (options) => runSteps(scalingSteps(options));
const scalingAsync = (options, scheduling) => runStepsAsync(() => scalingSteps(options), scheduling);

/**
 * Every hypothesis test of the exploration, by subject, as [key, test]
 * pairs: the page, the downloadable program and the command line list the
 * same tests in the same order.
 */
function statisticalTests(s) {
  return {
    corpus: [['homogeneity', s.corpus.homogeneity]],
    caesar: [
      ['uniform', s.ciphers.caesar.uniform],
      ['dependence', s.ciphers.caesar.dependence],
    ],
    ec: [
      ['uniform', s.ciphers.ec.uniform],
      ['parity', s.ciphers.ec.parity],
      ['independence', s.ciphers.ec.independence],
    ],
    keys: [
      ['small', s.keys.small.global],
      ['full', s.keys.full.global],
    ],
  };
}

/** The null hypothesis of every test, in English (the page has them in Italian too). */
const TEST_LABELS = Object.freeze({
  corpus: {
    homogeneity: 'Training and test chapters have the same letter frequencies (chi-square, 2 x 26)',
  },
  caesar: {
    uniform: 'The letters of the Caesar ciphertext are uniform over the 26 (chi-square)',
    dependence: 'Plaintext letter and ciphertext letter are independent (chi-square, Caesar)',
  },
  ec: {
    uniform: 'The bytes of x(C1) and x(C2) are uniform over the 256 values (chi-square)',
    parity: 'The y of C2 is odd with probability 1/2 (binomial)',
    independence: 'Plaintext byte and first 2 bits of x(C2) are independent (chi-square)',
  },
  keys: {
    small: 'The bits of x(kG) are fair coins for 32-bit keys: sum z^2 ~ chi-square(256)',
    full: 'The bits of x(kG) are fair coins for full-range keys: sum z^2 ~ chi-square(256)',
  },
});

// ---------------------------------------------------------------------------
// 9. Charts (browser, <canvas>)
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = {
  background: '#ffffff',
  text: '#444444',
  grid: '#eeeeee',
  bars: '#5c6bc0',
  reference: '#d52349',
  highlight: '#d52349',
  series: ['#5c6bc0', '#d52349', '#2e7d6b', '#f0a500', '#8e24aa', '#00838f', '#777777'],
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
const BAR_ASPECT = 0.42;
const BAR_MARGIN = { left: 34, right: 8, top: 10, bottom: 22 };
const LINE_ASPECT = 0.56;
const LINE_MARGIN = { left: 40, right: 12, top: 10, bottom: 24 };

/**
 * Where the bars of drawBarChart lie on a canvas of this width: the plot
 * area and its pixel columns, each showing perColumn bars (more than one
 * when there are more bars than pixels).
 */
function barLayout(bars, width) {
  const height = Math.round(width * BAR_ASPECT);
  const w = width - BAR_MARGIN.left - BAR_MARGIN.right;
  const h = height - BAR_MARGIN.top - BAR_MARGIN.bottom;
  const columns = Math.min(bars, Math.max(1, Math.floor(w)));
  return { margin: BAR_MARGIN, w, h, height, columns, perColumn: bars / columns, colW: w / columns };
}

/**
 * Bar chart of `values` with an optional dashed reference (`expected`, one
 * value per bar or a single number), labels under the first, the middle
 * and the last bar (or under every bar, with `allLabels`), and the bars of
 * `highlight` in another colour. With more bars than pixels each pixel
 * column shows the largest of its bars, so that no value disappears.
 */
function drawBarChart(canvas, { values, expected = null, labels = null, allLabels = false, highlight = [], max = null, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, BAR_ASPECT, knownWidth);
  const { margin, w, h, columns, perColumn, colW } = barLayout(values.length, width);
  const refs = expected === null ? [] : Array.isArray(expected) ? expected : values.map(() => expected);
  const top = max ?? Math.max(1e-9, ...values, ...refs) * 1.1;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = pal.grid;
  ctx.strokeRect(margin.left, margin.top, w, h);
  const gap = columns === values.length ? colW * 0.12 : 0;
  for (let c = 0; c < columns; c++) {
    const from = Math.floor(c * perColumn);
    const to = Math.max(Math.floor((c + 1) * perColumn), from + 1);
    let v = 0;
    let marked = false;
    for (let i = from; i < to; i++) {
      v = Math.max(v, values[i] ?? 0);
      if (highlight.includes(i)) marked = true;
    }
    const bh = (v / top) * h;
    ctx.fillStyle = marked ? pal.highlight : pal.bars;
    ctx.fillRect(margin.left + c * colW + gap, margin.top + h - bh, Math.max(0.6, colW - 2 * gap), bh);
  }
  if (refs.length) {
    ctx.strokeStyle = pal.reference;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let c = 0; c < columns; c++) {
      const y = margin.top + h - ((refs[Math.floor(c * perColumn)] ?? 0) / top) * h;
      ctx.moveTo(margin.left + c * colW, y);
      ctx.lineTo(margin.left + (c + 1) * colW, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = pal.text;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  const fmt = (v) => chartNumber(top <= 1.5 ? v.toFixed(2) : String(Math.round(v)), decimal);
  ctx.fillText(fmt(top), margin.left - 4, margin.top + 9);
  ctx.fillText(fmt(0), margin.left - 4, margin.top + h);
  if (labels) {
    ctx.textAlign = 'center';
    const barW = w / values.length;
    const shown = allLabels && barW >= 9 ? labels.map((_, i) => i) : [...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])];
    for (const i of shown) ctx.fillText(labels[i], margin.left + (i + 0.5) * barW, margin.top + h + 15);
  }
}

/** Where the plot of drawLineChart lies on a canvas of this width, and the pixel of every x value. */
function lineLayout(data, width) {
  const height = Math.round(width * LINE_ASPECT);
  const margin = LINE_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const x0 = data.x[0];
  const x1 = data.x[data.x.length - 1];
  const scale = (v) => (data.logX ? (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) : (v - x0) / (x1 - x0));
  const px = (v) => margin.left + w * scale(v);
  return { margin, w, h, height, px, xs: data.x.map(px) };
}

/**
 * Line chart: one line per series over the same x values, on a linear or
 * logarithmic x axis, each with an optional shaded band (a confidence
 * interval) and optionally dashed (a bound, a theoretical line); null
 * values are skipped. The colours are palette.series in order, or the one
 * of `colorIndex`; the legend is written in the page, under the figure,
 * where it can be read and translated.
 */
function drawLineChart(canvas, { x, series, logX = false, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = (v) => String(v), decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, LINE_ASPECT, knownWidth);
  const { margin, w, h, px } = lineLayout({ x, logX }, width);
  const py = (v) => margin.top + h * (1 - (Math.min(yMax, Math.max(yMin, v)) - yMin) / (yMax - yMin));
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
    ctx.fillText(chartNumber(yFormat(v), decimal), margin.left - 4, py(v) + 4);
  }
  ctx.textAlign = 'center';
  for (const v of xTicks) {
    ctx.beginPath();
    ctx.moveTo(px(v), margin.top);
    ctx.lineTo(px(v), margin.top + h);
    ctx.stroke();
    ctx.fillText(chartNumber(String(v), decimal), px(v), margin.top + h + 15);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  series.forEach((s, i) => {
    const color = pal.series[(s.colorIndex ?? i) % pal.series.length];
    const points = x.map((v, j) => [px(v), s.values[j]]).filter(([, v]) => v !== null && v !== undefined && !Number.isNaN(v));
    if (s.band) {
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = color;
      ctx.beginPath();
      x.forEach((v, j) => (j ? ctx.lineTo(px(v), py(s.band[j][1])) : ctx.moveTo(px(v), py(s.band[j][1]))));
      for (let j = x.length - 1; j >= 0; j--) ctx.lineTo(px(x[j]), py(s.band[j][0]));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = s.dashed ? 1.5 : 2;
    ctx.setLineDash(s.dashed ? [5, 4] : []);
    ctx.beginPath();
    points.forEach(([X, v], j) => (j ? ctx.lineTo(X, py(v)) : ctx.moveTo(X, py(v))));
    ctx.stroke();
    ctx.setLineDash([]);
    if (!s.dashed) {
      ctx.fillStyle = color;
      for (const [X, v] of points) {
        ctx.beginPath();
        ctx.arc(X, py(v), 2.4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
function chartHeight(draw, data, width) {
  return draw === drawLineChart ? lineLayout(data, width).height : barLayout(data.values.length, width).height;
}

/**
 * The bar or the x value under the point (x, y) of a chart drawn at this
 * width, in CSS pixels from its top left corner; null outside the plot.
 * For bars, the values [from, to) of the pixel column (more than one when
 * there are more bars than pixels); for lines, the index of the nearest x.
 * `rect` is the rectangle to outline.
 */
function chartHitTest(draw, data, width, x, y) {
  if (draw === drawLineChart) {
    const { margin, h, w, xs } = lineLayout(data, width);
    if (x < margin.left - 6 || x > margin.left + w + 6 || y < margin.top || y > margin.top + h) return null;
    let index = 0;
    xs.forEach((X, i) => {
      if (Math.abs(X - x) < Math.abs(xs[index] - x)) index = i;
    });
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  const { margin, w, h, columns, perColumn, colW } = barLayout(data.values.length, width);
  if (x < margin.left || x >= margin.left + w || y < margin.top || y > margin.top + h) return null;
  const column = Math.min(columns - 1, Math.floor((x - margin.left) / colW));
  const from = Math.floor(column * perColumn);
  const to = Math.max(Math.floor((column + 1) * perColumn), from + 1);
  return { kind: 'bar', from, to, rect: { x: margin.left + column * colW, y: margin.top, width: colW, height: h } };
}

/**
 * Explains a chart under the pointer: the bar or the point below the
 * mouse, or below the finger after a tap, gets an outline and a label with
 * the text describe(hit), inserted as plain text. Both stay inside the
 * canvas's parent, which must be positioned. Returns the function that
 * removes them.
 */
function attachChartTooltip(canvas, { draw, data, describe: explain }) {
  const box = canvas.parentElement;
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
  const hide = () => {
    mark.hidden = true;
    tip.hidden = true;
    shown = null;
  };
  const show = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const hit = chartHitTest(draw, data, r.width, x, y);
    const text = hit && explain(hit);
    if (!text) {
      hide();
      return;
    }
    const left = canvas.offsetLeft;
    const top = canvas.offsetTop;
    Object.assign(mark.style, {
      left: `${left + hit.rect.x}px`,
      top: `${top + hit.rect.y}px`,
      width: `${Math.max(2, hit.rect.width)}px`,
      height: `${hit.rect.height}px`,
    });
    mark.classList.toggle('is-thin', hit.rect.width < 6);
    mark.hidden = false;
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
  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => show(clientX, clientY));
  };
  // a finger leaves the canvas as soon as it is lifted: the label stays until a tap elsewhere
  const onLeave = (e) => {
    if (e.pointerType !== 'touch') hide();
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') show(e.clientX, e.clientY);
  };
  const onDocumentDown = (e) => {
    if (e.target !== canvas) hide();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerdown', onDocumentDown);
  return () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerdown', onDocumentDown);
    canvas.classList.remove('has-tip');
    mark.remove();
    tip.remove();
  };
}

// ---------------------------------------------------------------------------
// 10. Checks, printed report and command line
// ---------------------------------------------------------------------------

/** The public key of DEFAULT_KEY, computed also with the ethers 6.13.5 library. */
const DEFAULT_PUBLIC_KEY = '03bc3c81132976acd7d48f1fb6cb420bb1e3946cb95d8fb48b597d2c0d5297572b';

/**
 * Known values the implementation must reproduce: the test vectors of
 * FIPS 180-4 for SHA-256, multiples of G published with secp256k1 and
 * recomputed with ethers 6.13.5, nG = O, and the round trips of both
 * ciphers on the message of the page.
 */
const CHECK_VECTORS = Object.freeze([
  { group: 'sha256', name: 'SHA-256("")', input: '', expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { group: 'sha256', name: 'SHA-256("abc")', input: 'abc', expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' },
  { group: 'curve', name: '2G', k: 2n, expected: '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5' },
  { group: 'curve', name: '3G', k: 3n, expected: '02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9' },
  { group: 'curve', name: '255G', k: 255n, expected: '031b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180' },
  { group: 'curve', name: `${DEFAULT_KEY}G`, k: DEFAULT_KEY, expected: DEFAULT_PUBLIC_KEY },
  { group: 'curve', name: `${KEY_MAX}G`, k: KEY_MAX, expected: '02ba7e7b78e1ff713857bcc6432dcee5f7c6ca7fc8f84af479811bcabec921305e' },
]);

/** Every check, with what was expected and what came out. */
function verifyAll() {
  const rows = CHECK_VECTORS.map((v) => {
    const actual = v.group === 'sha256' ? toHex(sha256(utf8(v.input))) : pointHex(multiplyG(v.k));
    // the multiplication by the table, and the plain double-and-add, must agree
    const ok = actual === v.expected && (v.group === 'sha256' || pointHex(multiply(G, v.k)) === v.expected);
    return { group: v.group, name: v.name, expected: v.expected, actual, ok };
  });
  const order = multiply(G, CURVE_N);
  rows.push({ group: 'curve', name: 'nG = O', expected: 'O', actual: order === null ? 'O' : pointHex(order), ok: order === null });
  const scheme = toyScheme(DEFAULT_KEY);
  const back = scheme.decrypt(scheme.encrypt(DEFAULT_MESSAGE).blocks).text;
  rows.push({ group: 'scheme', name: 'decrypt(encrypt(m)) = m', expected: DEFAULT_MESSAGE, actual: back, ok: back === DEFAULT_MESSAGE });
  const shifted = caesar(DEFAULT_MESSAGE, DEFAULT_SHIFT);
  const round = caesarDecrypt(shifted, DEFAULT_SHIFT);
  rows.push({ group: 'caesar', name: 'Caesar: decrypt(encrypt(m)) = m', expected: DEFAULT_MESSAGE, actual: round, ok: round === DEFAULT_MESSAGE });
  const sample = caesar('The quick brown fox jumps over the lazy dog.', 3);
  rows.push({ group: 'caesar', name: 'Caesar, shift 3', expected: 'Wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj.', actual: sample, ok: sample === 'Wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj.' });
  return rows;
}

const short = (hex, keep = 12) => (hex.length > 2 * keep + 3 ? `${hex.slice(0, keep)}...${hex.slice(-keep)}` : hex);
const printable = (b) => (b >= 32 && b < 127 ? `'${String.fromCharCode(b)}'` : '   ');

/** The toy scheme and the Caesar cipher on one input, as the program prints them. */
function reportLines({ key = DEFAULT_KEY, message = DEFAULT_MESSAGE, shift = DEFAULT_SHIFT, nonces = 'seeded' } = {}) {
  const lines = [];
  const scheme = toyScheme(key, { nonces });
  const { bytes, blocks } = scheme.encrypt(message);
  const back = scheme.decrypt(blocks);
  lines.push(`Toy scheme: EC-ElGamal on secp256k1, private keys of at most ${KEY_BITS} bits`);
  lines.push(`  private key  k = ${key} (0x${key.toString(16)}, ${key.toString(2).length} bits)`);
  lines.push(`  public key   K = kG = ${pointHex(scheme.K)}`);
  lines.push(`  message (${bytes.length} bytes): ${message}`);
  lines.push(`  nonces: ${nonces === 'random' ? 'from the cryptographic generator' : `SHA-256("${NONCE_SEED}" || i || attempt), reproducible`}`);
  lines.push('  block  byte        r                              C1 = rG                        C2 = bG + rK');
  for (const b of blocks.slice(0, 4)) {
    lines.push(`  ${String(b.index + 1).padStart(5)}  ${String(b.byte).padStart(3)} ${printable(b.byte)}  ${short(b.r.toString(16).padStart(64, '0'))}  ${short(pointHex(b.C1))}  ${short(pointHex(b.C2))}`);
  }
  if (blocks.length > 4) lines.push(`  ... and ${blocks.length - 4} more blocks`);
  lines.push(`  ciphertext: ${66 * blocks.length} bytes, 66 per byte of message, SHA-256 ${toHex(sha256(ciphertextBytes(blocks)))}`);
  lines.push(`  decrypted with k: ${back.text === message ? 'identical to the message' : `DIFFERENT: ${back.text}`}`);
  lines.push('');
  const cipherText = caesar(message, shift);
  lines.push(`Caesar cipher, shift ${shift} (${ALPHABET[0].toUpperCase()} -> ${ALPHABET[shift].toUpperCase()}):`);
  lines.push(`  ciphertext: ${cipherText}`);
  lines.push(`  decrypted:  ${caesarDecrypt(cipherText, shift) === message ? 'identical to the message' : 'DIFFERENT'}`);
  return { lines, scheme, blocks, cipherText };
}

const DIGITS = /^\d{1,10}$/;
const fmtP = (t) => {
  if (t.pValue === 0) return '< 1e-300';
  return t.pValue < 0.001 ? t.pValue.toExponential(1) : t.pValue.toFixed(3);
};
const pct = (v) => `${(100 * v).toFixed(1)}%`;
const seconds = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`);

/** A duration in seconds, in the largest unit that keeps it readable. */
function humanDuration(s) {
  if (!Number.isFinite(s)) return 'forever';
  const units = [['years', 365.25 * 86400], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  for (const [name, size] of units) {
    if (s >= size) {
      const v = s / size;
      return v >= 1e6 ? `${v.toExponential(1)} ${name}` : `${v.toFixed(1)} ${name}`;
    }
  }
  return `${(s * 1000).toFixed(1)} ms`;
}

/** The names of the methods as the command line prints them. */
const METHOD_NAMES = { top: 'most frequent', chi2: 'chi-square', unigram: 'max likelihood', bigram: 'bigrams', quadgram: 'quadgrams', dictionary: 'dictionary' };

/**
 * Command line: node homework2a.js [--key k | --random-key] [--message "text"]
 * [--shift s] [--random-nonces] [--no-stats]. Options are checked
 * strictly: anything unknown or malformed prints the usage.
 */
function runCli(argv, print = console.log) {
  const usage = () => {
    print('usage: node homework2a.js [--key k | --random-key] [--message "text"] [--shift 0-25] [--random-nonces] [--no-stats]');
    print(`       k is the private key of the toy scheme, from 1 to ${KEY_MAX}; the message has at most ${MESSAGE_MAX_BYTES} bytes.`);
    return 1;
  };
  const options = { key: DEFAULT_KEY, message: DEFAULT_MESSAGE, shift: DEFAULT_SHIFT, nonces: 'seeded', stats: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--no-stats') options.stats = false;
    else if (arg === '--random-nonces') options.nonces = 'random';
    else if (arg === '--random-key') options.key = randomPrivateKey();
    else if (arg === '--key' && value !== undefined && DIGITS.test(value) && parsePrivateKey(value).ok) {
      options.key = parsePrivateKey(value).value;
      i++;
    } else if (arg === '--message' && value !== undefined && value !== '' && utf8(value).length <= MESSAGE_MAX_BYTES) {
      options.message = value;
      i++;
    } else if (arg === '--shift' && value !== undefined && parseShift(value).ok) {
      options.shift = parseShift(value).value;
      i++;
    } else {
      return usage();
    }
  }
  const checks = verifyAll();
  const failed = checks.filter((r) => !r.ok);
  print(`Checks: ${checks.length - failed.length} of ${checks.length} passed (SHA-256 test vectors, multiples of G, nG = O, round trips).`);
  failed.forEach((r) => print(`  FAILED ${r.name}: expected ${r.expected}, got ${r.actual}`));
  print('');
  const { lines, scheme, blocks, cipherText } = reportLines(options);
  lines.forEach((l) => print(l));
  print('');

  const smoothing = runSteps(chooseSmoothingSteps());
  const models = languageModels(smoothing.betas);
  const crack = crackCaesar(cipherText, models);
  print(`Statistical attack on the Caesar ciphertext (${crack.letters} letters; letter frequencies of chapters I-IX of Alice's Adventures in Wonderland):`);
  if (crack.key === null) print('  maximum likelihood: no single best shift');
  else print(`  maximum likelihood: shift ${crack.key}, posterior probability ${crack.posterior[crack.key].toFixed(4)}; decrypted: ${caesarDecrypt(cipherText, crack.key)}`);
  print(`  every method: ${METHODS.map((m) => `${METHOD_NAMES[m]} ${crack.methods[m].best.join('/')}`).join(', ')}`);
  print('');

  const publicKey = pointHex(scheme.K);
  print(`Attacks on the public key K = ${publicKey}:`);
  const exhaustive = runSteps(attackSteps('exhaustive', publicKey));
  const rate = (1000 * exhaustive.ops) / Math.max(1, exhaustive.ms);
  if (exhaustive.found) print(`  exhaustive search: k = ${exhaustive.key} after ${exhaustive.ops} candidates, ${seconds(exhaustive.ms)}`);
  else print(`  exhaustive search: the first ${exhaustive.limit} candidates in ${seconds(exhaustive.ms)} (${Math.round(rate)} per second), k not among them; reaching k = ${options.key} would take about ${humanDuration(Number(options.key) / rate)}`);
  const bsgs = runSteps(attackSteps('bsgs', publicKey));
  print(`  baby-step giant-step: k = ${bsgs.key} with ${bsgs.ops} group operations (${bsgs.baby} baby steps, ${bsgs.giant} giant steps), ${seconds(bsgs.ms)}`);
  const kangaroo = runSteps(attackSteps('kangaroo', publicKey));
  print(`  kangaroo: k = ${kangaroo.key} with ${kangaroo.ops} jumps of ${kangaroo.N} kangaroos (expected about ${Math.round(kangaroo.expected)}), ${kangaroo.distinguished} distinguished points, ${seconds(kangaroo.ms)}`);
  const recovered = toyScheme(BigInt(bsgs.key)).decrypt(blocks).text;
  print(`  decrypted with the recovered key: ${recovered === options.message ? 'identical to the message' : `DIFFERENT: ${recovered}`}`);
  const reused = toyScheme(options.key, { nonces: () => REUSED_NONCE }).encrypt(options.message).blocks;
  const attack = nonceReuseAttack(reused);
  if (attack && attack.candidates.length) print(`  flawed variant with one nonce for every byte, broken without k: ${attack.candidates[0].text}`);
  const augustus = scheme.decrypt(shiftCiphertext(blocks, 1));
  print(`  every C2 plus G, decrypted with k: ${augustus.ok ? augustus.text : 'not a byte sequence (a byte was 255)'}`);
  if (!options.stats) return failed.length ? 1 : 0;

  print('');
  const s = explore();
  print(`Language models (training: chapters ${SPLIT.training[0]}-${SPLIT.training[SPLIT.training.length - 1]}, ${s.corpus.training.letters} letters; test: chapters ${SPLIT.test[0]}-${SPLIT.test[SPLIT.test.length - 1]}, ${s.corpus.test.letters} letters):`);
  s.models.crossEntropy.forEach((h, i) => {
    print(`  ${i + 1}-grams: beta = ${s.models.betas[i]}, cross-entropy on the test chapters ${h.toFixed(3)} bits per letter, redundancy ${s.models.redundancy[i].toFixed(3)}, unicity distance ${s.models.unicity[i].toFixed(1)} letters`);
  });
  print('');
  print(`Caesar experiment: disjoint passages of the test chapters under random shifts, success rate of every method (seed ${EXPLORE_SEED}):`);
  print(`  ${'letters'.padStart(7)} ${'trials'.padStart(6)}  ${METHODS.map((m) => METHOD_NAMES[m].padStart(14)).join(' ')}  ${'bound'.padStart(7)}`);
  s.caesar.lengths.forEach((L, i) => {
    print(`  ${String(L).padStart(7)} ${String(s.caesar.trials[i]).padStart(6)}  ${METHODS.map((m) => pct(s.caesar.rates[m][i]).padStart(14)).join(' ')}  ${pct(s.caesar.bound[i]).padStart(7)}`);
  });
  print('  (bound: Chernoff lower bound for maximum likelihood with independent letters)');
  print('');
  const all = Object.entries(statisticalTests(s)).flatMap(([group, list]) => list.map(([k, test]) => ({ group, key: k, test })));
  print(`Hypothesis tests, alpha = ${SIGNIFICANCE}:`);
  for (const { group, key: k, test } of all) print(`  ${group.padEnd(7)} ${fmtP(test).padEnd(8)} ${test.verdict === 'reject' ? '[rejected] ' : ''}${TEST_LABELS[group][k]}`);
  print('');
  const sc = scaling();
  print(`Cost of the attacks against the key size (mean group operations, keys from seed ${sc.seed}):`);
  for (const [method, list] of Object.entries(sc.rows)) {
    const fit = sc.fits[method];
    print(`  ${method.padEnd(10)} ${list.map((r) => `${r.bits} bits: ${Math.round(r.mean)}`).join(', ')}`);
    print(`             fitted exponent ${fit.slope.toFixed(3)} +- ${fit.slopeError.toFixed(3)} (theory ${fit.exponent}); with the theory's exponent, 256 bits: about 2^${(fit.constant + fit.exponent * 256).toFixed(1)} operations`);
  }
  print(`  this machine: ${Math.round(sc.rate)} group operations per second; 2^128 of them would take ${humanDuration(2 ** 128 / sc.rate)}`);
  return failed.length ? 1 : 0;
}

/** True under Node, where the downloadable program can run runCli. */
const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);

return { toHex, fromHex, utf8, utf8Decode, concat, ser32, ser256, bytesToBigInt, secureRandomBytes, sha256, SECP256K1, G, multiplyG, multiply, addPoints, negate, subtractPoints, pointsEqual, isOnSecp256k1, encodeCompressed, decodeCompressed, pointHex, KEY_BITS, KEY_MAX, DEFAULT_KEY, DEFAULT_MESSAGE, MESSAGE_MAX_BYTES, NONCE_SEED, parsePrivateKey, randomPrivateKey, encodeByte, decodeByte, seededNonce, randomNonce, toyScheme, ciphertextBytes, ALPHABET, DEFAULT_SHIFT, caesar, caesarDecrypt, parseShift, letterIndices, letterCounts, wordsOf, SPLIT, corpusChapters, corpusText, MAX_ORDER, SMOOTHING_GRID, chooseSmoothingSteps, languageModels, trainingFrequencies, entropyBits, coincidenceIndex, METHODS, analyzeCiphertext, shiftScores, bestShifts, posteriorOf, crackCaesar, letterFit, EXHAUSTIVE_LIMIT, ATTACK_SEED, exhaustiveSteps, bsgsSteps, kangarooSteps, runSteps, runStepsAsync, publicKeyFromHex, attackSteps, REUSED_NONCE, nonceReuseAttack, shiftCiphertext, SIGNIFICANCE, EXPLORE_SEED, SAMPLES, LENGTHS, SCALING, THEORY, prng, chiSquarePValue, twoSidedNormalTail, binomialTest, goodnessOfFit, independenceTest, wilsonInterval, chernoffRates, chernoffSuccess, exploreSteps, explore, exploreAsync, scalingSteps, scaling, scalingAsync, statisticalTests, TEST_LABELS, DEFAULT_PALETTE, drawBarChart, drawLineChart, chartHeight, chartHitTest, attachChartTooltip, DEFAULT_PUBLIC_KEY, CHECK_VECTORS, verifyAll, reportLines, humanDuration, runCli, isNode };
})();

// src/pages/statistics/hw2a/standalone/cli.js
// La coda del file homework2a.js scaricabile: la riga di comando
// node homework2a.js [opzioni] e l'uso da altri script. La build la aggiunge
// dopo la libreria cosi' com'e', quindi qui non ci sono import ne' export.
//
// Funziona qualunque sia il nome del file, e in entrambi i modi in cui Node
// puo' caricarlo:
//   - CommonJS (il package.json accanto lo dichiara): require('./homework2a.js')
//     restituisce la libreria, e la riga di comando parte solo se il file e'
//     quello eseguito (require.main);
//   - modulo ES (per esempio copiato da solo in un progetto con
//     "type": "module"): la libreria e' globalThis.Homework2a, e la riga di
//     comando parte solo se il file e' quello eseguito, cosa che qui si
//     ricava dalla traccia dello stack, l'unico modo che non richiede
//     import.meta (che in uno script classico sarebbe un errore di sintassi).

// Command line: node homework2a.js [--key k | --random-key] [--message "..."] [--shift s] [--random-nonces] [--no-stats]
(function () {
  if (typeof window !== 'undefined' || typeof process !== 'object' || !process || !process.versions || !process.versions.node) return;
  const run = () => {
    process.exitCode = Homework2a.runCli(process.argv.slice(2), console.log);
  };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = Homework2a;
    if (typeof require === 'function' && require.main === module) run();
    return;
  }

  globalThis.Homework2a = Homework2a;
  // In un modulo ES require non esiste, e fino a Node 18 manca anche il
  // generatore crittografico globale (crypto): lo si carica qui, in modo
  // asincrono, e la riga di comando parte solo dopo, cosi' anche
  // --random-key e --random-nonces funzionano su ogni versione di Node da 14
  // in su.
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
