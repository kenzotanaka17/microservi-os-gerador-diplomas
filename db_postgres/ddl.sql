CREATE TABLE IF NOT EXISTS certificados (
    id SERIAL PRIMARY KEY,
    nome_aluno VARCHAR(100) NOT NULL,
    nacionalidade VARCHAR(50),
    naturalidade VARCHAR(50),
    data_nascimento VARCHAR(100),
    numero_rg VARCHAR(20),
    data_conclusao VARCHAR(100),
    nome_curso VARCHAR(100),
    carga_horaria VARCHAR(100),
    data_emissao VARCHAR(100),
    cargo VARCHAR(100),
    nome_assinatura VARCHAR(100),
    caminho_diploma VARCHAR(100)
);