Synth.UI = function(synth) {
    "use strict";

    function TypeSelect(id, property, options) {
        var typeSelect = new Nexus.Select('#' + id + '-select', {
            options: options
        });
        typeSelect.on('change', function(selection) {
            property.type(selection.value);
            // Don't take over keyboard focus
            typeSelect.element.blur();
        });
    }

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

    // oscillator controls
    TypeSelect('osc-type', synth.oscillator, [
        'sine',
        'triangle',
        'sawtooth',
        'square'
        ]);
    DialControl('osc-detune', synth.oscillator.detune, 'value', {
        max: 100
    });
    DialControl('osc-portamento', synth, 'portamento');

    // Filter controls
    TypeSelect('filter-type', synth.filter, [
        'lowpass',
        'highpass',
        'bandpass',
        'notch'
        ]);
    DialControl('filter-freq', synth.filter.frequency, 'value', {
        value: 0.5
    });
    DialControl('filter-q', synth.filter.Q);

    // Amplifier/Envelope controls
    SliderControl('envelope-a', synth.amplifier.envelope, 'attack', {
        min: 0.01
    });
    SliderControl('envelope-d', synth.amplifier.envelope, 'decay', {
        min: 0.01
    });
    SliderControl('envelope-s', synth.amplifier.envelope, 'sustain', {
        value: 1.0
    });
    SliderControl('envelope-r', synth.amplifier.envelope, 'release', {
        min: 0.01
    });

    // LFO controls
    TypeSelect('lfo-type', synth.lfo, [
        'sine',
        'triangle',
        'sawtooth',
        'square'
        ]);
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
