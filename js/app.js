(function() {

  var SimpleSynth = (function() {
    var graphicsCanvas,
        audioCtx,
        osc,
        osc2,
        gain,
        oscBuffer,
        on,
        oscsFreq,
        oscsTypes,
        currentNote,
        keyC,
        keyD,
        keyE;

    var keyPitches = {
      'C_2':   130.812782650299317,
      'C#2':   138.591315488436048,
      'D_2':   146.832383958703780,
      'D#2':   155.563491861040455,
      'E_2':   164.813778456434964,
      'F_2':   174.614115716501942,
      'F#2':   184.997211355817199,
      'G_2':   195.997717990874647,
      'G#2':   207.652348789972569,
      'A_2':   220.000000000000000,
      'A#2':   233.081880759044958,
      'B_2':   246.941650628062055,
      'C_3':   261.625565300598634,
      'C#3':   277.182630976872096,
      'D_3':   293.664767917407560,
      'D#3':   311.126983722080910,
      'E_3':   329.627556912869929,
      'F_3':   349.228231433003884,
      'F#3':   369.994422711634398,
      'G_3':   391.995435981749294,
      'G#3':   415.304697579945138,
      'A_3':   440.000000000000000,
      'A#3':   466.163761518089916,
      'B_3':   493.883301256124111,
      'C_4':   523.251130601197269
    }

    var keyBindings = [
      {key: 'a', pitch: 'C_2'},
      {key: 'w', pitch: 'C#2'},
      {key: 's', pitch: 'D_2'},
      {key: 'e', pitch: 'D#2'},
      {key: 'd', pitch: 'E_2'},
      {key: 'f', pitch: 'F_2'},
      {key: 't', pitch: 'F#2'},
      {key: 'g', pitch: 'G_2'},
      {key: 'y', pitch: 'G#2'},
      {key: 'h', pitch: 'A_2'},
      {key: 'u', pitch: 'A#2'},
      {key: 'j', pitch: 'B_2'},
    ]


    var Synth = function() {
      graphicsCanvas = document.getElementById('graphicsCanvas');
      keyC = document.getElementById('key-c'),
      keyD = document.getElementById('key-d'),
      keyE = document.getElementById('key-e');
      currentNote = keyPitches['C_3'];

      audioCtx = new webkitAudioContext();
      // These Frequencies are relative to A at 440hz
      oscsFreq = [0.5, 1],
      oscsTypes = ['sine', 'sawtooth'];

      Synth.createOscillatorBuffer();

      SimpleSynth.initEvents();
      SimpleSynth.bindKeys();

    }


    Synth.debounce = function(fn, delay) {
      var timer = null;
      debugger;
      return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    }

    Synth.initEvents = function() {
      // keyC.addEventListener('mousedown', SimpleSynth.setPitch);
      // keyC.addEventListener('mouseup', SimpleSynth.stopSound);
      // keyD.addEventListener('mousedown', SimpleSynth.setPitch);
      // keyD.addEventListener('mouseup', SimpleSynth.stopSound);
      // keyE.addEventListener('mousedown', SimpleSynth.setPitch);
      // keyE.addEventListener('mouseup', SimpleSynth.stopSound);
      //
      //
      // graphicsCanvas.addEventListener('mousedown', SimpleSynth.startSound);
      // graphicsCanvas.addEventListener('touchstart', SimpleSynth.startSound);
      //
      // graphicsCanvas.addEventListener('mouseup', SimpleSynth.stopSound);
      // document.addEventListener('mouseleave', SimpleSynth.stopSound);
      // graphicsCanvas.addEventListener('touchend', SimpleSynth.stopSound);
    }


    Synth.stopSound = function(note) {
      var oscGroup = _.find(oscBuffer, { pitch: note });
      oscGroup.gain1.gain.value = 0;
      oscGroup.gain2.gain.value = 0;
    }

    Synth.setPitch = function(e) {
      if(e.currentTarget.innerText === 'C') {
        currentNote = keyPitches['C_3'];
      } else if (e.currentTarget.innerText === 'D') {
        currentNote = keyPitches['D_3'];
      } else if (e.currentTarget.innerText === 'E') {
        currentNote = keyPitches['E_3'];
      }
      Synth.startSound();
    }

    Synth.bindKeyPair = function(key, pitchName) {
      var isDown = false;
      Mousetrap.bind(key,
        function() {
          if (!isDown) {
            Synth.setPitch2(pitchName);
            console.log('down');
            isDown = true}
          },
          'keypress'
      );

      Mousetrap.bind(key,
        function() {
          Synth.stopSound(pitchName);
          console.log('up')
          isDown = false;
        },
        'keyup'
      );
    }

    Synth.bindKeys = function() {
      _(keyBindings).forEach(function(obj) {
        Synth.bindKeyPair(obj.key, obj.pitch);
      });
    }

    Synth.setPitch2 = function(note) {
      // currentNote = keyPitches[note];
      Synth.startSound(note);
    }

    Synth.createOscillatorBuffer = function () {
      // We have an oscillator buffer which contains a group of oscillators
      // for each midi note.
      oscBuffer = [];

      _(keyBindings).forEach(function(obj) {
        var osc1 = Synth.initOscillator(oscsFreq[0] * keyPitches[obj.pitch], oscsTypes[0]);
        var osc2 = Synth.initOscillator(oscsFreq[1] * keyPitches[obj.pitch], oscsTypes[1]);
        osc1.osc.start();
        osc2.osc.start();
        oscBuffer.push({
          pitch: obj.pitch,
          oscillatorOne: osc1.osc,
          oscillatorOnePitch: null,
          gain1: osc1.gain,
          oscillatorTwo: osc2.osc,
          oscillatorTwoPitch: null,
          gain2: osc2.gain,
        });
      });

    }

    Synth.initOscillator = function (freq, type) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq
      gain.connect(audioCtx.destination);
      osc.connect(gain);
      gain.gain.value = 0;
      return {osc: osc, gain: gain};
    }

    Synth.startSound = function(note) {
      var oscGroup = _.find(oscBuffer, { pitch: note });

      oscGroup.gain1.gain.value = 50;
      oscGroup.gain2.gain.value = 50;
      // osc = audioCtx.createOscillator();
      // gain = audioCtx.createGain();
      // osc.type = oscsTypes[0];
      // osc.frequency.value = oscsFreq[0] * currentNote;
      // gain.connect(audioCtx.destination);
      // osc.connect(gain);
      // osc.start();
      // osc2 = audioCtx.createOscillator();
      // osc2.type = oscsTypes[1];
      // osc2.frequency.value = oscsFreq[1] * currentNote;
      // osc2.connect(gain);
      // osc2.start();

    }
    return Synth;

  })();

  window.onload = function() {
    var synth = new SimpleSynth();
  }


}());
