require('dotenv').config();

const SERVER_URL = `http://localhost:${process.env.PORT || 3000}`;
const SERVER_URL_DEVICES = `http://localhost:${process.env.PORT || 3000}/devices/me`;

const fetchPhyphox = async () => {
    try{
        const response = await fetch(`${process.env.REMOTE_ACCESS}/get?dB`);
        if (!response.ok) {
            throw new Error(`HTTP error ! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.buffer.dB.buffer[0];

    } catch (err){
            console.error('Échec de la récupération des mesures depuis Phyphox !', err.message);
    }
}

const myLocation = async () => {
    try{
        const response = await fetch(SERVER_URL_DEVICES, {headers: {'x-api-key': process.env.API_KEY}})
        if (!response.ok) {
            throw new Error(`HTTP error ! Status: ${response.status}`);
        }
        const json = await response.json();
        return json.data.location;
    } catch (err) {
        console.error('Échec de la récupération de la localisation à partir de la route /devices/me')
    }
}



const startMeasurement = async () => {
    console.log("Démarrage de l'envoie des mesures.");

    const location = await myLocation();
    const configResponse = await fetch(`${process.env.REMOTE_ACCESS}/config`);
    const config = await configResponse.json();
    const type = config.title;

    setInterval(async () => {
        const value = parseFloat( await fetchPhyphox().toFixed(2) ); // On prend que 2 decimal

        const data = {
            type: type,
            value,
            location,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`${SERVER_URL}/measurements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.API_KEY
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error ! Status: ${response.status}`);
            }

            const resultat = await response.json();
            console.log('Mesure envoyée :', resultat);
        } catch (err) {
            console.error("Attention ! Échec de l'envoie de mesures.", err.message);
        }
    }, 5000);
}

startMeasurement();
