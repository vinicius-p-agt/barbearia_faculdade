const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve arquivos estáticos (CSS, JS, imagens, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do banco de dados MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "barbearia"
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err);
    } else {
        console.log("Conectado ao MySQL");
    }
});

// Rota principal para servir o HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Rota para salvar o agendamento no banco de dados
app.post("/agendamento", (req, res) => {
    const { nome_cliente, telefone, data, hora, servico, valor, barba } = req.body;

    console.log("Dados recebidos:", req.body); // Log detalhado dos dados

    if (!nome_cliente || !telefone || !data || !hora || !servico) {
        return res.status(400).json({ mensagem: "Preencha todos os campos obrigatórios." });
    }

    // Calcula o valor total (serviço + barba)
    const valorServico = parseFloat(valor) || 0;
    const valorBarba = barba === 'Sim' ? 25 : 0;
    const valorTotal = valorServico + valorBarba;

    // Transforma incluir_barba em 1 ou 0
    const incluirBarba = barba === 'Sim' ? 1 : 0;

    // Primeiro, verifique se o cliente já existe
    const checkClienteSQL = "SELECT id, nome FROM clientes WHERE telefone = ?";
    
    db.query(checkClienteSQL, [telefone], (err, results) => {
        if (err) {
            console.error("Erro ao verificar cliente:", err);
            return res.status(500).json({ mensagem: "Erro ao verificar cliente." });
        }
        
        let clienteId;
        
        // Se o cliente não existe, crie um novo
        if (results.length === 0) {
            const insertClienteSQL = "INSERT INTO clientes (nome, telefone) VALUES (?, ?)";
            
            db.query(insertClienteSQL, [nome_cliente, telefone], (err, result) => {
                if (err) {
                    console.error("Erro ao criar cliente:", err);
                    return res.status(500).json({ mensagem: "Erro ao criar novo cliente." });
                }
                
                clienteId = result.insertId;
                console.log("Novo cliente criado com ID:", clienteId);
                inserirAgendamento(clienteId);
            });
        } else {
            // Cliente já existe
            clienteId = results[0].id;
            const nomeExistente = results[0].nome;
            
            // Verifica se o nome atual é diferente do nome no banco de dados
            if (nomeExistente !== nome_cliente) {
                // Atualiza o nome do cliente
                const updateClienteSQL = "UPDATE clientes SET nome = ? WHERE id = ?";
                
                db.query(updateClienteSQL, [nome_cliente, clienteId], (err, result) => {
                    if (err) {
                        console.error("Erro ao atualizar cliente:", err);
                    } else {
                        console.log("Nome do cliente atualizado:", nome_cliente);
                    }
                    
                    inserirAgendamento(clienteId);
                });
            } else {
                // Nome igual, apenas continua com o agendamento
                console.log("Cliente existente encontrado com ID:", clienteId);
                inserirAgendamento(clienteId);
            }
        }
    });
    
    // Função para inserir o agendamento após lidar com o cliente
    function inserirAgendamento(clienteId) {
        console.log("Inserindo agendamento para cliente_id:", clienteId);
        console.log("Dados do agendamento:", { 
            clienteId, 
            data, 
            hora, 
            servico, 
            valorTotal, 
            incluirBarba,
            nome_cliente,
            telefone
        });
        
        const sql = `
            INSERT INTO agendamentos 
            (cliente_id, data, hora, servico, valor_total, incluir_barba, nome_cliente, telefone) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const valores = [
            clienteId, 
            data, 
            hora, 
            servico, 
            valorTotal, 
            incluirBarba, 
            nome_cliente,
            telefone
        ];
        
        db.query(sql, valores, (err, result) => {
            if (err) {
                console.error("Erro ao salvar agendamento:", err);
                return res.status(500).json({ 
                    mensagem: "Erro ao salvar o agendamento.", 
                    detalhes: err 
                });
            }
            res.json({ mensagem: "Agendamento salvo com sucesso!" });
        });
    }
});

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});