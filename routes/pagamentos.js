var logger = require('../servicos/logger.js');
module.exports = function(app){

    //ROTA DE TESTES.
    app.get('/pagamentos', function(req, res){
        res.send('Achou miseravisss');
    });

    //ROTA PARA CONSULTAR PAGAMENTOS.
    app.get('/pagamentos/pagamento/:id', function(req, res){
        var id = req.params.id;
        console.log('consultando pagamento: ' + id);

        logger.info('consultando pagamento: ' + id);

        //IMPORTANDO REDIS PARA CACHEAR DADOS DINÂMINCOS.
        var redisClient = app.servicos.redisClient();

        //BUSCANDO NO REDIS (CACHE) ALGUM DADO QUE JÁ FOI USADO ANTERIORMENTE.
        redisClient.hgetall('pagamento' + id, function(error, obj){
            if(error || !obj){
                console.log('MISS - chave nao encontrada');

                // ** CASO NÃO ENCONTROU NO CACHE OS DADOS PROCURADOS, CONSULTA NO BANCO DE DADOS.

                //CONECTANDO A FABRICA DE CONEXAO COM BANCO DE DADOS.
                var connection = app.models.connectionFactory();
        
                //CARREGANDO MODEL DE PAGAMENTO.
                var pagamentoDao = new app.models.PagamentoDAO(connection);

                pagamentoDao.buscaPorId(id, function(error, resultado){
                    if(error){
                        console.log('Erro encontrado: ' + JSON.stringify(error));
                        res.status(500).json(error);
                        return;
                    }else{
                        console.log('pagamento encontrado: ' + JSON.stringify(resultado));
                        res.status(200).json(resultado);
                    }
                });
                // FECHANDO A CONEXAO.
                connection.end();
            }else{
                console.log('HIT - valor: ' + JSON.stringify(obj));
                res.status(200).json(obj);
            }
        });
    });

    // ROTA PARA CANCELAR UM PAGAMENTO USANDO O VERBO DELETE
    app.delete('/pagamentos/pagamento/:id', function(req, res){
        var pagamento = {};

        //CAPTURANDO ID QUE VEIO NA URL DA REQUISIÇÃO.
        var id = req.params.id;
 
        // COMPLEMENTANDO JSON CAPTURADO COM DADOS.
        pagamento.id = id;
        pagamento.status = 'CANCELADO';
 
        //CONECTANDO A FABRICA DE CONEXAO COM BANCO DE DADOS.
        var connection = app.models.connectionFactory();
 
        //CARREGANDO MODEL DE PAGAMENTO.
        var pagamentoDao = new app.models.PagamentoDAO(connection);
 
        //INVOCANDO METODO DA MODEL PARA ATUALIZAR DADOS REFERENTE A PAGAMENTO.
        pagamentoDao.atualiza(pagamento, function(erro, resultado){
            if(erro){
                res.status(500).send(erro);
                return;
            }else{
                res.status(204);
            }
        });
        // FECHANDO A CONEXAO.
        connection.end();
     });

    app.put('/pagamentos/pagamento/:id', function(req, res){
       var pagamento = {};

       //CAPTURANDO ID QUE VEIO NA URL DA REQUISIÇÃO.
       var id = req.params.id;

       // COMPLEMENTANDO JSON CAPTURADO COM DADOS.
       pagamento.id = id;
       pagamento.status = 'CONFIRMADO';

       //CONECTANDO A FABRICA DE CONEXAO COM BANCO DE DADOS.
       var connection = app.models.connectionFactory();

       //CARREGANDO MODEL DE PAGAMENTO.
       var pagamentoDao = new app.models.PagamentoDAO(connection);

       //INVOCANDO METODO DA MODEL PARA ATUALIZAR DADOS REFERENTE A PAGAMENTO.
       pagamentoDao.atualiza(pagamento, function(erro, resultado){
           if(erro){
               res.status(500).send(erro);
               return;
           }else{
               res.send(pagamento);
           }
       });
       // FECHANDO A CONEXAO.
       connection.end();
    });

    app.post('/pagamentos/pagamento',function(req, res){

        //VALIDACAO DE ERROS.
        req.assert("pagamento.forma_de_pagamento", "Forma de pagamento e obrigatoria").notEmpty();
        req.assert("pagamento.valor", "Valor nao pode ser vazio").notEmpty().isFloat();
        req.assert("pagamento.moeda", "Moeda é obrigatória e deve ter 3 caracteres").notEmpty().len(3,3);
        var erroValidation = req.validationErrors();
        if(erroValidation){
            console.log('Erros de validacao encontrados');
            res.status(400).send(erroValidation);
            return;
        }

        //CONECTANDO A FAVRICA DE CONEXAO COM BANCO DE DADOS.
        var connection = app.models.connectionFactory();

        //CARREGANDO MODEL DE PAGAMENTO.
        var pagamentoDao = new app.models.PagamentoDAO(connection);

        //CAPTURANDO DADOS ENVIADO NA REQUISICAO - especificamente o nó pagamento.
        var pagamento = req.body["pagamento"];
        console.log('processando requisicao de um novo pagamento');

        // COMPLEMENTANDO JSON CAPTURADO COM DADOS
        pagamento.status = 'CRIADO';
        pagamento.data = new Date;

        //INVOCANDO METODO DA MODEL PARA SALVAR PAGAMENTO.
        pagamentoDao.salva(pagamento, function(erro, resultado){
            if(erro){
                res.status(500).send(erro);
            }else{
                pagamento.id = resultado.insertId;
                console.log('pagamento criado');

                //IMPORTANDO REDIS PARA CACHEAR DADOS DINÂMINCOS.
                var redisClient = app.servicos.redisClient();

                //GRAVANDO NO REDIS(CACHE) DADOS DEPAGAMENTO GRAVADO EM BANCO.
                redisClient.hmset('pagamento' + pagamento.id, pagamento, function(error, reply){
                    if(error){
                        console.log('Deu um pipoco no seu Redis, lascou-se');
                    }else{
                        console.log('nova chave adicionada ao cache: pagamento-' + pagamento.id);
                    }
                });

                if(pagamento.forma_de_pagamento == 'cartao'){
                    var cartao = req.body["cartao"];
                    console.log(cartao);

                    var clienteCartoes = new app.servicos.CartoesClient();
                    clienteCartoes.autoriza(cartao, function(exception, request, response, retorno){
                        if(exception){
                            console.log(exception);
                            res.status(400).json(exception);
                            return;
                        }
                        
                        console.log(retorno);

                        res.location('/pagamentos/pagamento/' + pagamento.id);

                        //CRIANDO DADOS DE RETORNO PARA O CLIENTE COM DADOS RECEBIDOS DE PAGAMENTO E
                        // INFORMAÇÕES ADICIONAIS DE PROXIMAS ETAPAS REFERENTE AO PAGAMENTO.
                        //UTILIZANDO A CONVERSÃO: HATEOAS.
                        var response = {
                            dados_do_pagamento: pagamento,
                            cartao: retorno,
                            links: [
                                {
                                    href:"http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                    rel:"confirmar",
                                    method:"PUT"
                                },
                                {
                                    href:"http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                    rel:"cancelar",
                                    method:"DELETE"
                                }
                            ]
                        }
                        // RETORNANDO PARA O CLIENTE DADOS STATUS DO PROCESSO
                        res.status(201).json(response);
                        return;
                    });
                }else{
                    res.location('/pagamentos/pagamento/' + pagamento.id);

                    //CRIANDO DADOS DE RETORNO PARA O CLIENTE COM DADOS RECEBIDOS DE PAGAMENTO E
                    // INFORMAÇÕES ADICIONAIS DE PROXIMAS ETAPAS REFERENTE AO PAGAMENTO.
                    //UTILIZANDO A CONVERSÃO: HATEOAS.
                    var response = {
                        dados_do_pagamento: pagamento,
                        links: [
                            {
                                href:"http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                rel:"confirmar",
                                method:"PUT"
                            },
                            {
                                href:"http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                rel:"cancelar",
                                method:"DELETE"
                            }
                        ]
                    }
                    // RETORNANDO PARA O CLIENTE DADOS STATUS DO PROCESSO
                    res.status(201).json(response);
                }
            }
        });

        // FECHANDO A CONEXAO.
        connection.end();
    });

}
