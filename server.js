const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Claves de configuración de tu aplicación de Meta
const TOKEN_DE_ACCESO = "EAAdzFrUZCZAVQBSeffbZC7ckZCmvMKb7BXvNfkQ3zvfh5W5RlsSpm5ZBfxbT2EoiCtO9ZAxCqt5ZAgqhwbw29uXqKzGi4eZCFUb8dQTQCoehwzoa6jRRIITqidfpTQ4GcHwz37ZBFyHd7lMn6i0EFTrYAjq6jt20WMSQCDpEyi9i0xU2fr8icKZBMc2DseDKZApuBAa4jjiR4zTcZC0SIlSl3qXySeMuQdWvjZCPLiZCf3czk4iTELlTC6blCZBQY80ntJ0uxwYIaNbIqRATWHjPtDZARza7";
const ID_TELEFONO_BUSINESS = "1378623791993907";
const TOKEN_VERIFICACION_WEBHOOK = "WasapBot"; // Tú inventas esta palabra

/**
 * 1. PASO DE VALIDACIÓN: Canal requerido por Meta para verificar tu servidor.
 * Se ejecuta automáticamente la primera vez que enlazas el webhook en su panel.
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === TOKEN_VERIFICACION_WEBHOOK) {
            console.log('✅ Webhook verificado correctamente con Meta.');
            return res.status(200).send(challenge);
        } else {
            return res.status(403).sendStatus(403);
        }
    }
});

/**
 * 2. PASO DE RECEPCIÓN Y RESPUESTA: Aquí llegan los chats de los usuarios.
 */
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        // Comprobamos si el JSON entrante contiene la estructura de un mensaje de WhatsApp
        if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            
            const mensajeOriginal = body.entry[0].changes[0].value.messages[0];
            const telefonoCliente = mensajeOriginal.from; // Número de quien escribe
            const tipoMensaje = mensajeOriginal.type;

            if (tipoMensaje === 'text') {
                const textoUsuario = mensajeOriginal.text.body;
                console.log(`💬 Mensaje recibido de [${telefonoCliente}]: ${textoUsuario}`);

                // Lógica del asistente (Ejemplo básico de respuesta automática)
                let respuestaBot = "¡Hola! Soy tu asistente automatizado. ¿En qué te puedo ayudar hoy?";
                
                if (textoUsuario.toLowerCase().includes('precio')) {
                    respuestaBot = "Nuestros servicios de desarrollo de software inician desde los $500 USD.";
                }

                // Enviar la respuesta de vuelta a WhatsApp mediante la API de Meta
                await enviarMensajeWhatsApp(telefonoCliente, respuestaBot);
            }
        }

        // Siempre responder 200 OK a Meta inmediatamente para evitar reintentos de envío
        res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('❌ Error procesando el mensaje:', error.message);
        res.status(200).send('EVENT_RECEIVED'); // Mantenemos 200 para que Meta no sature el servidor
    }
});

/**
 * Función auxiliar para estructurar la petición POST hacia la Cloud API de WhatsApp
 */
async function enviarMensajeWhatsApp(telefonoDestino, textoRespuesta) {
    const urlAPI = `https://graph.facebook.com/v25.0/1061287516789190/messages`;// la linea original es "const urlAPI = `https://facebook.com{1061287516789190}/messages`;"
    
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: telefonoDestino,
        type: "text",
        text: {
            preview_url: false,
            body: textoRespuesta
        }
    };

    await axios.post(urlAPI, payload, {
        headers: {
            'Authorization': `Bearer ${TOKEN_DE_ACCESO}`,
            'Content-Type': 'application/json'
        }
    });
    console.log(`🚀 Respuesta enviada con éxito a [${telefonoDestino}]`);
}

// Inicializar el puerto del servidor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => console.log(`🚀 Servidor listo escuchando en el puerto ${PUERTO}`));
