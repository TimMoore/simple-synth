var Synth = {};

document.addEventListener("DOMContentLoaded", function(event) {
    "use strict";

    window.synth = new Synth.Instrument().toMaster();
    Synth.UI(window.synth);

    // iOS support
    StartAudioContext(Tone.context, '#piano *');
});
