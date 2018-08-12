var fs = require('fs');
var arquivo = process.argv[2];


fs.createReadStream('imagem.jpg')
    .pipe(fs.createWriteStream('imagem-com-stream.jpg'))
    .on('finish', function(){
        console.log('arquivo escrito com stream');
    });

    
// //opcção pegando arquivo pelo console (node fileReader.js <nome do arquivo>)
// fs.createReadStream(arquivo)
//    .pipe(fs.createWriteStream('novo-' + arquivo))
//    .on('finish', function(){
//         console.log('arquivo escrito.');
// });