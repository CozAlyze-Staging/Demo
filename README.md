# CozAlyze — Continuous Opening (Scene 1 + animation result)

Stamps: SCENE 1 v19.76 sidereal animation, TROPICAL v18.51 larger type,
SIDEREAL v19.50 animation result. Engine e27, ?v=27, AUDIO_VER 18.
Reveal routes ?v=1851 / ?v=1950.

## What this is

The full opening now runs into the animation-result page as one piece. The
living-page architecture is unchanged: the index is the only page that ever
loads. The card tap fades the choice bed and shows the chosen reveal file in a
fullscreen iframe, which adopts the index's already-running audio context, so
sound is alive from the reveal's first frame through to REVEAL MY CHART.

The only routing change is that the Tropical door now opens the v18.47
animation-result build (hero video, framed planet table, ascendant frame)
instead of the old v18.45 card layout. Sidereal is unchanged apart from its
engine tag and stamp.

Flow: opening -> location search -> Earth flight -> birth date -> birth time ->
Tropical/Sidereal doors -> whisper -> tap to reveal -> chart drawing ->
REVEAL MY CHART -> result page -> unlock -> pricing.

## Engine e27

The Earth-arrival cue (07_earth_arrival.wav) is retired. The wav is no longer
in the master, so it is out of FILES and DUCKS. Its call site in Scene 1 stays
where it is and is now a silent no-op — play() drops any cue with no buffer —
so the moment plays dry instead of throwing a 404 on every load. No other cue
changed, and no wav content changed, so AUDIO_VER stays 18.

## STILL NEEDED — 5 of your art files

These are referenced by the v18.48 result page and are NOT in this package.
Drop them into the repo root alongside everything else:

  asc-frame.jpg    (9-slice border, slice 60 — the ascendant frame)
  unlock.jpg       (the tappable unlock button art)
  icon-sun.jpg
  icon-moon.jpg
  icon-career.jpg

Without them the result page renders but those five slots come up broken.

The 12 gold glyph PNGs ARE included — sliced fresh from your glyph sheet,
recoloured #CCA466 on transparent, 256px square, named glyph-aries.png
through glyph-pisces.png to match TR_GLYPH_FILE.

calc-sky.mp4 is referenced but marked preload="none" with genesis bypassed
since v19.52. It is harmless to leave absent.

## Deploy

Drop the whole folder into the repo root, single commit, wait for the green
Actions run. Verify the corner stamps before testing anything:

  index          v19.76 sidereal animation
  tropical       v18.51 larger type
  sidereal       v19.50 animation result
  engine         snd e27 running

Every recent test has trailed the delivered build by one version, so check the
stamp first.

## v18.49 — three fixes on the result page

1. Pinch-to-zoom now works on the result page. The reveal runs inside the
   index's iframe, so the parent's viewport meta is what the browser obeys —
   the page switches BOTH its own and the parent's meta to user-scalable=yes
   at the moment the result page becomes visible, and adds pinch-zoom to
   touch-action. Every scene before the result page stays locked at scale 1,
   so the opening animation cannot be pinched out of frame.

2. The sky is locked to the top. #trHero is position:sticky top:0 at z-index 4,
   with the details row and the frames at z-index 1, so the page scrolls up
   behind the video instead of carrying it away.

3. Planet rows are two points smaller: clamp(6.5px, calc(2.25vw - 2px), 12.5px).
   The glyph rides at 1.4em so it scales with the row.

Note on the planet table: the smaller type buys room, but MERCURY, NEPTUNE, and
SAGITTARIUS still run into the column beside them at any size, because .tr-prow
is white-space:nowrap on fixed fr columns and those are simply the longest
strings in the set. Font size alone will not fully clear it. Say the word and I
can widen the name column's share of the row, which is the smallest change that
actually fixes it.

## v18.50 — the zoom now holds, and the table breathes

WHY v18.49's ZOOM VANISHED: it turned on the BROWSER's pinch by rewriting the
viewport meta. But #chartResultPage is position:fixed inside a fixed parent,
and iOS does not pan fixed layers with the visual viewport — so the first pinch
pushed the reading off screen with no way to pan back. It looked like the page
timed out. It did not; nothing in the result flow has ever had a timer.

The viewport is locked back to scale 1 in both documents. Instead the result
page transforms its own content: pinch to scale 1x-4x, one finger to pan while
zoomed, pinch back to 1x for normal scrolling. A zoom holds until the reader
ends it. At exactly 1x the transform is cleared so the sticky sky keeps working.

PLANET TABLE: each column is now one grid and each row is display:contents, so
all five rows share ONE set of tracks sized to the longest name and the longest
sign. Nothing can run into its neighbour. justify-content:space-between then
spreads the leftover room across the full width instead of bunching everything
left. Room was reclaimed from three places: the frame's horizontal padding on
phones (the border art already provides the visual inset), the gap either side
of the arrow, and the arrow's own width (its height is unchanged). Font size
is untouched.

CURRENT TYPE SIZES, for reference:
  "tap to reveal"                 15px, weight 300, letter-spacing 0.32em
  "the sky has always been here"  15px, weight 300, letter-spacing 0.32em
  "Touch the Sky"                 11px, uppercase,  letter-spacing 0.45em
The first two are SF Pro on the reveal pages; "Touch the Sky" is in Scene 1 and
is the smallest of the three by a wide margin.

## v19.74 / v18.51 / v19.42 — larger type

Reference: the COSMOLOGY line is clamp(17px, 4.7vw, 20px) with 0.32em spacing,
so it renders about 18.5px on a 393px iPhone. That is the target the three
whisper lines were raised to.

  "tap to reveal"                 15px  ->  clamp(17px, 4.7vw, 20px), 0.28em
  "the sky has always been here"  15px  ->  clamp(17px, 4.7vw, 20px), 0.28em
  "Touch the Sky"                 11px  ->  clamp(15px, 4.2vw, 18px), 0.40em
  the tap prompt under the mark   15px  ->  clamp(17px, 4.5vw, 19px), 0.40em

Letter-spacing came down slightly on each. Very wide tracking makes type read
smaller than its number suggests, and it was costing the line more width than
the extra size needed.

Onboarding boxes, all raised:

  WHERE WERE YOU BORN?      11px    ->  clamp(13px, 3.5vw, 15px)
  the search field          16px    ->  17.5px
  the suggestion rows       13px    ->  15px
  the hint line             11.5px  ->  13px
  birthplace label          14px    ->  15.5px
  birthplace city           18px    ->  20px
  birthplace country        10.5px  ->  12px
  BACK                      12px    ->  13.5px
  the gold question banners 12px    ->  clamp(13px, 3.5vw, 14.5px)
  MM-DD-YYYY / time field   15px    ->  17px
  AM / PM chips             10px    ->  12px

The date and time bars were widened from a fixed 250px to min(88vw, 282px) so
the bigger field type still sits on one line, and the gold banners traded some
horizontal padding for the larger type so they stay on one line too. At 393px
the longest banner now measures about 342px of 393.

## v19.75 — Scene 1 type and the two-perspectives page

"Discover Who You Are?" (.tl-md) raised from clamp(13px, 3.6vw, 16px) to
clamp(17px, 4.7vw, 20px) — the same size as the COSMOLOGY line, with the
tracking pulled in to match.

TWO PERSPECTIVES:
  - "Two complementary lenses reveal different layers of who you are." removed.
    The instruction line below it takes over its fade beat, so nothing pauses.
  - Card type raised, which is what makes the boxes longer: fewer words cross
    each line and the copy runs deeper instead of wider.
        card name         clamp(15,   4vw,   23)  ->  clamp(17,   4.6vw, 25)
        ASTROLOGY         clamp(8.5,  2vw,   10.5) ->  clamp(10,  2.5vw, 12.5)
        the description   clamp(11.5, 3.1vw, 15)  ->  clamp(13.5, 3.8vw, 17.5)
        the closing line  clamp(11.5, 2.9vw, 16)  ->  clamp(13,   3.4vw, 17.5)
    The cards were centred with auto margins, which clips the top once the
    content is taller than the screen. Those are now fixed margins so a longer
    card scrolls instead of losing its head.
  - The page owns its own zoom, the same way the result page does. #systembar
    is position:fixed, so browser pinch would have pushed the cards off screen
    with no way back — exactly the v18.49 failure. A #sysZoomInner wrapper was
    added purely to carry the transform. Pinch 1x-3x, one finger to pan while
    zoomed, pinch back to 1x for normal scrolling. At exactly 1x the transform
    is cleared so the staged card animations are untouched.

## v19.76 / SIDEREAL v19.50 — the sidereal animation result page

The Vedic door now opens the same design the Tropical door does. Same
structure, same behaviour, his own Vedic art and the locked master-template
palette: black page, rose-gold #C2A481 rules and glyphs, cream #EBE5D0 body,
gold #CCA466 headings, #CCA466 -> #6D4706 on the ascendant name.

WHAT CHANGED, and only this: the #chartResultPage markup, its CSS, and
buildResultPage. The reveal transition, the sound cues, the unlock events, the
pricing finale and every word of the inner-experience engine are untouched.
The old logo header, the SIDEREAL VEDIC CHART title, the birth-signature block
and the nine-graha cards are gone, replaced by the framed layout.

  - the sky (sidereal-hero.mp4, native 1500/834) is sticky at the top and the
    page scrolls up behind it; it plays once, holds its last frame, and a tap
    replays it
  - a details strip: date | time | place | coordinates
  - the planet frame, laid out exactly as his master template does it: the Sun
    alone across the top, then Moon/Mercury/Mars/Venus on the left and
    Jupiter/Saturn/Rahu/Ketu on the right with the rose-gold arrow between.
    All nine graha are shown — unlike Tropical, the Vedic chart has always
    carried Rahu and Ketu. Each column is one grid with its rows as
    display:contents, so all rows share ONE set of max-content tracks and no
    name can run into the sign beside it.
  - the ascendant frame: glyph ring + YOUR ASCENDANT + the sign in the gold
    gradient + its nakshatra and pada, divided from the rising reading
  - the reading frame: Inner World, Family Dynamic, Dharma & Direction, each
    with the SVG icon already approved in the previous build
  - the unlock art, tappable
  - the page owns its own zoom, identical to TROPICAL v18.50: pinch 1x-4x, one
    finger to pan while zoomed, pinch back to 1x. Browser pinch is NOT used —
    #chartResultPage is position:fixed inside a fixed parent and iOS would push
    the reading off screen with no way back.

NEW FILES for the repo root (14):
  sidereal-hero.mp4         his 4-minute palindrome sky
  sid-frame.png             the empty ornate frame, 9-sliced at 45.
                            Cropped from his ascendant.jpg to the gold rule and
                            the interior cleared, so none of the baked type can
                            ever show — border-image without `fill` uses only
                            the border bands.
  sid-unlock.jpg            his unlock art
  sid-<sign>.png x12        his rose-gold zodiac set, kept under sid- names so
                            it never overwrites Tropical's #CCA466 glyph-<sign>
                            set, which is a different look on purpose

Nothing else in the repo changes. asc-frame.jpg, unlock.jpg and the three
icon jpgs stay where they are for the Tropical page.

