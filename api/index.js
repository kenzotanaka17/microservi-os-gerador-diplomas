const express = require('express');
const { Pool } = require('pg');
const amqp = require('amqplib');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
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
    nome_assinatura
  } = req.body;

  if (!req.body) {
    return res.status(400).send("Requisição vazia");
  }

  const caminho_diploma = `worker/diplomas/diploma_${nome_aluno}.pdf`

  const query = `
    INSERT INTO certificados 
    (nome_aluno, nacionalidade, naturalidade, data_nascimento, numero_rg, data_conclusao, nome_curso, carga_horaria, data_emissao, cargo, nome_assinatura, caminho_diploma) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;

  try {
    const client = await pool.connect();
    await client.query(query, [
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
      caminho_diploma
    ]);

    await sendMessage(req.body);

    client.release();

    res.status(201).send("Certificado criado com sucesso");
  } catch (err) {
    console.log("Erro ao criar o certificado", err);
    res.status(500).send("Erro ao criar o certificado");
  }
});

app.get('/', (req, res) => {
  res.send('API de geração de certificados está funcionando.');
});

const PORT = 3000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
