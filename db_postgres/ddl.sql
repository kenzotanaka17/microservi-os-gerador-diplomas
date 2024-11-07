CREATE TABLE IF NOT EXISTS certificados (
    id SERIAL PRIMARY KEY,
    nome_aluno VARCHAR(100) NOT NULL,
    nacionalidade VARCHAR(50),
    naturalidade VARCHAR(50),
    data_nascimento DATE,
    numero_rg VARCHAR(20),
    data_conclusao DATE,
    nome_curso VARCHAR(100),
    carga_horaria INT,
    data_emissao DATE,
    template_diploma BYTEA
);

CREATE TABLE IF NOT EXISTS assinaturas (
    id SERIAL PRIMARY KEY,
    diploma_id INT REFERENCES certificados(id),
    cargo VARCHAR(50),
    nome VARCHAR(100)
);

INSERT INTO certificados (nome_aluno, nacionalidade, naturalidade, data_nascimento, numero_rg, data_conclusao, nome_curso, carga_horaria, data_emissao, template_diploma)
VALUES
('João Silva', 'Brasileiro', 'São Paulo', '1990-01-01', '12345678', '2024-10-10', 'Engenharia de Software', 300, '2024-10-15', NULL);

INSERT INTO assinaturas (diploma_id, cargo, nome)
VALUES
(1, 'Diretor', 'Carlos Almeida'),
(1, 'Coordenador', 'Maria Souza');
