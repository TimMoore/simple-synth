Synth.UI = function(synth) {
    "use strict";

    function DialControl(id, signal, property, options) {
        property = property || 'value';
        options = options || {};
        options.size = [60, 60];

        // Initialize dial and connect to signal
        var dial = new Nexus.Dial('#' + id + '-dial', options);
        dial.on('change', function(value) {
            signal[property] = value;
        });

        var initialValue = dial.value;
        signal[property] = initialValue;

        // Reset value on double-click
        dial.element.addEventListener('dblclick', function() {
            dial.value = initialValue;
        });
    }

    function SliderControl(id, signal, property, options) {
        options.size = [20, 120];

        // Initialize slider and connect to signal
        var slider = new Nexus.Slider('#' + id + '-slider', options);
        slider.on('change', function(value) {
            signal[property] = value;
        });

        var initialValue = slider.value;
        signal[property] = initialValue;
    }

    // Osc controls
    var typeSelect = new Nexus.Select('#osc-type-select', {
        options: [
        'sine',
        'triangle',
        'sawtooth',
        'square'
        ]
    });
    typeSelect.on('change', function(selection) {
        synth.oscMid.type = selection.value;
        synth.oscHi.type = selection.value;
        synth.oscLo.type = selection.value;
    });
    DialControl('osc-detune', synth.detune, 'value', {
        max: 100
    });
    DialControl('osc-portamento', synth, 'portamento');

    // Filter controls
    var filterTypeSelect = new Nexus.Select('#filter-type-select', {
        options: [
        'lowpass',
        'highpass',
        'bandpass',
        'notch'
        ]
    });
    filterTypeSelect.on('change', function(selection) {
        synth.filter.type = selection.value;
    });
    DialControl('filter-freq', synth.filterFrequency, 'value', {
        value: 0.5
    });
    DialControl('filter-res', synth.filterQ);

    SliderControl('envelope-a', synth.envelope, 'attack', {
        min: 0.01
    });
    SliderControl('envelope-d', synth.envelope, 'decay', {
        min: 0.01
    });
    SliderControl('envelope-s', synth.envelope, 'sustain', {
        value: 1.0
    });
    SliderControl('envelope-r', synth.envelope, 'release', {
        min: 0.01
    });

    // LFO controls
    var lfoTypeSelect = new Nexus.Select('#lfo-type-select', {
        options: [
        'sine',
        'triangle',
        'sawtooth',
        'square'
        ]
    });
    lfoTypeSelect.on('change', function(selection) {
        synth.lfo.osc.type = selection.value;
    });

    DialControl('lfo-rate', synth.lfo.rate);
    DialControl('lfo-pitch', synth.lfo.pitchAmount);
    DialControl('lfo-filter', synth.lfo.filterAmount);

    // On-screen piano control
    var piano = new Nexus.Piano('#piano', {
        lowNote: 36,
        highNote: 73
    });
    piano.on('change', function(key) {
        if (key.state) {
            synth.triggerAttack(Tone.Frequency(key.note, "midi"));
        } else {
            synth.triggerRelease();
        }
    });

    // Easter egg: computer keyboard control
    var keyboard = new AudioKeys();
    keyboard.down(function(note) {
      synth.triggerAttack(note.frequency);
    });
    keyboard.up(function(note) {
      synth.triggerRelease();
    });
}
