const log = (message, user) => {
    const options = {
        timeZone: 'America/Sao_Paulo', // Fuso horário do Brasil
        hour12: false, // Usar formato de 24 horas
    };

    const timestamp = new Date().toLocaleString('en-US', options);
    console.log(`[${timestamp}]: ${user} -> ${message}`);
};

module.exports = log;
