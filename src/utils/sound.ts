/**
 * 音效管理工具 - 使用 Web Audio API 生成音效
 * 无需外部音频文件，纯代码生成
 */

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

/** 播放正确音效 - 上升的叮咚声 */
export function playCorrectSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(523, now) // C5
  osc.frequency.setValueAtTime(659, now + 0.1) // E5
  osc.frequency.setValueAtTime(784, now + 0.2) // G5

  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

  osc.start(now)
  osc.stop(now + 0.5)
}

/** 播放错误音效 - 柔和的下降音 */
export function playWrongSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(392, now) // G4
  osc.frequency.setValueAtTime(330, now + 0.15) // E4

  gain.gain.setValueAtTime(0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

  osc.start(now)
  osc.stop(now + 0.4)
}

/** 播放连击音效 - 更欢快的上升音 */
export function playComboSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(523, now)
  osc.frequency.setValueAtTime(659, now + 0.08)
  osc.frequency.setValueAtTime(784, now + 0.16)
  osc.frequency.setValueAtTime(1047, now + 0.24)

  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

  osc.start(now)
  osc.stop(now + 0.5)
}

/** 播放星星收集音效 - 短促的叮 */
export function playStarSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.setValueAtTime(1320, now + 0.05)

  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

  osc.start(now)
  osc.stop(now + 0.2)
}

/** 播放炸弹音效 - 低沉的爆炸声 */
export function playBombSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(150, now)
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.3)

  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

  osc.start(now)
  osc.stop(now + 0.4)
}

/** 播放点击音效 - 短促的哒 */
export function playClickSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, now)

  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

  osc.start(now)
  osc.stop(now + 0.1)
}

/** 播放完成/胜利音效 - 欢快的旋律 */
export function playVictorySound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const notes = [523, 659, 784, 1047, 784, 1047] // C E G C' G C'
  const durations = [0.15, 0.15, 0.15, 0.15, 0.15, 0.3]

  let time = now
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, time)

    gain.gain.setValueAtTime(0.25, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + (durations[i] || 0.15))

    osc.start(time)
    osc.stop(time + (durations[i] || 0.15) + 0.05)

    time += durations[i] || 0.15
  })
}

/** 播放倒计时紧迫音效 */
export function playUrgentSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'square'
  osc.frequency.setValueAtTime(440, now)
  osc.frequency.setValueAtTime(440, now + 0.05)
  osc.frequency.setValueAtTime(0, now + 0.1)
  osc.frequency.setValueAtTime(440, now + 0.15)
  osc.frequency.setValueAtTime(440, now + 0.2)

  gain.gain.setValueAtTime(0.1, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

  osc.start(now)
  osc.stop(now + 0.3)
}

/** 语音播报文字 */
export function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9
  utterance.pitch = 1.2
  speechSynthesis.speak(utterance)
}

/** 播放正确反馈语音 */
export function speakCorrect() {
  const phrases = ['你真棒！', '太厉害了！', '答对啦！', '真聪明！']
  speak(phrases[Math.floor(Math.random() * phrases.length)]!)
}

/** 播放错误反馈语音 */
export function speakWrong() {
  const phrases = ['再想想哦！', '没关系，再试一次！', '加油哦！', '差一点点！']
  speak(phrases[Math.floor(Math.random() * phrases.length)]!)
}
