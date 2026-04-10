import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MousePointer2, Layout, Image as ImageIcon, Music, Trophy, Moon, Zap, Navigation, Loader2, MousePointerClick } from 'lucide-react';

const categories = [
  {
    title: "Buttons & Interactive Elements",
    icon: <MousePointerClick className="text-olive" />,
    items: [
      "Hover: button lifts with shadow", "Click: ripple effect from cursor", "Idle: subtle pulse glow", "Loading: spinner inside button",
      "Success: morphs into checkmark", "Disabled: fade to grey with tooltip", "Focus: custom outline glow", "Active: scale down 2%",
      "Touch: ripple expands from touch point", "Long press: context menu appears", "Double-tap: quick action with bounce",
      "Drag over: border highlight", "Drop: confirmation flash", "Key press: button press animation", "Voice command: glow pulse",
      "After submit: button turns into progress bar", "On error: shake left-right", "On success: bounce once",
      "On hover out: return to normal with overshoot", "On click hold: gradual colour fill", "On focus out: shrink outline",
      "On idle: subtle floating motion", "On resize: button adjusts size smoothly", "On scroll into view: fade-in slide-up",
      "On page load: scale from zero", "On data update: data-count increment animation", "On badge change: badge pop",
      "On network reconnect: button re-enables with pulse", "On permission granted: button highlight", "On permission denied: button shake",
      "On form valid: submit button glows green", "On form invalid: submit button glows red", "On offline: button disabled with static noise effect",
      "On online: button re-enables with fade-in", "On theme switch: button background transitions", "On language switch: button text slides in from side",
      "On new feature: button wiggles invitingly", "On upgrade to premium: button gains gold border", "On story generated: generate button morphs into 'Share'",
      "On save: save button shows checkmark then reverts", "On delete: delete button turns red, then fades", "On copy: copy button shows 'Copied!' text with fade",
      "On paste: paste button pulses", "On download: download button shows progress circle", "On upload: upload button shows file name with slide-in",
      "On email input: email-specific button highlight", "On password strength: strength meter fill inside button", "On age select: button shows age-appropriate icon",
      "On genre select: button morphs into genre icon", "On character creation: button shows character avatar briefly"
    ]
  },
  {
    title: "Cards & Library Items",
    icon: <Layout className="text-olive" />,
    items: [
      "Hover: card lifts, shadow deepens", "Hover: 'Read' button slides in from bottom", "Click: card expands into full viewer",
      "Drag to reorder: card follows cursor with spring", "Swipe to delete: card slides out, fades", "Swipe to archive: card slides into folder",
      "Swipe to share: card reveals share options", "Long press: select mode with checkmark", "Multi-select: selected cards gain checkmark overlay",
      "Bulk action: selected cards move together", "Search highlight: matching text pulses yellow", "Filter: cards rearrange with staggered scale-in",
      "Sort: cards reposition with spring motion", "New card: appears with bounce and sparkle", "Deleted card: fades out, list closes up",
      "Updated card: flashes green border", "Featured card: gold border with subtle glow", "Premium card: holographic edge",
      "Public card: share icon slides in", "Private card: lock icon appears", "Rated card: star rating highlights on hover",
      "Unread story: dot pulse", "Recently read: bookmark ribbon slides out", "Series card: 'Part X' badge with slide-in",
      "Collaborative story: multiple avatars orbit", "Story with audio: speaker icon waves", "Story with video: play icon bounce",
      "Story with AR: AR icon rotates", "Story with images: gallery thumbnail strip", "Story with animations: sparkle trail on hover",
      "Cover image zoom: thumbnail zooms on hover", "Cover image grain: subtle noise overlay on hover", "Cover image tint: colour overlay on hover",
      "Title reveal: title slides in from left", "Meta info fade-in: date, pages appear on hover", "Progress indicator: ring fills on scroll",
      "Reading time: clock icon rotates", "Word count: number counts up", "Age rating: badge with pulse", "Genre tag: tag fades in with colour",
      "Mood tag: tag glows in mood colour", "Theme tag: tag slides in with theme icon", "Character count: character icon bounces",
      "Location count: map pin drops", "Series count: book stack grows", "Contributor count: avatars slide in", "Fork count: branch icon spins",
      "Like count: heart fills with particles", "Comment count: speech bubble expands", "Save count: bookmark icon fills"
    ]
  },
  {
    title: "Reading & Story Viewer",
    icon: <Sparkles className="text-olive" />,
    items: [
      "Page turn: curl effect with shadow", "Page turn: slide left/right with easing", "Page turn: cross-fade with scale",
      "Cover open: book opens with spring", "Cover close: book closes with slow-in", "Page number: number slides in on page change",
      "Progress bar: fills as reader scrolls", "Progress ring: circle fills around cover", "Spotlight: current page glows, others dim",
      "Reading time estimate: appears with fade", "Font size slider: text resizes smoothly", "Font family change: text morphs with transition",
      "Line height slider: spacing adjusts live", "Margin slider: margins expand/contract", "Background colour: changes with crossfade",
      "Dark mode toggle: invert colours with transition", "Sepia mode: colour overlay fade", "Night mode: blue light filter animation",
      "Focus mode: UI fades out, text remains", "Fullscreen mode: expands with zoom", "Voice narration start: waveform appears",
      "Voice narration stop: waveform fades out", "Character voice: avatar lights up", "Sound effects: subtle pop on page turn",
      "Ambient music: fades in on story open", "Background ambience: rain sound fades", "Auto-scroll: page moves smoothly",
      "Scroll speed: slider controls speed", "Page jump: thumbnail click zooms to page", "Bookmark: ribbon slides in on page",
      "Note: sticky note appears on side", "Highlight: text highlight with underline", "Translate: translation fades in on hover",
      "Dictionary: popup with definition on word tap", "Pronunciation: speaker icon pulses", "Illustrations: tap to zoom with bounce",
      "Illustrations: pinch to zoom with smooth scale", "Illustrations: double-tap to reset", "Illustrations: pan with grab cursor",
      "Captions: slide up on hover", "Image gallery: thumbnails slide in", "Character gallery: character cards flip",
      "Map view: locations appear with drop pin", "Timeline: events slide in on scroll", "Credits: credits slide up from bottom",
      "Author note: note expands with fade", "Dedication: dedication slides in", "Afterword: afterword fades in",
      "Preview next chapter: card slides in", "Series navigation: arrow buttons pulse"
    ]
  },
  {
    title: "Illustrations & Images",
    icon: <ImageIcon className="text-olive" />,
    items: [
      "Gentle fog overlay moves slowly", "Watercolour bloom: colours spread", "Gilded edge: gold border shimmer",
      "Paper texture overlay: static grain", "Floating vignette: dark edges pulse", "Warm glow: radial gradient pulses",
      "Soft shadow: drop shadow animates", "Ink bleed: edges expand slightly", "Painted edges: worn corners fade",
      "Layered parallax: foreground/background drift", "Sparkle overlay: tiny lights drift", "Torn paper edge: bottom edge rips",
      "Stamped title: title imprints", "Seasonal tint: colour wash fades", "Character stand-out: aura glow",
      "Spotlight: radial spotlight moves", "Colour overlay: tint shifts on hover", "Blur effect: background blurs on focus",
      "Sepia tone: fades in on hover", "Grain effect: noise shifts", "Glitch effect: RGB split on error",
      "Pixelate: pixelates on load", "Zoom on hover: image scales", "Zoom on click: expands to full",
      "Pan on drag: moves with cursor", "Rotate on hover: slight rotation", "Flip on hover: horizontal flip",
      "Sketch effect: edges become line art", "Watercolour edges: borders bleed", "Oil paint effect: brush strokes appear",
      "Charcoal effect: smudge animation", "Pastel effect: colours soften", "Neon outline: glow pulses",
      "Holographic: rainbow gradient moves", "Metallic shine: light sweep", "Fabric texture: weave moves",
      "Wood grain: grain shifts", "Leather texture: grain pulses", "Stone texture: noise moves",
      "Cloud texture: clouds drift", "Star texture: stars twinkle", "Confetti overlay: confetti falls",
      "Leaf overlay: leaves drift", "Snow overlay: snow falls", "Rain overlay: rain streaks",
      "Bubbles overlay: bubbles float", "Fireflies: dots move randomly", "Dust motes: particles drift",
      "Smoke: smoke wisps", "Ripple: ripple on hover"
    ]
  },
  {
    title: "Audio & Voice",
    icon: <Music className="text-olive" />,
    items: [
      "Waveform: animates with speech", "Character avatar light-up: avatar glows", "Lip-sync: mouth shapes move",
      "Spatial audio visual: sound direction indicator", "Voice speed slider: speed changes with count",
      "Voice pitch slider: pitch shifts with animation", "Voice volume: meter rises", "Background music: volume fader",
      "Sound effect: icon pulses on play", "Mute: icon changes with crossfade", "Unmute: icon changes with bounce",
      "Audio loading: spinner appears", "Audio error: waveform turns red", "Audio buffering: waveform pulses",
      "Audio seeking: timeline moves", "Audio bookmark: marker appears", "Audio loop: loop icon rotates",
      "Audio playlist: next track slides", "Audio shuffle: shuffle icon spins", "Audio repeat: repeat icon bounces",
      "Audio download: download icon fills", "Audio share: share icon expands", "Audio equalizer: bars move",
      "Audio spectrogram: colours shift", "Audio visualiser: circle pulses", "Audio wave: line moves",
      "Audio ring: ring expands", "Audio particle: particles move to beat", "Audio fire: flame dances",
      "Audio water: ripples expand", "Audio stars: stars twinkle", "Audio confetti: confetti bursts",
      "Audio glow: glow pulses", "Audio gradient: gradient shifts", "Audio text: text morphs",
      "Audio emoji: emoji changes", "Audio background: background colour shifts", "Audio light: light pulses",
      "Audio shadow: shadow moves", "Audio ripple: ripple expands", "Audio bounce: element bounces",
      "Audio shake: element shakes", "Audio spin: element spins", "Audio pulse: element pulses",
      "Audio fade: element fades", "Audio slide: element slides", "Audio zoom: element zooms",
      "Audio rotate: element rotates", "Audio skew: element skews", "Audio flip: element flips"
    ]
  },
  {
    title: "Achievements & Milestones",
    icon: <Trophy className="text-olive" />,
    items: [
      "Confetti burst: on first story", "Fireworks: on 10th story", "Badge pop-up: badge floats up",
      "Badge shine: badge glows", "Badge spin: badge spins in", "Badge bounce: badge bounces",
      "Badge slide: badge slides in", "Badge pulse: badge pulses", "Badge glow: badge glows",
      "Badge ring: ring expands", "Badge confetti: confetti around badge", "Badge stars: stars appear",
      "Badge particles: particles form badge", "Badge text: text appears", "Badge icon: icon animates",
      "Badge colour: colour transitions", "Badge sound: chime plays", "Badge vibration: haptic feedback",
      "Badge notification: notification slides", "Badge share: share button appears", "Milestone timeline: timeline fills",
      "Milestone marker: marker moves", "Milestone progress: progress bar fills", "Milestone count: number counts up",
      "Milestone pop: pop effect", "Milestone flash: flash effect", "Milestone ripple: ripple effect",
      "Milestone sparkle: sparkles appear", "Milestone trail: trail follows", "Milestone orbit: particles orbit",
      "Milestone explosion: explosion effect", "Milestone wave: wave expands", "Milestone ring: ring expands",
      "Milestone pulse: pulse effect", "Milestone bounce: bounce effect", "Milestone slide: slide effect",
      "Milestone fade: fade effect", "Milestone zoom: zoom effect", "Milestone rotate: rotate effect",
      "Milestone flip: flip effect", "Milestone skew: skew effect", "Milestone colour: colour shift",
      "Milestone gradient: gradient moves", "Milestone shadow: shadow moves", "Milestone glow: glow moves",
      "Milestone border: border animates", "Milestone background: background animates", "Milestone text: text animates",
      "Milestone icon: icon animates", "Milestone avatar: avatar animates"
    ]
  }
];

export default function DesignInspiration() {
  return (
    <div className="p-8 space-y-12">
      <header className="max-w-3xl">
        <h2 className="text-3xl font-serif mb-4">The Combinatorial Engine</h2>
        <p className="text-ink/60 leading-relaxed">
          Every animation/design idea can be described by three attributes:
          <span className="block mt-4 font-bold text-olive">Target + Trigger + Effect</span>
        </p>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-paper rounded-2xl border border-ink/5">
            <div className="text-[10px] small-caps text-ink/40 mb-1">Target</div>
            <div className="text-sm font-bold">Button, Card, Page...</div>
          </div>
          <div className="p-4 bg-paper rounded-2xl border border-ink/5">
            <div className="text-[10px] small-caps text-ink/40 mb-1">Trigger</div>
            <div className="text-sm font-bold">Hover, Click, Scroll...</div>
          </div>
          <div className="p-4 bg-paper rounded-2xl border border-ink/5">
            <div className="text-[10px] small-caps text-ink/40 mb-1">Effect</div>
            <div className="text-sm font-bold">Fade, Slide, Morph...</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {categories.map((cat, idx) => (
          <motion.div 
            key={cat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-paper/30 rounded-3xl p-8 border border-ink/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                {cat.icon}
              </div>
              <h3 className="text-xl font-serif">{cat.title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-ink/60 group">
                  <div className="w-1 h-1 rounded-full bg-olive/30 mt-1.5 group-hover:bg-olive transition-colors" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="bg-olive text-white p-12 rounded-[3rem] text-center space-y-6">
        <h3 className="text-3xl font-serif">How to Reach 60,000 Ideas</h3>
        <p className="max-w-2xl mx-auto opacity-80">
          Take any of the 600 examples above. Multiply by timing, easing, direction, and triggers.
          The combinations are virtually endless.
        </p>
        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold">
          <div className="flex flex-col items-center">
            <span className="text-2xl">3</span>
            <span className="opacity-60 small-caps text-[10px]">Durations</span>
          </div>
          <div className="text-2xl opacity-20">×</div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">5</span>
            <span className="opacity-60 small-caps text-[10px]">Easings</span>
          </div>
          <div className="text-2xl opacity-20">×</div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">4</span>
            <span className="opacity-60 small-caps text-[10px]">Directions</span>
          </div>
          <div className="text-2xl opacity-20">×</div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">3</span>
            <span className="opacity-60 small-caps text-[10px]">Triggers</span>
          </div>
          <div className="text-2xl opacity-20">=</div>
          <div className="text-3xl font-serif">216,000+</div>
        </div>
      </footer>
    </div>
  );
}
