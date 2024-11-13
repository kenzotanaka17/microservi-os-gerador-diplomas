# Gerador de diplomas

Este projeto utiliza o Docker para facilitar a configuração e o ambiente de execução. Siga as instruções abaixo para rodar o projeto localmente com Docker.

## Requisitos

Antes de começar, certifique-se de ter o Docker instalado na sua máquina.

- [Instalar Docker](https://docs.docker.com/get-docker/)

## Rodando o projeto com Docker

### Passo 1: Clonar o repositório

Primeiro, clone o repositório para o seu ambiente local:

```shell
git clone https://github.com/kenzotanaka17/microservi-os-gerador-diplomas.git
```

Depois, entre na pasta do projeto, e rode o comando:

```shell
docker-compose up --build
```

Depois de verificar no docker desktop que todos os serviços estão rodando, abra no navegador a localhost do banco de dados:

- [localhost](http://localhost:5050)

Faça o login utilizando as credenciais:
```shell
user@user.com 
1234
```

Depois, crie um servidor postgres, com as seguintes credenciais:
```shell
hostname: postgres
port: 5432
maintenance database: gerador_diplomas
username: admin
password: root
```

Depois, abra o postman para enviar uma requisição e testar o projeto:

- [Site do Postman](https://www.postman.com)

Envie uma requisição POST com a seguinte estrutura JSON:

```json
{
  "nome_aluno": "Giulia Artoni",
  "nacionalidade": "Brasileira",
  "naturalidade": "São Paulo",
  "data_nascimento": "20-01-2003",
  "numero_rg": "123456789",
  "data_conclusao": "25-12-2025",
  "nome_curso": "Sistemas de informação",
  "carga_horaria": "360",
  "data_emissao": "13-11-2024",
  "cargo": "Coordenador Acadêmico",
  "nome_assinatura": "José Romualdo",
  "template_diploma": "..."
}
```

A resposta da requisição deve ser:

`Certificado criado com sucesso`

# Como encontrar os PDFs

Os pdfs estarão disponíveis na pasta diplomas, que pode ser encontrada dentro do diretório worker.
