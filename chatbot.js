console.log("🔄 Iniciando o bot...");

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

console.log("✅ Módulos carregados.");

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, 'session') })
});

console.log("📡 Cliente configurado.");

const conversas = {};
const adminNumber = "seu-número-aqui@c.us"; // Altere para o número do admin

client.on('qr', qr => {
    console.log("📷 QR Code recebido. Aguarde escaneamento...");
    qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Carregando WhatsApp (${percent}%): ${message}`);
});

client.on('authenticated', () => {
    console.log("🔑 Autenticado com sucesso!");
});

client.on('auth_failure', msg => {
    console.error("❌ Falha na autenticação:", msg);
});

client.on('ready', () => {
    console.log('🚀 Tudo certo! WhatsApp conectado.');
});

client.on('disconnected', (reason) => {
    console.error(`⚠️ Desconectado: ${reason}`);
});

client.on('message', async msg => {
    console.log(`📩 Mensagem recebida de ${msg.from}: ${msg.body}`);
    
    const contact = await msg.getContact();
    const name = contact.pushname ? contact.pushname.split(" ")[0] : 'Cliente';

    // Mensagem de boas-vindas
    if (/\b(oi|oii|oiii|oiiii|olá|ola|oie|oiee|hello|hi|hey|salve|opa|oba|aoba|ei|eae|e aí|e ai|iai|iaê|pedro|pedrao|pedrão|boa|boa noite|boa tarde|bom dia|noite|tarde|dia|beleza|beleza?|tudo bem|tudo bem?|como vai|como vai?|firmeza|firmeza?|tranquilo|de boa|de boas|tudo certo|tudo ok|quero|quero pedir|quero fazer um pedido|quero ver o cardápio|quero fazer um lanche|quero comer|quero burger|quero hambúrguer|gostaria|gostaria de pedir|gostaria de ver o menu|gostaria de um lanche|me manda o menu|me manda o cardápio|me envia o cardápio|me mostra o menu|me mostra o cardápio|qual o cardápio?|o que tem pra hoje?|o que vocês vendem?|o que tem?|qual o menu?|qual o lanche?|tem cardápio?|por favor|por favor, me manda o cardápio|por favor, quero pedir|olá! Tenho interesse e queria mais informações,por favor.|fala|fala aí|fala comigo|fala, Pedro|fala chefia|quero ver o menu|quero ver o catálogo|menu|cardápio|catálogo|tabela|lista de lanches|lista de produtos|tem hambúrguer?|vende hambúrguer?|tem burger?|tem lanche?|quero lanche|pedido|fazer pedido|realizar pedido|iniciar pedido|começar pedido|abrir pedido|posso pedir?|pode me mostrar o cardápio?|pode mandar o menu?|manda o que tem aí|manda o que vende|manda o cardápio|manda as opções|manda as promoções|quais opções?|quais os lanches?|quais os burgers?|quais os sabores?|lanche do dia|especial do dia|promoção do dia|tem promoção?|qual promoção?|promoções|ofertas|tem oferta?|quero promo|quero promoção|tô com fome|estou com fome|cheguei pra pedir|cheguei com fome|cheguei|me atende|me ajuda|me ajuda com o pedido|me ajuda aí|preciso pedir|quero comprar|comprar lanche|comprar hambúrguer|vender lanche|tô afim de pedir|bora pedir|vou querer um|vou querer fazer pedido|me mostra o que tem|me mostra o que vende|manda o lanche|lanche|burguer|burger|hamburguer|hambúrguer|tô afim|só de boas|eae, tudo certo?|opa, quero pedir|fala aí, quero pedir|manda aí)\b/i.test(msg.body) && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        if (chat.isGroup) return;

        if (checkConversationAlreadyStarted(chat)) return;

        console.log("👋 Enviando mensagem de boas-vindas.");
        const welcomeMessage = `👋 E aí, ${name}! Tudo certo por aí?
Seja muito bem-vindo(a) à Outsider Burguer, a hamburgueria mais viajada e saborosa do pedaço! 🌍🍔✈️

Aqui a gente não faz hambúrguer comum, não… a gente cria verdadeiras experiências gastronômicas inspiradas nos sabores mais marcantes do mundo! 🌎✨

🌍 O nosso cardápio é uma volta ao mundo em forma de burger 

📲 Dá uma olhadinha no nosso cardápio completo e já escolhe seu destino gastronômico de hoje:
👉 Clique aqui pra ver o cardápio completo (https://drive.google.com/file/d/16x0W83xhQ4b3tfP358JFXA9-VtFfynq6/view?usp=sharing)

E ó… depois que escolher o lanche, me dá um toque que eu já te ajudo a completar com uma bebida geladinha pra fechar com chave de ouro 🧊🍻

Bora nessa viagem de sabores? Me chama que eu tô aqui pra anotar tudo! 💬🔥`;

        await chat.sendMessage(welcomeMessage);
        await chat.sendStateTyping();

        const enderecoMessage = "Para agilizar nosso processo, poderia nos informar o endereço para entrega?";
        await chat.sendMessage(enderecoMessage);

        conversas[chat.id.user] = new Date().getTime();
        return;
    }

    // Enviar chave Pix
    if (/pix/i.test(msg.body)) {
        const chat = await msg.getChat();
        if (chat.isGroup) return;

        await chat.sendMessage("🔹 Nossa chave Pix é: *19989535084* \n\nApós o pagamento, envie o comprovante aqui. 📩");
        return;
    }

    // Pedido saiu para entrega
    if (/seu pedido saiu para entrega/i.test(msg.body) && msg.from === adminNumber) {
        console.log("🛵 Admin informou que o pedido saiu para entrega.");

        if (!msg.hasQuotedMsg) {
            console.log("⚠️ Nenhuma mensagem foi respondida pelo admin.");
            return;
        }

        const quotedMsg = await msg.getQuotedMessage();
        const target = quotedMsg.from;

        if (!target || target === adminNumber) {
            console.log("⚠️ Mensagem respondida não é de um cliente.");
            return;
        }

        const contact = await quotedMsg.getContact();
        const name = contact.pushname ? contact.pushname.split(" ")[0] : 'Cliente';

        await client.sendMessage(target, "🚚 Show! O pedido está a caminho! Em breve estará aí com você. 😋");

        const agradecimento = `🙏 Esperamos que tenha curtido o lanche, ${name}! 😄

Se puder, marca a gente no Insta com aquela foto caprichada do seu pedido 📸🍔
👉 *@burgueroutsider*

E já aproveita pra seguir a gente e ficar por dentro das novidades! Valeu por embarcar nessa viagem de sabores com a gente! 🌍🍟`;

        await client.sendMessage(target, agradecimento);
        console.log("💬 Agradecimento enviado.");
    }
});

// Função para checar se a conversa já iniciou nas últimas 12 horas
function checkConversationAlreadyStarted(chat) {
    const userNumber = chat.id.user;
    const twelveHours = 12 * 60 * 60 * 1000;
    const now = new Date().getTime();

    if (conversas[userNumber]) {
        if (now - conversas[userNumber] < twelveHours) {
            return true;
        } else {
            delete conversas[userNumber];
            return false;
        }
    }
    return false;
}

client.initialize();
console.log("🔥 Bot iniciado!");

