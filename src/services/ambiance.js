const FRESHNESS_THRESHOLD_MINUTES = 60;

const SCALE = {
    unit: 'dB',
    calm: 'moins de 40 dB',
    moderate: 'de 40 a 69 dB',
    animated: '70 dB et plus'
};

// Meme echelle que SCALE mais avec des bornes numeriques (null = pas de borne).
// Le client s'en sert pour dessiner les zones du graphe sans refaire le calcul des seuils.
const SCALE_BANDS = [
    { code: 'calm', label: 'Calme', min: null, max: 40 },
    { code: 'moderate', label: 'Modéré', min: 40, max: 70 },
    { code: 'animated', label: 'Animé', min: 70, max: null }
];

const CLASSIFICATIONS = {
    calm: {
        code: 'calm',
        label: 'Calme',
        description: 'Le niveau sonore permet généralement de se concentrer ou de discuter doucement.'
    },
    moderate: {
        code: 'moderate',
        label: 'Modéré',
        description: 'Le lieu présente une activité sonore perceptible, sans être particulièrement bruyant.'
    },
    animated: {
        code: 'animated',
        label: 'Animé',
        description: 'Le niveau sonore est élevé et le lieu peut être moins adapté à une activité calme.'
    }
};

function getClassificationCode(value) {
    if (value < 40) {
        return 'calm';
    }
    if (value < 70) {
        return 'moderate';
    }
    return 'animated';
}

function classifyAmbiance(value, timestamp, now = new Date()) {
    const code = getClassificationCode(value);
    const measurementDate = new Date(timestamp);
    const ageMinutes = (now.getTime() - measurementDate.getTime()) / 60000;

    return {
        ...CLASSIFICATIONS[code],
        scale: SCALE,
        isRecent: ageMinutes >= 0 && ageMinutes <= FRESHNESS_THRESHOLD_MINUTES,
        freshnessThresholdMinutes: FRESHNESS_THRESHOLD_MINUTES
    };
}

function getLegacyStatus(value) {
    return {
        calm: 'quiet',
        moderate: 'moderate',
        animated: 'noisy'
    }[getClassificationCode(value)];
}

function summarizeObservations(observations) {
    const countValues = (items, key) => items.reduce((counts, item) => {
        counts[item[key]] = (counts[item[key]] || 0) + 1;
        return counts;
    }, {});
    const dominant = (counts) => Object.keys(counts).reduce((first, second) => (
        counts[first] > counts[second] ? first : second
    ));

    return {
        dominantVibe: dominant(countValues(observations, 'vibe')),
        dominantProximity: dominant(countValues(observations, 'proximity')),
        lastNote: observations[0].notes
    };
}

module.exports = {
    classifyAmbiance,
    getLegacyStatus,
    summarizeObservations,
    FRESHNESS_THRESHOLD_MINUTES,
    SCALE,
    SCALE_BANDS
};
