function FundamentalSynth() {
    "use strict";

    function Synth() {
        Tone.Monophonic.call(this, {});

        // Oscillators
        this.osc = new Tone.Oscillator().start();
        this.oscHi = new Tone.Oscillator().start();
        this.oscLo = new Tone.Oscillator().start();
        this.detune = this.oscHi.detune.chain(new Tone.Negate(), this.oscLo.detune);
        this.osc.frequency.fan(this.oscHi.frequency, this.oscLo.frequency);
        this.oscVibrato = new Tone.Delay();
        this.oscVibratoAmount = new Tone.Multiply(0.005).connect(this.oscVibrato.delayTime);

        // Osc --> Frequency Modulation
        this.osc.connect(this.oscVibrato);
        this.oscLo.connect(this.oscVibrato);
        this.oscHi.connect(this.oscVibrato);

        // Filter
        this.filter = new Tone.Filter();
        this.filterFrequency = new Tone.Signal();
        this.filterFrequency.chain(new Tone.ScaleExp(20, 20000), this.filter.frequency);
        this.filterQ = new Tone.Signal();
        this.filterQ.chain(new Tone.Multiply(100), this.filter.Q);

        // Frequency Mod --> Filter
        this.oscVibrato.connect(this.filter);

        // Envelope
        this.envelope = new Tone.AmplitudeEnvelope({
            attack: 0.01,
            decay: 0,
            sustain: 1.0,
            release: 0.01
        });

        // Filter --> Env
        this.filter.connect(this.envelope);

        // Amplifier
        this.amplifier = new Tone.Gain();
        this.tremoloAmount = new Tone.AudioToGain().chain(new Tone.Add(-1), this.amplifier.gain);
        this.envelope.connect(this.amplifier);
        this.amplifier.connect(this.output);

        // LFO
        this.lfo = new Tone.LFO().start();
        this.lfoRate = new Tone.Signal();
        this.lfoRate.chain(new Tone.ScaleExp(0.1, 10), this.lfo.frequency);

        // LFO Routing
        this.lfoOsc = new Tone.Multiply(0);
        this.lfoFilter = new Tone.Multiply(0);
        this.lfoAmplitude = new Tone.Multiply(0);
        this.lfo.fan(this.lfoOsc, this.lfoFilter, this.lfoAmplitude);
        this.lfoOsc.connect(this.oscVibratoAmount);
        this.lfoFilter.connect(this.filterFrequency);
        this.lfoAmplitude.connect(this.tremoloAmount);

        // Member required by the Monophonic superclass
        this.frequency = this.osc.frequency;

        this._readOnly(['osc', 'oscLo', 'oscHi', 'filter', 'lfo', 'envelope']);
    }

    Tone.extend(Synth, Tone.Monophonic);

    Synth.prototype._triggerEnvelopeAttack = function(time, velocity){
        this.envelope.triggerAttack(time, velocity);
        return this;
    };
    Synth.prototype._triggerEnvelopeRelease = function(time){
        this.envelope.triggerRelease(time);
        return this;
    };


    var synth = new Synth().toMaster();

    var keyboard = new Nexus.Piano('#keyboard', {
        lowNote: 36,
        highNote: 73
    });
    keyboard.on('change', function(key) {
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

    function initWaveformSelect(id, osc) {
        var typeSelect = new Nexus.Select('#' + id + '-select', {
            options: [
            'sine',
            'triangle',
            'sawtooth',
            'square'
            ]
        });
        typeSelect.on('change', function(selection) {
            osc.type = selection.value;
        });
    }

    function initDialControl(id, signal, property, options) {
        property = property || 'value';

        // Initialize dial and connect to signal
        var dial = new Nexus.Dial('#' + id + '-dial', options);
        dial.on('change', function(value) {
            signal[property] = value;
        });

        var initialValue = dial.value;
        if (signal) signal[property] = initialValue;

        // Reset value on double-click
        dial.element.addEventListener('dblclick', function() {
            dial.value = initialValue;
        });
    }

    // Osc controls
    initWaveformSelect('osc-type', synth.osc);
    initDialControl('osc-detune', synth.detune, 'value', {
        max: 100
    });
    initDialControl('osc-portamento', synth, 'portamento');

    // Filter controls
    var typeSelect = new Nexus.Select('#filter-type-select', {
        options: [
        'lowpass',
        'highpass',
        'bandpass',
        'notch'
        ]
    });
    typeSelect.on('change', function(selection) {
        console.log('Filter type: ' + selection);
        synth.filter.type = selection.value;
    });
    initDialControl('filter-freq', synth.filterFrequency, 'value', {
        value: 0.5
    });
    initDialControl('filter-res', synth.filterQ);

    initWaveformSelect('lfo-type', synth.lfo)
    initDialControl('lfo-rate', synth.lfoRate);

    initDialControl('env-osc');
    initDialControl('lfo-osc', synth.lfoOsc);
    initDialControl('env-filter');
    initDialControl('lfo-filter', synth.lfoFilter);
    initDialControl('env-amp');
    initDialControl('lfo-amp', synth.lfoAmplitude);

    return synth;
}

document.addEventListener("DOMContentLoaded", function(event) {
    window.synth = FundamentalSynth();
});
