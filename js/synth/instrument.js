(function () {
    "use strict";

    Synth.Instrument = function() {
        Tone.Monophonic.call(this, {});

        var osc = oscSection();
        var flt = filterSection(osc.output);
        var env = envelopeSection(flt.output);
        var lfo = lfoSection(osc, flt);

        // Member required by the Monophonic superclass for pitch control
        this.frequency = osc.frequency;

        // UI Inputs:
        // - oscMid.type
        // - oscHi.type
        // - oscLo.type
        // - detune.value
        // - portamento
        // - filter.type
        // - filterFrequency.value
        // - filterQ.value
        // - envelope.attack
        // - envelope.decay
        // - envelope.sustain
        // - envelope.release
        // - lfo.type
        // - lfoRate.value
        // - lfoPitch.value
        // - lfoFilter.value

        this.oscMid = osc.oscMid;
        this.oscHi = osc.oscHi;
        this.oscLo = osc.oscLo;
        this.detune = osc.detune

        this.filter = flt.filter;
        this.filterFrequency = flt.frequency;
        this.filterQ = flt.Q;

        this.envelope = env.envelope;
        this.output = env.output;

        this.lfo = lfo.lfo;
        this.lfoRate = lfo.lfoRate;
        this.lfoPitch = lfo.lfoPitch;
        this.lfoFilter = lfo.lfoFilter;

        this._readOnly([
            'oscMid',
            'oscHi',
            'oscLo',
            'detune',
            'filter',
            'filterFrequency',
            'filterQ',
            'envelope',
            'lfo',
            'lfoRate',
            'lfoPitch',
            'lfoFilter'
            ]);
    }

    function oscSection() {
        var oscMid = new Tone.Oscillator().start();
        var oscHi = new Tone.Oscillator().start();
        var oscLo = new Tone.Oscillator().start();

        // Frequency control affects all three oscillators
        oscMid.frequency.fan(oscHi.frequency, oscLo.frequency);

        // Detune control moves the hi and lo oscillators in opposite directions
        oscHi.detune.chain(new Tone.Negate(), oscLo.detune)

        // Oscillators --> Pitch Modulation
        var pitchMod = new Tone.Delay();
        var pitchModAmount = new Tone.Multiply(0.005).connect(pitchMod.delayTime);
        oscMid.connect(pitchMod);
        oscLo.connect(pitchMod);
        oscHi.connect(pitchMod);

        return {
            oscMid: oscMid,
            oscHi: oscHi,
            oscLo: oscLo,
            frequency: oscMid.frequency,
            detune: oscHi.detune,
            pitchModAmount: pitchModAmount,
            output: pitchMod.output
        };
    }

    function filterSection(input) {
        var filter = new Tone.Filter();
        var frequency = new Tone.Signal();
        var Q = new Tone.Signal();

        input.connect(filter);

        // frequency takes an input range of 0-1
        // scale this to the 20 Hz-20 kHz frequency range
        frequency.chain(new Tone.ScaleExp(20, 20000), filter.frequency);

        // Q value "is a dimensionless value with a default value of 1 and a nominal range of 0.0001 to 1000"
        // https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/Q
        // Scaling this to 0-50 keeps it in a range that sounds better.
        Q.chain(new Tone.Multiply(50), filter.Q);

        return {
            filter: filter,
            frequency: frequency,
            Q: Q,
            output: filter.output
        }
    }

    function envelopeSection(input) {
        var envelope = new Tone.AmplitudeEnvelope();

        input.connect(envelope);

        return {
            envelope: envelope,
            output: envelope.output
        };
    }

    function lfoSection(osc, flt) {
        var lfo = new Tone.LFO().start();
        var lfoRate = new Tone.Signal();
        lfoRate.chain(new Tone.ScaleExp(0.1, 10), lfo.frequency);

        // LFO Routing
        var lfoPitch = new Tone.Multiply(0);
        var lfoFilter = new Tone.Multiply(0);
        lfo.fan(lfoPitch, lfoFilter);

        lfoPitch.connect(osc.pitchModAmount);
        lfoFilter.connect(flt.frequency);

        return {
            lfo: lfo,
            lfoRate: lfoRate,
            lfoPitch: lfoPitch,
            lfoFilter: lfoFilter
        };
    }

    Tone.extend(Synth.Instrument, Tone.Monophonic);

    Synth.Instrument.prototype._triggerEnvelopeAttack = function(time, velocity){
        this.envelope.triggerAttack(time, velocity);
        return this;
    };
    Synth.Instrument.prototype._triggerEnvelopeRelease = function(time){
        this.envelope.triggerRelease(time);
        return this;
    };
})();
