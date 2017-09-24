(function () {
    "use strict";

    Synth.Instrument = function() {
        Tone.Monophonic.call(this, {});

        var osc = oscSection();
        var flt = filterSection(osc.output);
        var env = envelopeSection(flt.output);
        var lfo = lfoSection(osc.pitchModAmount, flt.frequency);

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

        this.lfo = lfo;

        this._readOnly([
            'oscMid',
            'oscHi',
            'oscLo',
            'detune',
            'filter',
            'filterFrequency',
            'filterQ',
            'envelope',
            'lfo'
            ]);
    }

    function oscSection() {
        var oscMid = new Tone.Oscillator().start();
        var oscHi = new Tone.Oscillator().start();
        var oscLo = new Tone.Oscillator().start();

        // Frequency control and pitch modulation affect all three oscillators
        var frequency = new Tone.Signal();
        var pitchMod = new Tone.Multiply();
        var pitchModAmount = new Tone.ScaleExp(0.5, 2);
        frequency.connect(pitchMod.input[0]);
        pitchModAmount.connect(pitchMod.input[1]);
        frequency.connect(oscMid.frequency);
        pitchMod.connect(oscMid.frequency);
        oscMid.frequency.fan(oscHi.frequency, oscLo.frequency);

        // Detune control moves the hi and lo oscillators in opposite directions
        var detune = oscHi.detune;
        detune.chain(new Tone.Negate(), oscLo.detune);

        var output = new Tone.Signal();
        oscMid.connect(output)
        oscLo.connect(output);
        oscHi.connect(output);

        return {
            oscMid: oscMid,
            oscHi: oscHi,
            oscLo: oscLo,
            frequency: frequency,
            detune: detune,
            pitchModAmount: pitchModAmount,
            output: output
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

    function lfoSection(pitchMod, filterMod) {
        var osc = new Tone.LFO().start();
        var rate = new Tone.Signal();
        rate.chain(new Tone.ScaleExp(0.1, 10), osc.frequency);

        // LFO Routing
        var pitchAmount = new Tone.Multiply(0);
        var filterAmount = new Tone.Multiply(0);
        osc.fan(pitchAmount, filterAmount);

        pitchAmount.connect(pitchMod);
        filterAmount.connect(filterMod);

        return {
            osc: osc,
            rate: rate,
            pitchAmount: pitchAmount,
            filterAmount: filterAmount
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
