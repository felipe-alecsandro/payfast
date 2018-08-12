// var memcached = require('memcached');

// var cliente = memcached('localhost:11211',{
//     retries: 10,
//     retry: 10000,
//     remove: true,
//     maxKeySize:250
// });

// cliente.get('pagamento-20', function(erro, retorno){
//     if(erro || !retorno){
//         console.log('MISS - chave não encontrada');
//     }else{
//         console.log('HIT - valor: ' + retorno);
//     }
// });
