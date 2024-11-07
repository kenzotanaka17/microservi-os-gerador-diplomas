const express = require('express');
const { Client } = require('pg');
const amqp = require('amqplib');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const connection = new Client({
  user: 'admin',
  password: 'root',
  host: 'postgres',
  port: '5432',
  database: 'gerador_diplomas'
});

async function sendMessage(data) {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true
    });

    console.log('Mensagem enviada para a fila');
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Erro ao enviar mensagem para a fila:', error);
  }
}

app.post('/diploma', async (req, res) => {
  const {
    nome_aluno,
    nacionalidade,
    naturalidade,
    data_nascimento,
    numero_rg,
    data_conclusao,
    nome_curso,
    carga_horaria,
    data_emissao,
    cargo, 
    nome_assinatura,
    template_diploma
  } = req.body;

  if (!req.body) {
    return res.status(400).send("Requisição vazia");
  }

  const query = `
  INSERT INTO certificados 
  (nome_aluno, nacionalidade, naturalidade, data_nascimento, numero_rg, data_conclusao, nome_curso, carga_horaria, data_emissao, cargo, nome_assinatura, template_diploma) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
`;

try {
  await connection.connect();
  await connection.query(query, [
    nome_aluno,
    nacionalidade,
    naturalidade,
    data_nascimento,
    numero_rg,
    data_conclusao,
    nome_curso,
    carga_horaria,
    data_emissao,
    cargo, 
    nome_assinatura,
    template_diploma
  ]);

  await sendMessage(req.body);

  await connection.end();

  res.status(201).send("Certificado criado com sucesso");
} catch (err) {
  console.log("Erro ao criar o certificado", err);
  await connection.end();
}

});

app.get('/', (req, res) => {
  res.send('API de geração de certificados está funcionando.');
});

const PORT = 3000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
