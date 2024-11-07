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
    template_diploma VARCHAR(100)
);

INSERT INTO certificados (nome_aluno, nacionalidade, naturalidade, data_nascimento, numero_rg, data_conclusao, nome_curso, carga_horaria, data_emissao, cargo, nome_assinatura, template_diploma)
VALUES
('João Silva', 'Brasileiro', 'São Paulo', '1990-01-01', '12345678', '2024-10-10', 'Engenharia de Software', 300, '2024-10-15', 'Diretor', 'José Romualdo', 'asdsadadad');

