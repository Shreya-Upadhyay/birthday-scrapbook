# birthday scrapbook 🎀

A flippable, kraft-paper scrapbook website to make for someone's birthday. Fill it with your
photos and messages, decorate it with stickers, put it online for free, and send them the link.
They can flip through it and add their own stickers, including stickers cut out of your photos.

- Real page-turning book (spiral binding on desktop, one page at a time on phones)
- Polaroids, gingham, newspaper clippings, washi tape, typewriter labels, bows
- Sticker pouch: your photos cut into hearts, circles, stars and more, plus doodles and word stickers
- Edit everything right on the page. No code needed.

Plain HTML, CSS and JavaScript. No build step, no accounts, no database.

## 1. Get a copy

Click **Use this template** at the top of this page (or fork it), then clone your copy:

```bash
git clone https://github.com/<you>/<your-copy>.git
cd <your-copy>
```

You need [Node.js](https://nodejs.org) 18 or newer.

## 2. Make it theirs

```bash
npm run dev
```

Open http://localhost:5173. While it runs on your computer, the book is in edit mode:

- **Words:** click any text (their name on the cover, labels, letters, captions, the list) and type.
- **Photos:** hover a photo frame and click **add photo**. JPG, PNG and WebP work. iPhone HEIC
  photos don't show in most browsers, so convert those to JPG first.
- **Stickers:** tap **stickers** at the bottom and stick things anywhere. Drag to move; tilt,
  resize or peel them off with the buttons that appear.
- Press **save changes** when you're done. Your edits are written into `public/content.js`,
  your photos into `public/photos/`, and your stickers into `public/layout.json`.

Unsaved edits are kept in your browser, so a closed tab doesn't lose them.

Want different pages? Edit the `pages` list in `public/content.js`. The page types are `letter`,
`polaroid`, `duo`, `collage`, `list` and `blank`.

## 3. Put it online and send it

Deploy the project to [Vercel](https://vercel.com) (free):

```bash
npx vercel login
npx vercel --prod
```

You'll get a link like `https://your-book.vercel.app`. Send it to the birthday person.

- On the live site the words are locked. They can flip, and add stickers on top of yours.
- Their stickers are saved on their own device.
- To change something later, edit locally, press **save changes**, and run `npx vercel --prod`
  again. The link stays the same.

Anyone with the link can open the site, so only share it with people you'd show the book to.

## Credits

Page turning by [StPageFlip](https://github.com/Nodlik/StPageFlip) (MIT, see
`public/vendor/page-flip-LICENSE`).
