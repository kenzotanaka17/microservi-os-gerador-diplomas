const amqp = require('amqplib');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

const RABBITMQ_URL = 'amqp://rabbitmq';
const QUEUE = 'diplomasQueue';

async function generatePDF(data) {
  try {
      const templatePath = path.join(__dirname, 'template.html');
      if (!fs.existsSync(templatePath)) {
          throw new Error(`Template não encontrado em ${templatePath}`);
      }
      let html = fs.readFileSync(templatePath, 'utf-8');

      html = html.replace(/{{nome_aluno}}/g, data.nome_aluno)
                 .replace(/{{nacionalidade}}/g, data.nacionalidade)
                 .replace(/{{naturalidade}}/g, data.naturalidade)
                 .replace(/{{data_nascimento}}/g, data.data_nascimento)
                 .replace(/{{numero_rg}}/g, data.numero_rg)
                 .replace(/{{data_conclusao}}/g, data.data_conclusao)
                 .replace(/{{nome_curso}}/g, data.nome_curso)
                 .replace(/{{carga_horaria}}/g, data.carga_horaria)
                 .replace(/{{data_emissao}}/g, data.data_emissao)
                 .replace(/{{cargo}}/g, data.cargo)
                 .replace(/{{nome_assinatura}}/g, data.nome_assinatura);

      console.log("HTML template carregado e variáveis substituídas.");

      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(__dirname, `diploma_${data.nome_aluno || 'aluno'}.pdf`);

      await page.pdf({ path: pdfPath, format: 'A4' });
      await browser.close();

      console.log(`PDF gerado para ${data.nome_aluno || 'aluno'}: ${pdfPath}`);
  } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
  }
}

async function connectToRabbitMQ() {
    let connection;
    let channel;
    let attempt = 0;
    const maxAttempts = 5;
    const delay = 5000;

    while (attempt < maxAttempts) {
        try {
            console.log(`Tentativa de conexão ao RabbitMQ, tentativa ${attempt + 1}/${maxAttempts}...`);
            connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            await channel.assertQueue(QUEUE, { durable: true });
            console.log(`Conectado ao RabbitMQ e fila ${QUEUE} pronta`);
            return channel;
        } catch (error) {
            console.error(`Erro ao tentar conectar ao RabbitMQ: ${error.message}`);
            attempt++;
            if (attempt < maxAttempts) {
                console.log(`Tentando novamente em ${delay / 1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error('Falha ao conectar ao RabbitMQ após várias tentativas');
}

async function start() {
    try {
        const channel = await connectToRabbitMQ();
        
        console.log(`Aguardando mensagens na fila: ${QUEUE}`);
        channel.consume(QUEUE, async (message) => {
            if (message !== null) {
                const data = JSON.parse(message.content.toString());
                console.log("Mensagem recebida:", data);

                await generatePDF(data);

                channel.ack(message);
            }
        });
    } catch (error) {
        console.error('Erro ao iniciar o worker:', error);
    }
}

setTimeout(start, 3000);
