// Everything in the book lives here. Edit this file by hand, or run `npm run dev`,
// click any words in the book to change them, and press "save changes".
// Page types: letter, polaroid, duo, collage, list, blank.
// Photos: { src: "photos/your-file.jpg", caption: "...", pos: "50% 35%" }.
//   `pos` is optional and picks which part of the photo stays in frame when it's cropped.
//   A missing photo shows a soft placeholder; while editing, click it to add one.
window.BOOK = {
  "name": "bestie",
  "date": "the big day",
  "from": "me",
  "pages": [
    {
      "type": "letter",
      "label": "open me first",
      "title": "dear you,",
      "text": "happy birthday! i made you a little book of us, because a card wasn't enough. flip through, add stickers, and make it yours."
    },
    {
      "type": "polaroid",
      "label": "main character energy",
      "photo": { "src": "", "caption": "a caption for this one" },
      "note": "a little note about this day"
    },
    {
      "type": "duo",
      "label": "certified iconic duo",
      "photos": [
        { "src": "", "caption": "caption" },
        { "src": "", "caption": "caption" }
      ],
      "clipping": {
        "headline": "local besties still not over it",
        "text": "sources confirm the pair laughed so hard nobody else at the table understood the joke. witnesses describe the evening as 'unhinged' and 'honestly the best night of the year.'"
      }
    },
    {
      "type": "collage",
      "label": "the archive",
      "photos": [
        { "src": "", "caption": "" },
        { "src": "", "caption": "" },
        { "src": "", "caption": "" }
      ],
      "note": "blurry, chaotic, perfect"
    },
    {
      "type": "list",
      "label": "reasons you're my favorite",
      "items": [
        "you always know when something's wrong",
        "your voice notes are podcasts",
        "you hype me up like it's your job",
        "you remember the tiny things",
        "we can talk for hours about nothing",
        "you're the first person i want to tell everything"
      ]
    },
    {
      "type": "polaroid",
      "label": "best friend (n.)",
      "photo": { "src": "", "caption": "a caption for this one" },
      "note": "the person you can be your weirdest self with"
    },
    {
      "type": "duo",
      "label": "remember this?",
      "photos": [
        { "src": "", "caption": "caption" },
        { "src": "", "caption": "caption" }
      ],
      "clipping": {
        "headline": "a very good year",
        "text": "write about a trip, a night out, or an inside joke from this year."
      }
    },
    {
      "type": "blank",
      "label": "this page is yours",
      "hint": "decorate me with stickers ♡"
    },
    {
      "type": "blank",
      "label": "and this one too",
      "hint": ""
    },
    {
      "type": "letter",
      "label": "to be continued",
      "title": "here's to the next one",
      "text": "more pages, more photos, more stories. i can't wait to fill the next book with you. happy birthday!"
    }
  ]
};
