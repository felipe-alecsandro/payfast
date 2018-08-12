var fs = require('fs');
var arquivo = process.argv[2];

fs.readFile('imagem.jpg', function(error, buffer){
    console.log('arquivo lido');
    fs.writeFile('imagemClone.jpg', buffer, function(err){
        if(err){
            console.log(err);
            return;
        }
        console.log('arquivo escrito');
    });
});


// //opcção pegando arquivo pelo console (node fileReader.js <nome do arquivo>)
// fs.readFile(arquivo, function(error, buffer){
//     console.log('arquivo lido');
//     fs.writeFile('imagem'+arquivo+'.jpg', buffer, function(err){
//         if(err){
//             console.log(err);
//             return;
//         }
//         console.log('arquivo escrito');
//     });
// });