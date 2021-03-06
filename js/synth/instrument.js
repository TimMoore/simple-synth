(function () {
    "use strict";

    Synth.Instrument = function() {
        Tone.Monophonic.call(this, {});

        // UI Inputs:
        // - oscillator.type(newType)
        // - oscillator.detune.value
        // - portamento
        // - filter.type(newType)
        // - filter.frequency.value
        // - filter.Q.value
        // - amp.envelope.attack
        // - amp.envelope.decay
        // - amp.envelope.sustain
        // - amp.envelope.release
        // - lfo.type(newType)
        // - lfo.rate.value
        // - lfo.pitchAmount.value
        // - lfo.filterAmount.value

        this.oscillator = oscillatorSection();
        this.filter = filterSection(this.oscillator.output);
        this.amplifier = amplifierSection(this.filter.output);
        this.output = this.amplifier.output;

        this.lfo = lfoSection(this.oscillator.pitchModAmount, this.filter.frequency);

        // Member required by the Monophonic superclass for pitch control
        this.frequency = this.oscillator.frequency;

        this._readOnly([
            'oscillator',
            'filter',
            'amplifier',
            'lfo'
            ]);
    }

    function oscillatorSection() {
        var mid = new Tone.Oscillator().start();
        var hi = new Tone.Oscillator().start();
        var lo = new Tone.Oscillator().start();

        // Frequency control and pitch modulation affect all three oscillators
        var frequency = new Tone.Signal();
        var pitchMod = new Tone.Multiply();
        var pitchModAmount = new Tone.Signal();
        frequency.connect(pitchMod.input[0]);
        pitchModAmount.connect(pitchMod.input[1]);
        frequency.connect(mid.frequency);
        pitchMod.connect(mid.frequency);
        mid.frequency.fan(hi.frequency, lo.frequency);

        // Detune control moves the hi and lo oscillators in opposite directions
        var detune = hi.detune;
        detune.chain(new Tone.Negate(), lo.detune);

        var output = new Tone.Signal();
        mid.connect(output)
        lo.connect(output);
        hi.connect(output);

        return {
            type: function(newType) {
                mid.type = newType;
                hi.type = newType;
                lo.type = newType;
            },
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
        // Scaling this to 0.001-50 keeps it in a range that sounds better.
        Q.chain(new Tone.ScaleExp(0.001, 50), filter.Q);

        return {
            type: function(newType) { filter.type = newType; },
            frequency: frequency,
            Q: Q,
            output: filter.output
        }
    }

    function amplifierSection(input) {
        var envelope = new Tone.AmplitudeEnvelope();

        input.connect(envelope);

        return {
            envelope: envelope,
            output: envelope.output
        };
    }

    function lfoSection(pitchMod, filterMod) {
        var oscillator = new Tone.LFO().start();
        var rate = new Tone.Signal();
        rate.chain(new Tone.ScaleExp(0.1, 10), oscillator.frequency);

        // LFO Routing
        var pitchAmount = new Tone.Multiply(0);
        var filterAmount = new Tone.Multiply(0);
        oscillator.fan(pitchAmount, filterAmount);

        pitchAmount.connect(pitchMod);
        filterAmount.connect(filterMod);

        return {
            type: function(newType) { oscillator.type = newType; },
            rate: rate,
            pitchAmount: pitchAmount,
            filterAmount: filterAmount
        };
    }

    Tone.extend(Synth.Instrument, Tone.Monophonic);

    Synth.Instrument.prototype._triggerEnvelopeAttack = function(time, velocity){
        this.amplifier.envelope.triggerAttack(time, velocity);
        return this;
    };
    Synth.Instrument.prototype._triggerEnvelopeRelease = function(time){
        this.amplifier.envelope.triggerRelease(time);
        return this;
    };
})();
