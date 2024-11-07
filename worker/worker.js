const { Client } = require('pg');
const amqp = require('amqplib');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

// Configuração do PostgreSQL
const connection = new Client({
  user: 'admin',
  password: 'root',
  host: 'postgres',
  database: 'gerador_diplomas'
});

// Conexão ao PostgreSQL
setTimeout(() => {
  connection.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      return;
    }
    console.log('Conectado ao Postgres no worker');
  });
}, 3000);

// Função para gerar o PDF
async function generatePDF(data) {
  const templatePath = path.join(__dirname, 'template.html');
  let html = fs.readFileSync(templatePath, 'utf-8');

  html = html.replace('[[nome]]', data.nome_aluno)
              .replace('[[nacionalidade]]', data.nacionalidade)
              .replace('[[estado]]', data.naturalidade)
              .replace('[[data_nascimento]]', data.data_nascimento)
              .replace('[[documento]]', data.numero_rg)
              .replace('[[data_conclusao]]', data.data_conclusao)
              .replace('[[curso]]', data.nome_curso)
              .replace('[[carga_horaria]]', data.carga_horaria)
              .replace('[[data_emissao]]', data.data_emissao)
              .replace('[[nome_assinatura]]', data.assinaturas[0].nome)
              .replace('[[cargo]]', data.assinaturas[0].cargo);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  
  const pdfPath = path.join(__dirname, `diploma_${data.id}.pdf`);
  await page.pdf({ path: pdfPath, format: 'A4', landscape: true });
  await browser.close();

  console.log('PDF gerado com sucesso:', pdfPath);
  return pdfPath;
}

// Função para consumir a fila do RabbitMQ
async function consumeQueue() {
  try {
    // Conexão ao RabbitMQ
    const connectionRabbitMQ = await amqp.connect('amqp://rabbitmq');
    const channel = await connectionRabbitMQ.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    console.log('Aguardando mensagens na fila...');

    channel.consume(queue, async (msg) => {
      const message = JSON.parse(msg.content.toString());
      console.log('Mensagem recebida:', message);

      try {
        // Geração do PDF e atualização no banco de dados
        const pdfPath = await generatePDF(message);
        const updateQuery = 'UPDATE certificados SET template_diploma = $1 WHERE id = $2';
        connection.query(updateQuery, [pdfPath, message.id], (err) => {
          if (err) {
            console.error('Erro ao atualizar o banco de dados:', err);
            return;
          }
          console.log('Banco de dados atualizado com sucesso.');
        });
      } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
      }

      channel.ack(msg);
    });

  } catch (error) {
    console.error("Erro ao consumir a fila RabbitMQ:", error);
    setTimeout(consumeQueue, 5000); // Tenta reconectar após 5 segundos em caso de erro
  }
}

// Inicia o consumo da fila
consumeQueue();
