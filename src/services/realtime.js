/*
Bonus temps reel (SSE).
On garde en memoire la liste des clients connectes au flux /ambiance/stream.
Quand une nouvelle mesure arrive, on leur pousse l'ambiance directement :
le navigateur n'a plus besoin de rappeler l'API en boucle.
 */

const clients = new Set();

function addClient(res, location) {
    const client = { res, location: location || null };
    clients.add(client);
    return client;
}

function removeClient(client) {
    clients.delete(client);
}

/*
Envoie l'evenement aux clients concernes : ceux qui suivent ce lieu
precisement, et ceux qui se sont abonnes sans preciser de lieu (tous).
 */
function publishAmbiance(event) {
    const payload = `event: ambiance\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) {
        if (client.location === null || client.location === event.location) {
            client.res.write(payload);
        }
    }
}

function clientCount() {
    return clients.size;
}

module.exports = {
    addClient,
    removeClient,
    publishAmbiance,
    clientCount
};
