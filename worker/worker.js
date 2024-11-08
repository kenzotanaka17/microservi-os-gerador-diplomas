const amqp = require('amqplib');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

const RABBITMQ_URL = 'amqp://rabbitmq';
const QUEUE = 'diplomasQueue';

async function generatePDF(data) {
  console.log('Iniciando a geração do PDF...');

  const templatePath = path.join(__dirname, 'template.html');
  console.log('Carregando template HTML de:', templatePath);
  let html = fs.readFileSync(templatePath, 'utf-8');

  console.log('Substituindo variáveis no template...');
  html = html.replace(/\[\[nome\]\]/g, data.nome_aluno)
             .replace(/\[\[nacionalidade\]\]/g, data.nacionalidade)
             .replace(/\[\[estado\]\]/g, data.naturalidade)
             .replace(/\[\[data_nascimento\]\]/g, data.data_nascimento)
             .replace(/\[\[documento\]\]/g, data.numero_rg)
             .replace(/\[\[data_conclusao\]\]/g, data.data_conclusao)
             .replace(/\[\[curso\]\]/g, data.nome_curso)
             .replace(/\[\[carga_horaria\]\]/g, data.carga_horaria)
             .replace(/\[\[data_emissao\]\]/g, data.data_emissao)
             .replace(/\[\[cargo\]\]/g, data.cargo)
             .replace(/\[\[nome_assinatura\]\]/g, data.nome_assinatura);

  console.log('Variáveis substituídas com sucesso.');

  try {
      console.log('Abrindo o navegador Puppeteer...');
      const browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          timeout: 120000
      });

      const page = await browser.newPage();
      console.log('Página criada, carregando conteúdo HTML...');
      await page.setContent(html, { waitUntil: 'load' });

      console.log('Conteúdo HTML carregado, gerando PDF...');
      const pdfPath = path.join(__dirname, `diploma_${data.nome_aluno}.pdf`);
      await page.pdf({ path: pdfPath, format: 'A4', timeout: 60000 });

      console.log(`PDF gerado com sucesso: ${pdfPath}`);
      await browser.close();
  } catch (error) {
      console.error('Erro ao gerar o PDF:', error);
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
