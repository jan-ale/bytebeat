"use strict";
let customFunctions = {
  rnd_num: round(random() * 256),
  rnd: (x) => random() * 256,
  xor: (x, v) => x ^ x % v,
  sinf: x => sin(x * PI / 128),
  cosf: x => cos(x * PI / 128),
  tanf: x => tan(x * PI / 128),
  expm2: x => exp(x) - 2,
  minrnd_num: (v, x) => min(round(random() * v), x),
}
//custom operations by u/psubscirbe <3
let mathProperties = Object.getOwnPropertyNames(Math);
for(let property of mathProperties) {
  window[property] = Math[property];
}
let customProperties = Object.getOwnPropertyNames(customFunctions);
for(let property of customProperties) {
  window[property] = customFunctions[property];
}

function secure() {
  const handler = {
    get: function(target, name) {
      return secure();
    },
    set: function() {
      throw new Error();
    }
  };
  return new Proxy({}, handler);
}


const bgPicker = document.getElementById("bgCol");
const txtPicker = document.getElementById("txtCol");

//load theme from local storage
if(localStorage.getItem("bg-color") !== null) {
  bgPicker.value = localStorage.getItem("bg-color");
  updateBgCol();
}
if(localStorage.getItem("txt-color") !== null) {
  txtPicker.value = localStorage.getItem("txt-color");
  updateTxtCol();
}

function updateTheme() {
  const bgCol = bgPicker.value;
  const txtCol = txtPicker.value;
  const light = luminance(bgCol)>luminance(txtCol);
  if(light) {
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
  }
}

function luminance(hex) {
  const red = parseInt(hex.slice(1,3),16);
  const green = parseInt(hex.slice(3,5),16);
  const blue = parseInt(hex.slice(5,7),16);
  return red+green+blue;
}

function updateBgCol() {
  const col = bgPicker.value;
  document.body.style.setProperty("--main-background-color", col);
  localStorage.setItem("bg-color", col);
  updateTheme();
}

function updateTxtCol() {
  const col = txtPicker.value;
  document.body.style.setProperty("--main-text-color", col);
  localStorage.setItem("txt-color", col);
  updateTheme();
}

bgPicker.addEventListener("input", updateBgCol);
txtPicker.addEventListener("input", updateTxtCol);


document.getElementById("FontCh").addEventListener("change", function() {
  const font = this.value;
  document.body.style.setProperty('--font-family', font);
});
document.getElementById("visualizer").addEventListener("change", updateVisualizer);
function updateVisualizer(visualizeSelect) {
  let visualizer = (this || visualizeSelect).value;
  if(visualizer == "none") {
    if(document.getElementById("canvas")) {
      document.getElementById("canvas").remove();
    }
  } else {
    if(!document.getElementById("canvas")) {
      let canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      canvas.id = "canvas";
      document.getElementById("formula").after(canvas);
    }
  }
}

function changeBackground() {
  const fileInput = document.getElementById('backgroundInput');
  const file = fileInput.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.body.style.backgroundImage = `url('${e.target.result}')`;
    };
    reader.readAsDataURL(file);
  } else {
    if (Math.floor(Math.random() * 2) === 1) {
      alert('Insert cash or select payment type.');
    } else {
      alert('Invalid image!');
    }
  }
}
function numberToFloat(input, mode) {
  let outin;
  switch (mode) {
    case "bytebeat":
      outin = (input & 255) / 127.5 - 1;
      break;
    case "signedbytebeat":
      outin = ((input + 128) & 255) / 127.5 - 1;
      break;
    case "floatbeat":
      outin = input;
      break;
    case "bitbeat":
      outin = (input & 1) - 0.5;
      break;
    case "1024":
      outin = (input & 1023) / 511.5 - 1; // (x&1023)/511.5-1
      break;
    default:
      outin = (input & 255) / 127.5 - 1;
  }
  return outin;
}
class BytebeatPlayer {
  constructor() {
    this.audioCtx = null;
    this.source = null;
    this.gainNode = null;
    this.playing = false;
    this.volume = document.getElementById("volume").value;
  }
  play() {
    if (this.playing) {
      this.stop();
    }
    this.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    this.source = this.audioCtx.createBufferSource();
    this.gainNode = this.audioCtx.createGain();
    let formula = document.getElementById("formula").value;
    let sampleRate = document.getElementById("sampleRate").value;
    let duration = document.getElementById("duration").value;
    let buffer;
    try {
      let bytebeatFunc = Function("t, document, window, console", `return (${formula})`);
      let extra = [secure(), secure(), {
        log: console.log
      }];
      let sample = bytebeatFunc(0, ...extra);
      let stereo = false;
      switch(typeof sample) {
        case "number":
          break;
        case "object":
          if(Array.isArray(sample)) {
            stereo = true;
          } else {
            throw "Unrecognizable object returned";
          }
          break;
        default:
          throw "Unrecognized type returned: "+typeof sample;
      }
      let channels = stereo? sample.length : 1;
      let samples = sampleRate * duration;
      buffer = this.audioCtx.createBuffer(channels, samples, sampleRate);
      let data;
      if(stereo) {
        data = [];
        for(let channel = 0; channel < channels; channel++) {
          data[channel] = buffer.getChannelData(channel);
        }
      } else {
        data = buffer.getChannelData(0);
      }
      for (let t = 0; t < samples; t++) {
        let input = bytebeatFunc(t, ...extra);
        for(let channel = 0; channel < channels; channel++) {

          let mode = document.getElementById("mode").value;
          let outin = numberToFloat(stereo? input[channel]:input, mode);
          if(stereo) {
            data[channel][t] = outin;
          } else {
            data[t] = outin;
          }
        }
      }
      text.innerText = "good";
      text.classList.remove("error");
    } catch (e) {
      console.error(e);
      text.innerText = e.toString();
      text.classList.add("error");
    }
    this.source.buffer = buffer;
    this.gainNode.gain.linearRampToValueAtTime(this.volume, 0.05);
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    this.source.start();
    this.visualize(buffer, document.getElementById("visualizer").value);
    this.playing = true;
  }

  visualize(buffer, vizualizer) {
    const self = this;
    const visualizers = {square: function(ctx, buffer) {
      const data = buffer.getChannelData(0); //Float32Array
      const stereo = buffer.numberOfChannels > 1;
      const dataArray = new Uint8ClampedArray(256*256*4);
      if(stereo) {
        const data2 = buffer.getChannelData(1);
        let data3;
        if(buffer.numberOfChannels >= 3) {
          data3 = buffer.getChannelData(2);
        }
        for(let i=0;i<256*256;i++) {
          dataArray[i*4] = (data[i]+1)*128;
          dataArray[i*4+1] = (data2[i]+1)*128;
          dataArray[i*4+2] = data3? (data3[i]+1)*128:0;
          dataArray[i*4+3] = 255;
        }
      } else {
        for(let i=0;i<256*256;i++) {
          const value = (data[i]+1)*128;
          dataArray[i*4] = value;
          dataArray[i*4+1] = value;
          dataArray[i*4+2] = value;
          dataArray[i*4+3] = 255;
        }
      }
      ctx.putImageData(new ImageData(dataArray, 256, 256), 0, 0);
    },
                         osci: function(ctx, buffer) {
                           if(buffer.numberOfChannels != 2) {
                             ctx.fillStyle="red";
                             ctx.fillRect(0,0,256,256);
                             return;
                           }
                           const x = buffer.getChannelData(0);
                           const y = buffer.getChannelData(1);
                           ctx.fillStyle = "rgba(0,0,0,0.5)";
                           ctx.lineWidth = 1;
                           ctx.strokeStyle = "lime";
                           const start = self.audioCtx.currentTime;
                           const CHUNK_SIZE = 256;
                           function frame() {
                             if(!self.playing) {
                               return;
                             }
                             const offset = floor((self.audioCtx.currentTime - start) * buffer.sampleRate);
                             ctx.fillRect(0,0,256,256);
                             ctx.beginPath();
                             ctx.moveTo((x[offset]+1)*128,(y[offset]+1)*128);
                             for(let i=offset+1;i<offset+CHUNK_SIZE;i++) {
                               const distance = Math.sqrt((x[i]-x[i-1])**2+(y[i]-y[i-1])**2);
                               if(distance>0.3) {
                                 ctx.moveTo((x[i]+1)*128, (y[i]+1)*128);
                               } else {
                                 ctx.lineTo((x[i]+1)*128, (y[i]+1)*128);
                               }
                             }
                             ctx.stroke();
                             requestAnimationFrame(frame);
                           }
                           const request = requestAnimationFrame(frame);
                           cancelAnimationFrame(request-1);
                         },
                         wave: function(ctx, buffer) {
                           const y = buffer.getChannelData(0);
                           ctx.fillStyle = "rgba(0,0,0,0.5)";
                           ctx.lineWidth = 1;
                           ctx.strokeStyle = "white";
                           const start = self.audioCtx.currentTime;
                           const CHUNK_SIZE = 256;
                           function frame() {
                             if(!self.playing) {
                               return;
                             }
                             const offset = floor( floor((self.audioCtx.currentTime - start) * buffer.sampleRate) /CHUNK_SIZE)*CHUNK_SIZE;
                             ctx.fillRect(0,0,256,256);
                             ctx.beginPath();
                             ctx.moveTo(0,(y[offset]+1)*128);
                             for(let x=0;x<CHUNK_SIZE;x++) {
                               ctx.lineTo(x, 256-(y[x+offset]+1)*128);
                             }
                             ctx.stroke();
                             requestAnimationFrame(frame);
                           }
                           const request = requestAnimationFrame(frame);
                           cancelAnimationFrame(request-1);
                         }};
    if(visualizer=="none") {
      return;
    }
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    visualizers[vizualizer](ctx, buffer);
  }

  stop() {
    this.source.stop();
    this.audioCtx.close();
    this.playing = false;
  }

  setVolume(value) {
    this.volume = value;
    if(this.playing) {
      this.gainNode.gain.linearRampToValueAtTime(this.volume, 0.05);
    }
  }
}
const player = new BytebeatPlayer();
const str001 = ["Hello world.", "West virginity rocks!", "Welcome to Gboard clipboard, any text you copy will be saved here.", " < label > splash text yeah < /label>", "This wasn't intentional.", "Word of the year: water", "Unicode has teached me anything.", "ramen", "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE", "Splash text loading: 1% Complete.", "()W()", "omaygot", "cheese", "int main();", "console.log()", "They did not see this one.", ".... - -- .-..", "sgdx vntkcms ad rtoqhrdc he xnt kds ld nts ne xntq azrdldms", "They said if you can never give up, uhh whats next?", "There are some exotic functions that you can use but they are a secret to find.", "Crazy? I was crazy once. They locked me in a room. A rubber room. A rubber room with rats.", "H", "[ Removed by Reddit ]", "there is nothing", "Segmentation fault (core dumped)", "console.log = \"hi\", console.log() //javascript!!! why not???"];
const text = document.getElementById("splashtext");
const textcon = Math.floor(Math.random() * str001.length);
const strset = str001[textcon];
text.textContent = strset;
const urlParams = new URLSearchParams(window.location.hash.slice(1));
const currentFormula = urlParams.get('formula') || '';
const currentSampleRate = urlParams.get('sampleRate') || 8000;
const currentDuration = urlParams.get('duration') || 20;
const currentMode = urlParams.get('mode') || 'bytebeat';
const currentVisualizer = urlParams.get('visualizer') || 'none';

function updateURLHash() {
  const newURLParams = new URLSearchParams();
  newURLParams.set('formula', formula.value);
  if(sampleRate.value != 8000) {
    newURLParams.set('sampleRate', sampleRate.value);
  }
  newURLParams.set('duration', duration.value);
  if(mode.value != "bytebeat") {
    newURLParams.set('mode', mode.value);
  }
  if(visualizer.value != "none") {
    newURLParams.set('visualizer', visualizer.value);
  }
  window.location.hash = newURLParams.toString();
}
const formula = document.getElementById('formula');
formula.value = currentFormula;
formula.addEventListener('input', updateURLHash);
const sampleRate = document.getElementById('sampleRate');
sampleRate.value = currentSampleRate;
sampleRate.addEventListener('input', updateURLHash);
const duration = document.getElementById('duration');
duration.value = currentDuration;
duration.addEventListener('input', updateURLHash);
const mode = document.getElementById('mode');
mode.value = currentMode;
mode.addEventListener('input', updateURLHash);
const visualizer = document.getElementById('visualizer');
visualizer.value = currentVisualizer;
visualizer.addEventListener('input', updateURLHash);
updateVisualizer(visualizer);

function copyLocationHref() {
  const locationHref = window.location.href;
  navigator.clipboard.writeText(locationHref).then(() => {
    alert("Copied to clipboard: " + locationHref);
  }).catch((error) => {
    alert("Failed to copy to clipboard: " + error);
  });
}