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

async function sendToQueue(message) {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

    console.log("Mensagem enviada para fila:", message);
  } catch (error) {
    console.error("Erro ao enviar mensagem para fila:", error);
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
    assinaturas,
    template_diploma
  } = req.body;

  const query = `
  INSERT INTO certificados 
  (nome_aluno, nacionalidade, naturalidade, data_nascimento, numero_rg, data_conclusao, nome_curso, carga_horaria, data_emissao, template_diploma) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
`;
connection.query(query, [
  nome_aluno,
  nacionalidade,
  naturalidade,
  data_nascimento,
  numero_rg,
  data_conclusao,
  nome_curso,
  carga_horaria,
  data_emissao,
  template_diploma
  ], (err, result) => {
    if (err) {
      console.error("Erro ao salvar no postgreSQL:", err);
      return res.status(500).send('Erro ao salvar no banco de dados.');
    }

    assinaturas.forEach(({ cargo, nome }) => {
      const queryAssinatura = `INSERT INTO assinaturas (diploma_id, cargo, nome) VALUES (?, ?, ?)`;
      connection.query(queryAssinatura, [result.insertId, cargo, nome], (err) => {
        if (err) console.error("Erro ao salvar assinatura:", err);
      });
    });

    sendToQueue(req.body);

    res.status(200).send('Dados recebidos e processados com sucesso.');
  });
});

app.get('/', (req, res) => {
  res.send('API de geração de certificados está funcionando.');
});

app.get('/diploma', async (req, res) => {
  try {
    const certificadosQuery = `
      SELECT c.id, c.nome_aluno, c.nacionalidade, c.naturalidade, c.data_nascimento, 
             c.numero_rg, c.data_conclusao, c.nome_curso, c.carga_horaria, 
             c.data_emissao, c.template_diploma, a.cargo, a.nome as assinatura_nome
      FROM certificados c
      LEFT JOIN assinaturas a ON c.id = a.diploma_id
    `;
    connection.query(certificadosQuery, (err, results) => {
      if (err) {
        console.error("Erro ao buscar certificados:", err);
        return res.status(500).send('Erro ao buscar certificados.');
      }
      const certificados = results.reduce((acc, row) => {
        let certificado = acc.find(c => c.id === row.id);
        
        if (!certificado) {
          certificado = {
            id: row.id,
            nome_aluno: row.nome_aluno,
            nacionalidade: row.nacionalidade,
            naturalidade: row.naturalidade,
            data_nascimento: row.data_nascimento,
            numero_rg: row.numero_rg,
            data_conclusao: row.data_conclusao,
            nome_curso: row.nome_curso,
            carga_horaria: row.carga_horaria,
            data_emissao: row.data_emissao,
            template_diploma: row.template_diploma,
            assinaturas: []
          };
          acc.push(certificado);
        }

        if (row.assinatura_nome && row.cargo) {
          certificado.assinaturas.push({
            nome: row.assinatura_nome,
            cargo: row.cargo
          });
        }

        return acc;
      }, []);

      res.json(certificados);
    });
  } catch (error) {
    console.error("Erro ao processar a requisição GET:", error);
    res.status(500).send('Erro interno do servidor.');
  }
});

app.get('/ping', (req, res) => {
  res.send('API está funcionando!');
});


const PORT = 3000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
